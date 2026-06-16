const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { deleteByPrefix } = require('../config/minioClient');

/**
 * Deletion Processor Service
 * Handles automatic deletion of user data after admin approval
 */
class DeletionProcessor {
    constructor(options = {}) {
        this.checkInterval = options.checkInterval || 60 * 60 * 1000; // 1 hour
        this.gracePeriod = options.gracePeriod || 24 * 60 * 60 * 1000; // 24 hours
        this.isRunning = false;
        this.processedCount = 0;
        this.failedCount = 0;
    }

    /**
     * Start the periodic deletion checker
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Deletion processor is already running');
            return;
        }

        this.isRunning = true;
        console.log('⏰ Deletion processor started');
        console.log(`   Check interval: ${this.checkInterval / 1000 / 60} minutes`);
        console.log(`   Grace period: ${this.gracePeriod / 1000 / 60 / 60} hours`);

        // Run immediately on start
        this.processDeletions();

        // Then run periodically
        this.intervalId = setInterval(() => {
            this.processDeletions();
        }, this.checkInterval);
    }

    /**
     * Stop the periodic deletion checker
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('⏸️ Deletion processor stopped');
    }

    /**
     * Get status of deletion processor
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            processedCount: this.processedCount,
            failedCount: this.failedCount,
            checkInterval: this.checkInterval,
            gracePeriod: this.gracePeriod,
            lastCheck: this.lastCheck || null
        };
    }

    /**
     * Main deletion processing function
     */
    async processDeletions() {
        try {
            this.lastCheck = new Date();
            console.log(`\n🔍 [${this.lastCheck.toISOString()}] Checking for approved deletions...`);

            // Get models (lazy loading to avoid circular dependencies)
            const DeletionRequest = mongoose.model('DeletionRequest');
            const User = mongoose.model('User');
            const ChestItem = mongoose.model('ChestItem');

            // Calculate grace period cutoff
            const cutoffDate = new Date(Date.now() - this.gracePeriod);

            // Find all approved requests past grace period
            const approvedRequests = await DeletionRequest.find({
                status: 'approved',
                requestedAt: { $lte: cutoffDate }
            });

            if (approvedRequests.length === 0) {
                console.log('   ✅ No deletions to process');
                return;
            }

            console.log(`   📋 Found ${approvedRequests.length} deletion(s) to process`);

            // Process each deletion
            for (const request of approvedRequests) {
                await this._processSingleDeletion(request, User, ChestItem, DeletionRequest);
            }

            console.log(`   📊 Processed: ${this.processedCount} | Failed: ${this.failedCount}`);

        } catch (error) {
            console.error('❌ Deletion processing error:', error.message);
        }
    }

    /**
     * Process a single deletion request
     */
    async _processSingleDeletion(request, User, ChestItem, DeletionRequest) {
        const userId = request.userId;
        
        try {
            console.log(`\n   🗑️ Processing deletion for user: ${userId}`);
            console.log(`   📅 Requested: ${request.requestedAt}`);
            console.log(`   ⏳ Grace period: ${Math.floor((Date.now() - request.requestedAt.getTime()) / 1000 / 60 / 60)} hours ago`);

            const user = await User.findById(userId);
            
            if (!user) {
                console.log('   ⚠️ User not found (already deleted)');
                await this._markAsProcessed(DeletionRequest, request._id, 'User already deleted');
                this.processedCount++;
                return;
            }

            let deletionSteps = [];

            // Step 1: Delete MinIO profile chunks
            if (user.profileStorage?.storagePath) {
                console.log(`   📦 Deleting MinIO profile: ${user.profileStorage.storagePath}`);
                try {
                    await deleteByPrefix(user.profileStorage.storagePath);
                    deletionSteps.push('MinIO profile deleted');
                    console.log('   ✅ MinIO profile deleted');
                } catch (error) {
                    console.error(`   ❌ MinIO deletion error: ${error.message}`);
                    deletionSteps.push('MinIO deletion failed');
                }
            } else {
                console.log('   ℹ️ No MinIO profile to delete');
                deletionSteps.push('No MinIO profile');
            }

            // Step 2: Delete chest items
            console.log('   📦 Deleting chest items...');
            try {
                const chestResult = await ChestItem.deleteMany({ userId });
                console.log(`   ✅ Deleted ${chestResult.deletedCount} chest items`);
                deletionSteps.push(`Deleted ${chestResult.deletedCount} chest items`);
            } catch (error) {
                console.error(`   ❌ Chest deletion error: ${error.message}`);
                deletionSteps.push('Chest deletion failed');
            }

            // Step 3: Delete local profile folder
            const localPaths = [
                user.localProfileCache?.path,
                user.browserProfilePath,
                path.join(__dirname, '..', 'browser-profiles', `user_${userId}`)
            ].filter(Boolean);

            for (const localPath of localPaths) {
                if (localPath && fs.existsSync(localPath)) {
                    console.log(`   📁 Deleting local profile: ${localPath}`);
                    try {
                        fs.rmSync(localPath, { recursive: true, force: true });
                        console.log(`   ✅ Local profile deleted`);
                        deletionSteps.push(`Local profile deleted: ${path.basename(localPath)}`);
                    } catch (error) {
                        console.error(`   ❌ Local deletion error: ${error.message}`);
                        deletionSteps.push('Local deletion failed');
                    }
                }
            }

            // Step 4: Delete any temp files
            const tempPaths = [
                path.join(__dirname, '..', 'temp', `upload_${userId}`),
                path.join(__dirname, '..', 'temp', `restore_${userId}`),
                path.join(__dirname, '..', 'temp', `${userId}_profile.zip`)
            ];

            for (const tempPath of tempPaths) {
                if (fs.existsSync(tempPath)) {
                    try {
                        const stats = fs.statSync(tempPath);
                        if (stats.isDirectory()) {
                            fs.rmSync(tempPath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(tempPath);
                        }
                        console.log(`   🧹 Cleaned temp: ${path.basename(tempPath)}`);
                    } catch (error) {
                        // Silently fail for temp files
                    }
                }
            }

            // Step 5: Delete user from MongoDB
            console.log('   🗄️ Deleting user from database...');
            try {
                await User.findByIdAndDelete(userId);
                console.log('   ✅ User deleted from database');
                deletionSteps.push('User deleted from DB');
            } catch (error) {
                console.error(`   ❌ User deletion error: ${error.message}`);
                deletionSteps.push('User deletion failed');
                throw error; // Critical step - must succeed
            }

            // Step 6: Mark deletion request as processed
            await this._markAsProcessed(
                DeletionRequest, 
                request._id, 
                deletionSteps.join('; ')
            );

            this.processedCount++;
            console.log(`   ✅ Deletion completed for user ${userId}`);

        } catch (error) {
            console.error(`   ❌ Deletion failed for user ${userId}: ${error.message}`);
            this.failedCount++;

            // Mark as failed but don't update status (will retry next cycle)
            try {
                await DeletionRequest.findByIdAndUpdate(request._id, {
                    adminNote: `Auto-deletion failed: ${error.message}. Will retry.`
                });
            } catch (e) {
                // Silently fail
            }
        }
    }

    /**
     * Mark deletion request as processed
     */
    async _markAsProcessed(DeletionRequest, requestId, note) {
        await DeletionRequest.findByIdAndUpdate(requestId, {
            status: 'processed',
            processedAt: new Date(),
            processedBy: 'auto-processor',
            adminNote: note || 'All data permanently deleted'
        });
    }

    /**
     * Manually process a specific deletion request (for admin use)
     */
    async processSpecificDeletion(requestId) {
        try {
            const DeletionRequest = mongoose.model('DeletionRequest');
            const User = mongoose.model('User');
            const ChestItem = mongoose.model('ChestItem');

            const request = await DeletionRequest.findById(requestId);
            if (!request) {
                throw new Error('Deletion request not found');
            }

            if (request.status === 'processed') {
                throw new Error('Request already processed');
            }

            // Temporarily mark as approved if not already
            if (request.status !== 'approved') {
                request.status = 'approved';
                await request.save();
            }

            await this._processSingleDeletion(request, User, ChestItem, DeletionRequest);
            
            return { success: true, message: 'Deletion processed successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Get pending deletion count
     */
    async getPendingCount() {
        try {
            const DeletionRequest = mongoose.model('DeletionRequest');
            const cutoffDate = new Date(Date.now() - this.gracePeriod);
            
            const count = await DeletionRequest.countDocuments({
                status: 'approved',
                requestedAt: { $lte: cutoffDate }
            });
            
            return count;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get deletion statistics
     */
    async getStatistics() {
        try {
            const DeletionRequest = mongoose.model('DeletionRequest');
            
            const stats = await DeletionRequest.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const result = {
                pending: 0,
                approved: 0,
                rejected: 0,
                processed: 0
            };

            stats.forEach(stat => {
                result[stat._id] = stat.count;
            });

            return result;
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = DeletionProcessor;