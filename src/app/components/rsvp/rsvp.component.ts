import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rsvp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rsvp.component.html',
  styleUrl: './rsvp.component.css'
})
export class RsvpComponent {
  guestName = '';
  guestCount = '2';
  attendingOption = 'all';
  specialNote = '';

  sendWhatsAppRsvp(): void {
    if (!this.guestName.trim()) return;

    let attendText = 'all wedding functions (Sangeet/Mehandi, Haldi & Shubh Vivah)';
    if (this.attendingOption === 'wedding') {
      attendText = 'Shubh Vivah (Wedding Night on 17th Jan)';
    } else if (this.attendingOption === 'mehendi-wedding') {
      attendText = 'Sangeet/Mehandi (16th Jan) and Shubh Vivah (17th Jan)';
    }

    const message = [
      `Namaste Dhruv & Vaishnavi! 🙏`,
      ``,
      `We are delighted to confirm our attendance for your wedding celebrations! ✨`,
      `👤 Guest Name: ${this.guestName.trim()}`,
      `👥 Attending Count: ${this.guestCount}`,
      `🎉 Functions: ${attendText}`,
      this.specialNote.trim() ? `💬 Note: ${this.specialNote.trim()}` : '',
      ``,
      `Wishing you both a wonderful wedding and lifetime of happiness! ❤️`
    ].filter(line => line !== '').join('\n');

    const whatsappUrl = `https://wa.me/919654571900?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
}