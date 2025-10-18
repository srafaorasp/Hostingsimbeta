import React from 'react';
import * as icons from 'lucide-react';

const DesktopIcon = ({ id, name, icon, onDoubleClick }) => {
  // Dynamically select the icon component from the 'lucide-react' library
  // based on the string name provided in the 'icon' prop from data.js.
  const LucideIcon = icons[icon];

  return (
    <div
      id={`desktop-icon-${id}`}
      onDoubleClick={onDoubleClick}
      className="flex flex-col items-center justify-center text-center w-24 h-24 p-2 rounded-lg hover:bg-blue-500/20 focus:bg-blue-500/30 outline-none cursor-pointer"
      tabIndex={0}
    >
      <div className="w-16 h-16 mb-1 flex items-center justify-center">
        {/* Render the selected icon, or a fallback 'File' icon if it's not found */}
        {LucideIcon ? (
          <LucideIcon className="w-10 h-10 text-white" strokeWidth={1.5} />
        ) : (
          <icons.File className="w-10 h-10 text-white" strokeWidth={1.5} />
        )}
      </div>
      <span className="text-white text-sm break-words w-full leading-tight">
        {name}
      </span>
    </div>
  );
};

export default DesktopIcon;

