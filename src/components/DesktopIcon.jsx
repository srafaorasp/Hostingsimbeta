import React from 'react';

const DesktopIcon = ({ appId, onIconClick, appsConfig }) => {
    
    if (!appsConfig || !appsConfig[appId]) {
        console.error(`Missing config for app: ${appId}`);
        return null; 
    }

    const { title, icon: Icon } = appsConfig[appId];
    
    if (!Icon) {
        console.error(`[DesktopIcon] No icon component ('Icon' variable is falsy) for ${appId}.`);
        return null;
    }

    return (
        <div 
            className="flex flex-col items-center justify-center text-center p-2 rounded-md hover:bg-blue-500/20 cursor-pointer" 
            onClick={() => onIconClick(appId)}
        >
            <Icon />
            <span className="text-white text-sm mt-1 select-none">{title}</span>
        </div>
    );
};

export default DesktopIcon;

