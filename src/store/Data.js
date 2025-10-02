export const PRIORITIES = { Emergency: 4, High: 3, Normal: 2, Low: 1 };

export const PRIORITY_COLORS = { Emergency: 'bg-red-600', High: 'bg-orange-500', Normal: 'bg-yellow-500', Low: 'bg-green-600' };

export const HARDWARE_CATALOG = [
    { id: 'rack_std_01', name: 'Standard Server Rack', price: 1500, type: 'RACK' },
    { id: 'server_blade_g1', name: 'Blade Server G1', price: 2500, type: 'SERVER', powerDraw: 450, heatOutput: 1535, bandwidth: 10 },
    { id: 'switch_48p', name: '48-Port Network Switch', price: 800, type: 'NETWORKING', powerDraw: 100, heatOutput: 341, bandwidthCapacity: 480 },
    { id: 'pdu_basic_3kw', name: 'PDU 3kW', price: 400, type: 'PDU', powerCapacity: 3000 },
    { id: 'crac_10k_btu', name: 'CRAC Unit 10k BTU', price: 6000, type: 'CRAC', coolingCapacity: 10000, powerDraw: 1200 },
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

export const TASK_DEFINITIONS = [
    { id: 'unbox_rack', description: 'Unbox Server Rack', requiredSkill: 'Hardware Technician', requiredHardware: { 'rack_std_01': 1 }, durationMinutes: 30, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'rack_std_01' } },
    { id: 'unbox_server', description: 'Unbox Blade Server', requiredSkill: 'Hardware Technician', requiredHardware: { 'server_blade_g1': 1 }, durationMinutes: 15, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'server_blade_g1' } },
    { id: 'unbox_switch', description: 'Unbox Network Switch', requiredSkill: 'Hardware Technician', requiredHardware: { 'switch_48p': 1 }, durationMinutes: 15, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'switch_48p' } },
    { id: 'unbox_pdu', description: 'Unbox PDU', requiredSkill: 'Hardware Technician', requiredHardware: { 'pdu_basic_3kw': 1 }, durationMinutes: 10, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'pdu_basic_3kw' } },
    { id: 'unbox_crac', description: 'Unbox CRAC', requiredSkill: 'Hardware Technician', requiredHardware: { 'crac_10k_btu': 1 }, durationMinutes: 45, location: 'Tech Room', onCompleteEffect: { action: 'STAGE_HARDWARE', item: 'crac_10k_btu' } },
    { id: 'install_rack', description: 'Install Server Rack', requiredSkill: 'Hardware Technician', durationMinutes: 120, location: 'Server Room', needsStaged: 'rack_std_01', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'install_pdu', description: 'Install PDU', requiredSkill: 'Hardware Technician', durationMinutes: 60, location: 'Server Room', needsStaged: 'pdu_basic_3kw', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'install_crac', description: 'Install CRAC Unit', requiredSkill: 'Hardware Technician', durationMinutes: 240, location: 'Server Room', needsStaged: 'crac_10k_btu', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'connect_rack_power', description: 'Connect Rack to PDU', requiredSkill: 'Hardware Technician', durationMinutes: 20, location: 'Server Room', needsTarget: 'RACK_UNPOWERED', onJustCompleteEffect: { action: 'CONNECT_RACK_TO_PDU' } },
    { id: 'install_server', description: 'Install Blade Server', requiredSkill: 'Hardware Technician', durationMinutes: 60, location: 'Server Room', needsStaged: 'server_blade_g1', needsTarget: 'RACK_POWERED', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'install_switch', description: 'Install Network Switch', requiredSkill: 'Hardware Technician', durationMinutes: 45, location: 'Server Room', needsStaged: 'switch_48p', needsTarget: 'RACK_POWERED', onCompleteEffect: { action: 'INSTALL_HARDWARE' } },
    { id: 'bring_server_online', description: 'Power On Server', requiredSkill: 'Hardware Technician', durationMinutes: 5, location: 'Server Room', needsTarget: 'SERVER_INSTALLED', onCompleteEffect: { action: 'BRING_ONLINE' } },
    { id: 'config_network', description: 'Configure Network for Server', requiredSkill: 'Network Engineer', durationMinutes: 30, location: 'Server Room', needsTarget: 'SERVER_ONLINE', onCompleteEffect: { action: 'CONFIGURE_NETWORK' }},
    { id: 'repair_hardware', description: 'Repair Failed Hardware', requiredSkill: 'Hardware Technician', durationMinutes: 180, location: 'Server Room', needsTarget: 'SERVER_FAILED', onCompleteEffect: { action: 'BRING_ONLINE' } },
];
