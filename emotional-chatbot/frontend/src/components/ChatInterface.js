import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, Brain, Sparkles, MessageCircle, User } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import EmotionalStatus from './EmotionalStatus';
import UserIdentification from './UserIdentification';
import toast from 'react-hot-toast';

const ChatInterface = () => {
    const [message, setMessage] = useState('');
    const [showWelcome, setShowWelcome] = useState(false); // Default to false
    const [showUserIdentification, setShowUserIdentification] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const {
        messages,
        isLoading,
        sendMessage,
        userProfile,
        connectionStatus,
        isNewUser,
        onboardingComplete,
    } = useChat();

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Show welcome screen only for returning users with no active conversation
    useEffect(() => {
        // Show welcome if:
        // 1. Not a new user (returning user)
        // 2. Onboarding is complete 
        // 3. No messages yet
        if (!isNewUser && onboardingComplete && messages.length === 0) {
            setShowWelcome(true);
        } else {
            setShowWelcome(false);
        }
    }, [isNewUser, onboardingComplete, messages.length]);

    // Show identification modal for new users after they see the welcome message
    useEffect(() => {
        if (isNewUser && messages.length === 1 && !onboardingComplete) {
            // Give user a chance to see if they're returning
            const timer = setTimeout(() => {
                setShowUserIdentification(true);
            }, 3000); // 3 seconds after first message

            return () => clearTimeout(timer);
        }
    }, [isNewUser, messages, onboardingComplete]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');

        try {
            await sendMessage(userMessage);
        } catch (error) {
            toast.error('Failed to send message. Please try again.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const startConversation = (prompt) => {
        setMessage(prompt);
        setShowWelcome(false);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const welcomePrompts = [
        "I've been feeling overwhelmed lately and could use someone to talk to",
        "I want to share something exciting that happened today",
        "I'm struggling with a decision and need some perspective",
        "I just need someone to listen without judgment",
    ];

    return (
        <div className="chat-container">
            {/* Header */}
            <motion.div
                className="chat-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '10px' }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <Brain size={32} color="white" />
                    </motion.div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                        Alex
                    </h1>
                    <EmotionalStatus status={connectionStatus} />
                </div>
                <p style={{ fontSize: '1rem', opacity: 0.8, margin: 0 }}>
                    Your emotionally intelligent companion
                </p>
            </motion.div>

            {/* Welcome Screen */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        className="welcome-screen"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            maxWidth: '600px',
                            zIndex: 10
                        }}
                    >
                        <motion.div
                            className="glass"
                            style={{ padding: '40px 30px', textAlign: 'center' }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                style={{ marginBottom: '20px' }}
                            >
                                <Heart size={48} color="#ff6b9d" />
                            </motion.div>

                            <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: 'white' }}>
                                Hello! I'm Alex 👋
                            </h2>

                            <p style={{
                                fontSize: '1rem',
                                marginBottom: '30px',
                                opacity: 0.9,
                                lineHeight: '1.6',
                                color: 'white'
                            }}>
                                I'm here to listen, understand, and support you through whatever you're feeling.
                                Our conversations are safe, judgment-free, and deeply personal.
                            </p>

                            <div style={{
                                display: 'grid',
                                gap: '12px',
                                marginBottom: '30px'
                            }}>
                                {welcomePrompts.map((prompt, index) => (
                                    <motion.button
                                        key={index}
                                        className="btn-secondary"
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            fontSize: '0.9rem',
                                            borderRadius: '15px'
                                        }}
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => startConversation(prompt)}
                                    >
                                        <MessageCircle size={16} style={{ marginRight: '8px', display: 'inline' }} />
                                        {prompt}
                                    </motion.button>
                                ))}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '20px',
                                opacity: 0.7,
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Brain size={16} />
                                    <span>Remembers our conversations</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles size={16} />
                                    <span>Adapts to your emotions</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages Container */}
            <motion.div
                className="chat-messages glass"
                initial={{ opacity: 0 }}
                animate={{ opacity: showWelcome ? 0.3 : 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    filter: showWelcome ? 'blur(2px)' : 'none',
                    pointerEvents: showWelcome ? 'none' : 'auto'
                }}
            >
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <Message
                            key={msg.id || index}
                            message={msg}
                            isLast={index === messages.length - 1}
                        />
                    ))}
                </AnimatePresence>

                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </motion.div>

            {/* Input Container */}
            <motion.form
                className="chat-input-container"
                onSubmit={handleSendMessage}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                    opacity: showWelcome ? 0.3 : 1,
                    y: 0,
                    filter: showWelcome ? 'blur(1px)' : 'none'
                }}
                transition={{ duration: 0.3 }}
                style={{
                    pointerEvents: showWelcome ? 'none' : 'auto'
                }}
            >
                <motion.textarea
                    ref={inputRef}
                    className="chat-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                        connectionStatus === 'connected'
                            ? "Share what's on your mind..."
                            : "Connecting..."
                    }
                    disabled={isLoading || connectionStatus !== 'connected' || showWelcome}
                    rows={1}
                    style={{
                        resize: 'none',
                        overflow: 'hidden',
                        minHeight: '50px',
                        maxHeight: '120px'
                    }}
                    whileFocus={{
                        boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
                    }}
                />

                <motion.button
                    type="submit"
                    className="send-button"
                    disabled={!message.trim() || isLoading || connectionStatus !== 'connected'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isLoading ? { rotate: 360 } : {}}
                    transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                >
                    <Send size={20} />
                </motion.button>
            </motion.form>

            {/* Returning User Button - Show for new users */}
            {isNewUser && !onboardingComplete && messages.length > 0 && (
                <motion.button
                    onClick={() => setShowUserIdentification(true)}
                    className="returning-user-button"
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                    whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.15)' }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 4 }}
                >
                    <User size={14} />
                    Returning User?
                </motion.button>
            )}

            {/* User Identification Modal */}
            {showUserIdentification && (
                <UserIdentification
                    onClose={() => setShowUserIdentification(false)}
                />
            )}

            {/* User Profile Info (subtle) */}
            {userProfile && (
                <motion.div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        zIndex: 1000
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 }}
                >
                    Trust Level: {Math.round(userProfile.relationships?.trustLevel || 5)}/10
                </motion.div>
            )}
        </div>
    );
};

export default ChatInterface;
