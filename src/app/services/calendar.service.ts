import { Injectable } from '@angular/core';

export interface WeddingEventInfo {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  readonly events: Record<string, WeddingEventInfo> = {
    mehendi: {
      title: 'Sangeet / Mehandi Ceremony | Dhruv & Vaishnavi',
      description: 'Join us to celebrate the vibrant Sangeet & Mehandi ceremony of Dhruv & Vaishnavi with dance, dhol and henna! Traditional / Green attire.',
      location: 'White Rose Banquet, Ghaziabad',
      startDate: '20260116T123000Z',
      endDate: '20260116T180000Z'
    },
    haldi: {
      title: 'Haldi Ceremony | Dhruv & Vaishnavi',
      description: 'Auspicious Haldi ceremony of Dhruv & Vaishnavi with love, smiles and turmeric! Auspicious yellow attire.',
      location: 'At Home, Ghaziabad',
      startDate: '20260117T053000Z',
      endDate: '20260117T093000Z'
    },
    wedding: {
      title: 'Shubh Vivah (Wedding) | Dhruv & Vaishnavi',
      description: 'Baraat Assembly at 9:00 PM followed by Varmala, Dinner & Sacred Pheras. Traditional Indian attire.',
      location: 'Vasundhara Farm The Party Lawn, Vasundhara, Ghaziabad',
      startDate: '20260117T153000Z',
      endDate: '20260117T220000Z'
    }
  };

  getGoogleCalendarUrl(key: string): string {
    const event = this.events[key];
    if (!event) return '#';
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = [
      'text=' + encodeURIComponent(event.title),
      'dates=' + event.startDate + '/' + event.endDate,
      'details=' + encodeURIComponent(event.description),
      'location=' + encodeURIComponent(event.location)
    ];
    return baseUrl + '&' + params.join('&');
  }

  downloadIcs(key: string): void {
    const event = this.events[key];
    if (!event) return;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dhruv & Vaishnavi Wedding//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'SUMMARY:' + event.title,
      'DESCRIPTION:' + event.description,
      'LOCATION:' + event.location,
      'DTSTART:' + event.startDate,
      'DTEND:' + event.endDate,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', key + '-dhruv-vaishnavi-wedding.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}