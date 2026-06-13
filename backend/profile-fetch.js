#!/usr/bin/env node

/**
 * Cybersecurity Project - Advanced Chrome Forensics Tool
 * Fetches REAL Chrome profile path + all browser information
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    cyan: '\x1b[96m',
    white: '\x1b[37m'
};

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        'info': `${colors.blue}[*]${colors.reset}`,
        'success': `${colors.green}[✓]${colors.reset}`,
        'error': `${colors.red}[!]${colors.reset}`,
        'warning': `${colors.yellow}[⚠]${colors.reset}`,
        'data': `${colors.cyan}[DATA]${colors.reset}`
    }[type];
    console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Technique 1: Get real Chrome profile path from Windows Registry
 */
function getRealChromeProfileFromRegistry() {
    if (process.platform !== 'win32') return null;
    
    try {
        log('Querying Windows Registry for real Chrome profile...', 'info');
        
        // Query registry for Chrome's user data directory
        const command = `reg query "HKCU\\Software\\Google\\Chrome\\UserData" /v "Path" 2>nul`;
        let result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        
        // Parse registry output
        const match = result.match(/Path\s+REG_(?:EXPAND_)?SZ\s+(.*)/);
        if (match && match[1]) {
            const userDataPath = match[1].trim();
            const realProfilePath = path.join(userDataPath, 'Default');
            if (fs.existsSync(realProfilePath)) {
                log(`Real profile found in registry: ${realProfilePath}`, 'success');
                return realProfilePath;
            }
        }
    } catch (e) {
        log('Registry query failed, trying alternative method...', 'warning');
    }
    return null;
}

/**
 * Technique 2: Get real profile from Chrome's Local State file
 */
async function getRealChromeProfileFromLocalState() {
    const possiblePaths = [];
    
    
    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        possiblePaths.push(path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Local State'));
        possiblePaths.push(path.join(localAppData, 'Google', 'Chrome Beta', 'User Data', 'Local State'));
        possiblePaths.push(path.join(localAppData, 'Google', 'Chrome Dev', 'User Data', 'Local State'));
    } else if (process.platform === 'darwin') {
        possiblePaths.push(path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Local State'));
    } else if (process.platform === 'linux') {
        possiblePaths.push(path.join(os.homedir(), '.config', 'google-chrome', 'Local State'));
        possiblePaths.push(path.join(os.homedir(), '.config', 'chromium', 'Local State'));
    }
    
    for (const localStatePath of possiblePaths) {
        if (fs.existsSync(localStatePath)) {
            try {
                const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
                // Get the last used profile or default profile
                const lastUsedProfile = localState.profile?.last_used || 'Default';
                const userDataDir = path.dirname(localStatePath);
                const realProfilePath = path.join(userDataDir, lastUsedProfile);
                
                if (fs.existsSync(realProfilePath)) {
                    log(`Real profile found via Local State: ${realProfilePath}`, 'success');
                    return realProfilePath;
                }
            } catch (e) {
                // Continue to next path
            }
        }
    }
    return null;
}

/**
 * Technique 3: Get real profile from Chrome preferences
 */
async function getRealProfileFromPreferences() {
    const basePaths = [];
    
    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        basePaths.push(path.join(localAppData, 'Google', 'Chrome', 'User Data'));
    } else if (process.platform === 'darwin') {
        basePaths.push(path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome'));
    } else {
        basePaths.push(path.join(os.homedir(), '.config', 'google-chrome'));
    }
    
    for (const userDataDir of basePaths) {
        if (fs.existsSync(userDataDir)) {
            // Get all profile directories
            const items = fs.readdirSync(userDataDir);
            const profiles = items.filter(item => item.startsWith('Profile ') || item === 'Default');
            
            // Get the most recently modified profile
            let latestProfile = null;
            let latestTime = 0;
            
            for (const profile of profiles) {
                const profilePath = path.join(userDataDir, profile);
                if (fs.existsSync(profilePath)) {
                    const stats = fs.statSync(profilePath);
                    if (stats.mtimeMs > latestTime) {
                        latestTime = stats.mtimeMs;
                        latestProfile = profilePath;
                    }
                }
            }
            
            if (latestProfile) {
                log(`Real profile found via directory scan: ${latestProfile}`, 'success');
                return latestProfile;
            }
        }
    }
    return null;
}

/**
 * Technique 4: Get profile from running Chrome instances (via command line)
 */
function getRealProfileFromRunningChrome() {
    try {
        const platform = os.platform();
        let command = '';
        
        if (platform === 'win32') {
            command = `wmic process where "name='chrome.exe'" get commandline 2>nul | findstr /i "user-data-dir"`;
        } else if (platform === 'darwin') {
            command = `ps aux | grep -i "Google Chrome" | grep -i "user-data-dir" | head -1`;
        } else {
            command = `ps aux | grep -i chrome | grep -i "user-data-dir" | head -1`;
        }
        
        const result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        
        // Extract user-data-dir from command line
        const match = result.match(/--user-data-dir[= ]"([^"]+)"/i) || result.match(/--user-data-dir[= ]([^\s]+)/i);
        if (match && match[1]) {
            let profilePath = match[1].trim();
            // Remove temp/playwright profiles
            if (!profilePath.includes('Temp') && !profilePath.includes('playwright')) {
                const defaultProfile = path.join(profilePath, 'Default');
                if (fs.existsSync(defaultProfile)) {
                    log(`Real profile found from running Chrome: ${defaultProfile}`, 'success');
                    return defaultProfile;
                }
            }
        }
    } catch (e) {
        // No running Chrome instance
    }
    return null;
}

/**
 * Technique 5: Use OS-appropriate default path construction
 */
function getRealProfileFromDefaultPath() {
    let realProfilePath = null;
    
    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        realProfilePath = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default');
    } else if (process.platform === 'darwin') {
        realProfilePath = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Default');
    } else if (process.platform === 'linux') {
        realProfilePath = path.join(os.homedir(), '.config', 'google-chrome', 'Default');
    }
    
    if (fs.existsSync(realProfilePath)) {
        log(`Real profile found via default path: ${realProfilePath}`, 'success');
        return realProfilePath;
    }
    
    return null;
}

/**
 * Get all real profile paths using multiple techniques
 */
async function getAllRealProfilePaths() {
    const results = {
        found: [],
        methods: {}
    };
    
    // Try each technique in order of reliability
    const techniques = [
        { name: 'Registry Query', func: () => getRealChromeProfileFromRegistry() },
        { name: 'Local State File', func: () => getRealChromeProfileFromLocalState() },
        { name: 'Preferences Scan', func: () => getRealProfileFromPreferences() },
        { name: 'Running Chrome', func: () => getRealProfileFromRunningChrome() },
        { name: 'Default Path', func: () => getRealProfileFromDefaultPath() }
    ];
    
    for (const technique of techniques) {
        try {
            const profilePath = await technique.func();
            if (profilePath && fs.existsSync(profilePath) && !results.found.includes(profilePath)) {
                results.found.push(profilePath);
                results.methods[technique.name] = profilePath;
            }
        } catch (e) {
            // Silently continue
        }
    }
    
    return results;
}

/**
 * Extract additional browser information from real profile
 */
async function extractBrowserInfoFromRealProfile(profilePath) {
    const info = {};
    
    try {
        // Read Preferences file
        const preferencesPath = path.join(profilePath, 'Preferences');
        if (fs.existsSync(preferencesPath)) {
            const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
            info.account_name = preferences.account_info?.name || null;
            info.email = preferences.account_info?.email || null;
            info.default_search_engine = preferences.default_search_provider?.name || null;
            info.homepage = preferences.homepage || null;
            info.last_known_google_accounts = preferences.profile?.last_known_google_accounts || null;
        }
        
        // Read Local State for additional info
        const userDataDir = path.dirname(profilePath);
        const localStatePath = path.join(userDataDir, 'Local State');
        if (fs.existsSync(localStatePath)) {
            const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
            info.browser_last_used = localState.browser?.last_used || null;
            info.channel = localState.chrome?.channel || null;
            info.version_major = localState.chrome?.version_major || null;
        }
        
        // Get profile size
        const getFolderSize = (dir) => {
            let size = 0;
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir, { withFileTypes: true });
                for (const file of files) {
                    const filePath = path.join(dir, file.name);
                    if (file.isDirectory()) {
                        size += getFolderSize(filePath);
                    } else {
                        size += fs.statSync(filePath).size;
                    }
                }
            }
            return size;
        };
        
        info.profile_size_bytes = getFolderSize(profilePath);
        info.profile_size_mb = (info.profile_size_bytes / (1024 * 1024)).toFixed(2);
        
    } catch (e) {
        info.error = e.message;
    }
    
    return info;
}

/**
 * Main function to get real Chrome profile
 */
async function getRealChromeProfile() {
    console.log('\n' + '='.repeat(70));
    console.log(`${colors.cyan}🔍 REAL CHROME PROFILE DETECTION - FORENSIC ANALYSIS${colors.reset}`);
    console.log('='.repeat(70) + '\n');
    
    log('Starting comprehensive real profile detection...', 'info');
    log(`Platform: ${os.platform()} ${os.arch()}`, 'info');
    log(`Hostname: ${os.hostname()}`, 'info');
    console.log();
    
    // Get all real profile paths
    const profileResults = await getAllRealProfilePaths();
    
    if (profileResults.found.length === 0) {
        log('No real Chrome profile found! Is Chrome installed?', 'error');
        return null;
    }
    
    log(`Found ${profileResults.found.length} real Chrome profile(s)`, 'success');
    console.log();
    
    // Display all methods that succeeded
    console.log(`${colors.yellow}📋 Detection Methods Used:${colors.reset}`);
    for (const [method, path] of Object.entries(profileResults.methods)) {
        console.log(`   ${colors.green}✓${colors.reset} ${method}: ${colors.cyan}${path}${colors.reset}`);
    }
    console.log();
    
    // Use the first found profile as primary
    const realProfilePath = profileResults.found[0];
    
    // Extract additional information from the real profile
    log('Extracting browser information from real profile...', 'info');
    const browserInfo = await extractBrowserInfoFromRealProfile(realProfilePath);
    
    // Display the real profile information
    console.log('\n' + '='.repeat(70));
    console.log(`${colors.white}📁 REAL CHROME PROFILE INFORMATION${colors.reset}`);
    console.log('='.repeat(70));
    console.log(`${colors.green}Real Profile Path:${colors.reset} ${colors.cyan}${realProfilePath}${colors.reset}`);
    console.log(`${colors.green}Profile Size:${colors.reset}      ${browserInfo.profile_size_mb} MB (${browserInfo.profile_size_bytes.toLocaleString()} bytes)`);
    
    if (browserInfo.account_name) {
        console.log(`${colors.green}Account Name:${colors.reset}    ${browserInfo.account_name}`);
    }
    if (browserInfo.email) {
        console.log(`${colors.green}Email:${colors.reset}           ${browserInfo.email}`);
    }
    if (browserInfo.version_major) {
        console.log(`${colors.green}Chrome Version:${colors.reset}   ${browserInfo.version_major}`);
    }
    if (browserInfo.channel) {
        console.log(`${colors.green}Channel:${colors.reset}         ${browserInfo.channel}`);
    }
    if (browserInfo.default_search_engine) {
        console.log(`${colors.green}Default Search:${colors.reset}  ${browserInfo.default_search_engine}`);
    }
    console.log('='.repeat(70));
    
    return {
        realProfilePath,
        detectionMethods: profileResults.methods,
        profileInfo: browserInfo
    };
}

/**
 * Create forensic report
 */
async function createForensicReport(realProfileData) {
    const report = {
        timestamp: new Date().toISOString(),
        system_info: {
            platform: os.platform(),
            architecture: os.arch(),
            hostname: os.hostname(),
            username: os.userInfo().username,
            os_version: os.release(),
            total_memory: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`
        },
        real_chrome_profile: realProfileData,
        notes: [
            "This is the REAL Chrome profile path, not a temporary Playwright profile",
            "Playwright typically creates temp profiles at: %TEMP%\\playwright_*",
            "Real user profiles contain browsing history, cookies, extensions, etc.",
            "Access to real profiles requires appropriate permissions"
        ]
    };
    
    const reportPath = path.join(__dirname, 'forensic_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Forensic report saved: ${reportPath}`, 'success');
    
    return reportPath;
}

// Run the real profile detection
async function main() {
    try {
        const realProfileData = await getRealChromeProfile();
        
        if (realProfileData) {
            await createForensicReport(realProfileData);
            
            console.log('\n' + '='.repeat(70));
            console.log(`${colors.green}✅ SUCCESS: Real Chrome Profile Detected!${colors.reset}`);
            console.log('='.repeat(70));
            console.log(`
${colors.yellow}🔐 Ethical Hacking Note:${colors.reset}
- The temporary profile shown by Playwright is ISOLATED from real user data
- Your REAL Chrome profile contains sensitive data (bookmarks, history, cookies)
- This script demonstrates MULTIPLE forensic techniques to locate real profiles
- For your project, explain that Playwright uses isolated profiles for security

${colors.yellow}📚 For your College Project Report:${colors.reset}
1. Explain that chrome://version shows Playwright's TEMPORARY profile
2. Document the techniques above to find the REAL profile path
3. Demonstrate understanding of Chrome's multi-profile architecture
4. Include the registry, Local State file, and running process methods
`);
            
        } else {
            log('Could not detect real Chrome profile', 'error');
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
    }
}

// Execute if run directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { getRealChromeProfile, getAllRealProfilePaths };
