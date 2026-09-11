import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  readonly isPlaying = signal(false);
  readonly currentVolume = signal(0.65);
  readonly isMutedByFocusZone = signal(false);

  private audio: HTMLAudioElement | null = null;
  private fadeInterval: any = null;
  private autoDimTimer: any = null;
  private userExplicitlyToggled = false;
  private activeSection = 'hero';
  private wasPlayingBeforeTabHidden = false;

  // Configuration
  private readonly DEFAULT_TARGET_VOLUME = 0.65;
  private readonly RSVP_WHISPER_VOLUME = 0.15;
  private readonly AUTO_DIM_DURATION_MS = 90000; // 90 seconds of music before gentle auto-fade

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audio = new Audio('assets/audio/sahilmadan-wedding-invitation-421393.mp3');
        this.audio.loop = true;
        this.audio.volume = 0; // Starts at 0 for graceful fade-ins
        this.audio.preload = 'auto';

        this.audio.addEventListener('play', () => this.isPlaying.set(true));
        this.audio.addEventListener('pause', () => this.isPlaying.set(false));
        this.audio.addEventListener('ended', () => this.isPlaying.set(false));

        // 1. Tab Visibility Change (Auto-pause when leaving tab, resume when returning)
        this.setupTabVisibilityListener();

        // 2. Scroll Section Intelligence (Auto-dim in RSVP section)
        this.setupScrollZoneListener();
      } catch (e) {
        console.warn('AudioService initialization warning:', e);
      }
    }
  }

  /**
   * Gracefully starts music with a smooth 1.8s volume fade-in
   * @param isEnvelopeTrigger Set to true when called during envelope opening ceremony
   */
  play(isEnvelopeTrigger = false): void {
    if (!this.audio) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    const targetVol = this.activeSection === 'rsvp' ? this.RSVP_WHISPER_VOLUME : this.DEFAULT_TARGET_VOLUME;

    // Start playback
    this.audio.play().then(() => {
      this.isPlaying.set(true);
      this.fadeVolume(0, targetVol, 1800);

      // If triggered by envelope opening, start the 90-second gentle auto-dim timer
      if (isEnvelopeTrigger && !this.userExplicitlyToggled) {
        this.resetAutoDimTimer();
      }
    }).catch(err => {
      console.log('Audio playback notice (waiting for user gesture):', err);
    });
  }

  /**
   * Gracefully stops music with a smooth 1.5s volume fade-out
   */
  pause(fadeDuration = 1500): void {
    if (!this.audio || !this.isPlaying()) return;

    this.clearAutoDimTimer();
    this.fadeVolume(this.audio.volume, 0, fadeDuration, () => {
      if (this.audio) {
        this.audio.pause();
        this.isPlaying.set(false);
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
      this.pause(1200);
    } else {
      this.play(false);
    }
  }

  /**
   * Called when guest enters or folds an envelope
   */
  onEnvelopeOpened(): void {
    if (!this.isPlaying()) {
      this.play(true);
    } else {
      // Swell volume to full if it was ducked
      this.fadeVolume(this.audio?.volume || 0, this.DEFAULT_TARGET_VOLUME, 1200);
    }
  }

  onEnvelopeClosed(): void {
    if (this.isPlaying() && !this.userExplicitlyToggled) {
      this.pause(1800);
    }
  }

  /**
   * Section-Aware Audio Zone handler
   */
  updateActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
    if (!this.audio || !this.isPlaying()) return;

    if (sectionId === 'rsvp') {
      // Whisper focus mode for RSVP form
      this.isMutedByFocusZone.set(true);
      this.fadeVolume(this.audio.volume, this.RSVP_WHISPER_VOLUME, 1600);
    } else {
      // Emotional zone: Restore full royal volume
      if (this.isMutedByFocusZone()) {
        this.isMutedByFocusZone.set(false);
        this.fadeVolume(this.audio.volume, this.DEFAULT_TARGET_VOLUME, 1600);
      }
    }
  }

  /**
   * Smooth volume ramping engine (exponential & linear blend)
   */
  private fadeVolume(fromVol: number, toVol: number, durationMs: number, onComplete?: () => void): void {
    if (!this.audio) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    const steps = 30;
    const stepDuration = durationMs / steps;
    const volumeStep = (toVol - fromVol) / steps;
    let currentStep = 0;

    this.audio.volume = Math.max(0, Math.min(1, fromVol));

    this.fadeInterval = setInterval(() => {
      if (!this.audio) {
        clearInterval(this.fadeInterval);
        return;
      }

      currentStep++;
      const nextVol = Math.max(0, Math.min(1, fromVol + (volumeStep * currentStep)));
      this.audio.volume = nextVol;
      this.currentVolume.set(nextVol);

      if (currentStep >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.audio.volume = Math.max(0, Math.min(1, toVol));
        this.currentVolume.set(toVol);
        if (onComplete) onComplete();
      }
    }, stepDuration);
  }

  /**
   * Tab Visibility handler
   */
  private setupTabVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.isPlaying()) {
          this.wasPlayingBeforeTabHidden = true;
          this.pause(800);
        }
      } else {
        if (this.wasPlayingBeforeTabHidden) {
          this.wasPlayingBeforeTabHidden = false;
          this.play(false);
        }
      }
    });
  }

  /**
   * Scroll Section Zone Tracker
   */
  private setupScrollZoneListener(): void {
    if (typeof window === 'undefined') return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.checkCurrentScrollSection();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  private checkCurrentScrollSection(): void {
    const sections = ['hero', 'invitation-unfold', 'couple', 'events', 'rsvp'];
    const scrollPos = window.scrollY + (window.innerHeight * 0.4);

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          if (this.activeSection !== id) {
            this.updateActiveSection(id);
          }
          break;
        }
      }
    }
  }

  private resetAutoDimTimer(): void {
    this.clearAutoDimTimer();
    this.autoDimTimer = setTimeout(() => {
      if (this.isPlaying() && !this.userExplicitlyToggled) {
        this.pause(3000); // 3-second ultra-gentle fade-out
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
