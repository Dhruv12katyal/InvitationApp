import { Component, inject, signal, output, ElementRef, viewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import confetti from 'canvas-confetti';
import gsap from 'gsap';

@Component({
  selector: 'app-entry-envelope',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entry-envelope.component.html',
  styleUrl: './entry-envelope.component.css'
})
export class EntryEnvelopeComponent implements AfterViewInit, OnDestroy {
  readonly audioService = inject(AudioService);

  readonly isOpening = signal(false);
  readonly isDismissed = signal(false);
  readonly completed = output<void>();

  readonly overlayRef = viewChild<ElementRef<HTMLElement>>('overlay');
  readonly stageRef = viewChild<ElementRef<HTMLElement>>('stage');
  readonly headerTextRef = viewChild<ElementRef<HTMLElement>>('headerText');
  readonly envelopeBoxRef = viewChild<ElementRef<HTMLElement>>('envelopeBox');
  readonly flapRef = viewChild<ElementRef<HTMLElement>>('flap');
  readonly sealRef = viewChild<ElementRef<HTMLElement>>('seal');
  readonly weddingCardRef = viewChild<ElementRef<HTMLElement>>('weddingCard');
  readonly pocketRef = viewChild<ElementRef<HTMLElement>>('pocket');
  readonly topBouquetRef = viewChild<ElementRef<HTMLElement>>('topBouquet');
  readonly bottomBouquetRef = viewChild<ElementRef<HTMLElement>>('bottomBouquet');
  readonly bottomPromptRef = viewChild<ElementRef<HTMLElement>>('bottomPrompt');

  private timeline?: gsap.core.Timeline;
  private pulseAnim?: gsap.core.Tween;

  ngAfterViewInit(): void {
    const sealEl = this.sealRef()?.nativeElement;
    if (sealEl) {
      this.pulseAnim = gsap.to(sealEl, {
        scale: 1.05,
        repeat: -1,
        yoyo: true,
        duration: 1.6,
        ease: 'sine.inOut'
      });
    }

    // Set initial card state (tucked & hidden)
    const cardEl = this.weddingCardRef()?.nativeElement;
    if (cardEl) {
      gsap.set(cardEl, {
        top: '50%',
        left: '50%',
        xPercent: -50,
        yPercent: -50,
        y: 40,
        scale: 0.75,
        autoAlpha: 0
      });
    }
  }

  openCard(): void {
    if (this.isOpening() || this.isDismissed()) return;
    this.isOpening.set(true);

    this.pulseAnim?.kill();

    // 1. Start Soulful Wedding Background Music Track
    this.audioService.onEnvelopeOpened();

    // 2. Master GSAP Choreography Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        this.enterCelebrations();
      }
    });
    this.timeline = tl;

    const sealEl = this.sealRef()?.nativeElement;
    const flapEl = this.flapRef()?.nativeElement;
    const cardEl = this.weddingCardRef()?.nativeElement;
    const pocketEl = this.pocketRef()?.nativeElement;
    const envelopeBoxEl = this.envelopeBoxRef()?.nativeElement;
    const stageEl = this.stageRef()?.nativeElement;
    const headerEl = this.headerTextRef()?.nativeElement;
    const promptEl = this.bottomPromptRef()?.nativeElement;
    const topBouquetEl = this.topBouquetRef()?.nativeElement;
    const bottomBouquetEl = this.bottomBouquetRef()?.nativeElement;

    // Phase 1: Fade out headers & prompt, crack the wax seal with gleam
    if (promptEl) {
      tl.to(promptEl, { autoAlpha: 0, y: 10, duration: 0.3, ease: 'power2.out' }, 0);
    }
    if (headerEl) {
      tl.to(headerEl, { autoAlpha: 0, y: -15, duration: 0.6, ease: 'power2.out' }, 0.1);
    }

    if (sealEl) {
      tl.to(sealEl, {
        scale: 1.25,
        filter: 'brightness(1.5)',
        duration: 0.35,
        ease: 'power2.out',
        onStart: () => this.fireConfettiWave1()
      }, 0)
      .to(sealEl, {
        autoAlpha: 0,
        scale: 0.3,
        duration: 0.35,
        ease: 'power2.in'
      }, 0.35);
    }

    // Phase 2: Top Flap 3D Unfolds Upwards
    if (flapEl) {
      tl.to(flapEl, {
        rotateX: -180,
        transformOrigin: 'top center',
        duration: 2.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (tl.progress() > 0.45 && flapEl) {
            flapEl.style.zIndex = '2';
          }
        }
      }, 0.3);
    }

    // Phase 3: Corner Flower Bouquets Gracefully Fade & Scale Away
    if (topBouquetEl) {
      tl.to(topBouquetEl, {
        autoAlpha: 0,
        scale: 0.75,
        y: -30,
        x: 30,
        duration: 1.0,
        ease: 'power2.inOut'
      }, 0.4);
    }
    if (bottomBouquetEl) {
      tl.to(bottomBouquetEl, {
        autoAlpha: 0,
        scale: 0.75,
        y: 30,
        x: -30,
        duration: 1.0,
        ease: 'power2.inOut'
      }, 0.4);
    }

    // Phase 4: GRAND WEDDING INVITATION CARD ROLLS OUT INTO EXACT VIEWPORT CENTER
    if (cardEl) {
      tl.to(cardEl,
        {
          top: '50%',
          left: '50%',
          xPercent: -50,
          yPercent: -50,
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 2.2,
          ease: 'power3.out',
          onStart: () => this.fireConfettiWave2()
        },
        0.7
      );
    }

    // Phase 5: DIM SLEEVE POUCH & BACKGROUND TO MINIMAL OPACITY
    if (pocketEl) {
      tl.to(pocketEl, {
        opacity: 0.05,
        duration: 1.6,
        ease: 'power1.out'
      }, 1.1);
    }
    if (flapEl) {
      tl.to(flapEl, {
        opacity: 0.05,
        duration: 1.6,
        ease: 'power1.out'
      }, 1.1);
    }

    // Phase 6: Celebratory golden & rose confetti wave as card reaches full glory
    tl.call(() => this.fireConfettiWave3(), undefined, 2.3);

    // Phase 7: Reading hold duration (2s) before auto-transitioning
    tl.to({}, { duration: 2.0 });
  }

  private fireConfettiWave1(): void {
    confetti({
      particleCount: 70,
      spread: 90,
      origin: { y: 0.52 },
      colors: ['#660033', '#8A0D4B', '#D4AF37', '#FAF9F8', '#F9EBF1'],
      shapes: ['circle'],
      scalar: 1.25
    });
  }

  private fireConfettiWave2(): void {
    confetti({
      particleCount: 90,
      spread: 125,
      origin: { y: 0.38 },
      colors: ['#D4AF37', '#FFF3C4', '#660033', '#8A0D4B', '#FAF9F8'],
      shapes: ['circle'],
      scalar: 1.3
    });
  }

  private fireConfettiWave3(): void {
    confetti({
      particleCount: 65,
      spread: 105,
      origin: { y: 0.22 },
      colors: ['#D4AF37', '#FFD700', '#660033', '#FAF9F8', '#F9EBF1'],
      shapes: ['circle'],
      scalar: 1.15
    });
  }

  enterCelebrations(): void {
    if (this.isDismissed()) return;
    this.isDismissed.set(true);
    this.completed.emit();

    const overlayEl = this.overlayRef()?.nativeElement;
    if (overlayEl) {
      gsap.to(overlayEl, {
        autoAlpha: 0,
        scale: 1.05,
        duration: 2.0,
        ease: 'power2.inOut',
        onComplete: () => {
          const heroEl = document.getElementById('hero');
          if (heroEl) {
            heroEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.pulseAnim?.kill();
    this.timeline?.kill();
  }
}
