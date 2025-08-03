import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ChatInterface from './components/ChatInterface';
import AnimatedBackground from './components/AnimatedBackground';
import { ChatProvider } from './context/ChatContext';
import './App.css';

function App() {
    return (
        <ChatProvider>
            <div className="App">
                <AnimatedBackground />
                <Router>
                    <Routes>
                        <Route path="/" element={<ChatInterface />} />
                    </Routes>
                </Router>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '15px',
                        },
                    }}
                />
            </div>
        </ChatProvider>
    );
}

export default App;
