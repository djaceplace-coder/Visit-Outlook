import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Bell, 
  Settings, 
  MoreHorizontal, 
  User, 
  LogOut, 
  Users, 
  X,
  LayoutGrid,
  Gem,
  Check,
  Award,
  Sparkles
} from 'lucide-react';

interface TopBarProps {
  onToggleFolderPane: () => void;
  isFolderPaneOpen: boolean;
  onOpenAdvancedSearch?: () => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  onNavigate?: (section: 'inbox' | 'calendar' | 'people' | 'tasks' | 'apps') => void;
  onNavigateToTest?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userEmail?: string;
}

export function TopBar({
  onOpenAdvancedSearch,
  onOpenSettings,
  onSignOut,
  onNavigate,
  onNavigateToTest,
  searchQuery,
  onSearchChange,
  userEmail = 'alex.bennett@outlook.com',
}: TopBarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isBuy365Open, setIsBuy365Open] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Upcoming Meeting: Q4 Launch Review', desc: 'Starts in 15 minutes • Teams Audio', read: false, time: '15m ago' },
    { id: '2', title: 'Storage policy reminder', desc: 'Mailbox is at 42% capacity.', read: false, time: '2h ago' },
    { id: '3', title: 'Security sign-in confirmation', desc: 'New login from Chrome on Windows.', read: true, time: '1d ago' }
  ]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLDivElement>(null);
  const rewardsRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
      if (launcherRef.current && !launcherRef.current.contains(event.target as Node)) {
        setIsAppLauncherOpen(false);
      }
      if (rewardsRef.current && !rewardsRef.current.contains(event.target as Node)) {
        setIsRewardsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsNotificationsOpen(false);
        setIsOverflowOpen(false);
        setIsAppLauncherOpen(false);
        setIsRewardsOpen(false);
        setIsBuy365Open(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const displayName = userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Outlook User';

  return (
    <header className="h-12 bg-brand-cobalt text-white flex items-center justify-between px-3 z-30 select-none flex-shrink-0">
      {/* Left cluster: 9-Dot App Launcher (Waffle) + "Outlook" Text */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={launcherRef}>
          <button
            type="button"
            onClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
            className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-sm transition-colors cursor-pointer"
            title="Microsoft 365 app launcher"
            aria-label="Microsoft 365 app launcher"
          >
            <LayoutGrid size={18} />
          </button>

          {isAppLauncherOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white text-[#1F2937] rounded-lg border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.14)] p-3 z-50">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                Microsoft 365 Apps
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { name: 'Outlook', color: 'bg-[#0078D4] text-white', icon: '✉', section: 'inbox' as const },
                  { name: 'Word', color: 'bg-[#185ABD] text-white', icon: 'W', section: 'apps' as const },
                  { name: 'Excel', color: 'bg-[#107C41] text-white', icon: 'X', section: 'apps' as const },
                  { name: 'PowerPoint', color: 'bg-[#C43E1C] text-white', icon: 'P', section: 'apps' as const },
                  { name: 'OneDrive', color: 'bg-[#0078D4] text-white', icon: '☁', section: 'apps' as const },
                  { name: 'OneNote', color: 'bg-[#7719AA] text-white', icon: 'N', section: 'apps' as const },
                  { name: 'To Do', color: 'bg-[#2563EB] text-white', icon: '✓', section: 'tasks' as const },
                  { name: 'Calendar', color: 'bg-[#0078D4] text-white', icon: '📅', section: 'calendar' as const },
                  { name: 'People', color: 'bg-[#0078D4] text-white', icon: '👥', section: 'people' as const },
                ].map((app) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => {
                      if (app.section && onNavigate) {
                        onNavigate(app.section);
                      }
                      setIsAppLauncherOpen(false);
                    }}
                    className="p-2 hover:bg-gray-50 rounded flex flex-col items-center gap-1 text-gray-800 cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-sm ${app.color} flex items-center justify-center font-bold text-xs shadow-xs`}>
                      {app.icon}
                    </div>
                    <span className="text-[11px] truncate w-full">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <span className="font-semibold text-base tracking-tight text-white select-none">
          Outlook
        </span>
      </div>

      {/* Center: Global search pill with embedded filter slider */}
      <div className="flex-1 max-w-xl mx-4 sm:mx-8">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <Search size={15} />
          </div>
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search (Press / to focus)"
            className="w-full pl-9 pr-9 py-1.5 text-xs sm:text-sm bg-white text-[#1F2937] placeholder-gray-500 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-8 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              title="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenAdvancedSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-brand-cobalt transition-colors cursor-pointer"
            title="Open advanced filter options"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Right cluster: Rewards, Buy 365, Notifications, Settings, Overflow, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Microsoft Rewards 219 badge */}
        <div className="relative" ref={rewardsRef}>
          <button
            type="button"
            onClick={() => setIsRewardsOpen(!isRewardsOpen)}
            className="hidden md:flex items-center gap-1 px-2 py-1 text-xs text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Microsoft Rewards points"
          >
            <span className="font-semibold">219</span>
            <Gem size={14} className="text-sky-200" />
          </button>

          {isRewardsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white text-[#1F2937] rounded-md border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] p-4 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-amber-500" />
                  <span className="font-semibold text-sm">Microsoft Rewards</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRewardsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="py-3 text-center border-b border-gray-100">
                <div className="text-2xl font-bold text-gray-900">219</div>
                <div className="text-xs text-gray-500">Available points • Level 2</div>
                <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[45%]" />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>219 pts</span>
                  <span>Goal: 500 pts</span>
                </div>
              </div>

              <div className="pt-3 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Daily set</div>
                <div className="p-2 bg-gray-50 rounded flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Daily Quiz</p>
                    <p className="text-[11px] text-gray-500">Test your trivia knowledge</p>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-100 text-brand-cobalt font-semibold rounded text-[10px]">+30 pts</span>
                </div>
                <div className="p-2 bg-gray-50 rounded flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Search to earn</p>
                    <p className="text-[11px] text-gray-500">Use Bing on desktop</p>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-100 text-brand-cobalt font-semibold rounded text-[10px]">+50 pts</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buy Microsoft 365 Button */}
        <button
          type="button"
          onClick={() => setIsBuy365Open(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          title="Buy Microsoft 365"
        >
          <Gem size={14} className="text-white" />
          <span className="font-medium">Buy Microsoft 365</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-terracotta rounded-full ring-2 ring-brand-cobalt" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-[#1F2937] rounded-md border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] p-4 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="font-semibold text-sm">Notifications ({unreadCount})</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    className="text-xs text-brand-cobalt hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifications([])}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
                      className={`p-2.5 rounded cursor-pointer transition-colors border-l-2 ${
                        n.read ? 'bg-gray-50 border-gray-300 text-gray-600' : 'bg-blue-50/50 border-brand-cobalt text-gray-900 font-medium'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p>{n.title}</p>
                        <span className="text-[10px] text-gray-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-normal">{n.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings gear */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings size={17} />
        </button>

        {/* Overflow ••• */}
        <div className="relative" ref={overflowRef}>
          <button
            type="button"
            onClick={() => setIsOverflowOpen(!isOverflowOpen)}
            className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="More actions"
          >
            <MoreHorizontal size={17} />
          </button>

          {isOverflowOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-[#1F2937] rounded border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.12)] py-1 z-50 text-sm animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsOverflowOpen(false);
                  setNotifications(prev => [
                    { id: Date.now().toString(), title: 'Sync completed', desc: 'All folders up to date.', read: false, time: 'Just now' },
                    ...prev
                  ]);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs text-gray-700 transition-colors cursor-pointer"
              >
                Check for new messages
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOverflowOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs text-gray-700 transition-colors cursor-pointer"
              >
                Offline cache settings
              </button>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="relative ml-0.5" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-7 h-7 rounded-full bg-white text-brand-cobalt flex items-center justify-center hover:opacity-90 transition-opacity ring-1 ring-white/40 cursor-pointer"
            title={`Account manager for ${displayName}`}
          >
            <User size={15} strokeWidth={2.4} />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white text-[#1F2937] rounded-md border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.14)] p-4 z-50 animate-in fade-in duration-100">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-brand-cobalt text-white font-medium text-sm flex items-center justify-center rounded-full uppercase">
                  {displayName.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{displayName}</div>
                  <div className="text-xs text-gray-500 truncate">{userEmail}</div>
                </div>
              </div>

              <div className="py-2 space-y-1 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenSettings?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-gray-50 text-gray-700 text-xs text-left rounded transition-colors cursor-pointer"
                >
                  <User size={15} className="text-gray-500" />
                  <span>My Outlook profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-gray-50 text-gray-700 text-xs text-left rounded transition-colors cursor-pointer"
                >
                  <Users size={15} className="text-gray-500" />
                  <span>Switch account</span>
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenSettings?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-gray-50 text-gray-700 text-xs text-left font-medium rounded transition-colors cursor-pointer"
                >
                  <Settings size={15} className="text-gray-500" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-red-50 text-[#D83B01] text-xs text-left font-medium rounded transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Microsoft 365 Subscription Modal */}
      {isBuy365Open && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsBuy365Open(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden text-[#1F2937]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-semibold text-base">Upgrade to Microsoft 365</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBuy365Open(false)}
                className="p-1 hover:bg-white/20 text-white rounded transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed text-sm">
                Get premium Office apps, 1 TB of cloud storage, advanced security with ransomware detection, and an ad-free Outlook inbox experience.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 border-2 border-brand-cobalt bg-blue-50/40 rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-sm text-gray-900">Personal</div>
                    <div className="text-lg font-extrabold text-brand-cobalt mt-1">$6.99<span className="text-xs font-normal text-gray-500">/mo</span></div>
                    <ul className="mt-3 space-y-1.5 text-[11px] text-gray-600">
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> 1 Person</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> 1 TB Cloud Storage</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> Ad-free Outlook</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 bg-white rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-sm text-gray-900">Family</div>
                    <div className="text-lg font-extrabold text-gray-900 mt-1">$9.99<span className="text-xs font-normal text-gray-500">/mo</span></div>
                    <ul className="mt-3 space-y-1.5 text-[11px] text-gray-600">
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> Up to 6 People</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> 6 TB Total Storage</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> Family Safety app</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBuy365Open(false)}
                className="px-4 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBuy365Open(false);
                }}
                className="px-4 py-2 bg-brand-cobalt text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                Try free for 1 month
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
