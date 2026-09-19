import { useState, useEffect, useMemo } from 'react';
import { 
  Inbox as InboxIcon, 
  Send, 
  FileText, 
  Archive, 
  Trash2, 
  AlertOctagon, 
  StickyNote, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Mail, 
  MailOpen, 
  Flag, 
  Paperclip, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Reply, 
  ReplyAll, 
  Forward, 
  X, 
  Keyboard, 
  Sparkles, 
  LifeBuoy,
  FileSpreadsheet,
  FileImage,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { CommandRibbon } from '../mail/CommandRibbon';
import { FolderPane } from '../mail/FolderPane';
import { MessageList } from '../mail/MessageList';
import { ReadingPane } from '../mail/ReadingPane';
import { ComposeModal } from '../mail/ComposeModal';
import { AdvancedSearchFilters } from '../mail/AdvancedSearchModal';
import { 
  EmailMessage, 
  FolderItem, 
  EmailTab, 
  Density, 
  ReadingPanePosition, 
  RibbonTab 
} from '../../types/mail';
import { INITIAL_FOLDERS, INITIAL_MESSAGES } from '../../data/initialMailData';
import {
  fetchMailFolders,
  fetchMailMessages,
  insertMailMessage,
  updateMailMessages,
  insertUserFolder,
} from '../../lib/mailService';

interface InboxSectionProps {
  isFolderPaneOpen: boolean;
  onToggleFolderPane: () => void;
  searchQuery?: string;
  advancedFilters?: AdvancedSearchFilters | null;
  onClearAdvancedFilters?: () => void;
  density?: Density;
  onDensityChange?: (d: Density) => void;
  readingPanePosition?: ReadingPanePosition;
  onReadingPanePositionChange?: (p: ReadingPanePosition) => void;
  enableFocusedInbox?: boolean;
  onNavigateToSection?: (section: 'inbox' | 'calendar' | 'people' | 'tasks' | 'apps') => void;
  prefillCompose?: { to: string; subject?: string } | null;
  onClearPrefillCompose?: () => void;
  autoRepliesEnabled?: boolean;
  onDisableAutoReplies?: () => void;
  onOpenSettings?: () => void;
  accountEmail?: string;
}

export function InboxSection({
  isFolderPaneOpen,
  onToggleFolderPane,
  searchQuery = '',
  advancedFilters,
  onClearAdvancedFilters,
  density: propDensity,
  onDensityChange,
  readingPanePosition: propReadingPanePosition,
  onReadingPanePositionChange,
  enableFocusedInbox = true,
  onNavigateToSection,
  prefillCompose,
  onClearPrefillCompose,
  autoRepliesEnabled = false,
  onDisableAutoReplies,
  onOpenSettings,
  accountEmail = 'alex.bennett@outlook.com',
}: InboxSectionProps) {
  // Data state
  const [messages, setMessages] = useState<EmailMessage[]>(INITIAL_MESSAGES);
  const [folders, setFolders] = useState<FolderItem[]>(INITIAL_FOLDERS);
  const [activeFolderId, setActiveFolderId] = useState<string>('inbox');
  const [activeTab, setActiveTab] = useState<EmailTab>('focused');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>('msg-1');
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  
  // Toast notification with Undo
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);

  // Load Folders & Messages on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [fetchedFolders, fetchedMessages] = await Promise.all([
          fetchMailFolders(),
          fetchMailMessages(),
        ]);
        if (isMounted) {
          if (fetchedFolders && fetchedFolders.length > 0) setFolders(fetchedFolders);
          if (fetchedMessages && fetchedMessages.length > 0) {
            setMessages(fetchedMessages);
            setSelectedMessageId(fetchedMessages[0]?.id || null);
          }
        }
      } catch (err) {
        console.error('Failed to load mail data:', err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to find folder name by id
  const getFolderNameById = (id: string, list: FolderItem[] = folders): string => {
    for (const f of list) {
      if (f.id === id) return f.name;
      if (f.children) {
        const found = getFolderNameById(id, f.children);
        if (found) return found;
      }
    }
    return id;
  };

  // Folder management operations
  const handleCreateFolder = async (name: string, parentId?: string | null) => {
    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      name,
      unreadCount: 0,
      parentId: parentId || null
    };

    if (!parentId) {
      setFolders(prev => [...prev, newFolder]);
    } else {
      const addRecursively = (items: FolderItem[]): FolderItem[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newFolder]
            };
          }
          if (item.children) {
            return {
              ...item,
              children: addRecursively(item.children)
            };
          }
          return item;
        });
      };
      setFolders(prev => addRecursively(prev));
    }
    setToast({ message: `Folder "${name}" created.` });
    setTimeout(() => setToast(null), 4000);

    // Persist folder in background
    try {
      await insertUserFolder(name, parentId || null);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    const renameRecursively = (items: FolderItem[]): FolderItem[] => {
      return items.map(item => {
        if (item.id === folderId) {
          return { ...item, name: newName };
        }
        if (item.children) {
          return { ...item, children: renameRecursively(item.children) };
        }
        return item;
      });
    };
    setFolders(prev => renameRecursively(prev));
    setToast({ message: `Folder renamed to "${newName}".` });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteFolder = (folderId: string) => {
    const deleteRecursively = (items: FolderItem[]): FolderItem[] => {
      return items
        .filter(item => item.id !== folderId)
        .map(item => {
          if (item.children) {
            return { ...item, children: deleteRecursively(item.children) };
          }
          return item;
        });
    };
    setFolders(prev => deleteRecursively(prev));
    // Move any emails in that folder to deleted
    setMessages(prev => prev.map(m => m.folder === folderId ? { ...m, folder: 'deleted' } : m));
    if (activeFolderId === folderId) {
      setActiveFolderId('inbox');
    }
    setToast({ message: 'Folder deleted and messages moved to Deleted Items.' });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMarkFolderAsRead = (folderId: string) => {
    setMessages(prev => prev.map(m => m.folder === folderId ? { ...m, read: true } : m));
    setToast({ message: `Marked all messages in ${getFolderNameById(folderId)} as read.` });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEmptyFolder = (folderId: string) => {
    if (folderId === 'deleted' || folderId === 'junk') {
      setMessages(prev => prev.filter(m => m.folder !== folderId));
      setToast({ message: `Emptied ${getFolderNameById(folderId)}.` });
    } else {
      setMessages(prev => prev.map(m => m.folder === folderId ? { ...m, folder: 'deleted' } : m));
      setToast({ message: `Moved all messages to Deleted Items.` });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleMoveMessageToFolder = (messageId: string, targetFolderId: string) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg) return;
    const previousFolder = targetMsg.folder;
    if (previousFolder === targetFolderId) return;

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, folder: targetFolderId } : m));

    // Persist folder update
    updateMailMessages([messageId], { folder: targetFolderId }).catch(err => {
      console.error('Failed to sync move:', err);
    });

    const targetName = getFolderNameById(targetFolderId);
    setToast({
      message: `Moved conversation to ${targetName}.`,
      onUndo: () => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, folder: previousFolder } : m));
        updateMailMessages([messageId], { folder: previousFolder }).catch(console.error);
        setToast({ message: 'Move undone.' });
        setTimeout(() => setToast(null), 3000);
      }
    });
    setTimeout(() => setToast(null), 5000);
  };
  
  // Ribbon & View settings
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('home');
  const [internalDensity, setInternalDensity] = useState<Density>('comfortable');
  const [internalReadingPanePosition, setInternalReadingPanePosition] = useState<ReadingPanePosition>('right');
  const [conversationGrouping, setConversationGrouping] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const density = propDensity ?? internalDensity;
  const setDensity = (d: Density) => {
    setInternalDensity(d);
    onDensityChange?.(d);
  };

  const readingPanePosition = propReadingPanePosition ?? internalReadingPanePosition;
  const setReadingPanePosition = (p: ReadingPanePosition) => {
    setInternalReadingPanePosition(p);
    onReadingPanePositionChange?.(p);
  };

  // Filter & sort
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'flagged'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modals & Panels
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Compose State
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Inline reply state in reading pane
  const [inlineReplyText, setInlineReplyText] = useState('');

  // Selected message object
  const selectedMessage = useMemo(() => {
    return messages.find(m => m.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  // Handle prefilled compose from other sections
  useEffect(() => {
    if (prefillCompose) {
      setComposeTo(prefillCompose.to || '');
      setComposeSubject(prefillCompose.subject || '');
      setComposeBody('');
      setIsComposeOpen(true);
      onClearPrefillCompose?.();
    }
  }, [prefillCompose, onClearPrefillCompose]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isKeyboardModalOpen) { setIsKeyboardModalOpen(false); return; }
        if (isWhatsNewOpen) { setIsWhatsNewOpen(false); return; }
        if (isSupportOpen) { setIsSupportOpen(false); return; }
        if (isComposeOpen) { setIsComposeOpen(false); return; }
        if (selectedMessageIds.size > 0) { setSelectedMessageIds(new Set()); return; }
      }

      // Don't intercept when user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsComposeOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsKeyboardModalOpen(prev => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        if (selectedMessageId) {
          e.preventDefault();
          handleArchive();
        }
      } else if (e.key === '#' || e.key === 'Delete') {
        if (selectedMessageId) {
          e.preventDefault();
          handleDelete();
        }
      } else if (e.key === 'u' || e.key === 'U') {
        if (selectedMessageId) {
          e.preventDefault();
          handleToggleRead();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedMessage) {
          e.preventDefault();
          setComposeTo(selectedMessage.from.email);
          setComposeSubject(`Re: ${selectedMessage.subject}`);
          setIsComposeOpen(true);
        }
      } else if (e.key === 'a' || e.key === 'A') {
        if (selectedMessage) {
          e.preventDefault();
          setComposeTo(selectedMessage.from.email);
          setComposeSubject(`Re: ${selectedMessage.subject}`);
          setIsComposeOpen(true);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (selectedMessage) {
          e.preventDefault();
          setComposeSubject(`Fwd: ${selectedMessage.subject}`);
          setComposeBody(`\n\n--- Forwarded Message ---\nFrom: ${selectedMessage.from.name} <${selectedMessage.from.email}>\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.body}`);
          setIsComposeOpen(true);
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (selectedMessageId) {
          e.preventDefault();
          handleToggleFlag();
        }
      } else if (e.key === 'j' || e.key === 'J') {
        if (selectedMessageId) {
          e.preventDefault();
          handleReportJunk();
        }
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMessageId, selectedMessage, isKeyboardModalOpen, isWhatsNewOpen, isSupportOpen, isComposeOpen, selectedMessageIds]);

  // Selection handlers
  const handleToggleSelectMessage = (id: string, multiSelect?: boolean) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (!selectedMessageId) {
      setSelectedMessageId(id);
    }
  };

  const handleSelectAll = () => {
    const currentViewIds = messages
      .filter(m => {
        if (activeFolderId !== 'all' && m.folder !== activeFolderId) return false;
        if (activeFolderId === 'inbox' && m.tab !== activeTab) return false;
        return true;
      })
      .map(m => m.id);

    setSelectedMessageIds(prev => {
      if (prev.size === currentViewIds.length) {
        return new Set();
      }
      return new Set(currentViewIds);
    });
  };

  const handleClearSelection = () => {
    setSelectedMessageIds(new Set());
  };

  // Robust batch and single message operations
  const handleDeleteMessages = (ids: string[]) => {
    if (ids.length === 0) return;
    const previousState = messages.filter(m => ids.includes(m.id));

    setMessages(prev => prev.map(msg => ids.includes(msg.id) ? { ...msg, folder: 'deleted' } : msg));
    setSelectedMessageIds(new Set());

    // Persist deletion
    updateMailMessages(ids, { folder: 'deleted' }).catch(err => {
      console.error('Failed to sync delete:', err);
    });

    if (selectedMessageId && ids.includes(selectedMessageId)) {
      const remaining = messages.filter(m => !ids.includes(m.id) && m.folder === activeFolderId);
      setSelectedMessageId(remaining.length > 0 ? remaining[0].id : null);
    }

    setToast({
      message: ids.length === 1 ? 'Message moved to Deleted Items.' : `${ids.length} messages moved to Deleted Items.`,
      onUndo: () => {
        setMessages(prev => prev.map(m => {
          const old = previousState.find(p => p.id === m.id);
          return old ? { ...m, folder: old.folder } : m;
        }));
        // Revert deletion
        previousState.forEach(p => {
          updateMailMessages([p.id], { folder: p.folder }).catch(console.error);
        });
        setToast({ message: 'Deletion undone.' });
        setTimeout(() => setToast(null), 3000);
      }
    });
    setTimeout(() => setToast(null), 5000);
  };

  const handleToggleReadMessages = (ids: string[]) => {
    if (ids.length === 0) return;
    const allRead = ids.every(id => messages.find(m => m.id === id)?.read);
    const newReadState = !allRead;
    setMessages(prev => prev.map(msg => ids.includes(msg.id) ? { ...msg, read: newReadState } : msg));

    // Persist read status
    updateMailMessages(ids, { read: newReadState }).catch(err => {
      console.error('Failed to sync read status:', err);
    });
  };

  const handleToggleFlagMessages = (ids: string[]) => {
    if (ids.length === 0) return;
    const allFlagged = ids.every(id => messages.find(m => m.id === id)?.flagged);
    const newFlagState = !allFlagged;
    setMessages(prev => prev.map(msg => ids.includes(msg.id) ? { ...msg, flagged: newFlagState } : msg));

    // Persist flag status
    updateMailMessages(ids, { flagged: newFlagState }).catch(err => {
      console.error('Failed to sync flag status:', err);
    });
  };

  const handleTogglePinMessages = (ids: string[]) => {
    if (ids.length === 0) return;
    const allPinned = ids.every(id => messages.find(m => m.id === id)?.pinned);
    const newPinState = !allPinned;
    setMessages(prev => prev.map(msg => ids.includes(msg.id) ? { ...msg, pinned: newPinState } : msg));

    // Persist pin status
    updateMailMessages(ids, { pinned: newPinState }).catch(err => {
      console.error('Failed to sync pin status:', err);
    });
  };

  const handleMoveMessages = (ids: string[], targetFolderId: string) => {
    if (ids.length === 0) return;
    const previousState = messages.filter(m => ids.includes(m.id));

    setMessages(prev => prev.map(msg => ids.includes(msg.id) ? { ...msg, folder: targetFolderId } : msg));
    setSelectedMessageIds(new Set());

    // Persist move
    updateMailMessages(ids, { folder: targetFolderId }).catch(err => {
      console.error('Failed to sync move:', err);
    });

    const targetName = getFolderNameById(targetFolderId);
    setToast({
      message: `Moved ${ids.length} item${ids.length > 1 ? 's' : ''} to ${targetName}.`,
      onUndo: () => {
        setMessages(prev => prev.map(m => {
          const old = previousState.find(p => p.id === m.id);
          return old ? { ...m, folder: old.folder } : m;
        }));
        // Revert move
        previousState.forEach(p => {
          updateMailMessages([p.id], { folder: p.folder }).catch(console.error);
        });
        setToast({ message: 'Move undone.' });
        setTimeout(() => setToast(null), 3000);
      }
    });
    setTimeout(() => setToast(null), 5000);
  };

  // Action handlers connected to Ribbon
  const handleDelete = () => {
    if (selectedMessageIds.size > 0) {
      handleDeleteMessages(Array.from(selectedMessageIds));
    } else if (selectedMessageId) {
      handleDeleteMessages([selectedMessageId]);
    }
  };

  const handleDeleteFromSender = () => {
    if (!selectedMessage) return;
    const senderEmail = selectedMessage.from.email;
    const senderMsgIds = messages.filter(m => m.from.email === senderEmail).map(m => m.id);
    handleDeleteMessages(senderMsgIds);
  };

  const handleArchive = () => {
    if (selectedMessageIds.size > 0) {
      handleMoveMessages(Array.from(selectedMessageIds), 'archive');
    } else if (selectedMessageId) {
      handleMoveMessages([selectedMessageId], 'archive');
    }
  };

  const handleReportJunk = () => {
    if (selectedMessageIds.size > 0) {
      handleMoveMessages(Array.from(selectedMessageIds), 'junk');
    } else if (selectedMessageId) {
      handleMoveMessages([selectedMessageId], 'junk');
    }
  };

  const handleMoveTo = (targetFolder: string = 'archive') => {
    if (selectedMessageIds.size > 0) {
      handleMoveMessages(Array.from(selectedMessageIds), targetFolder);
    } else if (selectedMessageId) {
      handleMoveMessages([selectedMessageId], targetFolder);
    }
  };

  const handleToggleRead = () => {
    if (selectedMessageIds.size > 0) {
      handleToggleReadMessages(Array.from(selectedMessageIds));
    } else if (selectedMessageId) {
      handleToggleReadMessages([selectedMessageId]);
    }
  };

  const handleToggleFlag = () => {
    if (selectedMessageIds.size > 0) {
      handleToggleFlagMessages(Array.from(selectedMessageIds));
    } else if (selectedMessageId) {
      handleToggleFlagMessages([selectedMessageId]);
    }
  };

  const handleSnooze = (timeTitle: string) => {
    if (!selectedMessageId) return;
    const targetId = selectedMessageId;
    const originalMsg = messages.find(m => m.id === targetId);
    if (!originalMsg) return;

    setMessages(prev => prev.map(m => m.id === targetId ? { ...m, snoozedUntil: timeTitle } : m));

    // Select next message in folder if available
    const remaining = messages.filter(m => m.folder === activeFolderId && m.id !== targetId);
    if (remaining.length > 0) {
      setSelectedMessageId(remaining[0].id);
    } else {
      setSelectedMessageId(null);
    }

    setToast({
      message: `Message snoozed until ${timeTitle.toLowerCase()}.`,
      onUndo: () => {
        setMessages(prev => prev.map(m => m.id === targetId ? { ...m, snoozedUntil: undefined } : m));
        setSelectedMessageId(targetId);
      }
    });
    setTimeout(() => setToast(null), 5000);
  };

  const handleCategorize = (category: string) => {
    const targetIds = selectedMessageIds.size > 0 ? Array.from(selectedMessageIds) : selectedMessageId ? [selectedMessageId] : [];
    if (targetIds.length === 0) return;

    setMessages(prev => prev.map(m => targetIds.includes(m.id) ? { ...m, category: category || undefined } : m));
    if (category) {
      setToast({ message: `Assigned ${category} category.` });
    } else {
      setToast({ message: 'Cleared categories.' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const handleQuickStep = (stepId: 'done' | 'team_review' | 'follow_up') => {
    if (!selectedMessageId) return;
    const targetId = selectedMessageId;
    const msg = messages.find(m => m.id === targetId);
    if (!msg) return;

    if (stepId === 'done') {
      // Mark read & move to Archive
      setMessages(prev => prev.map(m => m.id === targetId ? { ...m, read: true, folder: 'archive' } : m));
      setToast({
        message: 'Quick Step "Done" executed: Marked read and moved to Archive.',
        onUndo: () => {
          setMessages(prev => prev.map(m => m.id === targetId ? { ...m, folder: msg.folder, read: msg.read } : m));
        }
      });
      setTimeout(() => setToast(null), 5000);
    } else if (stepId === 'follow_up') {
      // Flag with Orange category
      setMessages(prev => prev.map(m => m.id === targetId ? { ...m, flagged: true, category: 'Orange' } : m));
      setToast({ message: 'Quick Step "Follow-up" executed: Flagged with Orange category.' });
      setTimeout(() => setToast(null), 3000);
    } else if (stepId === 'team_review') {
      // Forward thread to team
      setComposeTo('team-engineering@meridian.io');
      setComposeSubject(`FW: [Team Review Required] ${msg.subject}`);
      setComposeBody(`\n\n--- Please review this thread ---\nFrom: ${msg.from.name} <${msg.from.email}>\nDate: ${msg.date}\nSubject: ${msg.subject}\n\n${msg.body}`);
      setIsComposeOpen(true);
    }
  };

  const handleUpdateMeetingStatus = (msgId: string, status: 'accepted' | 'tentative' | 'declined') => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.meetingInvite) {
        return {
          ...m,
          meetingInvite: {
            ...m.meetingInvite,
            status
          }
        };
      }
      return m;
    }));

    const statusLabel = status === 'accepted' ? 'Accepted' : status === 'tentative' ? 'Tentatively accepted' : 'Declined';
    setToast({ message: `${statusLabel} meeting invitation.` });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSendInlineReply = (replyData: {
    threadId: string;
    subject: string;
    body: string;
    to: Array<{ name: string; email: string }>;
    type: 'reply' | 'replyAll' | 'forward';
  }) => {
    const newMsg: EmailMessage = {
      id: `reply-${Date.now()}`,
      threadId: replyData.threadId,
      folder: activeFolderId === 'inbox' ? 'inbox' : 'sent',
      tab: 'focused',
      from: { name: 'Alex Bennett', email: accountEmail },
      to: replyData.to,
      subject: replyData.subject,
      preview: replyData.body.slice(0, 100),
      body: replyData.body,
      date: 'Just now',
      timestamp: Date.now(),
      read: true,
      flagged: false
    };
    setMessages(prev => [newMsg, ...prev]);

    // Persist inline reply in background
    insertMailMessage(newMsg).catch(err => {
      console.error('Failed to save inline reply:', err);
    });

    setToast({ 
      message: replyData.type === 'forward' ? 'Message forwarded successfully.' : 'Reply sent successfully.' 
    });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveDraft = (draftData: Partial<EmailMessage>) => {
    setMessages(prev => {
      const existingDraftIndex = prev.findIndex(m => m.id === 'active-draft');
      const draftMsg: EmailMessage = {
        id: 'active-draft',
        threadId: 'th-draft',
        folder: 'drafts',
        tab: 'focused',
        from: { name: 'Alex Bennett', email: 'alex.bennett@outlook.com' },
        to: draftData.to || [{ name: 'Draft recipient', email: '' }],
        subject: draftData.subject || 'Draft: (No subject)',
        preview: (draftData.body || '').slice(0, 100),
        body: draftData.body || '',
        date: 'Draft',
        timestamp: Date.now(),
        read: true,
        flagged: false
      };

      if (existingDraftIndex >= 0) {
        const updated = [...prev];
        updated[existingDraftIndex] = draftMsg;
        return updated;
      } else {
        return [draftMsg, ...prev];
      }
    });
  };

  const handleSendComposeMessage = (msgData: {
    to: Array<{ name: string; email: string }>;
    cc: Array<{ name: string; email: string }>;
    bcc: Array<{ name: string; email: string }>;
    subject: string;
    body: string;
    importance: 'normal' | 'high' | 'low';
    attachments: any[];
  }) => {
    // Remove active draft if present
    setMessages(prev => prev.filter(m => m.id !== 'active-draft'));

    const newSentMessage: EmailMessage = {
      id: `msg-${Date.now()}`,
      threadId: `th-${Date.now()}`,
      folder: 'sent',
      tab: 'focused',
      from: { name: 'Alex Bennett', email: accountEmail },
      to: msgData.to,
      cc: msgData.cc,
      bcc: msgData.bcc,
      subject: msgData.subject,
      preview: msgData.body.slice(0, 100),
      body: msgData.body,
      date: 'Just now',
      timestamp: Date.now(),
      read: true,
      flagged: false,
      importance: msgData.importance,
      attachments: msgData.attachments,
      hasAttachments: msgData.attachments.length > 0
    };

    setMessages(prev => [newSentMessage, ...prev]);

    // Persist sent message in background
    insertMailMessage(newSentMessage).catch(err => {
      console.error('Failed to save sent message:', err);
    });

    setIsComposeOpen(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');

    setToast({
      message: 'Message sent.',
      onUndo: () => {
        setMessages(prev => prev.filter(m => m.id !== newSentMessage.id));
        updateMailMessages([newSentMessage.id], { folder: 'drafts' }).catch(console.error);
        setToast({ message: 'Send undone. Message restored to Drafts.' });
        setTimeout(() => setToast(null), 3000);
      }
    });
    setTimeout(() => setToast(null), 5000);
  };

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // Advanced Filters override basic folder/query match if active
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

      // Folder match
      if (activeFolderId !== 'all') {
        if (msg.folder !== activeFolderId) return false;
      }
      // Tab match (only relevant in inbox if focused inbox is enabled)
      if (enableFocusedInbox && activeFolderId === 'inbox' && msg.tab !== activeTab) {
        return false;
      }
      // Unread / Flagged filter
      if (filterMode === 'unread' && msg.read) return false;
      if (filterMode === 'flagged' && !msg.flagged) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFrom = msg.from.name.toLowerCase().includes(q) || msg.from.email.toLowerCase().includes(q);
        const matchSubj = msg.subject.toLowerCase().includes(q);
        const matchBody = msg.body.toLowerCase().includes(q);
        if (!matchFrom && !matchSubj && !matchBody) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') return b.timestamp - a.timestamp;
      return a.timestamp - b.timestamp;
    });
  }, [messages, activeFolderId, activeTab, filterMode, searchQuery, sortOrder, advancedFilters, enableFocusedInbox]);

  // Folder icon helper
  const getFolderIcon = (id: string) => {
    switch (id) {
      case 'inbox': return <InboxIcon size={15} className="text-brand-cobalt" />;
      case 'drafts': return <FileText size={15} className="text-amber-700" />;
      case 'sent': return <Send size={15} className="text-emerald-700" />;
      case 'archive': return <Archive size={15} className="text-gray-600" />;
      case 'deleted': return <Trash2 size={15} className="text-gray-500" />;
      case 'junk': return <AlertOctagon size={15} className="text-amber-600" />;
      case 'notes': return <StickyNote size={15} className="text-amber-500" />;
      default: return <Folder size={15} className="text-brand-cobalt/80" />;
    }
  };

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-white text-[#1F2937]'}`}>
      {/* 1. Command Ribbon Shell (Home | View | Help) */}
      <CommandRibbon
        activeTab={activeRibbonTab}
        onTabChange={setActiveRibbonTab}
        onToggleFolderPane={onToggleFolderPane}
        hasSelection={!!selectedMessageId || selectedMessageIds.size > 0}
        onNewEmail={() => setIsComposeOpen(true)}
        onNewEvent={() => {
          if (onNavigateToSection) {
            onNavigateToSection('calendar');
          } else {
            setToast({ message: 'Switched to Calendar: New Event drafted' });
            setTimeout(() => setToast(null), 3000);
          }
        }}
        onNewContact={() => {
          if (onNavigateToSection) {
            onNavigateToSection('people');
          } else {
            setToast({ message: 'New contact draft added to address book' });
            setTimeout(() => setToast(null), 3000);
          }
        }}
        onDelete={handleDelete}
        onDeleteFromSender={handleDeleteFromSender}
        onArchive={handleArchive}
        onReportJunk={handleReportJunk}
        onReportPhishing={() => {
          if (selectedMessage) {
            handleMoveTo('junk');
            setToast({ message: 'Message quarantined & reported for phishing analysis' });
            setTimeout(() => setToast(null), 4000);
          } else {
            setToast({ message: 'Select a message to report phishing' });
            setTimeout(() => setToast(null), 3000);
          }
        }}
        onBlockSender={() => {
          if (selectedMessage) {
            handleMoveTo('junk');
            setToast({ message: `Sender ${selectedMessage.from.email} blocked and moved to Junk` });
            setTimeout(() => setToast(null), 4000);
          } else {
            setToast({ message: 'Select a message to block sender' });
            setTimeout(() => setToast(null), 3000);
          }
        }}
        onMoveToFolder={() => handleMoveTo('archive')}
        onReplyAll={() => {
          if (selectedMessage) {
            setComposeTo(selectedMessage.from.email);
            setComposeSubject(`Re: ${selectedMessage.subject}`);
            setIsComposeOpen(true);
          }
        }}
        onReply={() => {
          if (selectedMessage) {
            setComposeTo(selectedMessage.from.email);
            setComposeSubject(`Re: ${selectedMessage.subject}`);
            setIsComposeOpen(true);
          }
        }}
        onForward={() => {
          if (selectedMessage) {
            setComposeSubject(`Fwd: ${selectedMessage.subject}`);
            setComposeBody(`\n\n--- Forwarded Message ---\nFrom: ${selectedMessage.from.name} <${selectedMessage.from.email}>\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.body}`);
            setIsComposeOpen(true);
          }
        }}
        onToggleRead={handleToggleRead}
        onToggleFlag={handleToggleFlag}
        isRead={selectedMessage?.read}
        isFlagged={selectedMessage?.flagged}
        density={density}
        onDensityChange={setDensity}
        readingPanePosition={readingPanePosition}
        onReadingPanePositionChange={setReadingPanePosition}
        conversationGrouping={conversationGrouping}
        onConversationGroupingToggle={() => setConversationGrouping(prev => !prev)}
        isDarkMode={isDarkMode}
        onDarkModeToggle={() => setIsDarkMode(prev => !prev)}
        onOpenKeyboardShortcuts={() => setIsKeyboardModalOpen(true)}
        onOpenWhatsNew={() => setIsWhatsNewOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onCategorize={handleCategorize}
        onSnooze={handleSnooze}
        onQuickStep={handleQuickStep}
        onNavigateToSection={onNavigateToSection}
      />

      {/* Out of Office / Automatic Replies Active Banner */}
      {autoRepliesEnabled && (
        <div className="bg-[#FFF4CE] border-b border-[#FED95B] px-4 py-2 flex items-center justify-between text-xs text-[#7A4D05] flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-[#8F5B00] flex-shrink-0" />
            <span>
              <strong>Automatic replies</strong> are currently turned on for your account. Incoming senders will receive your out-of-office response.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDisableAutoReplies}
              className="font-semibold text-brand-cobalt hover:underline cursor-pointer"
            >
              Turn off
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-gray-600 hover:text-gray-900 underline cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* 2. Three-Pane Mail Client Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* PANE 1: Folder Pane (collapsible via hamburger or internal toggle) */}
        <FolderPane
          isOpen={isFolderPaneOpen}
          onToggleOpen={onToggleFolderPane}
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={(fId) => {
            setActiveFolderId(fId);
            setSelectedMessageId(null);
          }}
          messages={messages}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMarkFolderAsRead={handleMarkFolderAsRead}
          onEmptyFolder={handleEmptyFolder}
          onMoveMessageToFolder={handleMoveMessageToFolder}
          accountEmail={accountEmail}
        />

        {/* PANE 2 & 3: Message list pane + Reading pane (Right or Bottom or Full) */}
        <div className={`flex-1 flex min-w-0 ${readingPanePosition === 'bottom' ? 'flex-col' : 'flex-row'}`}>
          {/* PANE 2: Message List Pane (Hidden on mobile if reading pane is actively viewing a message) */}
          <div className={`${selectedMessageId && readingPanePosition !== 'off' ? 'hidden md:flex md:flex-shrink-0' : 'flex flex-1'} min-w-0`}>
            <MessageList
              messages={messages}
              activeFolderId={activeFolderId}
              activeFolderName={getFolderNameById(activeFolderId)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedMessageId={selectedMessageId}
              onSelectMessage={(id) => setSelectedMessageId(id)}
              selectedMessageIds={selectedMessageIds}
              onToggleSelectMessage={handleToggleSelectMessage}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              density={density}
              readingPanePosition={readingPanePosition}
              isConversationGrouping={conversationGrouping}
              onToggleConversationGrouping={() => setConversationGrouping(prev => !prev)}
              onDeleteMessages={handleDeleteMessages}
              onToggleReadMessages={handleToggleReadMessages}
              onToggleFlagMessages={handleToggleFlagMessages}
              onTogglePinMessages={handleTogglePinMessages}
              onMoveMessages={handleMoveMessages}
              searchQuery={searchQuery}
              folders={folders}
              advancedFilters={advancedFilters}
              onClearAdvancedFilters={onClearAdvancedFilters}
              enableFocusedInbox={enableFocusedInbox}
              onOpenFolderPane={onToggleFolderPane}
            />
          </div>

          {/* PANE 3: Reading Pane (collapsible / configurable) */}
          {readingPanePosition !== 'off' && (
            <div className={`${!selectedMessageId ? 'hidden md:flex md:flex-1' : 'flex flex-1'} min-w-0 h-full`}>
              <ReadingPane
                message={selectedMessage}
                allMessages={messages}
                onBack={() => setSelectedMessageId(null)}
                onReply={(to, subject, initialBody) => {
                  setComposeTo(to);
                  setComposeSubject(subject);
                  if (initialBody) setComposeBody(initialBody);
                  setIsComposeOpen(true);
                }}
                onReplyAll={(to, cc, subject, initialBody) => {
                  setComposeTo(to.join(', '));
                  setComposeSubject(subject);
                  if (initialBody) setComposeBody(initialBody);
                  setIsComposeOpen(true);
                }}
                onForward={(subject, body) => {
                  setComposeSubject(subject);
                  setComposeBody(body);
                  setIsComposeOpen(true);
                }}
                onDelete={(id) => handleDeleteMessages([id])}
                onArchive={(id) => handleMoveMessages([id], 'archive')}
                onToggleRead={(id) => handleToggleReadMessages([id])}
                onToggleFlag={(id) => handleToggleFlagMessages([id])}
                onTogglePin={(id) => handleTogglePinMessages([id])}
                onSendInlineReply={handleSendInlineReply}
                onOpenFullCompose={(prefill) => {
                  setComposeTo(prefill.to);
                  setComposeSubject(prefill.subject);
                  setComposeBody(prefill.body);
                  setIsComposeOpen(true);
                }}
                readingPanePosition={readingPanePosition}
                onCategorize={handleCategorize}
                onSnooze={handleSnooze}
                onQuickStep={handleQuickStep}
                onUpdateMeetingStatus={handleUpdateMeetingStatus}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Modals & Dialogs (Utilizing Utilitarian Sharp Surfaces & Underlined Fields) */}
      {/* Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
        }}
        onSend={handleSendComposeMessage}
        onSaveDraft={handleSaveDraft}
        initialTo={composeTo}
        initialSubject={composeSubject}
        initialBody={composeBody}
      />

      {/* Keyboard Shortcuts Modal */}
      {isKeyboardModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsKeyboardModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-none border border-gray-300 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 bg-brand-cobalt text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard size={16} />
                <span className="font-semibold text-sm">Keyboard Shortcuts</span>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyboardModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 divide-y divide-gray-100 text-xs text-gray-700 max-h-[70vh] overflow-y-auto">
              <div className="py-2 flex justify-between"><span>New message</span><kbd className="bg-gray-100 px-2 py-0.5 border border-gray-300 font-mono">c</kbd></div>
              <div className="py-2 flex justify-between"><span>Archive selected message</span><kbd className="bg-gray-100 px-2 py-0.5 border border-gray-300 font-mono">e</kbd></div>
              <div className="py-2 flex justify-between"><span>Delete selected message</span><kbd className="bg-gray-100 px-2 py-0.5 border border-gray-300 font-mono"># or Delete</kbd></div>
              <div className="py-2 flex justify-between"><span>Toggle read / unread</span><kbd className="bg-gray-100 px-2 py-0.5 border border-gray-300 font-mono">u</kbd></div>
              <div className="py-2 flex justify-between"><span>Toggle folder pane</span><kbd className="bg-gray-100 px-2 py-0.5 border border-gray-300 font-mono">Ctrl + Shift + E</kbd></div>
              <div className="py-2 flex justify-between"><span>Open keyboard shortcuts</span><kbd className="bg-gray-100 px-2 py-0.5 border border-gray-300 font-mono">?</kbd></div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsKeyboardModalOpen(false)}
                className="w-[120px] py-1.5 bg-brand-cobalt text-white text-xs font-semibold rounded-none text-center hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* What's New Dialog */}
      {isWhatsNewOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsWhatsNewOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-none border border-gray-300 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 bg-brand-cobalt text-white flex items-center justify-between">
              <span className="font-semibold text-sm">What&apos;s New in Outlook</span>
              <button type="button" onClick={() => setIsWhatsNewOpen(false)} className="text-white/80 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs text-gray-700">
              <p className="font-semibold text-gray-900 text-sm">Welcome to the 2026 Utilitarian Release</p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>Crisp 3-pane client architecture with instant pane toggling.</li>
                <li>Full Ribbon Toolbar with Home, View, and Help modes.</li>
                <li>Inline and modal reply flows with attachment support.</li>
                <li>Sharp-cornered card surfaces and underlined field styling.</li>
              </ul>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsWhatsNewOpen(false)}
                className="w-[120px] py-1.5 bg-brand-cobalt text-white text-xs font-semibold rounded-none hover:bg-blue-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Stub Dialog */}
      {isSupportOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsSupportOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-none border border-gray-300 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 bg-brand-cobalt text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Help &amp; Support</span>
              <button type="button" onClick={() => setIsSupportOpen(false)} className="text-white/80 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs text-gray-700">
              <p>For assistance with your Outlook mailbox, documentation is available online or submit an internal ticket to operations.</p>
              <div className="p-3 bg-brand-ice text-brand-cobalt border border-brand-cobalt/20">
                Support status: All systems operational • Latency 14ms
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSupportOpen(false)}
                className="w-[120px] py-1.5 bg-brand-cobalt text-white text-xs font-semibold rounded-none hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Undo Toast Notification */}
      {toast && (
        <div 
          id="outlook-toast"
          className="fixed bottom-6 right-8 z-50 bg-[#1F2937] text-white px-4 py-2.5 shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom-2 duration-150 border-l-4 border-brand-cobalt select-none"
        >
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              type="button"
              id="btn-toast-undo"
              onClick={() => {
                toast.onUndo?.();
                setToast(null);
              }}
              className="px-2 py-0.5 bg-white/15 hover:bg-white/25 text-amber-300 font-semibold uppercase tracking-wider text-[11px] rounded-none transition-colors"
            >
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white p-0.5 ml-1"
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
