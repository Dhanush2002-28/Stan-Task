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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Welcome Back!
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    Help me recognize you by providing the information you shared during onboarding:
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your name"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Special Number (0-999)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="999"
                            value={personalNumber}
                            onChange={(e) => setPersonalNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your number"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Birth Month
                        </label>
                        <select
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        >
                            <option value="">Select your birth month</option>
                            {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Identifying...' : 'Identify Me'}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Fresh
                        </button>
                    </div>
                </form>

                <p className="text-xs text-gray-500 mt-4 text-center">
                    Don't remember your details? Click "Start Fresh" to begin a new conversation.
                </p>
            </div>
        </div>
    );
};

export default UserIdentification;
