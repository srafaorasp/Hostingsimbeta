import React, { useState, useRef } from 'react';
import useGameStore from '/src/store/gameStore.js';

const THEMES = [ { name: 'Dark', id: 'dark' }, { name: 'Light', id: 'light' }, { name: 'Blue', id: 'blue' } ];

const SystemSettings = () => {
    const saveGame = useGameStore(state => state.saveGame);
    const setTheme = useGameStore(state => state.setTheme);
    const setWallpaper = useGameStore(state => state.setWallpaper);
    // --- THIS IS THE FIX ---
    // Corrected the selector to point to the new state structure for UI settings.
    const theme = useGameStore(state => state.state.ui.desktopSettings.theme);
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
        const stateString = JSON.stringify(fullState, (key, value) => value instanceof Date ? value.toISOString() : value, 2);
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
                        <button onClick={modal.onConfirm} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500">OK</button>
                    </div>
                </div>
            )}
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">System Settings</h2>
            <div className="bg-gray-900 p-3 rounded-md">
                <h3 className="font-bold text-lg mb-2">Save Current Session</h3>
                <div className="flex gap-2">
                    <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Enter save name..." className="flex-grow bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm" />
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm font-semibold hover:bg-blue-500">Save</button>
                </div>
            </div>
            <div className="bg-gray-900 p-3 rounded-md">
                <h3 className="font-bold text-lg mb-2">Color Theme</h3>
                <div className="flex gap-2">
                    {THEMES.map(themeOption => (
                        <button key={themeOption.id} onClick={() => setTheme(themeOption.id)} className={`px-4 py-2 rounded-md text-sm font-semibold ${theme === themeOption.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            {themeOption.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-gray-900 p-3 rounded-md">
                <h3 className="font-bold text-lg mb-2">Desktop Wallpaper</h3>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleWallpaperChange} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="bg-gray-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-600">Upload Custom Wallpaper</button>
            </div>
            <div className="bg-gray-900 p-3 rounded-md mt-auto">
                <h3 className="font-bold text-lg mb-2 text-yellow-400">Debugging</h3>
                <button onClick={handleDebugDump} className="bg-yellow-600 text-gray-900 px-4 py-2 rounded-md text-sm font-semibold hover:bg-yellow-500">Download Debug Dump</button>
            </div>
        </div>
    );
};

export default SystemSettings;

