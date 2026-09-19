import { useState, useRef, useEffect } from 'react';
import { 
  Mail, 
  Trash2, 
  Archive, 
  AlertOctagon, 
  FolderInput, 
  ReplyAll, 
  Reply, 
  Forward, 
  MailOpen, 
  Flag, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp,
  Calendar, 
  UserPlus, 
  ShieldAlert, 
  Ban, 
  Columns, 
  Rows, 
  EyeOff, 
  Layers, 
  Sun, 
  Moon, 
  Sparkles, 
  LifeBuoy, 
  Keyboard,
  Menu,
  LayoutGrid,
  Users,
  RotateCcw,
  Printer,
  Code,
  Pin,
  Clock,
  X,
  Check,
  Copy,
  FileText,
  CheckCircle2,
  Settings,
  HardDrive,
  Tag,
  Zap
} from 'lucide-react';
import { RibbonTab, Density, ReadingPanePosition } from '../../types/mail';

interface CommandRibbonProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  hasSelection: boolean;
  onNewEmail: () => void;
  onNewEvent?: () => void;
  onNewContact?: () => void;
  onDelete?: () => void;
  onDeleteFromSender?: () => void;
  onArchive?: () => void;
  onReportJunk?: () => void;
  onReportPhishing?: () => void;
  onBlockSender?: () => void;
  onMoveToFolder?: () => void;
  onReplyAll?: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onToggleRead?: () => void;
  onToggleFlag?: () => void;
  onUndo?: () => void;
  isRead?: boolean;
  isFlagged?: boolean;
  density: Density;
  onDensityChange: (d: Density) => void;
  readingPanePosition: ReadingPanePosition;
  onReadingPanePositionChange: (pos: ReadingPanePosition) => void;
  conversationGrouping: boolean;
  onConversationGroupingToggle: () => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenWhatsNew?: () => void;
  onOpenSupport?: () => void;
  onToggleFolderPane?: () => void;
  onCategorize?: (category: string) => void;
  onSnooze?: (timeTitle: string) => void;
  onQuickStep?: (stepId: 'done' | 'team_review' | 'follow_up') => void;
  onNavigateToSection?: (section: 'inbox' | 'calendar' | 'people' | 'tasks' | 'apps') => void;
}

export function CommandRibbon({
  activeTab,
  onTabChange,
  hasSelection,
  onNewEmail,
  onNewEvent,
  onNewContact,
  onDelete,
  onDeleteFromSender,
  onArchive,
  onReportJunk,
  onReportPhishing,
  onBlockSender,
  onMoveToFolder,
  onReplyAll,
  onReply,
  onForward,
  onToggleRead,
  onToggleFlag,
  isRead = false,
  isFlagged = false,
  density,
  onDensityChange,
  readingPanePosition,
  onReadingPanePositionChange,
  conversationGrouping,
  onConversationGroupingToggle,
  isDarkMode,
  onDarkModeToggle,
  onOpenKeyboardShortcuts,
  onOpenWhatsNew,
  onOpenSupport,
  onToggleFolderPane,
  onUndo,
  onCategorize,
  onSnooze,
  onQuickStep,
  onNavigateToSection
}: CommandRibbonProps) {
  // Dropdown states for split buttons
  const [openSplit, setOpenSplit] = useState<string | null>(null);
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState<boolean>(false);
  const [isBackstageOpen, setIsBackstageOpen] = useState<boolean>(false);
  const [isAddInsOpen, setIsAddInsOpen] = useState<boolean>(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState<boolean>(false);
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState<boolean>(false);
  const [sourceCopied, setSourceCopied] = useState<boolean>(false);
  const [addedAddIns, setAddedAddIns] = useState<Set<string>>(new Set(['zoom']));
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set(['design-guild']));

  const containerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenSplit(null);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenSplit(null);
        setIsBackstageOpen(false);
        setIsAddInsOpen(false);
        setIsGroupsOpen(false);
        setIsSourceModalOpen(false);
        setIsSnoozeModalOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSplit = (key: string) => {
    setOpenSplit(prev => prev === key ? null : key);
  };

  return (
    <div ref={containerRef} className="relative z-30 bg-[#F8F9FA] border-b border-gray-200 text-[#1F2937] select-none flex-shrink-0">
      {/* 1. Ribbon Tab Headers: Hamburger + File + Home + View + Help */}
      <div className="flex items-center px-2 bg-white border-b border-gray-200 h-9">
        {/* Hamburger Folder Pane Toggle */}
        <button
          type="button"
          onClick={onToggleFolderPane}
          className="p-1.5 mr-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Toggle folder pane"
          aria-label="Toggle folder pane"
        >
          <Menu size={16} />
        </button>

        {/* File Tab */}
        <button
          type="button"
          onClick={() => setIsBackstageOpen(true)}
          className="px-3 py-1.5 text-xs font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-t"
        >
          File
        </button>

        {/* Home Tab */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'home'
              ? 'border-brand-cobalt text-brand-cobalt'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Home
        </button>

        {/* View Tab */}
        <button
          type="button"
          onClick={() => onTabChange('view')}
          className={`px-3 py-1.5 text-xs font-normal transition-colors border-b-2 ${
            activeTab === 'view'
              ? 'border-brand-cobalt text-brand-cobalt font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          View
        </button>

        {/* Help Tab */}
        <button
          type="button"
          onClick={() => onTabChange('help')}
          className={`px-3 py-1.5 text-xs font-normal transition-colors border-b-2 ${
            activeTab === 'help'
              ? 'border-brand-cobalt text-brand-cobalt font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Help
        </button>
      </div>

      {/* 2. Ribbon Action Toolbar (Collapsible) - Note: overflow-visible ensures floating dropdowns overlay fully without clipping */}
      {!isRibbonCollapsed && (
        <div className="h-12 px-3 flex items-center justify-between bg-white border-b border-gray-100 relative z-30">
          {activeTab === 'home' && (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {/* Split Button: New Email (Blue pill) */}
              <div className="relative inline-flex items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={onNewEmail}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-[#0078D4] text-white text-xs font-medium rounded-l-full hover:bg-[#106EBE] active:bg-[#005A9E] transition-colors shadow-xs"
                  title="Compose new email (c)"
                >
                  <Mail size={14} />
                  <span>New email</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSplit('new')}
                  className="pr-2 pl-1 py-1.5 bg-[#0078D4] text-white hover:bg-[#106EBE] active:bg-[#005A9E] border-l border-white/20 rounded-r-full transition-colors flex items-center justify-center"
                  title="More items to create"
                  aria-expanded={openSplit === 'new'}
                >
                  <ChevronDown size={13} />
                </button>

                {openSplit === 'new' && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-56 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 py-1.5 text-xs rounded-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); onNewEmail(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] font-medium transition-colors"
                    >
                      <Mail size={15} className="text-[#0078D4]" />
                      <span>Mail message</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onNewEvent) onNewEvent(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Calendar size={15} className="text-brand-terracotta" />
                      <span>Calendar event</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onNewContact) onNewContact(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <UserPlus size={15} className="text-emerald-600" />
                      <span>New contact</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); setIsGroupsOpen(true); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Users size={15} className="text-[#6264A7]" />
                      <span>Group</span>
                    </button>

                    <div className="my-1.5 border-t border-gray-100" />

                    <div className="px-3.5 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Create with Microsoft 365
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); onNavigateToSection?.('apps'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <div className="w-4 h-4 rounded bg-[#185ABD] text-white flex items-center justify-center font-bold text-[9px]">W</div>
                      <span>Word document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); onNavigateToSection?.('apps'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <div className="w-4 h-4 rounded bg-[#107C41] text-white flex items-center justify-center font-bold text-[9px]">X</div>
                      <span>Excel workbook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); onNavigateToSection?.('apps'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <div className="w-4 h-4 rounded bg-[#C43E1C] text-white flex items-center justify-center font-bold text-[9px]">P</div>
                      <span>PowerPoint presentation</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Delete Button (with sender chevron) */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={onDelete}
                  className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-l-full transition-colors"
                  title="Delete message"
                >
                  <Trash2 size={14} className={hasSelection ? 'text-red-600' : 'text-gray-400'} />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => toggleSplit('delete')}
                  className="pr-2 pl-0.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-r-full"
                >
                  <ChevronDown size={11} />
                </button>

                {openSplit === 'delete' && hasSelection && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-52 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 py-1.5 text-xs rounded-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onDelete) onDelete(); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-left hover:bg-[#F3F4F6] text-red-600 font-medium transition-colors"
                    >
                      <Trash2 size={14} className="text-red-600" />
                      <span>Delete selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onDeleteFromSender) onDeleteFromSender(); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-left hover:bg-[#F3F4F6] text-[#242424] transition-colors"
                    >
                      <Users size={14} className="text-gray-500" />
                      <span>Delete all from this sender</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Archive */}
              <button
                type="button"
                disabled={!hasSelection}
                onClick={onArchive}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors"
                title="Archive message"
              >
                <Archive size={14} className={hasSelection ? 'text-gray-700' : 'text-gray-400'} />
                <span>Archive</span>
              </button>

              {/* Report (chevron: junk, phishing, block) */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={onReportJunk}
                  className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-l-full transition-colors"
                  title="Report junk email"
                >
                  <AlertOctagon size={14} className={hasSelection ? 'text-amber-600' : 'text-gray-400'} />
                  <span>Report</span>
                </button>
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => toggleSplit('report')}
                  className="pr-2 pl-0.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-r-full"
                >
                  <ChevronDown size={11} />
                </button>

                {openSplit === 'report' && hasSelection && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-48 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 py-1.5 text-xs rounded-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onReportJunk) onReportJunk(); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <AlertOctagon size={14} className="text-amber-600" />
                      <span>Report junk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onReportPhishing) onReportPhishing(); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <ShieldAlert size={14} className="text-red-600" />
                      <span>Report phishing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onBlockSender) onBlockSender(); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Ban size={14} className="text-gray-600" />
                      <span>Block sender</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Move to (chevron: folder picker) */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={onMoveToFolder}
                  className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-l-full transition-colors"
                  title="Move to folder"
                >
                  <FolderInput size={14} className={hasSelection ? 'text-brand-cobalt' : 'text-gray-400'} />
                  <span>Move to</span>
                </button>
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => toggleSplit('move')}
                  className="pr-2 pl-0.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-r-full"
                >
                  <ChevronDown size={11} />
                </button>

                {openSplit === 'move' && hasSelection && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-56 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 py-1.5 text-xs rounded-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-1 font-semibold text-[10px] text-gray-400 uppercase tracking-wider">Move to folder</div>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onMoveToFolder) onMoveToFolder(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Archive size={14} className="text-gray-600" />
                      <span>Archive</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onMoveToFolder) onMoveToFolder(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Mail size={14} className="text-brand-cobalt" />
                      <span>Inbox</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onMoveToFolder) onMoveToFolder(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Trash2 size={14} className="text-gray-500" />
                      <span>Deleted Items</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Reply all (chevron: reply, reply all, forward) */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={onReplyAll}
                  className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-l-full transition-colors"
                  title="Reply all (a)"
                >
                  <ReplyAll size={14} className={hasSelection ? 'text-gray-700' : 'text-gray-400'} />
                  <span>Reply all</span>
                </button>
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => toggleSplit('reply')}
                  className="pr-2 pl-0.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-r-full"
                >
                  <ChevronDown size={11} />
                </button>

                {openSplit === 'reply' && hasSelection && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-44 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 py-1.5 text-xs rounded-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onReply) onReply(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Reply size={14} className="text-gray-700" />
                      <span>Reply</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onReplyAll) onReplyAll(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <ReplyAll size={14} className="text-gray-700" />
                      <span>Reply all</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onForward) onForward(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Forward size={14} className="text-gray-700" />
                      <span>Forward</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Read/Unread toggle */}
              <button
                type="button"
                disabled={!hasSelection}
                onClick={onToggleRead}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors"
                title={isRead ? 'Mark as unread' : 'Mark as read'}
              >
                {isRead ? <Mail size={14} className={hasSelection ? 'text-brand-cobalt' : 'text-gray-400'} /> : <MailOpen size={14} className={hasSelection ? 'text-gray-700' : 'text-gray-400'} />}
                <span>Read / Unread</span>
              </button>

              {/* Flag/Unflag toggle */}
              <button
                type="button"
                disabled={!hasSelection}
                onClick={onToggleFlag}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors"
                title="Flag or unflag message"
              >
                <Flag size={14} className={isFlagged ? 'text-brand-terracotta fill-brand-terracotta' : hasSelection ? 'text-gray-700' : 'text-gray-400'} />
                <span>Flag / Unflag</span>
              </button>

              {/* Categorize (with split dropdown) */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => toggleSplit('categorize')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors"
                  title="Assign color category"
                >
                  <Tag size={14} className={hasSelection ? 'text-emerald-600' : 'text-gray-400'} />
                  <span>Categorize</span>
                  <ChevronDown size={11} className="text-gray-400" />
                </button>

                {openSplit === 'categorize' && hasSelection && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-48 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 py-1.5 text-xs rounded-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-1 font-semibold text-[10px] text-gray-400 uppercase tracking-wider">
                      Categories
                    </div>
                    {[
                      { name: 'Blue', color: 'bg-blue-500' },
                      { name: 'Green', color: 'bg-emerald-500' },
                      { name: 'Orange', color: 'bg-amber-500' },
                      { name: 'Purple', color: 'bg-purple-500' },
                      { name: 'Red', color: 'bg-rose-500' },
                      { name: 'Yellow', color: 'bg-yellow-500' }
                    ].map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setOpenSplit(null);
                          onCategorize?.(cat.name);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                      >
                        <span className={`w-3 h-3 rounded-xs ${cat.color}`} />
                        <span>{cat.name} category</span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSplit(null);
                        onCategorize?.('');
                      }}
                      className="w-full flex items-center px-3.5 py-1.5 hover:bg-[#F3F4F6] text-left text-gray-500 transition-colors"
                    >
                      Clear all categories
                    </button>
                  </div>
                )}
              </div>

              {/* Snooze button */}
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => setIsSnoozeModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors"
                title="Snooze message until later"
              >
                <Clock size={14} className={hasSelection ? 'text-brand-cobalt' : 'text-gray-400'} />
                <span>Snooze</span>
              </button>

              {/* Quick Steps (with split dropdown) */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => toggleSplit('quicksteps')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors"
                  title="Run Quick Step automation"
                >
                  <Zap size={14} className={hasSelection ? 'text-amber-500' : 'text-gray-400'} />
                  <span>Quick Steps</span>
                  <ChevronDown size={11} className="text-gray-400" />
                </button>

                {openSplit === 'quicksteps' && hasSelection && (
                  <div className="absolute left-0 top-[calc(100%+4px)] w-56 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 py-1.5 text-xs rounded-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-1 font-semibold text-[10px] text-gray-400 uppercase tracking-wider">
                      Quick Steps
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSplit(null);
                        onQuickStep?.('done');
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-gray-800 transition-colors"
                    >
                      <Check size={14} className="text-emerald-600" />
                      <div>
                        <div className="font-semibold text-xs">Done</div>
                        <div className="text-[10px] text-gray-500">Mark read &amp; move to Archive</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSplit(null);
                        onQuickStep?.('follow_up');
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-gray-800 transition-colors"
                    >
                      <Flag size={14} className="text-amber-600" />
                      <div>
                        <div className="font-semibold text-xs">Follow-up</div>
                        <div className="text-[10px] text-gray-500">Flag with Orange category</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSplit(null);
                        onQuickStep?.('team_review');
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-gray-800 transition-colors"
                    >
                      <Forward size={14} className="text-blue-600" />
                      <div>
                        <div className="font-semibold text-xs">Team Review</div>
                        <div className="text-[10px] text-gray-500">Forward thread to team</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-gray-200 mx-1" />

              {/* LayoutGrid / Apps Icon */}
              <button
                type="button"
                onClick={() => setIsAddInsOpen(true)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Office Add-ins"
              >
                <LayoutGrid size={14} />
              </button>

              {/* Discover Groups */}
              <button
                type="button"
                onClick={() => setIsGroupsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="Discover groups"
              >
                <Users size={14} className="text-gray-600" />
                <span>Discover groups</span>
              </button>

              {/* Undo */}
              <button
                type="button"
                onClick={onUndo}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw size={14} />
                <span>Undo</span>
              </button>

              {/* Overflow ••• */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => toggleSplit('more')}
                  className={`p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors ${openSplit === 'more' ? 'bg-gray-100' : ''}`}
                  title="More actions"
                >
                  <MoreHorizontal size={15} />
                </button>

                {openSplit === 'more' && (
                  <div className="absolute right-0 top-[calc(100%+4px)] w-52 bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] z-50 py-1.5 text-xs rounded-md ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); window.print(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Printer size={14} className="text-gray-600" />
                      <span>Print (Ctrl+P)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); setIsSourceModalOpen(true); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Code size={14} className="text-gray-600" />
                      <span>View message source</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); if (onToggleFlag) onToggleFlag(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Pin size={14} className="text-gray-600" />
                      <span>Pin to top</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenSplit(null); setIsSnoozeModalOpen(true); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F3F4F6] text-left text-[#242424] transition-colors"
                    >
                      <Clock size={14} className="text-gray-600" />
                      <span>Snooze</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'view' && (
            <div className="flex items-center gap-4 text-xs py-1 min-w-max flex-1">
              {/* Density */}
              <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3">
                <span className="text-gray-500 font-medium">Density:</span>
                <button
                  type="button"
                  onClick={() => onDensityChange('comfortable')}
                  className={`px-2.5 py-0.5 rounded-full text-xs border ${
                    density === 'comfortable'
                      ? 'bg-brand-ice text-brand-cobalt border-brand-cobalt font-semibold'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Comfortable
                </button>
                <button
                  type="button"
                  onClick={() => onDensityChange('compact')}
                  className={`px-2.5 py-0.5 rounded-full text-xs border ${
                    density === 'compact'
                      ? 'bg-brand-ice text-brand-cobalt border-brand-cobalt font-semibold'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Compact
                </button>
              </div>

              {/* Reading Pane Position */}
              <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3">
                <span className="text-gray-500 font-medium">Reading pane:</span>
                <button
                  type="button"
                  onClick={() => onReadingPanePositionChange('right')}
                  className={`p-1 rounded ${readingPanePosition === 'right' ? 'bg-brand-ice text-brand-cobalt' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="Right side"
                >
                  <Columns size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onReadingPanePositionChange('bottom')}
                  className={`p-1 rounded ${readingPanePosition === 'bottom' ? 'bg-brand-ice text-brand-cobalt' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="Bottom side"
                >
                  <Rows size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onReadingPanePositionChange('off')}
                  className={`p-1 rounded ${readingPanePosition === 'off' ? 'bg-brand-ice text-brand-cobalt' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="Hide pane"
                >
                  <EyeOff size={15} />
                </button>
              </div>

              {/* Conversations Grouping */}
              <button
                type="button"
                onClick={onConversationGroupingToggle}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${
                  conversationGrouping
                    ? 'bg-brand-ice text-brand-cobalt border-brand-cobalt font-semibold'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Layers size={13} />
                <span>Group by conversation</span>
              </button>

              {/* Dark mode */}
              <button
                type="button"
                onClick={onDarkModeToggle}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs"
              >
                {isDarkMode ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} />}
                <span>{isDarkMode ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="flex items-center gap-3 text-xs py-1 min-w-max flex-1">
              <button
                type="button"
                onClick={onOpenKeyboardShortcuts}
                className="flex items-center gap-1.5 px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors"
              >
                <Keyboard size={14} className="text-brand-cobalt" />
                <span>Keyboard shortcuts</span>
              </button>

              <button
                type="button"
                onClick={onOpenWhatsNew}
                className="flex items-center gap-1.5 px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors"
              >
                <Sparkles size={14} className="text-brand-terracotta" />
                <span>What&apos;s new</span>
              </button>

              <button
                type="button"
                onClick={onOpenSupport}
                className="flex items-center gap-1.5 px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors"
              >
                <LifeBuoy size={14} className="text-emerald-600" />
                <span>Help &amp; Support</span>
              </button>
            </div>
          )}

          {/* Right Chevron: Collapse / Expand Ribbon */}
          <button
            type="button"
            onClick={() => setIsRibbonCollapsed(true)}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors ml-2 flex-shrink-0"
            title="Collapse ribbon"
          >
            <ChevronUp size={15} />
          </button>
        </div>
      )}

      {/* Expand button when collapsed */}
      {isRibbonCollapsed && (
        <div className="h-6 px-3 flex items-center justify-end bg-white border-b border-gray-100">
          <button
            type="button"
            onClick={() => setIsRibbonCollapsed(false)}
            className="p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Expand ribbon"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      {/* Backstage File Modal */}
      {isBackstageOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsBackstageOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-brand-cobalt text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span className="font-semibold text-sm">Account Information</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBackstageOpen(false)}
                className="p-1 hover:bg-white/20 text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200">
                <div className="w-12 h-12 bg-brand-cobalt text-white flex items-center justify-center font-bold text-sm">
                  AB
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">Alex Bennett</h3>
                  <p className="text-xs text-gray-500 font-mono">alex.bennett@outlook.com</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-brand-cobalt text-[10px] font-medium rounded-full">
                    Microsoft Exchange • Connected
                  </span>
                </div>
              </div>

              {/* Mailbox Storage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span className="font-semibold flex items-center gap-1.5">
                    <HardDrive size={14} className="text-gray-500" />
                    Mailbox Storage
                  </span>
                  <span className="font-mono text-gray-500">4.8 GB of 50.0 GB (9.6%)</span>
                </div>
                <div className="w-full bg-gray-200 h-2 overflow-hidden">
                  <div className="bg-brand-cobalt h-full w-[9.6%]" />
                </div>
              </div>

              {/* Quick Config Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBackstageOpen(false)}
                  className="p-3 border border-gray-200 hover:border-brand-cobalt hover:bg-gray-50/80 text-left transition-all group"
                >
                  <div className="font-semibold text-xs text-gray-900 group-hover:text-brand-cobalt">Automatic Replies (OOF)</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Send out of office notices to internal & external senders</div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBackstageOpen(false)}
                  className="p-3 border border-gray-200 hover:border-brand-cobalt hover:bg-gray-50/80 text-left transition-all group"
                >
                  <div className="font-semibold text-xs text-gray-900 group-hover:text-brand-cobalt">Rules and Alerts</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Manage email routing rules and notification badges</div>
                </button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBackstageOpen(false)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Office Add-ins Modal */}
      {isAddInsOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsAddInsOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid size={17} />
                <span className="font-semibold text-sm">Add-ins for Outlook</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddInsOpen(false)}
                className="p-1 hover:bg-white/20 text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                placeholder="Search add-ins..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 focus:outline-hidden focus:border-brand-cobalt"
              />
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[50vh]">
              {[
                { id: 'zoom', name: 'Zoom for Outlook', desc: 'Generate meeting links and manage calendar invites directly from Outlook.' },
                { id: 'docusign', name: 'DocuSign eSignature', desc: 'Securely sign and track contract approvals inside conversation threads.' },
                { id: 'trello', name: 'Trello for Outlook', desc: 'Convert incoming customer emails directly into prioritized Trello cards.' },
                { id: 'salesforce', name: 'Salesforce Inbox', desc: 'Sync CRM contacts, deal pipelines, and conversation history automatically.' }
              ].map(item => {
                const isAdded = addedAddIns.has(item.id);
                return (
                  <div key={item.id} className="p-3 border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAddedAddIns(prev => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        });
                      }}
                      className={`px-3 py-1 text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0 ${
                        isAdded 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-brand-cobalt text-white hover:bg-brand-cobalt/90'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={12} />
                          <span>Added</span>
                        </>
                      ) : (
                        <span>Add</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddInsOpen(false)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discover Groups Modal */}
      {isGroupsOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsGroupsOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-brand-cobalt text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={17} />
                <span className="font-semibold text-sm">Discover Outlook Groups</span>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupsOpen(false)}
                className="p-1 hover:bg-white/20 text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[50vh]">
              {[
                { id: 'design-guild', name: 'Product Design Guild', count: '34 members', desc: 'Design system tokens, typography standards, and UX audits.' },
                { id: 'frontend-core', name: 'Frontend Architecture', count: '58 members', desc: 'React, TypeScript, state machine patterns, and performance metrics.' },
                { id: 'emea-marketing', name: 'EMEA Operations & Marketing', count: '22 members', desc: 'Q4 regional product rollouts, translations, and event marketing.' }
              ].map(grp => {
                const isMember = joinedGroups.has(grp.id);
                return (
                  <div key={grp.id} className="p-3 border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900">{grp.name}</h4>
                        <span className="text-[10px] text-gray-500 font-mono">({grp.count})</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{grp.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJoinedGroups(prev => {
                          const next = new Set(prev);
                          if (next.has(grp.id)) next.delete(grp.id);
                          else next.add(grp.id);
                          return next;
                        });
                      }}
                      className={`px-3 py-1 text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0 ${
                        isMember 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-brand-cobalt text-white hover:bg-brand-cobalt/90'
                      }`}
                    >
                      {isMember ? (
                        <>
                          <Check size={12} />
                          <span>Joined</span>
                        </>
                      ) : (
                        <span>Join</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGroupsOpen(false)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Message Source Modal */}
      {isSourceModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsSourceModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={16} />
                <span className="font-semibold text-xs">Internet Headers &amp; RFC 822 MIME Source</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSourceModalOpen(false)}
                className="p-1 hover:bg-white/20 text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 bg-[#1E1E1E] text-emerald-400 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[55vh] selection:bg-emerald-800 selection:text-white">
              <pre className="whitespace-pre-wrap">
{`Received: from mail-eur01.outbound.protection.outlook.com (104.47.14.42)
  by host.prod.exchange.microsoft.com with HTTPS;
Authentication-Results: spf=pass (sender IP is 104.47.14.42)
  smtp.mailfrom=alex.bennett@outlook.com; dkim=pass (signature verified)
  header.d=outlook.com; dmarc=pass action=none
From: "Alex Bennett" <alex.bennett@outlook.com>
To: <recipient@organization.com>
Subject: Re: High-Fidelity Client Build & Workspace Sync
Date: Thu, 16 Sep 2026 14:28:40 +0000
Message-ID: <MSX-774921-20260916@outlook.com>
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="----=_Part_92147_982142.1694874520"
X-Microsoft-Antispam: BCL:0; PCL:0; SCORE:0.0
X-MS-Exchange-Organization-AuthAs: Internal`}
              </pre>
            </div>

            <div className="p-3 bg-gray-100 border-t border-gray-300 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Security Signature: Verified SHA-256</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Authentication-Results: spf=pass; dkim=pass\nFrom: Alex Bennett <alex.bennett@outlook.com>`);
                    setSourceCopied(true);
                    setTimeout(() => setSourceCopied(false), 2000);
                  }}
                  className="px-3 py-1 bg-white border border-gray-300 text-gray-800 text-xs font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                >
                  {sourceCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{sourceCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSourceModalOpen(false)}
                  className="px-4 py-1 bg-brand-cobalt hover:bg-[#004578] text-white text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snooze Modal */}
      {isSnoozeModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsSnoozeModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-sm flex flex-col shadow-2xl border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-brand-cobalt text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span className="font-semibold text-xs">Snooze Message</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSnoozeModalOpen(false)}
                className="p-1 hover:bg-white/20 text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-3 divide-y divide-gray-100 text-xs">
              {[
                { title: 'Later today', time: '6:00 PM' },
                { title: 'Tomorrow morning', time: '8:00 AM' },
                { title: 'This weekend', time: 'Saturday, 8:00 AM' },
                { title: 'Next week', time: 'Monday, 8:00 AM' }
              ].map(slot => (
                <button
                  key={slot.title}
                  type="button"
                  onClick={() => {
                    setIsSnoozeModalOpen(false);
                    onSnooze?.(slot.title);
                  }}
                  className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-gray-100 text-left transition-colors"
                >
                  <span className="font-medium text-gray-800">{slot.title}</span>
                  <span className="text-gray-400 font-mono text-[11px]">{slot.time}</span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSnoozeModalOpen(false)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
