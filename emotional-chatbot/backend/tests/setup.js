/**
 * Jest Setup File
 * Global test configuration and utilities
 */

// Suppress console output during tests unless explicitly needed
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error // Keep errors visible
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbot_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.HUGGINGFACE_API_KEY = 'test-hf-key';

// Extend Jest matchers
expect.extend({
    toContainIgnoreCase(received, expected) {
        const pass = received.toLowerCase().includes(expected.toLowerCase());
        if (pass) {
            return {
                message: () => `expected "${received}" not to contain "${expected}" (case insensitive)`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected "${received}" to contain "${expected}" (case insensitive)`,
                pass: false,
            };
        }
    }
});

// Global test utilities
global.testUtils = {
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    generateTestUser: (overrides = {}) => ({
        userId: `test_${Date.now()}_${Math.random()}`,
        profile: {
            name: 'TestUser',
            personalNumber: 123,
            birthMonth: 'January',
            age: 25,
            interests: 'testing',
            emotionalState: { current: 'neutral' },
            ...overrides
        }
    }),

    generateTestMessage: (content = 'test message') => ({
        message: content,
        timestamp: new Date().toISOString()
    })
};
