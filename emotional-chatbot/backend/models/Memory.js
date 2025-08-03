const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'personal_fact',      // User's personal information
            'preference',         // User's likes/dislikes
            'emotional_pattern',  // Recurring emotional states
            'significant_event',  // Important life events
            'relationship',       // Information about user's relationships
            'goal',              // User's aspirations and goals
            'concern',           // Ongoing worries or issues
            'achievement',       // User's accomplishments
            'routine',           // Daily/weekly patterns
            'value',             // Core beliefs and values
            'trigger',           // Emotional triggers to avoid
            'coping_mechanism',  // How user deals with stress
            'communication_style', // How user prefers to communicate
            'fake_memory'        // Simulated memories for emotional consistency
        ],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    context: {
        conversationId: String,
        sessionId: String,
        extractedFrom: String, // Original user message
        confidence: { type: Number, min: 0, max: 1, default: 0.7 },
        source: {
            type: String,
            enum: ['explicit', 'inferred', 'generated'], // How memory was created
            default: 'explicit'
        }
    },
    emotional_context: {
        userEmotionWhenShared: String,
        importance: { type: Number, min: 1, max: 10, default: 5 },
        sentiment: { type: Number, min: -1, max: 1, default: 0 },
        emotionalWeight: String // How much this memory affects the user
    },
    temporal_info: {
        timeframe: String, // 'past', 'present', 'future'
        specificDate: Date,
        recency: String, // 'recent', 'months_ago', 'years_ago'
        frequency: String // 'one_time', 'occasional', 'regular', 'constant'
    },
    relationships: {
        connectedMemories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Memory' }],
        conflictsWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Memory' }],
        reinforces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Memory' }]
    },
    usage: {
        accessCount: { type: Number, default: 0 },
        lastAccessed: { type: Date, default: Date.now },
        effectiveness: { type: Number, min: 0, max: 1, default: 0.5 }, // How useful this memory is
        relevantContexts: [String] // When this memory is most relevant
    },
    metadata: {
        tags: [String],
        category: String,
        subcategory: String,
        isVerified: { type: Boolean, default: false },
        needsUpdate: { type: Boolean, default: false },
        expiresAt: Date, // For temporary memories
        privacy_level: {
            type: String,
            enum: ['public', 'private', 'sensitive'],
            default: 'private'
        }
    },
    vector_embedding: {
        type: [Number], // For semantic similarity search
        index: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for efficient memory retrieval
memorySchema.index({ userId: 1, type: 1 });
memorySchema.index({ userId: 1, 'emotional_context.importance': -1 });
memorySchema.index({ userId: 1, 'usage.lastAccessed': -1 });
memorySchema.index({ userId: 1, 'metadata.tags': 1 });
memorySchema.index({ 'temporal_info.timeframe': 1, 'temporal_info.recency': 1 });

// Text index for content search
memorySchema.index({ content: 'text', 'metadata.tags': 'text' });

// Virtual for memory relevance score
memorySchema.virtual('relevanceScore').get(function () {
    const importance = this.emotional_context.importance || 5;
    const recency = this.getRecencyScore();
    const usage = Math.min(this.usage.accessCount, 10) / 10;
    const effectiveness = this.usage.effectiveness || 0.5;

    return (importance * 0.4 + recency * 0.3 + usage * 0.2 + effectiveness * 0.1) / 10;
});

// Method to calculate recency score
memorySchema.methods.getRecencyScore = function () {
    const now = new Date();
    const daysSinceAccess = (now - this.usage.lastAccessed) / (1000 * 60 * 60 * 24);

    if (daysSinceAccess < 1) return 10;
    if (daysSinceAccess < 7) return 8;
    if (daysSinceAccess < 30) return 6;
    if (daysSinceAccess < 90) return 4;
    if (daysSinceAccess < 365) return 2;
    return 1;
};

// Method to update usage statistics
memorySchema.methods.recordAccess = function (effectiveness = null) {
    this.usage.accessCount += 1;
    this.usage.lastAccessed = new Date();

    if (effectiveness !== null) {
        // Update effectiveness as moving average
        const alpha = 0.2; // Learning rate
        this.usage.effectiveness = alpha * effectiveness + (1 - alpha) * (this.usage.effectiveness || 0.5);
    }

    return this.save();
};

// Static method to find relevant memories
memorySchema.statics.findRelevant = function (userId, context, limit = 10) {
    const query = { userId, isActive: true };

    // Add context-based filters
    if (context.type) {
        query.type = { $in: [context.type, 'personal_fact', 'preference'] };
    }

    if (context.emotion) {
        query['emotional_context.userEmotionWhenShared'] = context.emotion;
    }

    if (context.tags && context.tags.length > 0) {
        query['metadata.tags'] = { $in: context.tags };
    }

    return this.find(query)
        .sort({
            'emotional_context.importance': -1,
            'usage.lastAccessed': -1,
            'usage.effectiveness': -1
        })
        .limit(limit);
};

// Static method to create fake memory for emotional consistency
memorySchema.statics.createFakeMemory = function (userId, context, emotion) {
    const fakeMemories = {
        supportive: [
            "I remember you mentioning how proud your family was when you achieved something important",
            "You once told me about a time when someone really believed in you",
            "I recall you sharing about a moment when you felt truly understood"
        ],
        encouraging: [
            "You've overcome challenges before, and I remember how resilient you were",
            "I remember you talking about your inner strength during difficult times",
            "You once mentioned how you inspire others without even realizing it"
        ],
        empathetic: [
            "I remember you sharing how you felt during a similar situation",
            "You once opened up about feeling this way before",
            "I recall you mentioning how important it is to feel heard and understood"
        ]
    };

    const memories = fakeMemories[emotion] || fakeMemories.supportive;
    const randomMemory = memories[Math.floor(Math.random() * memories.length)];

    return new this({
        userId,
        type: 'fake_memory',
        content: randomMemory,
        context: {
            confidence: 0.8,
            source: 'generated'
        },
        emotional_context: {
            importance: 7,
            sentiment: 0.5,
            emotionalWeight: 'moderate'
        },
        temporal_info: {
            timeframe: 'past',
            recency: 'months_ago',
            frequency: 'one_time'
        },
        metadata: {
            tags: [emotion, 'generated', 'supportive'],
            category: 'emotional_support'
        }
    });
};

module.exports = mongoose.model('Memory', memorySchema);
