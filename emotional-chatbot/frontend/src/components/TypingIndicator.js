import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
    return (
        <motion.div
            className="message message-assistant"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="typing-indicator">
                <motion.div
                    className="typing-dot"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2
                    }}
                />
                <motion.div
                    className="typing-dot"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.4
                    }}
                />
                <motion.div
                    className="typing-dot"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.6
                    }}
                />
            </div>
        </motion.div>
    );
};

export default TypingIndicator;
