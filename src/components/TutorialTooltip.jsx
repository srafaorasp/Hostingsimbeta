import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TutorialTooltip = ({ step, onComplete }) => {
    const [position, setPosition] = useState({ top: '50%', left: '50%' });

    useEffect(() => {
        if (step && step.target) {
            const targetElement = document.getElementById(step.target);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                setPosition({
                    top: rect.top + rect.height / 2,
                    left: rect.left + rect.width + 10, // Position to the right of the element
                });
                targetElement.classList.add('tutorial-highlight');
                return () => targetElement.classList.remove('tutorial-highlight');
            }
        }
        // Default to center if no target
        setPosition({ top: '30%', left: '50%' });
    }, [step]);

    if (!step) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 bg-blue-900 border-2 border-blue-500 text-white p-4 rounded-lg shadow-2xl shadow-blue-500/50 z-[9999] max-w-sm"
            style={{ top: position.top, left: position.left }}
        >
            <h3 className="font-bold text-lg mb-2 text-blue-300">Tutorial</h3>
            <p className="text-sm mb-4">{step.text}</p>
            {step.isEnd && (
                 <button onClick={onComplete} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">
                    End Tutorial
                </button>
            )}
        </motion.div>
    );
};

export default TutorialTooltip;
