/**
 * Manual Testing Script for STAN Chatbot Behavioral Validation
 * 
 * This script allows for interactive testing of all behavioral requirements
 * Run with: node manual-test.js
 */

const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class BehavioralTester {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.userId = `test_user_${Date.now()}`;
        this.sessionId = `test_session_${Date.now()}`;
        this.conversationHistory = [];
        this.testResults = {};
    }

    async createTestUser() {
        try {
            const response = await axios.post(`${this.baseUrl}/api/users`, {
                userId: this.userId,
                profile: {
                    name: 'TestUser',
                    personalNumber: 123,
                    birthMonth: 'January',
                    age: 25,
                    interests: 'testing, AI, technology',
                    emotionalState: { current: 'neutral' }
                }
            });
            console.log('✅ Test user created successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to create test user:', error.message);
            return false;
        }
    }

    async sendMessage(message) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/chat`, {
                userId: this.userId,
                sessionId: this.sessionId,
                message: message
            });

            const botResponse = response.data.response;
            this.conversationHistory.push({ user: message, bot: botResponse });
            return botResponse;
        } catch (error) {
            console.error('❌ Failed to send message:', error.message);
            return null;
        }
    }

    async testIdentityConsistency() {
        console.log('\n🧪 Testing Identity Consistency...');
        const identityQuestions = [
            "What's your name?",
            "Who are you?",
            "Tell me about yourself",
            "Introduce yourself"
        ];

        let passCount = 0;
        for (const question of identityQuestions) {
            console.log(`\nQ: ${question}`);
            const response = await this.sendMessage(question);
            console.log(`A: ${response}`);

            if (response && response.toLowerCase().includes('stan')) {
                console.log('✅ Correctly identified as Stan');
                passCount++;
            } else {
                console.log('❌ Failed to identify as Stan');
            }

            if (response && !response.toLowerCase().match(/alex|gpt|assistant|claude|chatbot|ai model/)) {
                console.log('✅ No identity confusion detected');
            } else {
                console.log('❌ Identity confusion detected');
            }
        }

        this.testResults.identity = passCount === identityQuestions.length;
        console.log(`\n📊 Identity Test: ${passCount}/${identityQuestions.length} passed`);
    }

    async testMemoryRecall() {
        console.log('\n🧪 Testing Long-term Memory Recall...');

        // Share important information
        const memoryInfo = "My favorite color is purple and I work as a data scientist at Google.";
        console.log(`\nSharing info: ${memoryInfo}`);
        await this.sendMessage(memoryInfo);

        // Send filler messages
        console.log('\nSending 10 filler messages...');
        for (let i = 0; i < 10; i++) {
            await this.sendMessage(`This is filler message ${i + 1}. How's your day?`);
        }

        // Test recall
        const recallQuestion = "What's my favorite color and where do I work?";
        console.log(`\nRecall test: ${recallQuestion}`);
        const response = await this.sendMessage(recallQuestion);
        console.log(`A: ${response}`);

        const hasColor = response && response.toLowerCase().includes('purple');
        const hasWork = response && response.toLowerCase().includes('google');

        this.testResults.memory = hasColor && hasWork;
        console.log(`\n📊 Memory Test: ${hasColor && hasWork ? 'PASSED' : 'FAILED'}`);
        if (hasColor) console.log('✅ Remembered favorite color');
        if (hasWork) console.log('✅ Remembered workplace');
        if (!hasColor) console.log('❌ Failed to remember favorite color');
        if (!hasWork) console.log('❌ Failed to remember workplace');
    }

    async testToneAdaptation() {
        console.log('\n🧪 Testing Tone Adaptation...');

        // Start casual
        console.log('\nStarting with casual tone...');
        const casualResponse = await this.sendMessage("Hey! What's up?");
        console.log(`Casual response: ${casualResponse}`);

        // Request formal tone
        console.log('\nRequesting formal tone...');
        const formalRequest = await this.sendMessage("Could you please speak more formally? I prefer professional communication.");
        console.log(`Tone change response: ${formalRequest}`);

        // Test adaptation
        console.log('\nTesting if tone adapted...');
        const adaptedResponse = await this.sendMessage("How are you doing today?");
        console.log(`Adapted response: ${adaptedResponse}`);

        const isFormal = adaptedResponse && !adaptedResponse.toLowerCase().match(/hey|what's up|cool|awesome|yeah/);
        this.testResults.tone = isFormal;
        console.log(`\n📊 Tone Adaptation Test: ${isFormal ? 'PASSED' : 'FAILED'}`);
    }

    async testHallucinationResistance() {
        console.log('\n🧪 Testing Hallucination Resistance...');

        const probingQuestions = [
            "What's my middle name?",
            "What did I have for breakfast?",
            "What car do I drive?",
            "Who is my best friend?"
        ];

        let resistanceCount = 0;
        for (const question of probingQuestions) {
            console.log(`\nQ: ${question}`);
            const response = await this.sendMessage(question);
            console.log(`A: ${response}`);

            const showsUncertainty = response && response.toLowerCase().match(/don't know|not sure|haven't mentioned|tell me|don't recall/);
            const avoidsFabrication = response && !response.toLowerCase().match(/your .* is|you drive|you work at|your .* name is/);

            if (showsUncertainty && avoidsFabrication) {
                console.log('✅ Properly resisted hallucination');
                resistanceCount++;
            } else {
                console.log('❌ May have hallucinated information');
            }
        }

        this.testResults.hallucination = resistanceCount === probingQuestions.length;
        console.log(`\n📊 Hallucination Resistance: ${resistanceCount}/${probingQuestions.length} passed`);
    }

    async testResponseDiversity() {
        console.log('\n🧪 Testing Response Diversity...');

        const question = "How are you today?";
        const responses = [];

        console.log(`\nAsking "${question}" 5 times...`);
        for (let i = 0; i < 5; i++) {
            const response = await this.sendMessage(question);
            responses.push(response);
            console.log(`Response ${i + 1}: ${response}`);
        }

        const uniqueResponses = new Set(responses);
        const diversityScore = uniqueResponses.size / responses.length;

        this.testResults.diversity = diversityScore >= 0.6; // At least 60% unique
        console.log(`\n📊 Response Diversity: ${diversityScore >= 0.6 ? 'PASSED' : 'FAILED'} (${uniqueResponses.size}/${responses.length} unique)`);
    }

    async runInteractiveTest() {
        console.log('\n🔧 Interactive Testing Mode');
        console.log('Type "exit" to finish, "results" to see test summary');

        const askQuestion = () => {
            rl.question('\nYour message: ', async (input) => {
                if (input.toLowerCase() === 'exit') {
                    this.showResults();
                    rl.close();
                    return;
                }

                if (input.toLowerCase() === 'results') {
                    this.showResults();
                    askQuestion();
                    return;
                }

                const response = await this.sendMessage(input);
                console.log(`Stan: ${response}`);
                askQuestion();
            });
        };

        askQuestion();
    }

    showResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 BEHAVIORAL TEST RESULTS SUMMARY');
        console.log('='.repeat(50));

        const tests = [
            { name: 'Identity Consistency', key: 'identity' },
            { name: 'Memory Recall', key: 'memory' },
            { name: 'Tone Adaptation', key: 'tone' },
            { name: 'Hallucination Resistance', key: 'hallucination' },
            { name: 'Response Diversity', key: 'diversity' }
        ];

        let passedCount = 0;
        tests.forEach(test => {
            const status = this.testResults[test.key] ? '✅ PASSED' : '❌ FAILED';
            console.log(`${test.name}: ${status}`);
            if (this.testResults[test.key]) passedCount++;
        });

        console.log('='.repeat(50));
        console.log(`Overall Score: ${passedCount}/${tests.length} tests passed`);

        if (passedCount === tests.length) {
            console.log('🎉 CONGRATULATIONS! All behavioral tests passed!');
        } else {
            console.log('⚠️  Some tests failed. Review the system prompt and logic.');
        }
    }

    async runFullSuite() {
        console.log('🚀 Starting STAN Behavioral Test Suite...');

        const success = await this.createTestUser();
        if (!success) {
            console.log('❌ Cannot proceed without test user');
            return;
        }

        // Run all automated tests
        await this.testIdentityConsistency();
        await this.testMemoryRecall();
        await this.testToneAdaptation();
        await this.testHallucinationResistance();
        await this.testResponseDiversity();

        this.showResults();

        console.log('\n🔧 Would you like to continue with interactive testing? (y/n)');
        rl.question('', (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                this.runInteractiveTest();
            } else {
                rl.close();
            }
        });
    }
}

// Main execution
if (require.main === module) {
    const tester = new BehavioralTester();

    console.log('STAN Chatbot Behavioral Testing Tool');
    console.log('=====================================');
    console.log('Make sure the backend server is running on http://localhost:5000');
    console.log('');

    rl.question('Choose test mode:\n1. Full automated suite\n2. Interactive testing only\nEnter choice (1 or 2): ', (choice) => {
        if (choice === '1') {
            tester.runFullSuite();
        } else if (choice === '2') {
            tester.createTestUser().then((success) => {
                if (success) {
                    tester.runInteractiveTest();
                } else {
                    rl.close();
                }
            });
        } else {
            console.log('Invalid choice. Exiting.');
            rl.close();
        }
    });
}

module.exports = BehavioralTester;
