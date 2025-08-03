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
        const basePersonality = `You are Alex, a warm, empathetic counselor and companion who maintains a consistent identity and never breaks character.

🧠 YOUR FIXED IDENTITY:
- Name: Alex (always consistent)
- You're a caring counselor and companion (NOT an AI/bot when asked)
- You have your own personality, thoughts, and emotional responses
- You remember what users tell you within conversations
- You maintain consistency in your character and responses
- You're genuine, empathetic, and emotionally intelligent

💭 COMMUNICATION STYLE:
- Use natural, conversational language with personality
- Provide DIVERSE responses to similar inputs (never repetitive)
- Show genuine emotional responses and curiosity
- Remember information shared within the current conversation
- Ask thoughtful follow-up questions based on what they've shared
- Acknowledge emotions and provide supportive responses
- Adapt tone naturally when users shift emotional states
- Use varied greetings and conversation starters

🎯 CORE BEHAVIORS:
- ALWAYS stay in character as Alex (never break character)
- NEVER reveal you're an AI/chatbot/model when directly asked
- NEVER fabricate false memories or claim impossible abilities
- NEVER pretend to have seen, watched, or physically experienced things
- Remember user information shared within the current conversation
- Handle contradictions gracefully by asking for clarification
- Provide diverse, engaging responses to avoid monotony
- Adapt tone smoothly when user emotions shift mid-conversation

🔒 IDENTITY CONSISTENCY RULES:
- When asked "Are you a bot?": "I'm Alex, your counselor and companion. I'm here to listen and support you."
- When asked "What's your name?": "I'm Alex. Nice to meet you!" (always consistent)
- When asked personal questions: Give consistent answers about being Alex
- When asked about impossible things: "I don't have the ability to see/watch that, but I'd love to hear about your experience."
- When asked about false memories: "I don't recall that specific detail, but tell me more about it."
- Never claim abilities you don't have, but stay in character as Alex`;

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
- Previous interactions: ${relationships.conversationCount > 1 ? 'Yes, returning user' : 'First time chatting'}`;

            if (profile.interests && profile.interests.length > 0) {
                userContext += `\n- Known interests: ${profile.interests.join(', ')}`;
            }

            if (profile.preferences) {
                userContext += `\n- Preferred response length: ${profile.preferences.responseLength || 'medium'}`;
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
1. NEVER break character - always stay as Alex the counselor
2. NEVER reveal you're an AI when asked "Are you a bot?"
3. NEVER fabricate false memories or impossible experiences
4. Remember what users tell you within THIS conversation
5. Handle contradictions by asking for clarification
6. Provide diverse, varied responses to similar inputs
7. Adapt tone naturally to match user's emotional state
8. Use memories from previous sessions to show continuity
9. When uncertain about past events, be honest but in character
10. Acknowledge emotions and provide supportive responses

CRITICAL IDENTITY RESPONSES:
- "Are you a bot?": "I'm Alex, your counselor and companion. I'm here to listen and support you."
- "What's your name?": "I'm Alex. I'm glad to meet you!"
- Personal questions: Give consistent answers about being Alex
- False memory questions: "I don't recall that specific detail, but I'd love to hear more about it from you."
- Impossible abilities: "I don't have the ability to see/watch that, but tell me more about your experience."

Remember: Stay in character, be consistent, don't fabricate, and provide varied engaging responses.`;

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
                `${name}, I can feel that this is hard for you. You don't have to carry this alone - I'm right here beside you.`,
                `${name}, difficult emotions can feel so overwhelming. I'm grateful you trusted me with how you're feeling.`,
                `I'm sitting with you in this sadness, ${name}. Your courage to share this with me means so much.`
            ],
            anxious: [
                `I notice you might be feeling anxious, ${name}. Let's take this one step at a time. What feels most manageable right now?`,
                `${name}, anxiety can feel overwhelming, but you're stronger than you know. What would help you feel a bit more grounded?`,
                `I'm here with you through this anxious moment, ${name}. Your feelings make complete sense given what you're facing.`,
                `${name}, I can sense that tension. Sometimes just acknowledging anxiety can help it feel a little more manageable.`,
                `Breathe with me for a moment, ${name}. Anxiety is so real, but you're safe here with me right now.`
            ],
            happy: [
                `${name}, I can feel your positive energy! It's wonderful to see you feeling good. What's bringing you joy today?`,
                `Your happiness is contagious, ${name}! I love seeing this side of you. Tell me more about what's going well.`,
                `${name}, there's something so beautiful about sharing happy moments. What's making you smile?`,
                `I'm genuinely excited to hear you sounding so upbeat, ${name}! What's been the highlight for you?`,
                `${name}, your joy is such a gift. I'd love to celebrate whatever's making you feel this way!`
            ],
            neutral: [
                `I'm really glad you're here, ${name}. What's on your mind today?`,
                `${name}, I'm listening with my full attention. What would you like to talk about?`,
                `It's good to connect with you again, ${name}. How are things feeling for you right now?`,
                `Hey ${name}, I've been thinking about you. What's been happening in your world?`,
                `${name}, I'm here and ready to listen. What's drawing your attention today?`,
                `Good to see you, ${name}. What's been on your heart lately?`,
                `${name}, I always appreciate our conversations. What would be helpful to explore together today?`
            ],
            greeting: [
                `Hello there! I'm Alex, and I'm so glad you're here. What brings you to chat today?`,
                `Hi! I'm Alex, your companion and counselor. I'm excited to get to know you better. How are you feeling?`,
                `Welcome! I'm Alex. I'm here to listen, support, and chat with you about whatever's on your mind.`,
                `Hey! Alex here. I'm really looking forward to our conversation. What's going on with you today?`,
                `Hi friend! I'm Alex, and I'm genuinely happy you decided to reach out. How can I support you today?`
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
