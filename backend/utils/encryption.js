const crypto = require('crypto');

/**
 * Encryption Utilities
 * Provides consistent encryption/decryption across the application
 */
class EncryptionUtil {
    constructor(masterSecret) {
        this.MASTER_SECRET = masterSecret || process.env.MASTER_SECRET || 'cloude-ultra-secure-master-key-2024';
        this.ENCRYPTION_KEY = crypto.createHash('sha256').update(this.MASTER_SECRET).digest();
        this.IV_LENGTH = 16;
        this.AUTH_TAG_LENGTH = 16;
        this.KEY_LENGTH = 32;
        
        // Algorithms
        this.SYMMETRIC_ALGORITHM = 'aes-256-cbc';  // For text/data encryption
        this.CHUNK_ALGORITHM = 'aes-256-gcm';       // For chunk encryption (with auth)
    }

    // ============================================================
    // TEXT ENCRYPTION (AES-256-CBC)
    // Used for: passwords, PINs, phone numbers, keys
    // ============================================================

    /**
     * Encrypt text data
     * @param {string} text - Plain text to encrypt
     * @returns {string} Encrypted text in format: iv:encryptedData
     */
    encryptText(text) {
        if (!text && text !== '') return text;
        
        try {
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const cipher = crypto.createCipheriv(this.SYMMETRIC_ALGORITHM, this.ENCRYPTION_KEY, iv);
            
            let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Format: iv:encryptedData
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('Text encryption error:', error.message);
            throw new Error('Failed to encrypt text');
        }
    }

    /**
     * Decrypt text data
     * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
     * @returns {string} Decrypted plain text
     */
    decryptText(encryptedText) {
        if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
        
        try {
            const parts = encryptedText.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedData = parts.slice(1).join(':');
            
            const decipher = crypto.createDecipheriv(this.SYMMETRIC_ALGORITHM, this.ENCRYPTION_KEY, iv);
            
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Text decryption error:', error.message);
            return encryptedText; // Return original if decryption fails
        }
    }

    /**
     * Check if text is encrypted
     * @param {string} text - Text to check
     * @returns {boolean}
     */
    isEncrypted(text) {
        return text && text.includes(':') && text.split(':')[0].length === 32; // IV is 32 hex chars
    }

    // ============================================================
    // CHUNK ENCRYPTION (AES-256-GCM)
    // Used for: profile chunks uploaded to MinIO
    // ============================================================

    /**
     * Derive encryption key from user ID
     * @param {string} userId - User ID for key derivation
     * @returns {Buffer} Derived key
     */
    deriveKey(userId) {
        return crypto.scryptSync(
            this.MASTER_SECRET,
            `user-${userId}`,
            this.KEY_LENGTH
        );
    }

    /**
     * Encrypt a buffer chunk with authentication
     * @param {Buffer} chunkBuffer - Raw chunk data
     * @param {Buffer} key - Encryption key
     * @returns {Object} { encryptedData, iv, authTag }
     */
    encryptChunk(chunkBuffer, key) {
        try {
            const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
            const cipher = crypto.createCipheriv(this.CHUNK_ALGORITHM, key, iv);
            
            const encrypted = Buffer.concat([
                cipher.update(chunkBuffer),
                cipher.final()
            ]);
            
            const authTag = cipher.getAuthTag();
            
            // Structure: [IV (12)] + [AuthTag (16)] + [Encrypted Data]
            const encryptedData = Buffer.concat([iv, authTag, encrypted]);
            
            return {
                encryptedData,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            console.error('Chunk encryption error:', error.message);
            throw new Error('Failed to encrypt chunk');
        }
    }

    /**
     * Decrypt a buffer chunk with authentication verification
     * @param {Buffer} encryptedBuffer - Encrypted chunk (with IV and auth tag)
     * @param {string} ivHex - IV in hex format
     * @param {string} authTagHex - Auth tag in hex format
     * @param {Buffer} key - Decryption key
     * @returns {Buffer} Decrypted chunk data
     */
    decryptChunk(encryptedBuffer, ivHex, authTagHex, key) {
        try {
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            
            // Skip IV (12 bytes) and AuthTag (16 bytes) to get encrypted data
            const encryptedData = encryptedBuffer.slice(28); // 12 + 16
            
            const decipher = crypto.createDecipheriv(this.CHUNK_ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);
            
            const decrypted = Buffer.concat([
                decipher.update(encryptedData),
                decipher.final()
            ]);
            
            return decrypted;
        } catch (error) {
            console.error('Chunk decryption error:', error.message);
            throw new Error('Failed to decrypt chunk - data may be corrupted or tampered');
        }
    }

    /**
     * Extract IV and AuthTag from encrypted buffer
     * @param {Buffer} encryptedBuffer - Encrypted chunk buffer
     * @returns {Object} { iv, authTag }
     */
    extractChunkMetadata(encryptedBuffer) {
        if (encryptedBuffer.length < 28) {
            throw new Error('Buffer too small to contain IV and AuthTag');
        }
        
        const iv = encryptedBuffer.slice(0, 12).toString('hex');
        const authTag = encryptedBuffer.slice(12, 28).toString('hex');
        
        return { iv, authTag };
    }

    // ============================================================
    // HASHING
    // ============================================================

    /**
     * Generate SHA256 hash of data
     * @param {string|Buffer} data - Data to hash
     * @returns {string} Hex hash
     */
    sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate SHA512 hash of data
     * @param {string|Buffer} data - Data to hash
     * @returns {string} Hex hash
     */
    sha512(data) {
        return crypto.createHash('sha512').update(data).digest('hex');
    }

    /**
     * Generate HMAC-SHA256
     * @param {string|Buffer} data - Data to sign
     * @param {string} secret - Secret key
     * @returns {string} HMAC hex
     */
    hmacSha256(data, secret) {
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }

    // ============================================================
    // RANDOM GENERATION
    // ============================================================

    /**
     * Generate cryptographically secure random bytes
     * @param {number} length - Number of bytes
     * @returns {Buffer}
     */
    randomBytes(length = 32) {
        return crypto.randomBytes(length);
    }

    /**
     * Generate random hex string
     * @param {number} length - Number of bytes (output will be 2x length)
     * @returns {string} Hex string
     */
    randomHex(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate random ID (UUID v4)
     * @returns {string} UUID
     */
    generateUUID() {
        return crypto.randomUUID();
    }

    /**
     * Generate random string with specified character set
     * @param {number} length - String length
     * @param {string} chars - Character set to use
     * @returns {string} Random string
     */
    randomString(length = 8, chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789') {
        const bytes = crypto.randomBytes(length);
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars[bytes[i] % chars.length];
        }
        
        return result;
    }

    /**
     * Generate random number in range
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {number}
     */
    randomInt(min, max) {
        const range = max - min + 1;
        const bytes = crypto.randomBytes(4);
        const randomNum = bytes.readUInt32BE(0);
        return min + (randomNum % range);
    }

    // ============================================================
    // PASSWORD UTILITIES
    // ============================================================

    /**
     * Generate a secure password
     * @param {number} length - Password length (default 12)
     * @returns {string} Generated password
     */
    generatePassword(length = 12) {
        const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowercase = 'abcdefghjklmnpqrstuvwxyz';
        const numbers = '0123456789';
        const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        // Ensure at least one of each type
        let password = '';
        password += uppercase[this.randomInt(0, uppercase.length - 1)];
        password += lowercase[this.randomInt(0, lowercase.length - 1)];
        password += numbers[this.randomInt(0, numbers.length - 1)];
        password += specials[this.randomInt(0, specials.length - 1)];
        
        // Fill remaining
        const allChars = uppercase + lowercase + numbers + specials;
        for (let i = 4; i < length; i++) {
            password += allChars[this.randomInt(0, allChars.length - 1)];
        }
        
        // Shuffle
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }

    /**
     * Generate a random PIN
     * @param {number} length - PIN length (default 4)
     * @returns {string} Generated PIN
     */
    generatePin(length = 4) {
        let pin = '';
        for (let i = 0; i < length; i++) {
            pin += this.randomInt(0, 9).toString();
        }
        return pin;
    }

    /**
     * Generate unique key (8 chars)
     * @returns {string} 8-character unique key
     */
    generateUniqueKey() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789';
        return this.randomString(8, chars);
    }

    // ============================================================
    // CONSTANT-TIME COMPARISON
    // ============================================================

    /**
     * Constant-time string comparison (prevents timing attacks)
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {boolean}
     */
    constantTimeCompare(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') {
            return false;
        }
        
        const aBuf = Buffer.from(a);
        const bBuf = Buffer.from(b);
        
        if (aBuf.length !== bBuf.length) {
            // Still do constant-time comparison even if lengths differ
            crypto.timingSafeEqual(
                Buffer.from(this.sha256(a)),
                Buffer.from(this.sha256(a)) // Compare with self to avoid timing leak
            );
            return false;
        }
        
        try {
            return crypto.timingSafeEqual(aBuf, bBuf);
        } catch (error) {
            return false;
        }
    }

    // ============================================================
    // KEY MANAGEMENT
    // ============================================================

    /**
     * Create key pair (for future asymmetric encryption use)
     * @returns {Object} { publicKey, privateKey }
     */
    generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        return { publicKey, privateKey };
    }

    /**
     * Encrypt with public key (RSA)
     * @param {string} data - Data to encrypt
     * @param {string} publicKey - Public key in PEM format
     * @returns {string} Base64 encrypted data
     */
    encryptWithPublicKey(data, publicKey) {
        const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data));
        return encrypted.toString('base64');
    }

    /**
     * Decrypt with private key (RSA)
     * @param {string} encryptedData - Base64 encrypted data
     * @param {string} privateKey - Private key in PEM format
     * @returns {string} Decrypted data
     */
    decryptWithPrivateKey(encryptedData, privateKey) {
        const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
        return decrypted.toString();
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================
const encryptionUtil = new EncryptionUtil();

module.exports = encryptionUtil;