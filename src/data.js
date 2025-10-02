import React from 'react';
import Icons from '/src/components/Icons.jsx';

export const PRIORITIES = { Emergency: 4, High: 3, Normal: 2, Low: 1 };
export const PRIORITY_COLORS = { Emergency: 'bg-red-600', High: 'bg-orange-500', Normal: 'bg-yellow-500', Low: 'bg-green-600' };

export const GRID_POWER_COST_PER_KWH = 0.14;

export const HARDWARE_CATALOG = [
    { id: 'rack_std_01', name: 'Standard Server Rack', price: 1500, type: 'RACK' },
    { id: 'server_blade_g1', name: 'Blade Server G1', price: 2500, type: 'SERVER', powerDraw: 450, heatOutput: 1535, bandwidth: 10 },
    { id: 'switch_48p', name: '48-Port Network Switch', price: 800, type: 'NETWORKING', powerDraw: 100, heatOutput: 341, bandwidthCapacity: 480 },
    { id: 'pdu_basic_3kw', name: 'PDU 3kW', price: 400, type: 'PDU', powerCapacity: 3000 },
    { id: 'crac_10k_btu', name: 'CRAC Unit 10k BTU', price: 6000, type: 'CRAC', coolingCapacity: 10000, powerDraw: 1200 },
    { id: 'router_enterprise_01', name: 'Enterprise Router R1', price: 3200, type: 'ROUTER', powerDraw: 200, heatOutput: 682 },
    { id: 'fiber_terminal_sfp', name: 'Fiber Optic Terminal', price: 900, type: 'FIBER_TERMINAL', powerDraw: 50, heatOutput: 170 },
    { id: 'generator_diesel_50kw', name: 'Diesel Generator 50kW', price: 25000, type: 'GENERATOR', powerCapacity: 50000, fuelCapacity: 200, fuelConsumptionRate: 3.5 },
    { id: 'solar_array_10kw', name: 'Solar Array 10kW', price: 18000, type: 'SOLAR', powerCapacity: 10000 },
    { id: 'battery_backup_100kwh', name: 'Battery Backup 100kWh', price: 40000, type: 'BATTERY', powerCapacity: 100000, storageCapacity: 100 },
];

export const CANDIDATES = [
    { id: 'emp_001', name: 'Alex Chen', skill: 'Hardware Technician', salary: 55000 },
    { id: 'emp_002', name: 'Brenda Miles', skill: 'Network Engineer', salary: 72000 },
];

export const CLIENT_CONTRACTS = [
    { id: 'c001', name: 'Startup Web Host', requirements: { 'server_blade_g1': 2 }, monthlyRevenue: 5000, bandwidthLoad: 20 },
    { id: 'c002', name: 'E-commerce Platform', requirements: { 'server_blade_g1': 4 }, monthlyRevenue: 12000, bandwidthLoad: 50 },
    { id: 'c003', name: 'Gaming Community Hub', requirements: { 'server_blade_g1': 8 }, monthlyRevenue: 25000, bandwidthLoad: 100 },
];

export const ISP_CONTRACTS = [
    { id: 'isp_01', name: 'MetroConnect', bandwidthUp: 100, bandwidthDown: 1000, monthlyCost: 800, cidrOptions: ['/29', '/28'] },
    { id: 'isp_02', name: 'QuantumLink Fiber', bandwidthUp: 1000, bandwidthDown: 1000, monthlyCost: 2500, cidrOptions: ['/29', '/28', '/27'] },
    { id: 'isp_03', name: 'Starlight Business', bandwidthUp: 10000, bandwidthDown: 10000, monthlyCost: 9000, cidrOptions: ['/28', '/27', '/26'] },
];

export const SCRIPT_PERMISSIONS = {
    'read:server': 'Read server status and metrics',
    'write:server': 'Change server power state (reboot, shutdown)',
    'read:network': 'Read switch/router status and bandwidth',
    'read:power': 'Read PDU, generator, and battery status',
    'write:power': 'Change generator/battery power state',
    'read:cooling': 'Read CRAC status and temperature',
    'write:cooling': 'Change CRAC power state',
    'write:employee': 'Assign tasks to employees',
    'write:player:notify': 'Send toast notifications to the player',
    'write:player:alert': 'Send critical alerts to the player',
    'write:system:log': 'Write messages to the system log',
};

export const TASK_DEFINITIONS = [
    { id: 'unbox_rack', description: 'Unbox Server Rack', requiredSkill: 'Hardware Technician', requiredHardware: { 'rack_std_01': 1 }, durationMinutes: 30, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'rack_std_01' } },
    { id: 'unbox_server', description: 'Unbox Blade Server', requiredSkill: 'Hardware Technician', requiredHardware: { 'server_blade_g1': 1 }, durationMinutes: 15, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'server_blade_g1' } },
    { id: 'unbox_switch', description: 'Unbox Network Switch', requiredSkill: 'Hardware Technician', requiredHardware: { 'switch_48p': 1 }, durationMinutes: 15, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'switch_48p' } },
    { id: 'unbox_pdu', description: 'Unbox PDU', requiredSkill: 'Hardware Technician', requiredHardware: { 'pdu_basic_3kw': 1 }, durationMinutes: 10, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'pdu_basic_3kw' } },
    { id: 'unbox_crac', description: 'Unbox CRAC', requiredSkill: 'Hardware Technician', requiredHardware: { 'crac_10k_btu': 1 }, durationMinutes: 45, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'crac_10k_btu' } },
    { id: 'install_rack', description: 'Install Server Rack', requiredSkill: 'Hardware Technician', durationMinutes: 120, location: 'Server Room', needsStaged: 'rack_std_01', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'install_pdu', description: 'Install PDU', requiredSkill: 'Hardware Technician', durationMinutes: 60, location: 'Server Room', needsStaged: 'pdu_basic_3kw', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'install_crac', description: 'Install CRAC Unit', requiredSkill: 'Hardware Technician', durationMinutes: 240, location: 'Server Room', needsStaged: 'crac_10k_btu', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'connect_rack_power', description: 'Connect Rack to PDU', requiredSkill: 'Hardware Technician', durationMinutes: 20, location: 'Server Room', needsTarget: 'RACK_UNPOWERED', onCompleteEffect: { action: 'CONNECT_RACK_TO_PDU' } },
    { id: 'install_server', description: 'Install Blade Server', requiredSkill: 'Hardware Technician', durationMinutes: 60, location: 'Server Room', needsStaged: 'server_blade_g1', needsTarget: 'RACK_POWERED', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'install_switch', description: 'Install Network Switch', requiredSkill: 'Hardware Technician', durationMinutes: 45, location: 'Server Room', needsStaged: 'switch_48p', needsTarget: 'RACK_POWERED', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'bring_server_online', description: 'Power On Hardware', requiredSkill: 'Hardware Technician', durationMinutes: 5, location: 'Server Room', needsTarget: 'SERVER_INSTALLED', onCompleteEffect: { action: 'BRING_ONLINE' } },
    { id: 'config_lan', description: 'Configure Internal Network (LAN)', requiredSkill: 'Network Engineer', durationMinutes: 30, location: 'Server Room', needsTarget: 'SERVER_ONLINE', onCompleteEffect: { action: 'CONFIGURE_LAN' }},
    { id: 'config_wan', description: 'Assign Public IP (WAN)', requiredSkill: 'Network Engineer', durationMinutes: 15, location: 'Server Room', needsTarget: 'SERVER_LAN_CONFIGURED', onCompleteEffect: { action: 'CONFIGURE_WAN' }},
    { id: 'repair_hardware', description: 'Repair Failed Hardware', requiredSkill: 'Hardware Technician', durationMinutes: 180, location: 'Server Room', needsTarget: 'SERVER_FAILED', onCompleteEffect: { action: 'BRING_ONLINE' } },
];

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
    'DaemonManager': { title: 'Daemon Manager', icon: Icons.BotIcon, component: React.lazy(() => import('/src/apps/DaemonManager.jsx')) },
    'ScriptingGuide': { title: 'Scripting Guide', icon: Icons.BookIcon, component: React.lazy(() => import('/src/apps/ScriptingGuide.jsx')) },
};

