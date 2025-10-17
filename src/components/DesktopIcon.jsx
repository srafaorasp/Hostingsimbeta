import React from 'react';
import { useDrag } from 'react-dnd';

const DesktopIcon = ({ appId, onIconClick, appsConfig, position }) => {
    
    if (!appsConfig || !appsConfig[appId]) {
        return null; 
    }

    const { title, icon: Icon } = appsConfig[appId];
    
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'desktop-icon',
        item: { id: appId },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    if (!Icon) {
        return null;
    }

    return (
        <div
            ref={drag}
            className="absolute flex flex-col items-center justify-center text-center p-2 rounded-md hover:bg-blue-500/20 cursor-pointer w-24"
            style={{ 
                left: position.x, 
                top: position.y,
                opacity: isDragging ? 0.5 : 1,
            }}
            onDoubleClick={() => onIconClick(appId)}
        >
            <div className="w-8 h-8 flex items-center justify-center pointer-events-none">
                <Icon />
            </div>
            <span className="text-white text-sm mt-1 select-none break-words pointer-events-none">{title}</span>
        </div>
    );
};

export default DesktopIcon;

