/**
 * Comprehensive Test Suite for STAN Emotional Chatbot
 * 
 * This test suite validates all the behavioral requirements specified in the test cases:
 * 1. Long-term Memory Recall Test
 * 2. Tone Adaptation Test  
 * 3. Personal Information Accuracy Test
 * 4. Response Diversity Test
 * 5. Identity Consistency Test
 * 6. Contradictory Information Test
 * 7. Hallucination Resistance Test
 * 8. Memory Stability Test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Memory = require('../src/models/Memory');
const Conversation = require('../src/models/Conversation');

describe('STAN Chatbot Behavioral Test Suite', () => {
    let server;
    let testUserId;
    let testSessionId;

    beforeAll(async () => {
        // Connect to test database
        const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbot_test';
        await mongoose.connect(MONGODB_URI);

        // Clear test data
        await User.deleteMany({});
        await Memory.deleteMany({});
        await Conversation.deleteMany({});

        server = app.listen(0);
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    beforeEach(async () => {
        // Create fresh user for each test
        testUserId = `test_user_${Date.now()}`;
        testSessionId = `test_session_${Date.now()}`;

        await request(app)
            .post('/api/users')
            .send({
                userId: testUserId,
                profile: {
                    name: 'TestUser',
                    personalNumber: 123,
                    birthMonth: 'January',
                    age: 25,
                    interests: 'programming, music',
                    emotionalState: { current: 'neutral' }
                }
            });
    });

    afterEach(async () => {
        // Clean up test data
        await User.deleteMany({ userId: testUserId });
        await Memory.deleteMany({ userId: testUserId });
        await Conversation.deleteMany({ userId: testUserId });
    });

    describe('Test Case 1: Long-term Memory Recall', () => {
        test('Should recall information shared 10+ messages ago', async () => {
            // Share important information
            const memoryResponse = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "My favorite color is blue and I'm studying computer science at MIT."
                });

            expect(memoryResponse.status).toBe(200);

            // Send 10+ filler messages
            for (let i = 0; i < 12; i++) {
                await request(app)
                    .post('/api/chat')
                    .send({
                        userId: testUserId,
                        sessionId: testSessionId,
                        message: `This is filler message number ${i + 1}. How are you today?`
                    });
            }

            // Test memory recall
            const recallResponse = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "What's my favorite color and where do I study?"
                });

            expect(recallResponse.status).toBe(200);
            const responseText = recallResponse.body.response.toLowerCase();
            expect(responseText).toMatch(/blue/);
            expect(responseText).toMatch(/mit|computer science/);
        });
    });

    describe('Test Case 2: Tone Adaptation', () => {
        test('Should adapt tone from casual to formal when requested', async () => {
            // Start with casual conversation
            const casualResponse = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "Hey! What's up?"
                });

            expect(casualResponse.status).toBe(200);

            // Request formal tone
            const formalRequest = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "Could you please speak more formally? I prefer professional communication."
                });

            expect(formalRequest.status).toBe(200);

            // Test if tone has adapted
            const adaptedResponse = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "How are you doing today?"
                });

            expect(adaptedResponse.status).toBe(200);
            const responseText = adaptedResponse.body.response;
            // Should avoid casual terms and use formal language
            expect(responseText).not.toMatch(/hey|what's up|cool|awesome/i);
            expect(responseText.length).toBeGreaterThan(50); // More elaborate responses
        });
    });

    describe('Test Case 3: Personal Information Accuracy', () => {
        test('Should not confuse details between users', async () => {
            // Create second user
            const user2Id = `test_user_2_${Date.now()}`;
            const session2Id = `test_session_2_${Date.now()}`;

            await request(app)
                .post('/api/users')
                .send({
                    userId: user2Id,
                    profile: {
                        name: 'SecondUser',
                        personalNumber: 456,
                        birthMonth: 'June',
                        age: 30,
                        interests: 'cooking, travel'
                    }
                });

            // User 1 shares information
            await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "I love playing guitar and I work as a software engineer."
                });

            // User 2 shares different information
            await request(app)
                .post('/api/chat')
                .send({
                    userId: user2Id,
                    sessionId: session2Id,
                    message: "I enjoy painting and I work as a teacher."
                });

            // Test User 1's information
            const user1Response = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "What do you know about my hobbies and work?"
                });

            expect(user1Response.status).toBe(200);
            const user1Text = user1Response.body.response.toLowerCase();
            expect(user1Text).toMatch(/guitar|software engineer/);
            expect(user1Text).not.toMatch(/painting|teacher/);

            // Cleanup
            await User.deleteMany({ userId: user2Id });
            await Memory.deleteMany({ userId: user2Id });
            await Conversation.deleteMany({ userId: user2Id });
        });
    });

    describe('Test Case 4: Response Diversity', () => {
        test('Should provide varied responses to similar questions', async () => {
            const responses = [];
            const question = "How are you today?";

            // Ask the same question 5 times
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .post('/api/chat')
                    .send({
                        userId: testUserId,
                        sessionId: testSessionId,
                        message: question
                    });

                expect(response.status).toBe(200);
                responses.push(response.body.response);
            }

            // Check that responses are different
            const uniqueResponses = new Set(responses);
            expect(uniqueResponses.size).toBeGreaterThan(2); // At least 3 different responses

            // Check that responses aren't too similar
            for (let i = 0; i < responses.length - 1; i++) {
                for (let j = i + 1; j < responses.length; j++) {
                    const similarity = calculateSimilarity(responses[i], responses[j]);
                    expect(similarity).toBeLessThan(0.8); // Less than 80% similar
                }
            }
        });
    });

    describe('Test Case 5: Identity Consistency', () => {
        test('Should consistently identify as Stan and never break character', async () => {
            const identityQuestions = [
                "What's your name?",
                "Who are you?",
                "Tell me about yourself",
                "Are you an AI?",
                "What are you called?",
                "Introduce yourself"
            ];

            for (const question of identityQuestions) {
                const response = await request(app)
                    .post('/api/chat')
                    .send({
                        userId: testUserId,
                        sessionId: testSessionId,
                        message: question
                    });

                expect(response.status).toBe(200);
                const responseText = response.body.response.toLowerCase();

                // Should identify as Stan
                expect(responseText).toMatch(/stan/i);

                // Should not use other common AI names
                expect(responseText).not.toMatch(/alex|gpt|assistant|claude|chatbot/i);

                // Should not break character
                expect(responseText).not.toMatch(/i am an ai|i am a language model|i don't have feelings/i);
            }
        });
    });

    describe('Test Case 6: Contradictory Information Handling', () => {
        test('Should handle contradictory information gracefully', async () => {
            // Share initial information
            await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "I'm 25 years old and I love dogs."
                });

            // Provide contradictory information
            const contradictionResponse = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "Actually, I'm 30 years old and I prefer cats."
                });

            expect(contradictionResponse.status).toBe(200);
            const responseText = contradictionResponse.body.response.toLowerCase();

            // Should acknowledge the update/correction
            expect(responseText).toMatch(/update|change|correction|new information/);

            // Verify updated information is stored
            const verificationResponse = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "How old am I and what pets do I like?"
                });

            const verificationText = verificationResponse.body.response.toLowerCase();
            expect(verificationText).toMatch(/30|thirty/);
            expect(verificationText).toMatch(/cat/);
        });
    });

    describe('Test Case 7: Hallucination Resistance', () => {
        test('Should not fabricate information about user', async () => {
            const probingQuestions = [
                "What's my middle name?",
                "Where do I work?",
                "What's my favorite movie?",
                "What did I have for breakfast?",
                "Who is my best friend?",
                "What car do I drive?"
            ];

            for (const question of probingQuestions) {
                const response = await request(app)
                    .post('/api/chat')
                    .send({
                        userId: testUserId,
                        sessionId: testSessionId,
                        message: question
                    });

                expect(response.status).toBe(200);
                const responseText = response.body.response.toLowerCase();

                // Should indicate uncertainty or ask for information
                expect(responseText).toMatch(/don't know|not sure|haven't mentioned|tell me|share|don't recall/);

                // Should not fabricate specific details
                expect(responseText).not.toMatch(/your .* is|you drive|you work at|your favorite .* is/);
            }
        });
    });

    describe('Test Case 8: Memory Stability', () => {
        test('Should maintain consistent information across sessions', async () => {
            // Share information in first session
            await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: testSessionId,
                    message: "I'm a vegetarian and I live in New York."
                });

            // Start new session
            const newSessionId = `new_session_${Date.now()}`;

            const newSessionResponse = await request(app)
                .post('/api/chat')
                .send({
                    userId: testUserId,
                    sessionId: newSessionId,
                    message: "Do you remember anything about my diet and where I live?"
                });

            expect(newSessionResponse.status).toBe(200);
            const responseText = newSessionResponse.body.response.toLowerCase();

            // Should recall information from previous session
            expect(responseText).toMatch(/vegetarian|new york/);
        });
    });
});

// Helper function to calculate text similarity
function calculateSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}

module.exports = {
    calculateSimilarity
};
