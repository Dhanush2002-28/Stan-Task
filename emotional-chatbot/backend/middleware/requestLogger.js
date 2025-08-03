const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.info(`${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.method === 'POST' || req.method === 'PUT' ?
            sanitizeBody(req.body) : undefined
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';

        logger.log(logLevel, `${req.method} ${req.originalUrl} - ${res.statusCode}`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${duration}ms`,
            ip: req.ip
        });
    });

    next();
};

// Sanitize request body to remove sensitive information
const sanitizeBody = (body) => {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];

    Object.keys(sanitized).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
    });

    return sanitized;
};

module.exports = requestLogger;
