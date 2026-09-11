import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntryEnvelopeComponent } from './components/entry-envelope/entry-envelope.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { InvitationCardComponent } from './components/invitation-card/invitation-card.component';
import { CoupleComponent } from './components/couple/couple.component';
import { EventsComponent } from './components/events/events.component';
import { RsvpComponent } from './components/rsvp/rsvp.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    EntryEnvelopeComponent,
    NavbarComponent,
    HeroComponent,
    InvitationCardComponent,
    CoupleComponent,
    EventsComponent,
    // RsvpComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly hasEntered = signal(false);

  onEntryComplete(): void {
    this.hasEntered.set(true);
  }
}