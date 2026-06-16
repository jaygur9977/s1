const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const os = require('os');

// MinIO imports
const { 
    connectMinIO, 
    generateRandomStoragePath, 
    uploadFile, 
    downloadFile, 
    deleteByPrefix,
    BUCKET 
} = require('./config/minioClient');

// Models
const User = require('./models/User');
const DeletionRequest = require('./models/DeletionRequest');
const ChestItem = require('./models/ChestItem');

// Services
const ChromeDetector = require('./services/chromeDetector');
const ProfileStorageService = require('./services/profileStorage');
const ProfileRestoreService = require('./services/profileRestore');
const DeletionProcessor = require('./services/deletionProcessor');

// Utils
const encryptionUtil = require('./utils/encryption');
const compressionUtil = require('./utils/compression');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
    CHUNK_SIZE: parseInt(process.env.PROFILE_CHUNK_SIZE) || 50 * 1024 * 1024,
    PROFILE_CACHE_DURATION: parseInt(process.env.PROFILE_CACHE_DURATION) || 60 * 60 * 1000,
    DELETION_CHECK_INTERVAL: parseInt(process.env.DELETION_CHECK_INTERVAL) || 60 * 60 * 1000,
    DELETION_GRACE_PERIOD: parseInt(process.env.DELETION_GRACE_PERIOD) || 24 * 60 * 60 * 1000,
    MAX_PARALLEL_DOWNLOADS: parseInt(process.env.MAX_PARALLEL_DOWNLOADS) || 3,
    BROWSER_LAUNCH_TIMEOUT: parseInt(process.env.BROWSER_LAUNCH_TIMEOUT) || 30000
};

// ============================================================
// MONGODB CONNECTION
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jay-food-app:997763@cluster0.lvfyc.mongodb.net/cloude?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => { 
        console.error('❌ MongoDB Error:', err.message); 
        process.exit(1); 
    });

// ============================================================
// HELPER: Find user by unique key
// ============================================================
async function findUserByKey(uniqueKey) {
    const users = await User.find({ isActive: true });
    for (const user of users) {
        try {
            const decrypted = encryptionUtil.decryptText(user.uniqueKey);
            if (decrypted === uniqueKey) return user;
        } catch (e) { continue; }
    }
    return null;
}

// ============================================================
// INITIALIZE SERVICES
// ============================================================
const chromeDetector = new ChromeDetector();
const profileStorageService = new ProfileStorageService();
const profileRestoreService = new ProfileRestoreService();
const deletionProcessor = new DeletionProcessor({
    checkInterval: CONFIG.DELETION_CHECK_INTERVAL,
    gracePeriod: CONFIG.DELETION_GRACE_PERIOD
});
// ============================================================
// PROFILE MANAGER CLASS (OPTIMIZED)
// ============================================================
class ProfileManager {
    constructor() {
        this.activeBrowsers = new Map();
        this.uploadQueue = new Map(); // Track ongoing uploads
        this.setupDirs();
        deletionProcessor.start();
    }

    setupDirs() {
        const dirs = ['browser-profiles', 'temp', 'uploads'];
        dirs.forEach(d => {
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

    async createProfileDirectory(userId) {
        const profilePath = path.join(__dirname, 'browser-profiles', `user_${userId}`);
        if (fs.existsSync(profilePath)) fs.rmSync(profilePath, { recursive: true, force: true });
        fs.mkdirSync(profilePath, { recursive: true });
        console.log(`📁 Created profile: ${profilePath}`);
        return profilePath;
    }

    async restoreProfileIfNeeded(userId) {
        const user = await User.findById(userId);
        if (!user) return null;

        if (user.localProfileCache?.isValid && user.localProfileCache?.path) {
            if (fs.existsSync(user.localProfileCache.path)) {
                const cacheAge = Date.now() - new Date(user.localProfileCache.cachedAt).getTime();
                if (cacheAge < CONFIG.PROFILE_CACHE_DURATION) {
                    console.log(`📦 Using cached profile for user ${userId}`);
                    return user.localProfileCache.path;
                }
            }
        }

        if (user.profileStorage?.storagePath && user.profileStorage?.chunkCount > 0) {
            console.log(`📥 Restoring profile from MinIO for user ${userId}...`);
            try {
                const outputBaseDir = path.join(__dirname, 'browser-profiles');
                const result = await profileRestoreService.restoreProfile(userId, user.profileStorage, outputBaseDir);
                await User.findByIdAndUpdate(userId, {
                    localProfileCache: { path: result.profilePath, cachedAt: new Date(), isValid: true },
                    browserProfilePath: result.profilePath
                });
                console.log(`✅ Profile restored at: ${result.profilePath}`);
                return result.profilePath;
            } catch (error) {
                console.error(`❌ Profile restore failed:`, error.message);
            }
        }

        console.log(`📁 Creating fresh profile for user ${userId}`);
        const newPath = await this.createProfileDirectory(userId);
        await User.findByIdAndUpdate(userId, {
            browserProfilePath: newPath,
            localProfileCache: { path: newPath, cachedAt: new Date(), isValid: true }
        });
        return newPath;
    }

    /**
     * Upload profile to MinIO - WITH TIMEOUT SAFETY
     */
    async uploadProfileOnBrowserClose(userId) {
        // Prevent duplicate uploads
        if (this.uploadQueue.has(userId)) {
            console.log(`   ⚠️ Upload already in progress for user ${userId}`);
            return;
        }

        this.uploadQueue.set(userId, true);

        try {
            console.log(`\n📤 Uploading profile for user ${userId}...`);
            
            const user = await User.findById(userId);
            if (!user) { console.log(`   ⚠️ User not found`); return; }

            const profilePath = user.localProfileCache?.path || user.browserProfilePath;
            if (!profilePath || !fs.existsSync(profilePath)) {
                console.log(`   ⚠️ Profile directory not found`);
                return;
            }

            const files = fs.readdirSync(profilePath);
            if (files.length === 0) { console.log(`   ⚠️ Empty directory`); return; }

            const totalSize = this.getDirectorySize(profilePath);
            console.log(`   📊 Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

            if (totalSize === 0) { console.log(`   ⚠️ No data`); return; }

            // Upload with 2-minute timeout
            const uploadPromise = profileStorageService.uploadProfile(userId, profilePath);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Upload timeout after 120s')), 120000)
            );

            const result = await Promise.race([uploadPromise, timeoutPromise]);

            // Save metadata
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
                }
            });

            // Delete local
            if (fs.existsSync(profilePath)) {
                fs.rmSync(profilePath, { recursive: true, force: true });
                console.log(`   🗑️ Local deleted`);
            }

            await User.findByIdAndUpdate(userId, {
                localProfileCache: { path: null, cachedAt: null, isValid: false }
            });

            console.log(`✅ Upload complete for user ${userId}`);

        } catch (error) {
            console.error(`❌ Upload failed for user ${userId}: ${error.message}`);
        } finally {
            this.uploadQueue.delete(userId);
        }
    }

    async launchBrowserForUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            let profilePath = await this.restoreProfileIfNeeded(userId);
            if (!profilePath || !fs.existsSync(profilePath)) {
                profilePath = await this.createProfileDirectory(userId);
            }

            await User.findByIdAndUpdate(userId, {
                browserProfilePath: profilePath,
                localProfileCache: { path: profilePath, cachedAt: new Date(), isValid: true }
            });

            if (this.activeBrowsers.has(userId)) {
                console.log(`⚠️ Browser already running for user ${userId}`);
                return { success: true, message: 'Browser already running', profilePath };
            }

            const exePath = user.chromeData?.executablePath || chromeDetector.detectChromeExecutable().path;
            if (!exePath) throw new Error('Chrome not found');

            console.log(`🚀 Launching browser for user ${userId}...`);

            const context = await chromium.launchPersistentContext(profilePath, {
                headless: false,
                executablePath: exePath,
                viewport: null,
                args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--no-first-run']
            });

            const page = context.pages()[0] || await context.newPage();
            
            this.activeBrowsers.set(userId, { context, page, profilePath, launchedAt: new Date() });

            // On browser close → Upload to MinIO (async, non-blocking)
            context.on('close', () => {
                console.log(`\n🔒 Browser closed for user ${userId}`);
                this.activeBrowsers.delete(userId);
                // Fire and forget - don't await
                this.uploadProfileOnBrowserClose(userId).catch(err => 
                    console.error(`Upload error: ${err.message}`)
                );
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
        console.log(`\n🔒 Closing ${this.activeBrowsers.size} browser(s)...`);
        const ids = Array.from(this.activeBrowsers.keys());
        for (const id of ids) await this.closeBrowser(id);
    }

    getDirectorySize(dirPath) {
        let size = 0;
        try {
            if (!fs.existsSync(dirPath)) return 0;
            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const file of files) {
                const fp = path.join(dirPath, file.name);
                try {
                    if (file.isDirectory()) size += this.getDirectorySize(fp);
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

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        timestamp: new Date().toISOString(),
        activeBrowsers: profileManager.getActiveCount()
    });
});

// Generate Unique Key
app.post('/api/generate-key', async (req, res) => {
    try {
        let key, attempts = 0;
        do {
            key = profileManager.generateUniqueKey();
            const exists = await findUserByKey(key);
            if (!exists) break;
            attempts++;
        } while (attempts < 20);

        if (attempts >= 20) return res.status(500).json({ success: false, message: 'Failed to generate key' });
        res.json({ success: true, uniqueKey: key });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
// REGISTER - FIXED: Single profile directory using MongoDB _id
// ============================================================
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, phoneNo, uniqueKey, password, pin } = req.body;

        if (!fullName || !phoneNo || !uniqueKey || !password || !pin) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }
        if (!/^\d{10}$/.test(phoneNo)) return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
        if (!/^\d{4}$/.test(pin)) return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
        if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,}$/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password: 8+ chars, upper, lower, number, special' });
        }

        const existing = await findUserByKey(uniqueKey);
        if (existing) return res.status(400).json({ success: false, message: 'Key already registered' });

        // Create user FIRST to get MongoDB _id
        const user = new User({
            fullName: fullName.trim(),
            phoneNo,
            uniqueKey,
            password,
            pin
        });

        await user.save();

        // NOW create profile directory using MongoDB _id
        const userId = user._id.toString();
        const profilePath = path.join(__dirname, 'browser-profiles', `user_${userId}`);
        
        if (fs.existsSync(profilePath)) {
            fs.rmSync(profilePath, { recursive: true, force: true });
        }
        fs.mkdirSync(profilePath, { recursive: true });

        // Update user with profile path
        user.browserProfilePath = profilePath;
        user.localProfileCache = {
            path: profilePath,
            cachedAt: new Date(),
            isValid: true
        };
        await user.save();

        console.log(`📁 Created profile directory: ${profilePath}`);

        // Start Chrome detection in background
        profileManager.detectChromeForUser(userId);

        res.json({ 
            success: true, 
            message: 'Registration successful!', 
            userId: user._id, 
            uniqueKey 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// ============================================================
// LOGIN - Restore profile from MinIO immediately
// ============================================================
app.post('/api/login', async (req, res) => {
    try {
        const { uniqueKey, password, pin } = req.body;
        if (!uniqueKey || !password || !pin) return res.status(400).json({ success: false, message: 'All fields required' });

        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        if (user.deleteRequested) return res.status(403).json({ success: false, message: 'Account pending deletion' });

        // Verify password
        const decryptedPassword = encryptionUtil.decryptText(user.password);
        if (password !== decryptedPassword) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        // Verify PIN
        const decryptedPin = encryptionUtil.decryptText(user.pin);
        if (pin !== decryptedPin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        // Restore profile from MinIO immediately on login
        console.log(`\n🔄 Restoring profile for user ${user._id} on login...`);
        const restoredPath = await profileManager.restoreProfileIfNeeded(user._id.toString());
        
        if (restoredPath) {
            console.log(`✅ Profile ready at: ${restoredPath}`);
        }

        // Get chest items
        const chestItems = await ChestItem.find({ userId: user._id }).select('-data');

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNo: encryptionUtil.decryptText(user.phoneNo),
                uniqueKey: uniqueKey,
                createdAt: user.createdAt,
                browserProfilePath: restoredPath || user.browserProfilePath,
                chromeData: user.chromeData,
                profilePhoto: user.profilePhoto || null,
                profileStorage: user.profileStorage,
                chestItemCount: chestItems.length,
                chestItems: chestItems.map(item => ({
                    id: item._id,
                    name: item.name,
                    type: item.type,
                    size: item.size,
                    mimeType: item.mimeType,
                    createdAt: item.createdAt
                }))
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Launch Browser
app.post('/api/launch-browser', async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const result = await profileManager.launchBrowserForUser(user._id.toString());
        res.json(result);
    } catch (error) {
        console.error('Launch browser error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Close Browser
app.post('/api/close-browser', async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        const user = await findUserByKey(uniqueKey);
        
        if (user) {
            await profileManager.closeBrowser(user._id.toString());
            res.json({ 
                success: true, 
                message: 'Browser closed. Profile saved to cloud.' 
            });
        } else {
            res.json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload Profile Photo
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

// ============================================================
// CHEST ROUTES
// ============================================================

app.post('/api/chest/add', async (req, res) => {
    try {
        const { uniqueKey, name, type, data, mimeType } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const compressedData = await compressionUtil.compressJSON({ content: data, timestamp: new Date().toISOString() });
        const encryptedData = encryptionUtil.encryptText(compressedData);

        const item = new ChestItem({
            userId: user._id,
            name,
            type: type || 'text',
            data: encryptedData,
            mimeType: mimeType || 'text/plain',
            size: data.length
        });

        await item.save();
        res.json({ success: true, message: 'Item saved!', itemId: item._id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save' });
    }
});

app.get('/api/chest/list/:uniqueKey', async (req, res) => {
    try {
        const user = await findUserByKey(req.params.uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const items = await ChestItem.find({ userId: user._id }).select('-data').sort({ createdAt: -1 });
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch' });
    }
});

app.get('/api/chest/item/:itemId', async (req, res) => {
    try {
        const item = await ChestItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        const decryptedData = encryptionUtil.decryptText(item.data);
        const decompressedData = await compressionUtil.decompressJSON(decryptedData);

        res.json({
            success: true,
            item: {
                id: item._id,
                name: item.name,
                type: item.type,
                data: decompressedData.content,
                mimeType: item.mimeType,
                size: item.size,
                createdAt: item.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to decompress' });
    }
});

app.delete('/api/chest/item/:itemId', async (req, res) => {
    try {
        await ChestItem.findByIdAndDelete(req.params.itemId);
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete' });
    }
});

// ============================================================
// DELETION ROUTES
// ============================================================

app.post('/api/delete/verify', async (req, res) => {
    try {
        const { uniqueKey, password, pin } = req.body;
        if (!uniqueKey || !password || !pin) return res.status(400).json({ success: false, message: 'All fields required' });

        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(401).json({ success: false, message: 'Account not found' });
        if (user.deleteRequested) return res.status(400).json({ success: false, message: 'Deletion already requested' });

        const decryptedPassword = encryptionUtil.decryptText(user.password);
        if (password !== decryptedPassword) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const decryptedPin = encryptionUtil.decryptText(user.pin);
        if (pin !== decryptedPin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const otp = process.env.OTP_DUMMY_VALUE || '12345';
        user.deleteOTP = otp;
        user.otpGeneratedAt = new Date();
        await user.save();

        res.json({ success: true, message: 'OTP sent!', otp });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

app.post('/api/delete/confirm', async (req, res) => {
    try {
        const { uniqueKey, otp } = req.body;
        if (!uniqueKey || !otp) return res.status(400).json({ success: false, message: 'All fields required' });

        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'Account not found' });

        if (!user.deleteOTP) return res.status(400).json({ success: false, message: 'No OTP requested' });

        if (user.otpGeneratedAt) {
            const otpAge = (Date.now() - user.otpGeneratedAt.getTime()) / 1000 / 60;
            if (otpAge > 5) {
                user.deleteOTP = null;
                user.otpGeneratedAt = null;
                await user.save();
                return res.status(400).json({ success: false, message: 'OTP expired' });
            }
        }

        if (otp.toString().trim() !== user.deleteOTP.toString().trim()) {
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }

        const deletionReq = new DeletionRequest({
            userId: user._id,
            uniqueKey: uniqueKey,
            status: 'pending'
        });
        await deletionReq.save();

        user.deleteRequested = true;
        user.deleteRequestDate = new Date();
        user.deleteOTP = null;
        user.otpGeneratedAt = null;
        await user.save();

        await profileManager.closeBrowser(user._id.toString());

        res.json({
            success: true,
            message: 'Deletion request submitted. Admin will verify within 24 hours.',
            requestId: deletionReq._id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Deletion failed' });
    }
});

// Get User Info
app.get('/api/user/:uniqueKey', async (req, res) => {
    try {
        const user = await findUserByKey(req.params.uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNo: encryptionUtil.decryptText(user.phoneNo),
                uniqueKey: req.params.uniqueKey,
                createdAt: user.createdAt,
                browserProfilePath: user.localProfileCache?.path || user.browserProfilePath,
                chromeData: user.chromeData,
                profilePhoto: user.profilePhoto,
                profileStorage: user.profileStorage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ============================================================
// SERVER STARTUP
// ============================================================
const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectMinIO();
    
    const server = app.listen(PORT, () => {
        console.log(`\n🌟 Cloude Server running on http://localhost:${PORT}`);
        console.log(`📦 MinIO Bucket: ${BUCKET}`);
        console.log(`🗄️ MongoDB: cloude database`);
        console.log(`🔐 Encryption: AES-256-CBC + AES-256-GCM`);
        console.log(`⏰ Auto-deletion: Every hour`);
        console.log(`\n📋 Flow:`);
        console.log(`   Register → Create profile (user_{mongoId})`);
        console.log(`   Login → Restore from MinIO (if exists)`);
        console.log(`   Launch Browser → Use local profile`);
        console.log(`   Close Browser → Upload to MinIO → Delete local\n`);
    });

    const gracefulShutdown = async () => {
        console.log('\n🛑 Shutting down...');
        await profileManager.closeAllBrowsers();
        deletionProcessor.stop();
        await mongoose.connection.close();
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 30000);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
}

startServer().catch(console.error);