import React, { useCallback, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import useGameStore from '/src/store/gameStore.js';

const Window = ({ id, title, children, zIndex, isActive, isMaximized, position, size }) => {
    const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowState } = useGameStore.getState();
    const dragControls = useDragControls();

    // --- DEFINITIVE FIX for Window Snapping ---
    const handleDragEnd = (event, info) => {
        // We calculate the new position by adding the final drag offset to the window's starting position.
        // This provides a stable and correct final position.
        const newPosition = {
            x: position.x + info.offset.x,
            y: position.y + info.offset.y,
        };
        updateWindowState(id, { position: newPosition });
    };

    // --- DEFINITIVE FIX for Resizing Logic ---
    const resizeStartRef = useRef(null);

    const handleResizeMove = useCallback((e) => {
        if (!resizeStartRef.current) return;

        const { startSize, startPosition, direction } = resizeStartRef.current;
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;

        let newWidth = startSize.width;
        let newHeight = startSize.height;
        let newX = startPosition.x;
        let newY = startPosition.y;

        // Apply size changes
        if (direction.includes('right')) newWidth = Math.max(300, startSize.width + dx);
        if (direction.includes('bottom')) newHeight = Math.max(200, startSize.height + dy);
        if (direction.includes('left')) newWidth = Math.max(300, startSize.width - dx);
        if (direction.includes('top')) newHeight = Math.max(200, startSize.height - dy);

        // Apply position changes for left/top drags
        if (direction.includes('left') && newWidth > 300) newX = startPosition.x + dx;
        if (direction.includes('top') && newHeight > 200) newY = startPosition.y + dy;

        updateWindowState(id, {
            size: { width: newWidth, height: newHeight },
            position: { x: newX, y: newY }
        });
    }, [id, updateWindowState]);

    const handleResizeEnd = useCallback(() => {
        document.documentElement.style.cursor = '';
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        resizeStartRef.current = null;
    }, [handleResizeMove]);

    const handleResizeStart = useCallback((e, direction) => {
        e.stopPropagation();
        focusWindow(id);
        
        document.documentElement.style.cursor = `${direction}-resize`;

        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startSize: size,
            startPosition: position,
            direction: direction,
        };
        
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd, { once: true });
    }, [id, focusWindow, size, position, handleResizeMove, handleResizeEnd]);


    const resizeHandles = [
        { direction: 'n', className: 'top-0 left-1/2 -translate-x-1/2 h-2 w-[calc(100%-1rem)] cursor-n-resize' },
        { direction: 's', className: 'bottom-0 left-1/2 -translate-x-1/2 h-2 w-[calc(100%-1rem)] cursor-s-resize' },
        { direction: 'e', className: 'right-0 top-1/2 -translate-y-1/2 w-2 h-[calc(100%-1rem)] cursor-e-resize' },
        { direction: 'w', className: 'left-0 top-1/2 -translate-y-1/2 w-2 h-[calc(100%-1rem)] cursor-w-resize' },
        { direction: 'nw', className: 'top-0 left-0 h-3 w-3 cursor-nw-resize' },
        { direction: 'ne', className: 'top-0 right-0 h-3 w-3 cursor-ne-resize' },
        { direction: 'sw', className: 'bottom-0 left-0 h-3 w-3 cursor-sw-resize' },
        { direction: 'se', className: 'bottom-0 right-0 h-3 w-3 cursor-se-resize' },
    ];


    return (
        <motion.div
            key={id}
            className={`absolute bg-gray-800 border border-gray-700 shadow-2xl flex flex-col overflow-hidden text-gray-200 ${isActive ? 'shadow-accent/50' : 'shadow-black/50'} ${isMaximized ? 'rounded-none' : 'rounded-lg'}`}
            style={{ 
                zIndex,
                // We now exclusively use transforms for positioning
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height,
            }}
            animate={{
                width: isMaximized ? '100%' : size.width,
                height: isMaximized ? `calc(100vh - 7rem)` : size.height,
                x: isMaximized ? 0 : position.x,
                y: isMaximized ? 0 : position.y,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            drag={!isMaximized}
            dragListener={false}
            dragControls={dragControls}
            onDragEnd={handleDragEnd}
            onMouseDown={() => focusWindow(id)}
        >
            <header
                onPointerDown={(event) => {
                    if (event.target === event.currentTarget) {
                        dragControls.start(event);
                    }
                }}
                className={`bg-gray-900 text-white p-2 flex justify-between items-center select-none ${!isMaximized ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${isActive ? 'bg-accent/80' : ''}`}
            >
                <span className="font-bold text-sm pointer-events-none">{title}</span>
                <div className="flex items-center space-x-2">
                    <button onClick={() => minimizeWindow(id)} className="w-4 h-4 bg-yellow-500 rounded-full hover:bg-yellow-400"></button>
                    <button onClick={() => maximizeWindow(id)} className="w-4 h-4 bg-green-500 rounded-full hover:bg-green-400"></button>
                    <button onClick={() => closeWindow(id)} className="w-4 h-4 bg-red-500 rounded-full hover:bg-red-400"></button>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto p-1 bg-gray-800/80">
                {children}
            </main>
            
            {!isMaximized && resizeHandles.map(handle => (
                <div
                    key={handle.direction}
                    className={`absolute ${handle.className} z-10`}
                    onMouseDown={(e) => handleResizeStart(e, handle.direction)}
                />
            ))}
        </motion.div>
    );
};

export default Window;

