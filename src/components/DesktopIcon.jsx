import React from "react";
import { useDrag } from "react-dnd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip.jsx";

const DesktopIcon = ({ appId, onIconClick, appsConfig }) => {
    if (!appsConfig || !appsConfig[appId]) {
        return null;
    }

    const { title, icon: Icon } = appsConfig[appId];
    
    // --- THIS IS A FIX ---
    // The useDrag hook returns the drag ref which needs to be attached to the component.
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'icon',
        item: { appId },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    if (!Icon) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={500}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {/* The drag ref is now correctly attached to the draggable div */}
                    <div
                        ref={drag}
                        onDoubleClick={() => onIconClick(appId)}
                        className="flex flex-col items-center justify-center text-center p-2 rounded-md hover:bg-blue-500/20 cursor-pointer w-24"
                        style={{ opacity: isDragging ? 0.5 : 1 }}
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

