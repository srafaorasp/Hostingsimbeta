import React from "react";
import { APPS_CONFIG } from "../data";

const WindowPreview = ({ appId }) => {
  const App = APPS_CONFIG[appId]?.component;
  const appConfig = APPS_CONFIG[appId];

  if (!App || !appConfig) {
    return <div className="p-4">Error: App not found</div>;
  }

  // A simple preview - just show the icon and name
  return (
    <div className="bg-gray-800 text-white w-full h-full p-1 rounded-md overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <appConfig.icon className="mx-auto h-12 w-12 text-gray-500" />
        <p className="mt-2 text-sm font-semibold">{appConfig.name}</p>
      </div>
    </div>
  );
};

export default WindowPreview;
