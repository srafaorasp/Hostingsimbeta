import React from 'react';

const DesktopIcon = ({ appId, onIconClick, appsConfig }) => {
    
    if (!appsConfig || !appsConfig[appId]) {
        // This check prevents crashes if the config is missing for an app.
        return null; 
    }

    const { title, icon: Icon } = appsConfig[appId];
    
    if (!Icon) {
        // This check is for robustness, in case an icon is not defined.
        return null;
    }

    return (
        <div 
            className="flex flex-col items-center justify-center text-center p-2 rounded-md hover:bg-blue-500/20 cursor-pointer w-24"
            onClick={() => onIconClick(appId)}
        >
            <div className="w-8 h-8 flex items-center justify-center">
                <Icon />
            </div>
            <span className="text-white text-sm mt-1 select-none break-words">{title}</span>
        </div>
    );
};

export default DesktopIcon;

