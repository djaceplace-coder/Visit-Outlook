import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Menu,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  MinusSquare,
  Trash2,
  Mail,
  MailOpen,
  Flag,
  Pin,
  Paperclip,
  AlertCircle,
  FolderInput,
  Check,
  ChevronDown,
  Layers,
  Search,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import {
  EmailMessage,
  EmailTab,
  FolderItem,
  SortField,
  SortDirection,
  FilterField,
  Density,
  ReadingPanePosition
} from '../../types/mail';
import { AdvancedSearchFilters } from './AdvancedSearchModal';
import { EmptyInboxGraphic } from './EmptyInboxGraphic';
import { getCategoryBadgeStyle } from '../../lib/mailCategoryHelper';

interface MessageListProps {
  messages: EmailMessage[];
  activeFolderId: string;
  activeFolderName: string;
  activeTab: EmailTab;
  onTabChange: (tab: EmailTab) => void;
  selectedMessageId: string | null;
  onSelectMessage: (id: string) => void;
  selectedMessageIds: Set<string>;
  onToggleSelectMessage: (id: string, multiSelect?: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  density: Density;
  readingPanePosition: ReadingPanePosition;
  isConversationGrouping: boolean;
  onToggleConversationGrouping: () => void;
  onDeleteMessages: (ids: string[]) => void;
  onToggleReadMessages: (ids: string[]) => void;
  onToggleFlagMessages: (ids: string[]) => void;
  onTogglePinMessages: (ids: string[]) => void;
  onMoveMessages: (ids: string[], targetFolderId: string) => void;
  searchQuery: string;
  folders: FolderItem[];
  advancedFilters?: AdvancedSearchFilters | null;
  onClearAdvancedFilters?: () => void;
  enableFocusedInbox?: boolean;
  onOpenFolderPane?: () => void;
}

export function MessageList({
  messages,
  activeFolderId,
  activeFolderName,
  activeTab,
  onTabChange,
  selectedMessageId,
  onSelectMessage,
  selectedMessageIds,
  onToggleSelectMessage,
  onSelectAll,
  onClearSelection,
  density,
  readingPanePosition,
  isConversationGrouping,
  onToggleConversationGrouping,
  onDeleteMessages,
  onToggleReadMessages,
  onToggleFlagMessages,
  onTogglePinMessages,
  onMoveMessages,
  searchQuery,
  folders,
  advancedFilters,
  onClearAdvancedFilters,
  enableFocusedInbox = true,
  onOpenFolderPane,
}: MessageListProps) {
  // Sort and Filter States
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterField, setFilterField] = useState<FilterField>('all');

  // Popover menus
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);

  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setIsMoveMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute Unread Counts for Focused & Other in Inbox
  const { focusedUnread, otherUnread } = useMemo(() => {
    let fCount = 0;
    let oCount = 0;
    for (const msg of messages) {
      if (msg.folder === 'inbox' && !msg.read) {
        if (msg.tab === 'focused') fCount++;
        else if (msg.tab === 'other') oCount++;
      }
    }
    return { focusedUnread: fCount, otherUnread: oCount };
  }, [messages]);

  // Thread Map for conversation grouping
  // Each threadId maps to all messages in that thread within the current view
  const threadCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const msg of messages) {
      map.set(msg.threadId, (map.get(msg.threadId) || 0) + 1);
    }
    return map;
  }, [messages]);

  // Filter messages based on folder, tab, filter criteria, and search query
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // 0. Advanced Filters
      if (advancedFilters) {
        if (advancedFilters.folder !== 'all' && msg.folder !== advancedFilters.folder) {
          return false;
        }
        if (advancedFilters.from.trim()) {
          const fromQ = advancedFilters.from.toLowerCase();
          const matchFrom = msg.from.name.toLowerCase().includes(fromQ) || msg.from.email.toLowerCase().includes(fromQ);
          if (!matchFrom) return false;
        }
        if (advancedFilters.to.trim()) {
          const toQ = advancedFilters.to.toLowerCase();
          const matchTo = msg.to.some(t => t.name.toLowerCase().includes(toQ) || t.email.toLowerCase().includes(toQ));
          if (!matchTo) return false;
        }
        if (advancedFilters.subject.trim()) {
          if (!msg.subject.toLowerCase().includes(advancedFilters.subject.toLowerCase())) return false;
        }
        if (advancedFilters.keyword.trim()) {
          const kw = advancedFilters.keyword.toLowerCase();
          const inSubj = msg.subject.toLowerCase().includes(kw);
          const inBody = msg.body.toLowerCase().includes(kw);
          const inPrev = msg.preview.toLowerCase().includes(kw);
          if (!inSubj && !inBody && !inPrev) return false;
        }
        if (advancedFilters.hasAttachment) {
          const hasAtt = msg.hasAttachments || (msg.attachments && msg.attachments.length > 0);
          if (!hasAtt) return false;
        }
        if (advancedFilters.isUnread && msg.read) return false;
        if (advancedFilters.isFlagged && !msg.flagged) return false;
        if (advancedFilters.dateRange && advancedFilters.dateRange !== 'all') {
          const now = Date.now();
          const age = now - msg.timestamp;
          if (advancedFilters.dateRange === 'today' && age > 24 * 60 * 60 * 1000) return false;
          if (advancedFilters.dateRange === 'week' && age > 7 * 24 * 60 * 60 * 1000) return false;
          if (advancedFilters.dateRange === 'month' && age > 30 * 24 * 60 * 60 * 1000) return false;
          if (advancedFilters.dateRange === 'year' && age > 365 * 24 * 60 * 60 * 1000) return false;
        }
        return true;
      }

      // 1. Folder match
      if (activeFolderId !== 'all') {
        if (msg.folder !== activeFolderId) return false;
      }

      // 2. Focused / Other Tab match (only applies to Inbox when enabled)
      if (enableFocusedInbox && activeFolderId === 'inbox' && msg.tab !== activeTab) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFrom =
          msg.from.name.toLowerCase().includes(q) ||
          msg.from.email.toLowerCase().includes(q);
        const matchSubj = msg.subject.toLowerCase().includes(q);
        const matchBody = msg.body.toLowerCase().includes(q);
        if (!matchFrom && !matchSubj && !matchBody) return false;
      }

      // 4. Quick filter
      if (filterField === 'unread' && msg.read) return false;
      if (filterField === 'flagged' && !msg.flagged) return false;
      if (filterField === 'has_files' && !msg.hasAttachments) return false;
      if (filterField === 'to_me') {
        const isDirect = msg.to.some((t) => t.email.includes('alex.bennett'));
        if (!isDirect) return false;
      }

      return true;
    });
  }, [messages, activeFolderId, activeTab, searchQuery, filterField, advancedFilters, enableFocusedInbox]);

  // Group by thread if conversation grouping is enabled
  // We keep the latest message of each thread as the representative card
  const processedMessages = useMemo(() => {
    let list = [...filteredMessages];

    if (isConversationGrouping) {
      const seenThreads = new Set<string>();
      const grouped: EmailMessage[] = [];

      // Sort by timestamp desc first to pick the latest message of each thread
      list.sort((a, b) => b.timestamp - a.timestamp);

      for (const msg of list) {
        if (!seenThreads.has(msg.threadId)) {
          seenThreads.add(msg.threadId);
          grouped.push(msg);
        }
      }
      list = grouped;
    }

    // Sort according to active sort options
    list.sort((a, b) => {
      // Pinned messages always stay at the very top
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) {
        return bPinned - aPinned;
      }

      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortField === 'from') {
        comparison = a.from.name.localeCompare(b.from.name);
      } else if (sortField === 'subject') {
        comparison = a.subject.localeCompare(b.subject);
      } else if (sortField === 'importance') {
        const rank = { high: 3, normal: 2, low: 1 };
        comparison = (rank[a.importance || 'normal'] || 2) - (rank[b.importance || 'normal'] || 2);
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return list;
  }, [filteredMessages, isConversationGrouping, sortField, sortDirection]);

  // Partition into Pinned and Non-Pinned for display
  const { pinnedList, unpinnedList } = useMemo(() => {
    const pinned: EmailMessage[] = [];
    const unpinned: EmailMessage[] = [];
    for (const msg of processedMessages) {
      if (msg.pinned) pinned.push(msg);
      else unpinned.push(msg);
    }
    return { pinnedList: pinned, unpinnedList: unpinned };
  }, [processedMessages]);

  const hasSelection = selectedMessageIds.size > 0;
  const isAllSelected =
    processedMessages.length > 0 &&
    processedMessages.every((m) => selectedMessageIds.has(m.id));
  const isPartialSelected = hasSelection && !isAllSelected;

  // Flattened folders list for move menu
  const flattenedFolders = useMemo(() => {
    const result: Array<{ id: string; name: string }> = [];
    const traverse = (items: FolderItem[]) => {
      for (const item of items) {
        result.push({ id: item.id, name: item.name });
        if (item.children) traverse(item.children);
      }
    };
    traverse(folders);
    return result;
  }, [folders]);

  // Keyboard navigation through message list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!processedMessages.length) return;
    const currentIndex = processedMessages.findIndex((m) => m.id === selectedMessageId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, processedMessages.length - 1);
      onSelectMessage(processedMessages[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, 0);
      onSelectMessage(processedMessages[prevIndex].id);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedMessageId) {
        onDeleteMessages([selectedMessageId]);
      }
    }
  };

  const renderMessageCard = (msg: EmailMessage) => {
    const isSelected = msg.id === selectedMessageId;
    const isChecked = selectedMessageIds.has(msg.id);
    const threadCount = threadCountMap.get(msg.threadId) || 1;
    const showThreadBadge = isConversationGrouping && threadCount > 1;

    return (
      <div
        key={msg.id}
        id={`message-row-${msg.id}`}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', msg.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => onSelectMessage(msg.id)}
        className={`group relative border-b border-gray-100 cursor-pointer select-none transition-colors border-l-4 ${
          isChecked
            ? 'bg-[#E3EFFE] border-brand-cobalt'
            : isSelected
              ? 'bg-[#EDF3FD] border-brand-cobalt'
              : !msg.read
                ? 'bg-white hover:bg-gray-50 border-brand-cobalt/80 font-medium'
                : 'bg-white hover:bg-gray-50 border-transparent'
        } ${density === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-3.5'}`}
      >
        {/* Main Card Content */}
        <div className="flex items-start gap-2.5">
          {/* Left Checkbox & Unread dot indicator */}
          <div
            className="pt-0.5 flex-shrink-0 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelectMessage(msg.id, e.shiftKey);
            }}
          >
            {isChecked ? (
              <CheckSquare size={16} className="text-brand-cobalt" />
            ) : hasSelection ? (
              <Square size={16} className="text-gray-400 hover:text-gray-600" />
            ) : (
              <div className="relative w-4 h-4 flex items-center justify-center">
                {/* On normal state show blue unread dot if unread */}
                {!msg.read && (
                  <span className="w-2 h-2 rounded-full bg-brand-cobalt group-hover:opacity-0 transition-opacity" />
                )}
                {/* On hover, reveal the selection checkbox */}
                <Square
                  size={16}
                  className="text-gray-400 hover:text-brand-cobalt opacity-0 group-hover:opacity-100 absolute inset-0 transition-opacity"
                />
              </div>
            )}
          </div>

          {/* Center Message Content */}
          <div className="min-w-0 flex-1">
            {/* Top row: Sender Name + Thread badge + Date */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`text-xs truncate ${
                    !msg.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'
                  }`}
                >
                  {msg.from.name}
                </span>

                {/* Conversation Thread Badge */}
                {showThreadBadge && (
                  <span
                    className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold bg-gray-200/90 text-gray-700 rounded-full"
                    title={`${threadCount} messages in conversation`}
                  >
                    {threadCount}
                  </span>
                )}

                {/* Importance flag */}
                {msg.importance === 'high' && (
                  <AlertCircle size={12} className="text-red-600 flex-shrink-0" />
                )}
              </div>

              {/* Timestamp / Date */}
              <span
                className={`text-[11px] flex-shrink-0 ${
                  !msg.read ? 'font-semibold text-brand-cobalt' : 'text-gray-400'
                }`}
              >
                {msg.date}
              </span>
            </div>

            {/* Subject row */}
            <div className="flex items-center gap-1.5 text-xs mb-0.5 truncate">
              {msg.meetingInvite && (
                <span className="inline-flex items-center text-[#0078D4] flex-shrink-0" title="Meeting invitation">
                  <CalendarIcon size={12} />
                </span>
              )}

              <span
                className={`truncate ${
                  !msg.read ? 'font-semibold text-gray-900' : 'text-gray-800'
                }`}
              >
                {msg.subject}
              </span>

              {/* Attachment Clip */}
              {msg.hasAttachments && (
                <Paperclip size={12} className="text-gray-400 flex-shrink-0" />
              )}

              {/* Category Badge */}
              {msg.category && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold border flex-shrink-0 ${getCategoryBadgeStyle(
                    msg.category
                  )}`}
                >
                  {msg.category}
                </span>
              )}
            </div>

            {/* Preview Snippet */}
            <p
              className={`text-[11px] text-gray-500 leading-relaxed font-normal ${
                density === 'compact' ? 'line-clamp-1' : 'line-clamp-2'
              }`}
            >
              {msg.preview}
            </p>
          </div>
        </div>

        {/* Floating Quick Hover Action Bar (Classic Outlook Web Feature) */}
        <div
          className="absolute right-2 top-2 hidden group-hover:flex items-center bg-white/95 backdrop-blur-sm border border-gray-200 shadow-sm px-1 py-0.5 gap-0.5 z-10 animate-in fade-in duration-75"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Delete */}
          <button
            type="button"
            onClick={() => onDeleteMessages([msg.id])}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-none transition-colors"
            title="Delete (Del)"
          >
            <Trash2 size={13} />
          </button>

          {/* Quick Mark Read/Unread */}
          <button
            type="button"
            onClick={() => onToggleReadMessages([msg.id])}
            className="p-1 text-gray-500 hover:text-brand-cobalt hover:bg-gray-100 rounded-none transition-colors"
            title={msg.read ? 'Mark as unread' : 'Mark as read'}
          >
            {msg.read ? <Mail size={13} /> : <MailOpen size={13} />}
          </button>

          {/* Quick Flag */}
          <button
            type="button"
            onClick={() => onToggleFlagMessages([msg.id])}
            className={`p-1 rounded-none transition-colors ${
              msg.flagged
                ? 'text-brand-terracotta bg-amber-50'
                : 'text-gray-500 hover:text-brand-terracotta hover:bg-gray-100'
            }`}
            title={msg.flagged ? 'Clear flag' : 'Flag message'}
          >
            <Flag size={13} className={msg.flagged ? 'fill-brand-terracotta' : ''} />
          </button>

          {/* Quick Pin */}
          <button
            type="button"
            onClick={() => onTogglePinMessages([msg.id])}
            className={`p-1 rounded-none transition-colors ${
              msg.pinned
                ? 'text-brand-cobalt bg-blue-50'
                : 'text-gray-500 hover:text-brand-cobalt hover:bg-gray-100'
            }`}
            title={msg.pinned ? 'Unpin message' : 'Pin to top'}
          >
            <Pin size={13} className={msg.pinned ? 'fill-brand-cobalt' : ''} />
          </button>
        </div>

        {/* Permanent Indicators when not hovered (Pinned & Flagged icons) */}
        <div className="absolute right-3 bottom-2 flex items-center gap-1 group-hover:opacity-0 transition-opacity">
          {msg.pinned && (
            <Pin size={11} className="text-brand-cobalt fill-brand-cobalt" />
          )}
          {msg.flagged && (
            <Flag size={11} className="text-brand-terracotta fill-brand-terracotta" />
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      id="outlook-message-list-pane"
      aria-label="Message list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`${
        readingPanePosition === 'off'
          ? 'w-full'
          : readingPanePosition === 'bottom'
            ? 'h-1/2 w-full border-b border-gray-200'
            : 'w-full md:w-80 lg:w-96 border-r border-gray-200'
      } flex flex-col flex-shrink-0 bg-white min-w-0 overflow-hidden outline-none select-none`}
    >
      {/* 1. Header Toolbar: Tabs or Folder Title + Multi-Select Actions + Filter/Sort */}
      <div className="border-b border-gray-200 bg-[#FAFAFA] flex-shrink-0">
        {/* If Multiple items are selected, show Bulk Action Bar */}
        {hasSelection ? (
          <div className="px-3 py-2 bg-[#EBF3FC] border-b border-brand-cobalt/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSelectAll}
                className="text-brand-cobalt hover:text-[#004578]"
                title={isAllSelected ? 'Deselect all' : 'Select all'}
              >
                {isAllSelected ? (
                  <CheckSquare size={16} />
                ) : isPartialSelected ? (
                  <MinusSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
              </button>
              <span className="text-xs font-semibold text-brand-cobalt">
                {selectedMessageIds.size} selected
              </span>
            </div>

            {/* Quick Multi-Select Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDeleteMessages(Array.from(selectedMessageIds))}
                className="p-1 text-gray-700 hover:text-red-600 hover:bg-white rounded-none"
                title="Delete selected"
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => onToggleReadMessages(Array.from(selectedMessageIds))}
                className="p-1 text-gray-700 hover:text-brand-cobalt hover:bg-white rounded-none"
                title="Toggle read"
              >
                <Mail size={14} />
              </button>
              <button
                type="button"
                onClick={() => onToggleFlagMessages(Array.from(selectedMessageIds))}
                className="p-1 text-gray-700 hover:text-brand-terracotta hover:bg-white rounded-none"
                title="Toggle flag"
              >
                <Flag size={14} />
              </button>

              {/* Move to folder dropdown */}
              <div className="relative" ref={moveMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoveMenuOpen((prev) => !prev)}
                  className="p-1 text-gray-700 hover:text-brand-cobalt hover:bg-white rounded-none"
                  title="Move selected"
                >
                  <FolderInput size={14} />
                </button>
                {isMoveMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-300 shadow-lg py-1 z-30 text-xs">
                    <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">
                      Move to
                    </div>
                    {flattenedFolders.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          onMoveMessages(Array.from(selectedMessageIds), f.id);
                          setIsMoveMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#EDF3FD] hover:text-brand-cobalt truncate"
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Exit multi-select */}
              <button
                type="button"
                onClick={onClearSelection}
                className="p-1 text-gray-500 hover:text-gray-800 hover:bg-white rounded-none ml-1"
                title="Clear selection"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Header Row */
          <div className="px-3 pt-2">
            <div className="flex items-center justify-between mb-1.5">
              {/* Left: Optional mobile folder toggle + Focused/Other Tabs or Folder Name */}
              <div className="flex items-center gap-2">
                {onOpenFolderPane && (
                  <button
                    type="button"
                    onClick={onOpenFolderPane}
                    className="md:hidden p-1 -ml-1 text-gray-600 hover:text-brand-cobalt hover:bg-gray-100 rounded transition-colors"
                    title="Open Folders"
                    aria-label="Open Folders"
                  >
                    <Menu size={16} />
                  </button>
                )}
                {activeFolderId === 'inbox' && enableFocusedInbox ? (
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => onTabChange('focused')}
                      className={`pb-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'focused'
                          ? 'border-brand-cobalt text-brand-cobalt'
                          : 'border-transparent text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <span>Focused</span>
                      {focusedUnread > 0 && (
                        <span className="text-[10px] px-1 bg-brand-ice text-brand-cobalt font-bold rounded-sm">
                          {focusedUnread}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onTabChange('other')}
                      className={`pb-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'other'
                          ? 'border-brand-cobalt text-brand-cobalt'
                          : 'border-transparent text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <span>Other</span>
                      {otherUnread > 0 && (
                        <span className="text-[10px] px-1 bg-gray-200 text-gray-700 font-bold rounded-sm">
                          {otherUnread}
                        </span>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      {activeFolderName}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({processedMessages.length})
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Filter & Sort Controls */}
              <div className="flex items-center gap-1">
                {/* Threading toggle badge */}
                <button
                  type="button"
                  onClick={onToggleConversationGrouping}
                  className={`p-1 rounded-none text-xs transition-colors ${
                    isConversationGrouping
                      ? 'text-brand-cobalt bg-brand-ice/80'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                  title={
                    isConversationGrouping
                      ? 'Conversations grouped (Click to ungroup)'
                      : 'Show as individual messages'
                  }
                >
                  <Layers size={13} />
                </button>

                {/* Filter Popover Button */}
                <div className="relative" ref={filterMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                    className={`px-2 py-1 flex items-center gap-1 rounded-none text-xs border transition-colors ${
                      filterField !== 'all'
                        ? 'bg-brand-ice text-brand-cobalt border-brand-cobalt/40 font-semibold'
                        : 'border-transparent text-gray-600 hover:bg-gray-200/60'
                    }`}
                    title="Filter messages"
                  >
                    <Filter size={12} />
                    <span className="capitalize">{filterField.replace('_', ' ')}</span>
                    <ChevronDown size={11} />
                  </button>

                  {/* Filter Menu Dropdown */}
                  {isFilterMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-300 shadow-lg py-1 z-30 text-xs">
                      <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">
                        Filter by
                      </div>
                      {[
                        { id: 'all', label: 'All messages' },
                        { id: 'unread', label: 'Unread' },
                        { id: 'flagged', label: 'Flagged' },
                        { id: 'to_me', label: 'To me directly' },
                        { id: 'has_files', label: 'Has attachments' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFilterField(item.id as FilterField);
                            setIsFilterMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#EDF3FD] hover:text-brand-cobalt ${
                            filterField === item.id ? 'font-bold text-brand-cobalt' : 'text-gray-700'
                          }`}
                        >
                          <span>{item.label}</span>
                          {filterField === item.id && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Popover Button */}
                <div className="relative" ref={sortMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortMenuOpen((prev) => !prev)}
                    className="p-1 text-gray-600 hover:bg-gray-200/60 rounded-none transition-colors"
                    title={`Sorted by ${sortField} (${sortDirection})`}
                  >
                    <ArrowUpDown size={13} />
                  </button>

                  {/* Sort Menu Dropdown */}
                  {isSortMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-300 shadow-lg py-1 z-30 text-xs">
                      <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">
                        Sort by
                      </div>
                      {[
                        { id: 'date', label: 'Date' },
                        { id: 'from', label: 'From' },
                        { id: 'subject', label: 'Subject' },
                        { id: 'importance', label: 'Importance' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSortField(item.id as SortField);
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#EDF3FD] hover:text-brand-cobalt ${
                            sortField === item.id ? 'font-bold text-brand-cobalt' : 'text-gray-700'
                          }`}
                        >
                          <span>{item.label}</span>
                          {sortField === item.id && <Check size={13} />}
                        </button>
                      ))}

                      <div className="h-px bg-gray-100 my-1" />

                      <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">
                        Order
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSortDirection('desc');
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#EDF3FD] ${
                          sortDirection === 'desc' ? 'font-bold text-brand-cobalt' : 'text-gray-700'
                        }`}
                      >
                        <span>Newest on top</span>
                        {sortDirection === 'desc' && <Check size={13} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortDirection('asc');
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#EDF3FD] ${
                          sortDirection === 'asc' ? 'font-bold text-brand-cobalt' : 'text-gray-700'
                        }`}
                      >
                        <span>Oldest on top</span>
                        {sortDirection === 'asc' && <Check size={13} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Advanced Filter banner */}
        {advancedFilters && (
          <div className="px-3 py-1.5 bg-brand-ice border-t border-b border-brand-cobalt/20 flex items-center justify-between text-xs text-brand-cobalt">
            <div className="flex items-center gap-1.5 truncate">
              <Filter size={12} className="flex-shrink-0 text-brand-cobalt" />
              <span className="font-semibold">Filter:</span>
              <span className="truncate text-gray-700">
                {[
                  advancedFilters.folder !== 'all' ? `Folder: ${folders.find(f => f.id === advancedFilters.folder)?.name || advancedFilters.folder}` : null,
                  advancedFilters.keyword ? `"${advancedFilters.keyword}"` : null,
                  advancedFilters.from ? `From: ${advancedFilters.from}` : null,
                  advancedFilters.to ? `To: ${advancedFilters.to}` : null,
                  advancedFilters.subject ? `Subj: ${advancedFilters.subject}` : null,
                  advancedFilters.hasAttachment ? 'Has attachment' : null,
                  advancedFilters.isUnread ? 'Unread' : null,
                  advancedFilters.isFlagged ? 'Flagged' : null,
                  advancedFilters.dateRange !== 'all' ? `Time: ${advancedFilters.dateRange}` : null,
                ].filter(Boolean).join(' • ')}
              </span>
            </div>
            {onClearAdvancedFilters && (
              <button
                type="button"
                onClick={onClearAdvancedFilters}
                className="ml-2 px-1.5 py-0.5 bg-white border border-brand-cobalt/30 hover:bg-brand-cobalt hover:text-white transition-colors flex items-center gap-1 text-[11px] flex-shrink-0"
              >
                <X size={11} />
                <span>Clear</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Message List Items Container */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {processedMessages.length === 0 ? (
          !searchQuery && filterField === 'all' && activeFolderId === 'inbox' ? (
            <div className="py-12 flex-1 flex flex-col items-center justify-center">
              <EmptyInboxGraphic
                title="All done for the day"
                subtitle="Enjoy your empty inbox."
              />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs my-auto">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Search size={18} />
              </div>
              <p className="font-semibold text-gray-600 mb-1">Nothing in this view</p>
              <p className="text-gray-400 max-w-xs mx-auto">
                {searchQuery
                  ? `No messages matched "${searchQuery}".`
                  : filterField !== 'all'
                    ? `No messages match the active "${filterField}" filter.`
                    : activeFolderId === 'inbox'
                      ? "You're all caught up in this view."
                      : 'No items in this folder.'}
              </p>
            </div>
          )
        ) : (
          <div>
            {/* Pinned Messages Section */}
            {pinnedList.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="px-3 py-1 bg-gray-50 flex items-center gap-1.5 text-[10px] font-bold text-brand-cobalt uppercase tracking-wider">
                  <Pin size={11} className="fill-brand-cobalt" />
                  <span>Pinned ({pinnedList.length})</span>
                </div>
                {pinnedList.map((msg) => renderMessageCard(msg))}
              </div>
            )}

            {/* Unpinned Messages Section */}
            {pinnedList.length > 0 && unpinnedList.length > 0 && (
              <div className="px-3 py-1 bg-gray-50 flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <span>Earlier</span>
              </div>
            )}

            {unpinnedList.map((msg) => renderMessageCard(msg))}
          </div>
        )}
      </div>
    </section>
  );
}
