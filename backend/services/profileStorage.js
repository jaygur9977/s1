const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { generateRandomStoragePath, uploadFile } = require('../config/minioClient');

class ProfileStorageService {
    constructor() {
        this.CHUNK_SIZE = 50 * 1024 * 1024;
        this.MASTER_SECRET = process.env.MASTER_SECRET || 'cloude-ultra-secure-master-key-2024';
    }

    deriveKey(userId) {
        return crypto.scryptSync(this.MASTER_SECRET, `user-${userId}`, 32);
    }

    sha256(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Compress directory - SILENT, NO PROGRESS LOGS
     */
    compressDirectory(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                const size = archive.pointer();
                console.log(`   ✅ Compressed: ${(size / 1024 / 1024).toFixed(1)} MB in ${((Date.now() - start) / 1000).toFixed(1)}s`);
                resolve({ outputPath, totalSize: size });
            });

            archive.on('error', reject);
            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    /**
     * Encrypt a single chunk
     */
    encryptChunk(chunkBuffer, key) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(chunkBuffer), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return {
            encryptedData: Buffer.concat([iv, authTag, encrypted]),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Split and encrypt - IN MEMORY, NO TEMP FILES, NO PROGRESS LOGS
     */
    splitAndEncrypt(fileBuffer, userId) {
        const key = this.deriveKey(userId);
        const chunks = [];
        let offset = 0;
        let chunkIndex = 0;

        while (offset < fileBuffer.length) {
            const end = Math.min(offset + this.CHUNK_SIZE, fileBuffer.length);
            const chunk = fileBuffer.slice(offset, end);
            const originalHash = this.sha256(chunk);
            const { encryptedData, iv, authTag } = this.encryptChunk(chunk, key);
            const encryptedHash = this.sha256(encryptedData);

            chunks.push({
                index: chunkIndex,
                data: encryptedData,
                originalSize: chunk.length,
                encryptedSize: encryptedData.length,
                originalHash,
                encryptedHash,
                iv,
                authTag
            });

            offset = end;
            chunkIndex++;
        }

        console.log(`   🔒 Encrypted into ${chunks.length} chunk(s)`);
        return chunks;
    }

    /**
     * Upload profile - FAST VERSION
     */
    async uploadProfile(userId, profilePath) {
        const tempDir = path.join(__dirname, '..', 'temp', `up_${userId}`);
        const start = Date.now();

        try {
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            // STEP 1: Compress
            const zipPath = path.join(tempDir, 'p.zip');
            const { totalSize } = await this.compressDirectory(profilePath, zipPath);

            // STEP 2: Read ZIP into memory, get checksum, delete ZIP
            const zipBuffer = fs.readFileSync(zipPath);
            const zipChecksum = this.sha256(zipBuffer);
            fs.unlinkSync(zipPath);

            // STEP 3: Split & Encrypt (in memory)
            const chunks = this.splitAndEncrypt(zipBuffer, userId);

            // STEP 4: Generate random MinIO path
            const storagePath = generateRandomStoragePath();
            const profileId = crypto.randomUUID();

            // STEP 5: Upload each chunk to MinIO
            const uploadedChunks = [];
            for (const chunk of chunks) {
                const objectKey = `${storagePath}/chunk_${chunk.index}.enc`;
                const tmpFile = path.join(tempDir, `c_${chunk.index}.enc`);

                fs.writeFileSync(tmpFile, chunk.data);
                await uploadFile(objectKey, tmpFile);
                fs.unlinkSync(tmpFile);

                uploadedChunks.push({
                    chunkIndex: chunk.index,
                    storageKey: objectKey,
                    checksum: chunk.encryptedHash,
                    originalHash: chunk.originalHash,
                    originalSize: chunk.originalSize,
                    encryptedSize: chunk.encryptedSize,
                    iv: chunk.iv,
                    authTag: chunk.authTag
                });
            }

            // STEP 6: Cleanup temp
            if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

            console.log(`   ✅ Done in ${((Date.now() - start) / 1000).toFixed(1)}s → ${storagePath}`);

            return { profileId, storagePath, chunkCount: chunks.length, totalSize, checksum: zipChecksum, chunks: uploadedChunks };

        } catch (error) {
            if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
            throw error;
        }
    }
}

module.exports = ProfileStorageService;