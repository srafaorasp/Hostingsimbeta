import React, { useCallback, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import useGameStore from '/src/store/gameStore.js';

const Window = ({ id, title, children, zIndex, isActive, isMaximized, position, size }) => {
    const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowState } = useGameStore.getState();
    const dragControls = useDragControls();

    // --- FIX for Window Snapping ---
    const handleDragEnd = (event, info) => {
        // The `info.point` gives the final absolute cursor position.
        // We update the state with this corrected position.
        updateWindowState(id, { position: { x: info.point.x, y: info.point.y } });
    };

    // --- Resize Logic ---
    const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0, startX: 0, startY: 0 });

    const handleResizeMove = useCallback((e, direction) => {
        let { width, height, startX, startY } = resizeStartPos.current;
        const dx = e.clientX - resizeStartPos.current.x;
        const dy = e.clientY - resizeStartPos.current.y;

        let newWidth = width;
        let newHeight = height;
        let newX = startX;
        let newY = startY;

        if (direction.includes('right')) newWidth = Math.max(300, width + dx);
        if (direction.includes('bottom')) newHeight = Math.max(200, height + dy);
        if (direction.includes('left')) {
            newWidth = Math.max(300, width - dx);
            if (newWidth > 300) newX = startX + dx;
        }
        if (direction.includes('top')) {
            newHeight = Math.max(200, height - dy);
            if (newHeight > 200) newY = startY + dy;
        }

        updateWindowState(id, {
            size: { width: newWidth, height: newHeight },
            position: { x: newX, y: newY }
        });

    }, [id, updateWindowState]);

    const handleResizeEnd = useCallback(() => {
        document.documentElement.style.cursor = '';
        document.removeEventListener('mousemove', resizeStartPos.current.moveHandler);
        document.removeEventListener('mouseup', handleResizeEnd);
    }, []);

    const handleResizeStart = useCallback((e, direction) => {
        e.stopPropagation();
        focusWindow(id);
        
        document.documentElement.style.cursor = `${direction}-resize`;

        resizeStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
            startX: position.x,
            startY: position.y,
            moveHandler: (moveEvent) => handleResizeMove(moveEvent, direction)
        };
        
        document.addEventListener('mousemove', resizeStartPos.current.moveHandler);
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
                // --- FIX for Snapping ---
                // We set the initial position via style so framer-motion has the correct starting point
                // The animate prop will take over from here.
                top: position.y,
                left: position.x,
            }}
            animate={{
                width: isMaximized ? '100%' : size.width,
                height: isMaximized ? `calc(100vh - 7rem)` : size.height,
                // We no longer animate x and y here; drag controls them
            }}
            initial={false} // We don't need the initial animation anymore
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
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

