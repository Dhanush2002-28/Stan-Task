const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const memoryService = require('../services/memoryService');
const Memory = require('../models/Memory');

/**
 * GET /api/memory/:userId
 * Get user's memories with optional filtering
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            type,
            importance,
            page = 1,
            limit = 20,
            sortBy = 'importance',
            tags,
            search
        } = req.query;

        // Build query
        const query = { userId, isActive: true };

        if (type) {
            query.type = type;
        }

        if (importance) {
            query['emotional_context.importance'] = { $gte: parseInt(importance) };
        }

        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query['metadata.tags'] = { $in: tagArray };
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Build sort criteria
        let sortCriteria = {};
        switch (sortBy) {
            case 'importance':
                sortCriteria = { 'emotional_context.importance': -1 };
                break;
            case 'recent':
                sortCriteria = { 'usage.lastAccessed': -1 };
                break;
            case 'effectiveness':
                sortCriteria = { 'usage.effectiveness': -1 };
                break;
            case 'created':
                sortCriteria = { createdAt: -1 };
                break;
            default:
                sortCriteria = { 'emotional_context.importance': -1 };
        }

        // Execute query
        const memories = await Memory.find(query)
            .sort(sortCriteria)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .select('-vector_embedding'); // Exclude vector embeddings from response

        const totalMemories = await Memory.countDocuments(query);

        res.json({
            success: true,
            data: {
                memories,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalMemories,
                    pages: Math.ceil(totalMemories / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get memories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve memories'
        });
    }
});

/**
 * POST /api/memory/:userId
 * Create a new memory manually
 */
router.post('/:userId', [
    body('type').notEmpty().isIn([
        'personal_fact', 'preference', 'emotional_pattern', 'significant_event',
        'relationship', 'goal', 'concern', 'achievement', 'routine', 'value',
        'trigger', 'coping_mechanism', 'communication_style'
    ]),
    body('content').notEmpty().trim().isLength({ min: 1, max: 1000 }),
    body('importance').optional().isInt({ min: 1, max: 10 }),
    body('tags').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid memory data',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const {
            type,
            content,
            importance = 5,
            tags = [],
            category,
            timeframe = 'present',
            sentiment = 0
        } = req.body;

        const memory = await memoryService.storeMemory(userId, {
            type,
            content,
            context: {
                confidence: 1.0, // Manual memories have high confidence
                source: 'explicit'
            },
            emotional_context: {
                importance: parseInt(importance),
                sentiment: parseFloat(sentiment),
                emotionalWeight: importance > 7 ? 'high' : importance > 4 ? 'moderate' : 'low'
            },
            temporal_info: {
                timeframe,
                recency: 'recent',
                frequency: 'one_time'
            },
            metadata: {
                tags,
                category,
                privacy_level: 'private'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Memory created successfully',
            data: memory
        });

    } catch (error) {
        console.error('Create memory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create memory'
        });
    }
});

/**
 * PUT /api/memory/:memoryId
 * Update an existing memory
 */
router.put('/:memoryId', [
    body('content').optional().trim().isLength({ min: 1, max: 1000 }),
    body('importance').optional().isInt({ min: 1, max: 10 }),
    body('tags').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid update data',
                errors: errors.array()
            });
        }

        const { memoryId } = req.params;
        const updateData = req.body;

        const memory = await Memory.findById(memoryId);
        if (!memory) {
            return res.status(404).json({
                success: false,
                message: 'Memory not found'
            });
        }

        // Update fields
        if (updateData.content) {
            memory.content = updateData.content;
        }

        if (updateData.importance) {
            memory.emotional_context.importance = updateData.importance;
        }

        if (updateData.tags) {
            memory.metadata.tags = updateData.tags;
        }

        if (updateData.category) {
            memory.metadata.category = updateData.category;
        }

        memory.metadata.needsUpdate = false;
        await memory.save();

        res.json({
            success: true,
            message: 'Memory updated successfully',
            data: memory
        });

    } catch (error) {
        console.error('Update memory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update memory'
        });
    }
});

/**
 * DELETE /api/memory/:memoryId
 * Delete (deactivate) a memory
 */
router.delete('/:memoryId', async (req, res) => {
    try {
        const { memoryId } = req.params;

        const memory = await Memory.findById(memoryId);
        if (!memory) {
            return res.status(404).json({
                success: false,
                message: 'Memory not found'
            });
        }

        // Soft delete by marking as inactive
        memory.isActive = false;
        await memory.save();

        res.json({
            success: true,
            message: 'Memory deleted successfully'
        });

    } catch (error) {
        console.error('Delete memory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete memory'
        });
    }
});

/**
 * GET /api/memory/:userId/analytics
 * Get memory analytics for user
 */
router.get('/:userId/analytics', async (req, res) => {
    try {
        const { userId } = req.params;

        const analytics = await memoryService.getMemoryAnalytics(userId);

        if (!analytics) {
            return res.status(404).json({
                success: false,
                message: 'No memory analytics found'
            });
        }

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Get memory analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve memory analytics'
        });
    }
});

/**
 * GET /api/memory/:userId/relevant
 * Get relevant memories for current context
 */
router.get('/:userId/relevant', async (req, res) => {
    try {
        const { userId } = req.params;
        const { emotion, topics, conversationType, limit = 10 } = req.query;

        const context = {};

        if (emotion) context.emotion = emotion;
        if (conversationType) context.conversationType = conversationType;
        if (topics) context.topics = topics.split(',').map(t => t.trim());

        const memories = await memoryService.getRelevantMemories(userId, context);

        res.json({
            success: true,
            data: {
                memories: memories.slice(0, parseInt(limit)),
                context
            }
        });

    } catch (error) {
        console.error('Get relevant memories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve relevant memories'
        });
    }
});

/**
 * POST /api/memory/:userId/cleanup
 * Clean up old or ineffective memories
 */
router.post('/:userId/cleanup', async (req, res) => {
    try {
        const { userId } = req.params;

        await memoryService.cleanupMemories(userId);

        res.json({
            success: true,
            message: 'Memory cleanup completed successfully'
        });

    } catch (error) {
        console.error('Memory cleanup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup memories'
        });
    }
});

/**
 * GET /api/memory/types
 * Get available memory types and their descriptions
 */
router.get('/types', (req, res) => {
    const memoryTypes = {
        personal_fact: 'Basic personal information about the user',
        preference: 'User likes, dislikes, and preferences',
        emotional_pattern: 'Recurring emotional states and patterns',
        significant_event: 'Important life events and experiences',
        relationship: 'Information about user\'s relationships',
        goal: 'User aspirations and objectives',
        concern: 'Ongoing worries or issues',
        achievement: 'User accomplishments and successes',
        routine: 'Daily or weekly patterns and habits',
        value: 'Core beliefs and principles',
        trigger: 'Emotional triggers to be aware of',
        coping_mechanism: 'How user deals with stress and challenges',
        communication_style: 'Preferred communication methods',
        fake_memory: 'Generated memories for emotional consistency'
    };

    res.json({
        success: true,
        data: memoryTypes
    });
});

/**
 * POST /api/memory/:userId/search
 * Search memories by content
 */
router.post('/:userId/search', [
    body('query').notEmpty().trim().isLength({ min: 1, max: 200 }),
    body('filters').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid search query',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { query, filters = {} } = req.body;

        const searchQuery = {
            userId,
            isActive: true,
            $text: { $search: query }
        };

        // Apply filters
        if (filters.type) {
            searchQuery.type = filters.type;
        }

        if (filters.importance) {
            searchQuery['emotional_context.importance'] = { $gte: filters.importance };
        }

        if (filters.tags && filters.tags.length > 0) {
            searchQuery['metadata.tags'] = { $in: filters.tags };
        }

        const memories = await Memory.find(searchQuery)
            .sort({ score: { $meta: 'textScore' } })
            .limit(20)
            .select('-vector_embedding');

        res.json({
            success: true,
            data: {
                memories,
                query,
                resultsCount: memories.length
            }
        });

    } catch (error) {
        console.error('Search memories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search memories'
        });
    }
});

module.exports = router;
