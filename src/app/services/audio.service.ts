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
  private wasPlayingBeforeLeaving = false;

  private readonly TARGET_VOLUME = 0.7;
  private readonly AUTO_DIM_DURATION_MS = 90000; // 90 seconds before gentle auto-dim

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audio = new Audio('assets/audio/sahilmadan-wedding-invitation-421393.mp3');
        this.audio.loop = true;
        this.audio.preload = 'none';
        this.audio.volume = 0; // Starts at 0 for smooth fade-in

        this.audio.addEventListener('play', () => this.isPlaying.set(true));
        this.audio.addEventListener('pause', () => this.isPlaying.set(false));
        this.audio.addEventListener('ended', () => this.isPlaying.set(false));

        // Comprehensive lifecycle listeners for lock screen, tab switch, app switch, backgrounding
        this.setupAppLifecycleListeners();
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

    try {
      this.audio.volume = 0;
    } catch (_) {}

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying.set(true);
          this.fadeVolume(0, this.TARGET_VOLUME, 1500);

          if (isEnvelopeTrigger && !this.userExplicitlyToggled) {
            this.resetAutoDimTimer();
          }
        })
        .catch((err) => {
          console.log('Audio playback waiting for user gesture:', err);
        });
    }
  }

  /**
   * Smoothly fades out volume and pauses
   */
  pause(fadeDurationMs = 1000): void {
    if (!this.audio || !this.isPlaying()) return;

    this.clearAutoDimTimer();
    this.cancelFade();

    const startVol = this.audio.volume;
    if (startVol <= 0.05 || fadeDurationMs <= 0) {
      this.instantStop();
      return;
    }

    this.fadeVolume(startVol, 0, fadeDurationMs, () => {
      this.instantStop();
    });
  }

  /**
   * Immediately stops audio with zero delay (used on lock screen, tab switch, app backgrounding)
   */
  instantStop(): void {
    if (!this.audio) return;
    this.cancelFade();
    this.clearAutoDimTimer();
    try {
      this.audio.pause();
      this.audio.volume = 0;
    } catch (_) {}
    this.isPlaying.set(false);
  }

  /**
   * User manual toggle button (Navbar or Drawer)
   */
  toggleMusic(): void {
    this.userExplicitlyToggled = true;
    this.clearAutoDimTimer();

    if (this.isPlaying()) {
      this.pause(800);
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
   * Ultra-smooth volume ramp using requestAnimationFrame with quadratic easing
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

      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentVol = clampedFrom + (clampedTo - clampedFrom) * ease;
      const safeVol = Math.max(0, Math.min(1, currentVol));

      try {
        this.audio.volume = safeVol;
        this.currentVolume.set(safeVol);
      } catch (_) {
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

  /**
   * Multi-Event Lifecycle Engine:
   * Instantly turns off audio when screen locks, browser minimizes, tab changes, or window blurs.
   * Resumes seamlessly when returning to the app if it was playing.
   */
  private setupAppLifecycleListeners(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const onAppLeave = () => {
      if (this.isPlaying()) {
        this.wasPlayingBeforeLeaving = true;
        this.instantStop(); // Immediate mute & pause, no background playing
      }
    };

    const onAppReturn = () => {
      if (this.wasPlayingBeforeLeaving && !document.hidden) {
        this.wasPlayingBeforeLeaving = false;
        this.play(false);
      }
    };

    // 1. Tab Switch / Screen Lock / Minimize (Standard)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        onAppLeave();
      } else {
        onAppReturn();
      }
    });

    // 2. Mobile Page Background / Navigation Away
    window.addEventListener('pagehide', () => {
      onAppLeave();
    });

    // 3. Browser Window Blur (Control center pulled, screen lock, app switcher)
    window.addEventListener('blur', () => {
      onAppLeave();
    });

    // 4. Browser Window Focus
    window.addEventListener('focus', () => {
      if (!document.hidden) {
        onAppReturn();
      }
    });

    // 5. Freeze / Unload Safeguards
    document.addEventListener('freeze', () => {
      onAppLeave();
    });

    window.addEventListener('beforeunload', () => {
      this.instantStop();
    });
  }

  private resetAutoDimTimer(): void {
    this.clearAutoDimTimer();
    this.autoDimTimer = setTimeout(() => {
      if (this.isPlaying() && !this.userExplicitlyToggled) {
        this.pause(2500);
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
