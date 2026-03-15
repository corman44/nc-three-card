// Sound Manager for Three Card Game
// Uses Web Audio API to generate simple sound effects

class SoundManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.volume = 0.3; // Default volume (0-1)

        // Initialize AudioContext on first user interaction
        this.initialized = false;
    }

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Sound Manager initialized');
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Enable/disable all sounds
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // Set master volume (0-1)
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    // Play a tone with specific frequency and duration
    playTone(frequency, duration, type = 'sine', volume = 1) {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const finalVolume = this.volume * volume;
        gainNode.gain.setValueAtTime(finalVolume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    // Play multiple tones in sequence (melody)
    playMelody(notes, noteDuration = 0.15) {
        if (!this.enabled || !this.context) return;

        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playTone(note.freq, note.duration || noteDuration, note.type || 'sine', note.volume || 1);
            }, index * noteDuration * 1000);
        });
    }

    // === SIMPLE SOUNDS ===

    // Card select/click sound
    cardSelect() {
        this.playTone(800, 0.08, 'sine', 0.4);
    }

    // Card deselect sound
    cardDeselect() {
        this.playTone(600, 0.08, 'sine', 0.3);
    }

    // Button click sound
    buttonClick() {
        this.playTone(1000, 0.1, 'square', 0.2);
    }

    // Confirm/success sound
    confirm() {
        this.playMelody([
            { freq: 523, duration: 0.1 },
            { freq: 659, duration: 0.15 }
        ], 0.1);
    }

    // Error sound
    error() {
        this.playTone(200, 0.2, 'sawtooth', 0.3);
    }

    // === CARD EFFECT SOUNDS ===

    // Draw card effect
    effectDraw() {
        this.playMelody([
            { freq: 440, duration: 0.1, type: 'triangle' },
            { freq: 554, duration: 0.1, type: 'triangle' },
            { freq: 659, duration: 0.15, type: 'triangle' }
        ], 0.08);
    }

    // Swap card effect
    effectSwap() {
        this.playMelody([
            { freq: 659, duration: 0.1, type: 'sine' },
            { freq: 523, duration: 0.1, type: 'sine' },
            { freq: 659, duration: 0.1, type: 'sine' },
            { freq: 523, duration: 0.12, type: 'sine' }
        ], 0.1);
    }

    // Peek card effect
    effectPeek() {
        this.playMelody([
            { freq: 1047, duration: 0.08, type: 'sine', volume: 0.5 },
            { freq: 1175, duration: 0.08, type: 'sine', volume: 0.5 },
            { freq: 1319, duration: 0.15, type: 'sine', volume: 0.6 }
        ], 0.08);
    }

    // Attack effect
    effectAttack() {
        this.playMelody([
            { freq: 330, duration: 0.1, type: 'sawtooth' },
            { freq: 294, duration: 0.1, type: 'sawtooth' },
            { freq: 247, duration: 0.2, type: 'sawtooth' }
        ], 0.08);
    }

    // Defend/shield effect
    effectDefend() {
        this.playMelody([
            { freq: 392, duration: 0.15, type: 'square', volume: 0.4 },
            { freq: 523, duration: 0.2, type: 'square', volume: 0.5 }
        ], 0.12);
    }

    // Discard effect
    effectDiscard() {
        this.playMelody([
            { freq: 494, duration: 0.1, type: 'triangle' },
            { freq: 392, duration: 0.15, type: 'triangle' }
        ], 0.1);
    }

    // Turn start sound
    turnStart() {
        this.playMelody([
            { freq: 523, duration: 0.1 },
            { freq: 659, duration: 0.1 },
            { freq: 784, duration: 0.15 }
        ], 0.1);
    }

    // Turn end sound
    turnEnd() {
        this.playTone(440, 0.12, 'sine', 0.4);
    }

    // Game over/victory sound
    gameOver(victory = false) {
        if (victory) {
            this.playMelody([
                { freq: 523, duration: 0.15 },
                { freq: 659, duration: 0.15 },
                { freq: 784, duration: 0.15 },
                { freq: 1047, duration: 0.3 }
            ], 0.15);
        } else {
            this.playMelody([
                { freq: 494, duration: 0.2 },
                { freq: 392, duration: 0.2 },
                { freq: 330, duration: 0.3 }
            ], 0.2);
        }
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Initialize on first user interaction
document.addEventListener('click', () => {
    soundManager.init();
}, { once: true });
