import React, { useState, useRef, useMemo } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const ACCENT_COLORS = [ { name: 'Blue', id: 'blue' }, { name: 'Green', id: 'green' }, { name: 'Red', id: 'red' }, { name: 'Purple', id: 'purple' }, { name: 'Orange', id: 'orange' } ];
const TASKBAR_POSITIONS = [ { name: 'Bottom', id: 'bottom' }, { name: 'Top', id: 'top' } ];

const SystemSettings = () => {
    const { saveGame, setTheme, setAccentColor, setTaskbarPosition } = useGameStore.getState();
    const theme = useGameStore(s => s.state.ui.desktopSettings.theme);
    const accentColor = useGameStore(s => s.state.ui.desktopSettings.accentColor);
    const taskbarPosition = useGameStore(s => s.state.ui.desktopSettings.taskbarPosition);
    const getFullState = () => useGameStore.getState().state;

    const [saveName, setSaveName] = useState('');
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

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
        const stateString = JSON.stringify(fullState, (key, value) => value instanceof Date ? value.toISOString() : value, 2);
        const blob = new Blob([stateString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-dump-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        useGameStore.getState().addEventLog("Debug dump downloaded.", "Player", "PLAYER");
    };

    return (
        <div className="p-4 bg-background text-foreground h-full overflow-y-auto">
            {modal.isOpen && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center text-white">
                        <h3 className="text-lg font-bold mb-2">{modal.title}</h3>
                        <p className="mb-4">{modal.message}</p>
                        <Button onClick={modal.onConfirm}>OK</Button>
                    </div>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">System Settings</h2>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Save Current Session</CardTitle></CardHeader>
                    <CardContent className="flex gap-2">
                        <Input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Enter save name..." />
                        <Button onClick={handleSave}>Save</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Color Theme</Label>
                            <div className="flex gap-2 mt-2">
                                <Button onClick={() => setTheme('dark')} variant={theme === 'dark' ? 'default' : 'outline'}>Dark</Button>
                                <Button onClick={() => setTheme('light')} variant={theme === 'light' ? 'default' : 'outline'}>Light</Button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="accent-color">Accent Color</Label>
                            <Select onValueChange={setAccentColor} value={accentColor}>
                                <SelectTrigger id="accent-color"><SelectValue placeholder="Select accent color..." /></SelectTrigger>
                                <SelectContent>
                                    {ACCENT_COLORS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="taskbar-pos">Taskbar Position</Label>
                            <Select onValueChange={setTaskbarPosition} value={taskbarPosition}>
                                <SelectTrigger id="taskbar-pos"><SelectValue placeholder="Select taskbar position..." /></SelectTrigger>
                                <SelectContent>
                                    {TASKBAR_POSITIONS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/50">
                    <CardHeader><CardTitle className="text-yellow-400">Debugging</CardTitle></CardHeader>
                    <CardContent>
                        <Button onClick={handleDebugDump} variant="destructive">Download Debug Dump</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SystemSettings;

