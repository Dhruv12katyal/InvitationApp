import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import confetti from 'canvas-confetti';

interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  badge?: string;
  isSpecial?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly audioService = inject(AudioService);
  readonly isScrolled = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly activeSection = signal('hero');

  private lastTriggeredSection = '';
  private lastTriggerTime = 0;

  readonly navItems: NavItem[] = [
    { id: 'hero', label: 'Home', shortLabel: 'Home', icon: '🏠' },
    { id: 'invitation-unfold', label: 'Royal Card', shortLabel: 'Patrika', icon: '✉️' },
    { id: 'events', label: 'Functions', shortLabel: 'Events', icon: '🗓️' },
    { id: 'couple', label: 'The Couple', shortLabel: 'Couple', icon: '👑' },
    { id: 'rsvp', label: 'WhatsApp RSVP', shortLabel: 'RSVP', icon: '💬', isSpecial: true }
  ];

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const currentId = entry.target.id;
              this.activeSection.set(currentId);

              // Automatic gentle petal shower on scrolling to each distinct section
              const now = Date.now();
              if (currentId !== this.lastTriggeredSection && now - this.lastTriggerTime > 1200) {
                this.lastTriggeredSection = currentId;
                this.lastTriggerTime = now;
                this.triggerSectionPetalShower();
              }
            }
          });
        },
        { threshold: 0.25, rootMargin: '-60px 0px -40% 0px' }
      );

      this.navItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) this.observer?.observe(el);
      });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 25);
    }
  }

  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isMobileMenuOpen.set(false);
    this.activeSection.set(sectionId);

    const targetEl = document.getElementById(sectionId);
    if (targetEl) {
      const navOffset = 75;
      const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      this.triggerSectionPetalShower();
    }
  }

  triggerSectionPetalShower(): void {
    confetti({
      particleCount: 40,
      spread: 75,
      origin: { y: 0.25 },
      colors: ['#660033', '#8A0D4B', '#D4AF37', '#FAF9F8', '#F9EBF1'],
      shapes: ['circle'],
      scalar: 1.2
    });
  }

  toggleMusic(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.audioService.toggleMusic();
  }

  toggleMobileMenu(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMobileMenuOpen.set(false);
  }
}