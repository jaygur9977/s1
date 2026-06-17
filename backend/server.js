const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const os = require('os');

const { connectMinIO, generateRandomStoragePath, uploadFile, downloadFile, deleteByPrefix, BUCKET } = require('./config/minioClient');
const User = require('./models/User');
const DeletionRequest = require('./models/DeletionRequest');
const ChestItem = require('./models/ChestItem');
const ChromeDetector = require('./services/chromeDetector');
const ProfileStorageService = require('./services/profileStorage');
const ProfileRestoreService = require('./services/profileRestore');
const DeletionProcessor = require('./services/deletionProcessor');
const encryptionUtil = require('./utils/encryption');
const compressionUtil = require('./utils/compression');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
    CHUNK_SIZE: 50 * 1024 * 1024,
    PROFILE_CACHE_DURATION: 60 * 60 * 1000,
    DELETION_CHECK_INTERVAL: 60 * 60 * 1000,
    DELETION_GRACE_PERIOD: 24 * 60 * 60 * 1000,
    BROWSER_LAUNCH_TIMEOUT: 30000
};

// ============================================================
// MONGODB
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jay-food-app:997763@cluster0.lvfyc.mongodb.net/cloude?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

// ============================================================
// HELPERS
// ============================================================
async function findUserByKey(uniqueKey) {
    const users = await User.find({ isActive: true });
    for (const user of users) {
        try {
            if (encryptionUtil.decryptText(user.uniqueKey) === uniqueKey) return user;
        } catch (e) { continue; }
    }
    return null;
}

// ============================================================
// SERVICES
// ============================================================
const chromeDetector = new ChromeDetector();
const profileStorageService = new ProfileStorageService();
const profileRestoreService = new ProfileRestoreService();
const deletionProcessor = new DeletionProcessor({
    checkInterval: CONFIG.DELETION_CHECK_INTERVAL,
    gracePeriod: CONFIG.DELETION_GRACE_PERIOD
});

// ============================================================
// PROFILE MANAGER - FIXED VERSION
// ============================================================
class ProfileManager {
    constructor() {
        this.activeBrowsers = new Map();
        this.uploadQueue = new Set();
        this.setupDirs();
        deletionProcessor.start();
    }

    setupDirs() {
        ['browser-profiles', 'temp', 'uploads'].forEach(d => {
            const p = path.join(__dirname, d);
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        });
    }

    generateUniqueKey() {
        return encryptionUtil.generateUniqueKey();
    }

    async detectChromeForUser(userId) {
        try {
            const detection = chromeDetector.detectAll();
            await User.findByIdAndUpdate(userId, {
                chromeData: {
                    executablePath: detection.chrome.path,
                    chromeProfiles: detection.profiles.slice(0, 5),
                    detectionTimestamp: new Date(),
                    platform: detection.platform
                }
            });
            console.log(`✅ Chrome data saved for user ${userId}`);
        } catch (error) {
            console.error(`❌ Chrome detection failed:`, error);
        }
    }

    /**
     * Get or create profile directory - REUSE EXISTING, DON'T CREATE NEW
     */
    async getProfilePath(userId) {
        const user = await User.findById(userId);
        const profilePath = path.join(__dirname, 'browser-profiles', `user_${userId}`);

        // If directory exists and has content, REUSE IT
        if (fs.existsSync(profilePath)) {
            const files = fs.readdirSync(profilePath);
            if (files.length > 0) {
                console.log(`📁 Reusing existing profile: ${profilePath} (${files.length} files)`);
                return profilePath;
            }
            // Empty directory - remove and recreate
            fs.rmSync(profilePath, { recursive: true, force: true });
        }

        // Check MinIO for backup
        if (user?.profileStorage?.storagePath && user.profileStorage.chunkCount > 0) {
            console.log(`📥 Restoring from MinIO...`);
            try {
                const result = await profileRestoreService.restoreProfile(
                    userId,
                    user.profileStorage,
                    path.join(__dirname, 'browser-profiles')
                );
                console.log(`✅ Restored: ${result.profilePath} (${result.fileCount} files)`);
                return result.profilePath;
            } catch (error) {
                console.error(`❌ Restore failed: ${error.message}`);
            }
        }

        // Create fresh
        fs.mkdirSync(profilePath, { recursive: true });
        console.log(`📁 Created fresh profile: ${profilePath}`);
        return profilePath;
    }

    /**
     * Upload to MinIO with old data cleanup
     */
    async uploadProfileOnBrowserClose(userId) {
        // Prevent duplicate uploads
        if (this.uploadQueue.has(userId)) {
            console.log(`   ⚠️ Upload already queued for user ${userId}`);
            return;
        }

        this.uploadQueue.add(userId);

        try {
            const user = await User.findById(userId);
            if (!user) return;

            const profilePath = path.join(__dirname, 'browser-profiles', `user_${userId}`);
            if (!fs.existsSync(profilePath)) return;

            const files = fs.readdirSync(profilePath);
            if (files.length === 0) return;

            const totalSize = this.getDirectorySize(profilePath);
            console.log(`\n📤 Uploading profile for user ${userId}...`);
            console.log(`   📊 Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB, ${files.length} files`);

            // Store old MinIO path for cleanup
            const oldStoragePath = user.profileStorage?.storagePath;

            // Upload new profile
            const result = await profileStorageService.uploadProfile(userId, profilePath);

            // Update user with NEW storage info
            await User.findByIdAndUpdate(userId, {
                profileStorage: {
                    profileId: result.profileId,
                    storagePath: result.storagePath,
                    chunkCount: result.chunkCount,
                    totalSize: result.totalSize,
                    compressedAt: new Date(),
                    checksum: result.checksum,
                    version: 'v1',
                    encryptionIV: result.chunks[0]?.iv || '',
                    authTag: result.chunks[0]?.authTag || ''
                },
                localProfileCache: { path: null, cachedAt: null, isValid: false },
                browserProfilePath: null
            });

            // DELETE local profile AFTER successful upload
            if (fs.existsSync(profilePath)) {
                fs.rmSync(profilePath, { recursive: true, force: true });
                console.log(`   🗑️ Local deleted`);
            }

            // DELETE old MinIO chunks
            if (oldStoragePath && oldStoragePath !== result.storagePath) {
                console.log(`   🗑️ Cleaning old MinIO data: ${oldStoragePath}`);
                try {
                    await deleteByPrefix(oldStoragePath);
                    console.log(`   ✅ Old MinIO data deleted`);
                } catch (e) {
                    console.error(`   ⚠️ Old cleanup failed: ${e.message}`);
                }
            }

            console.log(`✅ Upload complete for user ${userId}`);

        } catch (error) {
            console.error(`❌ Upload failed for user ${userId}: ${error.message}`);
        } finally {
            this.uploadQueue.delete(userId);
        }
    }

    /**
     * Launch browser - REUSE PROFILE, DON'T CREATE NEW
     */
    async launchBrowserForUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // Get existing profile or restore/create
            let profilePath = await this.getProfilePath(userId);

            // Update user record
            await User.findByIdAndUpdate(userId, {
                browserProfilePath: profilePath,
                localProfileCache: { path: profilePath, cachedAt: new Date(), isValid: true }
            });

            // Check if already running
            if (this.activeBrowsers.has(userId)) {
                console.log(`⚠️ Browser already running for user ${userId}`);
                return { success: true, message: 'Already running', profilePath };
            }

            const exePath = user.chromeData?.executablePath || chromeDetector.detectChromeExecutable().path;
            if (!exePath) throw new Error('Chrome not found');

            console.log(`🚀 Launching browser for user ${userId}...`);
            console.log(`   Profile: ${profilePath}`);

            const context = await chromium.launchPersistentContext(profilePath, {
                headless: false,
                executablePath: exePath,
                viewport: null,
                args: [
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-background-networking',
                    '--disable-sync',
                    '--no-pings'
                ]
            });

            const page = context.pages()[0] || await context.newPage();
            this.activeBrowsers.set(userId, { context, page, profilePath, launchedAt: new Date() });

            // On close → Upload (with debounce)
            context.on('close', async () => {
                console.log(`\n🔒 Browser closed for user ${userId}`);
                this.activeBrowsers.delete(userId);
                
                // Small delay to ensure all files are written
                setTimeout(() => {
                    this.uploadProfileOnBrowserClose(userId).catch(err =>
                        console.error(`Upload error: ${err.message}`)
                    );
                }, 2000);
            });

            await page.goto('https://google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log(`✅ Browser launched for user ${userId}`);

            return { success: true, message: 'Browser launched', profilePath };

        } catch (error) {
            console.error(`❌ Launch failed: ${error.message}`);
            throw error;
        }
    }

    async closeBrowser(userId) {
        const browser = this.activeBrowsers.get(userId);
        if (browser) {
            console.log(`🔒 Closing browser for user ${userId}...`);
            try { await browser.context.close(); } catch (e) {}
        }
    }

    async closeAllBrowsers() {
        const ids = Array.from(this.activeBrowsers.keys());
        for (const id of ids) await this.closeBrowser(id);
    }

    getDirectorySize(dirPath) {
        let size = 0;
        try {
            if (!fs.existsSync(dirPath)) return 0;
            const items = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const item of items) {
                const fp = path.join(dirPath, item.name);
                try {
                    if (item.isDirectory()) size += this.getDirectorySize(fp);
                    else size += fs.statSync(fp).size;
                } catch (e) {}
            }
        } catch (e) {}
        return size;
    }

    getActiveCount() { return this.activeBrowsers.size; }
}

const profileManager = new ProfileManager();

// ============================================================
// API ROUTES
// ============================================================

app.get('/api/health', (req, res) => {
    res.json({ success: true, timestamp: new Date().toISOString(), activeBrowsers: profileManager.getActiveCount() });
});

app.post('/api/generate-key', async (req, res) => {
    try {
        let key, attempts = 0;
        do {
            key = profileManager.generateUniqueKey();
            if (!(await findUserByKey(key))) break;
            attempts++;
        } while (attempts < 20);
        if (attempts >= 20) return res.status(500).json({ success: false, message: 'Failed' });
        res.json({ success: true, uniqueKey: key });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { fullName, phoneNo, uniqueKey, password, pin } = req.body;
        if (!fullName || !phoneNo || !uniqueKey || !password || !pin) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }
        if (!/^\d{10}$/.test(phoneNo)) return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
        if (!/^\d{4}$/.test(pin)) return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
        if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,}$/.test(password)) {
            return res.status(400).json({ success: false, message: 'Invalid password format' });
        }
        if (await findUserByKey(uniqueKey)) return res.status(400).json({ success: false, message: 'Key already registered' });

        const user = new User({ fullName: fullName.trim(), phoneNo, uniqueKey, password, pin });
        await user.save();

        const userId = user._id.toString();
        const profilePath = path.join(__dirname, 'browser-profiles', `user_${userId}`);
        fs.mkdirSync(profilePath, { recursive: true });

        user.browserProfilePath = profilePath;
        user.localProfileCache = { path: profilePath, cachedAt: new Date(), isValid: true };
        await user.save();

        console.log(`📁 Created: ${profilePath}`);
        profileManager.detectChromeForUser(userId);

        res.json({ success: true, message: 'Registration successful!', userId: user._id, uniqueKey });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { uniqueKey, password, pin } = req.body;
        if (!uniqueKey || !password || !pin) return res.status(400).json({ success: false, message: 'All fields required' });

        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        if (user.deleteRequested) return res.status(403).json({ success: false, message: 'Account pending deletion' });

        if (password !== encryptionUtil.decryptText(user.password)) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        if (pin !== encryptionUtil.decryptText(user.pin)) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        // Restore profile from MinIO if needed
        console.log(`\n🔄 Checking profile for user ${user._id}...`);
        const profilePath = await profileManager.getProfilePath(user._id.toString());
        
        await User.findByIdAndUpdate(user._id, {
            browserProfilePath: profilePath,
            localProfileCache: { path: profilePath, cachedAt: new Date(), isValid: true }
        });

        const chestItems = await ChestItem.find({ userId: user._id }).select('-data');

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNo: encryptionUtil.decryptText(user.phoneNo),
                uniqueKey,
                createdAt: user.createdAt,
                browserProfilePath: profilePath,
                chromeData: user.chromeData,
                profilePhoto: user.profilePhoto || null,
                profileStorage: user.profileStorage,
                chestItemCount: chestItems.length,
                chestItems: chestItems.map(item => ({
                    id: item._id, name: item.name, type: item.type,
                    size: item.size, mimeType: item.mimeType, createdAt: item.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

app.post('/api/launch-browser', async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const result = await profileManager.launchBrowserForUser(user._id.toString());
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/close-browser', async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (user) await profileManager.closeBrowser(user._id.toString());
        res.json({ success: true, message: 'Browser closed' });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/upload-photo', async (req, res) => {
    try {
        const { uniqueKey, photo } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.profilePhoto = encryptionUtil.encryptText(photo);
        await user.save();
        res.json({ success: true, message: 'Photo uploaded' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// Chest routes
app.post('/api/chest/add', async (req, res) => {
    try {
        const { uniqueKey, name, type, data, mimeType } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const compressed = await compressionUtil.compressJSON({ content: data, timestamp: new Date().toISOString() });
        const encrypted = encryptionUtil.encryptText(compressed);
        const item = new ChestItem({ userId: user._id, name, type: type || 'text', data: encrypted, mimeType: mimeType || 'text/plain', size: data.length });
        await item.save();
        res.json({ success: true, message: 'Item saved!', itemId: item._id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed' });
    }
});

app.get('/api/chest/list/:uniqueKey', async (req, res) => {
    try {
        const user = await findUserByKey(req.params.uniqueKey);
        if (!user) return res.status(404).json({ success: false });
        const items = await ChestItem.find({ userId: user._id }).select('-data').sort({ createdAt: -1 });
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get('/api/chest/item/:itemId', async (req, res) => {
    try {
        const item = await ChestItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ success: false });
        const decrypted = encryptionUtil.decryptText(item.data);
        const decompressed = await compressionUtil.decompressJSON(decrypted);
        res.json({ success: true, item: { id: item._id, name: item.name, type: item.type, data: decompressed.content, mimeType: item.mimeType, size: item.size, createdAt: item.createdAt } });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.delete('/api/chest/item/:itemId', async (req, res) => {
    try {
        await ChestItem.findByIdAndDelete(req.params.itemId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Deletion routes
app.post('/api/delete/verify', async (req, res) => {
    try {
        const { uniqueKey, password, pin } = req.body;
        if (!uniqueKey || !password || !pin) return res.status(400).json({ success: false, message: 'All fields required' });
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(401).json({ success: false, message: 'Account not found' });
        if (user.deleteRequested) return res.status(400).json({ success: false, message: 'Already requested' });
        if (password !== encryptionUtil.decryptText(user.password)) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        if (pin !== encryptionUtil.decryptText(user.pin)) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const otp = '12345';
        user.deleteOTP = otp;
        user.otpGeneratedAt = new Date();
        await user.save();
        res.json({ success: true, message: 'OTP sent!', otp });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/delete/confirm', async (req, res) => {
    try {
        const { uniqueKey, otp } = req.body;
        if (!uniqueKey || !otp) return res.status(400).json({ success: false, message: 'All fields required' });
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false });
        if (!user.deleteOTP || otp.toString().trim() !== user.deleteOTP.toString().trim()) {
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }
        const req2 = new DeletionRequest({ userId: user._id, uniqueKey, status: 'pending' });
        await req2.save();
        user.deleteRequested = true;
        user.deleteRequestDate = new Date();
        user.deleteOTP = null;
        user.otpGeneratedAt = null;
        await user.save();
        await profileManager.closeBrowser(user._id.toString());
        res.json({ success: true, message: 'Deletion requested', requestId: req2._id });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.get('/api/user/:uniqueKey', async (req, res) => {
    try {
        const user = await findUserByKey(req.params.uniqueKey);
        if (!user) return res.status(404).json({ success: false });
        res.json({ success: true, user: { id: user._id, fullName: user.fullName, phoneNo: encryptionUtil.decryptText(user.phoneNo), uniqueKey: req.params.uniqueKey, createdAt: user.createdAt, browserProfilePath: user.localProfileCache?.path || user.browserProfilePath, chromeData: user.chromeData, profilePhoto: user.profilePhoto, profileStorage: user.profileStorage } });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ============================================================
// STARTUP
// ============================================================
const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectMinIO();
    const server = app.listen(PORT, () => {
        console.log(`\n🌟 Cloude Server on http://localhost:${PORT}\n`);
    });
    const shutdown = async () => {
        console.log('\n🛑 Shutting down...');
        await profileManager.closeAllBrowsers();
        deletionProcessor.stop();
        await mongoose.connection.close();
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 15000);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

startServer().catch(console.error);