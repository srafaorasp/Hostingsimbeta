import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '/src/store/gameStore.js';

const Window = ({ id, title, children, zIndex, isActive, isMaximized, position, size }) => {
    // Non-reactive actions from the store
    const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowState } = useGameStore.getState();
    
    // Local state for resizing only
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const constraintsRef = useRef(null);

    const windowClasses = isMaximized ? 'top-0 left-0 w-full h-full rounded-none' : 'rounded-lg';

    // --- THIS IS THE FIX for resizing ---
    const handleResizeMove = useCallback((e) => {
        const newWidth = resizeStartPos.current.width + (e.clientX - resizeStartPos.current.x);
        const newHeight = resizeStartPos.current.height + (e.clientY - resizeStartPos.current.y);
        // Directly update the global state during resize
        updateWindowState(id, { size: { width: Math.max(300, newWidth), height: Math.max(200, newHeight) } });
    }, [id, updateWindowState]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }, [handleResizeMove]);

    const handleResizeStart = useCallback((e) => {
        e.stopPropagation(); // Prevent drag from firing
        focusWindow(id);
        setIsResizing(true);
        resizeStartPos.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }, [id, focusWindow, size, handleResizeMove, handleResizeEnd]);

    // --- THIS IS THE FIX for dragging ---
    const handleDragEnd = (event, info) => {
        updateWindowState(id, { position: { x: info.offset.x, y: info.offset.y } });
    };

    return (
        // Set the constraints ref to the viewport
        <div ref={constraintsRef} className="absolute inset-0 pointer-events-none" />
    );
};

export default Window;

