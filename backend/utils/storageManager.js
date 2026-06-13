// const fs = require('fs');
// const path = require('path');
// const archiver = require('archiver');

// async function compressProfile() {
//   const profilePath = path.join(
//     __dirname,
//     '..',
//     'profiles',
//     'user_1'
//   );

//   const outputPath = path.join(
//     __dirname,
//     '',
//     'user_1.zip'
//   );

//   const output = fs.createWriteStream(outputPath);

//   const archive = archiver('zip', {
//     zlib: { level: 9 }
//   });

//   archive.pipe(output);

//   archive.directory(profilePath, false);

//   await archive.finalize();

//   output.on('close', () => {
//     console.log('Done');
//     console.log(outputPath);
//   });
// }

// compressProfile().catch(console.error);











// chunking 



// const fs = require('fs');
// const path = require('path');

// const CONFIG = {
//   CHUNK_SIZE: 50 * 1024 * 1024
// };

// async function splitFile() {
//   const filePath = path.join(__dirname, 'user_1.zip');

//   const outputDir = path.join(__dirname, 'chunks');

//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   const fileBuffer = fs.readFileSync(filePath);

//   let chunkIndex = 0;

//   for (
//     let offset = 0;
//     offset < fileBuffer.length;
//     offset += CONFIG.CHUNK_SIZE
//   ) {
//     const chunk = fileBuffer.slice(
//       offset,
//       offset + CONFIG.CHUNK_SIZE
//     );

//     const chunkPath = path.join(
//       outputDir,
//       `chunk_${chunkIndex}.bin`
//     );

//     fs.writeFileSync(chunkPath, chunk);

//     console.log(
//       `Created chunk_${chunkIndex}.bin (${chunk.length} bytes)`
//     );

//     chunkIndex++;
//   }

//   console.log(`Total Chunks: ${chunkIndex}`);
// }

// splitFile();












// encript chunk 


// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');

// const CONFIG = {
//   CHUNK_SIZE: 50 * 1024 * 1024, // 50 MB

//   ENCRYPTION_ALGORITHM: 'aes-256-gcm',

//   IV_LENGTH: 12,
//   AUTH_TAG_LENGTH: 16,

//   KEY_LENGTH: 32,

//   MASTER_SECRET:
//     'MySuperSecretKey'
// };

// // ========================
// // KEY DERIVATION
// // ========================

// function deriveKey(userId) {
//   return crypto.scryptSync(
//     CONFIG.MASTER_SECRET,
//     `user-${userId}`,
//     CONFIG.KEY_LENGTH
//   );
// }

// // ========================
// // SHA256 HASH
// // ========================

// function sha256(buffer) {
//   return crypto
//     .createHash('sha256')
//     .update(buffer)
//     .digest('hex');
// }

// // ========================
// // CHUNK ENCRYPTION
// // ========================

// function encryptChunk(chunkBuffer, key) {
//   const iv = crypto.randomBytes(
//     CONFIG.IV_LENGTH
//   );

//   const cipher =
//     crypto.createCipheriv(
//       CONFIG.ENCRYPTION_ALGORITHM,
//       key,
//       iv
//     );

//   const encrypted = Buffer.concat([
//     cipher.update(chunkBuffer),
//     cipher.final()
//   ]);

//   const authTag =
//     cipher.getAuthTag();

//   return {
//     encryptedFile: Buffer.concat([
//       iv,
//       authTag,
//       encrypted
//     ]),
//     iv: iv.toString('hex'),
//     authTag:
//       authTag.toString('hex')
//   };
// }

// // ========================
// // MAIN PROCESS
// // ========================

// async function processZip() {
//   try {
//     const userId = '12345';

//     const zipPath = path.join(
//       __dirname,
//       'user_1.zip'
//     );

//     if (!fs.existsSync(zipPath)) {
//       throw new Error(
//         'user_1.zip not found'
//       );
//     }

//     const encryptedDir =
//       path.join(
//         __dirname,
//         'encrypted_chunks'
//       );

//     if (
//       !fs.existsSync(encryptedDir)
//     ) {
//       fs.mkdirSync(
//         encryptedDir,
//         { recursive: true }
//       );
//     }

//     const key =
//       deriveKey(userId);

//     const fileBuffer =
//       fs.readFileSync(zipPath);

//     const totalSize =
//       fileBuffer.length;

//     const metadata = {
//       userId,
//       originalFile:
//         'user_1.zip',
//       originalSize:
//         totalSize,
//       createdAt:
//         new Date().toISOString(),
//       chunks: []
//     };

//     let chunkIndex = 0;

//     for (
//       let offset = 0;
//       offset < totalSize;
//       offset +=
//         CONFIG.CHUNK_SIZE
//     ) {
//       const chunk =
//         fileBuffer.slice(
//           offset,
//           offset +
//             CONFIG.CHUNK_SIZE
//         );

//       const chunkHash =
//         sha256(chunk);

//       const {
//         encryptedFile,
//         iv,
//         authTag
//       } = encryptChunk(
//         chunk,
//         key
//       );

//       const encryptedHash =
//         sha256(encryptedFile);

//       const filename =
//         `chunk_${chunkIndex}.enc`;

//       const outputPath =
//         path.join(
//           encryptedDir,
//           filename
//         );

//       fs.writeFileSync(
//         outputPath,
//         encryptedFile
//       );

//       metadata.chunks.push({
//         index: chunkIndex,
//         filename,
//         originalSize:
//           chunk.length,
//         encryptedSize:
//           encryptedFile.length,
//         sha256:
//           encryptedHash,
//         originalHash:
//           chunkHash,
//         iv,
//         authTag
//       });

//       console.log(
//         `Chunk ${chunkIndex} encrypted`
//       );

//       chunkIndex++;
//     }

//     fs.writeFileSync(
//       path.join(
//         encryptedDir,
//         'metadata.json'
//       ),
//       JSON.stringify(
//         metadata,
//         null,
//         2
//       )
//     );

//     console.log(
//       '\nProcess Complete'
//     );

//     console.log(
//       `Total Chunks: ${metadata.chunks.length}`
//     );

//     console.log(
//       `Metadata Saved`
//     );
//   } catch (err) {
//     console.error(err);
//   }
// }

// processZip();












// save to minio


// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');

// const {
//   minioClient,
//   connectMinIO,
//   BUCKET
// } = require('./minioClient');

// function generateSHA256(
//   filePath
// ) {
//   return new Promise(
//     (resolve, reject) => {

//       const hash =
//         crypto.createHash(
//           'sha256'
//         );

//       const stream =
//         fs.createReadStream(
//           filePath
//         );

//       stream.on(
//         'data',
//         chunk =>
//           hash.update(chunk)
//       );

//       stream.on(
//         'end',
//         () =>
//           resolve(
//             hash.digest(
//               'hex'
//             )
//           )
//       );

//       stream.on(
//         'error',
//         reject
//       );
//     }
//   );
// }

// async function uploadChunksToMinio() {

//   const connected =
//     await connectMinIO();

//   if (!connected) {
//     return;
//   }

//   try {

//     const userId =
//       '12345';

//     const profileName =
//       'Work Chrome';

//     const version =
//       'v1';

//     const encryptedDir =
//       path.join(
//         __dirname,
//         'encrypted_chunks'
//       );

//     const files =
//       fs.readdirSync(
//         encryptedDir
//       );

//     const metadata = [];

//     console.log(
//       '\nStarting Upload...'
//     );

//     for (const file of files) {

//       if (
//         !file.endsWith('.enc')
//       ) {
//         continue;
//       }

//       const fullPath =
//         path.join(
//           encryptedDir,
//           file
//         );

//       const stats =
//         fs.statSync(
//           fullPath
//         );

//       const checksum =
//         await generateSHA256(
//           fullPath
//         );

//       const objectKey =
//         `profiles/${userId}/${profileName}/${version}/${file}`;

//       console.log(
//         `\nUploading ${file}...`
//       );

//       const stream =
//         fs.createReadStream(
//           fullPath
//         );

//       await minioClient.putObject(
//         BUCKET,
//         objectKey,
//         stream,
//         stats.size,
//         {
//           checksum,
//           originalSize:
//             String(
//               stats.size
//             )
//         }
//       );

//       const uploadedObject =
//         await minioClient.statObject(
//           BUCKET,
//           objectKey
//         );

//       console.log(
//         `Upload Success: ${file}`
//       );

//       console.log(
//         `Verified: ${file}`
//       );

//       console.log(
//         `Size: ${uploadedObject.size} bytes`
//       );

//       metadata.push({
//         chunkIndex:
//           metadata.length,
//         objectKey,
//         checksum,
//         originalSize:
//           stats.size
//       });

//       // Uncomment in production

//       /*
//       fs.unlinkSync(
//         fullPath
//       );

//       console.log(
//         `Deleted Local File: ${file}`
//       );
//       */
//     }

//     fs.writeFileSync(
//       path.join(
//         encryptedDir,
//         'uploadMetadata.json'
//       ),
//       JSON.stringify(
//         metadata,
//         null,
//         2
//       )
//     );

//     console.log(
//       '\nAll Chunks Uploaded Successfully'
//     );

//     console.log(
//       'Metadata Saved'
//     );

//   } catch (error) {

//     console.error(
//       '\nUpload Failed'
//     );

//     console.error(
//       error.message
//     );

//     console.error(
//       error.stack
//     );
//   }
// }

// uploadChunksToMinio();












// save meta data to mongodb


const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { MongoClient } = require('mongodb');

/* =========================
   MONGODB
========================= */


require('dotenv').config({
  path: require('path').join(
    __dirname,
    '../.env'
  )
});

let client;
let db;

async function connectMongo() {

  if (db) {
    return db;
  }

  console.log(
    '\nConnecting to MongoDB...'
  );

  client = new MongoClient(
    process.env.MONGODB_URI
  );

  await client.connect();

  db = client.db(
    'cloudBrowser'
  );

  console.log(
    'MongoDB Connected Successfully'
  );

  return db;
}

/* =========================
   SAVE METADATA
========================= */

async function saveMetadata({
  userId,
  profileName,
  version,
  uploadedChunks
}) {

  try {

    const db =
      await connectMongo();

    const collection =
      db.collection(
        'profiles'
      );

    const profileId =
      crypto.randomUUID();

    const document = {

      profileId,

      userId,

      name: profileName,

      currentChunkVersion:
        version,

      createdAt:
        new Date(),

      chunkReferences: {

        latest: {

          totalChunks:
            uploadedChunks.length,

          chunks:
            uploadedChunks.map(
              chunk => ({
                chunkIndex:
                  chunk.chunkIndex,

                storageKey:
                  chunk.objectKey,

                checksum:
                  chunk.checksum,

                originalSize:
                  chunk.originalSize
              })
            )
        }
      }
    };

    const result =
      await collection.insertOne(
        document
      );

    console.log(
      '\nMetadata Saved Successfully'
    );

    console.log(
      `Mongo ID: ${result.insertedId}`
    );

    console.log(
      `Profile ID: ${profileId}`
    );

    return profileId;

  } catch (error) {

    console.error(
      '\nMetadata Save Failed'
    );

    console.error(
      error.message
    );

    throw error;
  }
}

/* =========================
   CLEANUP
========================= */

async function cleanupFiles() {

  try {

    console.log(
      '\nStarting Cleanup...'
    );

    const encryptedDir =
      path.join(
        __dirname,
        'encrypted_chunks'
      );

    if (
      fs.existsSync(
        encryptedDir
      )
    ) {

      const files =
        fs.readdirSync(
          encryptedDir
        );

      for (const file of files) {

        const filePath =
          path.join(
            encryptedDir,
            file
          );

          

        fs.unlinkSync(
          filePath
        );

        console.log(
          `Deleted: ${file}`
        );
      }
    }







      const chunkDir =
      path.join(
        __dirname,
        'chunks'
      );

    if (
      fs.existsSync(
        chunkDir
      )
    ) {

      const files =
        fs.readdirSync(
          chunkDir
        );

      for (const file of files) {

        const filePath =
          path.join(
            chunkDir,
            file
          );

          

        fs.unlinkSync(
          filePath
        );

        console.log(
          `Deleted: ${file}`
        );
      }
    }
















    const zipPath =
      path.join(
        __dirname,
        'user_1.zip'
      );

    if (
      fs.existsSync(zipPath)
    ) {

      fs.unlinkSync(
        zipPath
      );

      console.log(
        'Deleted: user_1.zip'
      );
    }

    console.log(
      '\nCleanup Complete'
    );

  } catch (error) {

    console.error(
      '\nCleanup Failed'
    );

    console.error(
      error.message
    );
  }
}

/* =========================
   EXAMPLE CALL
========================= */

async function main() {
  
  // Read the actual upload metadata to get real checksums
  const metadataPath = path.join(__dirname, 'encrypted_chunks', 'uploadMetadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    console.error('uploadMetadata.json not found! Run upload first.');
    process.exit(1);
  }
  
  const uploadMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  await saveMetadata({
    userId: '12345',
    profileName: 'Work Chrome',
    version: 'v1',
    uploadedChunks: uploadMetadata  // Use REAL checksums from upload
  });

  await cleanupFiles();

  process.exit(0);
}

if (
  require.main === module
) {
  main();
}

module.exports = {
  connectMongo,
  saveMetadata,
  cleanupFiles
};