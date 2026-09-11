import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, OnDestroy {
  private intervalId: any = null;

  readonly countdown = signal({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  ngOnInit(): void {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    
    let target = new Date('2026-01-16T18:00:00+05:30').getTime();
    if (now > target) {
      target = new Date('2027-01-16T18:00:00+05:30').getTime();
    }

    const distance = target - now;

    if (distance <= 0) {
      this.countdown.set({ days: '00', hours: '00', minutes: '00', seconds: '00' });
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.countdown.set({
      days: days < 10 ? '0' + days : '' + days,
      hours: hours < 10 ? '0' + hours : '' + hours,
      minutes: minutes < 10 ? '0' + minutes : '' + minutes,
      seconds: seconds < 10 ? '0' + seconds : '' + seconds
    });
  }

  triggerFlowerShower(): void {
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#660033', '#8A0D4B', '#D4AF37', '#FAF9F8', '#F9EBF1'],
      shapes: ['circle'],
      scalar: 1.4,
      drift: 0.15
    });
  }
}