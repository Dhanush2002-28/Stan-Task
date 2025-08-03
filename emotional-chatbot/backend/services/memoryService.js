const Memory = require('../models/Memory');
const User = require('../models/User');

class MemoryService {
    constructor() {
        this.maxMemoriesPerQuery = 10;
        this.memoryDecayFactor = 0.1;
    }

    /**
     * Store a new memory for a user
     */
    async storeMemory(userId, memoryData) {
        try {
            const memory = new Memory({
                userId,
                ...memoryData,
                usage: {
                    accessCount: 0,
                    lastAccessed: new Date(),
                    effectiveness: 0.5
                }
            });

            await memory.save();

            // Update user's memory metrics
            await this.updateUserMemoryMetrics(userId);

            return memory;
        } catch (error) {
            console.error('Error storing memory:', error);
            throw error;
        }
    }

    /**
     * Retrieve relevant memories for conversation context
     */
    async getRelevantMemories(userId, context = {}) {
        try {
            const query = {
                userId,
                isActive: true
            };

            // Add context-based filters
            if (context.emotion) {
                query.$or = [
                    { 'emotional_context.userEmotionWhenShared': context.emotion },
                    { 'metadata.tags': context.emotion }
                ];
            }

            if (context.topics && context.topics.length > 0) {
                query['metadata.tags'] = { $in: context.topics };
            }

            if (context.conversationType) {
                query['usage.relevantContexts'] = context.conversationType;
            }

            // Get memories sorted by relevance
            const memories = await Memory.find(query)
                .sort({
                    'emotional_context.importance': -1,
                    'usage.lastAccessed': -1,
                    'usage.effectiveness': -1
                })
                .limit(this.maxMemoriesPerQuery);

            // Update access statistics
            const updatePromises = memories.map(memory => memory.recordAccess());
            await Promise.all(updatePromises);

            return memories;
        } catch (error) {
            console.error('Error retrieving memories:', error);
            return [];
        }
    }

    /**
     * Process and extract memories from conversation
     */
    async processConversationForMemories(userId, message, context = {}) {
        try {
            const insights = this.extractInsights(message, context);
            const storedMemories = [];

            for (const insight of insights) {
                // Check if similar memory already exists
                const existingMemory = await this.findSimilarMemory(userId, insight);

                if (existingMemory) {
                    // Update existing memory
                    await this.updateMemory(existingMemory._id, insight);
                } else {
                    // Store new memory
                    const memory = await this.storeMemory(userId, {
                        type: insight.type,
                        content: insight.content,
                        context: {
                            extractedFrom: message,
                            confidence: insight.confidence || 0.7,
                            source: 'explicit'
                        },
                        emotional_context: {
                            importance: insight.importance || 5,
                            sentiment: insight.sentiment || 0,
                            emotionalWeight: insight.emotionalWeight || 'moderate'
                        },
                        temporal_info: {
                            timeframe: insight.timeframe || 'present',
                            recency: 'recent',
                            frequency: insight.frequency || 'one_time'
                        },
                        metadata: {
                            tags: insight.tags || [],
                            category: insight.category,
                            privacy_level: insight.privacy_level || 'private'
                        }
                    });

                    storedMemories.push(memory);
                }
            }

            return storedMemories;
        } catch (error) {
            console.error('Error processing conversation for memories:', error);
            return [];
        }
    }

    /**
     * Extract insights from user message
     */
    extractInsights(message, context) {
        const insights = [];
        const text = message.toLowerCase();
        const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 3);

        // Personal information extraction
        const personalPatterns = [
            {
                pattern: /my name is (\w+)|i'm (\w+)|call me (\w+)/i,
                type: 'personal_fact',
                importance: 9,
                category: 'identity'
            },
            {
                pattern: /i am (\d+) years old|i'm (\d+)/i,
                type: 'personal_fact',
                importance: 7,
                category: 'demographics'
            },
            {
                pattern: /i work as|my job is|i'm a (.+?)(?:\.|$|,)/i,
                type: 'personal_fact',
                importance: 8,
                category: 'profession'
            },
            {
                pattern: /i live in|i'm from|i'm in (.+?)(?:\.|$|,)/i,
                type: 'personal_fact',
                importance: 6,
                category: 'location'
            }
        ];

        // Preferences and interests
        const preferencePatterns = [
            {
                pattern: /i love|i really like|i enjoy|i'm passionate about (.+?)(?:\.|$|,)/i,
                type: 'preference',
                importance: 7,
                sentiment: 0.8
            },
            {
                pattern: /i hate|i can't stand|i dislike (.+?)(?:\.|$|,)/i,
                type: 'preference',
                importance: 7,
                sentiment: -0.8
            },
            {
                pattern: /my favorite|i prefer (.+?)(?:\.|$|,)/i,
                type: 'preference',
                importance: 6,
                sentiment: 0.6
            }
        ];

        // Emotional and relationship patterns
        const emotionalPatterns = [
            {
                pattern: /i feel|i'm feeling|i've been feeling (.+?)(?:\.|$|,)/i,
                type: 'emotional_pattern',
                importance: 8,
                category: 'current_emotion'
            },
            {
                pattern: /i'm worried about|i'm concerned about|i'm anxious about (.+?)(?:\.|$|,)/i,
                type: 'concern',
                importance: 9,
                emotionalWeight: 'high'
            },
            {
                pattern: /my (?:partner|boyfriend|girlfriend|husband|wife|friend) (.+?)(?:\.|$|,)/i,
                type: 'relationship',
                importance: 8,
                category: 'interpersonal'
            }
        ];

        // Goals and aspirations
        const goalPatterns = [
            {
                pattern: /i want to|i hope to|my goal is|i'm trying to (.+?)(?:\.|$|,)/i,
                type: 'goal',
                importance: 8,
                timeframe: 'future'
            },
            {
                pattern: /i need to|i have to|i must (.+?)(?:\.|$|,)/i,
                type: 'goal',
                importance: 7,
                timeframe: 'present',
                emotionalWeight: 'moderate'
            }
        ];

        // Significant events
        const eventPatterns = [
            {
                pattern: /yesterday|last week|last month|recently (.+?)(?:\.|$|,)/i,
                type: 'significant_event',
                importance: 7,
                timeframe: 'past',
                recency: 'recent'
            },
            {
                pattern: /when i was|growing up|as a child (.+?)(?:\.|$|,)/i,
                type: 'significant_event',
                importance: 6,
                timeframe: 'past',
                recency: 'years_ago'
            }
        ];

        const allPatterns = [
            ...personalPatterns,
            ...preferencePatterns,
            ...emotionalPatterns,
            ...goalPatterns,
            ...eventPatterns
        ];

        // Process each pattern
        allPatterns.forEach(pattern => {
            const match = message.match(pattern.pattern);
            if (match) {
                const extractedContent = match[1] || match[2] || match[3] || match[0];

                insights.push({
                    type: pattern.type,
                    content: extractedContent.trim(),
                    importance: pattern.importance,
                    sentiment: pattern.sentiment || 0,
                    confidence: 0.8,
                    category: pattern.category,
                    timeframe: pattern.timeframe,
                    emotionalWeight: pattern.emotionalWeight,
                    recency: pattern.recency,
                    frequency: pattern.frequency,
                    tags: this.extractTags(extractedContent, pattern.type),
                    privacy_level: this.determinatePrivacyLevel(pattern.type, extractedContent)
                });
            }
        });

        // Context-based insights
        if (context.emotion && context.emotion !== 'neutral') {
            insights.push({
                type: 'emotional_pattern',
                content: `User expressed ${context.emotion} emotion in conversation`,
                importance: 6,
                sentiment: this.emotionToSentiment(context.emotion),
                category: 'emotional_state',
                tags: [context.emotion, 'emotional_pattern']
            });
        }

        return insights;
    }

    /**
     * Extract relevant tags from content
     */
    extractTags(content, type) {
        const text = content.toLowerCase();
        const tags = [type];

        // Emotion tags
        const emotions = ['happy', 'sad', 'angry', 'excited', 'nervous', 'anxious', 'confident', 'frustrated'];
        emotions.forEach(emotion => {
            if (text.includes(emotion)) tags.push(emotion);
        });

        // Topic tags
        const topics = ['work', 'family', 'relationship', 'health', 'hobby', 'travel', 'money', 'education'];
        topics.forEach(topic => {
            if (text.includes(topic)) tags.push(topic);
        });

        // Activity tags
        const activities = ['exercise', 'reading', 'music', 'cooking', 'sports', 'gaming', 'art', 'technology'];
        activities.forEach(activity => {
            if (text.includes(activity)) tags.push(activity);
        });

        return [...new Set(tags)]; // Remove duplicates
    }

    /**
     * Determine privacy level based on content
     */
    determinatePrivacyLevel(type, content) {
        const sensitiveTypes = ['relationship', 'concern', 'emotional_pattern'];
        const sensitiveKeywords = ['depression', 'anxiety', 'trauma', 'abuse', 'addiction', 'suicide'];

        if (sensitiveTypes.includes(type)) return 'sensitive';

        const text = content.toLowerCase();
        if (sensitiveKeywords.some(keyword => text.includes(keyword))) {
            return 'sensitive';
        }

        return 'private';
    }

    /**
     * Convert emotion to sentiment score
     */
    emotionToSentiment(emotion) {
        const emotionSentiment = {
            'happy': 0.8,
            'excited': 0.9,
            'content': 0.6,
            'sad': -0.7,
            'angry': -0.8,
            'frustrated': -0.6,
            'anxious': -0.5,
            'nervous': -0.4,
            'neutral': 0
        };

        return emotionSentiment[emotion] || 0;
    }

    /**
     * Find similar existing memory
     */
    async findSimilarMemory(userId, insight) {
        try {
            const query = {
                userId,
                type: insight.type,
                isActive: true
            };

            // For personal facts, check for exact content similarity
            if (insight.type === 'personal_fact') {
                query.content = { $regex: insight.content, $options: 'i' };
            }

            // For preferences, check for similar topics
            if (insight.type === 'preference') {
                query['metadata.tags'] = { $in: insight.tags || [] };
            }

            const similarMemory = await Memory.findOne(query);
            return similarMemory;
        } catch (error) {
            console.error('Error finding similar memory:', error);
            return null;
        }
    }

    /**
     * Update existing memory
     */
    async updateMemory(memoryId, newInsight) {
        try {
            const memory = await Memory.findById(memoryId);
            if (!memory) return null;

            // Update content with new information
            memory.content = newInsight.content;
            memory.context.confidence = Math.max(memory.context.confidence, newInsight.confidence || 0.7);
            memory.emotional_context.importance = Math.max(
                memory.emotional_context.importance,
                newInsight.importance || 5
            );
            memory.usage.lastAccessed = new Date();
            memory.metadata.needsUpdate = false;

            await memory.save();
            return memory;
        } catch (error) {
            console.error('Error updating memory:', error);
            return null;
        }
    }

    /**
     * Create fake memory for emotional consistency
     */
    async createFakeMemory(userId, emotion, context = {}) {
        try {
            const fakeMemory = Memory.createFakeMemory(userId, context, emotion);
            await fakeMemory.save();
            return fakeMemory;
        } catch (error) {
            console.error('Error creating fake memory:', error);
            return null;
        }
    }

    /**
     * Update user's memory-related metrics
     */
    async updateUserMemoryMetrics(userId) {
        try {
            const memoryCount = await Memory.countDocuments({ userId, isActive: true });
            const recentMemories = await Memory.countDocuments({
                userId,
                isActive: true,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            });

            await User.findOneAndUpdate(
                { userId },
                {
                    $set: {
                        'conversationMetrics.totalMemories': memoryCount,
                        'conversationMetrics.recentMemories': recentMemories
                    }
                }
            );
        } catch (error) {
            console.error('Error updating user memory metrics:', error);
        }
    }

    /**
     * Clean up old or ineffective memories
     */
    async cleanupMemories(userId) {
        try {
            const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago

            // Mark very old, low-importance memories as inactive
            await Memory.updateMany(
                {
                    userId,
                    'emotional_context.importance': { $lt: 3 },
                    'usage.lastAccessed': { $lt: cutoffDate },
                    'usage.effectiveness': { $lt: 0.3 }
                },
                { $set: { isActive: false } }
            );

            // Delete fake memories that are old and unused
            await Memory.deleteMany({
                userId,
                type: 'fake_memory',
                'usage.lastAccessed': { $lt: cutoffDate },
                'usage.accessCount': { $lt: 2 }
            });

        } catch (error) {
            console.error('Error cleaning up memories:', error);
        }
    }

    /**
     * Get memory analytics for user
     */
    async getMemoryAnalytics(userId) {
        try {
            const pipeline = [
                { $match: { userId, isActive: true } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        avgImportance: { $avg: '$emotional_context.importance' },
                        avgEffectiveness: { $avg: '$usage.effectiveness' }
                    }
                }
            ];

            const analytics = await Memory.aggregate(pipeline);

            const totalMemories = await Memory.countDocuments({ userId, isActive: true });
            const recentMemories = await Memory.countDocuments({
                userId,
                isActive: true,
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            });

            return {
                totalMemories,
                recentMemories,
                memoryTypes: analytics,
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error('Error getting memory analytics:', error);
            return null;
        }
    }
}

module.exports = new MemoryService();
