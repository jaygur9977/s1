const zlib = require('zlib');
const { promisify } = require('util');
const { pipeline } = require('stream');
const { createReadStream, createWriteStream, readFileSync, writeFileSync } = require('fs');

// Promisify zlib methods
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);
const streamPipeline = promisify(pipeline);

/**
 * Compression Utilities
 * Provides consistent compression/decompression across the application
 */
class CompressionUtil {
    constructor() {
        // Compression levels
        this.LEVELS = {
            FAST: 1,
            DEFAULT: 6,
            MAXIMUM: 9
        };

        // Default options
        this.defaultGzipOptions = {
            level: this.LEVELS.MAXIMUM
        };

        this.defaultBrotliOptions = {
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 11 // Maximum quality
            }
        };
    }

    // ============================================================
    // GZIP COMPRESSION (General purpose)
    // ============================================================

    /**
     * Compress data using gzip
     * @param {string|Buffer} data - Data to compress
     * @param {number} level - Compression level (1-9)
     * @returns {Promise<Buffer>} Compressed data
     */
    async gzipCompress(data, level = this.LEVELS.MAXIMUM) {
        try {
            const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
            const compressed = await gzip(input, { level });
            
            console.log(`   📦 Gzip: ${(input.length / 1024).toFixed(2)}KB → ${(compressed.length / 1024).toFixed(2)}KB (${this._getRatio(input.length, compressed.length)}%)`);
            
            return compressed;
        } catch (error) {
            console.error('Gzip compression error:', error.message);
            throw new Error('Failed to compress data with gzip');
        }
    }

    /**
     * Decompress gzip data
     * @param {Buffer} compressedData - Compressed data
     * @returns {Promise<Buffer>} Decompressed data
     */
    async gzipDecompress(compressedData) {
        try {
            const decompressed = await gunzip(compressedData);
            
            console.log(`   📦 Gunzip: ${(compressedData.length / 1024).toFixed(2)}KB → ${(decompressed.length / 1024).toFixed(2)}KB`);
            
            return decompressed;
        } catch (error) {
            console.error('Gzip decompression error:', error.message);
            throw new Error('Failed to decompress gzip data');
        }
    }

    // ============================================================
    // DEFLATE COMPRESSION
    // ============================================================

    /**
     * Compress data using deflate
     * @param {string|Buffer} data - Data to compress
     * @returns {Promise<Buffer>} Compressed data
     */
    async deflateCompress(data) {
        try {
            const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
            const compressed = await deflate(input);
            
            console.log(`   📦 Deflate: ${(input.length / 1024).toFixed(2)}KB → ${(compressed.length / 1024).toFixed(2)}KB`);
            
            return compressed;
        } catch (error) {
            console.error('Deflate compression error:', error.message);
            throw new Error('Failed to compress data with deflate');
        }
    }

    /**
     * Decompress deflate data
     * @param {Buffer} compressedData - Compressed data
     * @returns {Promise<Buffer>} Decompressed data
     */
    async deflateDecompress(compressedData) {
        try {
            const decompressed = await inflate(compressedData);
            return decompressed;
        } catch (error) {
            console.error('Deflate decompression error:', error.message);
            throw new Error('Failed to decompress deflate data');
        }
    }

    // ============================================================
    // BROTLI COMPRESSION (Better compression ratio)
    // ============================================================

    /**
     * Compress data using brotli (highest compression ratio)
     * @param {string|Buffer} data - Data to compress
     * @returns {Promise<Buffer>} Compressed data
     */
    async brotliCompressData(data) {
        try {
            const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
            const compressed = await brotliCompress(input, this.defaultBrotliOptions);
            
            console.log(`   📦 Brotli: ${(input.length / 1024).toFixed(2)}KB → ${(compressed.length / 1024).toFixed(2)}KB (${this._getRatio(input.length, compressed.length)}%)`);
            
            return compressed;
        } catch (error) {
            console.error('Brotli compression error:', error.message);
            throw new Error('Failed to compress data with brotli');
        }
    }

    /**
     * Decompress brotli data
     * @param {Buffer} compressedData - Compressed data
     * @returns {Promise<Buffer>} Decompressed data
     */
    async brotliDecompressData(compressedData) {
        try {
            const decompressed = await brotliDecompress(compressedData);
            return decompressed;
        } catch (error) {
            console.error('Brotli decompression error:', error.message);
            throw new Error('Failed to decompress brotli data');
        }
    }

    // ============================================================
    // JSON COMPRESSION
    // ============================================================

    /**
     * Compress JSON object
     * @param {Object} jsonData - JSON object to compress
     * @returns {Promise<string>} Base64 compressed string
     */
    async compressJSON(jsonData) {
        try {
            const jsonString = JSON.stringify(jsonData);
            const compressed = await gzip(Buffer.from(jsonString));
            return compressed.toString('base64');
        } catch (error) {
            console.error('JSON compression error:', error.message);
            throw new Error('Failed to compress JSON data');
        }
    }

    /**
     * Decompress JSON object
     * @param {string} compressedBase64 - Base64 compressed string
     * @returns {Promise<Object>} Decompressed JSON object
     */
    async decompressJSON(compressedBase64) {
        try {
            const buffer = Buffer.from(compressedBase64, 'base64');
            const decompressed = await gunzip(buffer);
            return JSON.parse(decompressed.toString());
        } catch (error) {
            console.error('JSON decompression error:', error.message);
            throw new Error('Failed to decompress JSON data');
        }
    }

    // ============================================================
    // STREAM COMPRESSION (For large files)
    // ============================================================

    /**
     * Compress file using stream (for large files)
     * @param {string} inputPath - Path to input file
     * @param {string} outputPath - Path to output compressed file
     * @returns {Promise<Object>} { inputSize, outputSize, ratio }
     */
    async streamCompressFile(inputPath, outputPath) {
        try {
            const { statSync } = require('fs');
            const inputStats = statSync(inputPath);
            
            const readStream = createReadStream(inputPath);
            const writeStream = createWriteStream(outputPath);
            const gzipStream = zlib.createGzip({ level: this.LEVELS.MAXIMUM });
            
            await streamPipeline(readStream, gzipStream, writeStream);
            
            const outputStats = statSync(outputPath);
            
            console.log(`   📦 Stream compress: ${(inputStats.size / 1024 / 1024).toFixed(2)}MB → ${(outputStats.size / 1024 / 1024).toFixed(2)}MB`);
            
            return {
                inputSize: inputStats.size,
                outputSize: outputStats.size,
                ratio: this._getRatio(inputStats.size, outputStats.size)
            };
        } catch (error) {
            console.error('Stream compression error:', error.message);
            throw new Error('Failed to compress file via stream');
        }
    }

    /**
     * Decompress file using stream
     * @param {string} inputPath - Path to compressed file
     * @param {string} outputPath - Path to output decompressed file
     * @returns {Promise<Object>} { inputSize, outputSize }
     */
    async streamDecompressFile(inputPath, outputPath) {
        try {
            const { statSync } = require('fs');
            const inputStats = statSync(inputPath);
            
            const readStream = createReadStream(inputPath);
            const writeStream = createWriteStream(outputPath);
            const gunzipStream = zlib.createGunzip();
            
            await streamPipeline(readStream, gunzipStream, writeStream);
            
            const outputStats = statSync(outputPath);
            
            return {
                inputSize: inputStats.size,
                outputSize: outputStats.size
            };
        } catch (error) {
            console.error('Stream decompression error:', error.message);
            throw new Error('Failed to decompress file via stream');
        }
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    /**
     * Calculate compression ratio
     * @param {number} originalSize - Original size in bytes
     * @param {number} compressedSize - Compressed size in bytes
     * @returns {number} Compression ratio percentage
     */
    _getRatio(originalSize, compressedSize) {
        if (originalSize === 0) return 100;
        return Math.round((compressedSize / originalSize) * 100);
    }

    /**
     * Get compression savings
     * @param {number} originalSize - Original size
     * @param {number} compressedSize - Compressed size
     * @returns {Object} { savedBytes, savedPercent }
     */
    getSavings(originalSize, compressedSize) {
        const savedBytes = originalSize - compressedSize;
        const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;
        
        return { savedBytes, savedPercent };
    }

    /**
     * Format bytes to human readable
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Check if data is compressed (gzip magic bytes)
     * @param {Buffer} data - Data to check
     * @returns {boolean}
     */
    isGzipCompressed(data) {
        if (!data || data.length < 2) return false;
        // Gzip magic bytes: 0x1f 0x8b
        return data[0] === 0x1f && data[1] === 0x8b;
    }

    /**
     * Get best compression method based on data type
     * @param {string} mimeType - MIME type of data
     * @returns {string} Recommended compression method
     */
    getBestMethod(mimeType) {
        if (!mimeType) return 'gzip';
        
        const textTypes = ['text/', 'application/json', 'application/xml', 'application/javascript', 'application/css'];
        const imageTypes = ['image/', 'video/', 'audio/'];
        
        // Text compresses well with brotli
        if (textTypes.some(t => mimeType.startsWith(t))) {
            return 'brotli';
        }
        
        // Already compressed formats - use store (no compression)
        if (imageTypes.some(t => mimeType.startsWith(t)) || 
            mimeType.includes('zip') || 
            mimeType.includes('gzip') ||
            mimeType.includes('compress')) {
            return 'store';
        }
        
        return 'gzip';
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================
const compressionUtil = new CompressionUtil();

module.exports = compressionUtil;