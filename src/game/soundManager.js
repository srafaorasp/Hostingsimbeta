import * as Tone from 'tone';

// This flag prevents Tone.js from starting until the first user interaction
let audioStarted = false;

// --- Sound Definitions ---
// We use synthesizers to generate sounds programmatically, avoiding external files.

// A simple, short click for UI interactions
const clickSynth = new Tone.MembraneSynth({
	pitchDecay: 0.01,
	octaves: 2,
	envelope: {
		attack: 0.001,
		decay: 0.2,
		sustain: 0,
	},
}).toDestination();

// A slightly more complex sound for opening windows
const openSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 },
}).toDestination();

// A sound for closing windows
const closeSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.1 },
}).toDestination();


const sounds = {
    ui_click: () => clickSynth.triggerAttackRelease('C2', '8n'),
    window_open: () => openSynth.triggerAttackRelease('C4', '16n', Tone.now()),
    window_close: () => closeSynth.triggerAttackRelease('G3', '16n', Tone.now()),
    achievement: () => {
        const now = Tone.now();
        openSynth.triggerAttackRelease("C5", "8n", now);
        openSynth.triggerAttackRelease("G5", "8n", now + 0.2);
    }
};

// --- Main Exported Function ---
export const playSound = (soundName) => {
    // Tone.js requires a user interaction to start the audio context.
    // We ensure it's started before trying to play any sound.
    if (!audioStarted) {
        Tone.start();
        audioStarted = true;
        console.log("Audio context started.");
    }

    if (sounds[soundName]) {
        sounds[soundName]();
    } else {
        console.warn(`Sound not found: ${soundName}`);
    }
};
