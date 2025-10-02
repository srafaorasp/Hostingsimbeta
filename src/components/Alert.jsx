import React from 'react';

const AlertContainer = ({ alerts, onDismiss }) => {
    if (alerts.length === 0) return null;

    return (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[2000]">
            {alerts.map(alert => (
                <div key={alert.id} className="bg-red-900 border-2 border-red-500 text-white p-6 rounded-lg shadow-2xl shadow-red-500/50 text-center w-full max-w-md">
                    <h2 className="text-3xl font-bold text-red-400 mb-2">{alert.title}</h2>
                    <p className="text-lg mb-6">{alert.message}</p>
                    <button
                        onClick={() => onDismiss(alert.id)}
                        className="bg-red-600 text-white font-bold py-2 px-8 rounded-md hover:bg-red-500 transition-colors"
                    >
                        Acknowledge
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AlertContainer;
