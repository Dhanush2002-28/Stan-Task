const https = require('https');

class KeepAliveService {
    constructor(url, interval = 14 * 60 * 1000) { // 14 minutes
        this.url = url;
        this.interval = interval;
        this.intervalId = null;
    }

    start() {
        if (process.env.NODE_ENV === 'production' && this.url) {
            console.log('Starting keep-alive service...');
            this.intervalId = setInterval(() => {
                this.ping();
            }, this.interval);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Keep-alive service stopped');
        }
    }

    ping() {
        const url = new URL(this.url);
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: '/api/health',
            method: 'GET',
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            console.log(`Keep-alive ping: ${res.statusCode}`);
        });

        req.on('error', (err) => {
            console.error('Keep-alive ping failed:', err.message);
        });

        req.on('timeout', () => {
            console.error('Keep-alive ping timeout');
            req.destroy();
        });

        req.end();
    }
}

module.exports = KeepAliveService;
