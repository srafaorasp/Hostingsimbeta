import React, { Suspense } from 'react';
import { APPS_CONFIG } from '../data';

const WindowPreview = ({ window }) => {
    if (!window || !window.appId) return null;
    
    const AppToRender = APPS_CONFIG[window.appId]?.component;
    if (!AppToRender) return null;

    // This is an estimation. A more robust solution might need to pass the actual size.
    const originalWidth = window.size?.width || 800;
    const originalHeight = window.size?.height || 600;
    
    const previewWidth = 192; // w-48
    const previewHeight = 144; // h-36

    const scaleX = previewWidth / originalWidth;
    const scaleY = previewHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY);

    return (
        <div 
            className="w-48 h-36 bg-window-bg border-2 border-accent rounded-md overflow-hidden pointer-events-none shadow-lg"
        >
            <div 
                style={{ 
                    width: originalWidth, 
                    height: originalHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                }}
            >
                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <AppToRender />
                </Suspense>
            </div>
        </div>
    );
};

export default WindowPreview;
