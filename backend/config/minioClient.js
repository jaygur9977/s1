const Minio = require('minio');
const crypto = require('crypto');

// MinIO Configuration
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true' || false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'admin12345'
});

const BUCKET = process.env.MINIO_BUCKET || 'cloud-browser-profiles';

/**
 * Connect to MinIO and ensure bucket exists
 */
async function connectMinIO() {
    try {
        console.log('\n🔗 Connecting to MinIO...');
        
        const exists = await minioClient.bucketExists(BUCKET);
        
        if (!exists) {
            console.log(`📦 Bucket "${BUCKET}" not found. Creating...`);
            await minioClient.makeBucket(BUCKET);
            console.log(`✅ Bucket "${BUCKET}" created successfully`);
        }
        
        console.log('✅ MinIO Connected Successfully');
        return true;
        
    } catch (error) {
        console.error('❌ MinIO Connection Failed:', error.message);
        return false;
    }
}

/**
 * Generate random path for profile storage (hides user identity)
 */
function generateRandomStoragePath() {
    const random1 = crypto.randomBytes(4).toString('hex'); // 8 chars
    const random2 = crypto.randomBytes(4).toString('hex'); // 8 chars
    const version = 'v1';
    return `profiles/${random1}/${random2}/${version}`;
}

/**
 * Upload file to MinIO
 */
async function uploadFile(objectKey, filePath, metadata = {}) {
    try {
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        
        await minioClient.fPutObject(BUCKET, objectKey, filePath, {
            'Content-Type': 'application/octet-stream',
            ...metadata
        });
        
        console.log(`   ✅ Uploaded: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
        return true;
    } catch (error) {
        console.error(`   ❌ Upload failed: ${error.message}`);
        throw error;
    }
}

/**
 * Upload buffer to MinIO
 */
async function uploadBuffer(objectKey, buffer, metadata = {}) {
    try {
        await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
            'Content-Type': 'application/octet-stream',
            ...metadata
        });
        
        console.log(`   ✅ Uploaded buffer: ${objectKey} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
        return true;
    } catch (error) {
        console.error(`   ❌ Buffer upload failed for ${objectKey}:`, error.message);
        throw error;
    }
}

/**
 * Download file from MinIO
 */
async function downloadFile(objectKey, destPath) {
    try {
        await minioClient.fGetObject(BUCKET, objectKey, destPath);
        console.log(`   ✅ Downloaded: ${objectKey}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Download failed for ${objectKey}:`, error.message);
        throw error;
    }
}

/**
 * Get object as buffer from MinIO
 */
async function getObjectBuffer(objectKey) {
    try {
        const dataStream = await minioClient.getObject(BUCKET, objectKey);
        const chunks = [];
        
        return new Promise((resolve, reject) => {
            dataStream.on('data', chunk => chunks.push(chunk));
            dataStream.on('end', () => resolve(Buffer.concat(chunks)));
            dataStream.on('error', reject);
        });
    } catch (error) {
        console.error(`   ❌ Failed to get object ${objectKey}:`, error.message);
        throw error;
    }
}

/**
 * Delete object from MinIO
 */
async function deleteObject(objectKey) {
    try {
        await minioClient.removeObject(BUCKET, objectKey);
        console.log(`   🗑️ Deleted: ${objectKey}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Delete failed for ${objectKey}:`, error.message);
        return false;
    }
}

/**
 * Delete all objects with a prefix (delete entire profile folder)
 */
async function deleteByPrefix(prefix) {
    try {
        const objectsList = [];
        const stream = minioClient.listObjects(BUCKET, prefix, true);
        
        await new Promise((resolve, reject) => {
            stream.on('data', obj => objectsList.push(obj.name));
            stream.on('end', resolve);
            stream.on('error', reject);
        });
        
        if (objectsList.length > 0) {
            await minioClient.removeObjects(BUCKET, objectsList);
            console.log(`   🗑️ Deleted ${objectsList.length} objects with prefix: ${prefix}`);
        }
        
        return true;
    } catch (error) {
        console.error(`   ❌ Delete by prefix failed:`, error.message);
        return false;
    }
}

/**
 * Check if object exists in MinIO
 */
async function objectExists(objectKey) {
    try {
        await minioClient.statObject(BUCKET, objectKey);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get object stats
 */
async function getObjectStats(objectKey) {
    try {
        return await minioClient.statObject(BUCKET, objectKey);
    } catch (error) {
        return null;
    }
}

module.exports = {
    minioClient,
    connectMinIO,
    BUCKET,
    generateRandomStoragePath,
    uploadFile,
    uploadBuffer,
    downloadFile,
    getObjectBuffer,
    deleteObject,
    deleteByPrefix,
    objectExists,
    getObjectStats
};