const crypto = require('crypto');
const fs = require('fs');
const { createReadStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

/**
 * Checksum Utilities
 * Provides consistent hashing and integrity verification
 */
class ChecksumUtil {
    constructor() {
        this.ALGORITHMS = {
            SHA256: 'sha256',
            SHA512: 'sha512',
            MD5: 'md5',
            SHA1: 'sha1',
            SHA384: 'sha384'
        };
    }

    // ============================================================
    // BUFFER HASHING
    // ============================================================

    /**
     * Calculate hash of a buffer
     * @param {Buffer} buffer - Data buffer
     * @param {string} algorithm - Hash algorithm (default: sha256)
     * @returns {string} Hex hash
     */
    hashBuffer(buffer, algorithm = this.ALGORITHMS.SHA256) {
        return crypto.createHash(algorithm).update(buffer).digest('hex');
    }

    /**
     * Calculate SHA256 hash
     * @param {Buffer|string} data - Data to hash
     * @returns {string} Hex hash
     */
    sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Calculate SHA512 hash
     * @param {Buffer|string} data - Data to hash
     * @returns {string} Hex hash
     */
    sha512(data) {
        return crypto.createHash('sha512').update(data).digest('hex');
    }

    /**
     * Calculate MD5 hash (fast, less secure - for non-critical checks)
     * @param {Buffer|string} data - Data to hash
     * @returns {string} Hex hash
     */
    md5(data) {
        return crypto.createHash('md5').update(data).digest('hex');
    }

    // ============================================================
    // FILE HASHING
    // ============================================================

    /**
     * Calculate hash of a file (Promise-based)
     * @param {string} filePath - Path to file
     * @param {string} algorithm - Hash algorithm
     * @returns {Promise<string>} Hex hash
     */
    hashFile(filePath, algorithm = this.ALGORITHMS.SHA256) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(algorithm);
            const stream = createReadStream(filePath);
            
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    /**
     * Calculate SHA256 hash of a file
     * @param {string} filePath - Path to file
     * @returns {Promise<string>} Hex hash
     */
    async fileSHA256(filePath) {
        return this.hashFile(filePath, this.ALGORITHMS.SHA256);
    }

    /**
     * Calculate hash of a file with progress tracking
     * @param {string} filePath - Path to file
     * @param {Function} onProgress - Progress callback (percent)
     * @param {string} algorithm - Hash algorithm
     * @returns {Promise<Object>} { hash, size, algorithm }
     */
    hashFileWithProgress(filePath, onProgress, algorithm = this.ALGORITHMS.SHA256) {
        return new Promise((resolve, reject) => {
            const stats = fs.statSync(filePath);
            const totalSize = stats.size;
            let processedSize = 0;
            
            const hash = crypto.createHash(algorithm);
            const stream = createReadStream(filePath);
            
            stream.on('data', chunk => {
                hash.update(chunk);
                processedSize += chunk.length;
                
                if (onProgress && totalSize > 0) {
                    const percent = Math.round((processedSize / totalSize) * 100);
                    onProgress(percent);
                }
            });
            
            stream.on('end', () => {
                resolve({
                    hash: hash.digest('hex'),
                    size: totalSize,
                    algorithm
                });
            });
            
            stream.on('error', reject);
        });
    }

    // ============================================================
    // STREAM HASHING
    // ============================================================

    /**
     * Create a hash stream for piping
     * @param {string} algorithm - Hash algorithm
     * @returns {crypto.Hash} Hash stream
     */
    createHashStream(algorithm = this.ALGORITHMS.SHA256) {
        return crypto.createHash(algorithm);
    }

    /**
     * Calculate hash while piping streams
     * @param {ReadableStream} readStream - Input stream
     * @param {string} algorithm - Hash algorithm
     * @returns {Promise<string>} Hex hash
     */
    hashStream(readStream, algorithm = this.ALGORITHMS.SHA256) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(algorithm);
            
            readStream.on('data', chunk => hash.update(chunk));
            readStream.on('end', () => resolve(hash.digest('hex')));
            readStream.on('error', reject);
        });
    }

    // ============================================================
    // VERIFICATION
    // ============================================================

    /**
     * Verify file integrity against known hash
     * @param {string} filePath - Path to file
     * @param {string} expectedHash - Expected hash value
     * @param {string} algorithm - Hash algorithm
     * @returns {Promise<Object>} { match, calculatedHash, expectedHash }
     */
    async verifyFile(filePath, expectedHash, algorithm = this.ALGORITHMS.SHA256) {
        try {
            const calculatedHash = await this.hashFile(filePath, algorithm);
            const match = calculatedHash.toLowerCase() === expectedHash.toLowerCase();
            
            if (!match) {
                console.error(`   ❌ Hash mismatch!`);
                console.error(`   Expected: ${expectedHash.substring(0, 32)}...`);
                console.error(`   Got:      ${calculatedHash.substring(0, 32)}...`);
            }
            
            return {
                match,
                calculatedHash,
                expectedHash,
                algorithm
            };
        } catch (error) {
            console.error('File verification error:', error.message);
            return {
                match: false,
                calculatedHash: null,
                expectedHash,
                algorithm,
                error: error.message
            };
        }
    }

    /**
     * Verify buffer integrity against known hash
     * @param {Buffer} buffer - Data buffer
     * @param {string} expectedHash - Expected hash
     * @param {string} algorithm - Hash algorithm
     * @returns {Object} { match, calculatedHash, expectedHash }
     */
    verifyBuffer(buffer, expectedHash, algorithm = this.ALGORITHMS.SHA256) {
        const calculatedHash = this.hashBuffer(buffer, algorithm);
        const match = calculatedHash.toLowerCase() === expectedHash.toLowerCase();
        
        return {
            match,
            calculatedHash,
            expectedHash,
            algorithm
        };
    }

    // ============================================================
    // CHUNK VERIFICATION
    // ============================================================

    /**
     * Verify multiple chunks against their hashes
     * @param {Array<Object>} chunks - Array of { data: Buffer, expectedHash: string }
     * @param {string} algorithm - Hash algorithm
     * @returns {Object} { allValid, results: Array }
     */
    verifyChunks(chunks, algorithm = this.ALGORITHMS.SHA256) {
        const results = chunks.map((chunk, index) => {
            const calculatedHash = this.hashBuffer(chunk.data, algorithm);
            const valid = calculatedHash === chunk.expectedHash;
            
            return {
                index,
                valid,
                calculatedHash,
                expectedHash: chunk.expectedHash
            };
        });
        
        return {
            allValid: results.every(r => r.valid),
            results
        };
    }

    // ============================================================
    // MERKLE TREE (For large file integrity)
    // ============================================================

    /**
     * Build Merkle tree from data chunks
     * @param {Array<Buffer>} chunks - Data chunks
     * @returns {Object} { root, tree }
     */
    buildMerkleTree(chunks) {
        if (chunks.length === 0) return { root: null, tree: [] };
        
        let tree = chunks.map(chunk => this.sha256(chunk));
        const levels = [tree];
        
        while (tree.length > 1) {
            const nextLevel = [];
            
            for (let i = 0; i < tree.length; i += 2) {
                const left = tree[i];
                const right = i + 1 < tree.length ? tree[i + 1] : left;
                nextLevel.push(this.sha256(left + right));
            }
            
            levels.push(nextLevel);
            tree = nextLevel;
        }
        
        return {
            root: tree[0],
            tree: levels
        };
    }

    /**
     * Verify Merkle proof for a specific chunk
     * @param {Buffer} chunk - The chunk to verify
     * @param {number} index - Chunk index
     * @param {Array<string>} proof - Merkle proof hashes
     * @param {string} root - Expected Merkle root
     * @returns {boolean}
     */
    verifyMerkleProof(chunk, index, proof, root) {
        let hash = this.sha256(chunk);
        
        for (const sibling of proof) {
            if (index % 2 === 0) {
                hash = this.sha256(hash + sibling);
            } else {
                hash = this.sha256(sibling + hash);
            }
            index = Math.floor(index / 2);
        }
        
        return hash === root;
    }

    // ============================================================
    // HMAC (Message Authentication Code)
    // ============================================================

    /**
     * Generate HMAC signature
     * @param {string|Buffer} data - Data to sign
     * @param {string} secret - Secret key
     * @param {string} algorithm - Hash algorithm
     * @returns {string} HMAC hex
     */
    hmac(data, secret, algorithm = this.ALGORITHMS.SHA256) {
        return crypto.createHmac(algorithm, secret).update(data).digest('hex');
    }

    /**
     * Verify HMAC signature
     * @param {string|Buffer} data - Original data
     * @param {string} signature - Expected HMAC signature
     * @param {string} secret - Secret key
     * @param {string} algorithm - Hash algorithm
     * @returns {boolean}
     */
    verifyHmac(data, signature, secret, algorithm = this.ALGORITHMS.SHA256) {
        const calculatedSignature = this.hmac(data, secret, algorithm);
        return crypto.timingSafeEqual(
            Buffer.from(calculatedSignature, 'hex'),
            Buffer.from(signature, 'hex')
        );
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    /**
     * Compare two hashes in constant time
     * @param {string} hash1 - First hash
     * @param {string} hash2 - Second hash
     * @returns {boolean}
     */
    constantTimeCompare(hash1, hash2) {
        if (hash1.length !== hash2.length) return false;
        
        try {
            return crypto.timingSafeEqual(
                Buffer.from(hash1, 'hex'),
                Buffer.from(hash2, 'hex')
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Get checksum of checksums (meta-checksum)
     * @param {Array<string>} hashes - Array of hashes
     * @returns {string} Combined hash
     */
    combineHashes(hashes) {
        const combined = hashes.sort().join('');
        return this.sha256(combined);
    }

    /**
     * Generate a random nonce for integrity checks
     * @param {number} length - Nonce length
     * @returns {string} Random hex nonce
     */
    generateNonce(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Get file size and hash together
     * @param {string} filePath - Path to file
     * @returns {Promise<Object>} { size, hash }
     */
    async getFileInfo(filePath) {
        const stats = fs.statSync(filePath);
        const hash = await this.fileSHA256(filePath);
        
        return {
            size: stats.size,
            hash,
            path: filePath
        };
    }

    /**
     * Format hash for display (truncated)
     * @param {string} hash - Full hash
     * @param {number} length - Characters to show
     * @returns {string} Truncated hash
     */
    formatHash(hash, length = 16) {
        if (!hash || hash.length <= length * 2) return hash || '';
        return hash.substring(0, length) + '...' + hash.substring(hash.length - length);
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================
const checksumUtil = new ChecksumUtil();

module.exports = checksumUtil;