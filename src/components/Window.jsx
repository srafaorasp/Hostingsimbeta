import React, { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import useGameStore from '/src/store/gameStore.js';

const Window = ({ id, title, children, zIndex, isActive, isMaximized, initialSize, initialPosition }) => {
    const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowState } = useGameStore.getState();

    // Use MotionValues to track position without causing re-renders on drag
    const x = useMotionValue(initialPosition.x);
    const y = useMotionValue(initialPosition.y);

    const handleDragEnd = (event, info) => {
        // After dragging, update the global state with the new position.
        updateWindowState(id, { position: { x: info.point.x, y: info.point.y } });
    };

    const headerRef = useRef(null);

    return (
        <motion.div
            drag
            dragListener={false} // We will use a specific drag handle
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ x, y }} // Bind the position to motion values
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
                opacity: 1, 
                scale: 1,
                width: isMaximized ? '100%' : initialSize.width,
                height: isMaximized ? 'calc(100vh - 3rem)' : initialSize.height,
                x: isMaximized ? 0 : x.get(),
                y: isMaximized ? 0 : y.get(),
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute bg-gray-800 border border-gray-700 shadow-2xl flex flex-col overflow-hidden text-gray-200 rounded-lg ${isActive ? 'shadow-lg shadow-blue-500/75' : 'shadow-black/50'}`}
            style={{
                zIndex: zIndex,
                width: initialSize.width,
                height: initialSize.height,
            }}
            onMouseDown={() => focusWindow(id)}
        >
            <header
                ref={headerRef}
                onPointerDown={(e) => {
                    // This allows dragging only via the header
                    const { dragControls } = e;
                    if (dragControls) {
                        dragControls.start(e);
                    }
                }}
                className={`bg-gray-900 text-white p-2 flex justify-between items-center cursor-grab active:cursor-grabbing ${isActive ? 'bg-blue-800' : ''}`}
            >
                <span className="font-bold text-sm select-none">{title}</span>
                <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }} className="w-4 h-4 bg-yellow-500 rounded-full hover:bg-yellow-400"></button>
                    <button onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }} className="w-4 h-4 bg-green-500 rounded-full hover:bg-green-400"></button>
                    <button onClick={(e) => { e.stopPropagation(); closeWindow(id); }} className="w-4 h-4 bg-red-500 rounded-full hover:bg-red-400"></button>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto p-1 bg-gray-800/80 backdrop-blur-sm">
                {children}
            </main>
            {/* Resizing handle can be added back here if needed, but requires more complex logic with framer-motion */}
        </motion.div>
    );
};

export default Window;

