export type CalendarCategory = 'Blue' | 'Green' | 'Orange' | 'Purple' | 'Red' | 'Yellow';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format (24h)
  endTime: string; // HH:mm format (24h)
  location?: string;
  isTeamsMeeting?: boolean;
  attendees?: string[];
  category?: CalendarCategory;
  allDay?: boolean;
  notes: string;
}
