import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';

const UserIdentification = ({ onClose }) => {
    const [name, setName] = useState('');
    const [personalNumber, setPersonalNumber] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { identifyReturningUser } = useChat();

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || personalNumber === '' || !birthMonth) {
            alert('Please fill in all fields');
            return;
        }

        if (personalNumber < 0 || personalNumber > 999) {
            alert('Number must be between 0 and 999');
            return;
        }

        setIsLoading(true);

        const result = await identifyReturningUser(name, personalNumber, birthMonth);

        setIsLoading(false);

        if (result.success) {
            onClose(); // Close the identification modal
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-purple-100 transform transition-all duration-300 hover:scale-105">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                        Welcome Back!
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        Help me recognize you by providing the information you shared during onboarding:
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                            placeholder="Enter your name"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Special Number (0-999)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="999"
                            value={personalNumber}
                            onChange={(e) => setPersonalNumber(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                            placeholder="Enter your number"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Birth Month
                        </label>
                        <div className="relative">
                            <select
                                value={birthMonth}
                                onChange={(e) => setBirthMonth(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer"
                                disabled={isLoading}
                            >
                                <option value="" className="text-gray-500">Select your birth month</option>
                                {months.map(month => (
                                    <option key={month} value={month} className="text-gray-800">{month}</option>
                                ))}
                            </select>
                            {/* Custom dropdown arrow */}
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4 mt-8">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 font-semibold shadow-lg"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Identifying...</span>
                                </div>
                            ) : (
                                'Identify Me'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 font-semibold border-2 border-gray-200"
                        >
                            Start Fresh
                        </button>
                    </div>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700 text-center font-medium">
                        💡 Don't remember your details? Click "Start Fresh" to begin a new conversation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserIdentification;
