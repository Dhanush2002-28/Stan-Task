const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');

/**
 * GET /api/user/profile/:userId
 * Get user profile and analytics
 */
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        let user = await User.findOne({ userId });

        if (!user) {
            // Create new user profile
            user = new User({
                userId,
                profile: {
                    emotionalState: { current: 'neutral', history: [] },
                    communicationStyle: 'supportive',
                    preferences: { responseLength: 'medium' }
                },
                relationships: {
                    trustLevel: 5,
                    conversationCount: 0
                }
            });
            await user.save();
        }

        res.json({
            success: true,
            data: {
                userId: user.userId,
                profile: user.profile,
                relationships: user.relationships,
                lifeContext: user.lifeContext,
                conversationMetrics: user.conversationMetrics,
                relationshipStrength: user.relationshipStrength,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user profile'
        });
    }
});

/**
 * PUT /api/user/profile/:userId
 * Update user profile
 */
router.put('/profile/:userId', [
    body('profile').optional().isObject(),
    body('profile.name').optional().trim().isLength({ min: 1, max: 100 }),
    body('profile.age').optional().isInt({ min: 13, max: 120 }),
    body('profile.interests').optional().isArray(),
    body('profile.communicationStyle').optional().isIn(['casual', 'formal', 'emotional', 'analytical', 'supportive']),
    body('profile.preferences.responseLength').optional().isIn(['short', 'medium', 'long']),
    body('profile.preferences.timeZone').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profile data',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const updateData = req.body;

        // Get existing user or create new one
        let user = await User.findOne({ userId });
        if (!user) {
            user = new User({ userId });
        }

        // Update profile fields
        if (updateData.profile) {
            Object.keys(updateData.profile).forEach(key => {
                if (updateData.profile[key] !== undefined) {
                    if (key === 'preferences' && user.profile.preferences) {
                        user.profile.preferences = { ...user.profile.preferences, ...updateData.profile[key] };
                    } else {
                        user.profile[key] = updateData.profile[key];
                    }
                }
            });
        }

        // Update life context if provided
        if (updateData.lifeContext) {
            user.lifeContext = { ...user.lifeContext, ...updateData.lifeContext };
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: user.profile,
                lifeContext: user.lifeContext
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

/**
 * POST /api/user/preferences/:userId
 * Update user preferences
 */
router.post('/preferences/:userId', [
    body('responseLength').optional().isIn(['short', 'medium', 'long']),
    body('topics').optional().isArray(),
    body('avoidTopics').optional().isArray(),
    body('timeZone').optional().trim(),
    body('preferredTime').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid preferences data',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const preferences = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update preferences
        user.profile.preferences = { ...user.profile.preferences, ...preferences };
        await user.save();

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: user.profile.preferences
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences'
        });
    }
});

/**
 * GET /api/user/analytics/:userId
 * Get user conversation analytics
 */
router.get('/analytics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { timeframe = 'all' } = req.query;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate date range based on timeframe
        let dateFilter = {};
        if (timeframe !== 'all') {
            const now = new Date();
            switch (timeframe) {
                case 'week':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
                    break;
                case 'month':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                    break;
                case 'year':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                    break;
            }
        }

        // Get conversation analytics
        const Conversation = require('../models/Conversation');
        const conversations = await Conversation.find({ userId, ...dateFilter })
            .select('analytics context createdAt messages');

        // Calculate analytics
        const analytics = {
            totalConversations: conversations.length,
            totalMessages: conversations.reduce((sum, conv) => sum + conv.analytics.messageCount, 0),
            averageConversationLength: conversations.length > 0 ?
                conversations.reduce((sum, conv) => sum + conv.analytics.messageCount, 0) / conversations.length : 0,
            emotionalSupport: conversations.length > 0 ?
                conversations.reduce((sum, conv) => sum + (conv.analytics.emotionalSupport || 0), 0) / conversations.length : 0,
            conversationTypes: {},
            moodTrends: user.profile.emotionalState.history.slice(-20), // Last 20 mood entries
            relationshipGrowth: {
                trustLevel: user.relationships.trustLevel,
                conversationCount: user.relationships.conversationCount,
                relationshipStrength: user.relationshipStrength
            }
        };

        // Count conversation types
        conversations.forEach(conv => {
            const type = conv.context.conversationType || 'casual';
            analytics.conversationTypes[type] = (analytics.conversationTypes[type] || 0) + 1;
        });

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics'
        });
    }
});

/**
 * POST /api/user/mood/:userId
 * Update user's current emotional state
 */
router.post('/mood/:userId', [
    body('emotion').notEmpty().isIn(['happy', 'sad', 'anxious', 'excited', 'neutral', 'frustrated', 'content', 'overwhelmed']),
    body('context').optional().trim().isLength({ max: 200 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mood data',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { emotion, context } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update current emotional state
        user.profile.emotionalState.current = emotion;
        user.profile.emotionalState.history.push({
            state: emotion,
            timestamp: new Date(),
            context: context || ''
        });

        // Keep only last 50 mood entries
        if (user.profile.emotionalState.history.length > 50) {
            user.profile.emotionalState.history = user.profile.emotionalState.history.slice(-50);
        }

        await user.save();

        res.json({
            success: true,
            message: 'Mood updated successfully',
            data: {
                currentEmotion: user.profile.emotionalState.current,
                moodHistory: user.profile.emotionalState.history.slice(-10) // Return last 10 entries
            }
        });

    } catch (error) {
        console.error('Update mood error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update mood'
        });
    }
});

/**
 * DELETE /api/user/profile/:userId
 * Delete user profile and all associated data
 */
router.delete('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Delete user profile
        const userResult = await User.findOneAndDelete({ userId });

        if (!userResult) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete associated conversations and memories
        const Conversation = require('../models/Conversation');
        const Memory = require('../models/Memory');

        await Promise.all([
            Conversation.deleteMany({ userId }),
            Memory.deleteMany({ userId })
        ]);

        res.json({
            success: true,
            message: 'User profile and all associated data deleted successfully'
        });

    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete profile'
        });
    }
});

module.exports = router;
