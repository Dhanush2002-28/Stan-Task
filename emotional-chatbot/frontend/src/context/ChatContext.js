import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
    messages: [],
    isLoading: false,
    userProfile: null,
    connectionStatus: 'connecting', // connecting, connected, error, thinking
    sessionId: null,
    userId: null,
    error: null,
    isNewUser: false,
    onboardingComplete: false,
};

// Action types
const ActionTypes = {
    SET_LOADING: 'SET_LOADING',
    ADD_MESSAGE: 'ADD_MESSAGE',
    SET_MESSAGES: 'SET_MESSAGES',
    SET_USER_PROFILE: 'SET_USER_PROFILE',
    SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
    SET_SESSION_ID: 'SET_SESSION_ID',
    SET_USER_ID: 'SET_USER_ID',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    UPDATE_MESSAGE: 'UPDATE_MESSAGE',
    SET_NEW_USER: 'SET_NEW_USER',
    SET_ONBOARDING_COMPLETE: 'SET_ONBOARDING_COMPLETE',
};

// Reducer
const chatReducer = (state, action) => {
    switch (action.type) {
        case ActionTypes.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
                connectionStatus: action.payload ? 'thinking' : state.connectionStatus,
            };

        case ActionTypes.ADD_MESSAGE:
            return {
                ...state,
                messages: [...state.messages, action.payload],
            };

        case ActionTypes.SET_MESSAGES:
            return {
                ...state,
                messages: action.payload,
            };

        case ActionTypes.UPDATE_MESSAGE:
            return {
                ...state,
                messages: state.messages.map(msg =>
                    msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
                ),
            };

        case ActionTypes.SET_USER_PROFILE:
            return {
                ...state,
                userProfile: action.payload,
            };

        case ActionTypes.SET_CONNECTION_STATUS:
            return {
                ...state,
                connectionStatus: action.payload,
            };

        case ActionTypes.SET_SESSION_ID:
            return {
                ...state,
                sessionId: action.payload,
            };

        case ActionTypes.SET_USER_ID:
            return {
                ...state,
                userId: action.payload,
            };

        case ActionTypes.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                connectionStatus: 'error',
            };

        case ActionTypes.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };

        case ActionTypes.SET_NEW_USER:
            return {
                ...state,
                isNewUser: action.payload,
            };

        case ActionTypes.SET_ONBOARDING_COMPLETE:
            return {
                ...state,
                onboardingComplete: action.payload,
            };

        default:
            return state;
    }
};

// Create context
const ChatContext = createContext();

// Provider component
export const ChatProvider = ({ children }) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);

    const initializeSession = useCallback(async () => {
        try {
            // Always generate a new temporary user ID for session
            const userId = uuidv4();
            dispatch({ type: ActionTypes.SET_USER_ID, payload: userId });

            // Create session
            const sessionId = uuidv4();
            dispatch({ type: ActionTypes.SET_SESSION_ID, payload: sessionId });

            // Initial health check
            await apiService.checkHealth();
            dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'connected' });

            // Always start with onboarding - let the 3 questions determine if returning user
            dispatch({ type: ActionTypes.SET_NEW_USER, payload: true });
            dispatch({ type: ActionTypes.SET_ONBOARDING_COMPLETE, payload: false });
            await startOnboarding();

        } catch (error) {
            console.error('Failed to initialize session:', error);
            dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to connect to server' });
        }
    }, []);

    // Initialize user session
    useEffect(() => {
        initializeSession();
    }, [initializeSession]);

    // Check connection status periodically
    useEffect(() => {
        const checkConnection = async () => {
            try {
                await apiService.checkHealth();
                if (state.connectionStatus !== 'thinking' && state.connectionStatus !== 'connected') {
                    dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'connected' });
                }
            } catch (error) {
                dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'error' });
            }
        };

        const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
        checkConnection(); // Initial check

        return () => clearInterval(interval);
    }, [state.connectionStatus]);

    const loadConversationHistory = async (userId) => {
        try {
            const history = await apiService.getConversationHistory(userId);
            if (history && history.messages && history.messages.length > 0) {
                const formattedMessages = history.messages.map(msg => ({
                    id: msg.id || uuidv4(),
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp,
                    metadata: msg.metadata,
                }));
                dispatch({ type: ActionTypes.SET_MESSAGES, payload: formattedMessages });
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
            // Don't show error for history loading - user can start fresh
        }
    };

    const startOnboarding = async () => {
        const welcomeMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: "Hello! I'm here to chat, listen, and get to know you better. I'd love to learn a bit about you so I can provide more personalized conversations. What's your name?",
            timestamp: new Date().toISOString(),
            metadata: { isOnboarding: true, step: 1 },
        };

        dispatch({ type: ActionTypes.ADD_MESSAGE, payload: welcomeMessage });
    };

    const sendMessage = async (content) => {
        if (!content.trim() || state.isLoading) return;

        const { userId, sessionId, isNewUser, onboardingComplete } = state;
        if (!userId || !sessionId) {
            toast.error('Session not initialized. Please refresh the page.');
            return;
        }

        // Add user message immediately
        const userMessage = {
            id: uuidv4(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date().toISOString(),
        };

        dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });

        try {
            // Send message to API with onboarding context
            const response = await apiService.sendMessage({
                message: content,
                userId,
                sessionId,
                isNewUser,
                onboardingComplete,
                currentMessages: state.messages,
            });

            // Add assistant response
            const assistantMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: response.message,
                timestamp: new Date().toISOString(),
                metadata: response.metadata,
            };

            dispatch({ type: ActionTypes.ADD_MESSAGE, payload: assistantMessage });

            // Update user profile if provided
            if (response.userProfile) {
                dispatch({ type: ActionTypes.SET_USER_PROFILE, payload: response.userProfile });
            }

            // Check if onboarding is complete
            if (response.onboardingComplete && !onboardingComplete) {
                dispatch({ type: ActionTypes.SET_ONBOARDING_COMPLETE, payload: true });
                toast.success('Great! Now I know you better. Let\'s chat!');
            }

            // Check if this is a returning user detection
            if (response.metadata && response.metadata.isReturningUser) {
                // Update context for returning user
                dispatch({ type: ActionTypes.SET_NEW_USER, payload: false });
                dispatch({ type: ActionTypes.SET_ONBOARDING_COMPLETE, payload: true });

                // Update to use the actual user ID for returning users
                const actualUserId = response.metadata.actualUserId || state.userId;
                dispatch({ type: ActionTypes.SET_USER_ID, payload: actualUserId });

                // Store the actual user ID in localStorage for future sessions
                localStorage.setItem('chatbot_user_id', actualUserId);

                // Load conversation history for returning user
                await loadConversationHistory(actualUserId);

                toast.success('Welcome back! I remember you now.');
            }

            dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'connected' });
        } catch (error) {
            console.error('Failed to send message:', error);

            // Check if this might be a cold start (server sleeping)
            const isColdStart = error.message.includes('timeout') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('500');

            // Add appropriate error message
            const errorMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: isColdStart
                    ? "I'm just waking up! The server was sleeping, but I'm ready now. Please try sending your message again."
                    : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. Your feelings and thoughts are important to me, and I want to make sure I can give you the attention you deserve.",
                timestamp: new Date().toISOString(),
                metadata: { isError: true, isColdStart },
            };

            dispatch({ type: ActionTypes.ADD_MESSAGE, payload: errorMessage });
            dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });

            if (isColdStart) {
                toast.error('Server was sleeping. Please try again!');
            } else {
                toast.error('Failed to send message. Please try again.');
            }
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
    };

    const sendFeedback = async (messageId, feedback, emotionalResponse) => {
        try {
            await apiService.sendFeedback({
                userId: state.userId,
                sessionId: state.sessionId,
                messageId,
                feedback,
                emotionalResponse,
            });

            // Update the message to show feedback was given
            dispatch({
                type: ActionTypes.UPDATE_MESSAGE,
                payload: {
                    id: messageId,
                    updates: {
                        reactions: {
                            userFeedback: feedback,
                            emotionalResponse: emotionalResponse || '',
                        },
                    },
                },
            });

            toast.success('Thank you for your feedback!');
        } catch (error) {
            console.error('Failed to send feedback:', error);
            toast.error('Failed to send feedback. Please try again.');
        }
    };

    const clearChat = () => {
        dispatch({ type: ActionTypes.SET_MESSAGES, payload: [] });

        // Generate new session ID
        const newSessionId = uuidv4();
        dispatch({ type: ActionTypes.SET_SESSION_ID, payload: newSessionId });

        toast.success('Chat cleared. Starting fresh!');
    };

    const updateUserProfile = async (profileUpdates) => {
        try {
            const updatedProfile = await apiService.updateUserProfile(state.userId, profileUpdates);
            dispatch({ type: ActionTypes.SET_USER_PROFILE, payload: updatedProfile });
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile. Please try again.');
        }
    };

    const identifyReturningUser = async (name, personalNumber, birthMonth) => {
        try {
            const result = await apiService.identifyUser({
                name,
                personalNumber: parseInt(personalNumber),
                birthMonth
            });

            if (result.success) {
                // User found! Update context with their info
                const { userId, userProfile } = result.data;

                // Store the userId for this session
                localStorage.setItem('chatbot_user_id', userId);

                dispatch({ type: ActionTypes.SET_USER_ID, payload: userId });
                dispatch({ type: ActionTypes.SET_USER_PROFILE, payload: userProfile });
                dispatch({ type: ActionTypes.SET_NEW_USER, payload: false });
                dispatch({ type: ActionTypes.SET_ONBOARDING_COMPLETE, payload: true });

                // Load their conversation history
                await loadConversationHistory(userId);

                // Add welcome back message
                const welcomeBackMessage = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: result.data.message,
                    timestamp: new Date().toISOString(),
                    metadata: { isWelcomeBack: true },
                };

                dispatch({ type: ActionTypes.ADD_MESSAGE, payload: welcomeBackMessage });
                toast.success('Welcome back! I remember you now.');

                return { success: true };
            } else {
                toast.error(result.message);
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Failed to identify user:', error);
            toast.error('Failed to identify user. Please try again.');
            return { success: false, message: error.message };
        }
    };

    const contextValue = {
        // State
        messages: state.messages,
        isLoading: state.isLoading,
        userProfile: state.userProfile,
        connectionStatus: state.connectionStatus,
        sessionId: state.sessionId,
        userId: state.userId,
        error: state.error,
        isNewUser: state.isNewUser,
        onboardingComplete: state.onboardingComplete,

        // Actions
        sendMessage,
        sendFeedback,
        clearChat,
        updateUserProfile,
        identifyReturningUser,
        clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
        // Utility function to reset session (for testing)
        resetSession: () => {
            localStorage.removeItem('chatbot_user_id');
            window.location.reload();
        },
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};

// Custom hook to use chat context
export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

export default ChatContext;
