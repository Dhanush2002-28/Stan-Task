const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    messages: [{
        id: {
            type: String,
            required: true,
            default: () => require('uuid').v4()
        },
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        metadata: {
            emotionalTone: {
                type: String,
                enum: ['supportive', 'empathetic', 'encouraging', 'gentle', 'analytical', 'playful', 'serious']
            },
            confidence: Number, // AI confidence in response
            processingTime: Number, // Response generation time
            userSentiment: {
                score: Number, // -1 to 1
                emotion: String
            },
            contextUsed: [{
                type: String,
                relevance: Number
            }],
            memoryTriggered: [String], // Which memories were accessed
            personalityAdjustment: String // How personality was adapted
        },
        reactions: {
            userFeedback: {
                type: String,
                enum: ['helpful', 'not_helpful', 'inappropriate', 'perfect']
            },
            emotionalResponse: String // User's emotional response to message
        }
    }],
    summary: {
        mainTopics: [String],
        emotionalJourney: [String],
        keyInsights: [String],
        unresolved: [String],
        userGoals: [String],
        nextSteps: [String]
    },
    context: {
        conversationType: {
            type: String,
            enum: ['casual', 'support', 'advice', 'venting', 'celebration', 'problem_solving'],
            default: 'casual'
        },
        urgency: {
            type: String,
            enum: ['low', 'medium', 'high', 'crisis'],
            default: 'low'
        },
        duration: Number, // in minutes
        userMood: {
            start: String,
            end: String,
            trend: String // improving, declining, stable
        },
        location: String, // if provided by user
        timeOfDay: String
    },
    analytics: {
        messageCount: { type: Number, default: 0 },
        averageResponseLength: Number,
        emotionalSupport: { type: Number, default: 0 }, // 0-10 scale
        problemSolving: { type: Number, default: 0 }, // 0-10 scale
        userEngagement: { type: Number, default: 0 }, // 0-10 scale
        conversationQuality: { type: Number, default: 0 } // 0-10 scale
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'abandoned'],
        default: 'active'
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for efficient querying
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ sessionId: 1 });
conversationSchema.index({ 'context.conversationType': 1 });
conversationSchema.index({ status: 1, updatedAt: -1 });

// Virtual for conversation duration
conversationSchema.virtual('conversationDuration').get(function () {
    if (this.messages.length < 2) return 0;
    const firstMessage = this.messages[0];
    const lastMessage = this.messages[this.messages.length - 1];
    return (lastMessage.timestamp - firstMessage.timestamp) / (1000 * 60); // in minutes
});

// Method to add message and update analytics
conversationSchema.methods.addMessage = function (messageData) {
    this.messages.push(messageData);
    this.analytics.messageCount = this.messages.length;

    // Update average response length for assistant messages
    const assistantMessages = this.messages.filter(m => m.role === 'assistant');
    if (assistantMessages.length > 0) {
        const totalLength = assistantMessages.reduce((sum, m) => sum + m.content.length, 0);
        this.analytics.averageResponseLength = totalLength / assistantMessages.length;
    }

    this.updatedAt = new Date();
    return this.save();
};

// Method to extract conversation insights
conversationSchema.methods.generateSummary = function () {
    const userMessages = this.messages.filter(m => m.role === 'user');
    const assistantMessages = this.messages.filter(m => m.role === 'assistant');

    // Extract topics (simplified - in real implementation, use NLP)
    const allContent = userMessages.map(m => m.content).join(' ').toLowerCase();
    const topicKeywords = {
        work: ['job', 'work', 'career', 'boss', 'colleague', 'office'],
        relationships: ['friend', 'family', 'partner', 'relationship', 'dating'],
        health: ['health', 'sick', 'doctor', 'medication', 'fitness'],
        emotions: ['sad', 'happy', 'angry', 'stressed', 'anxious', 'excited']
    };

    const detectedTopics = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => allContent.includes(keyword))) {
            detectedTopics.push(topic);
        }
    }

    this.summary.mainTopics = detectedTopics;
    this.summary.emotionalJourney = this.messages
        .filter(m => m.metadata && m.metadata.userSentiment)
        .map(m => m.metadata.userSentiment.emotion)
        .filter(e => e);
};

module.exports = mongoose.model('Conversation', conversationSchema);
