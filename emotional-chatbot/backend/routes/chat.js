const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const Conversation = require('../models/Conversation');
const llmService = require('../services/llmService');
const memoryService = require('../services/memoryService');

/**
 * POST /api/chat/identify
 * Identify returning user by unique key
 */
router.post('/identify', [
    body('name').notEmpty().trim(),
    body('personalNumber').isInt({ min: 0, max: 999 }),
    body('birthMonth').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input',
                errors: errors.array()
            });
        }

        const { name, personalNumber, birthMonth } = req.body;
        const uniqueKey = `${name}-${personalNumber}-${birthMonth}`;

        // Find user by unique key
        const user = await User.findOne({ uniqueKey });

        if (user) {
            // Update last interaction
            user.relationships.lastInteraction = new Date();
            await user.save();

            return res.json({
                success: true,
                data: {
                    userId: user.userId,
                    userProfile: user.profile,
                    message: `Welcome back, ${user.profile.name}! I remember you. How are you doing today?`
                }
            });
        } else {
            return res.json({
                success: false,
                message: "I don't recognize that combination. Would you like to start fresh with onboarding?"
            });
        }

    } catch (error) {
        console.error('Error identifying user:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while identifying user'
        });
    }
});

/**
 * POST /api/chat/message
 * Send a message and get AI response
 */
router.post('/message', [
    body('message').notEmpty().trim().isLength({ min: 1, max: 2000 }),
    body('userId').notEmpty().trim(),
    body('sessionId').optional().trim(),
    body('isNewUser').optional().isBoolean(),
    body('onboardingComplete').optional().isBoolean(),
    body('currentMessages').optional().isArray()
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input',
                errors: errors.array()
            });
        }

        const {
            message,
            userId,
            sessionId,
            isNewUser = false,
            onboardingComplete = false,
            currentMessages = []
        } = req.body;

        const currentSessionId = sessionId || require('uuid').v4();

        // Get or create user profile
        let user = await User.findOne({ userId });
        if (!user) {
            user = new User({
                userId,
                profile: {
                    emotionalState: { current: 'neutral' },
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

        // Get or create conversation - use a persistent conversation for returning users
        let conversation;
        if (isNewUser || !user.profile.name) {
            // For new users or users without complete profile, use session-based conversation
            conversation = await Conversation.findOne({
                userId,
                sessionId: currentSessionId,
                status: 'active'
            });
        } else {
            // For returning users, get their most recent conversation or create a new session
            conversation = await Conversation.findOne({
                userId,
                status: 'active'
            }).sort({ updatedAt: -1 });

            // If we want to start a new session for returning users
            if (conversation && sessionId !== conversation.sessionId) {
                conversation = null; // Force new conversation
            }
        }

        if (!conversation) {
            conversation = new Conversation({
                userId,
                sessionId: currentSessionId,
                messages: [],
                context: {
                    conversationType: isNewUser ? 'onboarding' : 'casual',
                    urgency: 'low'
                }
            });
        }

        // Handle onboarding flow for new users
        let responseContent;
        let isOnboardingResponse = false;

        // Check if onboarding is complete - simplified to only need identification
        const onboardingDone = user.profile.name && user.profile.personalNumber !== undefined &&
            user.profile.birthMonth; if (!onboardingComplete && !onboardingDone) {
                responseContent = await handleOnboardingFlow(message, user, currentMessages);
                isOnboardingResponse = true;

                // Add user message to conversation
                const userMessage = {
                    role: 'user',
                    content: message,
                    timestamp: new Date(),
                    metadata: { isOnboarding: true }
                };
                conversation.messages.push(userMessage);

                // Add assistant response
                const assistantMessage = {
                    role: 'assistant',
                    content: responseContent,
                    timestamp: new Date(),
                    metadata: {
                        isOnboarding: true,
                        step: currentMessages.filter(msg => msg.role === 'user').length
                    }
                };
                conversation.messages.push(assistantMessage);

                await conversation.save();
                await user.save();

                // Check if onboarding is complete
                const onboardingDone = user.profile.name && user.profile.personalNumber !== undefined &&
                    user.profile.birthMonth;

                return res.json({
                    success: true,
                    data: {
                        message: responseContent,
                        sessionId: currentSessionId,
                        onboardingComplete: onboardingDone,
                        userProfile: user.profile,
                        metadata: {
                            isOnboarding: true,
                            step: onboardingDone ? 'complete' : 'in-progress'
                        }
                    }
                });
            }

        // Analyze user sentiment
        const sentimentAnalysis = await llmService.analyzeSentiment(message);

        // Process message for memory extraction
        const extractedMemories = await memoryService.processConversationForMemories(
            userId,
            message,
            {
                emotion: sentimentAnalysis.emotion,
                conversationType: conversation.context.conversationType
            }
        );

        // Get relevant memories for context
        const relevantMemories = await memoryService.getRelevantMemories(userId, {
            emotion: sentimentAnalysis.emotion,
            conversationType: conversation.context.conversationType,
            topics: extractedMemories.map(m => m.metadata.tags).flat()
        });

        // Add user message to conversation
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date(),
            metadata: {
                userSentiment: sentimentAnalysis
            }
        };
        conversation.messages.push(userMessage);

        // Prepare conversation history for LLM
        const conversationHistory = conversation.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Generate AI response
        const startTime = Date.now();
        const llmResponse = await llmService.generateResponse(
            conversationHistory,
            user,
            relevantMemories,
            {
                conversationType: conversation.context.conversationType,
                urgency: conversation.context.urgency,
                userMood: sentimentAnalysis.emotion
            }
        );
        const processingTime = Date.now() - startTime;

        // Determine emotional tone for response
        const emotionalTone = determineEmotionalTone(sentimentAnalysis.emotion, user.relationships.trustLevel);

        // Add AI response to conversation
        const assistantMessage = {
            role: 'assistant',
            content: llmResponse.content,
            timestamp: new Date(),
            metadata: {
                emotionalTone,
                confidence: 0.8,
                processingTime,
                userSentiment: sentimentAnalysis,
                contextUsed: relevantMemories.map(m => ({
                    type: m.type,
                    relevance: m.emotional_context.importance / 10
                })),
                memoryTriggered: relevantMemories.map(m => m._id.toString()),
                personalityAdjustment: `Adapted for ${sentimentAnalysis.emotion} mood`
            }
        };
        conversation.messages.push(assistantMessage);

        // Update conversation analytics
        await conversation.addMessage(assistantMessage);
        conversation.context.userMood = {
            start: conversation.context.userMood?.start || sentimentAnalysis.emotion,
            end: sentimentAnalysis.emotion,
            trend: 'stable' // Simplified - could be enhanced
        };

        // Update user profile
        user.relationships.conversationCount += 1;
        user.relationships.lastInteraction = new Date();
        user.profile.emotionalState.current = sentimentAnalysis.emotion;
        user.profile.emotionalState.history.push({
            state: sentimentAnalysis.emotion,
            timestamp: new Date(),
            context: message.substring(0, 100)
        });

        // Adjust trust level based on interaction
        if (sentimentAnalysis.score > 0.5) {
            user.relationships.trustLevel = Math.min(10, user.relationships.trustLevel + 0.1);
        }

        await user.save();
        await conversation.save();

        // Create fake memory for emotional consistency if needed
        if (user.relationships.trustLevel > 7 && Math.random() > 0.7) {
            await memoryService.createFakeMemory(userId, emotionalTone, {
                conversationType: conversation.context.conversationType
            });
        }

        res.json({
            success: true,
            data: {
                message: llmResponse.content,
                sessionId: currentSessionId,
                metadata: {
                    emotionalTone,
                    processingTime,
                    memoriesUsed: relevantMemories.length,
                    memoriesExtracted: extractedMemories.length,
                    userSentiment: sentimentAnalysis,
                    trustLevel: user.relationships.trustLevel,
                    provider: llmResponse.provider
                }
            }
        });

    } catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process message',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * GET /api/chat/history/:userId/:sessionId
 * Get conversation history
 */
router.get('/history/:userId/:sessionId', async (req, res) => {
    try {
        const { userId, sessionId } = req.params;
        const { limit = 50 } = req.query;

        const conversation = await Conversation.findOne({ userId, sessionId })
            .select('messages summary context analytics updatedAt');

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Return limited messages for performance
        const messages = conversation.messages.slice(-parseInt(limit));

        res.json({
            success: true,
            data: {
                messages,
                summary: conversation.summary,
                context: conversation.context,
                analytics: conversation.analytics,
                lastUpdated: conversation.updatedAt
            }
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve conversation history'
        });
    }
});

/**
 * GET /api/chat/sessions/:userId
 * Get all conversation sessions for a user
 */
router.get('/sessions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const sessions = await Conversation.find({ userId })
            .select('sessionId context analytics summary updatedAt status')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const totalSessions = await Conversation.countDocuments({ userId });

        res.json({
            success: true,
            data: {
                sessions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalSessions,
                    pages: Math.ceil(totalSessions / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sessions'
        });
    }
});

/**
 * POST /api/chat/feedback
 * Provide feedback on AI response
 */
router.post('/feedback', [
    body('userId').notEmpty().trim(),
    body('sessionId').notEmpty().trim(),
    body('messageId').notEmpty().trim(),
    body('feedback').isIn(['helpful', 'not_helpful', 'inappropriate', 'perfect']),
    body('emotionalResponse').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feedback data',
                errors: errors.array()
            });
        }

        const { userId, sessionId, messageId, feedback, emotionalResponse } = req.body;

        const conversation = await Conversation.findOne({ userId, sessionId });
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Find the specific message
        const message = conversation.messages.find(m => m.id === messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Update message with feedback
        message.reactions = {
            userFeedback: feedback,
            emotionalResponse: emotionalResponse || ''
        };

        // Update memory effectiveness based on feedback
        if (message.metadata && message.metadata.memoryTriggered) {
            const effectiveness = feedback === 'perfect' ? 1.0 :
                feedback === 'helpful' ? 0.8 :
                    feedback === 'not_helpful' ? 0.3 : 0.1;

            const updatePromises = message.metadata.memoryTriggered.map(memoryId =>
                memoryService.updateMemoryEffectiveness(memoryId, effectiveness)
            );
            await Promise.all(updatePromises);
        }

        await conversation.save();

        res.json({
            success: true,
            message: 'Feedback recorded successfully'
        });

    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record feedback'
        });
    }
});

/**
 * DELETE /api/chat/session/:userId/:sessionId
 * Delete a conversation session
 */
router.delete('/session/:userId/:sessionId', async (req, res) => {
    try {
        const { userId, sessionId } = req.params;

        const result = await Conversation.findOneAndUpdate(
            { userId, sessionId },
            { status: 'abandoned', isArchived: true },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            message: 'Session archived successfully'
        });

    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete session'
        });
    }
});

/**
 * GET /api/chat/history/:userId
 * Get conversation history for a user
 */
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        // Get the most recent conversation for this user
        const conversation = await Conversation.findOne({
            userId,
            status: 'active'
        }).sort({ updatedAt: -1 });

        if (!conversation) {
            return res.json({
                success: true,
                data: {
                    messages: [],
                    sessionId: null
                }
            });
        }

        // Return the most recent messages
        const messages = conversation.messages
            .slice(-parseInt(limit))
            .map(msg => ({
                id: msg._id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                metadata: msg.metadata
            }));

        res.json({
            success: true,
            data: {
                messages,
                sessionId: conversation.sessionId,
                conversationId: conversation._id
            }
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation history'
        });
    }
});

/**
 * Helper function to determine emotional tone
 */
function determineEmotionalTone(userEmotion, trustLevel) {
    const toneMapping = {
        'sad': trustLevel > 7 ? 'empathetic' : 'supportive',
        'anxious': 'gentle',
        'angry': 'supportive',
        'frustrated': 'empathetic',
        'excited': 'encouraging',
        'happy': 'playful',
        'neutral': 'supportive'
    };

    return toneMapping[userEmotion] || 'supportive';
}

// Helper function to handle onboarding flow
async function handleOnboardingFlow(message, user, currentMessages) {
    // Simplified onboarding - only essential identification questions

    // Step 1: Ask for name
    if (!user.profile.name) {
        // Try specific patterns first
        const nameMatch = message.match(/(?:my name is|i'm|i am|call me)\s+([a-zA-Z\s]+)/i);
        if (nameMatch) {
            user.profile.name = nameMatch[1].trim();
            return `Nice to meet you, ${user.profile.name}! To help me remember you for future conversations, could you pick a number between 0-999 that you'll remember?`;
        }
        // If no pattern matches, assume the entire message is the name (if it's reasonable)
        else if (message.trim().length > 0 && message.trim().length < 50 && /^[a-zA-Z\s]+$/.test(message.trim())) {
            user.profile.name = message.trim();
            return `Nice to meet you, ${user.profile.name}! To help me remember you for future conversations, could you pick a number between 0-999 that you'll remember?`;
        }
        else {
            return "I'd love to know what to call you! What's your name?";
        }
    }

    // Step 2: Ask for personal number (0-999)
    if (user.profile.name && (user.profile.personalNumber === undefined || user.profile.personalNumber === null)) {
        const numberMatch = message.match(/\b(\d{1,3})\b/);
        if (numberMatch) {
            const number = parseInt(numberMatch[1]);
            if (number >= 0 && number <= 999) {
                user.profile.personalNumber = number;
                return `Perfect! And what month were you born in? Just say like "January" or "Jan".`;
            } else {
                return "Please choose a number between 0 and 999.";
            }
        } else {
            return "I need a number between 0 and 999. What's your special number?";
        }
    }

    // Step 3: Ask for birth month and complete identification
    if (user.profile.name && user.profile.personalNumber !== undefined && !user.profile.birthMonth) {
        const monthMatch = message.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i);
        if (monthMatch) {
            const monthMap = {
                'january': 'Jan', 'jan': 'Jan',
                'february': 'Feb', 'feb': 'Feb',
                'march': 'Mar', 'mar': 'Mar',
                'april': 'Apr', 'apr': 'Apr',
                'may': 'May',
                'june': 'Jun', 'jun': 'Jun',
                'july': 'Jul', 'jul': 'Jul',
                'august': 'Aug', 'aug': 'Aug',
                'september': 'Sep', 'sep': 'Sep',
                'october': 'Oct', 'oct': 'Oct',
                'november': 'Nov', 'nov': 'Nov',
                'december': 'Dec', 'dec': 'Dec'
            };

            const month = monthMap[monthMatch[1].toLowerCase()];
            user.profile.birthMonth = month;

            // Create unique key
            user.uniqueKey = `${user.profile.name}-${user.profile.personalNumber}-${month}`;

            // Set some defaults and complete onboarding
            user.profile.age = null; // Will be filled naturally in conversation
            user.profile.interests = null; // Will be learned through conversation
            user.profile.currentMood = 'neutral'; // Default starting mood
            user.profile.emotionalState.current = 'neutral';

            return `Great, ${user.profile.name}! I'll remember you now. I'm here to listen and support you. How are you feeling today? What's on your mind?`;
        } else {
            return "Could you tell me your birth month? Like 'January' or 'Jan'?";
        }
    }

    return "I'm still getting to know you. Please continue sharing!";
}// Helper function to convert word numbers to digits
function convertWordToNumber(word) {
    const numbers = {
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
        'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
    };
    return numbers[word.toLowerCase()] || word;
}

module.exports = router;
