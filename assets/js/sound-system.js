// Sound system for Outcrook email detective game
// Provides tactile audio feedback for user interactions

/**
 * Sound System Class
 * Generates procedural sounds using Web Audio API
 */
export class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3; // Default volume (0.0 to 1.0)
        this.soundsEnabled = false; // Disabled for now
        this.initializeAudioContext();
    }

    /**
     * Initialize Web Audio API context
     */
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.soundsEnabled = false;
        }
    }

    /**
     * Resume audio context if suspended (required for user interaction)
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Enable or disable sounds
     * @param {boolean} enabled - Whether sounds should play
     */
    setSoundsEnabled(enabled) {
        this.soundsEnabled = enabled;
    }

    /**
     * Play a button click sound
     */
    async playButtonClick() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a short, sharp click
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * Play a coin collection sound
     */
    async playCoinSound() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a pleasant "ding" sound
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    /**
     * Play an email notification sound
     */
    async playEmailNotification() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a gentle notification sound
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
        oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.25, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Play a folder navigation sound
     */
    async playFolderNavigation() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a subtle navigation sound
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * Play a reply sent sound
     */
    async playReplySent() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a satisfying "whoosh" sound
        oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.25);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.25);
    }

    /**
     * Play an error sound
     */
    async playErrorSound() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a low, warning sound
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.1);
        oscillator.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Play a success sound
     */
    async playSuccessSound() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create an uplifting success sound
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Play a typing sound
     */
    async playTypingSound() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a subtle typing sound
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(1000, this.audioContext.currentTime + 0.02);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    /**
     * Play a compose button sound
     */
    async playComposeSound() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a creative, inspiring sound
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.05);
        oscillator.frequency.linearRampToValueAtTime(1000, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.25, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * Play a multiple choice click sound (more clicky, like a mouse click)
     */
    async playMultipleChoiceClick() {
        if (!this.soundsEnabled || !this.audioContext) return;
        
        await this.resumeAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a sharp, clicky mouse-click sound
        oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.02);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.08);
    }
}

// Create global sound system instance
export const soundSystem = new SoundSystem();
