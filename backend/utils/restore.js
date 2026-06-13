// // restore.js - Complete standalone file

// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');
// const { MongoClient } = require('mongodb');
// const Minio = require('minio');

// require('dotenv').config({
//   path: path.join(__dirname, '../.env')
// });

// /* =========================
//    MINIO CONFIG
// ========================= */

// const minioClient = new Minio.Client({
//   endPoint: 'localhost',
//   port: 9000,
//   useSSL: false,
//   accessKey: 'admin',
//   secretKey: 'admin12345'
// });

// const BUCKET = 'cloud-browser-profiles';

// async function connectMinIO() {
//   try {
//     console.log('\nConnecting to MinIO...');

//     const exists = await minioClient.bucketExists(BUCKET);

//     if (!exists) {
//       console.log(`Bucket "${BUCKET}" not found`);
//       return false;
//     }

//     console.log('MinIO Connected Successfully');
//     return true;

//   } catch (error) {
//     console.error('\nMinIO Connection Failed');
//     console.error(error.message);
//     return false;
//   }
// }

// /* =========================
//    MONGODB CONFIG
// ========================= */

// let client;
// let db;

// async function connectMongo() {
//   if (db) {
//     return db;
//   }

//   console.log('\nConnecting to MongoDB...');

//   client = new MongoClient(process.env.MONGODB_URI);
//   await client.connect();

//   db = client.db('cloudBrowser');

//   console.log('MongoDB Connected Successfully');
//   return db;
// }

// /* =========================
//    SHA256 HELPER
// ========================= */

// function generateSHA256(filePath) {
//   return new Promise((resolve, reject) => {
//     const hash = crypto.createHash('sha256');
//     const stream = fs.createReadStream(filePath);

//     stream.on('data', chunk => hash.update(chunk));
//     stream.on('end', () => resolve(hash.digest('hex')));
//     stream.on('error', reject);
//   });
// }

// /* =========================
//    FETCH METADATA FROM MONGODB
// ========================= */

// async function getProfileMetadata(profileId) {
//   try {
//     const db = await connectMongo();
//     const collection = db.collection('profiles');

//     const document = await collection.findOne({ profileId });

//     if (!document) {
//       throw new Error(`Profile not found: ${profileId}`);
//     }

//     console.log('\n✓ Metadata Fetched Successfully');
//     console.log(`  Profile Name: ${document.name}`);
//     console.log(`  User ID: ${document.userId}`);
//     console.log(`  Version: ${document.currentChunkVersion}`);
//     console.log(`  Total Chunks: ${document.chunkReferences.latest.totalChunks}`);
//     console.log(`  Created At: ${document.createdAt}`);

//     return document;

//   } catch (error) {
//     console.error('\n✗ Metadata Fetch Failed');
//     console.error(`  ${error.message}`);
//     throw error;
//   }
// }

// /* =========================
//    DOWNLOAD CHUNKS FROM MINIO
// ========================= */

// async function downloadChunksFromMinio(profileMetadata) {
//   try {
//     const connected = await connectMinIO();
//     if (!connected) {
//       throw new Error('MinIO connection failed');
//     }

//     const downloadDir = path.join(__dirname, 'downloaded_chunks');
    
//     // Clean existing download directory if it exists
//     if (fs.existsSync(downloadDir)) {
//       fs.rmSync(downloadDir, { recursive: true, force: true });
//     }
//     fs.mkdirSync(downloadDir, { recursive: true });

//     const chunks = profileMetadata.chunkReferences.latest.chunks;
//     const downloadedChunks = [];

//     console.log('\nStarting Download...');
//     console.log('─'.repeat(50));

//     for (const chunk of chunks) {
//       const objectKey = chunk.storageKey;
//       const filename = `chunk_${chunk.chunkIndex}.enc`;
//       const downloadPath = path.join(downloadDir, filename);

//       console.log(`\n↓ Downloading ${filename}...`);

//       // Download from MinIO
//       await minioClient.fGetObject(BUCKET, objectKey, downloadPath);

//       // Verify checksum
//       const downloadedChecksum = await generateSHA256(downloadPath);

//       if (downloadedChecksum !== chunk.checksum) {
//         throw new Error(
//           `Checksum mismatch for ${filename}\n  Expected: ${chunk.checksum}\n  Got: ${downloadedChecksum}`
//         );
//       }

//       const stats = fs.statSync(downloadPath);

//       console.log(`  ✓ Downloaded Successfully`);
//       console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
//       console.log(`  Checksum: Verified ✓`);

//       downloadedChunks.push({
//         chunkIndex: chunk.chunkIndex,
//         filePath: downloadPath,
//         checksum: downloadedChecksum,
//         size: stats.size,
//         iv: chunk.iv,
//         authTag: chunk.authTag,
//         originalSize: chunk.originalSize
//       });
//     }

//     // Save download manifest
//     const manifest = {
//       profileId: profileMetadata.profileId,
//       profileName: profileMetadata.name,
//       downloadedAt: new Date().toISOString(),
//       totalChunks: downloadedChunks.length,
//       chunks: downloadedChunks.map(c => ({
//         chunkIndex: c.chunkIndex,
//         filename: path.basename(c.filePath),
//         checksum: c.checksum,
//         size: c.size,
//         iv: c.iv,
//         authTag: c.authTag
//       }))
//     };

//     fs.writeFileSync(
//       path.join(downloadDir, 'download_manifest.json'),
//       JSON.stringify(manifest, null, 2)
//     );

//     console.log('\n' + '─'.repeat(50));
//     console.log('✓ All Chunks Downloaded & Verified Successfully');
//     console.log(`  Download Directory: ${downloadDir}`);
//     console.log(`  Manifest Saved: download_manifest.json`);

//     return downloadedChunks;

//   } catch (error) {
//     console.error('\n✗ Download Failed');
//     console.error(`  ${error.message}`);
//     throw error;
//   }
// }

// /* =========================
//    MAIN: FETCH & DOWNLOAD
// ========================= */

// async function fetchAndDownload(profileId) {
//   try {
//     console.log('\n╔══════════════════════════════════════╗');
//     console.log('║   REVERSE FLOW: FETCH & DOWNLOAD    ║');
//     console.log('╚══════════════════════════════════════╝');
//     console.log(`Profile ID: ${profileId}`);

//     // Step 1: Fetch metadata from MongoDB
//     const metadata = await getProfileMetadata(profileId);

//     // Step 2: Download all chunks from MinIO
//     const downloadedChunks = await downloadChunksFromMinio(metadata);

//     console.log('\n╔══════════════════════════════════════╗');
//     console.log('║     FETCH & DOWNLOAD COMPLETE       ║');
//     console.log('╚══════════════════════════════════════╝');
//     console.log(`Chunks Downloaded: ${downloadedChunks.length}`);
//     console.log(`Total Size: ${(downloadedChunks.reduce((sum, c) => sum + c.size, 0) / 1024 / 1024).toFixed(2)} MB`);

//     return {
//       metadata,
//       downloadedChunks
//     };

//   } catch (error) {
//     console.error('\n╔══════════════════════════════════════╗');
//     console.error('║     FETCH & DOWNLOAD FAILED         ║');
//     console.error('╚══════════════════════════════════════╝');
//     console.error(`Error: ${error.message}`);
//     throw error;
//   }
// }

// /* =========================
//    EXECUTE
// ========================= */

// if (require.main === module) {
//   // Use the profile ID that was created in your test
//   const profileId = '98fe65dc-8c59-4765-b837-d660e2f7bcab';
  
//   fetchAndDownload(profileId)
//     .then(() => {
//       console.log('\n✓ Process completed successfully');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('\n✗ Process failed:', error.message);
//       process.exit(1);
//     });
// }


// module.exports = {
//   fetchAndDownload,
//   getProfileMetadata,
//   downloadChunksFromMinio
// };







// // extract-iv-auth.js - One-time fix to extract IV and authTag from .enc files

// const fs = require('fs');
// const path = require('path');

// const downloadDir = path.join(__dirname, 'downloaded_chunks');
// const manifestPath = path.join(downloadDir, 'download_manifest.json');

// // Read existing manifest
// const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// // Extract IV and authTag from each .enc file
// manifest.chunks = manifest.chunks.map(chunk => {
//   const encFilePath = path.join(downloadDir, `chunk_${chunk.chunkIndex}.enc`);
//   const buffer = fs.readFileSync(encFilePath);
  
//   // First 12 bytes = IV, next 16 bytes = authTag
//   const iv = buffer.slice(0, 12).toString('hex');
//   const authTag = buffer.slice(12, 28).toString('hex');
  
//   console.log(`Chunk ${chunk.chunkIndex}:`);
//   console.log(`  IV: ${iv}`);
//   console.log(`  AuthTag: ${authTag}`);
  
//   return {
//     ...chunk,
//     iv: iv,
//     authTag: authTag
//   };
// });

// // Save updated manifest
// fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
// console.log('\n✓ Manifest updated with IV and authTag');






// // decrypt.js - Complete standalone decryption file

// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');

// /* =========================
//    CONFIGURATION
// ========================= */

// const CONFIG = {
//   ENCRYPTION_ALGORITHM: 'aes-256-gcm',
//   IV_LENGTH: 12,
//   AUTH_TAG_LENGTH: 16,
//   KEY_LENGTH: 32,
//   MASTER_SECRET: 'MySuperSecretKey'
// };

// /* =========================
//    KEY DERIVATION
// ========================= */

// function deriveKey(userId) {
//   return crypto.scryptSync(
//     CONFIG.MASTER_SECRET,
//     `user-${userId}`,
//     CONFIG.KEY_LENGTH
//   );
// }

// /* =========================
//    DECRYPT SINGLE CHUNK
// ========================= */

// function decryptChunk(encryptedBuffer, ivHex, authTagHex, key) {
//   const iv = Buffer.from(ivHex, 'hex');
//   const authTag = Buffer.from(authTagHex, 'hex');

//   // Encrypted file structure: [IV (12 bytes)][AuthTag (16 bytes)][Encrypted Data]
//   const encryptedData = encryptedBuffer.slice(
//     CONFIG.IV_LENGTH + CONFIG.AUTH_TAG_LENGTH
//   );

//   const decipher = crypto.createDecipheriv(
//     CONFIG.ENCRYPTION_ALGORITHM,
//     key,
//     iv
//   );

//   decipher.setAuthTag(authTag);

//   const decrypted = Buffer.concat([
//     decipher.update(encryptedData),
//     decipher.final()
//   ]);

//   return decrypted;
// }

// /* =========================
//    SHA256 HELPER
// ========================= */

// function sha256(buffer) {
//   return crypto
//     .createHash('sha256')
//     .update(buffer)
//     .digest('hex');
// }

// /* =========================
//    DECRYPT ALL CHUNKS
// ========================= */

// async function decryptAllChunks() {
//   try {
//     console.log('\n╔══════════════════════════════════════════════╗');
//     console.log('║              CHUNK DECRYPTION               ║');
//     console.log('╚══════════════════════════════════════════════╝');

//     // Paths
//     const downloadDir = path.join(__dirname, 'downloaded_chunks');
//     const manifestPath = path.join(downloadDir, 'download_manifest.json');
//     const decryptDir = path.join(__dirname, 'decrypted_chunks');

//     // Check if downloaded chunks exist
//     if (!fs.existsSync(downloadDir)) {
//       throw new Error('downloaded_chunks directory not found! Run restore.js first.');
//     }

//     if (!fs.existsSync(manifestPath)) {
//       throw new Error('download_manifest.json not found! Run restore.js first.');
//     }

//     // Read manifest
//     const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
//     console.log(`\nProfile: ${manifest.profileName}`);
//     console.log(`Total Chunks: ${manifest.totalChunks}`);
//     console.log(`Downloaded At: ${manifest.downloadedAt}`);

//     // Get userId from manifest or use default
//     const userId = manifest.userId || '12345';
    
//     // Check if IV and authTag are present
//     const missingIV = manifest.chunks.filter(c => !c.iv);
//     const missingAuthTag = manifest.chunks.filter(c => !c.authTag);
    
//     if (missingIV.length > 0 || missingAuthTag.length > 0) {
//       console.log('\n⚠ Missing IV or authTag detected!');
//       console.log('Attempting to extract from encrypted files...');
      
//       // Extract IV and authTag from .enc files
//       manifest.chunks = manifest.chunks.map(chunk => {
//         if (!chunk.iv || !chunk.authTag) {
//           const encFilePath = path.join(downloadDir, `chunk_${chunk.chunkIndex}.enc`);
          
//           if (!fs.existsSync(encFilePath)) {
//             throw new Error(`Encrypted file not found: chunk_${chunk.chunkIndex}.enc`);
//           }
          
//           const buffer = fs.readFileSync(encFilePath);
          
//           // First 12 bytes = IV, next 16 bytes = authTag
//           const iv = buffer.slice(0, 12).toString('hex');
//           const authTag = buffer.slice(12, 28).toString('hex');
          
//           console.log(`  Chunk ${chunk.chunkIndex}: Extracted IV and authTag`);
          
//           return {
//             ...chunk,
//             iv: iv,
//             authTag: authTag
//           };
//         }
//         return chunk;
//       });
      
//       // Save updated manifest
//       fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
//       console.log('  ✓ Manifest updated with IV and authTag\n');
//     }

//     // Derive key
//     const key = deriveKey(userId);
//     console.log(`\nKey Derived for User: ${userId}`);
//     console.log(`Algorithm: ${CONFIG.ENCRYPTION_ALGORITHM}`);
//     console.log(`Key Length: ${key.length} bytes`);

//     // Clean/create decrypt directory
//     if (fs.existsSync(decryptDir)) {
//       fs.rmSync(decryptDir, { recursive: true, force: true });
//       console.log('Cleaned existing decrypted_chunks directory');
//     }
//     fs.mkdirSync(decryptDir, { recursive: true });

//     const decryptedChunks = [];

//     console.log('\nStarting Decryption...');
//     console.log('─'.repeat(60));

//     // Process each chunk
//     for (const chunk of manifest.chunks) {
//       const chunkIndex = chunk.chunkIndex;
//       const encryptedFileName = `chunk_${chunkIndex}.enc`;
//       const encryptedFilePath = path.join(downloadDir, encryptedFileName);

//       console.log(`\n🔓 Decrypting ${encryptedFileName}...`);

//       // Check if encrypted file exists
//       if (!fs.existsSync(encryptedFilePath)) {
//         throw new Error(`Encrypted file not found: ${encryptedFileName}`);
//       }

//       // Read encrypted file
//       const encryptedBuffer = fs.readFileSync(encryptedFilePath);
//       console.log(`  Encrypted Size: ${(encryptedBuffer.length / 1024).toFixed(2)} KB`);
//       console.log(`  IV: ${chunk.iv.substring(0, 16)}...`);
//       console.log(`  AuthTag: ${chunk.authTag.substring(0, 16)}...`);

//       // Decrypt
//       const decryptedBuffer = decryptChunk(
//         encryptedBuffer,
//         chunk.iv,
//         chunk.authTag,
//         key
//       );

//       // Save decrypted chunk
//       const decryptedFileName = `chunk_${chunkIndex}.bin`;
//       const decryptedFilePath = path.join(decryptDir, decryptedFileName);
//       fs.writeFileSync(decryptedFilePath, decryptedBuffer);

//       console.log(`  ✓ Decrypted Successfully`);
//       console.log(`  Decrypted Size: ${(decryptedBuffer.length / 1024).toFixed(2)} KB`);

//       // Calculate hash of decrypted data
//       const decryptedHash = sha256(decryptedBuffer);
//       console.log(`  SHA256: ${decryptedHash.substring(0, 32)}...`);

//       // Verify with original hash if available
//       if (chunk.originalHash) {
//         if (decryptedHash === chunk.originalHash) {
//           console.log(`  Original Hash Verified: ✓`);
//         } else {
//           console.warn(`  ⚠ Warning: Original hash mismatch!`);
//           console.warn(`    Expected: ${chunk.originalHash.substring(0, 32)}...`);
//           console.warn(`    Got:      ${decryptedHash.substring(0, 32)}...`);
//         }
//       }

//       decryptedChunks.push({
//         chunkIndex: chunkIndex,
//         fileName: decryptedFileName,
//         filePath: decryptedFilePath,
//         size: decryptedBuffer.length,
//         sha256: decryptedHash
//       });
//     }

//     // Save decryption manifest
//     const decryptionManifest = {
//       decryptedAt: new Date().toISOString(),
//       profileName: manifest.profileName,
//       profileId: manifest.profileId,
//       userId: userId,
//       totalChunks: decryptedChunks.length,
//       totalSize: decryptedChunks.reduce((sum, c) => sum + c.size, 0),
//       chunks: decryptedChunks.map(c => ({
//         chunkIndex: c.chunkIndex,
//         fileName: c.fileName,
//         size: c.size,
//         sha256: c.sha256
//       }))
//     };

//     const decryptManifestPath = path.join(decryptDir, 'decryption_manifest.json');
//     fs.writeFileSync(decryptManifestPath, JSON.stringify(decryptionManifest, null, 2));

//     console.log('\n' + '─'.repeat(60));
//     console.log('✓ All Chunks Decrypted Successfully!');
//     console.log(`  Total Chunks: ${decryptedChunks.length}`);
//     console.log(`  Total Size: ${(decryptionManifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
//     console.log(`  Output Directory: ${decryptDir}`);
//     console.log(`  Manifest: decryption_manifest.json`);

//     console.log('\n╔══════════════════════════════════════════════╗');
//     console.log('║         DECRYPTION COMPLETE                 ║');
//     console.log('╚══════════════════════════════════════════════╝');
//     console.log('Next Step: Merge chunks into ZIP file');
//     console.log('Run: node merge.js\n');

//     return {
//       success: true,
//       decryptedChunks,
//       manifest: decryptionManifest
//     };

//   } catch (error) {
//     console.error('\n╔══════════════════════════════════════════════╗');
//     console.error('║           DECRYPTION FAILED                 ║');
//     console.error('╚══════════════════════════════════════════════╝');
//     console.error(`\n✗ Error: ${error.message}\n`);
    
//     // Check for common issues
//     if (error.message.includes('bad decrypt') || error.message.includes('auth')) {
//       console.error('🔍 Possible Causes:');
//       console.error('  1. MASTER_SECRET might be different from encryption');
//       console.error('  2. IV or authTag might be incorrect');
//       console.error('  3. Encrypted file might be corrupted');
//       console.error('  4. User ID might be wrong (used for key derivation)\n');
//     }
    
//     throw error;
//   }
// }

// /* =========================
//    EXECUTE
// ========================= */

// if (require.main === module) {
//   decryptAllChunks()
//     .then(() => {
//       console.log('✓ Decryption completed successfully\n');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('✗ Decryption failed\n');
//       process.exit(1);
//     });
// }

// module.exports = {
//   decryptAllChunks,
//   decryptChunk,
//   deriveKey
// };








// // merge.js - Merge decrypted chunks back into ZIP file

// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');

// /* =========================
//    SHA256 HELPER
// ========================= */

// function sha256(buffer) {
//   return crypto
//     .createHash('sha256')
//     .update(buffer)
//     .digest('hex');
// }

// function generateFileSHA256(filePath) {
//   return new Promise((resolve, reject) => {
//     const hash = crypto.createHash('sha256');
//     const stream = fs.createReadStream(filePath);
//     stream.on('data', chunk => hash.update(chunk));
//     stream.on('end', () => resolve(hash.digest('hex')));
//     stream.on('error', reject);
//   });
// }

// /* =========================
//    MERGE CHUNKS
// ========================= */

// async function mergeChunks() {
//   try {
//     console.log('\n╔══════════════════════════════════════════════╗');
//     console.log('║              CHUNK MERGING                  ║');
//     console.log('╚══════════════════════════════════════════════╝');

//     // Paths
//     const decryptDir = path.join(__dirname, 'decrypted_chunks');
//     const decryptManifestPath = path.join(decryptDir, 'decryption_manifest.json');
//     const outputDir = path.join(__dirname, 'restored_profile');
    
//     // Check if decrypted chunks exist
//     if (!fs.existsSync(decryptDir)) {
//       throw new Error('decrypted_chunks directory not found! Run decrypt.js first.');
//     }

//     if (!fs.existsSync(decryptManifestPath)) {
//       throw new Error('decryption_manifest.json not found! Run decrypt.js first.');
//     }

//     // Read manifest
//     const manifest = JSON.parse(fs.readFileSync(decryptManifestPath, 'utf8'));
//     console.log(`\nProfile Name: ${manifest.profileName}`);
//     console.log(`Total Chunks: ${manifest.totalChunks}`);
//     console.log(`Total Size: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
//     console.log(`Decrypted At: ${manifest.decryptedAt}`);

//     // Sort chunks by index to ensure correct order
//     const sortedChunks = manifest.chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

//     // Create output directory
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     // Output ZIP file path
//     const zipFileName = `${manifest.profileName.replace(/\s+/g, '_')}.zip`;
//     const zipFilePath = path.join(outputDir, zipFileName);

//     console.log('\nStarting Merge...');
//     console.log('─'.repeat(60));
//     console.log(`\nOutput: ${zipFileName}`);

//     // Create write stream for merged file
//     const writeStream = fs.createWriteStream(zipFilePath);
//     let totalBytesWritten = 0;

//     // Merge chunks in order
//     for (const chunk of sortedChunks) {
//       const chunkPath = path.join(decryptDir, chunk.fileName);
      
//       console.log(`\n📦 Merging ${chunk.fileName}...`);

//       // Check if chunk file exists
//       if (!fs.existsSync(chunkPath)) {
//         throw new Error(`Chunk file not found: ${chunk.fileName}`);
//       }

//       // Read chunk
//       const chunkBuffer = fs.readFileSync(chunkPath);
      
//       console.log(`  Size: ${(chunkBuffer.length / 1024).toFixed(2)} KB`);
//       console.log(`  SHA256: ${chunk.sha256.substring(0, 32)}...`);

//       // Verify chunk hash before merging
//       const verifiedHash = sha256(chunkBuffer);
//       if (verifiedHash !== chunk.sha256) {
//         throw new Error(
//           `Hash mismatch for ${chunk.fileName}!\n` +
//           `  Expected: ${chunk.sha256}\n` +
//           `  Got:      ${verifiedHash}`
//         );
//       }
//       console.log(`  Hash Verified: ✓`);

//       // Write chunk to merged file
//       writeStream.write(chunkBuffer);
//       totalBytesWritten += chunkBuffer.length;
      
//       console.log(`  Merged: ✓`);
//     }

//     // Close the write stream
//     writeStream.end();

//     // Wait for write to complete
//     await new Promise((resolve, reject) => {
//       writeStream.on('finish', resolve);
//       writeStream.on('error', reject);
//     });

//     console.log('\n' + '─'.repeat(60));
//     console.log('✓ All Chunks Merged Successfully!');
//     console.log(`  Output File: ${zipFilePath}`);
//     console.log(`  Total Size: ${(totalBytesWritten / 1024 / 1024).toFixed(2)} MB`);

//     // Calculate final ZIP file hash
//     const zipHash = await generateFileSHA256(zipFilePath);
//     console.log(`  SHA256: ${zipHash}`);
    
//     // Verify total size matches
//     if (totalBytesWritten === manifest.totalSize) {
//       console.log(`  Size Verification: ✓`);
//     } else {
//       console.warn(`  ⚠ Size mismatch (Expected: ${manifest.totalSize}, Got: ${totalBytesWritten})`);
//     }

//     // Save merge manifest
//     const mergeManifest = {
//       mergedAt: new Date().toISOString(),
//       profileName: manifest.profileName,
//       profileId: manifest.profileId,
//       userId: manifest.userId,
//       outputFile: zipFileName,
//       totalSize: totalBytesWritten,
//       sha256: zipHash,
//       totalChunks: sortedChunks.length,
//       chunks: sortedChunks.map(c => ({
//         chunkIndex: c.chunkIndex,
//         fileName: c.fileName,
//         size: c.size,
//         sha256: c.sha256
//       }))
//     };

//     const mergeManifestPath = path.join(outputDir, 'merge_manifest.json');
//     fs.writeFileSync(mergeManifestPath, JSON.stringify(mergeManifest, null, 2));

//     console.log(`\n✓ Merge Manifest Saved: merge_manifest.json`);
    
//     console.log('\n╔══════════════════════════════════════════════╗');
//     console.log('║           MERGE COMPLETE                    ║');
//     console.log('╚══════════════════════════════════════════════╝');
//     console.log(`✓ ZIP File Created: ${zipFilePath}`);
//     console.log('Next Step: Unzip to restore original profile folder');
//     console.log('Run: node unzip.js\n');

//     return {
//       success: true,
//       zipFilePath,
//       totalSize: totalBytesWritten,
//       sha256: zipHash,
//       manifest: mergeManifest
//     };

//   } catch (error) {
//     console.error('\n╔══════════════════════════════════════════════╗');
//     console.error('║             MERGE FAILED                    ║');
//     console.error('╚══════════════════════════════════════════════╝');
//     console.error(`\n✗ Error: ${error.message}\n`);
    
//     console.error('🔍 Troubleshooting:');
//     console.error('  1. Make sure you ran decrypt.js first');
//     console.error('  2. Check that all decrypted chunks exist');
//     console.error('  3. Verify chunk hashes match decryption_manifest.json');
//     console.error('  4. Ensure enough disk space for merged file\n');
    
//     throw error;
//   }
// }

// /* =========================
//    EXECUTE
// ========================= */

// if (require.main === module) {
//   mergeChunks()
//     .then((result) => {
//       console.log(`\n✓ Successfully merged into: ${result.zipFilePath}`);
//       console.log(`  File size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
//       console.log(`  SHA256: ${result.sha256}\n`);
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('\n✗ Merge failed\n');
//       process.exit(1);
//     });
// }

// module.exports = {
//   mergeChunks
// };



















// // unzip.js - Extract ZIP back to original profile folder

// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');
// const { exec } = require('child_process');
// const AdmZip = require('adm-zip');

// /* =========================
//    SHA256 HELPER
// ========================= */

// function generateFileSHA256(filePath) {
//   return new Promise((resolve, reject) => {
//     const hash = crypto.createHash('sha256');
//     const stream = fs.createReadStream(filePath);
//     stream.on('data', chunk => hash.update(chunk));
//     stream.on('end', () => resolve(hash.digest('hex')));
//     stream.on('error', reject);
//   });
// }

// /* =========================
//    GET DIRECTORY SIZE
// ========================= */

// function getDirectorySize(dirPath) {
//   let totalSize = 0;
  
//   function walkDirectory(currentPath) {
//     const files = fs.readdirSync(currentPath);
    
//     for (const file of files) {
//       const filePath = path.join(currentPath, file);
//       const stats = fs.statSync(filePath);
      
//       if (stats.isDirectory()) {
//         walkDirectory(filePath);
//       } else {
//         totalSize += stats.size;
//       }
//     }
//   }
  
//   walkDirectory(dirPath);
//   return totalSize;
// }

// function countFiles(dirPath) {
//   let count = 0;
  
//   function walkDirectory(currentPath) {
//     const files = fs.readdirSync(currentPath);
    
//     for (const file of files) {
//       const filePath = path.join(currentPath, file);
//       const stats = fs.statSync(filePath);
      
//       if (stats.isDirectory()) {
//         walkDirectory(filePath);
//       } else {
//         count++;
//       }
//     }
//   }
  
//   walkDirectory(dirPath);
//   return count;
// }

// /* =========================
//    UNZIP PROFILE
// ========================= */

// async function unzipProfile() {
//   try {
//     console.log('\n╔══════════════════════════════════════════════╗');
//     console.log('║           PROFILE UNZIPPING                 ║');
//     console.log('╚══════════════════════════════════════════════╝');

//     // Paths
//     const restoredDir = path.join(__dirname, 'restored_profile');
//     const mergeManifestPath = path.join(restoredDir, 'merge_manifest.json');
    
//     // Check if merge manifest exists
//     if (!fs.existsSync(restoredDir)) {
//       throw new Error('restored_profile directory not found! Run merge.js first.');
//     }

//     if (!fs.existsSync(mergeManifestPath)) {
//       throw new Error('merge_manifest.json not found! Run merge.js first.');
//     }

//     // Read merge manifest
//     const mergeManifest = JSON.parse(fs.readFileSync(mergeManifestPath, 'utf8'));
//     console.log(`\nProfile Name: ${mergeManifest.profileName}`);
//     console.log(`Output File: ${mergeManifest.outputFile}`);
//     console.log(`Total Size: ${(mergeManifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
//     console.log(`SHA256: ${mergeManifest.sha256.substring(0, 32)}...`);

//     // Paths for ZIP and output
//     const zipFilePath = path.join(restoredDir, mergeManifest.outputFile);
//     const profileOutputDir = path.join(__dirname, 'profiles', mergeManifest.profileName.replace(/\s+/g, '_'));

//     // Check if ZIP file exists
//     if (!fs.existsSync(zipFilePath)) {
//       throw new Error(`ZIP file not found: ${zipFilePath}`);
//     }

//     // Verify ZIP file hash before unzipping
//     console.log('\nVerifying ZIP file integrity...');
//     const zipHash = await generateFileSHA256(zipFilePath);
    
//     if (zipHash !== mergeManifest.sha256) {
//       throw new Error(
//         `ZIP file hash mismatch!\n` +
//         `  Expected: ${mergeManifest.sha256}\n` +
//         `  Got:      ${zipHash}`
//       );
//     }
//     console.log('✓ ZIP File Hash Verified');

//     // Clean existing profile directory if exists
//     if (fs.existsSync(profileOutputDir)) {
//       console.log(`\nRemoving existing profile directory: ${profileOutputDir}`);
//       fs.rmSync(profileOutputDir, { recursive: true, force: true });
//     }

//     // Create output directory
//     fs.mkdirSync(profileOutputDir, { recursive: true });

//     console.log('\nStarting Unzip...');
//     console.log('─'.repeat(60));
//     console.log(`\n📦 Extracting: ${mergeManifest.outputFile}`);
//     console.log(`📁 Destination: ${profileOutputDir}`);

//     // Extract ZIP file
//     const zip = new AdmZip(zipFilePath);
    
//     // Get all entries for logging
//     const zipEntries = zip.getEntries();
//     console.log(`\nTotal entries in ZIP: ${zipEntries.length}`);
    
//     // Extract all files
//     zip.extractAllTo(profileOutputDir, true);
    
//     console.log('\n' + '─'.repeat(60));
//     console.log('✓ Profile Extracted Successfully!');

//     // Calculate extracted stats
//     const extractedSize = getDirectorySize(profileOutputDir);
//     const extractedFiles = countFiles(profileOutputDir);

//     console.log(`\nExtraction Details:`);
//     console.log(`  Output Directory: ${profileOutputDir}`);
//     console.log(`  Total Files: ${extractedFiles}`);
//     console.log(`  Total Size: ${(extractedSize / 1024 / 1024).toFixed(2)} MB`);

//     // Show directory structure (first level)
//     console.log(`\nDirectory Structure:`);
//     const topLevelItems = fs.readdirSync(profileOutputDir);
//     topLevelItems.forEach(item => {
//       const itemPath = path.join(profileOutputDir, item);
//       const stats = fs.statSync(itemPath);
//       if (stats.isDirectory()) {
//         console.log(`  📁 ${item}/`);
//       } else {
//         console.log(`  📄 ${item} (${(stats.size / 1024).toFixed(2)} KB)`);
//       }
//     });

//     // Save unzip manifest
//     const unzipManifest = {
//       extractedAt: new Date().toISOString(),
//       profileName: mergeManifest.profileName,
//       profileId: mergeManifest.profileId,
//       userId: mergeManifest.userId,
//       sourceZip: mergeManifest.outputFile,
//       outputDirectory: profileOutputDir,
//       totalFiles: extractedFiles,
//       totalSize: extractedSize,
//       zipSHA256: zipHash,
//       topLevelStructure: topLevelItems
//     };

//     const unzipManifestPath = path.join(profileOutputDir, 'unzip_manifest.json');
//     fs.writeFileSync(unzipManifestPath, JSON.stringify(unzipManifest, null, 2));

//     console.log(`\n✓ Unzip Manifest Saved: unzip_manifest.json`);
    
//     console.log('\n╔══════════════════════════════════════════════╗');
//     console.log('║       PROFILE RESTORED SUCCESSFULLY         ║');
//     console.log('╚══════════════════════════════════════════════╝');
//     console.log(`\n✓ Original profile restored to:`);
//     console.log(`  ${profileOutputDir}`);
//     console.log(`\n✅ Complete Pipeline Finished:`);
//     console.log(`  MongoDB → MinIO → Download → Decrypt → Merge → Unzip → Profile\n`);

//     return {
//       success: true,
//       profileOutputDir,
//       totalFiles: extractedFiles,
//       totalSize: extractedSize,
//       manifest: unzipManifest
//     };

//   } catch (error) {
//     console.error('\n╔══════════════════════════════════════════════╗');
//     console.error('║           UNZIP FAILED                      ║');
//     console.error('╚══════════════════════════════════════════════╝');
//     console.error(`\n✗ Error: ${error.message}\n`);
    
//     console.error('🔍 Troubleshooting:');
//     console.error('  1. Make sure you ran merge.js first');
//     console.error('  2. Check that restored_profile/Work_Chrome.zip exists');
//     console.error('  3. Verify ZIP file is not corrupted');
//     console.error('  4. Ensure enough disk space for extraction');
//     console.error('  5. Install adm-zip if missing: npm install adm-zip\n');
    
//     throw error;
//   }
// }

// /* =========================
//    EXECUTE
// ========================= */

// if (require.main === module) {
//   unzipProfile()
//     .then((result) => {
//       console.log(`\n✓ Profile restored successfully!`);
//       console.log(`  Location: ${result.profileOutputDir}`);
//       console.log(`  Files: ${result.totalFiles}`);
//       console.log(`  Size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB\n`);
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('\n✗ Unzip failed\n');
//       process.exit(1);
//     });
// }

// module.exports = {
//   unzipProfile
// };











// cleanup.js - Clean up all generated files and folders

const fs = require('fs');
const path = require('path');

/* =========================
   CLEANUP ALL
========================= */

async function cleanupAll() {
  try {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║              CLEANUP ALL                    ║');
    console.log('╚══════════════════════════════════════════════╝');

    const baseDir = __dirname;
    
    const itemsToDelete = [
      'downloaded_chunks',
      'decrypted_chunks',
      'restored_profile',
      'user_1.zip'
    ];

    let deletedCount = 0;

    for (const item of itemsToDelete) {
      const itemPath = path.join(baseDir, item);
      
      if (fs.existsSync(itemPath)) {
        try {
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
            console.log(`✓ Deleted directory: ${item}/`);
          } else {
            fs.unlinkSync(itemPath);
            console.log(`✓ Deleted file: ${item}`);
          }
          
          deletedCount++;
        } catch (error) {
          console.error(`✗ Failed to delete ${item}: ${error.message}`);
        }
      } else {
        console.log(`- Not found (skip): ${item}`);
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`✓ Cleanup Complete!`);
    console.log(`  Items Deleted: ${deletedCount}`);
    console.log(`  Items Skipped: ${itemsToDelete.length - deletedCount}`);
    
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║           CLEANUP FINISHED                  ║');
    console.log('╚══════════════════════════════════════════════╝');
    
    console.log('\nRemaining folders:');
    const remaining = fs.readdirSync(baseDir);
    remaining.forEach(item => {
      const itemPath = path.join(baseDir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        console.log(`  📁 ${item}/`);
      } else {
        console.log(`  📄 ${item}`);
      }
    });

  } catch (error) {
    console.error('\n✗ Cleanup Failed:', error.message);
    throw error;
  }
}

/* =========================
   EXECUTE
========================= */

if (require.main === module) {
  cleanupAll()
    .then(() => {
      console.log('\n✓ All cleanup completed\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Cleanup failed\n');
      process.exit(1);
    });
}

module.exports = {
  cleanupAll
};