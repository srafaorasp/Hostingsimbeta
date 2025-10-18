import React from "react";
import { useDrag } from "react-dnd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip.jsx";

const DesktopIcon = ({ appId, onIconClick, appsConfig, position }) => {
    if (!appsConfig || !appsConfig[appId]) return null;
    const { title, icon: Icon } = appsConfig[appId];
    if (!Icon) return null;

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'icon',
        item: { appId, position },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [appId, position]);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {/* --- THIS IS THE FIX --- */}
                    {/* The div is now absolutely positioned using the position prop from the global state */}
                    <div
                        ref={drag}
                        onDoubleClick={() => onIconClick(appId)}
                        className="flex flex-col items-center justify-center text-center p-2 rounded-md hover:bg-blue-500/20 cursor-pointer w-24 absolute"
                        style={{
                            left: position.x,
                            top: position.y,
                            opacity: isDragging ? 0.5 : 1,
                        }}
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

