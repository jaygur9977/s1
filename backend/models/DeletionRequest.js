const mongoose = require('mongoose');

// ============================================================
// DELETION REQUEST SCHEMA
// ============================================================
const deletionRequestSchema = new mongoose.Schema({
    // Reference to user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    
    // User's unique key (for reference)
    uniqueKey: {
        type: String,
        required: [true, 'Unique key is required']
    },

    // Request status
    status: {
        type: String,
        enum: {
            values: ['pending', 'approved', 'rejected', 'processed'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending',
        index: true
    },

    // Timestamps
    requestedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    processedAt: {
        type: Date,
        default: null
    },

    // Who processed it
    processedBy: {
        type: String,
        default: null,
        enum: ['auto-processor', 'admin', null]
    },

    // Admin notes
    adminNote: {
        type: String,
        default: null,
        maxlength: [500, 'Note cannot exceed 500 characters']
    },

    // Deletion steps log
    deletionLog: [{
        step: String,
        status: {
            type: String,
            enum: ['success', 'failed', 'skipped']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }]
});

// ============================================================
// INDEXES
// ============================================================
deletionRequestSchema.index({ status: 1, requestedAt: 1 });
deletionRequestSchema.index({ userId: 1, status: 1 });
deletionRequestSchema.index({ processedAt: -1 });

// ============================================================
// PRE-SAVE HOOK
// ============================================================
deletionRequestSchema.pre('save', function() {
    // Auto-set processedAt when status changes to processed
   if (this.isModified('status') && this.status === 'processed' && !this.processedAt) {
        this.processedAt = new Date();
    }
    
    // Auto-set processedBy for auto-processor
    if (this.isModified('status') && this.status === 'processed' && !this.processedBy) {
        this.processedBy = 'auto-processor';
    } 
   
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Add deletion log entry
 */
deletionRequestSchema.methods.addLog = function(step, status, details) {
    if (!this.deletionLog) {
        this.deletionLog = [];
    }
    
    this.deletionLog.push({
        step,
        status,
        timestamp: new Date(),
        details: details || ''
    });
    
    return this.save();
};

/**
 * Check if grace period has passed
 */
deletionRequestSchema.methods.isGracePeriodOver = function(gracePeriodHours = 24) {
    if (!this.requestedAt) return false;
    
    const gracePeriodMs = gracePeriodHours * 60 * 60 * 1000;
    const elapsed = Date.now() - this.requestedAt.getTime();
    
    return elapsed >= gracePeriodMs;
};

/**
 * Get time remaining in grace period
 */
deletionRequestSchema.methods.getGracePeriodRemaining = function(gracePeriodHours = 24) {
    if (!this.requestedAt) return 0;
    
    const gracePeriodMs = gracePeriodHours * 60 * 60 * 1000;
    const elapsed = Date.now() - this.requestedAt.getTime();
    const remaining = gracePeriodMs - elapsed;
    
    return Math.max(0, remaining);
};

/**
 * Format grace period remaining in human readable format
 */
deletionRequestSchema.methods.getGracePeriodFormatted = function(gracePeriodHours = 24) {
    const remaining = this.getGracePeriodRemaining(gracePeriodHours);
    
    if (remaining <= 0) return 'Grace period over';
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m remaining`;
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Find all pending requests past grace period
 */
deletionRequestSchema.statics.findPendingPastGracePeriod = function(gracePeriodHours = 24) {
    const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);
    
    return this.find({
        status: 'approved',
        requestedAt: { $lte: cutoffDate }
    }).populate('userId', 'fullName phoneNo profileStorage localProfileCache browserProfilePath');
};

/**
 * Get deletion statistics
 */
deletionRequestSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                latestRequest: { $max: '$requestedAt' }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const result = {
        pending: 0,
        approved: 0,
        rejected: 0,
        processed: 0,
        total: 0
    };

    stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });

    // Get today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    result.todayCount = await this.countDocuments({
        requestedAt: { $gte: today }
    });

    // Get this week's requests
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    result.weekCount = await this.countDocuments({
        requestedAt: { $gte: weekAgo }
    });

    return result;
};

/**
 * Get deletion requests by user
 */
deletionRequestSchema.statics.findByUser = function(userId) {
    return this.find({ userId })
        .sort({ requestedAt: -1 })
        .select('-deletionLog');
};

/**
 * Get recent deletions
 */
deletionRequestSchema.statics.getRecent = function(limit = 10) {
    return this.find()
        .sort({ requestedAt: -1 })
        .limit(limit)
        .populate('userId', 'fullName')
        .select('-deletionLog');
};

// ============================================================
// EXPORT
// ============================================================
const DeletionRequest = mongoose.model('DeletionRequest', deletionRequestSchema);

module.exports = DeletionRequest;