import { Audio } from 'expo-av';

// Sound effects for the app
class AudioService {
  private sounds: Map<string, Audio.Sound> = new Map();
  private initialized: boolean = false;
  private enabled: boolean = true;

  // Initialize audio service
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load success sound
      const successSound = new Audio.Sound();
      await successSound.loadAsync(require('../assets/sounds/beep.mp3'));
      this.sounds.set('success', successSound);

      // Load error sound
      const errorSound = new Audio.Sound();
      await errorSound.loadAsync(require('../assets/sounds/error.mp3'));
      this.sounds.set('error', errorSound);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }

  // Play a sound
  async playSound(type: 'success' | 'error'): Promise<void> {
    if (!this.enabled || !this.initialized) return;

    try {
      const sound = this.sounds.get(type);
      if (sound) {
        // Ensure sound is stopped first
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error(`Failed to play ${type} sound:`, error);
    }
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Clean up resources
  async unloadSounds(): Promise<void> {
    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export default new AudioService();