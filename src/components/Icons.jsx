import React from 'react';
import { 
    Folder, Camera, Terminal, Users, Calendar, LayoutGrid, 
    Power, Globe, AlertTriangle, Settings, Wifi, Battery, 
    Code, Bot, Book, LineChart, Trophy 
} from 'lucide-react';

const iconMap = {
    FolderIcon: Folder,
    CameraIcon: Camera,
    TerminalIcon: Terminal,
    UsersIcon: Users,
    CalendarIcon: Calendar,
    LayoutIcon: LayoutGrid,
    PowerIcon: Power,
    GlobeIcon: Globe,
    AlertIcon: AlertTriangle,
    SettingsIcon: Settings,
    WifiIcon: Wifi,
    BatteryIcon: Battery,
    CodeIcon: Code,
    BotIcon: Bot,
    BookIcon: Book,
    LineChartIcon: LineChart,
    TrophyIcon: Trophy,
};

// To simplify usage, we export each icon directly
export const {
    FolderIcon, CameraIcon, TerminalIcon, UsersIcon, CalendarIcon, LayoutIcon,
    PowerIcon, GlobeIcon, AlertIcon, SettingsIcon, WifiIcon, BatteryIcon,
    CodeIcon, BotIcon, BookIcon, LineChartIcon, TrophyIcon
} = iconMap;

// And also as a default export object for convenience
export default iconMap;

