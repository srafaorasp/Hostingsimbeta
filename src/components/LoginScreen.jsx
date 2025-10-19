import React, { useState, useEffect } from 'react';

const LoginScreen = ({ onLogin }) => { // Changed from onLoginSuccess to onLogin
    const [savedGames, setSavedGames] = useState([]);
    const [scanComplete, setScanComplete] = useState(false);

    useEffect(() => {
        // Simulate a security scan on boot
        const timer = setTimeout(() => {
            const saves = Object.keys(localStorage)
                .filter(key => key.startsWith('datacenter_save_'))
                .map(key => key.replace('datacenter_save_', ''));
            setSavedGames(saves);
            setScanComplete(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="font-mono h-screen w-screen bg-gray-900 text-green-400 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md border-2 border-green-400/50 p-6 shadow-2xl shadow-green-400/10 bg-black/20 backdrop-blur-sm">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold">DataCenter OS</h1>
                    <p className="text-sm text-green-400/70">Secure Boot Loader v4.1.13</p>
                </div>

                {!scanComplete ? (
                    <div className="text-center animate-pulse">
                        <p>Initializing Quantum Encryption...</p>
                        <p>Scanning for Biometric Signature...</p>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={() => onLogin(null)} // Changed from onLoginSuccess
                            className="w-full bg-green-400 text-gray-900 font-bold py-3 px-4 rounded hover:bg-green-300 transition-colors duration-200"
                        >
                            Start New Session
                        </button>

                        <div className="mt-6">
                            <h2 className="text-lg border-b border-green-400/30 pb-1 mb-2">Load Existing Session:</h2>
                            {savedGames.length > 0 ? (
                                <ul className="space-y-2">
                                    {savedGames.map(slot => (
                                        <li key={slot}>
                                            <button
                                                onClick={() => onLogin(slot)} // Changed from onLoginSuccess
                                                className="w-full text-left bg-gray-800/50 p-2 rounded hover:bg-green-400/20"
                                            >
                                                {slot}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">No saved sessions found.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;

