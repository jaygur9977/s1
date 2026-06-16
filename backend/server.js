const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { promisify } = require('util');
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const os = require('os');

const app = express();

// Increase payload limit for file uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================
// MONGODB CONNECTION
// ============================================================
const MONGODB_URI = 'mongodb+srv://jay-food-app:997763@cluster0.lvfyc.mongodb.net/cloude?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

// ============================================================
// ENCRYPTION SETUP (AES-256-CBC)
// ============================================================
const ENCRYPTION_KEY = crypto.createHash('sha256').update('cloude-ultra-secure-key-2024').digest();
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts.slice(1).join(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) { return text; }
}

// Encrypt Buffer data
function encryptBuffer(buffer) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return Buffer.concat([iv, encrypted]).toString('base64');
}

function decryptBuffer(encryptedBase64) {
    const data = Buffer.from(encryptedBase64, 'base64');
    const iv = data.slice(0, IV_LENGTH);
    const encrypted = data.slice(IV_LENGTH);
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// ============================================================
// COMPRESSION UTILITIES
// ============================================================
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

async function compressData(data) {
    const compressed = await gzip(Buffer.from(JSON.stringify(data)));
    return compressed.toString('base64');
}

async function decompressData(compressedBase64) {
    const buffer = Buffer.from(compressedBase64, 'base64');
    const decompressed = await gunzip(buffer);
    return JSON.parse(decompressed.toString());
}

// ============================================================
// CHROME PROFILE DETECTOR
// ============================================================
class ChromeProfileDetector {
    detectChromeExecutable() {
        if (os.platform() === 'win32') {
            const paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
            ];
            for (const p of paths) if (fs.existsSync(p)) return { path: p, method: 'Direct Path' };
            try {
                const result = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul', { encoding: 'utf8' });
                const match = result.match(/([A-Z]:\\.+?chrome\.exe)/i);
                if (match?.[1] && fs.existsSync(match[1])) return { path: match[1], method: 'Registry' };
            } catch (e) {}
        } else if (os.platform() === 'darwin') {
            const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
            if (fs.existsSync(p)) return { path: p, method: 'macOS' };
        } else {
            for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium']) {
                if (fs.existsSync(p)) return { path: p, method: 'Linux' };
            }
        }
        return { path: null, method: null };
    }

    getUserProfiles() {
        const profiles = [];
        let userDataDir;
        if (os.platform() === 'win32') {
            userDataDir = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'), 'Google/Chrome/User Data');
        } else if (os.platform() === 'darwin') {
            userDataDir = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
        } else {
            userDataDir = path.join(os.homedir(), '.config/google-chrome');
        }
        
        const localStatePath = path.join(userDataDir, 'Local State');
        if (fs.existsSync(localStatePath)) {
            try {
                const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
                const infoCache = localState.profile?.info_cache || {};
                for (const [dir, info] of Object.entries(infoCache)) {
                    const profilePath = path.join(userDataDir, dir);
                    if (fs.existsSync(profilePath)) {
                        profiles.push({
                            name: info.name || dir,
                            path: profilePath,
                            isDefault: dir === 'Default',
                            email: info.user_name || null
                        });
                    }
                }
            } catch (e) {}
        }
        return profiles;
    }

    detectAll() {
        return {
            platform: os.platform(),
            chrome: this.detectChromeExecutable(),
            profiles: this.getUserProfiles(),
            timestamp: new Date().toISOString()
        };
    }
}

// ============================================================
// SCHEMAS
// ============================================================

// Deletion Request Schema
const deletionRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uniqueKey: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    processedAt: { type: Date },
    adminNote: { type: String }
});

// Chest Item Schema
const chestItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'file', 'image', 'document'], required: true },
    data: { type: String, required: true }, // Encrypted & Compressed
    mimeType: { type: String },
    size: { type: Number },
    isCompressed: { type: Boolean, default: true },
    isEncrypted: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    phoneNo: { type: String, required: true },
    uniqueKey: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    pin: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    deleteRequested: { type: Boolean, default: false },
    deleteRequestDate: { type: Date },
    deleteOTP: { type: String },           // For storing deletion OTP
    otpGeneratedAt: { type: Date },        // OTP timestamp for expiration
    profilePhoto: { type: String },
    chromeData: {
        executablePath: String,
        chromeProfiles: [{
            name: String,
            path: String,
            isDefault: Boolean,
            email: String
        }],
        detectionTimestamp: Date,
        platform: String
    },
    browserProfilePath: String,
    createdAt: { type: Date, default: Date.now }
});

// Encrypt sensitive fields
userSchema.pre('save', async function() {
    if (this.isModified('password') && this.password && !this.password.includes(':')) {
        this.password = encrypt(this.password);
    }
    if (this.isModified('pin') && this.pin && !this.pin.includes(':')) {
        this.pin = encrypt(this.pin);
    }
    if (this.isModified('phoneNo') && this.phoneNo && !this.phoneNo.includes(':')) {
        this.phoneNo = encrypt(this.phoneNo);
    }
    if (this.isModified('uniqueKey') && this.uniqueKey && !this.uniqueKey.includes(':')) {
        // Store both encrypted and hashed for searching
        this.uniqueKey = encrypt(this.uniqueKey);
    }
});

const User = mongoose.model('User', userSchema);
const DeletionRequest = mongoose.model('DeletionRequest', deletionRequestSchema);
const ChestItem = mongoose.model('ChestItem', chestItemSchema);

// ============================================================
// HELPER: Find user by unique key (searches encrypted keys)
// ============================================================
async function findUserByKey(uniqueKey) {
    const users = await User.find({ isActive: true });
    for (const user of users) {
        try {
            const decrypted = decrypt(user.uniqueKey);
            if (decrypted === uniqueKey) return user;
        } catch (e) { continue; }
    }
    return null;
}

// ============================================================
// PROFILE MANAGER
// ============================================================
class ProfileManager {
    constructor() {
        this.activeBrowsers = new Map();
        this.detector = new ChromeProfileDetector();
        this.setupDirs();
    }

    setupDirs() {
        const dirs = ['browser-profiles', 'uploads', 'temp'];
        dirs.forEach(d => {
            const p = path.join(__dirname, d);
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        });
    }

    generateUniqueKey() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789';
        return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    async detectChromeForUser(userId) {
        try {
            const detection = this.detector.detectAll();
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

    async launchBrowserForUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const profilePath = user.browserProfilePath || path.join(__dirname, 'browser-profiles', `user_${userId}`);
        if (!fs.existsSync(profilePath)) fs.mkdirSync(profilePath, { recursive: true });

        const exePath = user.chromeData?.executablePath || this.detector.detectChromeExecutable().path;
        if (!exePath) throw new Error('Chrome not found');

        if (this.activeBrowsers.has(userId)) {
            return { success: true, message: 'Browser already running' };
        }

        const context = await chromium.launchPersistentContext(profilePath, {
            headless: false,
            executablePath: exePath,
            viewport: null,
            args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--no-first-run']
        });

        const page = context.pages()[0] || await context.newPage();
        this.activeBrowsers.set(userId, { context, page, profilePath });
        await page.goto('https://google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

        return { success: true, profilePath };
    }

    async closeBrowser(userId) {
        const browser = this.activeBrowsers.get(userId);
        if (browser) {
            try { await browser.context.close(); } catch (e) {}
            this.activeBrowsers.delete(userId);
        }
    }
}

const profileManager = new ProfileManager();

// ============================================================
// API ROUTES
// ============================================================

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

// Register User
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

        const user = new User({
            fullName: fullName.trim(),
            phoneNo,
            uniqueKey,
            password,
            pin,
            browserProfilePath: path.join(__dirname, 'browser-profiles', `user_${Date.now()}`)
        });

        await user.save();

        // Start Chrome detection in background
        profileManager.detectChromeForUser(user._id.toString());

        res.json({ success: true, message: 'Registration successful!', userId: user._id, uniqueKey });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Login User
app.post('/api/login', async (req, res) => {
    try {
        const { uniqueKey, password, pin } = req.body;
        if (!uniqueKey || !password || !pin) return res.status(400).json({ success: false, message: 'All fields required' });

        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        if (user.deleteRequested) return res.status(403).json({ success: false, message: 'Account pending deletion' });

        const decryptedPassword = decrypt(user.password);
        if (password !== decryptedPassword) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const decryptedPin = decrypt(user.pin);
        if (pin !== decryptedPin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        // Fetch chest items (compressed, not decompressed)
        const chestItems = await ChestItem.find({ userId: user._id }).select('-data'); // Don't send data

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNo: decrypt(user.phoneNo),
                uniqueKey: uniqueKey,
                createdAt: user.createdAt,
                browserProfilePath: user.browserProfilePath,
                chromeData: user.chromeData,
                profilePhoto: user.profilePhoto || null,
                chestItemCount: chestItems.length,
                chestItems: chestItems.map(item => ({
                    id: item._id,
                    name: item.name,
                    type: item.type,
                    size: item.size,
                    mimeType: item.mimeType,
                    createdAt: item.createdAt,
                    isCompressed: item.isCompressed
                }))
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Upload Profile Photo
app.post('/api/upload-photo', async (req, res) => {
    try {
        const { uniqueKey, photo } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Encrypt photo before storing
        const encryptedPhoto = encrypt(photo);
        user.profilePhoto = encryptedPhoto;
        await user.save();

        res.json({ success: true, message: 'Photo uploaded' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// ============================================================
// CHEST ROUTES (Encrypted & Compressed Storage)
// ============================================================

// Add item to chest
app.post('/api/chest/add', async (req, res) => {
    try {
        const { uniqueKey, name, type, data, mimeType } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Compress and encrypt the data
        const compressedData = await compressData({ content: data, timestamp: new Date().toISOString() });
        const encryptedData = encrypt(compressedData);

        const item = new ChestItem({
            userId: user._id,
            name,
            type: type || 'text',
            data: encryptedData,
            mimeType: mimeType || 'text/plain',
            size: data.length,
            isCompressed: true,
            isEncrypted: true
        });

        await item.save();

        res.json({ success: true, message: 'Item saved to chest!', itemId: item._id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save item' });
    }
});

// Get chest items list (without data - for browsing)
app.get('/api/chest/list/:uniqueKey', async (req, res) => {
    try {
        const user = await findUserByKey(req.params.uniqueKey);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const items = await ChestItem.find({ userId: user._id })
            .select('-data')
            .sort({ createdAt: -1 });

        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
});

// Get and decompress specific chest item
app.get('/api/chest/item/:itemId', async (req, res) => {
    try {
        const item = await ChestItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        // Decrypt and decompress
        const decryptedData = decrypt(item.data);
        const decompressedData = await decompressData(decryptedData);

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
        console.error('Decompress error:', error);
        res.status(500).json({ success: false, message: 'Failed to decompress item' });
    }
});

// Delete chest item
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

// Step 1: Verify identity for deletion (by key, password, pin - NO name)
app.post('/api/delete/verify', async (req, res) => {
    try {
        const { uniqueKey, password, pin } = req.body;
        
        console.log('Delete verification attempt for key:', uniqueKey);
        
        if (!uniqueKey || !password || !pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: unique key, password, and PIN' 
            });
        }

        // Find user by unique key
        const user = await findUserByKey(uniqueKey);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Account not found. Please check your unique key.' 
            });
        }

        // Check if already requested deletion
        if (user.deleteRequested) {
            return res.status(400).json({ 
                success: false, 
                message: 'Deletion already requested for this account. Please wait for admin approval.' 
            });
        }

        // Verify password
        let decryptedPassword;
        try {
            decryptedPassword = decrypt(user.password);
        } catch (e) {
            console.error('Password decryption error:', e);
            return res.status(500).json({ 
                success: false, 
                message: 'Error verifying credentials. Please try again.' 
            });
        }

        if (password !== decryptedPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid password. Please check and try again.' 
            });
        }

        // Verify PIN
        let decryptedPin;
        try {
            decryptedPin = decrypt(user.pin);
        } catch (e) {
            console.error('PIN decryption error:', e);
            return res.status(500).json({ 
                success: false, 
                message: 'Error verifying credentials. Please try again.' 
            });
        }

        if (pin !== decryptedPin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid PIN. Please check and try again.' 
            });
        }

        // Generate OTP (dummy: 12345)
        const otp = '12345';
        
        // Store OTP temporarily (in production, send via SMS)
        user.deleteOTP = otp;
        user.otpGeneratedAt = new Date();
        await user.save();
        
        console.log(`OTP generated for user ${user._id}: ${otp}`);

        res.json({ 
            success: true, 
            message: 'Verification successful! OTP has been sent to your registered mobile number.',
            // In production, remove this. Only for testing:
            otp: otp,
            expiresIn: '5 minutes'
        });

    } catch (error) {
        console.error('Delete verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Verification failed. Please try again.' 
        });
    }
});

// Step 2: Confirm deletion with OTP
app.post('/api/delete/confirm', async (req, res) => {
    try {
        const { uniqueKey, otp } = req.body;
        
        console.log('Delete confirmation for key:', uniqueKey, 'OTP:', otp);
        
        if (!uniqueKey || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Unique key and OTP are required' 
            });
        }

        // Find user by unique key
        const user = await findUserByKey(uniqueKey);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Account not found' 
            });
        }

        // Check if OTP exists
        if (!user.deleteOTP) {
            return res.status(400).json({ 
                success: false, 
                message: 'No OTP was requested. Please start the verification process again.' 
            });
        }

        // Check OTP expiration (5 minutes)
        if (user.otpGeneratedAt) {
            const otpAge = (new Date() - user.otpGeneratedAt) / 1000 / 60; // in minutes
            if (otpAge > 5) {
                user.deleteOTP = null;
                user.otpGeneratedAt = null;
                await user.save();
                return res.status(400).json({ 
                    success: false, 
                    message: 'OTP has expired. Please request a new one.' 
                });
            }
        }

        // Verify OTP (trim and compare as strings)
        const submittedOTP = otp.toString().trim();
        const storedOTP = user.deleteOTP.toString().trim();
        
        console.log('Submitted OTP:', submittedOTP, 'Stored OTP:', storedOTP);
        
        if (submittedOTP !== storedOTP) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid OTP. Please check and try again.' 
            });
        }

        // Create deletion request record
        const deletionReq = new DeletionRequest({
            userId: user._id,
            uniqueKey: uniqueKey,
            status: 'pending',
            requestedAt: new Date()
        });
        await deletionReq.save();

        // Mark user account for deletion
        user.deleteRequested = true;
        user.deleteRequestDate = new Date();
        user.deleteOTP = null; // Clear OTP after successful verification
        user.otpGeneratedAt = null;
        await user.save();

        console.log(`Deletion request created for user ${user._id}`);

        // Close browser if open
        try {
            await profileManager.closeBrowser(user._id.toString());
        } catch (e) {
            console.log('No browser to close or error closing browser');
        }

        res.json({
            success: true,
            message: 'Your deletion request has been submitted successfully. Our admin team will verify your details within 24 hours. After successful verification, your account will be permanently deleted.',
            requestId: deletionReq._id,
            requestDate: deletionReq.requestedAt
        });

    } catch (error) {
        console.error('Delete confirmation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Deletion confirmation failed. Please try again.' 
        });
    }
});


app.post('/api/delete/resend-otp', async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        
        if (!uniqueKey) {
            return res.status(400).json({ success: false, message: 'Unique key is required' });
        }

        const user = await findUserByKey(uniqueKey);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        if (user.deleteRequested) {
            return res.status(400).json({ success: false, message: 'Deletion already in progress' });
        }

        // Generate new OTP
        const otp = '12345';
        user.deleteOTP = otp;
        user.otpGeneratedAt = new Date();
        await user.save();

        res.json({ 
            success: true, 
            message: 'New OTP sent successfully!',
            otp: otp 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to resend OTP' });
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
        res.status(500).json({ success: false, message: error.message });
    }
});

// Close Browser
app.post('/api/close-browser', async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        const user = await findUserByKey(uniqueKey);
        if (user) await profileManager.closeBrowser(user._id.toString());
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ success: true, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`\n🌟 Cloude Server on http://localhost:${PORT}\n`));

process.on('SIGINT', async () => {
    for (const [userId] of profileManager.activeBrowsers) await profileManager.closeBrowser(userId);
    await mongoose.connection.close();
    server.close(() => process.exit(0));
});