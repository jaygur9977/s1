const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Chrome Profile Detector Service
 * Detects Chrome executable path and user profiles
 */
class ChromeDetector {
    constructor() {
        this.platform = os.platform();
        this.arch = os.arch();
    }

    /**
     * Detect Chrome executable path based on platform
     */
    detectChromeExecutable() {
        console.log(`🔍 Detecting Chrome on ${this.platform} (${this.arch})...`);

        if (this.platform === 'win32') {
            return this._detectWindowsChrome();
        } else if (this.platform === 'darwin') {
            return this._detectMacChrome();
        } else {
            return this._detectLinuxChrome();
        }
    }

    /**
     * Windows Chrome detection
     */
    _detectWindowsChrome() {
        // Method 1: Check common installation paths
        const searchPaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
            path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
            path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
        ];

        for (const exePath of searchPaths) {
            if (fs.existsSync(exePath)) {
                console.log(`   ✅ Found: ${exePath}`);
                return { path: exePath, method: 'Direct Path', platform: 'win32' };
            }
        }

        // Method 2: Registry query
        try {
            const regCommands = [
                'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul',
                'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul',
                'reg query "HKCU\\Software\\Google\\Chrome\\BLBeacon" /v "version" 2>nul'
            ];

            for (const cmd of regCommands) {
                try {
                    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                    const match = result.match(/([A-Z]:\\.+?chrome\.exe)/i);
                    if (match && match[1] && fs.existsSync(match[1])) {
                        console.log(`   ✅ Found via Registry: ${match[1]}`);
                        return { path: match[1], method: 'Registry', platform: 'win32' };
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (e) {
            // Registry access failed
        }

        // Method 3: Check running processes
        try {
            const wmicResult = execSync(
                'wmic process where "name=\'chrome.exe\'" get ExecutablePath 2>nul',
                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
            );
            const lines = wmicResult.split('\n').filter(line => line.trim());
            if (lines.length > 1 && lines[1].trim()) {
                const processPath = lines[1].trim();
                if (fs.existsSync(processPath)) {
                    console.log(`   ✅ Found via Running Process: ${processPath}`);
                    return { path: processPath, method: 'Running Process', platform: 'win32' };
                }
            }
        } catch (e) {
            // Process detection failed
        }

        console.log('   ❌ Chrome not found on Windows');
        return { path: null, method: null, platform: 'win32' };
    }

    /**
     * macOS Chrome detection (Intel + Apple Silicon)
     */
    _detectMacChrome() {
        const searchPaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ];

        // Method 1: Direct paths
        for (const macPath of searchPaths) {
            if (fs.existsSync(macPath)) {
                console.log(`   ✅ Found: ${macPath}`);
                return { path: macPath, method: 'Direct Path', platform: 'darwin' };
            }
        }

        // Method 2: Spotlight search
        try {
            const result = execSync(
                'mdfind "kMDItemCFBundleIdentifier == \'com.google.Chrome\'" 2>/dev/null | head -1',
                { encoding: 'utf8', shell: '/bin/bash' }
            ).trim();
            
            if (result) {
                const chromePath = path.join(result, 'Contents/MacOS/Google Chrome');
                if (fs.existsSync(chromePath)) {
                    console.log(`   ✅ Found via Spotlight: ${chromePath}`);
                    return { path: chromePath, method: 'Spotlight Search', platform: 'darwin' };
                }
            }
        } catch (e) {
            // Spotlight search failed
        }

        console.log('   ❌ Chrome not found on macOS');
        return { path: null, method: null, platform: 'darwin' };
    }

    /**
     * Linux Chrome detection
     */
    _detectLinuxChrome() {
        // Method 1: which command
        const binaries = [
            'google-chrome', 'google-chrome-stable', 'chromium', 
            'chromium-browser', 'google-chrome-beta', 'google-chrome-unstable'
        ];
        
        for (const binary of binaries) {
            try {
                const result = execSync(`which ${binary} 2>/dev/null`, { 
                    encoding: 'utf8', 
                    shell: '/bin/bash' 
                }).trim();
                
                if (result && fs.existsSync(result)) {
                    console.log(`   ✅ Found: ${result}`);
                    return { path: result, method: 'which Command', platform: 'linux' };
                }
            } catch (e) {
                continue;
            }
        }

        // Method 2: Common paths
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
                console.log(`   ✅ Found: ${linuxPath}`);
                return { path: linuxPath, method: 'Common Path', platform: 'linux' };
            }
        }

        console.log('   ❌ Chrome not found on Linux');
        return { path: null, method: null, platform: 'linux' };
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
     * Get directory size recursively
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
                        size += fs.statSync(filePath).size;
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
                    // Try to read Preferences for additional info
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
                        } catch (e) {
                            // Preferences might be locked
                        }
                    }

                    const profileSize = this.getDirectorySize(profilePath);
                    
                    profiles.push({
                        name: info.name || profileDir,
                        path: profilePath,
                        profileDir: profileDir,
                        isDefault: profileDir === 'Default',
                        size: profileSize,
                        sizeFormatted: this._formatBytes(profileSize),
                        email: info.user_name || accountInfo.email || null,
                        displayName: info.gaia_name || accountInfo.fullName || null,
                        avatarUrl: info.avatar_icon || null,
                        lastUsed: info.active_time ? new Date(info.active_time * 1000) : null,
                        isEphemeral: info.is_ephemeral || false,
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
            console.error(`   ⚠️ Error reading Local State: ${e.message}`);
        }

        return profiles;
    }

    /**
     * Get all Chrome profiles from all user data directories
     */
    getAllProfiles() {
        const allProfiles = [];
        const userDataDirs = this.getUserDataDirectories();

        console.log(`   📁 Found ${userDataDirs.length} Chrome user data director${userDataDirs.length > 1 ? 'ies' : 'y'}`);

        for (const userDataDir of userDataDirs) {
            console.log(`   📂 Scanning: ${userDataDir}`);
            const profiles = this.getProfilesFromLocalState(userDataDir);
            
            // Add user data dir info to each profile
            profiles.forEach(profile => {
                profile.userDataDir = userDataDir;
                profile.chromeVariant = path.basename(path.dirname(userDataDir));
            });
            
            allProfiles.push(...profiles);
        }

        console.log(`   👤 Total profiles found: ${allProfiles.length}`);
        return allProfiles;
    }

    /**
     * Full detection - returns everything needed
     */
    detectAll() {
        const chromeInfo = this.detectChromeExecutable();
        const profiles = this.getAllProfiles();

        return {
            platform: this.platform,
            architecture: this.arch,
            hostname: os.hostname(),
            username: os.userInfo().username,
            chrome: chromeInfo,
            profiles: profiles,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Format bytes to human readable
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get Chrome version
     */
    getChromeVersion() {
        const chromeInfo = this.detectChromeExecutable();
        if (!chromeInfo.path) return null;

        try {
            if (this.platform === 'win32') {
                const result = execSync(
                    `wmic datafile where name="${chromeInfo.path.replace(/\\/g, '\\\\')}" get Version /value 2>nul`,
                    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                );
                const match = result.match(/Version=([\d.]+)/);
                if (match) return match[1];
            } else {
                const result = execSync(`"${chromeInfo.path}" --version 2>/dev/null`, { 
                    encoding: 'utf8', 
                    shell: '/bin/bash' 
                });
                const match = result.match(/[\d.]+/);
                if (match) return match[0];
            }
        } catch (e) {
            // Version detection failed
        }

        return 'Unknown';
    }
}

module.exports = ChromeDetector;