import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  readonly isPlaying = signal(false);
  readonly currentVolume = signal(0.7);

  private audio: HTMLAudioElement | null = null;
  private fadeAnimationId: number | null = null;
  private autoDimTimer: any = null;
  private userExplicitlyToggled = false;
  private wasPlayingBeforeTabHidden = false;

  private readonly TARGET_VOLUME = 0.7;
  private readonly AUTO_DIM_DURATION_MS = 90000; // 90 seconds before gentle auto-dim

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audio = new Audio('assets/audio/sahilmadan-wedding-invitation-421393.mp3');
        this.audio.loop = true;
        this.audio.preload = 'auto';
        this.audio.volume = 0; // Starts at 0 for smooth fade-in

        this.audio.addEventListener('play', () => this.isPlaying.set(true));
        this.audio.addEventListener('pause', () => this.isPlaying.set(false));
        this.audio.addEventListener('ended', () => this.isPlaying.set(false));

        this.setupTabVisibilityListener();
      } catch (e) {
        console.warn('AudioService initialization notice:', e);
      }
    }
  }

  /**
   * Starts music playback with a smooth 1.5s volume fade-in
   */
  play(isEnvelopeTrigger = false): void {
    if (!this.audio) return;

    this.cancelFade();

    // Ensure initial volume starts at 0 for fade-in (unless browser locks element volume)
    try {
      this.audio.volume = 0;
    } catch (_) {}

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying.set(true);
          // Smooth volume ramp up to TARGET_VOLUME over 1500ms
          this.fadeVolume(0, this.TARGET_VOLUME, 1500);

          if (isEnvelopeTrigger && !this.userExplicitlyToggled) {
            this.resetAutoDimTimer();
          }
        })
        .catch((err) => {
          console.log('Audio autoplay prevented, awaiting user interaction:', err);
        });
    }
  }

  /**
   * Smoothly fades out volume over 1200ms and pauses
   */
  pause(fadeDurationMs = 1200): void {
    if (!this.audio || !this.isPlaying()) return;

    this.clearAutoDimTimer();
    this.cancelFade();

    const startVol = this.audio.volume;
    if (startVol <= 0.05) {
      this.audio.pause();
      this.isPlaying.set(false);
      return;
    }

    this.fadeVolume(startVol, 0, fadeDurationMs, () => {
      if (this.audio) {
        this.audio.pause();
        this.isPlaying.set(false);
        try {
          this.audio.volume = 0;
        } catch (_) {}
      }
    });
  }

  /**
   * User manual toggle button (Navbar or Drawer)
   */
  toggleMusic(): void {
    this.userExplicitlyToggled = true;
    this.clearAutoDimTimer();

    if (this.isPlaying()) {
      this.pause(1000);
    } else {
      this.play(false);
    }
  }

  /**
   * Triggered when guest opens the entry envelope wax seal
   */
  onEnvelopeOpened(): void {
    if (!this.isPlaying()) {
      this.play(true);
    } else {
      this.fadeVolume(this.audio?.volume || 0, this.TARGET_VOLUME, 1000);
    }
  }

  onEnvelopeClosed(): void {
    if (this.isPlaying() && !this.userExplicitlyToggled) {
      this.pause(1500);
    }
  }

  /**
   * Ultra-smooth volume ramp using requestAnimationFrame with easing
   */
  private fadeVolume(fromVol: number, toVol: number, durationMs: number, onComplete?: () => void): void {
    if (!this.audio) {
      if (onComplete) onComplete();
      return;
    }

    this.cancelFade();

    const startTime = performance.now();
    const clampedFrom = Math.max(0, Math.min(1, fromVol));
    const clampedTo = Math.max(0, Math.min(1, toVol));

    const step = (currentTime: number) => {
      if (!this.audio) {
        if (onComplete) onComplete();
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth ease-in-out quadratic curve
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentVol = clampedFrom + (clampedTo - clampedFrom) * ease;
      const safeVol = Math.max(0, Math.min(1, currentVol));

      try {
        this.audio.volume = safeVol;
        this.currentVolume.set(safeVol);
      } catch (_) {
        // If device locks element volume (like some iOS versions), still report target
        this.currentVolume.set(safeVol);
      }

      if (progress < 1) {
        this.fadeAnimationId = requestAnimationFrame(step);
      } else {
        this.fadeAnimationId = null;
        try {
          this.audio.volume = clampedTo;
          this.currentVolume.set(clampedTo);
        } catch (_) {}
        if (onComplete) onComplete();
      }
    };

    this.fadeAnimationId = requestAnimationFrame(step);
  }

  private cancelFade(): void {
    if (this.fadeAnimationId !== null) {
      cancelAnimationFrame(this.fadeAnimationId);
      this.fadeAnimationId = null;
    }
  }

  private setupTabVisibilityListener(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.isPlaying()) {
          this.wasPlayingBeforeTabHidden = true;
          this.pause(500);
        }
      } else {
        if (this.wasPlayingBeforeTabHidden) {
          this.wasPlayingBeforeTabHidden = false;
          this.play(false);
        }
      }
    });
  }

  private resetAutoDimTimer(): void {
    this.clearAutoDimTimer();
    this.autoDimTimer = setTimeout(() => {
      if (this.isPlaying() && !this.userExplicitlyToggled) {
        this.pause(2500); // 2.5s gentle fade-out after 90s
      }
    }, this.AUTO_DIM_DURATION_MS);
  }

  private clearAutoDimTimer(): void {
    if (this.autoDimTimer) {
      clearTimeout(this.autoDimTimer);
      this.autoDimTimer = null;
    }
  }
}
