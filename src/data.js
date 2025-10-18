import React from 'react';

// This file contains all the static game data.

// #############################################################################
// UI & Application Configuration
// #############################################################################

export const APPS_CONFIG = {
  netAdmin: {
    id: "netAdmin",
    name: "Network Administration",
    icon: "Network",
    component: () => import('./apps/NetAdmin'),
    defaultSize: [600, 400],
  },
  ispConnect: {
    id: "ispConnect",
    name: "ISP Connect",
    icon: "Wifi",
    component: () => import('./apps/ISPConnect'),
    defaultSize: [400, 500],
  },
  orderUp: {
    id: "orderUp",
    name: "OrderUp Hardware",
    icon: "ShoppingCart",
    component: () => import('./apps/OrderUp'),
    defaultSize: [700, 500],
  },
  powerManager: {
    id: "powerManager",
    name: "Power Manager",
    icon: "Zap",
    component: () => import('./apps/PowerManager'),
    defaultSize: [500, 350],
  },
  enviroMon: {
    id: "enviroMon",
    name: "EnviroMon",
    icon: "Thermometer",
    component: () => import('./apps/EnviroMon'),
    defaultSize: [500, 350],
  },
  clientConnect: {
    id: "clientConnect",
    name: "Client Connect",
    icon: "Briefcase",
    component: () => import('./apps/ClientConnect'),
    defaultSize: [600, 450],
  },
  teamView: {
    id: "teamView",
    name: "Team View",
    icon: "Users",
    component: () => import('./apps/TeamView'),
    defaultSize: [650, 400],
  },
  siteView: {
    id: "siteView",
    name: "Site View",
    icon: "Globe",
    component: () => import('./apps/SiteView'),
    defaultSize: [700, 500],
  },
   daemonManager: {
    id: "daemonManager",
    name: "Daemon Manager",
    icon: "Cog",
    component: () => import('./apps/DaemonManager'),
    defaultSize: [700, 450],
  },
  taskRunner: {
    id: "taskRunner",
    name: "Task Runner",
    icon: "PlaySquare",
    component: () => import('./apps/TaskRunner'),
    defaultSize: [600, 400],
  },
  shell: {
    id: "shell",
    name: "Shell",
    icon: "Terminal",
    component: () => import('./apps/Shell'),
    defaultSize: [600, 400],
  },
  scriptIDE: {
    id: "scriptIDE",
    name: "Script IDE",
    icon: "Code",
    component: () => import('./apps/ScriptIDE'),
    defaultSize: [800, 600],
  },
  sysLog: {
    id: "sysLog",
    name: "System Log",
    icon: "History",
    component: () => import('./apps/SysLog'),
    defaultSize: [700, 500],
  },
  analytics: {
    id: "analytics",
    name: "Analytics",
    icon: "AreaChart",
    component: () => import('./apps/Analytics'),
    defaultSize: [700, 450],
  },
  achievements: {
    id: "achievements",
    name: "Achievements",
    icon: "Trophy",
    component: () => import('./apps/Achievements'),
    defaultSize: [600, 500],
  },
};


// #############################################################################
// Game Content
// #############################################################################

export const HARDWARE_CATALOG = {
  servers: {
    'basic-server': { name: 'Basic Server', cost: 500, power: 10, specs: { cpu: 1, ram: 2, storage: 16 } },
    'standard-server': { name: 'Standard Server', cost: 1500, power: 25, specs: { cpu: 2, ram: 8, storage: 64 } },
    'advanced-server': { name: 'Advanced Server', cost: 5000, power: 50, specs: { cpu: 4, ram: 32, storage: 256 } },
  },
  // other hardware like racks, cooling, etc.
};

export const ISP_PLANS = {
    'dialup': { name: 'Dial-Up', cost: 10, bandwidth: { up: 0.05, down: 0.05 } },
    'broadband': { name: 'Broadband', cost: 50, bandwidth: { up: 1, down: 10 } },
    'fiber': { name: 'Fiber Optic', cost: 120, bandwidth: { up: 100, down: 100 } },
};

export const CLIENT_CONTRACTS = [
    { id: 'contract-01', client: 'Bloggers Inc.', description: 'Host a small WordPress blog.', reward: 100, requirements: { uptime: 95, storage: 1 } },
    { id: 'contract-02', client: 'eShop LLC', description: 'Host a small e-commerce store.', reward: 350, requirements: { uptime: 99, storage: 5 } },
    { id: 'contract-03', client: 'Data Corp', description: 'Data processing and storage.', reward: 800, requirements: { uptime: 99.9, storage: 50, cpu: 2 } },
];

export const TEAM_MEMBERS = {
    'sysadmin-jr': { id: 'sysadmin-jr', name: 'Alex', role: 'Jr. SysAdmin', salary: 3000, hiringCost: 1000, skills: { hardware: 2, software: 1, networking: 1 } },
    'dev-jr': { id: 'dev-jr', name: 'Bea', role: 'Jr. Developer', salary: 3500, hiringCost: 1200, skills: { scripting: 2, debugging: 1 } },
    'support-t1': { id: 'support-t1', name: 'Charles', role: 'Support Tech', salary: 2500, hiringCost: 800, skills: { tickets: 2 } },
};

export const SITE_TEMPLATES = {
    'blog': { name: 'WordPress Blog', cost: 50, resources: { cpu: 0.1, ram: 0.2, storage: 1 } },
    'ecommerce': { name: 'Magento Shop', cost: 200, resources: { cpu: 0.5, ram: 1, storage: 5 } },
    'static': { name: 'Static HTML', cost: 10, resources: { cpu: 0.01, ram: 0.1, storage: 0.1 } },
};

export const DAEMON_DEFINITIONS = {
  'auto-reboot': { name: 'Auto Rebooter', description: 'Monitors a server and reboots it if it becomes unresponsive.', cost: 150 },
  'load-balancer': { name: 'Load Balancer', description: 'Distributes traffic across multiple servers.', cost: 500 },
  'firewall': { name: 'Firewall', description: 'Basic firewall to protect a server.', cost: 250 },
};

export const TASK_DEFINITIONS = {
    'defrag': { name: 'Defragment Disk', description: 'Improves disk performance on a server.', cost: 20, duration: 60 }, // duration in seconds
    'security-audit': { name: 'Security Audit', description: 'Scans a server for vulnerabilities.', cost: 100, duration: 300 },
    'backup': { name: 'Backup Server', description: 'Performs a full backup of a server.', cost: 50, duration: 180 },
};

// #############################################################################
// Narrative & Progression
// #############################################################################

export const ACHIEVEMENT_DEFINITIONS = {
    'first_login': { id: 'first_login', name: 'Welcome Aboard', description: 'Log in for the first time.' },
    'first_server': { id: 'first_server', name: 'It\'s Alive!', description: 'Purchase your first server.' },
    'internet_access': { id: 'internet_access', name: 'Connected', description: 'Subscribe to an ISP plan.' },
    'first_site': { id: 'first_site', name: 'Hello, World!', description: 'Launch your first website.' },
    'first_hire': { id: 'first_hire', name: 'You\'re Hired!', description: 'Hire your first team member.' },
    'first_daemon': { id: 'first_daemon', name: 'Automation', description: 'Install your first daemon.' },
    'first_task': { id: 'first_task', name: 'On It', description: 'Schedule your first task.' },
    'cash_10k': { id: 'cash_10k', name: 'Liquid Assets', description: 'Reach $10,000 cash.' },
    'cash_100k': { id: 'cash_100k', name: 'Big Spender', description: 'Reach $100,000 cash.' },
    'server_farm': { id: 'server_farm', name: 'Server Farm', description: 'Own 5 servers.' },
    'web_empire': { id: 'web_empire', name: 'Web Empire', description: 'Host 5 websites.' },
};

export const initialScripts = [
  {
    id: "script-001",
    name: "example_reboot",
    code: "// This is an example script.\n// It finds the server with the lowest RAM and reboots it.\n\nconst servers = getServers();\n\nif (servers.length > 0) {\n  let target = servers[0];\n  for (const server of servers) {\n    if (server.ram < target.ram) {\n      target = server;\n    }\n  }\n\n  log(`Rebooting server ${target.id} which has only ${target.ram}GB RAM.`);\n  rebootServer(target.id);\n} else {\n  log('No servers found to reboot.');\n}\n",
  },
];

export const initialTutorials = {
    '001_welcome': {
        id: '001_welcome',
        title: 'Welcome to HostingSim',
        completed: false,
        steps: [
            {
                title: 'Welcome!',
                text: 'Welcome to HostingSim! This tutorial will guide you through the basics. Click anywhere to continue.',
                target: null,
                trigger: { type: 'manual' },
            },
            {
                title: 'The Desktop',
                text: 'This is your desktop. You can open applications by double-clicking their icons.',
                target: null,
                trigger: { type: 'manual' },
            },
            {
                title: 'Your First Task',
                text: 'Let\'s start by getting an internet connection. Double-click the "ISP Connect" app to see available plans.',
                target: '#app-icon-ispConnect',
                trigger: { type: 'OPEN_APP', target: 'ispConnect' },
            }
        ]
    },
     '002_buy_server': {
        id: '002_buy_server',
        title: 'Buying Hardware',
        completed: false,
        steps: [
            {
                title: 'Order Up!',
                text: 'Now that you have internet, you need a server. Open the "OrderUp Hardware" app.',
                target: '#app-icon-orderUp',
                trigger: { type: 'OPEN_APP', target: 'orderUp' },
            },
            {
                title: 'Purchase a Server',
                text: 'Buy the "Basic Server". It\'s a good starting point.',
                target: null, // Should target the button in the app
                trigger: { type: 'BUY_SERVER', target: 'basic-server' },
            }
        ]
    }
};

