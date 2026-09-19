import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  AlignLeft, 
  Calendar as CalendarIcon, 
  X,
  Trash2,
  Video,
  MapPin,
  Users,
  Tag,
  Check,
  CheckSquare,
  Menu
} from 'lucide-react';
import { CalendarEvent, CalendarCategory } from '../../types/calendar';
import { 
  fetchCalendarEvents, 
  insertCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  INITIAL_CALENDAR_EVENTS 
} from '../../lib/calendarService';

type ViewMode = 'day' | 'workweek' | 'week' | 'month';

export interface CalendarSectionProps {
  prefillEvent?: { title?: string; attendees?: string[] } | null;
  onClearPrefillEvent?: () => void;
  searchQuery?: string;
}

export function CalendarSection({ prefillEvent, onClearPrefillEvent, searchQuery = '' }: CalendarSectionProps = {}) {
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [view, setView] = useState<ViewMode>('workweek');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Load events on mount
  useEffect(() => {
    fetchCalendarEvents()
      .then(loadedEvents => {
        if (loadedEvents && loadedEvents.length > 0) {
          setEvents(loadedEvents);
        }
      })
      .catch(err => {
        console.error('Failed to fetch calendar events:', err);
      });
  }, []);
  
  // Modals & Feedback
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStart, setFormStart] = useState('10:00');
  const [formEnd, setFormEnd] = useState('11:00');
  const [formLocation, setFormLocation] = useState('');
  const [formIsTeams, setFormIsTeams] = useState(true);
  const [formAttendees, setFormAttendees] = useState('');
  const [formCategory, setFormCategory] = useState<CalendarCategory>('Blue');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Handle prefilled event from PeopleSection
  useEffect(() => {
    if (prefillEvent) {
      setSelectedEventId(null);
      setFormTitle(prefillEvent.title || 'Meeting');
      setFormDate(currentDate.toISOString().split('T')[0]);
      setFormStart('10:00');
      setFormEnd('11:00');
      setFormLocation('Microsoft Teams Meeting');
      setFormIsTeams(true);
      setFormAttendees((prefillEvent.attendees || []).join(', '));
      setFormCategory('Blue');
      setFormAllDay(false);
      setFormNotes('');
      setIsEventModalOpen(true);
      onClearPrefillEvent?.();
    }
  }, [prefillEvent, onClearPrefillEvent, currentDate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEventModalOpen) {
        setIsEventModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEventModalOpen]);

  // Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Navigation
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (view === 'week' || view === 'workweek') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (view === 'week' || view === 'workweek') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Actions
  const openNewEventModal = () => {
    setSelectedEventId(null);
    setFormTitle('');
    setFormDate(currentDate.toISOString().split('T')[0]);
    setFormStart('10:00');
    setFormEnd('11:00');
    setFormLocation('Microsoft Teams Meeting');
    setFormIsTeams(true);
    setFormAttendees('');
    setFormCategory('Blue');
    setFormAllDay(false);
    setFormNotes('');
    setIsEventModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedEventId(event.id);
    setFormTitle(event.title);
    setFormDate(event.date);
    setFormStart(event.startTime);
    setFormEnd(event.endTime);
    setFormLocation(event.location || '');
    setFormIsTeams(!!event.isTeamsMeeting);
    setFormAttendees((event.attendees || []).join(', '));
    setFormCategory(event.category || 'Blue');
    setFormAllDay(!!event.allDay);
    setFormNotes(event.notes);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Event title is required');
      return;
    }

    const attendeeList = formAttendees
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    if (selectedEventId) {
      const updatedEv: CalendarEvent = {
        id: selectedEventId,
        title: formTitle.trim(),
        date: formDate,
        startTime: formAllDay ? '00:00' : formStart,
        endTime: formAllDay ? '23:59' : formEnd,
        location: formLocation.trim(),
        isTeamsMeeting: formIsTeams,
        attendees: attendeeList,
        category: formCategory,
        allDay: formAllDay,
        notes: formNotes.trim()
      };
      setEvents(events.map(ev => ev.id === selectedEventId ? updatedEv : ev));
      updateCalendarEvent(updatedEv).catch(console.error);
      showToast(`Updated event "${formTitle}"`);
    } else {
      const newEv: CalendarEvent = {
        id: `ev_${Date.now()}`,
        title: formTitle.trim(),
        date: formDate,
        startTime: formAllDay ? '00:00' : formStart,
        endTime: formAllDay ? '23:59' : formEnd,
        location: formLocation.trim(),
        isTeamsMeeting: formIsTeams,
        attendees: attendeeList,
        category: formCategory,
        allDay: formAllDay,
        notes: formNotes.trim()
      };
      setEvents([newEv, ...events]);
      insertCalendarEvent(newEv).then(inserted => {
        if (inserted && inserted.id !== newEv.id) {
          setEvents(prev => prev.map(ev => ev.id === newEv.id ? inserted : ev));
        }
      }).catch(console.error);
      showToast(`Created event "${formTitle}"`);
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    const target = events.find(ev => ev.id === id);
    setEvents(events.filter(ev => ev.id !== id));
    deleteCalendarEvent(id).catch(console.error);
    setIsEventModalOpen(false);
    showToast(`Deleted "${target?.title || 'event'}"`);
  };

  const getCategoryStyles = (category?: CalendarCategory) => {
    switch (category) {
      case 'Green':
        return 'bg-emerald-50 text-emerald-900 border-l-4 border-l-[#107C41] hover:bg-emerald-100/70';
      case 'Orange':
        return 'bg-orange-50 text-orange-900 border-l-4 border-l-[#D83B01] hover:bg-orange-100/70';
      case 'Purple':
        return 'bg-purple-50 text-purple-900 border-l-4 border-l-[#8764B8] hover:bg-purple-100/70';
      case 'Red':
        return 'bg-red-50 text-red-900 border-l-4 border-l-red-600 hover:bg-red-100/70';
      case 'Yellow':
        return 'bg-amber-50 text-amber-900 border-l-4 border-l-amber-500 hover:bg-amber-100/70';
      case 'Blue':
      default:
        return 'bg-blue-50 text-blue-900 border-l-4 border-l-[#0078D4] hover:bg-blue-100/70';
    }
  };

  // Rendering mini calendar
  const renderMiniCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedStr = currentDate.toISOString().split('T')[0];

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="w-7 h-7" />);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedStr;
      
      days.push(
        <button
          key={i}
          type="button"
          onClick={() => {
            const newDate = new Date(year, month, i);
            setCurrentDate(newDate);
          }}
          className={`w-7 h-7 rounded-xs flex items-center justify-center text-xs font-medium transition-colors ${
            isSelected 
              ? 'bg-[#0078D4] text-white font-bold' 
              : isToday 
              ? 'bg-blue-100 text-[#0078D4] font-bold' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
      <>
        {/* Mobile backdrop for calendar sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-40 md:hidden animate-in fade-in duration-200" 
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-64 md:w-56 p-3 border-r border-gray-200 bg-white flex flex-col flex-shrink-0 select-none shadow-xl md:shadow-none transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="flex items-center justify-between md:hidden mb-2 pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-700">Calendar Navigator</span>
            <button 
              type="button" 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-700 rounded-xs"
            >
              <X size={15} />
            </button>
          </div>
          <button 
            type="button"
            onClick={() => {
              openNewEventModal();
              setIsSidebarOpen(false);
            }}
            className="mb-4 flex items-center justify-center gap-2 bg-[#0078D4] hover:bg-[#005A9E] text-white py-1.5 px-3 rounded-xs text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={15} />
            <span>New event</span>
          </button>

        <div className="flex items-center justify-between mb-2 px-1">
          <span className="font-bold text-xs text-gray-800">{monthNames[month]} {year}</span>
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => {
                const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d);
              }}
              className="p-1 hover:bg-gray-100 text-gray-500 rounded-xs"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d);
              }}
              className="p-1 hover:bg-gray-100 text-gray-500 rounded-xs"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-semibold text-gray-400">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="w-7">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>

        {/* My Calendars checklist */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            My Calendars
          </div>
          <div className="space-y-1.5 text-xs text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-[#0078D4] focus:ring-0" />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0078D4]" />
                Calendar (Work)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-[#107C41] focus:ring-0" />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#107C41]" />
                Personal
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-[#8764B8] focus:ring-0" />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#8764B8]" />
                Executive Meetings
              </span>
            </label>
          </div>
        </div>
      </div>
      </>
    );
  };

  const getDayEvents = (dateStr: string) => events.filter(e => {
    if (e.date !== dateStr) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matches = e.title.toLowerCase().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.attendees && e.attendees.some(a => a.toLowerCase().includes(q)));
      if (!matches) return false;
    }
    return true;
  });

  const calculateEventStyles = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const top = (startH * 60 + startM);
    const height = Math.max(30, (endH * 60 + endM) - top);
    return {
      top: `${(top / (24 * 60)) * 100}%`,
      height: `${(height / (24 * 60)) * 100}%`
    };
  };

  // Render Time Grid
  const renderTimeGrid = (days: Date[]) => {
    const todayStr = new Date().toISOString().split('T')[0];

    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {/* Day Headers */}
        <div className="flex border-b border-gray-200 bg-[#FAFAFA]">
          <div className="w-14 flex-shrink-0" />
          {days.map((day, i) => {
            const dateStr = day.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            return (
              <div key={i} className="flex-1 min-w-[110px] py-2.5 text-center border-l border-gray-200">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]}
                </div>
                <div className={`text-base font-bold inline-flex w-7 h-7 items-center justify-center rounded-xs mt-0.5 ${
                  isToday ? 'bg-[#0078D4] text-white' : 'text-gray-800'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto relative bg-white">
          <div className="flex h-[1440px]">
            {/* Time Labels */}
            <div className="w-14 flex-shrink-0 border-r border-gray-200 relative bg-[#FAFAFA]">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="absolute w-full text-right pr-2 text-[10px] text-gray-400 font-mono" style={{ top: `${(i * 60)}px`, marginTop: '-7px' }}>
                  {i === 0 ? '' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((day, i) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayEvents = getDayEvents(dateStr);
              return (
                <div key={i} className="flex-1 min-w-[110px] border-r border-gray-200 relative">
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="absolute w-full border-t border-gray-100" style={{ top: `${h * 60}px` }} />
                  ))}
                  
                  {/* Events */}
                  {dayEvents.map(event => {
                    const style = calculateEventStyles(event.startTime, event.endTime);
                    const categoryClass = getCategoryStyles(event.category);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => openEditModal(event)}
                        className={`absolute w-[calc(100%-6px)] left-[3px] rounded-2xs p-1.5 text-left shadow-2xs transition-all overflow-hidden cursor-pointer ${categoryClass}`}
                        style={style}
                      >
                        <div className="text-xs font-bold truncate flex items-center gap-1">
                          {event.isTeamsMeeting && <Video size={12} className="flex-shrink-0 text-[#0078D4]" />}
                          <span className="truncate">{event.title}</span>
                        </div>
                        <div className="text-[10px] opacity-80 truncate font-mono">
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.location && (
                          <div className="text-[10px] opacity-75 truncate flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Month Grid
  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const todayStr = new Date().toISOString().split('T')[0];

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[110px] bg-[#FAFAFA] border-b border-r border-gray-200" />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = getDayEvents(dateStr);
      const isToday = dateStr === todayStr;
      
      cells.push(
        <div key={i} className="min-h-[110px] border-b border-r border-gray-200 p-1.5 bg-white flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-xs ${
              isToday ? 'bg-[#0078D4] text-white' : 'text-gray-700'
            }`}>
              {i}
            </span>
          </div>
          <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {dayEvents.slice(0, 3).map(event => (
              <button 
                key={event.id}
                type="button"
                onClick={() => openEditModal(event)}
                className={`text-left text-[11px] px-1.5 py-0.5 rounded-2xs truncate font-medium ${getCategoryStyles(event.category)}`}
              >
                {event.startTime} {event.title}
              </button>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[10px] text-gray-500 font-semibold px-1">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-[#FAFAFA]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
          {cells}
        </div>
      </div>
    );
  };

  const currentViewTitle = useMemo(() => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (view === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  }, [currentDate, view]);

  // Compute days for week or workweek view
  const activeDays = useMemo(() => {
    if (view === 'day') return [currentDate];
    if (view === 'workweek') {
      // Monday to Friday
      const curr = new Date(currentDate);
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(curr.setDate(diff));
      return Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    }
    // Full Week (Sunday to Saturday)
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - d.getDay() + i);
      return d;
    });
  }, [currentDate, view]);

  return (
    <div className="flex h-full bg-[#FAFAFA] text-[#242424] overflow-hidden select-none">
      {/* 1. Left Mini Calendar Sidebar */}
      {renderMiniCalendar()}

      {/* 2. Main Calendar Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Outlook Calendar Header Toolbar */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-3 md:px-4 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xs md:hidden"
              title="Open calendar drawer"
            >
              <Menu size={18} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 md:px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xs hover:bg-gray-100 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 hover:bg-gray-100 rounded-xs text-gray-600 transition-colors"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 hover:bg-gray-100 rounded-xs text-gray-600 transition-colors"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <h2 className="text-sm font-bold text-gray-900 ml-2">{currentViewTitle}</h2>
          </div>

          <div className="flex bg-gray-100 p-0.5 rounded-xs border border-gray-200">
            {(
              [
                { id: 'day', label: 'Day' },
                { id: 'workweek', label: 'Work week' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' }
              ] as const
            ).map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setView(mode.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-2xs transition-colors ${
                  view === mode.id 
                    ? 'bg-white shadow-2xs text-[#0078D4]' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </header>

        {/* Calendar View Body */}
        {view === 'month' ? renderMonthGrid() : renderTimeGrid(activeDays)}
      </div>

      {/* New / Edit Event Modal */}
      {isEventModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100"
          onClick={() => setIsEventModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg shadow-2xl border border-gray-300 rounded-xs flex flex-col overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#0078D4] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} />
                <h3 className="font-semibold text-xs">{selectedEventId ? 'Edit Event' : 'New Event'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-5 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="Add title"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={formAllDay}
                      onChange={e => setFormAllDay(e.target.checked)}
                      className="rounded text-[#0078D4]"
                    />
                    <span>All day event</span>
                  </label>
                </div>
              </div>

              {!formAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start time</label>
                    <input
                      type="time"
                      required
                      value={formStart}
                      onChange={e => setFormStart(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">End time</label>
                    <input
                      type="time"
                      required
                      value={formEnd}
                      onChange={e => setFormEnd(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attendees</label>
                <input
                  type="text"
                  placeholder="e.g. sarah.jenkins@acmecorp.com, david.chen@acmecorp.com"
                  value={formAttendees}
                  onChange={e => setFormAttendees(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Studio 9, Conference Room 4B"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as CalendarCategory)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden"
                  >
                    <option value="Blue">Blue (Business / Work)</option>
                    <option value="Green">Green (Personal)</option>
                    <option value="Orange">Orange (External Client)</option>
                    <option value="Purple">Purple (Strategic Leadership)</option>
                    <option value="Red">Red (Urgent)</option>
                    <option value="Yellow">Yellow (Follow-up)</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video size={16} className="text-[#0078D4]" />
                  <span className="text-xs font-semibold text-gray-800">Teams meeting</span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsTeams}
                  onChange={e => setFormIsTeams(e.target.checked)}
                  className="rounded text-[#0078D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description &amp; Agenda</label>
                <textarea
                  rows={3}
                  placeholder="Add meeting agenda, discussion topics, dial-in notes..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:border-[#0078D4] focus:outline-hidden resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                {selectedEventId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEventId)}
                    className="px-2.5 py-1 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                ) : <div />}
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Check size={14} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E1E1E] text-white text-xs px-4 py-2.5 shadow-xl border border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
