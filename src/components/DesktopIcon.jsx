import React from 'react';

const DesktopIcon = ({ appId, onIconClick, appsConfig }) => {
    
    if (!appsConfig || !appsConfig[appId]) {
        // This check is important, but we'll keep it silent for now
        return null; 
    }

    const { title, icon: Icon } = appsConfig[appId];
    
    if (!Icon) {
        // This check is also important
        return null;
    }

    // The onClick handler is moved to the parent div
    return (
        <div 
            className="flex flex-col items-center justify-center text-center p-2 rounded-md hover:bg-blue-500/20 cursor-pointer"
            onClick={() => onIconClick(appId)}
        >
            {/* --- NEW DIAGNOSTIC STEP --- */}
            {/* We are rendering the Icon component AND plain text next to it. */}
            <div className="flex items-center justify-center">
                <Icon />
                <span className="text-red-500 text-xs ml-1">ICON</span>
            </div>
            {/* --- END DIAGNOSTIC STEP --- */}
            
            <span className="text-white text-sm mt-1 select-none">{title}</span>
        </div>
    );
};

export default DesktopIcon;

