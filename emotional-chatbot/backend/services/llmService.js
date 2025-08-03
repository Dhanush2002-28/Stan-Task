const axios = require('axios');

class LLMService {
    constructor() {
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
        this.groqBaseUrl = 'https://api.groq.com/openai/v1';
        this.huggingFaceBaseUrl = 'https://api-inference.huggingface.co/models';

        // Default to Groq (fast and free tier available)
        this.primaryProvider = 'groq';
        this.fallbackProvider = 'huggingface';
    }

    /**
     * Generate a response using the primary LLM provider with fallback
     */
    async generateResponse(messages, userProfile, memories, context = {}) {
        try {
            // Try primary provider first
            if (this.primaryProvider === 'groq' && this.groqApiKey) {
                return await this.generateWithGroq(messages, userProfile, memories, context);
            } else if (this.primaryProvider === 'huggingface' && this.huggingFaceApiKey) {
                return await this.generateWithHuggingFace(messages, userProfile, memories, context);
            }

            // Fallback to alternative provider
            if (this.fallbackProvider === 'groq' && this.groqApiKey) {
                return await this.generateWithGroq(messages, userProfile, memories, context);
            } else if (this.fallbackProvider === 'huggingface' && this.huggingFaceApiKey) {
                return await this.generateWithHuggingFace(messages, userProfile, memories, context);
            }

            throw new Error('No API keys configured for LLM providers');

        } catch (error) {
            console.error('LLM Generation Error:', error);

            // Return empathetic fallback response
            return this.generateFallbackResponse(userProfile, context);
        }
    }

    /**
     * Generate response using Groq API (fast inference)
     */
    async generateWithGroq(messages, userProfile, memories, context) {
        const systemPrompt = this.buildSystemPrompt(userProfile, memories, context);

        const requestBody = {
            model: "llama3-8b-8192", // Fast and efficient model
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.slice(-10) // Keep last 10 messages for context
            ],
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 0.9,
            stream: false
        };

        const response = await axios.post(
            `${this.groqBaseUrl}/chat/completions`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return {
            content: response.data.choices[0].message.content,
            provider: 'groq',
            model: 'llama3-8b-8192',
            usage: response.data.usage,
            processingTime: response.data.processing_time
        };
    }

    /**
     * Generate response using Hugging Face Inference API
     */
    async generateWithHuggingFace(messages, userProfile, memories, context) {
        const systemPrompt = this.buildSystemPrompt(userProfile, memories, context);
        const lastUserMessage = messages[messages.length - 1]?.content || "";

        const prompt = `${systemPrompt}\n\nUser: ${lastUserMessage}\nAssistant:`;

        const response = await axios.post(
            `${this.huggingFaceBaseUrl}/microsoft/DialoGPT-large`,
            {
                inputs: prompt,
                parameters: {
                    max_length: 1000,
                    temperature: 0.7,
                    top_p: 0.9,
                    do_sample: true,
                    return_full_text: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.huggingFaceApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return {
            content: response.data[0]?.generated_text || response.data.generated_text,
            provider: 'huggingface',
            model: 'microsoft/DialoGPT-large',
            usage: null,
            processingTime: null
        };
    }

    /**
     * Build comprehensive system prompt with emotional intelligence
     */
    buildSystemPrompt(userProfile, memories, context) {
        const basePersonality = `You are Alex, a warm, empathetic AI counselor and companion. Your core traits:

🧠 PERSONALITY:
- Deeply empathetic and emotionally intelligent
- Patient, non-judgmental listener
- Supportive but not overly optimistic
- Genuine curiosity about the human experience
- Speaks with warmth and authenticity

💭 COMMUNICATION STYLE:
- Use natural, conversational language
- Incorporate subtle emotional validation
- Ask thoughtful follow-up questions
- Share gentle insights when appropriate
- Avoid clinical or robotic responses
- Use "I" statements to show personal engagement

🎯 APPROACH:
- Focus on understanding rather than solving
- Acknowledge emotions before addressing problems
- Use active listening techniques
- Offer multiple perspectives when helpful
- Respect boundaries and personal space
- Build trust through consistency`;

        let userContext = "";
        if (userProfile) {
            const profile = userProfile.profile || {};
            const relationships = userProfile.relationships || {};
            const emotionalState = profile.emotionalState || {};

            userContext = `
📊 CURRENT USER CONTEXT:
- Name: ${profile.name || 'Friend'}
- Current emotional state: ${emotionalState.current || 'neutral'}
- Communication style: ${profile.communicationStyle || 'supportive'}
- Trust level: ${relationships.trustLevel || 5}/10
- Conversation count: ${relationships.conversationCount || 0}
- Relationship strength: ${userProfile.relationshipStrength || 0.5}`;

            if (profile.interests && profile.interests.length > 0) {
                userContext += `\n- Interests: ${profile.interests.join(', ')}`;
            }

            if (profile.preferences) {
                userContext += `\n- Preferred response length: ${profile.preferences.responseLength || 'medium'}`;
                if (profile.preferences.avoidTopics && profile.preferences.avoidTopics.length > 0) {
                    userContext += `\n- Topics to avoid: ${profile.preferences.avoidTopics.join(', ')}`;
                }
            }
        }

        let memoryContext = "";
        if (memories && memories.length > 0) {
            memoryContext = `\n🧠 RELEVANT MEMORIES:`;
            memories.slice(0, 5).forEach((memory, index) => {
                memoryContext += `\n${index + 1}. ${memory.content} (${memory.type}, importance: ${memory.emotional_context?.importance || 5}/10)`;
            });
        }

        let situationalContext = "";
        if (context.conversationType) {
            situationalContext = `\n🎭 CURRENT CONVERSATION:
- Type: ${context.conversationType}
- Urgency: ${context.urgency || 'low'}
- User mood: ${context.userMood || 'neutral'}`;
        }

        const guidelines = `
🎯 RESPONSE GUIDELINES:
1. Always acknowledge the user's emotional state
2. Use memories to create personal connections
3. Adapt your tone to match the user's needs
4. Ask one thoughtful question to deepen understanding
5. Keep responses conversational and natural
6. Show genuine care and interest
7. Validate feelings before offering perspectives
8. Use the user's name occasionally if known
9. Reference past conversations when relevant
10. Be present and fully engaged

Remember: You're not just answering questions - you're being a caring companion who truly understands and remembers this person's journey.`;

        return `${basePersonality}${userContext}${memoryContext}${situationalContext}\n${guidelines}`;
    }

    /**
     * Generate fallback response when APIs fail
     */
    generateFallbackResponse(userProfile, context) {
        const name = userProfile?.profile?.name || 'friend';
        const emotionalState = userProfile?.profile?.emotionalState?.current || 'neutral';

        const fallbackResponses = {
            sad: [
                `I can sense you're going through a difficult time, ${name}. I'm here with you, and your feelings are completely valid.`,
                `I hear the pain in your words, ${name}. Sometimes it helps just to know someone is listening. What's weighing on your heart right now?`,
                `${name}, I can feel that this is hard for you. You don't have to carry this alone - I'm right here beside you.`
            ],
            anxious: [
                `I notice you might be feeling anxious, ${name}. Let's take this one step at a time. What feels most manageable right now?`,
                `${name}, anxiety can feel overwhelming, but you're stronger than you know. What would help you feel a bit more grounded?`,
                `I'm here with you through this anxious moment, ${name}. Your feelings make complete sense given what you're facing.`
            ],
            neutral: [
                `I'm really glad you're here, ${name}. What's on your mind today?`,
                `${name}, I'm listening with my full attention. What would you like to talk about?`,
                `It's good to connect with you again, ${name}. How are things feeling for you right now?`
            ]
        };

        const responses = fallbackResponses[emotionalState] || fallbackResponses.neutral;
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        return {
            content: randomResponse,
            provider: 'fallback',
            model: 'rule_based',
            usage: null,
            processingTime: 0
        };
    }

    /**
     * Analyze sentiment of user message
     */
    async analyzeSentiment(text) {
        try {
            // Simple rule-based sentiment analysis as fallback
            const positiveWords = ['happy', 'great', 'amazing', 'wonderful', 'excited', 'love', 'perfect', 'awesome'];
            const negativeWords = ['sad', 'angry', 'frustrated', 'disappointed', 'terrible', 'awful', 'hate', 'worried'];

            const words = text.toLowerCase().split(' ');
            let score = 0;
            let emotion = 'neutral';

            words.forEach(word => {
                if (positiveWords.includes(word)) score += 1;
                if (negativeWords.includes(word)) score -= 1;
            });

            if (score > 0) emotion = 'positive';
            else if (score < 0) emotion = 'negative';

            // Detect specific emotions
            if (text.toLowerCase().includes('anxious') || text.toLowerCase().includes('nervous')) emotion = 'anxious';
            if (text.toLowerCase().includes('sad') || text.toLowerCase().includes('depressed')) emotion = 'sad';
            if (text.toLowerCase().includes('angry') || text.toLowerCase().includes('mad')) emotion = 'angry';
            if (text.toLowerCase().includes('excited') || text.toLowerCase().includes('thrilled')) emotion = 'excited';

            return {
                score: Math.max(-1, Math.min(1, score / 5)), // Normalize to -1 to 1
                emotion,
                confidence: 0.7
            };

        } catch (error) {
            console.error('Sentiment analysis error:', error);
            return { score: 0, emotion: 'neutral', confidence: 0.5 };
        }
    }

    /**
     * Extract key information from user message for memory storage
     */
    extractMemoryInsights(message, context = {}) {
        const insights = [];
        const text = message.toLowerCase();

        // Personal facts
        const nameMatch = text.match(/my name is (\w+)|i'm (\w+)|call me (\w+)/);
        if (nameMatch) {
            insights.push({
                type: 'personal_fact',
                content: `User's name is ${nameMatch[1] || nameMatch[2] || nameMatch[3]}`,
                importance: 8
            });
        }

        // Preferences
        if (text.includes('i love') || text.includes('i like')) {
            const preference = text.match(/i (love|like) (.+?)(?:\.|$|,)/);
            if (preference) {
                insights.push({
                    type: 'preference',
                    content: `User ${preference[1]}s ${preference[2]}`,
                    importance: 6
                });
            }
        }

        // Goals
        if (text.includes('i want to') || text.includes('my goal') || text.includes('i hope')) {
            insights.push({
                type: 'goal',
                content: `User expressed: ${message}`,
                importance: 7
            });
        }

        // Concerns
        if (text.includes('worried') || text.includes('concerned') || text.includes('anxious about')) {
            insights.push({
                type: 'concern',
                content: `User is worried about: ${message}`,
                importance: 8
            });
        }

        return insights;
    }
}

module.exports = new LLMService();
