import React, { useState, useRef } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';


const SystemSettings = () => {
    // --- THIS IS THE FIX ---
    // 1. Use individual, granular selectors for each piece of reactive state.
    const theme = useGameStore(s => s.state.ui.desktopSettings.theme);
    const accentColor = useGameStore(s => s.state.ui.desktopSettings.accentColor);
    const taskbarPosition = useGameStore(s => s.state.ui.desktopSettings.taskbarPosition);

    // 2. Get stable actions non-reactively.
    const { saveGame, setTheme, setAccentColor, setTaskbarPosition, setWallpaper } = useGameStore.getState();
    const getFullState = () => useGameStore.getState().state;


    const [saveName, setSaveName] = useState('');
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const fileInputRef = useRef(null);

    const handleSave = () => {
        if (!saveName) {
            setModal({ isOpen: true, title: 'Error', message: 'Please enter a name for your save file.', onConfirm: () => setModal({ isOpen: false }) });
            return;
        }
        saveGame(saveName);
        setModal({ isOpen: true, title: 'Success', message: `Game saved as "${saveName}".`, onConfirm: () => setModal({ isOpen: false }) });
        setSaveName('');
    };

    const handleDebugDump = () => {
        const fullState = getFullState();
        const stateString = JSON.stringify(fullState, (key, value) => {
            if (value instanceof Map) {
                return Array.from(value.entries());
            }
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        }, 2);
        const blob = new Blob([stateString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-dump-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleWallpaperChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => setWallpaper(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full flex flex-col space-y-4">
            {modal.isOpen && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center text-white">
                        <h3 className="text-lg font-bold mb-2">{modal.title}</h3>
                        <p className="mb-4">{modal.message}</p>
                        <Button onClick={modal.onConfirm}>OK</Button>
                    </div>
                </div>
            )}
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">System Settings</h2>
            
            <Card className="bg-gray-900 border-gray-700">
                <CardHeader><CardTitle>Save Current Session</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Enter save name..." />
                        <Button onClick={handleSave}>Save</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
                 <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Color Theme</Label>
                        <Select onValueChange={setTheme} value={theme}>
                            <SelectTrigger><SelectValue placeholder="Select a theme" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="blue">Blue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Accent Color</Label>
                        <Select onValueChange={setAccentColor} value={accentColor}>
                            <SelectTrigger><SelectValue placeholder="Select an accent" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="blue">Blue</SelectItem>
                                <SelectItem value="green">Green</SelectItem>
                                <SelectItem value="red">Red</SelectItem>
                                <SelectItem value="purple">Purple</SelectItem>
                                <SelectItem value="orange">Orange</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Taskbar Position</Label>
                         <Select onValueChange={setTaskbarPosition} value={taskbarPosition}>
                            <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bottom">Bottom</SelectItem>
                                <SelectItem value="top">Top</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Desktop Wallpaper</Label>
                        <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleWallpaperChange} className="hidden" />
                        <Button onClick={() => fileInputRef.current.click()} variant="outline" className="w-full mt-2">Upload Custom Wallpaper</Button>
                    </div>
                 </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700 mt-auto">
                 <CardHeader><CardTitle className="text-yellow-400">Debugging</CardTitle></CardHeader>
                 <CardContent>
                    <Button onClick={handleDebugDump} variant="destructive">Download Debug Dump</Button>
                 </CardContent>
            </Card>
        </div>
    );
};

export default SystemSettings;

