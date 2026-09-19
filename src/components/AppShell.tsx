import { type ReactNode } from 'react';
import { 
  Mail, 
  Calendar as CalendarIcon, 
  Users,
  Check, 
  LayoutGrid
} from 'lucide-react';
import { TopBar } from './mail/TopBar';

export type Section = 'inbox' | 'calendar' | 'people' | 'tasks' | 'apps';

interface AppShellProps {
  currentSection: Section;
  onNavigate: (section: Section) => void;
  onSignOut?: () => void;
  isFolderPaneOpen?: boolean;
  onToggleFolderPane?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenAdvancedSearch?: () => void;
  onOpenSettings?: () => void;
  onNavigateToTest?: () => void;
  userEmail?: string;
  children: ReactNode;
}

export function AppShell({ 
  currentSection, 
  onNavigate, 
  onSignOut,
  isFolderPaneOpen = true,
  onToggleFolderPane = () => {},
  searchQuery = '',
  onSearchChange = () => {},
  onOpenAdvancedSearch,
  onOpenSettings,
  onNavigateToTest,
  userEmail,
  children 
}: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-[#F5F5F5] overflow-hidden text-[#1F2937]">
      {/* 1. Global Top Bar */}
      <TopBar
        isFolderPaneOpen={isFolderPaneOpen}
        onToggleFolderPane={onToggleFolderPane}
        onOpenAdvancedSearch={onOpenAdvancedSearch}
        onOpenSettings={onOpenSettings}
        onSignOut={onSignOut}
        onNavigate={onNavigate}
        onNavigateToTest={onNavigateToTest}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        userEmail={userEmail}
      />

      {/* 2. Main Workspace: Slim Left Rail + Active Section Canvas */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Slim Left Icon Rail (Mail, Calendar, People, To-Do, Word, Excel, PowerPoint, Apps) */}
        <nav 
          aria-label="App rail"
          className="w-12 bg-[#F3F4F6] border-r border-gray-200 flex flex-col items-center py-2 gap-1 flex-shrink-0 select-none z-20"
        >
          {/* Mail */}
          <button
            type="button"
            onClick={() => onNavigate('inbox')}
            className={`relative w-10 h-10 flex items-center justify-center rounded-sm transition-colors cursor-pointer ${
              currentSection === 'inbox'
                ? 'bg-white text-brand-cobalt shadow-xs'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
            title="Mail"
          >
            {currentSection === 'inbox' && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-cobalt rounded-r" />
            )}
            <Mail size={19} className="text-[#0078D4]" strokeWidth={2.2} />
          </button>

          {/* Calendar */}
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className={`relative w-10 h-10 flex items-center justify-center rounded-sm transition-colors cursor-pointer ${
              currentSection === 'calendar'
                ? 'bg-white text-brand-cobalt shadow-xs'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
            title="Calendar"
          >
            {currentSection === 'calendar' && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-cobalt rounded-r" />
            )}
            <CalendarIcon size={19} className="text-[#0078D4]" strokeWidth={2} />
          </button>

          {/* People / Contacts */}
          <button
            type="button"
            onClick={() => onNavigate('people')}
            className={`relative w-10 h-10 flex items-center justify-center rounded-sm transition-colors cursor-pointer ${
              currentSection === 'people'
                ? 'bg-white text-brand-cobalt shadow-xs'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
            title="People & Contacts"
          >
            {currentSection === 'people' && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-cobalt rounded-r" />
            )}
            <Users size={19} className="text-[#0078D4]" strokeWidth={2} />
          </button>

          {/* To-Do / Tasks */}
          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className={`relative w-10 h-10 flex items-center justify-center rounded-sm transition-colors cursor-pointer ${
              currentSection === 'tasks'
                ? 'bg-white text-brand-cobalt shadow-xs'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
            title="To Do"
          >
            {currentSection === 'tasks' && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-cobalt rounded-r" />
            )}
            <div className="w-5 h-5 rounded-full border-2 border-[#0078D4] flex items-center justify-center">
              <Check size={13} className="text-[#0078D4]" strokeWidth={3} />
            </div>
          </button>

          {/* Word App Icon */}
          <button
            type="button"
            onClick={() => onNavigate('apps')}
            className="relative w-10 h-10 flex items-center justify-center rounded-sm text-gray-600 hover:bg-gray-200/70 transition-colors cursor-pointer"
            title="Microsoft Word"
          >
            <div className="w-5 h-5 bg-[#185ABD] text-white rounded-xs flex items-center justify-center font-bold text-[11px] shadow-xs">
              W
            </div>
          </button>

          {/* Excel App Icon */}
          <button
            type="button"
            onClick={() => onNavigate('apps')}
            className="relative w-10 h-10 flex items-center justify-center rounded-sm text-gray-600 hover:bg-gray-200/70 transition-colors cursor-pointer"
            title="Microsoft Excel"
          >
            <div className="w-5 h-5 bg-[#107C41] text-white rounded-xs flex items-center justify-center font-bold text-[11px] shadow-xs">
              X
            </div>
          </button>

          {/* PowerPoint App Icon */}
          <button
            type="button"
            onClick={() => onNavigate('apps')}
            className="relative w-10 h-10 flex items-center justify-center rounded-sm text-gray-600 hover:bg-gray-200/70 transition-colors cursor-pointer"
            title="Microsoft PowerPoint"
          >
            <div className="w-5 h-5 bg-[#C43E1C] text-white rounded-xs flex items-center justify-center font-bold text-[11px] shadow-xs">
              P
            </div>
          </button>

          {/* More Apps Icon (4 squares grid) */}
          <button
            type="button"
            onClick={() => onNavigate('apps')}
            className={`relative w-10 h-10 flex items-center justify-center rounded-sm transition-colors mt-1 cursor-pointer ${
              currentSection === 'apps'
                ? 'bg-white text-brand-cobalt shadow-xs'
                : 'text-gray-500 hover:bg-gray-200/70'
            }`}
            title="More apps"
          >
            {currentSection === 'apps' && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-cobalt rounded-r" />
            )}
            <LayoutGrid size={18} strokeWidth={2} />
          </button>
        </nav>

        {/* Content View */}
        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
