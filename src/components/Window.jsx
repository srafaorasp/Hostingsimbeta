import React, { useState, useRef, useCallback } from 'react';

const Window = ({ id, title, children, zIndex, isActive, isMaximized, onClose, onMinimize, onMaximize, onFocus, initialSize, initialPosition }) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

    const headerClasses = isMaximized ? 'cursor-default' : 'cursor-move';
    const windowClasses = isMaximized
        ? 'top-0 left-0 w-full h-[calc(100%-3rem)] rounded-none'
        : 'rounded-lg';

    // --- Dragging Logic ---
    const handleDragMove = useCallback((e) => {
        if (isMaximized) return;
        e.preventDefault();
        const event = e.touches ? e.touches[0] : e;
        setPosition({ x: event.clientX - dragStartPos.current.x, y: event.clientY - dragStartPos.current.y });
    }, [isMaximized]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    }, [handleDragMove]);

    const handleDragStart = useCallback((e) => {
        if (isMaximized) return;
        onFocus(id);
        setIsDragging(true);
        const event = e.touches ? e.touches[0] : e;
        dragStartPos.current = { x: event.clientX - position.x, y: event.clientY - position.y };
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    }, [id, onFocus, position, isMaximized, handleDragMove, handleDragEnd]);

    // --- Resizing Logic ---
    const handleResizeMove = useCallback((e) => {
        const newWidth = resizeStartPos.current.width + (e.clientX - resizeStartPos.current.x);
        const newHeight = resizeStartPos.current.height + (e.clientY - resizeStartPos.current.y);
        setSize({
            width: Math.max(300, newWidth),
            height: Math.max(200, newHeight)
        });
    }, []);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }, [handleResizeMove]);

    const handleResizeStart = useCallback((e) => {
        onFocus(id);
        setIsResizing(true);
        resizeStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
        };
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }, [id, onFocus, size, handleResizeMove, handleResizeEnd]);

    return (
        <div
            // --- THIS IS THE FIX for window flashing ---
            // Removed the 'transition-all' class to prevent flashing on re-render.
            className={`absolute bg-gray-800 border border-gray-700 shadow-2xl flex flex-col overflow-hidden duration-100 ease-out text-gray-200 ${isActive ? 'shadow-blue-500/50' : 'shadow-black/50'} ${windowClasses}`}
            style={{
                top: isMaximized ? 0 : position.y,
                left: isMaximized ? 0 : position.x,
                width: isMaximized ? '100%' : size.width,
                height: isMaximized ? 'calc(100vh - 3rem)' : size.height,
                zIndex: zIndex,
                userSelect: isDragging || isResizing ? 'none' : 'auto'
            }}
            onClick={() => onFocus(id)}
        >
            <header
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className={`bg-gray-900 text-white p-2 flex justify-between items-center ${headerClasses} ${isActive ? 'bg-blue-800' : ''}`}
            >
                <span className="font-bold text-sm">{title}</span>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onMinimize(id)} className="w-4 h-4 bg-yellow-500 rounded-full hover:bg-yellow-400"></button>
                    <button onClick={() => onMaximize(id)} className="w-4 h-4 bg-green-500 rounded-full hover:bg-green-400"></button>
                    <button onClick={() => onClose(id)} className="w-4 h-4 bg-red-500 rounded-full hover:bg-red-400"></button>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto p-1">
                {children}
            </main>
            {!isMaximized && (
                <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" />
            )}
        </div>
    );
};

export default Window;
