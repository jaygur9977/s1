// const mongoose = require('mongoose');
// const crypto = require('crypto');

// // ============================================================
// // ENCRYPTION SETUP
// // ============================================================
// const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.MASTER_SECRET || 'cloude-ultra-secure-master-key-2024').digest();
// const IV_LENGTH = 16;

// function encrypt(text) {
//     if (!text) return text;
//     const iv = crypto.randomBytes(IV_LENGTH);
//     const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
//     let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return iv.toString('hex') + ':' + encrypted;
// }

// function decrypt(text) {
//     if (!text || !text.includes(':')) return text;
//     try {
//         const parts = text.split(':');
//         const iv = Buffer.from(parts[0], 'hex');
//         const encryptedText = parts.slice(1).join(':');
//         const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
//         let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
//         decrypted += decipher.final('utf8');
//         return decrypted;
//     } catch (e) {
//         return text;
//     }
// }

// // ============================================================
// // USER SCHEMA
// // ============================================================
// const userSchema = new mongoose.Schema({
//     // Basic Info
//     fullName: {
//         type: String,
//         required: [true, 'Full name is required'],
//         trim: true,
//         minlength: [2, 'Name must be at least 2 characters'],
//         maxlength: [100, 'Name cannot exceed 100 characters']
//     },
    
//     phoneNo: {
//         type: String,
//         required: [true, 'Phone number is required'],
//         validate: {
//             validator: function(v) {
//                 // Validate before encryption (10 digits)
//                 if (v && !v.includes(':')) {
//                     return /^\d{10}$/.test(v);
//                 }
//                 return true; // Already encrypted
//             },
//             message: 'Phone number must be exactly 10 digits'
//         }
//     },
    
//     uniqueKey: {
//         type: String,
//         required: true,
//         unique: true,
//         index: true,
//         validate: {
//             validator: function(v) {
//                 if (v && !v.includes(':')) {
//                     return v.length === 8;
//                 }
//                 return true;
//             },
//             message: 'Unique key must be exactly 8 characters'
//         }
//     },
    
//     password: {
//         type: String,
//         required: [true, 'Password is required'],
//         minlength: [8, 'Password must be at least 8 characters']
//     },
    
//     pin: {
//         type: String,
//         required: [true, 'PIN is required'],
//         validate: {
//             validator: function(v) {
//                 if (v && !v.includes(':')) {
//                     return /^\d{4}$/.test(v);
//                 }
//                 return true;
//             },
//             message: 'PIN must be exactly 4 digits'
//         }
//     },

//     // Account Status
//     isActive: {
//         type: Boolean,
//         default: true
//     },
    
//     deleteRequested: {
//         type: Boolean,
//         default: false
//     },
    
//     deleteRequestDate: {
//         type: Date
//     },
    
//     deleteOTP: {
//         type: String
//     },
    
//     otpGeneratedAt: {
//         type: Date
//     },

//     // Profile Photo (encrypted base64)
//     profilePhoto: {
//         type: String,
//         default: null
//     },

//     // Profile Storage in MinIO
//     profileStorage: {
//         profileId: {
//             type: String,
//             default: null
//         },
//         storagePath: {
//             type: String,
//             default: null
//         },
//         chunkCount: {
//             type: Number,
//             default: 0
//         },
//         totalSize: {
//             type: Number,
//             default: 0
//         },
//         compressedAt: {
//             type: Date,
//             default: null
//         },
//         checksum: {
//             type: String,
//             default: null
//         },
//         version: {
//             type: String,
//             default: 'v1'
//         },
//         encryptionIV: {
//             type: String,
//             default: null
//         },
//         authTag: {
//             type: String,
//             default: null
//         }
//     },

//     // Chrome Detection Data
//     chromeData: {
//         executablePath: {
//             type: String,
//             default: null
//         },
//         chromeProfiles: [{
//             name: String,
//             path: String,
//             isDefault: Boolean,
//             email: String,
//             displayName: String
//         }],
//         detectionTimestamp: {
//             type: Date,
//             default: null
//         },
//         platform: {
//             type: String,
//             default: null
//         }
//     },

//     // Local Profile Cache Info
//     localProfileCache: {
//         path: {
//             type: String,
//             default: null
//         },
//         cachedAt: {
//             type: Date,
//             default: null
//         },
//         isValid: {
//             type: Boolean,
//             default: false
//         }
//     },

//     // Browser Profile Path
//     browserProfilePath: {
//         type: String,
//         default: null
//     },

//     // Timestamps
//     createdAt: {
//         type: Date,
//         default: Date.now
//     },
    
//     updatedAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// // ============================================================
// // INDEXES
// // ============================================================
// userSchema.index({ 'profileStorage.profileId': 1 });
// userSchema.index({ 'chromeData.detectionTimestamp': -1 });
// userSchema.index({ deleteRequested: 1, deleteRequestDate: 1 });
// userSchema.index({ createdAt: -1 });

// // ============================================================
// // PRE-SAVE HOOK - Encrypt sensitive fields
// // ============================================================
// userSchema.pre('save', async function(next) {
//     try {
//         // Update timestamp
//         this.updatedAt = new Date();
        
//         // Encrypt password if modified and not already encrypted
//         if (this.isModified('password') && this.password && !this.password.includes(':')) {
//             this.password = encrypt(this.password);
//         }
        
//         // Encrypt PIN if modified and not already encrypted
//         if (this.isModified('pin') && this.pin && !this.pin.includes(':')) {
//             this.pin = encrypt(this.pin);
//         }
        
//         // Encrypt phone number if modified and not already encrypted
//         if (this.isModified('phoneNo') && this.phoneNo && !this.phoneNo.includes(':')) {
//             this.phoneNo = encrypt(this.phoneNo);
//         }
        
//         // Encrypt unique key if modified and not already encrypted
//         if (this.isModified('uniqueKey') && this.uniqueKey && !this.uniqueKey.includes(':')) {
//             this.uniqueKey = encrypt(this.uniqueKey);
//         }
        
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// // ============================================================
// // PRE-UPDATE HOOK
// // ============================================================
// userSchema.pre('findOneAndUpdate', async function(next) {
//     this.set({ updatedAt: new Date() });
//     next();
// });

// // ============================================================
// // INSTANCE METHODS
// // ============================================================

// /**
//  * Decrypt password for verification
//  */
// userSchema.methods.verifyPassword = function(inputPassword) {
//     try {
//         const decrypted = decrypt(this.password);
//         return inputPassword === decrypted;
//     } catch (error) {
//         return false;
//     }
// };

// /**
//  * Decrypt PIN for verification
//  */
// userSchema.methods.verifyPin = function(inputPin) {
//     try {
//         const decrypted = decrypt(this.pin);
//         return inputPin === decrypted;
//     } catch (error) {
//         return false;
//     }
// };

// /**
//  * Get decrypted phone number
//  */
// userSchema.methods.getPhoneNumber = function() {
//     try {
//         return decrypt(this.phoneNo);
//     } catch (error) {
//         return 'Error decrypting';
//     }
// };

// /**
//  * Get decrypted unique key
//  */
// userSchema.methods.getUniqueKey = function() {
//     try {
//         return decrypt(this.uniqueKey);
//     } catch (error) {
//         return 'Error decrypting';
//     }
// };

// /**
//  * Check if local profile cache is valid
//  */
// userSchema.methods.isLocalCacheValid = function() {
//     if (!this.localProfileCache?.isValid || !this.localProfileCache?.path) {
//         return false;
//     }
    
//     const fs = require('fs');
//     if (!fs.existsSync(this.localProfileCache.path)) {
//         return false;
//     }
    
//     const cacheAge = Date.now() - new Date(this.localProfileCache.cachedAt).getTime();
//     const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hour
    
//     return cacheAge < MAX_CACHE_AGE;
// };

// /**
//  * Check if profile exists in MinIO
//  */
// userSchema.methods.hasMinioProfile = function() {
//     return !!(this.profileStorage?.storagePath && this.profileStorage?.chunkCount > 0);
// };

// /**
//  * Get safe user object (without sensitive data)
//  */
// userSchema.methods.toSafeObject = function() {
//     return {
//         id: this._id,
//         fullName: this.fullName,
//         phoneNo: this.getPhoneNumber(),
//         uniqueKey: this.getUniqueKey(),
//         isActive: this.isActive,
//         createdAt: this.createdAt,
//         chromeData: this.chromeData,
//         profileStorage: this.profileStorage ? {
//             profileId: this.profileStorage.profileId,
//             chunkCount: this.profileStorage.chunkCount,
//             compressedAt: this.profileStorage.compressedAt,
//             version: this.profileStorage.version
//         } : null,
//         localProfileCache: this.localProfileCache?.path || null,
//         browserProfilePath: this.browserProfilePath
//     };
// };

// // ============================================================
// // STATIC METHODS
// // ============================================================

// /**
//  * Find user by decrypted unique key
//  */
// userSchema.statics.findByUniqueKey = async function(uniqueKey) {
//     const users = await this.find({ isActive: true });
    
//     for (const user of users) {
//         try {
//             const decrypted = decrypt(user.uniqueKey);
//             if (decrypted === uniqueKey) {
//                 return user;
//             }
//         } catch (e) {
//             continue;
//         }
//     }
    
//     return null;
// };

// /**
//  * Find users with expired local cache
//  */
// userSchema.statics.findWithExpiredCache = function() {
//     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
//     return this.find({
//         'localProfileCache.isValid': true,
//         'localProfileCache.cachedAt': { $lt: oneHourAgo }
//     });
// };

// /**
//  * Get user statistics
//  */
// userSchema.statics.getStats = async function() {
//     const stats = await this.aggregate([
//         {
//             $group: {
//                 _id: null,
//                 totalUsers: { $sum: 1 },
//                 activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
//                 deletedRequested: { $sum: { $cond: ['$deleteRequested', 1, 0] } },
//                 withMinioProfile: { $sum: { $cond: [{ $ifNull: ['$profileStorage.storagePath', false] }, 1, 0] } },
//                 withChromeData: { $sum: { $cond: [{ $ifNull: ['$chromeData.executablePath', false] }, 1, 0] } }
//             }
//         }
//     ]);
    
//     return stats[0] || {
//         totalUsers: 0,
//         activeUsers: 0,
//         deletedRequested: 0,
//         withMinioProfile: 0,
//         withChromeData: 0
//     };
// };

// // ============================================================
// // EXPORT
// // ============================================================
// const User = mongoose.model('User', userSchema);
// // 
// module.exports = User;






const mongoose = require('mongoose');
const crypto = require('crypto');

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
// USER SCHEMA
// ============================================================
const userSchema = new mongoose.Schema({
    // Basic Info
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    
    phoneNo: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                if (v && !v.includes(':')) {
                    return /^\d{10}$/.test(v);
                }
                return true;
            },
            message: 'Phone number must be exactly 10 digits'
        }
    },
    
    uniqueKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
        validate: {
            validator: function(v) {
                if (v && !v.includes(':')) {
                    return v.length === 8;
                }
                return true;
            },
            message: 'Unique key must be exactly 8 characters'
        }
    },
    
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    
    pin: {
        type: String,
        required: [true, 'PIN is required'],
        validate: {
            validator: function(v) {
                if (v && !v.includes(':')) {
                    return /^\d{4}$/.test(v);
                }
                return true;
            },
            message: 'PIN must be exactly 4 digits'
        }
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    deleteRequested: {
        type: Boolean,
        default: false
    },
    
    deleteRequestDate: {
        type: Date
    },
    
    deleteOTP: {
        type: String
    },
    
    otpGeneratedAt: {
        type: Date
    },

    // Profile Photo (encrypted base64)
    profilePhoto: {
        type: String,
        default: null
    },

    // Profile Storage in MinIO
    profileStorage: {
        profileId: {
            type: String,
            default: null
        },
        storagePath: {
            type: String,
            default: null
        },
        chunkCount: {
            type: Number,
            default: 0
        },
        totalSize: {
            type: Number,
            default: 0
        },
        compressedAt: {
            type: Date,
            default: null
        },
        checksum: {
            type: String,
            default: null
        },
        version: {
            type: String,
            default: 'v1'
        },
        encryptionIV: {
            type: String,
            default: null
        },
        authTag: {
            type: String,
            default: null
        }
    },

    // Chrome Detection Data
    chromeData: {
        executablePath: {
            type: String,
            default: null
        },
        chromeProfiles: [{
            name: String,
            path: String,
            isDefault: Boolean,
            email: String,
            displayName: String
        }],
        detectionTimestamp: {
            type: Date,
            default: null
        },
        platform: {
            type: String,
            default: null
        }
    },

    // Local Profile Cache Info
    localProfileCache: {
        path: {
            type: String,
            default: null
        },
        cachedAt: {
            type: Date,
            default: null
        },
        isValid: {
            type: Boolean,
            default: false
        }
    },

    // Browser Profile Path
    browserProfilePath: {
        type: String,
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
userSchema.index({ 'profileStorage.profileId': 1 });
userSchema.index({ 'chromeData.detectionTimestamp': -1 });
userSchema.index({ deleteRequested: 1, deleteRequestDate: 1 });
userSchema.index({ createdAt: -1 });

// ============================================================
// PRE-SAVE HOOK - FIXED (No 'next' callback with async)
// ============================================================
userSchema.pre('save', async function() {
    // Update timestamp
    this.updatedAt = new Date();
    
    // Encrypt password if modified and not already encrypted
    if (this.isModified('password') && this.password && !this.password.includes(':')) {
        this.password = encrypt(this.password);
    }
    
    // Encrypt PIN if modified and not already encrypted
    if (this.isModified('pin') && this.pin && !this.pin.includes(':')) {
        this.pin = encrypt(this.pin);
    }
    
    // Encrypt phone number if modified and not already encrypted
    if (this.isModified('phoneNo') && this.phoneNo && !this.phoneNo.includes(':')) {
        this.phoneNo = encrypt(this.phoneNo);
    }
    
    // Encrypt unique key if modified and not already encrypted
    if (this.isModified('uniqueKey') && this.uniqueKey && !this.uniqueKey.includes(':')) {
        this.uniqueKey = encrypt(this.uniqueKey);
    }
});

// ============================================================
// PRE-UPDATE HOOK
// ============================================================
userSchema.pre('findOneAndUpdate', async function() {
    this.set({ updatedAt: new Date() });
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Decrypt password for verification
 */
userSchema.methods.verifyPassword = function(inputPassword) {
    try {
        const decrypted = decrypt(this.password);
        return inputPassword === decrypted;
    } catch (error) {
        return false;
    }
};

/**
 * Decrypt PIN for verification
 */
userSchema.methods.verifyPin = function(inputPin) {
    try {
        const decrypted = decrypt(this.pin);
        return inputPin === decrypted;
    } catch (error) {
        return false;
    }
};

/**
 * Get decrypted phone number
 */
userSchema.methods.getPhoneNumber = function() {
    try {
        return decrypt(this.phoneNo);
    } catch (error) {
        return 'Error decrypting';
    }
};

/**
 * Get decrypted unique key
 */
userSchema.methods.getUniqueKey = function() {
    try {
        return decrypt(this.uniqueKey);
    } catch (error) {
        return 'Error decrypting';
    }
};

/**
 * Check if local profile cache is valid
 */
userSchema.methods.isLocalCacheValid = function() {
    if (!this.localProfileCache?.isValid || !this.localProfileCache?.path) {
        return false;
    }
    
    const fs = require('fs');
    if (!fs.existsSync(this.localProfileCache.path)) {
        return false;
    }
    
    const cacheAge = Date.now() - new Date(this.localProfileCache.cachedAt).getTime();
    const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hour
    
    return cacheAge < MAX_CACHE_AGE;
};

/**
 * Check if profile exists in MinIO
 */
userSchema.methods.hasMinioProfile = function() {
    return !!(this.profileStorage?.storagePath && this.profileStorage?.chunkCount > 0);
};

/**
 * Get safe user object (without sensitive data)
 */
userSchema.methods.toSafeObject = function() {
    return {
        id: this._id,
        fullName: this.fullName,
        phoneNo: this.getPhoneNumber(),
        uniqueKey: this.getUniqueKey(),
        isActive: this.isActive,
        createdAt: this.createdAt,
        chromeData: this.chromeData,
        profileStorage: this.profileStorage ? {
            profileId: this.profileStorage.profileId,
            chunkCount: this.profileStorage.chunkCount,
            compressedAt: this.profileStorage.compressedAt,
            version: this.profileStorage.version
        } : null,
        localProfileCache: this.localProfileCache?.path || null,
        browserProfilePath: this.browserProfilePath
    };
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Find user by decrypted unique key
 */
userSchema.statics.findByUniqueKey = async function(uniqueKey) {
    const users = await this.find({ isActive: true });
    
    for (const user of users) {
        try {
            const decrypted = decrypt(user.uniqueKey);
            if (decrypted === uniqueKey) {
                return user;
            }
        } catch (e) {
            continue;
        }
    }
    
    return null;
};

/**
 * Find users with expired local cache
 */
userSchema.statics.findWithExpiredCache = function() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return this.find({
        'localProfileCache.isValid': true,
        'localProfileCache.cachedAt': { $lt: oneHourAgo }
    });
};

/**
 * Get user statistics
 */
userSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
                deletedRequested: { $sum: { $cond: ['$deleteRequested', 1, 0] } },
                withMinioProfile: { $sum: { $cond: [{ $ifNull: ['$profileStorage.storagePath', false] }, 1, 0] } },
                withChromeData: { $sum: { $cond: [{ $ifNull: ['$chromeData.executablePath', false] }, 1, 0] } }
            }
        }
    ]);
    
    return stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        deletedRequested: 0,
        withMinioProfile: 0,
        withChromeData: 0
    };
};

// ============================================================
// EXPORT
// ============================================================
const User = mongoose.model('User', userSchema);

module.exports = User;