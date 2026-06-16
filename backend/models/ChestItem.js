const mongoose = require('mongoose');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// ============================================================
// ENCRYPTION SETUP
// ============================================================
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.MASTER_SECRET || 'cloude-ultra-secure-master-key-2024').digest();
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts.slice(1).join(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return text;
    }
}

// ============================================================
// COMPRESSION UTILITIES
// ============================================================
async function compressData(data) {
    const compressed = await gzip(Buffer.from(JSON.stringify(data)));
    return compressed.toString('base64');
}

async function decompressData(compressedBase64) {
    const buffer = Buffer.from(compressedBase64, 'base64');
    const decompressed = await gunzip(buffer);
    return JSON.parse(decompressed.toString());
}

// ============================================================
// CHEST ITEM SCHEMA
// ============================================================
const chestItemSchema = new mongoose.Schema({
    // Reference to user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },

    // Item name
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },

    // Item type
    type: {
        type: String,
        enum: {
            values: ['text', 'file', 'image', 'document', 'video', 'audio'],
            message: '{VALUE} is not a valid item type'
        },
        required: [true, 'Item type is required'],
        index: true
    },

    // Encrypted & compressed data
    data: {
        type: String,
        required: [true, 'Data is required']
    },

    // MIME type for proper handling
    mimeType: {
        type: String,
        default: 'text/plain',
        maxlength: [100, 'MIME type too long']
    },

    // Original size before encryption
    size: {
        type: Number,
        default: 0,
        min: [0, 'Size cannot be negative']
    },

    // Flags
    isCompressed: {
        type: Boolean,
        default: true
    },
    
    isEncrypted: {
        type: Boolean,
        default: true
    },

    // Item metadata
    metadata: {
        originalName: String,
        extension: String,
        checksum: String,
        encoding: String
    },

    // Tags for organization
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag too long']
    }],

    // Favorite flag
    isFavorite: {
        type: Boolean,
        default: false
    },

    // Access count
    accessCount: {
        type: Number,
        default: 0
    },

    // Last accessed
    lastAccessedAt: {
        type: Date,
        default: null
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// ============================================================
// INDEXES
// ============================================================
chestItemSchema.index({ userId: 1, type: 1 });
chestItemSchema.index({ userId: 1, createdAt: -1 });
chestItemSchema.index({ userId: 1, isFavorite: 1 });
chestItemSchema.index({ userId: 1, name: 'text' }); // Text search on name
chestItemSchema.index({ tags: 1 });

// ============================================================
// PRE-SAVE HOOK
// ============================================================
chestItemSchema.pre('save', async function() {
    
           this.updatedAt = new Date();
    
    // Auto-detect type from MIME if not set
    if (!this.type || this.type === 'file') {
        if (this.mimeType?.startsWith('image/')) {
            this.type = 'image';
        } else if (this.mimeType?.startsWith('video/')) {
            this.type = 'video';
        } else if (this.mimeType?.startsWith('audio/')) {
            this.type = 'audio';
        } else if (this.mimeType?.includes('pdf') || this.mimeType?.includes('document')) {
            this.type = 'document';
        }
    }
    
    // Extract extension from name
    if (this.name && this.name.includes('.')) {
        const extension = this.name.split('.').pop().toLowerCase();
        if (!this.metadata) this.metadata = {};
        if (!this.metadata.extension) {
            this.metadata.extension = extension;
        }
    }   
        
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Decrypt and decompress the data
 */
chestItemSchema.methods.getDecryptedData = async function() {
    try {
        // Step 1: Decrypt
        let decrypted;
        if (this.isEncrypted) {
            decrypted = decrypt(this.data);
        } else {
            decrypted = this.data;
        }
        
        // Step 2: Decompress
        if (this.isCompressed) {
            const decompressed = await decompressData(decrypted);
            return decompressed.content;
        }
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt item data');
    }
};

/**
 * Get data without decompression (for listing)
 */
chestItemSchema.methods.getEncryptedSize = function() {
    return this.data ? this.data.length : 0;
};

/**
 * Get formatted size
 */
chestItemSchema.methods.getFormattedSize = function() {
    const bytes = this.size || this.getEncryptedSize();
    
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Increment access count
 */
chestItemSchema.methods.incrementAccess = function() {
    this.accessCount = (this.accessCount || 0) + 1;
    this.lastAccessedAt = new Date();
    return this.save();
};

/**
 * Toggle favorite
 */
chestItemSchema.methods.toggleFavorite = function() {
    this.isFavorite = !this.isFavorite;
    return this.save();
};

/**
 * Add tags
 */
chestItemSchema.methods.addTags = function(newTags) {
    if (!this.tags) this.tags = [];
    
    const tagsToAdd = Array.isArray(newTags) ? newTags : [newTags];
    
    for (const tag of tagsToAdd) {
        if (tag && !this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }
    
    return this.save();
};

/**
 * Remove tag
 */
chestItemSchema.methods.removeTag = function(tag) {
    if (this.tags) {
        this.tags = this.tags.filter(t => t !== tag);
    }
    return this.save();
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Get items by type
 */
chestItemSchema.statics.findByType = function(userId, type) {
    return this.find({ userId, type })
        .select('-data')
        .sort({ createdAt: -1 });
};

/**
 * Get favorite items
 */
chestItemSchema.statics.findFavorites = function(userId) {
    return this.find({ userId, isFavorite: true })
        .select('-data')
        .sort({ updatedAt: -1 });
};

/**
 * Search items by name or tags
 */
chestItemSchema.statics.search = function(userId, query) {
    return this.find({
        userId,
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } },
            { mimeType: { $regex: query, $options: 'i' } }
        ]
    })
    .select('-data')
    .sort({ createdAt: -1 });
};

/**
 * Get items by date range
 */
chestItemSchema.statics.findByDateRange = function(userId, startDate, endDate) {
    return this.find({
        userId,
        createdAt: {
            $gte: startDate || new Date(0),
            $lte: endDate || new Date()
        }
    })
    .select('-data')
    .sort({ createdAt: -1 });
};

/**
 * Get recently accessed items
 */
chestItemSchema.statics.findRecentlyAccessed = function(userId, limit = 10) {
    return this.find({
        userId,
        lastAccessedAt: { $ne: null }
    })
    .select('-data')
    .sort({ lastAccessedAt: -1 })
    .limit(limit);
};

/**
 * Get item statistics for a user
 */
chestItemSchema.statics.getStats = async function(userId) {
    const stats = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                totalSize: { $sum: '$size' },
                avgSize: { $avg: '$size' }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const totalItems = await this.countDocuments({ userId });
    const totalFavorites = await this.countDocuments({ userId, isFavorite: true });
    const totalSize = stats.reduce((sum, s) => sum + s.totalSize, 0);

    return {
        totalItems,
        totalFavorites,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        byType: stats
    };
};

/**
 * Bulk delete items
 */
chestItemSchema.statics.bulkDelete = function(userId, itemIds) {
    return this.deleteMany({
        userId,
        _id: { $in: itemIds }
    });
};

/**
 * Get total storage used by user
 */
chestItemSchema.statics.getTotalStorage = async function(userId) {
    const result = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalSize: { $sum: '$size' }
            }
        }
    ]);

    return result[0]?.totalSize || 0;
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================
// EXPORT
// ============================================================
const ChestItem = mongoose.model('ChestItem', chestItemSchema);

module.exports = ChestItem;