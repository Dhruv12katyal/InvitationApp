import { Component, inject, signal, ElementRef, viewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import confetti from 'canvas-confetti';
import gsap from 'gsap';

@Component({
  selector: 'app-invitation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invitation-card.component.html',
  styleUrl: './invitation-card.component.css'
})
export class InvitationCardComponent implements AfterViewInit, OnDestroy {
  readonly audioService = inject(AudioService);
  readonly isEnvelopeOpen = signal(false);

  readonly envelopeBoxRef = viewChild<ElementRef<HTMLElement>>('envelopeBox');
  readonly flapRef = viewChild<ElementRef<HTMLElement>>('flap');
  readonly sealRef = viewChild<ElementRef<HTMLElement>>('seal');
  readonly letterRef = viewChild<ElementRef<HTMLElement>>('letter');
  readonly pocketRef = viewChild<ElementRef<HTMLElement>>('pocket');
  readonly topBouquetRef = viewChild<ElementRef<HTMLElement>>('topBouquet');
  readonly bottomBouquetRef = viewChild<ElementRef<HTMLElement>>('bottomBouquet');

  private pulseAnim?: gsap.core.Tween;
  private openTimeline?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    const sealEl = this.sealRef()?.nativeElement;
    if (sealEl) {
      this.pulseAnim = gsap.to(sealEl, {
        scale: 1.05,
        repeat: -1,
        yoyo: true,
        duration: 1.8,
        ease: 'sine.inOut'
      });
    }

    // Set initial hidden letter state
    const letterEl = this.letterRef()?.nativeElement;
    if (letterEl) {
      gsap.set(letterEl, {
        y: 45,
        scale: 0.94,
        autoAlpha: 0,
        display: 'none'
      });
    }
  }

  toggleEnvelope(): void {
    if (this.isEnvelopeOpen()) {
      this.closeEnvelope();
    } else {
      this.openEnvelope();
    }
  }

  openEnvelope(): void {
    if (this.isEnvelopeOpen()) return;

    this.pulseAnim?.kill();

    this.audioService.onEnvelopeOpened();

    const sealEl = this.sealRef()?.nativeElement;
    const flapEl = this.flapRef()?.nativeElement;
    const letterEl = this.letterRef()?.nativeElement;
    const envelopeBoxEl = this.envelopeBoxRef()?.nativeElement;
    const topBouquetEl = this.topBouquetRef()?.nativeElement;
    const bottomBouquetEl = this.bottomBouquetRef()?.nativeElement;

    // Master Slow & Steady Opening Timeline
    const tl = gsap.timeline();
    this.openTimeline = tl;

    // Phase 1: Seal gleams and fades away cleanly
    if (sealEl) {
      tl.to(sealEl, {
        scale: 1.25,
        filter: 'brightness(1.5)',
        duration: 0.35,
        ease: 'power2.out',
        onStart: () => this.fireOpeningConfettiWave1()
      }, 0)
      .to(sealEl, {
        autoAlpha: 0,
        scale: 0.3,
        duration: 0.35,
        ease: 'power2.in'
      }, 0.35);
    }

    // Phase 2: Flap rotates up in 3D (2.2s)
    if (flapEl) {
      tl.to(flapEl, {
        rotateX: -180,
        transformOrigin: 'top center',
        duration: 2.2,
        ease: 'power2.inOut'
      }, 0.3);
    }

    // Phase 3: Corner Flower Bouquets Gracefully Fade Away
    if (topBouquetEl) {
      tl.to(topBouquetEl, {
        autoAlpha: 0,
        scale: 0.7,
        y: -25,
        x: 25,
        duration: 1.2,
        ease: 'power2.out'
      }, 0.4);
    }
    if (bottomBouquetEl) {
      tl.to(bottomBouquetEl, {
        autoAlpha: 0,
        scale: 0.7,
        y: 25,
        x: -25,
        duration: 1.2,
        ease: 'power2.out'
      }, 0.4);
    }

    // Phase 4: Envelope base dims to low background opacity
    if (envelopeBoxEl) {
      tl.to(envelopeBoxEl, {
        opacity: 0.15,
        duration: 1.5,
        ease: 'power2.inOut'
      }, 1.0);
    }

    // Phase 5: Letter glides in steadily
    if (letterEl) {
      gsap.set(letterEl, { display: 'block' });

      tl.fromTo(letterEl,
        { y: 55, scale: 0.92, autoAlpha: 0, rotateX: 6 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          rotateX: 0,
          duration: 2.5,
          ease: 'power3.out',
          onStart: () => {
            this.isEnvelopeOpen.set(true);
            this.fireOpeningConfettiWave2();
          }
        },
        0.9
      );
    }

    // Phase 6: Celebratory flower petal shower
    tl.call(() => this.fireOpeningConfettiWave3(), undefined, 2.7);
  }

  closeEnvelope(): void {
    if (!this.isEnvelopeOpen()) return;
    this.openTimeline?.kill();
    this.audioService.onEnvelopeClosed();

    const sealEl = this.sealRef()?.nativeElement;
    const flapEl = this.flapRef()?.nativeElement;
    const letterEl = this.letterRef()?.nativeElement;
    const envelopeBoxEl = this.envelopeBoxRef()?.nativeElement;
    const topBouquetEl = this.topBouquetRef()?.nativeElement;
    const bottomBouquetEl = this.bottomBouquetRef()?.nativeElement;

    const closeTl = gsap.timeline({
      onComplete: () => {
        this.isEnvelopeOpen.set(false);
        if (letterEl) gsap.set(letterEl, { display: 'none' });
        // Restart pulse on seal
        if (sealEl) {
          this.pulseAnim = gsap.to(sealEl, {
            scale: 1.05,
            repeat: -1,
            yoyo: true,
            duration: 1.8,
            ease: 'sine.inOut'
          });
        }
      }
    });

    // Re-fold letter back into envelope
    if (letterEl) {
      closeTl.to(letterEl, { y: 45, scale: 0.94, autoAlpha: 0, duration: 1.2, ease: 'power2.inOut' }, 0);
    }
    if (envelopeBoxEl) {
      closeTl.to(envelopeBoxEl, { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' }, 0.3);
    }
    if (flapEl) {
      closeTl.to(flapEl, { rotateX: 0, duration: 1.6, ease: 'power2.inOut' }, 0.5);
    }
    if (sealEl) {
      closeTl.to(sealEl, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 1.3);
    }
    if (topBouquetEl) {
      closeTl.to(topBouquetEl, { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 1.0, ease: 'power2.out' }, 1.0);
    }
    if (bottomBouquetEl) {
      closeTl.to(bottomBouquetEl, { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 1.0, ease: 'power2.out' }, 1.0);
    }
  }

  private fireOpeningConfettiWave1(): void {
    confetti({
      particleCount: 60,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#660033', '#8A0D4B', '#D4AF37', '#FAF9F8', '#F9EBF1'],
      shapes: ['circle'],
      scalar: 1.3
    });
  }

  private fireOpeningConfettiWave2(): void {
    confetti({
      particleCount: 80,
      spread: 120,
      origin: { y: 0.42 },
      colors: ['#D4AF37', '#FFF3C4', '#660033', '#8A0D4B', '#FAF9F8'],
      shapes: ['circle'],
      scalar: 1.35
    });
  }

  private fireOpeningConfettiWave3(): void {
    confetti({
      particleCount: 65,
      spread: 110,
      origin: { y: 0.30 },
      colors: ['#D4AF37', '#FFD700', '#660033', '#FAF9F8', '#F9EBF1'],
      shapes: ['circle'],
      scalar: 1.2
    });
  }

  ngOnDestroy(): void {
    this.pulseAnim?.kill();
    this.openTimeline?.kill();
  }
}
