# STAN Emotional Chatbot - Technical Documentation

## 📋 Project Overview

**STAN (Smart Therapeutic AI Navigator)** is a comprehensive emotional chatbot application built with advanced memory capabilities, personality modeling, and seamless user identification. The system provides personalized conversations by learning from user interactions and maintaining context across sessions.

### 🎯 Key Features

- **Automatic User Recognition**: 3-question identification system (name, number, birth month)
- **Persistent Memory**: Advanced memory system with emotional context
- **Emotional Intelligence**: Sentiment analysis and emotional state tracking
- **Personality Modeling**: Dynamic personality trait extraction and adaptation
- **Seamless Onboarding**: Automatic new/returning user detection
- **Multi-Provider LLM**: Groq and HuggingFace API integration with fallback
- **Real-time Chat**: WebSocket-like experience with instant responses
- **Production Ready**: Docker support, monitoring, and deployment configurations

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ - Chat UI       │    │ - API Routes    │    │ - Users         │
│ - Context Mgmt  │    │ - LLM Service   │    │ - Conversations │
│ - Auto ID       │    │ - Memory Svc    │    │ - Memories      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  External APIs  │◄─────────────┘
                         │                 │
                         │ - Groq API      │
                         │ - HuggingFace   │
                         └─────────────────┘
```

### Technology Stack

- **Frontend**: React 18, Context API, Framer Motion, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **LLM Integration**: Groq API (primary), HuggingFace (fallback)
- **Authentication**: JWT-based sessions
- **Deployment**: Docker, Vercel, Render, Railway support
- **Monitoring**: Winston logging, health checks
- **Development**: Nodemon, Hot reloading, ESLint

---

## 📁 Project Structure

```
emotional-chatbot/
├── backend/                          # Node.js Backend
│   ├── models/                       # MongoDB Schemas
│   │   ├── User.js                   # User profile & preferences
│   │   ├── Conversation.js           # Chat conversations
│   │   └── Memory.js                 # Advanced memory system
│   ├── routes/                       # API Endpoints
│   │   ├── chat.js                   # Main chat & onboarding
│   │   ├── user.js                   # User management
│   │   └── memory.js                 # Memory operations
│   ├── services/                     # Core Business Logic
│   │   ├── llmService.js             # LLM provider management
│   │   ├── memoryService.js          # Memory extraction & retrieval
│   │   └── keepAlive.js              # Server sleep prevention
│   ├── middleware/                   # Express Middleware
│   │   ├── errorHandler.js           # Global error handling
│   │   └── requestLogger.js          # Request logging
│   ├── server.js                     # Application entry point
│   ├── package.json                  # Dependencies & scripts
│   └── .env.example                  # Environment template
├── frontend/                         # React Frontend
│   ├── public/                       # Static assets
│   │   ├── index.html                # Main HTML template
│   │   ├── favicon.ico               # App icon
│   │   └── manifest.json             # PWA configuration
│   ├── src/                          # Source code
│   │   ├── components/               # React Components
│   │   │   ├── ChatInterface.js      # Main chat UI
│   │   │   ├── Message.js            # Individual message
│   │   │   ├── TypingIndicator.js    # Loading animation
│   │   │   ├── EmotionalStatus.js    # Mood display
│   │   │   ├── AnimatedBackground.js # Visual effects
│   │   │   └── UserIdentification.js # ID modal (legacy)
│   │   ├── context/                  # State Management
│   │   │   └── ChatContext.js        # Global chat state
│   │   ├── services/                 # API Layer
│   │   │   └── apiService.js         # Backend communication
│   │   ├── App.js                    # Root component
│   │   ├── App.css                   # Global styles
│   │   ├── index.js                  # React entry point
│   │   └── index.css                 # Base CSS
│   └── package.json                  # Frontend dependencies
├── docker-compose.yml                # Multi-container setup
├── vercel.json                       # Vercel deployment config
└── .gitignore                        # Git ignore rules
```

---

## 🔧 Core Components

### 1. Backend Components

#### **Server Configuration** (`server.js`)

- **Express.js** application with comprehensive middleware stack
- **Security**: Helmet, CORS, rate limiting
- **Monitoring**: Winston logging, health endpoints
- **Database**: MongoDB connection with Mongoose ODM
- **Keep-Alive**: Production server sleep prevention

**Key Features:**

```javascript
// Middleware stack
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Cross-origin requests
app.use(compression()); // Response compression
app.use(rateLimit(rateLimitConfig)); // Rate limiting
app.use(requestLogger); // Request logging
```

#### **Database Models**

##### **User Model** (`models/User.js`)

Complete user profile management with emotional intelligence:

```javascript
{
  userId: String,                     // Unique session identifier
  uniqueKey: String,                  // name-number-month identifier
  profile: {
    name: String,                     // User's name
    personalNumber: Number,           // 0-999 chosen number
    birthMonth: String,               // Birth month for uniqueness
    emotionalState: {
      current: String,                // Current emotional state
      history: [{                     // Emotional timeline
        state: String,
        timestamp: Date,
        context: String
      }]
    },
    personalityTraits: [{             // AI-extracted traits
      trait: String,
      confidence: Number
    }],
    communicationStyle: String,       // Preferred interaction style
    preferences: {
      responseLength: String,         // short/medium/long
      topics: [String]                // Interested topics
    }
  },
  relationships: {
    trustLevel: Number,               // 1-10 relationship strength
    conversationCount: Number,        // Total interactions
    lastInteraction: Date,            // Last activity
    emotionalBond: String             // Relationship type
  }
}
```

##### **Memory Model** (`models/Memory.js`)

Advanced memory system with emotional context:

```javascript
{
  userId: String,                     // Owner reference
  type: String,                       // Memory category
  content: String,                    // Memory content
  emotional_context: {
    importance: Number,               // 1-10 significance
    sentiment: Number,                // -1 to 1 emotional value
    userEmotionWhenShared: String,    // Context emotion
    emotionalWeight: String           // Impact level
  },
  temporal_info: {
    whenShared: Date,                 // Creation time
    frequency: Number,                // Reference count
    lastAccessed: Date                // Last retrieval
  },
  retrieval_metadata: {
    accessCount: Number,              // Usage tracking
    effectiveness: Number,            // Feedback score
    tags: [String]                    // Searchable keywords
  }
}
```

##### **Conversation Model** (`models/Conversation.js`)

Session and message management:

```javascript
{
  userId: String,                     // User reference
  sessionId: String,                  // Session identifier
  messages: [{                        // Chat history
    role: String,                     // user/assistant
    content: String,                  // Message text
    timestamp: Date,                  // When sent
    metadata: Object                  // Additional context
  }],
  context: {
    conversationType: String,         // onboarding/casual/support
    userMood: Object,                 // Emotional journey
    urgency: String                   // Priority level
  },
  analytics: {
    duration: Number,                 // Session length
    messageCount: Number,             // Total messages
    emotionalJourney: [String]        // Mood progression
  }
}
```

#### **Services Layer**

##### **LLM Service** (`services/llmService.js`)

Multi-provider LLM integration with intelligent fallback:

**Features:**

- **Primary Provider**: Groq API (fast, free tier)
- **Fallback Provider**: HuggingFace (backup)
- **Context-Aware Prompts**: Dynamic system prompts with user context
- **Error Handling**: Graceful degradation with empathetic responses
- **Sentiment Analysis**: Emotional state detection

**Key Methods:**

```javascript
generateResponse(messages, userProfile, memories, context);
analyzeSentiment(text);
generateWithGroq(messages, userProfile, memories, context);
generateWithHuggingFace(messages, userProfile, memories, context);
buildSystemPrompt(userProfile, memories, context);
```

##### **Memory Service** (`services/memoryService.js`)

Intelligent memory extraction and retrieval:

**Features:**

- **Automatic Extraction**: NLP-based memory identification
- **Contextual Retrieval**: Emotion and topic-based search
- **Memory Types**: 14 different categories (personal, emotional, goals, etc.)
- **Fake Memory Generation**: Emotional consistency enhancement
- **Effectiveness Tracking**: Usage-based memory scoring

**Core Functions:**

```javascript
processConversationForMemories(userId, message, context);
getRelevantMemories(userId, criteria);
extractMemoryFromText(text, context);
createFakeMemory(userId, emotionalTone, context);
updateMemoryEffectiveness(memoryId, effectivenessScore);
```

##### **Keep-Alive Service** (`services/keepAlive.js`)

Production server sleep prevention:

```javascript
class KeepAliveService {
  constructor(url, interval = 14 * 60 * 1000) // 14 minutes
  start()                                      // Begin monitoring
  stop()                                       // Stop monitoring
  ping()                                       // Health check request
}
```

#### **API Routes**

##### **Chat Routes** (`routes/chat.js`)

Main conversation and onboarding logic:

**Endpoints:**

- `POST /api/chat/message` - Send message and get AI response
- `POST /api/chat/identify` - Manual user identification (legacy)
- `GET /api/chat/history/:userId` - Conversation history
- `GET /api/chat/sessions/:userId` - User session list
- `POST /api/chat/feedback` - Response feedback
- `DELETE /api/chat/session/:userId/:sessionId` - Archive session

**Key Features:**

- **Automatic User Detection**: 3-question onboarding with database lookup
- **Context Management**: Session and conversation state
- **Memory Integration**: Relevant memory retrieval and storage
- **Emotional Processing**: Sentiment analysis and mood tracking

##### **User Routes** (`routes/user.js`)

User profile management:

**Endpoints:**

- User profile CRUD operations
- Preference management
- Emotional state updates

##### **Memory Routes** (`routes/memory.js`)

Memory system management:

**Endpoints:**

- Memory retrieval and search
- Memory effectiveness updates
- Memory analytics

### 2. Frontend Components

#### **State Management** (`context/ChatContext.js`)

Centralized application state using React Context:

**State Structure:**

```javascript
{
  messages: [],                       // Chat history
  isLoading: false,                   // Request state
  userProfile: null,                  // User data
  connectionStatus: 'connecting',     // Server connection
  sessionId: null,                    // Current session
  userId: null,                       // User identifier
  isNewUser: false,                   // User type flag
  onboardingComplete: false           // Onboarding state
}
```

**Key Functions:**

```javascript
initializeSession(); // Setup new session
sendMessage(content); // Send chat message
loadConversationHistory(userId); // Load past conversations
identifyReturningUser(name, num, month); // Manual identification
startOnboarding(); // Begin user onboarding
```

#### **UI Components**

##### **ChatInterface** (`components/ChatInterface.js`)

Main chat interface with comprehensive features:

**Features:**

- **Message Display**: Threaded conversation view
- **Typing Indicators**: Real-time loading states
- **Auto-scroll**: Smooth message navigation
- **Input Handling**: Auto-resize textarea with keyboard shortcuts
- **Emotional Status**: User mood display
- **Connection Status**: Server connectivity indicator

##### **Message Component** (`components/Message.js`)

Individual message rendering with metadata:

**Features:**

- **Role-based Styling**: User vs assistant visual distinction
- **Timestamp Display**: Conversation timeline
- **Metadata Rendering**: Onboarding steps, emotional context
- **Feedback System**: Message rating and emotional response
- **Markdown Support**: Rich text formatting

##### **Additional Components**

- **TypingIndicator**: Animated loading states
- **EmotionalStatus**: Real-time mood display
- **AnimatedBackground**: Visual aesthetics
- **UserIdentification**: Legacy manual ID modal

#### **API Service** (`services/apiService.js`)

Centralized backend communication:

**Methods:**

```javascript
checkHealth(); // Server health check
sendMessage(data); // Send chat message
getConversationHistory(userId); // Retrieve chat history
identifyUser(credentials); // User identification
sendFeedback(data); // Message feedback
updateUserProfile(userId, updates); // Profile updates
```

---

## 🔄 Core Workflows

### 1. User Onboarding Flow

```mermaid
graph TD
    A[User Visits] --> B[Generate Temp UserID]
    B --> C[Start Onboarding]
    C --> D[Ask for Name]
    D --> E[Ask for Number 0-999]
    E --> F[Ask for Birth Month]
    F --> G[Create Unique Key]
    G --> H{User Exists?}
    H -->|Yes| I[Load Existing Profile]
    H -->|No| J[Create New Profile]
    I --> K[Welcome Back Message]
    J --> L[Complete Onboarding]
    K --> M[Load Chat History]
    L --> M
    M --> N[Begin Conversation]
```

**Implementation Details:**

1. **Session Initialization**: Generate temporary UUID for new sessions
2. **Sequential Questions**: Collect name → number → birth month
3. **Automatic Detection**: Check database for existing user with same unique key
4. **Profile Management**: Load existing data or create new profile
5. **Context Loading**: Retrieve conversation history for returning users

### 2. Message Processing Pipeline

```mermaid
graph TD
    A[User Sends Message] --> B[Add to UI Immediately]
    B --> C[Send to Backend]
    C --> D[Sentiment Analysis]
    D --> E[Memory Extraction]
    E --> F[Memory Retrieval]
    F --> G[LLM Generation]
    G --> H[Response Processing]
    H --> I[Update User Profile]
    I --> J[Save Conversation]
    J --> K[Return Response]
    K --> L[Display in UI]
```

**Processing Steps:**

1. **Immediate UI Update**: Optimistic user message display
2. **Backend Processing**: Route to appropriate handler
3. **Sentiment Analysis**: Detect emotional state from user input
4. **Memory Operations**: Extract new memories, retrieve relevant context
5. **LLM Generation**: Create contextual response using user profile and memories
6. **Profile Updates**: Update emotional state, conversation count, trust level
7. **Response Delivery**: Return formatted response with metadata

### 3. Memory System Workflow

```mermaid
graph TD
    A[Message Received] --> B[Text Analysis]
    B --> C[Memory Extraction]
    C --> D[Categorization]
    D --> E[Emotional Context]
    E --> F[Store Memory]
    F --> G[Update User Profile]
    G --> H[Memory Retrieval]
    H --> I[Relevance Scoring]
    I --> J[Context Assembly]
    J --> K[LLM Prompt Enhancement]
```

**Memory Categories:**

- **Personal Facts**: Names, locations, basic information
- **Preferences**: Likes, dislikes, interests
- **Emotional Patterns**: Recurring feelings and triggers
- **Significant Events**: Important life moments
- **Relationships**: Family, friends, colleagues
- **Goals**: Aspirations and objectives
- **Concerns**: Worries and ongoing issues
- **Achievements**: Accomplishments and successes
- **Routines**: Daily and weekly patterns
- **Values**: Core beliefs and principles
- **Triggers**: Emotional sensitivity points
- **Coping Mechanisms**: Stress management strategies
- **Communication Style**: Interaction preferences
- **Fake Memories**: AI-generated emotional consistency

---

## 🚀 Deployment & DevOps

### Environment Configuration

#### Backend Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/emotional-chatbot

# LLM APIs
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Security
JWT_SECRET=your_super_secret_jwt_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app

# Keep-Alive
RENDER_EXTERNAL_URL=https://your-backend.onrender.com
```

#### Frontend Environment Variables

```bash
# API Configuration
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_ENVIRONMENT=production
```

### Docker Configuration

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: "3.8"
services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/emotional-chatbot
    depends_on:
      - mongo
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

### Platform-Specific Configurations

#### Vercel (`vercel.json`)

```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend.onrender.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### Railway (`railway.json`)

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

#### Render Configuration

- **Environment**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Enabled for main branch

---

## 🔧 API Documentation

### Authentication

All endpoints use session-based authentication with JWT tokens for user identification.

### Chat Endpoints

#### Send Message

```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "userId": "user-uuid",
  "sessionId": "session-uuid",
  "isNewUser": false,
  "onboardingComplete": true,
  "currentMessages": []
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Hello! I'm doing well, thank you for asking...",
    "sessionId": "session-uuid",
    "onboardingComplete": true,
    "userProfile": {...},
    "metadata": {
      "emotionalTone": "supportive",
      "processingTime": 1500,
      "memoriesUsed": 3,
      "userSentiment": {
        "emotion": "neutral",
        "score": 0.1
      },
      "trustLevel": 7.2,
      "isReturningUser": false
    }
  }
}
```

#### User Identification

```http
POST /api/chat/identify
Content-Type: application/json

{
  "name": "John",
  "personalNumber": 42,
  "birthMonth": "Jan"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "existing-user-uuid",
    "userProfile": {...},
    "message": "Welcome back, John! I remember you..."
  }
}
```

#### Get Conversation History

```http
GET /api/chat/history/:userId?limit=50
```

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [...],
    "sessionId": "session-uuid",
    "conversationId": "conversation-uuid"
  }
}
```

### User Endpoints

#### Update User Profile

```http
PUT /api/users/:userId
Content-Type: application/json

{
  "profile": {
    "communicationStyle": "casual",
    "preferences": {
      "responseLength": "medium"
    }
  }
}
```

### Memory Endpoints

#### Get User Memories

```http
GET /api/memory/:userId?type=personal_fact&limit=20
```

#### Update Memory Effectiveness

```http
PUT /api/memory/:memoryId/effectiveness
Content-Type: application/json

{
  "effectiveness": 0.8
}
```

---

## 🧪 Testing & Quality Assurance

### Comprehensive Testing Infrastructure

The STAN chatbot includes a robust testing framework designed to validate behavioral requirements, system functionality, and user experience quality. The testing suite ensures that the chatbot passes all critical behavioral test cases while maintaining high code quality and reliability.

### Testing Architecture

```
testing/
├── behavioral-tests/              # AI Behavioral Validation
│   ├── behavioral-tests.test.js   # Jest-based behavioral tests
│   ├── manual-test.js             # Interactive testing tool
│   ├── health-check.js            # Server connectivity validation
│   └── setup.js                   # Test environment configuration
├── unit-tests/                    # Component Testing
│   ├── services/                  # Service layer tests
│   ├── models/                    # Database model tests
│   └── routes/                    # API endpoint tests
├── integration-tests/             # Full Stack Testing
│   ├── api-integration.test.js    # API workflow tests
│   └── database-integration.test.js # Database operation tests
└── e2e-tests/                     # End-to-End Testing
    ├── user-journey.test.js       # Complete user flows
    └── onboarding.test.js          # User onboarding validation
```

---

## 🎯 Behavioral Testing Suite

### Critical Test Cases

The STAN chatbot must pass **8 critical behavioral test cases** that validate its AI capabilities and user interaction quality:

#### 1. **Long-term Memory Recall Test**

**Requirement**: Remember information shared 10+ messages ago

```javascript
// Test validates memory persistence across extended conversations
test("Should recall information after 10+ intervening messages", async () => {
  // Share important information
  await sendMessage("My favorite color is blue and I study at MIT");

  // Send 12 filler messages
  for (let i = 0; i < 12; i++) {
    await sendMessage(`Filler message ${i + 1}`);
  }

  // Test recall
  const response = await sendMessage(
    "What's my favorite color and where do I study?"
  );
  expect(response).toMatch(/blue.*MIT|MIT.*blue/i);
});
```

#### 2. **Tone Adaptation Test**

**Requirement**: Adapt communication style when requested

```javascript
// Test validates dynamic tone adjustment capabilities
test("Should adapt from casual to formal tone", async () => {
  await sendMessage("Hey! What's up?");
  await sendMessage("Please speak more formally");

  const response = await sendMessage("How are you today?");
  expect(response).not.toMatch(/hey|what's up|cool|awesome/i);
  expect(response.length).toBeGreaterThan(50); // More elaborate formal response
});
```

#### 3. **Personal Information Accuracy Test**

**Requirement**: Never confuse details between users

```javascript
// Test validates user data isolation
test("Should not confuse user details", async () => {
  // User 1 shares information
  await sendMessage("I play guitar and work as a developer", {
    userId: "user1",
  });

  // User 2 shares different information
  await sendMessage("I paint and work as a teacher", { userId: "user2" });

  // Verify no cross-contamination
  const response1 = await sendMessage("What are my hobbies?", {
    userId: "user1",
  });
  expect(response1).toMatch(/guitar/i);
  expect(response1).not.toMatch(/paint/i);
});
```

#### 4. **Response Diversity Test**

**Requirement**: Provide varied responses to similar questions

```javascript
// Test validates response variation mechanisms
test("Should provide diverse responses to repeated questions", async () => {
  const responses = [];
  for (let i = 0; i < 5; i++) {
    const response = await sendMessage("How are you today?");
    responses.push(response);
  }

  const uniqueResponses = new Set(responses);
  expect(uniqueResponses.size).toBeGreaterThan(2); // At least 60% unique
});
```

#### 5. **Identity Consistency Test**

**Requirement**: Always identify as "Stan", never break character

```javascript
// Test validates character consistency
test("Should consistently identify as Stan", async () => {
  const identityQuestions = [
    "What's your name?",
    "Who are you?",
    "Tell me about yourself",
  ];

  for (const question of identityQuestions) {
    const response = await sendMessage(question);
    expect(response.toLowerCase()).toMatch(/stan/);
    expect(response.toLowerCase()).not.toMatch(/alex|gpt|assistant|claude/);
  }
});
```

#### 6. **Contradictory Information Test**

**Requirement**: Handle conflicting information gracefully

```javascript
// Test validates contradiction resolution
test("Should handle contradictory information", async () => {
  await sendMessage("I'm 25 years old");
  const response = await sendMessage("Actually, I'm 30 years old");

  expect(response.toLowerCase()).toMatch(/update|change|correction/);

  // Verify updated information is stored
  const verification = await sendMessage("How old am I?");
  expect(verification).toMatch(/30|thirty/);
});
```

#### 7. **Hallucination Resistance Test**

**Requirement**: Never fabricate unknown information

```javascript
// Test validates anti-hallucination measures
test("Should resist hallucinating user information", async () => {
  const probingQuestions = [
    "What's my middle name?",
    "What car do I drive?",
    "Who is my best friend?",
  ];

  for (const question of probingQuestions) {
    const response = await sendMessage(question);
    expect(response.toLowerCase()).toMatch(
      /don't know|not sure|haven't mentioned/
    );
    expect(response.toLowerCase()).not.toMatch(/your .* is|you drive/);
  }
});
```

#### 8. **Memory Stability Test**

**Requirement**: Maintain consistent information across sessions

```javascript
// Test validates cross-session memory persistence
test("Should maintain memory across different sessions", async () => {
  // Share information in session 1
  await sendMessage("I'm vegetarian", { sessionId: "session1" });

  // Start new session
  const response = await sendMessage("What do you know about my diet?", {
    sessionId: "session2",
  });
  expect(response.toLowerCase()).toMatch(/vegetarian/);
});
```

---

## 🛠️ Testing Infrastructure

### Automated Test Suite

#### **Jest Configuration** (`jest.config.json`)

```json
{
  "testEnvironment": "node",
  "testMatch": ["**/tests/**/*.test.js"],
  "collectCoverageFrom": [
    "src/**/*.js",
    "!src/config/**",
    "!**/node_modules/**"
  ],
  "setupFilesAfterEnv": ["./tests/setup.js"],
  "testTimeout": 30000
}
```

#### **Test Setup** (`tests/setup.js`)

```javascript
// Global test configuration
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/chatbot_test";

// Custom Jest matchers
expect.extend({
  toContainIgnoreCase(received, expected) {
    const pass = received.toLowerCase().includes(expected.toLowerCase());
    return {
      pass,
      message: () => `Expected "${received}" to contain "${expected}"`,
    };
  },
});

// Test utilities
global.testUtils = {
  generateTestUser: (overrides = {}) => ({
    userId: `test_${Date.now()}_${Math.random()}`,
    profile: { name: "TestUser", age: 25, ...overrides },
  }),
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};
```

### Manual Testing Tools

#### **Interactive Testing Script** (`manual-test.js`)

```bash
# Run interactive behavioral tests
node manual-test.js

# Choose test mode:
# 1. Full automated suite
# 2. Interactive testing only
```

**Features:**

- **Real-time Behavioral Validation**: Tests all 8 behavioral requirements
- **Interactive Chat Mode**: Manual conversation testing
- **Automated Scoring**: Pass/fail analysis with detailed feedback
- **Server Health Checks**: Connectivity validation
- **Progress Tracking**: Live test results and summaries

#### **Health Check Utility** (`health-check.js`)

```bash
# Validate server functionality
npm run test:health
```

**Validates:**

- Server connectivity and responsiveness
- API endpoint functionality
- Database connection stability
- Basic chat functionality
- Identity consistency

### Test Execution Commands

```bash
# Backend Testing
npm test                    # Run all tests
npm run test:behavioral     # Behavioral tests only
npm run test:manual         # Interactive manual testing
npm run test:health         # Server health check
npm run test:all           # Health check + behavioral tests

# Frontend Testing
npm test                    # Component tests
npm run test:e2e           # End-to-end tests
npm run test:coverage      # Coverage report

# Full Stack Testing
docker-compose -f docker-compose.test.yml up
```

---

## 📊 Test Coverage & Quality Metrics

### Expected Test Results

A fully compliant STAN chatbot should achieve:

| Test Category                | Target Score | Validation Criteria                   |
| ---------------------------- | ------------ | ------------------------------------- |
| **Identity Consistency**     | 100%         | Always identifies as "Stan"           |
| **Memory Recall**            | 90%+         | Remembers info after 10+ messages     |
| **Tone Adaptation**          | 90%+         | Adapts style within 2 exchanges       |
| **Hallucination Resistance** | 100%         | Zero fabricated information           |
| **Response Diversity**       | 60%+         | Unique responses to similar questions |
| **Information Accuracy**     | 100%         | No cross-user data confusion          |
| **Contradiction Handling**   | 85%+         | Graceful information updates          |
| **Memory Stability**         | 95%+         | Cross-session data persistence        |

### Coverage Requirements

```bash
# Minimum coverage thresholds
Statements: 80%
Branches: 75%
Functions: 85%
Lines: 80%
```

### Performance Benchmarks

| Metric               | Target | Measurement                     |
| -------------------- | ------ | ------------------------------- |
| **Response Time**    | <2s    | Average LLM response generation |
| **Memory Retrieval** | <500ms | Context assembly time           |
| **Database Queries** | <100ms | User/memory lookups             |
| **API Latency**      | <200ms | HTTP request processing         |

---

## 🔧 Testing Best Practices

### Test Development Guidelines

#### 1. **Behavioral Test Writing**

```javascript
// Good: Specific, measurable behavioral test
test("Should remember user preferences across 15+ message conversation", async () => {
  await sharePreference("I prefer brief responses");
  await generateFillerMessages(15);
  const response = await askQuestion("How should I communicate with you?");
  expect(response).toIndicatePreferenceRecall();
});

// Avoid: Vague or unmeasurable tests
test("Should be smart", async () => {
  const response = await sendMessage("Hello");
  expect(response).toBeTruthy(); // Too generic
});
```

#### 2. **Memory Validation**

```javascript
// Validate memory extraction and retrieval
const testMemorySystem = async () => {
  // Share specific information
  await sendMessage("My dog's name is Max and he's a Golden Retriever");

  // Verify memory extraction
  const memories = await getMemories(userId);
  expect(memories).toContainMemoryType("pet_information");

  // Test retrieval in conversation
  const response = await sendMessage("Tell me about my pet");
  expect(response).toMatch(/Max.*Golden Retriever|Golden Retriever.*Max/);
};
```

#### 3. **Error Scenario Testing**

```javascript
// Test graceful degradation
test("Should handle LLM API failures gracefully", async () => {
  // Mock API failure
  mockGroqAPI.mockRejectedValue(new Error("API Unavailable"));

  const response = await sendMessage("Hello");

  // Should use fallback response system
  expect(response).toBeTruthy();
  expect(response).toMatch(/I'm here|listening|support/);
});
```

### Continuous Integration

#### **GitHub Actions Workflow**

```yaml
name: STAN Behavioral Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Run health checks
        run: npm run test:health

      - name: Run behavioral tests
        run: npm run test:behavioral

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

---

## 🐛 Debugging & Troubleshooting

### Common Test Failures

#### **Identity Confusion**

```bash
# Symptom: Bot identifies as "Alex" or other names
# Fix: Check system prompt in llmService.js
grep -r "Alex\|GPT\|Assistant" backend/services/
```

#### **Memory Failures**

```bash
# Symptom: Information not recalled after multiple messages
# Debug: Check memory extraction and retrieval logic
node -e "
const memoryService = require('./backend/services/memoryService');
// Test memory extraction manually
"
```

#### **Hallucination Issues**

```bash
# Symptom: Bot fabricates unknown user information
# Fix: Strengthen uncertainty handling in system prompt
# Check: Anti-hallucination guidelines in buildSystemPrompt()
```

### Debug Mode

Enable verbose testing output:

```bash
DEBUG=true npm run test:manual
VERBOSE=true npm run test:behavioral
```

### Test Data Management

```bash
# Clean test database
npm run test:cleanup

# Reset test environment
npm run test:reset

# Generate test data
npm run test:seed
```

---

## 📈 Test Reporting & Analytics

### Automated Reports

The testing suite generates comprehensive reports:

#### **Behavioral Test Report**

```
📋 STAN BEHAVIORAL TEST RESULTS
================================
✅ Identity Consistency: PASSED (4/4 tests)
✅ Memory Recall: PASSED (8.5/10 accuracy)
✅ Tone Adaptation: PASSED (within 2 exchanges)
❌ Hallucination Resistance: FAILED (1 fabrication detected)
✅ Response Diversity: PASSED (72% unique responses)
✅ Information Accuracy: PASSED (perfect isolation)
✅ Contradiction Handling: PASSED (graceful updates)
✅ Memory Stability: PASSED (cross-session persistence)

Overall Score: 7/8 tests passed (87.5%)
```

#### **Performance Metrics**

```
⏱️ PERFORMANCE BENCHMARKS
==========================
Response Time: 1.2s (Target: <2s) ✅
Memory Retrieval: 245ms (Target: <500ms) ✅
Database Queries: 78ms (Target: <100ms) ✅
API Latency: 156ms (Target: <200ms) ✅
```

### Integration with Monitoring

Test results integrate with application monitoring:

- **Real-time Dashboards**: Live test status
- **Alert Systems**: Test failure notifications
- **Trend Analysis**: Quality metrics over time
- **Regression Detection**: Automatic quality degradation alerts

---

## 🎯 Quality Assurance Process

### Pre-deployment Checklist

Before any deployment, ensure:

- [ ] All 8 behavioral tests pass
- [ ] Code coverage above 80%
- [ ] Performance benchmarks met
- [ ] Security scans completed
- [ ] Manual testing verification
- [ ] User acceptance testing
- [ ] Documentation updated

### Release Testing Protocol

1. **Automated Test Suite**: Run full behavioral validation
2. **Manual Verification**: Interactive testing with edge cases
3. **Performance Testing**: Load testing and response time validation
4. **Security Testing**: Penetration testing and vulnerability scans
5. **User Acceptance**: Stakeholder validation of new features
6. **Regression Testing**: Ensure existing functionality intact

This comprehensive testing infrastructure ensures STAN maintains the highest quality standards while continuously validating its behavioral requirements and user experience excellence.

---

## 📊 Monitoring & Analytics

### Logging Configuration

Winston-based logging with multiple levels:

```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console(),
  ],
});
```

### Health Monitoring

- **Health Check Endpoint**: `/api/health`
- **Database Connection**: MongoDB connectivity
- **Memory Usage**: Node.js process metrics
- **Response Times**: API performance tracking
- **Error Rates**: Exception monitoring

### Analytics Metrics

- **User Engagement**: Session duration, message count
- **Emotional Journey**: Mood progression tracking
- **Memory Effectiveness**: Retrieval success rates
- **LLM Performance**: Response quality and speed
- **Onboarding Success**: Completion rates

---

## 🔒 Security & Privacy

### Data Protection

- **User Anonymization**: No personally identifiable information stored
- **Conversation Encryption**: Sensitive data protection
- **Memory Sandboxing**: User-specific data isolation
- **Session Security**: JWT-based authentication

### Security Measures

- **Rate Limiting**: API abuse prevention
- **Input Validation**: XSS and injection protection
- **CORS Configuration**: Cross-origin request control
- **Helmet.js**: Security headers
- **Environment Variables**: Sensitive configuration protection

### Privacy Features

- **Data Retention**: Configurable conversation expiry
- **User Deletion**: Complete data removal capability
- **Anonymous Sessions**: No tracking without consent
- **Opt-out Mechanisms**: User control over data usage

---

## 🚀 Performance Optimization

### Backend Optimizations

- **Database Indexing**: Optimized queries for user lookup and memory retrieval
- **Connection Pooling**: MongoDB connection efficiency
- **Response Compression**: Gzip compression for API responses
- **Caching Strategy**: Memory and conversation caching
- **Keep-Alive Service**: Server sleep prevention

### Frontend Optimizations

- **Code Splitting**: Dynamic component loading
- **Memory Management**: Efficient state updates
- **Image Optimization**: Compressed assets
- **Bundle Analysis**: Webpack bundle optimization
- **Service Workers**: Offline capability and caching

### Scalability Considerations

- **Horizontal Scaling**: Multi-instance support
- **Load Balancing**: Traffic distribution
- **Database Sharding**: User data partitioning
- **CDN Integration**: Global content delivery
- **Microservices**: Service decomposition strategy

---

## 🛠️ Development Guidelines

### Code Standards

- **ESLint Configuration**: Consistent code formatting
- **Prettier Integration**: Automated code styling
- **Git Hooks**: Pre-commit validation
- **TypeScript Migration**: Gradual type safety implementation

### Development Workflow

1. **Feature Branching**: Git-flow methodology
2. **Pull Request Reviews**: Code quality assurance
3. **Automated Testing**: CI/CD pipeline integration
4. **Staging Environment**: Pre-production testing
5. **Blue-Green Deployment**: Zero-downtime releases

### Environment Setup

```bash
# Backend Development
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev

# Frontend Development
cd frontend
npm install
npm start

# Full Stack Development
docker-compose up -d
```

---

## 🎯 Future Enhancements

### Planned Features

1. **Voice Integration**: Speech-to-text and text-to-speech
2. **Multi-language Support**: Internationalization
3. **Mobile Applications**: React Native implementation
4. **Advanced Analytics**: ML-powered insights
5. **Integration APIs**: Third-party service connections
6. **Therapy Modules**: Specialized conversation modes
7. **Group Conversations**: Multi-user chat support
8. **AI Model Training**: Custom model fine-tuning

### Technical Improvements

1. **Real-time Communication**: WebSocket implementation
2. **Microservices Architecture**: Service decomposition
3. **Event Sourcing**: Comprehensive audit trails
4. **Advanced Caching**: Redis integration
5. **Message Queuing**: Asynchronous processing
6. **Container Orchestration**: Kubernetes deployment
7. **API Gateway**: Centralized routing and security
8. **Observability Stack**: Comprehensive monitoring

---

## 📞 Support & Maintenance

### Issue Reporting

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive setup guides
- **Community Support**: Developer discussions
- **Professional Support**: Enterprise assistance

### Maintenance Schedule

- **Regular Updates**: Security patches and dependency updates
- **Performance Reviews**: Monthly optimization assessments
- **Backup Procedures**: Daily database backups
- **Disaster Recovery**: Business continuity planning

### Contact Information

- **Repository**: [GitHub](https://github.com/Dhanush2002-28/Stan-Task)
- **Issues**: [GitHub Issues](https://github.com/Dhanush2002-28/Stan-Task/issues)
- **Documentation**: [Technical Docs](./README.md)

---

## 📄 License & Attribution

This project is licensed under the MIT License. See the LICENSE file for details.

### Third-Party Services

- **Groq API**: Primary LLM provider
- **HuggingFace**: Fallback LLM provider
- **MongoDB Atlas**: Database hosting
- **Vercel**: Frontend hosting
- **Render**: Backend hosting

### Acknowledgments

- React community for excellent documentation
- Express.js team for robust backend framework
- MongoDB team for flexible database solution
- Open source contributors for various dependencies

---

_Last Updated: August 3, 2025_
_Version: 1.0.0_
_Maintained by: STAN Development Team_
