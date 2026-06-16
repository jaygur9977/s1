const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const { downloadFile, getObjectBuffer } = require('../config/minioClient');

/**
 * Profile Restore Service
 * Handles downloading, decryption, merging, and extraction of profiles from MinIO
 */
class ProfileRestoreService {
    constructor() {
        this.ENCRYPTION_ALGORITHM = 'aes-256-gcm';
        this.IV_LENGTH = 12;
        this.AUTH_TAG_LENGTH = 16;
        this.KEY_LENGTH = 32;
        this.MASTER_SECRET = process.env.MASTER_SECRET || 'cloude-ultra-secure-master-key-2024';
        this.MAX_PARALLEL_DOWNLOADS = 3; // Download 3 chunks at a time
    }

    /**
     * Derive encryption key from master secret and user ID
     */
    deriveKey(userId) {
        return crypto.scryptSync(this.MASTER_SECRET, `user-${userId}`, this.KEY_LENGTH);
    }

    /**
     * Generate SHA256 hash
     */
    sha256(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Generate SHA256 hash of file
     */
    generateFileSHA256(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    /**
     * Decrypt a single chunk with AES-256-GCM
     */
    decryptChunk(encryptedBuffer, ivHex, authTagHex, key) {
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        // Skip IV (12 bytes) and AuthTag (16 bytes) to get encrypted data
        const encryptedData = encryptedBuffer.slice(
            this.IV_LENGTH + this.AUTH_TAG_LENGTH
        );
        
        const decipher = crypto.createDecipheriv(
            this.ENCRYPTION_ALGORITHM,
            key,
            iv
        );
        
        decipher.setAuthTag(authTag);
        
        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);
        
        return decrypted;
    }

    /**
     * Download chunks in parallel batches
     */
    async downloadChunksInParallel(storagePath, chunkCount, userId, tempDir) {
        const chunks = new Array(chunkCount);
        let downloadedCount = 0;
        
        console.log(`   📥 Downloading ${chunkCount} chunks (${this.MAX_PARALLEL_DOWNLOADS} parallel)...`);
        
        // Process in batches
        for (let i = 0; i < chunkCount; i += this.MAX_PARALLEL_DOWNLOADS) {
            const batch = [];
            
            for (let j = i; j < Math.min(i + this.MAX_PARALLEL_DOWNLOADS, chunkCount); j++) {
                batch.push(this._downloadSingleChunk(storagePath, j, userId, tempDir));
            }
            
            const batchResults = await Promise.all(batch);
            
            for (const result of batchResults) {
                chunks[result.index] = result;
                downloadedCount++;
                console.log(`   ✅ Downloaded chunk ${result.index + 1}/${chunkCount}`);
            }
        }
        
        console.log(`   ✅ All ${downloadedCount} chunks downloaded`);
        return chunks;
    }

    /**
     * Download a single chunk
     */
    async _downloadSingleChunk(storagePath, chunkIndex, userId, tempDir) {
        const objectKey = `${storagePath}/chunk_${chunkIndex}.enc`;
        const chunkPath = path.join(tempDir, `chunk_${chunkIndex}.enc`);
        
        // Download from MinIO
        await downloadFile(objectKey, chunkPath);
        
        // Read encrypted buffer
        const encryptedBuffer = fs.readFileSync(chunkPath);
        
        // Clean up downloaded file
        fs.unlinkSync(chunkPath);
        
        return {
            index: chunkIndex,
            buffer: encryptedBuffer,
            size: encryptedBuffer.length
        };
    }

    /**
     * Download and restore profile from MinIO
     */
    async restoreProfile(userId, profileStorage, outputBaseDir) {
        const tempDir = path.join(__dirname, '..', 'temp', `restore_${userId}`);
        
        try {
            console.log(`\n📥 Starting profile restore for user ${userId}...`);
            
            const { storagePath, chunkCount, checksum, encryptionIV, authTag } = profileStorage;
            
            if (!storagePath || !chunkCount) {
                throw new Error('Invalid profile storage metadata');
            }
            
            console.log(`   📂 Storage path: ${storagePath}`);
            console.log(`   📊 Chunks: ${chunkCount}`);
            
            // Create temp directory
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            fs.mkdirSync(tempDir, { recursive: true });
            
            // Step 1: Download all chunks in parallel
            const chunks = await this.downloadChunksInParallel(
                storagePath, 
                chunkCount, 
                userId, 
                tempDir
            );
            
            // Step 2: Decrypt all chunks
            console.log(`   🔓 Decrypting ${chunks.length} chunks...`);
            const key = this.deriveKey(userId);
            const decryptedChunks = [];
            
            for (const chunk of chunks) {
                const decrypted = this.decryptChunk(
                    chunk.buffer,
                    encryptionIV,
                    authTag,
                    key
                );
                
                decryptedChunks.push(decrypted);
                console.log(`   ✅ Decrypted chunk ${chunk.index + 1}/${chunks.length}`);
            }
            
            // Step 3: Merge chunks into ZIP
            console.log(`   🔗 Merging ${decryptedChunks.length} chunks...`);
            const zipPath = path.join(tempDir, 'profile.zip');
            const mergedBuffer = Buffer.concat(decryptedChunks);
            fs.writeFileSync(zipPath, mergedBuffer);
            
            const mergedSize = mergedBuffer.length;
            console.log(`   ✅ Merged: ${(mergedSize / 1024 / 1024).toFixed(2)} MB`);
            
            // Step 4: Verify checksum
            console.log(`   🔐 Verifying checksum...`);
            const downloadedChecksum = await this.generateFileSHA256(zipPath);
            
            if (downloadedChecksum !== checksum) {
                console.error(`   ❌ Checksum mismatch!`);
                console.error(`   Expected: ${checksum.substring(0, 32)}...`);
                console.error(`   Got:      ${downloadedChecksum.substring(0, 32)}...`);
                throw new Error('Checksum verification failed! Profile may be corrupted.');
            }
            console.log(`   ✅ Checksum verified`);
            
            // Step 5: Extract ZIP to profile directory
            const profilePath = path.join(outputBaseDir, `user_${userId}`);
            
            if (fs.existsSync(profilePath)) {
                console.log(`   🗑️ Removing existing profile: ${profilePath}`);
                fs.rmSync(profilePath, { recursive: true, force: true });
            }
            fs.mkdirSync(profilePath, { recursive: true });
            
            console.log(`   📦 Extracting profile to: ${profilePath}`);
            const zip = new AdmZip(zipPath);
            const zipEntries = zip.getEntries();
            
            zip.extractAllTo(profilePath, true);
            
            console.log(`   ✅ Extracted ${zipEntries.length} files`);
            
            // Step 6: Clean up temp files
            console.log(`   🧹 Cleaning up temp files...`);
            fs.rmSync(tempDir, { recursive: true, force: true });
            
            console.log(`   ✅ Profile restore complete!`);
            
            return {
                profilePath,
                fileCount: zipEntries.length,
                totalSize: mergedSize
            };
            
        } catch (error) {
            console.error(`   ❌ Restore failed: ${error.message}`);
            
            // Clean up temp files on error
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            
            throw error;
        }
    }

    /**
     * Quick check if profile exists in MinIO
     */
    async checkProfileExists(storagePath) {
        try {
            const { objectExists } = require('../config/minioClient');
            const firstChunkKey = `${storagePath}/chunk_0.enc`;
            return await objectExists(firstChunkKey);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get profile size from MinIO (without downloading)
     */
    async getProfileSize(storagePath, chunkCount) {
        try {
            const { getObjectStats } = require('../config/minioClient');
            let totalSize = 0;
            
            for (let i = 0; i < chunkCount; i++) {
                const objectKey = `${storagePath}/chunk_${i}.enc`;
                const stats = await getObjectStats(objectKey);
                if (stats) {
                    totalSize += stats.size;
                }
            }
            
            return totalSize;
        } catch (error) {
            return 0;
        }
    }
}

module.exports = ProfileRestoreService;