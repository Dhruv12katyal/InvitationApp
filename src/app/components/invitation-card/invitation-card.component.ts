import { Component, ElementRef, viewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  readonly letterRef = viewChild<ElementRef<HTMLElement>>('letter');
  readonly topBouquetRef = viewChild<ElementRef<HTMLElement>>('topBouquet');
  readonly bottomBouquetRef = viewChild<ElementRef<HTMLElement>>('bottomBouquet');

  private observer?: IntersectionObserver;
  private hasTriggeredConfetti = false;

  ngAfterViewInit(): void {
    const letterEl = this.letterRef()?.nativeElement;
    if (letterEl && typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasTriggeredConfetti) {
            this.hasTriggeredConfetti = true;
            this.fireBlessingsConfetti();
          }
        });
      }, { threshold: 0.2 });

      this.observer.observe(letterEl);
    }
  }

  fireBlessingsConfetti(): void {
    // Royal flower petal & gold sparkle shower
    confetti({
      particleCount: 45,
      spread: 80,
      origin: { y: 0.45 },
      colors: ['#D4AF37', '#FFD700', '#660033', '#8A0D4B', '#FFF3C4', '#F9EBF1'],
      shapes: ['circle'],
      scalar: 1.25
    });

    setTimeout(() => {
      confetti({
        particleCount: 35,
        spread: 105,
        origin: { y: 0.4 },
        colors: ['#D4AF37', '#C59B27', '#660033', '#FAF9F8'],
        shapes: ['circle'],
        scalar: 1.1
      });
    }, 260);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
