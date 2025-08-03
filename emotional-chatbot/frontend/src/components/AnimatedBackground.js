import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
    const shapes = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        size: Math.random() * 100 + 50,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 20,
        delay: Math.random() * 5,
    }));

    return (
        <div className="animated-background">
            {/* Gradient Background */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
            radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(130, 200, 255, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #667eea 0%, #764ba2 100%)
          `,
                    filter: 'blur(0.5px)',
                }}
            />

            {/* Floating Shapes */}
            <div className="floating-shapes">
                {shapes.map((shape) => (
                    <motion.div
                        key={shape.id}
                        className="shape"
                        style={{
                            width: shape.size,
                            height: shape.size,
                            left: `${shape.x}%`,
                            top: `${shape.y}%`,
                        }}
                        animate={{
                            y: [-20, 20, -20],
                            x: [-10, 10, -10],
                            rotate: [0, 180, 360],
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: shape.duration,
                            delay: shape.delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Particle Effect */}
            <div className="particles">
                {Array.from({ length: 30 }, (_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        style={{
                            position: 'absolute',
                            width: '2px',
                            height: '2px',
                            background: 'rgba(255, 255, 255, 0.6)',
                            borderRadius: '50%',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Ambient Light Effect */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '10%',
                    left: '20%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                style={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '15%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(120, 119, 198, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                }}
                animate={{
                    scale: [1, 0.8, 1],
                    opacity: [0.2, 0.5, 0.2],
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
            />
        </div>
    );
};

export default AnimatedBackground;
