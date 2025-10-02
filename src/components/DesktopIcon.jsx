import React from 'react';

// The props are updated to expect `onIconClick` instead of `onDoubleClick`
const DesktopIcon = ({ appId, onIconClick, appsConfig }) => {
    
    // Defensive check to prevent crashes if the config is missing
    if (!appsConfig || !appsConfig[appId]) {
        console.error(`Missing config for app: ${appId}`);
        return null; 
    }

    const { title, icon: Icon } = appsConfig[appId];
    
    // Defensive check for the icon component itself
    if (!Icon) {
        return null;
    }

    // The event handler is changed from onDoubleClick to onClick
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

