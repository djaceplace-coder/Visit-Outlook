import React, { useState, useEffect } from 'react';
import { 
  X, 
  Moon, 
  Sun, 
  Check, 
  Palette, 
  Layout, 
  ListFilter, 
  MessageSquare, 
  Mail, 
  BellRing,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Density, ReadingPanePosition } from '../../types/mail';

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
  onUpdateSettings
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'autoreply'>('quick');

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

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-150 border-l border-gray-200"
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
            className="p-1 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
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
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
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
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              activeTab === 'autoreply'
                ? 'border-brand-cobalt text-brand-cobalt bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Automatic Replies
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-[#1F2937]">
          {activeTab === 'quick' ? (
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
                      key={th.id}
                      type="button"
                      onClick={() => onUpdateSettings({ themeColor: th.color })}
                      style={{ backgroundColor: th.color }}
                      className="w-10 h-10 rounded-none flex items-center justify-center text-white relative transition-transform hover:scale-105 shadow-2xs"
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
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
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
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
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
                    className={`p-2.5 border text-center font-medium rounded-none transition-colors ${
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
                    className={`p-2.5 border text-center font-medium rounded-none transition-colors ${
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
                    className={`p-2.5 border text-center font-medium rounded-none transition-colors ${
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
                      key={d}
                      type="button"
                      onClick={() => onUpdateSettings({ density: d })}
                      className={`py-2 px-3 border capitalize font-medium rounded-none text-center transition-colors ${
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
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.groupByConversation ? 'bg-brand-cobalt justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </>
          ) : (
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
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
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
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-brand-cobalt hover:bg-[#004578] text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
