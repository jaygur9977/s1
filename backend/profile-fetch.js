// #!/usr/bin/env node

// /**
//  * Cybersecurity Project - Advanced Chrome Forensics Tool
//  * Fetches REAL Chrome profile path + all browser information
//  */

// const { execSync } = require('child_process');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const { promisify } = require('util');
// const readFile = promisify(fs.readFile);

// // Colors for output
// const colors = {
//     reset: '\x1b[0m',
//     green: '\x1b[32m',
//     red: '\x1b[31m',
//     yellow: '\x1b[33m',
//     blue: '\x1b[36m',
//     cyan: '\x1b[96m',
//     white: '\x1b[37m'
// };

// function log(message, type = 'info') {
//     const timestamp = new Date().toLocaleTimeString();
//     const prefix = {
//         'info': `${colors.blue}[*]${colors.reset}`,
//         'success': `${colors.green}[✓]${colors.reset}`,
//         'error': `${colors.red}[!]${colors.reset}`,
//         'warning': `${colors.yellow}[⚠]${colors.reset}`,
//         'data': `${colors.cyan}[DATA]${colors.reset}`
//     }[type];
//     console.log(`${prefix} [${timestamp}] ${message}`);
// }

// /**
//  * Technique 1: Get real Chrome profile path from Windows Registry
//  */
// function getRealChromeProfileFromRegistry() {
//     if (process.platform !== 'win32') return null;
    
//     try {
//         log('Querying Windows Registry for real Chrome profile...', 'info');
        
//         // Query registry for Chrome's user data directory
//         const command = `reg query "HKCU\\Software\\Google\\Chrome\\UserData" /v "Path" 2>nul`;
//         let result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        
//         // Parse registry output
//         const match = result.match(/Path\s+REG_(?:EXPAND_)?SZ\s+(.*)/);
//         if (match && match[1]) {
//             const userDataPath = match[1].trim();
//             const realProfilePath = path.join(userDataPath, 'Default');
//             if (fs.existsSync(realProfilePath)) {
//                 log(`Real profile found in registry: ${realProfilePath}`, 'success');
//                 return realProfilePath;
//             }
//         }
//     } catch (e) {
//         log('Registry query failed, trying alternative method...', 'warning');
//     }
//     return null;
// }

// /**
//  * Technique 2: Get real profile from Chrome's Local State file
//  */
// async function getRealChromeProfileFromLocalState() {
//     const possiblePaths = [];
    
    
//     if (process.platform === 'win32') {
//         const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
//         possiblePaths.push(path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Local State'));
//         possiblePaths.push(path.join(localAppData, 'Google', 'Chrome Beta', 'User Data', 'Local State'));
//         possiblePaths.push(path.join(localAppData, 'Google', 'Chrome Dev', 'User Data', 'Local State'));
//     } else if (process.platform === 'darwin') {
//         possiblePaths.push(path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Local State'));
//     } else if (process.platform === 'linux') {
//         possiblePaths.push(path.join(os.homedir(), '.config', 'google-chrome', 'Local State'));
//         possiblePaths.push(path.join(os.homedir(), '.config', 'chromium', 'Local State'));
//     }
    
//     for (const localStatePath of possiblePaths) {
//         if (fs.existsSync(localStatePath)) {
//             try {
//                 const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
//                 // Get the last used profile or default profile
//                 const lastUsedProfile = localState.profile?.last_used || 'Default';
//                 const userDataDir = path.dirname(localStatePath);
//                 const realProfilePath = path.join(userDataDir, lastUsedProfile);
                
//                 if (fs.existsSync(realProfilePath)) {
//                     log(`Real profile found via Local State: ${realProfilePath}`, 'success');
//                     return realProfilePath;
//                 }
//             } catch (e) {
//                 // Continue to next path
//             }
//         }
//     }
//     return null;
// }

// /**
//  * Technique 3: Get real profile from Chrome preferences
//  */
// async function getRealProfileFromPreferences() {
//     const basePaths = [];
    
//     if (process.platform === 'win32') {
//         const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
//         basePaths.push(path.join(localAppData, 'Google', 'Chrome', 'User Data'));
//     } else if (process.platform === 'darwin') {
//         basePaths.push(path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome'));
//     } else {
//         basePaths.push(path.join(os.homedir(), '.config', 'google-chrome'));
//     }
    
//     for (const userDataDir of basePaths) {
//         if (fs.existsSync(userDataDir)) {
//             // Get all profile directories
//             const items = fs.readdirSync(userDataDir);
//             const profiles = items.filter(item => item.startsWith('Profile ') || item === 'Default');
            
//             // Get the most recently modified profile
//             let latestProfile = null;
//             let latestTime = 0;
            
//             for (const profile of profiles) {
//                 const profilePath = path.join(userDataDir, profile);
//                 if (fs.existsSync(profilePath)) {
//                     const stats = fs.statSync(profilePath);
//                     if (stats.mtimeMs > latestTime) {
//                         latestTime = stats.mtimeMs;
//                         latestProfile = profilePath;
//                     }
//                 }
//             }
            
//             if (latestProfile) {
//                 log(`Real profile found via directory scan: ${latestProfile}`, 'success');
//                 return latestProfile;
//             }
//         }
//     }
//     return null;
// }

// /**
//  * Technique 4: Get profile from running Chrome instances (via command line)
//  */
// function getRealProfileFromRunningChrome() {
//     try {
//         const platform = os.platform();
//         let command = '';
        
//         if (platform === 'win32') {
//             command = `wmic process where "name='chrome.exe'" get commandline 2>nul | findstr /i "user-data-dir"`;
//         } else if (platform === 'darwin') {
//             command = `ps aux | grep -i "Google Chrome" | grep -i "user-data-dir" | head -1`;
//         } else {
//             command = `ps aux | grep -i chrome | grep -i "user-data-dir" | head -1`;
//         }
        
//         const result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        
//         // Extract user-data-dir from command line
//         const match = result.match(/--user-data-dir[= ]"([^"]+)"/i) || result.match(/--user-data-dir[= ]([^\s]+)/i);
//         if (match && match[1]) {
//             let profilePath = match[1].trim();
//             // Remove temp/playwright profiles
//             if (!profilePath.includes('Temp') && !profilePath.includes('playwright')) {
//                 const defaultProfile = path.join(profilePath, 'Default');
//                 if (fs.existsSync(defaultProfile)) {
//                     log(`Real profile found from running Chrome: ${defaultProfile}`, 'success');
//                     return defaultProfile;
//                 }
//             }
//         }
//     } catch (e) {
//         // No running Chrome instance
//     }
//     return null;
// }

// /**
//  * Technique 5: Use OS-appropriate default path construction
//  */
// function getRealProfileFromDefaultPath() {
//     let realProfilePath = null;
    
//     if (process.platform === 'win32') {
//         const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
//         realProfilePath = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default');
//     } else if (process.platform === 'darwin') {
//         realProfilePath = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Default');
//     } else if (process.platform === 'linux') {
//         realProfilePath = path.join(os.homedir(), '.config', 'google-chrome', 'Default');
//     }
    
//     if (fs.existsSync(realProfilePath)) {
//         log(`Real profile found via default path: ${realProfilePath}`, 'success');
//         return realProfilePath;
//     }
    
//     return null;
// }

// /**
//  * Get all real profile paths using multiple techniques
//  */
// async function getAllRealProfilePaths() {
//     const results = {
//         found: [],
//         methods: {}
//     };
    
//     // Try each technique in order of reliability
//     const techniques = [
//         { name: 'Registry Query', func: () => getRealChromeProfileFromRegistry() },
//         { name: 'Local State File', func: () => getRealChromeProfileFromLocalState() },
//         { name: 'Preferences Scan', func: () => getRealProfileFromPreferences() },
//         { name: 'Running Chrome', func: () => getRealProfileFromRunningChrome() },
//         { name: 'Default Path', func: () => getRealProfileFromDefaultPath() }
//     ];
    
//     for (const technique of techniques) {
//         try {
//             const profilePath = await technique.func();
//             if (profilePath && fs.existsSync(profilePath) && !results.found.includes(profilePath)) {
//                 results.found.push(profilePath);
//                 results.methods[technique.name] = profilePath;
//             }
//         } catch (e) {
//             // Silently continue
//         }
//     }
    
//     return results;
// }

// /**
//  * Extract additional browser information from real profile
//  */
// async function extractBrowserInfoFromRealProfile(profilePath) {
//     const info = {};
    
//     try {
//         // Read Preferences file
//         const preferencesPath = path.join(profilePath, 'Preferences');
//         if (fs.existsSync(preferencesPath)) {
//             const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
//             info.account_name = preferences.account_info?.name || null;
//             info.email = preferences.account_info?.email || null;
//             info.default_search_engine = preferences.default_search_provider?.name || null;
//             info.homepage = preferences.homepage || null;
//             info.last_known_google_accounts = preferences.profile?.last_known_google_accounts || null;
//         }
        
//         // Read Local State for additional info
//         const userDataDir = path.dirname(profilePath);
//         const localStatePath = path.join(userDataDir, 'Local State');
//         if (fs.existsSync(localStatePath)) {
//             const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
//             info.browser_last_used = localState.browser?.last_used || null;
//             info.channel = localState.chrome?.channel || null;
//             info.version_major = localState.chrome?.version_major || null;
//         }
        
//         // Get profile size
//         const getFolderSize = (dir) => {
//             let size = 0;
//             if (fs.existsSync(dir)) {
//                 const files = fs.readdirSync(dir, { withFileTypes: true });
//                 for (const file of files) {
//                     const filePath = path.join(dir, file.name);
//                     if (file.isDirectory()) {
//                         size += getFolderSize(filePath);
//                     } else {
//                         size += fs.statSync(filePath).size;
//                     }
//                 }
//             }
//             return size;
//         };
        
//         info.profile_size_bytes = getFolderSize(profilePath);
//         info.profile_size_mb = (info.profile_size_bytes / (1024 * 1024)).toFixed(2);
        
//     } catch (e) {
//         info.error = e.message;
//     }
    
//     return info;
// }

// /**
//  * Main function to get real Chrome profile
//  */
// async function getRealChromeProfile() {
//     console.log('\n' + '='.repeat(70));
//     console.log(`${colors.cyan}🔍 REAL CHROME PROFILE DETECTION - FORENSIC ANALYSIS${colors.reset}`);
//     console.log('='.repeat(70) + '\n');
    
//     log('Starting comprehensive real profile detection...', 'info');
//     log(`Platform: ${os.platform()} ${os.arch()}`, 'info');
//     log(`Hostname: ${os.hostname()}`, 'info');
//     console.log();
    
//     // Get all real profile paths
//     const profileResults = await getAllRealProfilePaths();
    
//     if (profileResults.found.length === 0) {
//         log('No real Chrome profile found! Is Chrome installed?', 'error');
//         return null;
//     }
    
//     log(`Found ${profileResults.found.length} real Chrome profile(s)`, 'success');
//     console.log();
    
//     // Display all methods that succeeded
//     console.log(`${colors.yellow}📋 Detection Methods Used:${colors.reset}`);
//     for (const [method, path] of Object.entries(profileResults.methods)) {
//         console.log(`   ${colors.green}✓${colors.reset} ${method}: ${colors.cyan}${path}${colors.reset}`);
//     }
//     console.log();
    
//     // Use the first found profile as primary
//     const realProfilePath = profileResults.found[0];
    
//     // Extract additional information from the real profile
//     log('Extracting browser information from real profile...', 'info');
//     const browserInfo = await extractBrowserInfoFromRealProfile(realProfilePath);
    
//     // Display the real profile information
//     console.log('\n' + '='.repeat(70));
//     console.log(`${colors.white}📁 REAL CHROME PROFILE INFORMATION${colors.reset}`);
//     console.log('='.repeat(70));
//     console.log(`${colors.green}Real Profile Path:${colors.reset} ${colors.cyan}${realProfilePath}${colors.reset}`);
//     console.log(`${colors.green}Profile Size:${colors.reset}      ${browserInfo.profile_size_mb} MB (${browserInfo.profile_size_bytes.toLocaleString()} bytes)`);
    
//     if (browserInfo.account_name) {
//         console.log(`${colors.green}Account Name:${colors.reset}    ${browserInfo.account_name}`);
//     }
//     if (browserInfo.email) {
//         console.log(`${colors.green}Email:${colors.reset}           ${browserInfo.email}`);
//     }
//     if (browserInfo.version_major) {
//         console.log(`${colors.green}Chrome Version:${colors.reset}   ${browserInfo.version_major}`);
//     }
//     if (browserInfo.channel) {
//         console.log(`${colors.green}Channel:${colors.reset}         ${browserInfo.channel}`);
//     }
//     if (browserInfo.default_search_engine) {
//         console.log(`${colors.green}Default Search:${colors.reset}  ${browserInfo.default_search_engine}`);
//     }
//     console.log('='.repeat(70));
    
//     return {
//         realProfilePath,
//         detectionMethods: profileResults.methods,
//         profileInfo: browserInfo
//     };
// }

// /**
//  * Create forensic report
//  */
// async function createForensicReport(realProfileData) {
//     const report = {
//         timestamp: new Date().toISOString(),
//         system_info: {
//             platform: os.platform(),
//             architecture: os.arch(),
//             hostname: os.hostname(),
//             username: os.userInfo().username,
//             os_version: os.release(),
//             total_memory: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`
//         },
//         real_chrome_profile: realProfileData,
//         notes: [
//             "This is the REAL Chrome profile path, not a temporary Playwright profile",
//             "Playwright typically creates temp profiles at: %TEMP%\\playwright_*",
//             "Real user profiles contain browsing history, cookies, extensions, etc.",
//             "Access to real profiles requires appropriate permissions"
//         ]
//     };
    
//     const reportPath = path.join(__dirname, 'forensic_report.json');
//     fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
//     log(`Forensic report saved: ${reportPath}`, 'success');
    
//     return reportPath;
// }

// // Run the real profile detection
// async function main() {
//     try {
//         const realProfileData = await getRealChromeProfile();
        
//         if (realProfileData) {
//             await createForensicReport(realProfileData);
            
//             console.log('\n' + '='.repeat(70));
//             console.log(`${colors.green}✅ SUCCESS: Real Chrome Profile Detected!${colors.reset}`);
//             console.log('='.repeat(70));
//             console.log(`
// ${colors.yellow}🔐 Ethical Hacking Note:${colors.reset}
// - The temporary profile shown by Playwright is ISOLATED from real user data
// - Your REAL Chrome profile contains sensitive data (bookmarks, history, cookies)
// - This script demonstrates MULTIPLE forensic techniques to locate real profiles
// - For your project, explain that Playwright uses isolated profiles for security

// ${colors.yellow}📚 For your College Project Report:${colors.reset}
// 1. Explain that chrome://version shows Playwright's TEMPORARY profile
// 2. Document the techniques above to find the REAL profile path
// 3. Demonstrate understanding of Chrome's multi-profile architecture
// 4. Include the registry, Local State file, and running process methods
// `);
            
//         } else {
//             log('Could not detect real Chrome profile', 'error');
//         }
//     } catch (error) {
//         log(`Error: ${error.message}`, 'error');
//     }
// }

// // Execute if run directly
// if (require.main === module) {
//     main().catch(console.error);
// }

// module.exports = { getRealChromeProfile, getAllRealProfilePaths };





const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for output
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
        'profile': `${colors.magenta}[PROFILE]${colors.reset}`
    }[type] || `${colors.blue}[*]${colors.reset}`;
    console.log(`${prefix} [${timestamp}] ${message}`);
}

class ChromeProfileDetector {
    constructor() {
        this.platform = os.platform();
        this.arch = os.arch(); // 'x64', 'arm64' (M1/M2 Macs)
        this.isAppleSilicon = this.platform === 'darwin' && this.arch === 'arm64';
    }

    /**
     * Detect Chrome executable path based on platform
     */
    detectChromeExecutable() {
        log(`Detecting Chrome on ${this.platform} (${this.arch})...`, 'info');
        
        if (this.isAppleSilicon) {
            log('Apple Silicon (M1/M2/M3) detected - checking Rosetta and native paths', 'info');
        }

        const methods = {
            'win32': this.detectWindowsChrome.bind(this),
            'darwin': this.detectMacChrome.bind(this),
            'linux': this.detectLinuxChrome.bind(this)
        };

        const detector = methods[this.platform];
        if (!detector) {
            throw new Error(`Unsupported platform: ${this.platform}`);
        }

        const result = detector();
        
        if (result.path) {
            log(`Chrome found: ${result.path}`, 'success');
            log(`Detection method: ${result.method}`, 'data');
        } else {
            log('Chrome not found! Please install Google Chrome.', 'error');
            log('Download from: https://www.google.com/chrome/', 'warning');
        }

        return result;
    }

    /**
     * Windows Chrome detection
     */
    detectWindowsChrome() {
        const searchPaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
            path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
            path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
        ];

        // Try direct paths first
        for (const exePath of searchPaths) {
            if (fs.existsSync(exePath)) {
                return { path: exePath, method: 'Direct Path' };
            }
        }

        // Try registry
        try {
            const regCommands = [
                'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul',
                'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul'
            ];

            for (const cmd of regCommands) {
                const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                const match = result.match(/([A-Z]:\\.+?chrome\.exe)/i);
                if (match && match[1] && fs.existsSync(match[1])) {
                    return { path: match[1], method: 'Registry' };
                }
            }
        } catch (e) {}

        // Try running processes
        try {
            const wmicResult = execSync(
                'wmic process where "name=\'chrome.exe\'" get ExecutablePath 2>nul',
                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
            );
            const match = wmicResult.match(/([A-Z]:\\.+?chrome\.exe)/i);
            if (match && match[1] && fs.existsSync(match[1])) {
                return { path: match[1], method: 'Running Process' };
            }
        } catch (e) {}

        return { path: null, method: null };
    }

    /**
     * macOS Chrome detection (Intel + Apple Silicon)
     */
    detectMacChrome() {
        const searchPaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            path.join(os.homedir(), 'Applications/Chromium.app/Contents/MacOS/Chromium'),
        ];

        // Try direct paths
        for (const macPath of searchPaths) {
            if (fs.existsSync(macPath)) {
                return { path: macPath, method: 'Direct Path' };
            }
        }

        // Try Spotlight search
        try {
            const result = execSync(
                'mdfind "kMDItemCFBundleIdentifier == \'com.google.Chrome\'" 2>/dev/null | head -1',
                { encoding: 'utf8', shell: '/bin/bash' }
            ).trim();
            
            if (result) {
                const chromePath = path.join(result, 'Contents/MacOS/Google Chrome');
                if (fs.existsSync(chromePath)) {
                    return { path: chromePath, method: 'Spotlight Search' };
                }
            }
        } catch (e) {}

        // Try lsregister (macOS app database)
        try {
            const lsregister = '/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister';
            const result = execSync(
                `${lsregister} -dump 2>/dev/null | grep -i "google chrome" | head -1`,
                { encoding: 'utf8', shell: '/bin/bash' }
            );
            const match = result.match(/^\s*path:\s*(.+)$/im);
            if (match) {
                const appPath = match[1].trim();
                const chromePath = path.join(appPath, 'Contents/MacOS/Google Chrome');
                if (fs.existsSync(chromePath)) {
                    return { path: chromePath, method: 'App Registry' };
                }
            }
        } catch (e) {}

        return { path: null, method: null };
    }

    /**
     * Linux Chrome detection
     */
    detectLinuxChrome() {
        // Try which command for various Chrome variants
        const binaries = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'google-chrome-beta', 'google-chrome-unstable'];
        
        for (const binary of binaries) {
            try {
                const result = execSync(`which ${binary} 2>/dev/null`, { 
                    encoding: 'utf8', 
                    shell: '/bin/bash' 
                }).trim();
                if (result && fs.existsSync(result)) {
                    return { path: result, method: 'which Command' };
                }
            } catch (e) {
                continue;
            }
        }

        // Check common Linux paths
        const commonPaths = [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
            '/usr/local/bin/google-chrome',
            '/opt/google/chrome/chrome',
        ];

        for (const linuxPath of commonPaths) {
            if (fs.existsSync(linuxPath)) {
                return { path: linuxPath, method: 'Common Path' };
            }
        }

        return { path: null, method: null };
    }

    /**
     * Get all Chrome user data directories
     */
    getUserDataDirectories() {
        const dirs = [];
        
        if (this.platform === 'win32') {
            const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
            dirs.push(path.join(localAppData, 'Google', 'Chrome', 'User Data'));
            dirs.push(path.join(localAppData, 'Google', 'Chrome Beta', 'User Data'));
            dirs.push(path.join(localAppData, 'Google', 'Chrome Dev', 'User Data'));
            dirs.push(path.join(localAppData, 'Google', 'Chrome SxS', 'User Data'));
        } else if (this.platform === 'darwin') {
            dirs.push(path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome'));
            dirs.push(path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome Beta'));
            dirs.push(path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome Dev'));
        } else if (this.platform === 'linux') {
            dirs.push(path.join(os.homedir(), '.config', 'google-chrome'));
            dirs.push(path.join(os.homedir(), '.config', 'google-chrome-beta'));
            dirs.push(path.join(os.homedir(), '.config', 'google-chrome-unstable'));
            dirs.push(path.join(os.homedir(), '.config', 'chromium'));
        }

        return dirs.filter(dir => fs.existsSync(dir));
    }

    /**
     * Get directory size (recursive)
     */
    getDirectorySize(dirPath) {
        let size = 0;
        try {
            if (!fs.existsSync(dirPath)) return 0;
            
            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                try {
                    if (file.isDirectory()) {
                        size += this.getDirectorySize(filePath);
                    } else {
                        const stats = fs.statSync(filePath);
                        size += stats.size;
                    }
                } catch (e) {
                    // Skip inaccessible files
                }
            }
        } catch (e) {
            // Skip inaccessible directories
        }
        return size;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get profile info from Local State file
     */
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
                    // Read Preferences for additional info
                    let accountInfo = {};
                    const prefsPath = path.join(profilePath, 'Preferences');
                    if (fs.existsSync(prefsPath)) {
                        try {
                            const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
                            accountInfo = {
                                email: prefs.account_info?.[0]?.email || null,
                                fullName: prefs.account_info?.[0]?.full_name || null,
                                gaiaId: prefs.account_info?.[0]?.gaia || null
                            };
                        } catch (e) {}
                    }

                    const profileSize = this.getDirectorySize(profilePath);
                    
                    profiles.push({
                        name: info.name || profileDir,
                        path: profilePath,
                        profileDir: profileDir,
                        isDefault: profileDir === 'Default',
                        size: profileSize,
                        sizeFormatted: this.formatBytes(profileSize),
                        email: info.user_name || accountInfo.email || null,
                        displayName: info.gaia_name || accountInfo.fullName || null,
                        avatarUrl: info.avatar_icon || null,
                        lastUsed: info.last_active_time ? new Date(info.last_active_time) : null,
                        isEphemeral: info.is_ephemeral || false,
                        isOmitted: info.is_omitted_from_profile_list || false,
                        userName: info.user_name || null,
                        gaiaId: info.gaia_id || accountInfo.gaiaId || null
                    });
                }
            }

            // Sort: Default first, then by email (profiles with accounts first), then by last used
            profiles.sort((a, b) => {
                if (a.isDefault) return -1;
                if (b.isDefault) return 1;
                if (a.email && !b.email) return -1;
                if (!a.email && b.email) return 1;
                if (a.lastUsed && b.lastUsed) return b.lastUsed - a.lastUsed;
                return 0;
            });

        } catch (e) {
            log(`Error reading Local State: ${e.message}`, 'error');
        }

        return profiles;
    }

    /**
     * Get ALL Chrome profiles from all user data directories
     */
    getAllProfiles() {
        const allProfiles = [];
        const userDataDirs = this.getUserDataDirectories();

        log(`Found ${userDataDirs.length} Chrome user data director${userDataDirs.length > 1 ? 'ies' : 'y'}`, 'info');

        for (const userDataDir of userDataDirs) {
            log(`Scanning: ${userDataDir}`, 'profile');
            const profiles = this.getProfilesFromLocalState(userDataDir);
            
            // Add user data dir info to each profile
            profiles.forEach(profile => {
                profile.userDataDir = userDataDir;
                profile.chromeVariant = path.basename(path.dirname(userDataDir));
            });
            
            allProfiles.push(...profiles);
        }

        return allProfiles;
    }

    /**
     * Full detection - returns everything needed
     */
    detect() {
        const result = {
            platform: this.platform,
            architecture: this.arch,
            isAppleSilicon: this.isAppleSilicon,
            hostname: os.hostname(),
            username: os.userInfo().username,
            homeDir: os.homedir(),
            chrome: null,
            profiles: [],
            timestamp: new Date().toISOString()
        };

        // Detect Chrome executable
        const chromeDetection = this.detectChromeExecutable();
        result.chrome = {
            executablePath: chromeDetection.path,
            detectionMethod: chromeDetection.method,
            found: !!chromeDetection.path
        };

        // Get all profiles
        result.profiles = this.getAllProfiles();

        return result;
    }

    /**
     * Print summary to console
     */
    printSummary(result) {
        console.log('\n' + '='.repeat(70));
        console.log(`${colors.cyan}🔍 CHROME PROFILE DETECTION SUMMARY${colors.reset}`);
        console.log('='.repeat(70));
        console.log(`${colors.white}Platform:${colors.reset} ${result.platform} ${result.architecture}${result.isAppleSilicon ? ' (Apple Silicon)' : ''}`);
        console.log(`${colors.white}Hostname:${colors.reset} ${result.hostname}`);
        console.log(`${colors.white}Username:${colors.reset} ${result.username}`);
        console.log(`${colors.white}Chrome:${colors.reset} ${result.chrome.found ? colors.green + 'Found ✓' : colors.red + 'Not Found ✗'}${colors.reset}`);
        
        if (result.chrome.found) {
            console.log(`${colors.white}Executable:${colors.reset} ${result.chrome.executablePath}`);
            console.log(`${colors.white}Detection:${colors.reset} ${result.chrome.detectionMethod}`);
        }
        
        console.log(`${colors.white}Profiles:${colors.reset} ${result.profiles.length} found`);
        console.log('='.repeat(70) + '\n');

        if (result.profiles.length === 0) {
            log('No Chrome profiles found. Is Chrome installed?', 'warning');
            return;
        }

        // Print detailed profile list
        result.profiles.forEach((profile, index) => {
            const badge = profile.isDefault ? `${colors.green}[DEFAULT]${colors.reset} ` : '';
            const emailBadge = profile.email ? `${colors.yellow}[${profile.email}]${colors.reset}` : '';
            
            console.log(`${colors.cyan}${badge}Profile ${index + 1}:${colors.reset} ${profile.name} ${emailBadge}`);
            console.log(`   ${colors.white}Path:${colors.reset} ${profile.path}`);
            console.log(`   ${colors.white}Size:${colors.reset} ${profile.sizeFormatted}`);
            console.log(`   ${colors.white}Directory:${colors.reset} ${profile.profileDir}`);
            console.log(`   ${colors.white}User Data:${colors.reset} ${profile.userDataDir}`);
            
            if (profile.displayName) {
                console.log(`   ${colors.white}Display Name:${colors.reset} ${profile.displayName}`);
            }
            
            if (profile.lastUsed) {
                console.log(`   ${colors.white}Last Used:${colors.reset} ${profile.lastUsed.toLocaleString()}`);
            }
            
            console.log();
        });
    }
}

// Export for use in other files
module.exports = ChromeProfileDetector;

// Run standalone if executed directly
if (require.main === module) {
    const detector = new ChromeProfileDetector();
    const result = detector.detect();
    detector.printSummary(result);
    
    // Optionally save to JSON
    const outputPath = path.join(__dirname, 'chrome-profiles.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    log(`Profile data saved to: ${outputPath}`, 'success');
}