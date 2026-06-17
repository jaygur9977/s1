// config.js - API Configuration
// Automatically detects the correct API URL based on where the app is accessed

const getApiUrl = () => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // If running locally
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    
    // If accessed from network (other devices)
    // Use the same hostname but port 5000
    return `http://${hostname}:5000`;
};

const getMinioUrl = () => {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:9001';
    }
    
    return `http://${hostname}:9001`;
};

const config = {
    API_URL: getApiUrl(),
    MINIO_URL: getMinioUrl(),
};

console.log('🌐 API URL:', config.API_URL);
console.log('📦 MinIO URL:', config.MINIO_URL);

export default config;