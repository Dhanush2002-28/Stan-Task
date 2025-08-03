import React from 'react';
import { motion } from 'framer-motion';

const EmotionalStatus = ({ status, emotion }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'connected':
                return '#22c55e';
            case 'thinking':
                return '#f59e0b';
            case 'connecting':
                return '#6366f1';
            case 'error':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'connected':
                return 'Ready to listen';
            case 'thinking':
                return 'Thinking...';
            case 'connecting':
                return 'Connecting...';
            case 'error':
                return 'Connection issue';
            default:
                return 'Offline';
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.8)'
        }}>
            <motion.div
                className="status-indicator"
                style={{
                    background: getStatusColor(status),
                }}
                animate={{
                    scale: status === 'thinking' ? [1, 1.2, 1] : 1,
                    opacity: status === 'connected' ? [1, 0.7, 1] : 1,
                }}
                transition={{
                    duration: status === 'thinking' ? 1 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <span>{getStatusText(status)}</span>
            {emotion && (
                <span style={{
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    marginLeft: '4px'
                }}>
                    • {emotion}
                </span>
            )}
        </div>
    );
};

export default EmotionalStatus;
