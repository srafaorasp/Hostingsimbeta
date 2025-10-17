import React from 'react';
import { useDrag } from 'react-dnd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.jsx';

const DesktopIcon = ({ appId, onIconClick, appsConfig }) => {
    
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
    }), [appId]);

    if (!Icon) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {/* --- THIS IS THE FIX --- */}
                    {/* Removed absolute positioning and inline styles */}
                    <div 
                        ref={drag}
                        className="relative flex flex-col items-center justify-center text-center p-2 rounded-md hover:bg-blue-500/20 cursor-pointer w-24"
                        style={{ opacity: isDragging ? 0.5 : 1 }}
                        onDoubleClick={() => onIconClick(appId)}
                    >
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Icon />
                        </div>
                        <span className="text-white text-sm mt-1 select-none break-words">{title}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{title}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default DesktopIcon;

