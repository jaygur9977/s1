










// // const { chromium } = require('playwright');
// // const path = require('path');
// // const fs = require('fs');

// // (async () => {
// //   const profilePath = path.join(
// //     __dirname,
// //     'profiles',
// //     'user_1'
// //   );

// //   if (!fs.existsSync(profilePath)) {
// //     fs.mkdirSync(profilePath, { recursive: true });
// //   }

// //   const context = await chromium.launchPersistentContext(
// //     profilePath,
// //     {
// //       headless: false,
// //       channel: 'chrome',
// //       executablePath:
// //         'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
// //       viewport: null,
// //       args: [
// //         '--start-maximized',
// //         '--disable-blink-features=AutomationControlled'
// //       ]
// //     }
// //   );

// //   const page = context.pages()[0] || await context.newPage();

// //   // await page.goto('https://google.com');


// //   await page.goto('https://google.com', {
// //   waitUntil: 'domcontentloaded',
// //   timeout: 60000
// // });


// //   console.log(
// //     'Login manually once. Profile will be saved automatically.'
// //   );

// //   console.log(process.argv);

// // })();







// /**
//  * Browser Launcher - Launches Chrome browsers for multiple users
//  * Uses detected profiles and executable paths
//  * Optimized for speed and reliability
//  */

// const { chromium } = require('playwright');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const ChromeProfileDetector = require('./profile-fetch');

// // Colors
// const colors = {
//     reset: '\x1b[0m',
//     green: '\x1b[32m',
//     red: '\x1b[31m',
//     yellow: '\x1b[33m',
//     blue: '\x1b[36m',
//     cyan: '\x1b[96m',
//     white: '\x1b[37m',
//     magenta: '\x1b[35m'
// };

// function log(message, type = 'info') {
//     const timestamp = new Date().toLocaleTimeString();
//     const prefix = {
//         'info': `${colors.blue}[*]${colors.reset}`,
//         'success': `${colors.green}[✓]${colors.reset}`,
//         'error': `${colors.red}[!]${colors.reset}`,
//         'warning': `${colors.yellow}[⚠]${colors.reset}`,
//         'data': `${colors.cyan}[DATA]${colors.reset}`,
//         'browser': `${colors.magenta}[BROWSER]${colors.reset}`
//     }[type] || `${colors.blue}[*]${colors.reset}`;
//     console.log(`${prefix} [${timestamp}] ${message}`);
// }

// class BrowserLauncher {
//     constructor(options = {}) {
//         this.profilesBaseDir = options.profilesBaseDir || path.join(__dirname, 'browser-profiles');
//         this.maxConcurrent = options.maxConcurrent || 3;
//         this.activeBrowsers = new Map();
//         this.detector = null;
//         this.chromeInfo = null;
//         this.availableProfiles = [];
        
//         // Ensure base directory exists
//         if (!fs.existsSync(this.profilesBaseDir)) {
//             fs.mkdirSync(this.profilesBaseDir, { recursive: true });
//         }
//     }

//     /**
//      * Initialize - detect Chrome and profiles (cached for speed)
//      */
//     async initialize() {
//         log('Initializing Browser Launcher...', 'info');
//         log(`Platform: ${os.platform()} ${os.arch()}`, 'info');
        
//         // Load detector (only once)
//         if (!this.detector) {
//             this.detector = new ChromeProfileDetector();
//         }
        
//         // Try to load cached profile data first for speed
//         const cacheFile = path.join(__dirname, 'chrome-profiles.json');
//         let detection = null;
        
//         if (fs.existsSync(cacheFile)) {
//             try {
//                 const cacheStats = fs.statSync(cacheFile);
//                 const cacheAge = (Date.now() - cacheStats.mtimeMs) / 1000 / 60; // minutes
                
//                 if (cacheAge < 60) { // Cache valid for 1 hour
//                     log('Using cached Chrome profile data...', 'info');
//                     detection = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
//                 }
//             } catch (e) {
//                 // Cache invalid, will detect fresh
//             }
//         }
        
//         // If no valid cache, detect fresh
//         if (!detection || !detection.chrome?.found) {
//             detection = this.detector.detect();
//             // Save for future use
//             fs.writeFileSync(cacheFile, JSON.stringify(detection, null, 2));
//         }
        
//         this.chromeInfo = detection.chrome;
//         this.availableProfiles = detection.profiles;
        
//         if (!this.chromeInfo?.found) {
//             throw new Error('Chrome executable not found. Cannot launch browsers.');
//         }
        
//         log(`Chrome: ${this.chromeInfo.executablePath}`, 'data');
//         log(`Available real profiles: ${this.availableProfiles.length}`, 'data');
        
//         return this;
//     }

//     /**
//      * Get user profile directory path
//      */
//     getUserProfileDir(userId) {
//         const userDir = path.join(this.profilesBaseDir, `user_${userId}`);
//         if (!fs.existsSync(userDir)) {
//             fs.mkdirSync(userDir, { recursive: true });
//         }
//         return userDir;
//     }

//     /**
//      * Launch browser for a single user - FIXED VERSION
//      */
//     async launchBrowser(userId, options = {}) {
//         // Return existing browser if already running
//         if (this.activeBrowsers.has(userId)) {
//             log(`Browser already running for user_${userId}`, 'warning');
//             return this.activeBrowsers.get(userId);
//         }

//         const userProfileDir = this.getUserProfileDir(userId);
        
//         log(`Launching browser for user_${userId}...`, 'browser');
//         log(`Profile directory: ${userProfileDir}`, 'data');

//         try {
//             // FIX: Don't try to get PID from context.browser().process()
//             // launchPersistentContext returns a BrowserContext, not Browser
//             const launchStartTime = Date.now();
            
//             const context = await chromium.launchPersistentContext(
//                 userProfileDir,  // userDataDir as first parameter
//                 {
//                     headless: options.headless !== undefined ? options.headless : false,
//                     channel: 'chrome',
//                     executablePath: this.chromeInfo.executablePath,
//                     viewport: options.viewport || null,
//                     args: [
//                         '--start-maximized',
//                         '--disable-blink-features=AutomationControlled',
//                         '--no-first-run',
//                         '--no-default-browser-check',
//                         '--disable-extensions', // Speed up launch
//                         ...(options.args || [])
//                     ]
//                 }
//             );

//             const launchTime = ((Date.now() - launchStartTime) / 1000).toFixed(2);
            
//             // Get or create a page
//             let page;
//             if (context.pages().length > 0) {
//                 page = context.pages()[0];
//             } else {
//                 page = await context.newPage();
//             }

//             const browserInstance = {
//                 userId,
//                 context,
//                 page,
//                 profilePath: userProfileDir,
//                 launchedAt: new Date(),
//                 launchTimeSeconds: launchTime
//             };

//             this.activeBrowsers.set(userId, browserInstance);
            
//             log(`Browser launched in ${launchTime}s for user_${userId}`, 'success');
            
//             return browserInstance;
//         } catch (error) {
//             log(`Failed to launch browser: ${error.message}`, 'error');
//             throw error;
//         }
//     }

//     /**
//      * Launch multiple browsers in parallel batches
//      */
//     async launchMultipleBrowsers(userIds, options = {}) {
//         const results = [];
        
//         if (userIds.length === 0) {
//             log('No users specified', 'warning');
//             return results;
//         }
        
//         log(`Launching ${userIds.length} browser(s) (max parallel: ${this.maxConcurrent})`, 'info');
//         const totalStartTime = Date.now();
        
//         // Process in batches to respect maxConcurrent
//         for (let i = 0; i < userIds.length; i += this.maxConcurrent) {
//             const batch = userIds.slice(i, i + this.maxConcurrent);
//             const batchNum = Math.floor(i / this.maxConcurrent) + 1;
            
//             log(`Batch ${batchNum}/${Math.ceil(userIds.length / this.maxConcurrent)}: Users [${batch.join(', ')}]`, 'browser');
            
//             const batchPromises = batch.map(userId =>
//                 this.launchBrowser(userId, options)
//                     .then(result => ({ userId, result, success: true }))
//                     .catch(error => ({ userId, error: error.message, success: false }))
//             );
            
//             const batchResults = await Promise.all(batchPromises);
//             results.push(...batchResults);
            
//             // Log batch results
//             batchResults.forEach(r => {
//                 if (r.success) {
//                     log(`✓ User ${r.userId}: Ready in ${r.result.launchTimeSeconds}s`, 'success');
//                 } else {
//                     log(`✗ User ${r.userId}: ${r.error}`, 'error');
//                 }
//             });
//         }
        
//         const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(2);
//         const successful = results.filter(r => r.success).length;
        
//         log(`Completed: ${successful}/${userIds.length} browsers launched in ${totalTime}s`, 'info');
        
//         return results;
//     }

//     /**
//      * Navigate a user's browser to a URL
//      */
//     async navigateUser(userId, url, options = {}) {
//         const browser = this.activeBrowsers.get(userId);
//         if (!browser) {
//             throw new Error(`No browser running for user_${userId}`);
//         }
        
//         log(`Navigating user_${userId} to: ${url}`, 'browser');
        
//         try {
//             await browser.page.goto(url, {
//                 waitUntil: options.waitUntil || 'domcontentloaded', // Faster than 'load'
//                 timeout: options.timeout || 30000
//             });
            
//             log(`Navigation complete for user_${userId}`, 'success');
//             return browser.page;
//         } catch (error) {
//             log(`Navigation failed for user_${userId}: ${error.message}`, 'error');
//             throw error;
//         }
//     }

//     /**
//      * Execute action on user's page
//      */
//     async executeOnUser(userId, action) {
//         const browser = this.activeBrowsers.get(userId);
//         if (!browser) {
//             throw new Error(`No browser running for user_${userId}`);
//         }
        
//         return await action(browser.page);
//     }

//     /**
//      * Close browser for a specific user
//      */
//     async closeBrowser(userId) {
//         const browser = this.activeBrowsers.get(userId);
//         if (!browser) {
//             log(`No browser running for user_${userId}`, 'warning');
//             return;
//         }
        
//         try {
//             await browser.context.close();
//             this.activeBrowsers.delete(userId);
//             log(`Browser closed for user_${userId}`, 'info');
//         } catch (error) {
//             log(`Error closing browser for user_${userId}: ${error.message}`, 'error');
//         }
//     }

//     /**
//      * Close all browsers
//      */
//     async closeAllBrowsers() {
//         if (this.activeBrowsers.size === 0) {
//             log('No active browsers to close', 'info');
//             return;
//         }
        
//         log(`Closing ${this.activeBrowsers.size} browser(s)...`, 'warning');
        
//         const userIds = Array.from(this.activeBrowsers.keys());
//         const closePromises = userIds.map(userId => this.closeBrowser(userId));
//         await Promise.allSettled(closePromises); // Use allSettled to not fail if one errors
        
//         log('All browsers closed', 'success');
//     }

//     /**
//      * Get active browsers status
//      */
//     getStatus() {
//         const status = {
//             total: this.activeBrowsers.size,
//             browsers: []
//         };
        
//         for (const [userId, browser] of this.activeBrowsers) {
//             status.browsers.push({
//                 userId,
//                 profilePath: browser.profilePath,
//                 launchedAt: browser.launchedAt.toISOString(),
//                 uptimeSeconds: Math.floor((Date.now() - browser.launchedAt.getTime()) / 1000),
//                 launchTime: browser.launchTimeSeconds
//             });
//         }
        
//         return status;
//     }

//     /**
//      * Print status to console
//      */
//     printStatus() {
//         const status = this.getStatus();
        
//         console.log('\n' + '='.repeat(70));
//         console.log(`${colors.cyan}📊 ACTIVE BROWSERS${colors.reset}`);
//         console.log('='.repeat(70));
//         console.log(`Total Active: ${status.total}`);
//         console.log(`Chrome: ${this.chromeInfo?.executablePath || 'N/A'}`);
        
//         if (status.browsers.length > 0) {
//             console.log('\n' + '-'.repeat(70));
//             status.browsers.forEach((b, i) => {
//                 const uptimeMin = Math.floor(b.uptimeSeconds / 60);
//                 const uptimeSec = b.uptimeSeconds % 60;
                
//                 console.log(`\n${colors.green}Browser ${i + 1}: User ${b.userId}${colors.reset}`);
//                 console.log(`  Profile: ${b.profilePath}`);
//                 console.log(`  Launched: ${new Date(b.launchedAt).toLocaleString()}`);
//                 console.log(`  Uptime: ${uptimeMin}m ${uptimeSec}s`);
//                 console.log(`  Launch Time: ${b.launchTime}s`);
//             });
//         }
//         console.log('\n' + '='.repeat(70) + '\n');
//     }
// }

// // ============================================================
// // MAIN EXECUTION
// // ============================================================

// async function main() {
//     console.log('\n' + '='.repeat(70));
//     console.log(`${colors.cyan}🚀 CHROME BROWSER LAUNCHER v2.0${colors.reset}`);
//     console.log(`${colors.cyan}   Multi-User Parallel Browser Manager${colors.reset}`);
//     console.log('='.repeat(70) + '\n');
    
//     // Create launcher instance
//     const launcher = new BrowserLauncher({
//         profilesBaseDir: path.join(__dirname, 'browser-profiles'),
//         maxConcurrent: 3
//     });
    
//     // Initialize (detect Chrome)
//     const initStartTime = Date.now();
//     await launcher.initialize();
//     const initTime = ((Date.now() - initStartTime) / 1000).toFixed(2);
//     log(`Initialization completed in ${initTime}s`, 'success');
    
//     // Parse command line arguments
//     const args = process.argv.slice(2);
//     const command = args[0];
    
//     // Setup graceful shutdown handler
//     const setupShutdownHandler = () => {
//         const shutdown = async () => {
//             console.log('\n');
//             log('Received shutdown signal...', 'warning');
//             await launcher.closeAllBrowsers();
//             log('Goodbye! 👋', 'info');
//             process.exit(0);
//         };
        
//         process.on('SIGINT', shutdown);
//         process.on('SIGTERM', shutdown);
//         process.on('SIGHUP', shutdown);
//     };
    
//     if (!command) {
//         // ============================================================
//         // DEFAULT MODE: Single user demo
//         // ============================================================
//         log('No command specified. Launching demo browser...', 'info');
        
//         try {
//             // Launch browser for default user
//             const browser = await launcher.launchBrowser('1', { 
//                 headless: false 
//             });
            
//             // Navigate to Google
//             await launcher.navigateUser('1', 'https://google.com', {
//                 waitUntil: 'domcontentloaded',
//                 timeout: 60000
//             });
            
//             // Show status
//             launcher.printStatus();
            
//             console.log(`${colors.yellow}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
//             console.log(`${colors.yellow}║  Browser is running. Login manually to save profile.        ║${colors.reset}`);
//             console.log(`${colors.yellow}║  Press Ctrl+C to close browser and exit.                    ║${colors.reset}`);
//             console.log(`${colors.yellow}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
            
//             setupShutdownHandler();
            
//         } catch (error) {
//             log(`Demo failed: ${error.message}`, 'error');
//             process.exit(1);
//         }
        
//     } else {
//         // ============================================================
//         // COMMAND MODE
//         // ============================================================
//         switch (command.toLowerCase()) {
//             case 'launch':
//                 const userIds = args.slice(1).length > 0 
//                     ? args.slice(1).map(id => id.replace(/[^0-9]/g, '')) 
//                     : ['1'];
                
//                 log(`Launching browsers for users: ${userIds.join(', ')}`, 'info');
                
//                 const results = await launcher.launchMultipleBrowsers(userIds, {
//                     headless: false
//                 });
                
//                 // Navigate all to Google
//                 for (const result of results) {
//                     if (result.success) {
//                         try {
//                             await launcher.navigateUser(result.userId, 'https://google.com');
//                         } catch (e) {
//                             log(`Navigation error for user ${result.userId}`, 'warning');
//                         }
//                     }
//                 }
                
//                 launcher.printStatus();
//                 setupShutdownHandler();
//                 break;
                
//             case 'status':
//                 launcher.printStatus();
//                 process.exit(0);
//                 break;
                
//             case 'close':
//                 const closeUserId = args[1]?.replace(/[^0-9]/g, '');
//                 if (closeUserId) {
//                     await launcher.closeBrowser(closeUserId);
//                 } else {
//                     await launcher.closeAllBrowsers();
//                 }
//                 process.exit(0);
//                 break;
                
//             case 'list':
//                 console.log('\n' + '='.repeat(70));
//                 console.log(`${colors.cyan}📁 AVAILABLE REAL CHROME PROFILES${colors.reset}`);
//                 console.log('='.repeat(70));
                
//                 if (launcher.availableProfiles.length === 0) {
//                     console.log('No profiles found.');
//                 } else {
//                     launcher.availableProfiles.forEach((profile, i) => {
//                         const badge = profile.isDefault ? ` ${colors.green}[DEFAULT]${colors.reset}` : '';
//                         console.log(`\n${i + 1}. ${profile.name}${badge}`);
//                         console.log(`   Path: ${profile.path}`);
//                         console.log(`   Email: ${profile.email || 'N/A'}`);
//                         console.log(`   Size: ${profile.sizeFormatted || 'N/A'}`);
//                     });
//                 }
//                 console.log('\n' + '='.repeat(70) + '\n');
//                 process.exit(0);
//                 break;
                
//             default:
//                 console.log(`\n${colors.yellow}📋 Available Commands:${colors.reset}\n`);
//                 console.log(`  ${colors.green}node server.js${colors.reset}                    - Launch demo browser`);
//                 console.log(`  ${colors.green}node server.js launch 1 2 3${colors.reset}      - Launch multiple browsers`);
//                 console.log(`  ${colors.green}node server.js status${colors.reset}              - Show active browsers`);
//                 console.log(`  ${colors.green}node server.js close [userId]${colors.reset}      - Close browser(s)`);
//                 console.log(`  ${colors.green}node server.js list${colors.reset}                - List available Chrome profiles`);
//                 console.log(`\n${colors.yellow}💡 Tips:${colors.reset}`);
//                 console.log(`  - User IDs can be any number (1, 2, 3, etc.)`);
//                 console.log(`  - Each user gets isolated browser profile`);
//                 console.log(`  - Max 3 parallel browsers by default\n`);
//                 process.exit(0);
//                 break;
//         }
//     }
// }

// // Export for use as module
// module.exports = BrowserLauncher;

// // Run if executed directly
// if (require.main === module) {
//     main().catch(async (error) => {
//         console.error(`\n${colors.red}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
//         console.error(`${colors.red}║  FATAL ERROR                                                 ║${colors.reset}`);
//         console.error(`${colors.red}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
//         console.error(`${colors.red}${error.message}${colors.reset}`);
        
//         if (error.stack) {
//             console.error(`\n${colors.yellow}Stack trace (debug):${colors.reset}`);
//             console.error(error.stack.split('\n').slice(1, 4).join('\n'));
//         }
        
//         console.log(`\n${colors.yellow}💡 Troubleshooting:${colors.reset}`);
//         console.log('  1. Make sure Chrome is installed');
//         console.log('  2. Run: node profile-detector.js to check Chrome detection');
//         console.log('  3. Check if another Chrome instance is blocking the profile');
//         console.log('  4. Try closing all Chrome windows and retry\n');
        
//         process.exit(1);
//     });
// }







const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const os = require('os');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// MONGODB CONNECTION
// ============================================================
const MONGODB_URI = 'mongodb+srv://jay-food-app:997763@cluster0.lvfyc.mongodb.net/cloude?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

// ============================================================
// ENCRYPTION SETUP
// ============================================================
const ENCRYPTION_KEY = crypto.createHash('sha256').update('cloude-pro-max-2024-secure').digest();
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
        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return text;
    }
}

// ============================================================
// CHROME PROFILE DETECTOR CLASS (Integrated from profile-detector.js)
// ============================================================
class ChromeProfileDetector {
    constructor() {
        this.platform = os.platform();
        this.arch = os.arch();
    }

    detectChromeExecutable() {
        if (this.platform === 'win32') {
            const paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
            ];
            for (const p of paths) {
                if (fs.existsSync(p)) return { path: p, method: 'Direct Path' };
            }
            
            try {
                const regCmd = 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul';
                const result = execSync(regCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                const match = result.match(/([A-Z]:\\.+?chrome\.exe)/i);
                if (match && match[1] && fs.existsSync(match[1])) {
                    return { path: match[1], method: 'Registry' };
                }
            } catch (e) {}
        } else if (this.platform === 'darwin') {
            const macPaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
            ];
            for (const p of macPaths) {
                if (fs.existsSync(p)) return { path: p, method: 'macOS Path' };
            }
        } else {
            const linuxPaths = ['/usr/bin/google-chrome', '/usr/bin/chromium'];
            for (const p of linuxPaths) {
                if (fs.existsSync(p)) return { path: p, method: 'Linux Path' };
            }
        }
        return { path: null, method: null };
    }

    getUserDataDirectories() {
        const dirs = [];
        if (this.platform === 'win32') {
            const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
            dirs.push(path.join(localAppData, 'Google', 'Chrome', 'User Data'));
        } else if (this.platform === 'darwin') {
            dirs.push(path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome'));
        } else {
            dirs.push(path.join(os.homedir(), '.config', 'google-chrome'));
        }
        return dirs.filter(dir => fs.existsSync(dir));
    }

    getProfilesFromLocalState(userDataDir) {
        const profiles = [];
        const localStatePath = path.join(userDataDir, 'Local State');
        if (!fs.existsSync(localStatePath)) return profiles;

        try {
            const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
            const infoCache = localState.profile?.info_cache || {};
            
            for (const [profileDir, info] of Object.entries(infoCache)) {
                const profilePath = path.join(userDataDir, profileDir);
                if (fs.existsSync(profilePath)) {
                    profiles.push({
                        name: info.name || profileDir,
                        path: profilePath,
                        isDefault: profileDir === 'Default',
                        email: info.user_name || null,
                        displayName: info.gaia_name || null,
                        lastUsed: info.active_time ? new Date(info.active_time * 1000) : null
                    });
                }
            }
        } catch (e) {}
        return profiles;
    }

    detectAll() {
        return {
            platform: this.platform,
            architecture: this.arch,
            chrome: this.detectChromeExecutable(),
            profiles: this.getUserDataDirectories().flatMap(dir => this.getProfilesFromLocalState(dir)),
            timestamp: new Date().toISOString()
        };
    }
}

// ============================================================
// USER SCHEMA WITH CHROME PROFILE LINKING
// ============================================================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    phoneNo: { type: String, required: true },
    uniqueKey: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    pin: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    deleteRequested: { type: Boolean, default: false },
    deleteRequestDate: { type: Date },
    deleteOTP: { type: String },
    
    // Chrome profile linked data
    chromeData: {
        executablePath: { type: String },
        chromeProfiles: [{
            name: String,
            path: String,
            isDefault: Boolean,
            email: String
        }],
        detectionTimestamp: { type: Date },
        platform: { type: String },
        architecture: { type: String }
    },
    
    browserProfilePath: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// FIXED: Pre-save hook - removed 'next' callback, using async/await properly
userSchema.pre('save', async function() {
    if (this.isModified('password') && this.password) {
        this.password = encrypt(this.password);
    }
    if (this.isModified('pin') && this.pin) {
        this.pin = encrypt(this.pin);
    }
    if (this.isModified('phoneNo') && this.phoneNo) {
        this.phoneNo = encrypt(this.phoneNo);
    }
});

const User = mongoose.model('User', userSchema);

// ============================================================
// PROFILE MANAGER CLASS
// ============================================================
class ProfileManager {
    constructor() {
        this.activeBrowsers = new Map();
        this.detector = new ChromeProfileDetector();
        this.setupProfileDirectory();
    }

    setupProfileDirectory() {
        const baseDir = path.join(__dirname, 'browser-profiles');
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
    }

    generateUniqueKey() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789';
        let key = '';
        for (let i = 0; i < 8; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }

    async detectChromeForUser(userId) {
        try {
            const detection = this.detector.detectAll();
            
            await User.findByIdAndUpdate(userId, {
                chromeData: {
                    executablePath: detection.chrome.path,
                    chromeProfiles: detection.profiles.slice(0, 5), // Store top 5 profiles
                    detectionTimestamp: new Date(),
                    platform: detection.platform,
                    architecture: detection.architecture
                }
            });
            
            console.log(`✅ Chrome data saved for user ${userId}`);
            return detection;
        } catch (error) {
            console.error(`❌ Chrome detection failed for user ${userId}:`, error);
        }
    }

    async launchBrowserForUser(userId, userKey) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const profilePath = user.browserProfilePath || path.join(__dirname, 'browser-profiles', `user_${userId}`);
            
            if (!fs.existsSync(profilePath)) {
                fs.mkdirSync(profilePath, { recursive: true });
            }

            const executablePath = user.chromeData?.executablePath || this.detector.detectChromeExecutable().path;
            
            if (!executablePath) throw new Error('Chrome executable not found');

            const context = await chromium.launchPersistentContext(profilePath, {
                headless: false,
                executablePath: executablePath,
                viewport: null,
                args: [
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                    '--no-first-run'
                ]
            });

            const page = context.pages()[0] || await context.newPage();
            
            this.activeBrowsers.set(userId, { context, page, profilePath, launchedAt: new Date() });

            await page.goto('https://google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

            return { success: true, profilePath };
        } catch (error) {
            console.error(`Browser launch failed for user ${userId}:`, error);
            throw error;
        }
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

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Generate Unique Key Only
app.post('/api/generate-key', async (req, res) => {
    try {
        let uniqueKey;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 20) {
            uniqueKey = profileManager.generateUniqueKey();
            const existing = await User.findOne({ uniqueKey });
            if (!existing) isUnique = true;
            attempts++;
        }
        
        if (!isUnique) {
            return res.status(500).json({ success: false, message: 'Failed to generate unique key' });
        }
        
        res.json({ success: true, uniqueKey });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate key' });
    }
});

// Register User (FIXED)
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, phoneNo, uniqueKey, password, pin } = req.body;

        if (!fullName || !phoneNo || !uniqueKey || !password || !pin) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Validate phone (10 digits)
        if (!/^\d{10}$/.test(phoneNo)) {
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
        }

        // Validate PIN (4 digits)
        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
        }

        // Validate password (8+ chars, uppercase, lowercase, number, special)
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
            });
        }

        // Check unique key
        const existingUser = await User.findOne({ uniqueKey });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'This key is already registered' });
        }

        const profilePath = path.join(__dirname, 'browser-profiles', `user_${Date.now()}`);

        // Create user
        const user = new User({
            fullName: fullName.trim(),
            phoneNo,
            uniqueKey,
            password,
            pin,
            browserProfilePath: profilePath
        });

        await user.save();

        // Start Chrome profile detection in background (parallel process)
        profileManager.detectChromeForUser(user._id.toString());

        res.json({
            success: true,
            message: 'Registration successful!',
            userId: user._id,
            uniqueKey: user.uniqueKey
        });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This key is already registered' });
        }
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Login User
app.post('/api/login', async (req, res) => {
    try {
        const { uniqueKey, password, pin } = req.body;

        if (!uniqueKey || !password || !pin) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const user = await User.findOne({ uniqueKey, isActive: true });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.deleteRequested) {
            return res.status(403).json({ success: false, message: 'Account deletion is in progress' });
        }

        // Verify password
        const decryptedPassword = decrypt(user.password);
        if (password !== decryptedPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Verify PIN
        const decryptedPin = decrypt(user.pin);
        if (pin !== decryptedPin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const decryptedPhone = decrypt(user.phoneNo);

        res.json({
            success: true,
            message: 'Login successful!',
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNo: decryptedPhone,
                uniqueKey: user.uniqueKey,
                createdAt: user.createdAt,
                browserProfilePath: user.browserProfilePath,
                chromeData: user.chromeData
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Send OTP for Deletion
app.post('/api/send-delete-otp', async (req, res) => {
    try {
        const { fullName, mobileNo } = req.body;

        if (!fullName || !mobileNo) {
            return res.status(400).json({ success: false, message: 'Name and mobile number are required' });
        }

        const users = await User.find({ isActive: true, deleteRequested: false });
        let user = null;

        for (const u of users) {
            try {
                const decryptedPhone = decrypt(u.phoneNo);
                if (decryptedPhone === mobileNo && u.fullName.toLowerCase() === fullName.toLowerCase().trim()) {
                    user = u;
                    break;
                }
            } catch (e) { continue; }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        // Generate dummy OTP (12345)
        const otp = '12345';
        user.deleteOTP = otp;
        await user.save();

        res.json({ 
            success: true, 
            message: 'OTP sent successfully to your registered mobile number',
            // In production, don't send OTP back. This is for testing only
            otp: otp  
        });

    } catch (error) {
        console.error('OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

// Verify OTP and Request Deletion
app.post('/api/verify-delete-otp', async (req, res) => {
    try {
        const { fullName, mobileNo, otp, pin } = req.body;

        if (!fullName || !mobileNo || !otp || !pin) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const users = await User.find({ isActive: true, deleteRequested: false });
        let user = null;

        for (const u of users) {
            try {
                const decryptedPhone = decrypt(u.phoneNo);
                if (decryptedPhone === mobileNo && u.fullName.toLowerCase() === fullName.toLowerCase().trim()) {
                    user = u;
                    break;
                }
            } catch (e) { continue; }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        // Verify OTP
        if (user.deleteOTP !== otp) {
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }

        // Verify PIN
        const decryptedPin = decrypt(user.pin);
        if (pin !== decryptedPin) {
            return res.status(401).json({ success: false, message: 'Invalid PIN' });
        }

        // Mark for deletion
        user.deleteRequested = true;
        user.deleteRequestDate = new Date();
        user.deleteOTP = null; // Clear OTP
        await user.save();

        await profileManager.closeBrowser(user._id.toString());

        res.json({
            success: true,
            message: 'Your deletion request has been submitted. Admin will verify and delete your account within 24 hours.',
            requestDate: user.deleteRequestDate
        });

    } catch (error) {
        console.error('Delete verification error:', error);
        res.status(500).json({ success: false, message: 'Request failed' });
    }
});

// Launch Browser
app.post('/api/launch-browser', async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        const user = await User.findOne({ uniqueKey, isActive: true, deleteRequested: false });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const result = await profileManager.launchBrowserForUser(user._id.toString(), user.uniqueKey);

        res.json({ success: true, message: 'Browser launched!', profilePath: result.profilePath });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to launch browser' });
    }
});

// Close Browser
app.post('/api/close-browser', async (req, res) => {
    try {
        const { uniqueKey } = req.body;
        const user = await User.findOne({ uniqueKey });
        if (user) await profileManager.closeBrowser(user._id.toString());
        res.json({ success: true, message: 'Browser closed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed' });
    }
});

// Get User with Chrome Data
app.get('/api/user/:uniqueKey', async (req, res) => {
    try {
        const user = await User.findOne({ uniqueKey: req.params.uniqueKey, isActive: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNo: decrypt(user.phoneNo),
                uniqueKey: user.uniqueKey,
                createdAt: user.createdAt,
                browserProfilePath: user.browserProfilePath,
                chromeData: user.chromeData,
                deleteRequested: user.deleteRequested
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`\n🌟 Cloude Server Running on http://localhost:${PORT}\n`);
});

process.on('SIGINT', async () => {
    for (const [userId] of profileManager.activeBrowsers) {
        await profileManager.closeBrowser(userId);
    }
    await mongoose.connection.close();
    server.close(() => process.exit(0));
});