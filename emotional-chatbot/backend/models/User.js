const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Unique identifier for user persistence (name + number + month)
    uniqueKey: {
        type: String,
        index: true,
        sparse: true // Allow null values but index non-null ones
    },
    profile: {
        name: { type: String },
        personalNumber: { type: Number, min: 0, max: 999 }, // User's chosen number 0-999
        birthMonth: { type: String }, // Birth month for uniqueness
        age: { type: Number },
        interests: { type: String }, // Store as string initially, can be parsed later
        currentMood: { type: String },
        personalityTraits: [{
            trait: String,
            confidence: Number // 0-1 scale
        }],
        communicationStyle: {
            type: String,
            enum: ['casual', 'formal', 'emotional', 'analytical', 'supportive'],
            default: 'supportive'
        },
        emotionalState: {
            current: {
                type: String,
                enum: ['happy', 'sad', 'anxious', 'excited', 'neutral', 'frustrated', 'content', 'overwhelmed'],
                default: 'neutral'
            },
            history: [{
                state: String,
                timestamp: { type: Date, default: Date.now },
                context: String
            }]
        },
        preferences: {
            responseLength: {
                type: String,
                enum: ['short', 'medium', 'long'],
                default: 'medium'
            },
            topics: [{
                topic: String,
                interest_level: { type: Number, min: 0, max: 10 }
            }],
            avoidTopics: [String],
            timeZone: String,
            preferredTime: String
        }
    },
    relationships: {
        trustLevel: { type: Number, default: 5, min: 0, max: 10 },
        conversationCount: { type: Number, default: 0 },
        lastInteraction: { type: Date, default: Date.now },
        significantMoments: [{
            description: String,
            timestamp: { type: Date, default: Date.now },
            importance: { type: Number, min: 1, max: 10 }
        }]
    },
    lifeContext: {
        currentSituation: String,
        goals: [String],
        challenges: [String],
        supportNeeds: [String],
        recentEvents: [{
            event: String,
            impact: String,
            timestamp: { type: Date, default: Date.now }
        }]
    },
    conversationMetrics: {
        averageResponseTime: Number,
        sentimentTrend: [{
            sentiment: Number, // -1 to 1
            timestamp: { type: Date, default: Date.now }
        }],
        engagementLevel: { type: Number, default: 5, min: 0, max: 10 },
        satisfactionScore: { type: Number, default: 5, min: 0, max: 10 }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ 'relationships.lastInteraction': -1 });
userSchema.index({ 'profile.emotionalState.current': 1 });
userSchema.index({ 'relationships.trustLevel': -1 });
userSchema.index({ 'uniqueKey': 1 }); // Index for unique key lookups

// Virtual for relationship strength
userSchema.virtual('relationshipStrength').get(function () {
    const trust = this.relationships.trustLevel || 5;
    const conversations = Math.min(this.relationships.conversationCount || 0, 50);
    const recency = this.relationships.lastInteraction ?
        Math.max(0, 10 - (Date.now() - this.relationships.lastInteraction) / (1000 * 60 * 60 * 24)) : 0;

    return (trust * 0.5 + conversations * 0.3 + recency * 0.2) / 10;
});

module.exports = mongoose.model('User', userSchema);
