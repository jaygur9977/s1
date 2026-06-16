<<<<<<< HEAD











// const { chromium } = require('playwright');
// const path = require('path');
// const fs = require('fs');

// (async () => {
//   const profilePath = path.join(
//     __dirname,
//     'profiles',
//     'user_1'
//   );

//   if (!fs.existsSync(profilePath)) {
//     fs.mkdirSync(profilePath, { recursive: true });
//   }

//   const context = await chromium.launchPersistentContext(
//     profilePath,
//     {
//       headless: false,
//       channel: 'chrome',
//       executablePath:
//         'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//       viewport: null,
//       args: [
//         '--start-maximized',
//         '--disable-blink-features=AutomationControlled'
//       ]
//     }
//   );

//   const page = context.pages()[0] || await context.newPage();

//   // await page.goto('https://google.com');


//   await page.goto('https://google.com', {
//   waitUntil: 'domcontentloaded',
//   timeout: 60000
// });


//   console.log(
//     'Login manually once. Profile will be saved automatically.'
//   );

//   console.log(process.argv);

// })();
=======
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const { generalRateLimiter } = require('./middleware/auth');

// Load environment variables
dotenv.config();
>>>>>>> 1733736316645905bc31a5e1807756e703f56709

// Set default NODE_ENV if not defined
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`🔧 Environment: ${NODE_ENV}`);

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

<<<<<<< HEAD
/**
 * Browser Launcher - Launches Chrome browsers for multiple users
 * Uses detected profiles and executable paths
 * Optimized for speed and reliability
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ChromeProfileDetector = require('./profile-fetch');

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    cyan: '\x1b[96m',
    white: '\x1b[37m',
    magenta: '\x1b[35m'
};

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        'info': `${colors.blue}[*]${colors.reset}`,
        'success': `${colors.green}[✓]${colors.reset}`,
        'error': `${colors.red}[!]${colors.reset}`,
        'warning': `${colors.yellow}[⚠]${colors.reset}`,
        'data': `${colors.cyan}[DATA]${colors.reset}`,
        'browser': `${colors.magenta}[BROWSER]${colors.reset}`
    }[type] || `${colors.blue}[*]${colors.reset}`;
    console.log(`${prefix} [${timestamp}] ${message}`);
}

class BrowserLauncher {
    constructor(options = {}) {
        this.profilesBaseDir = options.profilesBaseDir || path.join(__dirname, 'browser-profiles');
        this.maxConcurrent = options.maxConcurrent || 3;
        this.activeBrowsers = new Map();
        this.detector = null;
        this.chromeInfo = null;
        this.availableProfiles = [];
        
        // Ensure base directory exists
        if (!fs.existsSync(this.profilesBaseDir)) {
            fs.mkdirSync(this.profilesBaseDir, { recursive: true });
        }
    }

    /**
     * Initialize - detect Chrome and profiles (cached for speed)
     */
    async initialize() {
        log('Initializing Browser Launcher...', 'info');
        log(`Platform: ${os.platform()} ${os.arch()}`, 'info');
        
        // Load detector (only once)
        if (!this.detector) {
            this.detector = new ChromeProfileDetector();
        }
        
        // Try to load cached profile data first for speed
        const cacheFile = path.join(__dirname, 'chrome-profiles.json');
        let detection = null;
        
        if (fs.existsSync(cacheFile)) {
            try {
                const cacheStats = fs.statSync(cacheFile);
                const cacheAge = (Date.now() - cacheStats.mtimeMs) / 1000 / 60; // minutes
                
                if (cacheAge < 60) { // Cache valid for 1 hour
                    log('Using cached Chrome profile data...', 'info');
                    detection = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
                }
            } catch (e) {
                // Cache invalid, will detect fresh
            }
        }
        
        // If no valid cache, detect fresh
        if (!detection || !detection.chrome?.found) {
            detection = this.detector.detect();
            // Save for future use
            fs.writeFileSync(cacheFile, JSON.stringify(detection, null, 2));
        }
        
        this.chromeInfo = detection.chrome;
        this.availableProfiles = detection.profiles;
        
        if (!this.chromeInfo?.found) {
            throw new Error('Chrome executable not found. Cannot launch browsers.');
        }
        
        log(`Chrome: ${this.chromeInfo.executablePath}`, 'data');
        log(`Available real profiles: ${this.availableProfiles.length}`, 'data');
        
        return this;
    }

    /**
     * Get user profile directory path
     */
    getUserProfileDir(userId) {
        const userDir = path.join(this.profilesBaseDir, `user_${userId}`);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        return userDir;
    }

    /**
     * Launch browser for a single user - FIXED VERSION
     */
    async launchBrowser(userId, options = {}) {
        // Return existing browser if already running
        if (this.activeBrowsers.has(userId)) {
            log(`Browser already running for user_${userId}`, 'warning');
            return this.activeBrowsers.get(userId);
        }

        const userProfileDir = this.getUserProfileDir(userId);
        
        log(`Launching browser for user_${userId}...`, 'browser');
        log(`Profile directory: ${userProfileDir}`, 'data');

        try {
            // FIX: Don't try to get PID from context.browser().process()
            // launchPersistentContext returns a BrowserContext, not Browser
            const launchStartTime = Date.now();
            
            const context = await chromium.launchPersistentContext(
                userProfileDir,  // userDataDir as first parameter
                {
                    headless: options.headless !== undefined ? options.headless : false,
                    channel: 'chrome',
                    executablePath: this.chromeInfo.executablePath,
                    viewport: options.viewport || null,
                    args: [
                        '--start-maximized',
                        '--disable-blink-features=AutomationControlled',
                        '--no-first-run',
                        '--no-default-browser-check',
                        '--disable-extensions', // Speed up launch
                        ...(options.args || [])
                    ]
                }
            );

            const launchTime = ((Date.now() - launchStartTime) / 1000).toFixed(2);
            
            // Get or create a page
            let page;
            if (context.pages().length > 0) {
                page = context.pages()[0];
            } else {
                page = await context.newPage();
            }

            const browserInstance = {
                userId,
                context,
                page,
                profilePath: userProfileDir,
                launchedAt: new Date(),
                launchTimeSeconds: launchTime
            };

            this.activeBrowsers.set(userId, browserInstance);
            
            log(`Browser launched in ${launchTime}s for user_${userId}`, 'success');
            
            return browserInstance;
        } catch (error) {
            log(`Failed to launch browser: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Launch multiple browsers in parallel batches
     */
    async launchMultipleBrowsers(userIds, options = {}) {
        const results = [];
        
        if (userIds.length === 0) {
            log('No users specified', 'warning');
            return results;
        }
        
        log(`Launching ${userIds.length} browser(s) (max parallel: ${this.maxConcurrent})`, 'info');
        const totalStartTime = Date.now();
        
        // Process in batches to respect maxConcurrent
        for (let i = 0; i < userIds.length; i += this.maxConcurrent) {
            const batch = userIds.slice(i, i + this.maxConcurrent);
            const batchNum = Math.floor(i / this.maxConcurrent) + 1;
            
            log(`Batch ${batchNum}/${Math.ceil(userIds.length / this.maxConcurrent)}: Users [${batch.join(', ')}]`, 'browser');
            
            const batchPromises = batch.map(userId =>
                this.launchBrowser(userId, options)
                    .then(result => ({ userId, result, success: true }))
                    .catch(error => ({ userId, error: error.message, success: false }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Log batch results
            batchResults.forEach(r => {
                if (r.success) {
                    log(`✓ User ${r.userId}: Ready in ${r.result.launchTimeSeconds}s`, 'success');
                } else {
                    log(`✗ User ${r.userId}: ${r.error}`, 'error');
                }
            });
        }
        
        const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(2);
        const successful = results.filter(r => r.success).length;
        
        log(`Completed: ${successful}/${userIds.length} browsers launched in ${totalTime}s`, 'info');
        
        return results;
    }

    /**
     * Navigate a user's browser to a URL
     */
    async navigateUser(userId, url, options = {}) {
        const browser = this.activeBrowsers.get(userId);
        if (!browser) {
            throw new Error(`No browser running for user_${userId}`);
        }
        
        log(`Navigating user_${userId} to: ${url}`, 'browser');
        
        try {
            await browser.page.goto(url, {
                waitUntil: options.waitUntil || 'domcontentloaded', // Faster than 'load'
                timeout: options.timeout || 30000
            });
            
            log(`Navigation complete for user_${userId}`, 'success');
            return browser.page;
        } catch (error) {
            log(`Navigation failed for user_${userId}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Execute action on user's page
     */
    async executeOnUser(userId, action) {
        const browser = this.activeBrowsers.get(userId);
        if (!browser) {
            throw new Error(`No browser running for user_${userId}`);
        }
        
        return await action(browser.page);
    }

    /**
     * Close browser for a specific user
     */
    async closeBrowser(userId) {
        const browser = this.activeBrowsers.get(userId);
        if (!browser) {
            log(`No browser running for user_${userId}`, 'warning');
            return;
        }
        
        try {
            await browser.context.close();
            this.activeBrowsers.delete(userId);
            log(`Browser closed for user_${userId}`, 'info');
        } catch (error) {
            log(`Error closing browser for user_${userId}: ${error.message}`, 'error');
        }
    }

    /**
     * Close all browsers
     */
    async closeAllBrowsers() {
        if (this.activeBrowsers.size === 0) {
            log('No active browsers to close', 'info');
            return;
        }
        
        log(`Closing ${this.activeBrowsers.size} browser(s)...`, 'warning');
        
        const userIds = Array.from(this.activeBrowsers.keys());
        const closePromises = userIds.map(userId => this.closeBrowser(userId));
        await Promise.allSettled(closePromises); // Use allSettled to not fail if one errors
        
        log('All browsers closed', 'success');
    }

    /**
     * Get active browsers status
     */
    getStatus() {
        const status = {
            total: this.activeBrowsers.size,
            browsers: []
        };
        
        for (const [userId, browser] of this.activeBrowsers) {
            status.browsers.push({
                userId,
                profilePath: browser.profilePath,
                launchedAt: browser.launchedAt.toISOString(),
                uptimeSeconds: Math.floor((Date.now() - browser.launchedAt.getTime()) / 1000),
                launchTime: browser.launchTimeSeconds
            });
        }
        
        return status;
    }

    /**
     * Print status to console
     */
    printStatus() {
        const status = this.getStatus();
        
        console.log('\n' + '='.repeat(70));
        console.log(`${colors.cyan}📊 ACTIVE BROWSERS${colors.reset}`);
        console.log('='.repeat(70));
        console.log(`Total Active: ${status.total}`);
        console.log(`Chrome: ${this.chromeInfo?.executablePath || 'N/A'}`);
        
        if (status.browsers.length > 0) {
            console.log('\n' + '-'.repeat(70));
            status.browsers.forEach((b, i) => {
                const uptimeMin = Math.floor(b.uptimeSeconds / 60);
                const uptimeSec = b.uptimeSeconds % 60;
                
                console.log(`\n${colors.green}Browser ${i + 1}: User ${b.userId}${colors.reset}`);
                console.log(`  Profile: ${b.profilePath}`);
                console.log(`  Launched: ${new Date(b.launchedAt).toLocaleString()}`);
                console.log(`  Uptime: ${uptimeMin}m ${uptimeSec}s`);
                console.log(`  Launch Time: ${b.launchTime}s`);
            });
        }
        console.log('\n' + '='.repeat(70) + '\n');
    }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log(`${colors.cyan}🚀 CHROME BROWSER LAUNCHER v2.0${colors.reset}`);
    console.log(`${colors.cyan}   Multi-User Parallel Browser Manager${colors.reset}`);
    console.log('='.repeat(70) + '\n');
    
    // Create launcher instance
    const launcher = new BrowserLauncher({
        profilesBaseDir: path.join(__dirname, 'browser-profiles'),
        maxConcurrent: 3
    });
    
    // Initialize (detect Chrome)
    const initStartTime = Date.now();
    await launcher.initialize();
    const initTime = ((Date.now() - initStartTime) / 1000).toFixed(2);
    log(`Initialization completed in ${initTime}s`, 'success');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    // Setup graceful shutdown handler
    const setupShutdownHandler = () => {
        const shutdown = async () => {
            console.log('\n');
            log('Received shutdown signal...', 'warning');
            await launcher.closeAllBrowsers();
            log('Goodbye! 👋', 'info');
            process.exit(0);
        };
        
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('SIGHUP', shutdown);
    };
    
    if (!command) {
        // ============================================================
        // DEFAULT MODE: Single user demo
        // ============================================================
        log('No command specified. Launching demo browser...', 'info');
        
        try {
            // Launch browser for default user
            const browser = await launcher.launchBrowser('1', { 
                headless: false 
            });
            
            // Navigate to Google
            await launcher.navigateUser('1', 'https://google.com', {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
            
            // Show status
            launcher.printStatus();
            
            console.log(`${colors.yellow}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
            console.log(`${colors.yellow}║  Browser is running. Login manually to save profile.        ║${colors.reset}`);
            console.log(`${colors.yellow}║  Press Ctrl+C to close browser and exit.                    ║${colors.reset}`);
            console.log(`${colors.yellow}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
            
            setupShutdownHandler();
            
        } catch (error) {
            log(`Demo failed: ${error.message}`, 'error');
            process.exit(1);
        }
        
    } else {
        // ============================================================
        // COMMAND MODE
        // ============================================================
        switch (command.toLowerCase()) {
            case 'launch':
                const userIds = args.slice(1).length > 0 
                    ? args.slice(1).map(id => id.replace(/[^0-9]/g, '')) 
                    : ['1'];
                
                log(`Launching browsers for users: ${userIds.join(', ')}`, 'info');
                
                const results = await launcher.launchMultipleBrowsers(userIds, {
                    headless: false
                });
                
                // Navigate all to Google
                for (const result of results) {
                    if (result.success) {
                        try {
                            await launcher.navigateUser(result.userId, 'https://google.com');
                        } catch (e) {
                            log(`Navigation error for user ${result.userId}`, 'warning');
                        }
                    }
                }
                
                launcher.printStatus();
                setupShutdownHandler();
                break;
                
            case 'status':
                launcher.printStatus();
                process.exit(0);
                break;
                
            case 'close':
                const closeUserId = args[1]?.replace(/[^0-9]/g, '');
                if (closeUserId) {
                    await launcher.closeBrowser(closeUserId);
                } else {
                    await launcher.closeAllBrowsers();
                }
                process.exit(0);
                break;
                
            case 'list':
                console.log('\n' + '='.repeat(70));
                console.log(`${colors.cyan}📁 AVAILABLE REAL CHROME PROFILES${colors.reset}`);
                console.log('='.repeat(70));
                
                if (launcher.availableProfiles.length === 0) {
                    console.log('No profiles found.');
                } else {
                    launcher.availableProfiles.forEach((profile, i) => {
                        const badge = profile.isDefault ? ` ${colors.green}[DEFAULT]${colors.reset}` : '';
                        console.log(`\n${i + 1}. ${profile.name}${badge}`);
                        console.log(`   Path: ${profile.path}`);
                        console.log(`   Email: ${profile.email || 'N/A'}`);
                        console.log(`   Size: ${profile.sizeFormatted || 'N/A'}`);
                    });
                }
                console.log('\n' + '='.repeat(70) + '\n');
                process.exit(0);
                break;
                
            default:
                console.log(`\n${colors.yellow}📋 Available Commands:${colors.reset}\n`);
                console.log(`  ${colors.green}node server.js${colors.reset}                    - Launch demo browser`);
                console.log(`  ${colors.green}node server.js launch 1 2 3${colors.reset}      - Launch multiple browsers`);
                console.log(`  ${colors.green}node server.js status${colors.reset}              - Show active browsers`);
                console.log(`  ${colors.green}node server.js close [userId]${colors.reset}      - Close browser(s)`);
                console.log(`  ${colors.green}node server.js list${colors.reset}                - List available Chrome profiles`);
                console.log(`\n${colors.yellow}💡 Tips:${colors.reset}`);
                console.log(`  - User IDs can be any number (1, 2, 3, etc.)`);
                console.log(`  - Each user gets isolated browser profile`);
                console.log(`  - Max 3 parallel browsers by default\n`);
                process.exit(0);
                break;
        }
    }
}

// Export for use as module
module.exports = BrowserLauncher;

// Run if executed directly
if (require.main === module) {
    main().catch(async (error) => {
        console.error(`\n${colors.red}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.error(`${colors.red}║  FATAL ERROR                                                 ║${colors.reset}`);
        console.error(`${colors.red}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
        console.error(`${colors.red}${error.message}${colors.reset}`);
        
        if (error.stack) {
            console.error(`\n${colors.yellow}Stack trace (debug):${colors.reset}`);
            console.error(error.stack.split('\n').slice(1, 4).join('\n'));
        }
        
        console.log(`\n${colors.yellow}💡 Troubleshooting:${colors.reset}`);
        console.log('  1. Make sure Chrome is installed');
        console.log('  2. Run: node profile-detector.js to check Chrome detection');
        console.log('  3. Check if another Chrome instance is blocking the profile');
        console.log('  4. Try closing all Chrome windows and retry\n');
        
        process.exit(1);
    });
}
=======
// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
app.use('/api/', generalRateLimiter);

// Routes
app.use('/api/users', userRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Tar-Fance API Server',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: 'GET /api/users/health',
      register: 'POST /api/users/register',
      login: 'POST /api/users/login',
      delete: 'DELETE /api/users/delete'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
>>>>>>> 1733736316645905bc31a5e1807756e703f56709
