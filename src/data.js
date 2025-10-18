import React from 'react';
import Icons from '/src/components/Icons.jsx';

// --- THIS OBJECT HAS BEEN MOVED BACK HERE TO PREVENT CIRCULAR DEPENDENCIES ---
export const APPS_CONFIG = {
    'OrderUp': { title: 'OrderUp', icon: Icons.FolderIcon, component: React.lazy(() => import('/src/apps/OrderUp.jsx')) },
    'TaskRunner': { title: 'TaskRunner', icon: Icons.CalendarIcon, component: React.lazy(() => import('/src/apps/TaskRunner.jsx')) },
    'TeamView': { title: 'TeamView', icon: Icons.UsersIcon, component: React.lazy(() => import('/src/apps/TeamView.jsx')) },
    'NetAdmin': { title: 'NetAdmin', icon: Icons.TerminalIcon, component: React.lazy(() => import('/src/apps/NetAdmin.jsx')) },
    'LayoutView': { title: 'LayoutView', icon: Icons.LayoutIcon, component: React.lazy(() => import('/src/apps/LayoutView.jsx')) },
    'SiteView': { title: 'SiteView', icon: Icons.CameraIcon, component: React.lazy(() => import('/src/apps/SiteView.jsx')) },
    'EnviroMon': { title: 'EnviroMon', icon: Icons.PowerIcon, component: React.lazy(() => import('/src/apps/EnviroMon.jsx')) },
    'ClientConnect': { title: 'ClientConnect', icon: Icons.GlobeIcon, component: React.lazy(() => import('/src/apps/ClientConnect.jsx')) },
    'SysLog': { title: 'SysLog', icon: Icons.AlertIcon, component: React.lazy(() => import('/src/apps/SysLog.jsx')) },
    'SystemSettings': { title: 'System Settings', icon: Icons.SettingsIcon, component: React.lazy(() => import('/src/apps/SystemSettings.jsx')) },
    'ISPConnect': { title: 'ISP Connect', icon: Icons.WifiIcon, component: React.lazy(() => import('/src/apps/ISPConnect.jsx')) },
    'PowerManager': { title: 'Power Manager', icon: Icons.BatteryIcon, component: React.lazy(() => import('/src/apps/PowerManager.jsx')) },
    'ScriptIDE': { title: 'ScriptIDE', icon: Icons.CodeIcon, component: React.lazy(() => import('/src/apps/ScriptIDE.jsx')) },
    'ScriptingGuide': { title: 'Scripting Guide', icon: Icons.BookIcon, component: React.lazy(() => import('/src/apps/ScriptingGuide.jsx')) },
    'DaemonManager': { title: 'Daemon Manager', icon: Icons.BotIcon, component: React.lazy(() => import('/src/apps/DaemonManager.jsx')) },
    'Analytics': { title: 'Analytics', icon: Icons.LineChartIcon, component: React.lazy(() => import('/src/apps/Analytics.jsx')) },
    'Achievements': { title: 'Achievements', icon: Icons.TrophyIcon, component: React.lazy(() => import('/src/apps/Achievements.jsx')) },
    'Shell': { title: 'Shell', icon: Icons.TerminalIcon, component: React.lazy(() => import('/src/apps/Shell.jsx')) },
};


export const PRIORITIES = { Emergency: 4, High: 3, Normal: 2, Low: 1 };
export const PRIORITY_COLORS = { Emergency: 'bg-red-600', High: 'bg-orange-500', Normal: 'bg-yellow-500', Low: 'bg-green-600' };
export const GRID_POWER_COST_PER_KWH = 0.14;

// --- Hardware Catalog ---
export const HARDWARE_CATALOG = [
    // ... (content is unchanged, omitted for brevity but present in the actual file)
];

// --- Other Game Data ---
export const CANDIDATES = [ /* ... */ ];
export const CLIENT_CONTRACTS = [ /* ... */ ];
export const ISP_CONTRACTS = [ /* ... */ ];
export const SCRIPT_PERMISSIONS = { /* ... */ };
export const TASK_DEFINITIONS = [ /* ... */ ];


// --- Tutorial Definition ---
export const TUTORIAL_STEPS = [
    {
        text: "Welcome to DataCenter OS! Let's get started. Our first step is to hire a technician. Please open the 'TeamView' app to see available candidates.",
        target: 'icon-TeamView',
        trigger: { type: 'APP_OPEN', appId: 'TeamView' }
    },
    {
        text: "Great! Here you can see a list of candidates. Let's hire Alex Chen, our Hardware Technician.",
        target: 'hire-emp_001', // We'll need to add this ID to the hire button
        trigger: { type: 'HIRE_EMPLOYEE', employeeId: 'emp_001' }
    },
    {
        text: "Excellent, Alex is now on the team. We need to give him something to do. Let's order our first server rack. Open the 'OrderUp' app.",
        target: 'icon-OrderUp',
        trigger: { type: 'APP_OPEN', appId: 'OrderUp' }
    },
    {
        text: "Purchase one 'Standard Server Rack'. It will be delivered to the Tech Room.",
        target: 'purchase-rack_std_01', // We'll need to add this ID
        trigger: { type: 'PURCHASE_ITEM', itemId: 'rack_std_01' }
    },
    {
        text: "Now that the rack is staged, we need to create a task to install it. Open the 'TaskRunner' app.",
        target: 'icon-TaskRunner',
        trigger: { type: 'APP_OPEN', appId: 'TaskRunner' }
    },
    {
        text: "Find the 'Install Server Rack' job and click 'Schedule'. Alex will automatically be assigned to it.",
        target: 'schedule-install_rack', // We'll need to add this ID
        trigger: { type: 'CREATE_TASK', taskId: 'install_rack' }
    },
    {
        text: "Perfect! You've scheduled your first task. You can monitor its progress in the Task Queue. This concludes the basic tutorial. Good luck!",
        isEnd: true
    }
];

// --- Achievement Definitions ---
export const ACHIEVEMENT_DEFINITIONS = {
    'CASH_1': { id: 'CASH_1', title: 'First Paycheck', description: 'Reach $100,000 in cash.' },
    'HIRE_1': { id: 'HIRE_1', title: 'Welcome Aboard', description: 'Hire your first employee.' },
    'RACK_1': { id: 'RACK_1', title: 'Ready to Rack', description: 'Install your first server rack.' },
    'SERVER_1': { id: 'SERVER_1', title: 'Online and Blinking', description: 'Install your first server.' },
    'CLIENT_1': { id: 'CLIENT_1', title: 'Open for Business', description: 'Sign your first client contract.' },
};


