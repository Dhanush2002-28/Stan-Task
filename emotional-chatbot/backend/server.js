const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Import routes
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');
const memoryRoutes = require('./routes/memory');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Initialize Express app
const app = express();

// Trust proxy for rate limiting (fixes the X-Forwarded-For warning)
if (process.env.NODE_ENV === 'development') {
    app.set('trust proxy', 1);
}

// Configure Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting - more permissive for development
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // 1000 for dev, 100 for prod
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for localhost in development
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        }
        return false;
    }
});
app.use(limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/memory', memoryRoutes);

// Health check endpoint (under /api for consistency)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Root health check endpoint (for quick access)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emotional-chatbot', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                mongoose.connection.close();
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received. Shutting down gracefully...');
            server.close(() => {
                mongoose.connection.close();
                process.exit(0);
            });
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
