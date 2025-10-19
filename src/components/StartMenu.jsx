import React from 'react';
import useGameStore from '../store/gameStore';
import { APPS_CONFIG } from '../data'; // Corrected import
import { motion } from 'framer-motion';

const StartMenu = ({ closeMenu }) => {
    const { openWindow } = useGameStore();

    const handleAppClick = (appId) => {
        openWindow(appId);
        closeMenu();
    };

    return (
        <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-12 left-2 w-72 bg-gray-800 bg-opacity-95 backdrop-blur-md rounded-lg shadow-lg text-white p-2 z-50"
        >
            <div className="grid grid-cols-4 gap-2">
                {Object.values(APPS_CONFIG).map((app) => {
                    const Icon = app.icon;
                    return (
                        <button
                            key={app.title}
                            onClick={() => handleAppClick(app.title)}
                            className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-gray-700 transition-colors duration-150"
                            title={app.title}
                        >
                            <Icon className="w-8 h-8 mb-1" />
                            <span className="text-xs text-center">{app.title}</span>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default StartMenu;

