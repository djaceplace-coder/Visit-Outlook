import { CalendarEvent } from '../types/calendar';

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Executive Design Review: Fluent Web Overhaul',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:30',
    location: 'Conference Room 4B / Microsoft Teams',
    isTeamsMeeting: true,
    attendees: ['sarah.jenkins@acmecorp.com', 'david.chen@acmecorp.com'],
    category: 'Blue',
    notes: 'Presenting the high-contrast light shell and unified ribbon controls.'
  },
  {
    id: '2',
    title: '1:1 Sync with Sarah Jenkins',
    date: new Date().toISOString().split('T')[0],
    startTime: '13:00',
    endTime: '14:00',
    location: 'Cafe Terra & Teams',
    isTeamsMeeting: true,
    attendees: ['sarah.jenkins@acmecorp.com'],
    category: 'Green',
    notes: 'Catch up on typography scale decisions and spacing tokens.'
  },
  {
    id: '3',
    title: 'Cloud Run SLA & Egress Review',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '14:30',
    endTime: '15:30',
    location: 'Executive Suite 8A',
    isTeamsMeeting: false,
    attendees: ['david.chen@acmecorp.com', 'marcus.v@acmecorp.com'],
    category: 'Purple',
    notes: 'Deep dive into container cold-start times and cache hit ratio.'
  }
];

const CALENDAR_KEY = 'outlook_test_calendar_events';
let inMemoryEvents: CalendarEvent[] = [...INITIAL_CALENDAR_EVENTS];

function loadStoredEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(CALENDAR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryEvents = parsed;
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable
  }
  return inMemoryEvents;
}

function saveStoredEvents(events: CalendarEvent[]): void {
  inMemoryEvents = events;
  try {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(events));
  } catch {
    // silent fallback
  }
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  return loadStoredEvents();
}

export async function insertCalendarEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
  const current = loadStoredEvents();
  const newEvent: CalendarEvent = {
    ...event,
    id: event.id || `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  };
  const updated = [...current, newEvent];
  saveStoredEvents(updated);
  return newEvent;
}

export async function updateCalendarEvent(event: CalendarEvent): Promise<boolean> {
  const current = loadStoredEvents();
  const updated = current.map(ev => ev.id === event.id ? event : ev);
  saveStoredEvents(updated);
  return true;
}

export async function deleteCalendarEvent(id: string): Promise<boolean> {
  const current = loadStoredEvents();
  const updated = current.filter(ev => ev.id !== id);
  saveStoredEvents(updated);
  return true;
}
