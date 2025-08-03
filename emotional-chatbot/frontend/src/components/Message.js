import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

const Message = ({ message, isLast }) => {
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    const handleFeedback = async (feedback) => {
        // Here you would send feedback to the backend
        try {
            // await sendFeedback(message.id, feedback);
            setFeedbackGiven(true);
            setShowFeedback(false);
        } catch (error) {
            console.error('Failed to send feedback:', error);
        }
    };

    const getEmotionalToneColor = (tone) => {
        const toneColors = {
            supportive: '#22c55e',
            empathetic: '#6366f1',
            encouraging: '#f59e0b',
            gentle: '#ec4899',
            analytical: '#06b6d4',
            playful: '#8b5cf6',
            serious: '#ef4444'
        };
        return toneColors[tone] || '#6b7280';
    };

    const getEmotionalToneIcon = (tone) => {
        switch (tone) {
            case 'supportive':
            case 'empathetic':
                return <Heart size={12} />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            className={`message ${isUser ? 'message-user' : 'message-assistant'}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 1
            }}
            layout
        >
            <motion.div
                className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
                onMouseEnter={() => isAssistant && !feedbackGiven && setShowFeedback(true)}
                onMouseLeave={() => setShowFeedback(false)}
            >
                {/* Message Content */}
                <div style={{ position: 'relative' }}>
                    {isAssistant ? (
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                                strong: ({ children }) => <strong style={{ color: '#fbbf24' }}>{children}</strong>,
                                em: ({ children }) => <em style={{ color: '#a78bfa' }}>{children}</em>,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    ) : (
                        <p style={{ margin: 0 }}>{message.content}</p>
                    )}
                </div>

                {/* Message Metadata */}
                <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    opacity: 0.6
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {message.timestamp && (
                            <span>
                                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                        )}

                        {/* Emotional Tone Indicator */}
                        {isAssistant && message.metadata?.emotionalTone && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    color: getEmotionalToneColor(message.metadata.emotionalTone),
                                    fontSize: '0.65rem'
                                }}
                            >
                                {getEmotionalToneIcon(message.metadata.emotionalTone)}
                                <span>{message.metadata.emotionalTone}</span>
                            </div>
                        )}
                    </div>

                    {/* Processing Time for Assistant Messages */}
                    {isAssistant && message.metadata?.processingTime && (
                        <span style={{ fontSize: '0.6rem' }}>
                            {message.metadata.processingTime}ms
                        </span>
                    )}
                </div>

                {/* User Sentiment Indicator */}
                {isUser && message.metadata?.userSentiment && (
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '12px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: message.metadata.userSentiment.score > 0 ? '#22c55e' :
                                message.metadata.userSentiment.score < 0 ? '#ef4444' : '#6b7280',
                            border: '2px solid white',
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 }}
                        title={`Detected emotion: ${message.metadata.userSentiment.emotion}`}
                    />
                )}

                {/* Feedback Options */}
                {isAssistant && showFeedback && !feedbackGiven && (
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '-40px',
                            right: '0',
                            background: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: '20px',
                            padding: '8px 12px',
                            display: 'flex',
                            gap: '8px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            zIndex: 10
                        }}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    >
                        <motion.button
                            onClick={() => handleFeedback('helpful')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#22c55e',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Helpful"
                        >
                            <ThumbsUp size={14} />
                        </motion.button>

                        <motion.button
                            onClick={() => handleFeedback('not_helpful')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Not helpful"
                        >
                            <ThumbsDown size={14} />
                        </motion.button>

                        <motion.button
                            onClick={() => handleFeedback('inappropriate')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Inappropriate"
                        >
                            <AlertTriangle size={14} />
                        </motion.button>
                    </motion.div>
                )}

                {/* Feedback Given Indicator */}
                {feedbackGiven && (
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            color: 'white'
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                    >
                        ✓
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Message;
