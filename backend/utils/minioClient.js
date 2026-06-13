const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,

  accessKey: 'admin',
  secretKey: 'admin12345'
});

const BUCKET = 'cloud-browser-profiles';

async function connectMinIO() {
  try {
    console.log('\nConnecting to MinIO...');

    const exists =
      await minioClient.bucketExists(
        BUCKET
      );

    if (!exists) {

      console.log(
        `Bucket "${BUCKET}" not found`
      );

      console.log(
        'Creating bucket...'
      );

      await minioClient.makeBucket(
        BUCKET
      );

      console.log(
        `Bucket "${BUCKET}" created successfully`
      );
    }

    console.log(
      'MinIO Connected Successfully'
    );

    return true;

  } catch (error) {

    console.error(
      '\nMinIO Connection Failed'
    );

    console.error(
      error.message
    );

    return false;
  }
}

module.exports = {
  minioClient,
  connectMinIO,
  BUCKET
};


if (require.main === module) {
  connectMinIO();
}