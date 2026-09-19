import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Inbox as InboxIcon,
  Send,
  FileText,
  Archive,
  Trash2,
  AlertOctagon,
  StickyNote,
  Folder as FolderIcon,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Check,
  X,
  Edit2,
  CheckCheck,
  FolderOpen
} from 'lucide-react';
import { FolderItem, EmailMessage } from '../../types/mail';

interface FolderPaneProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  folders: FolderItem[];
  activeFolderId: string;
  onSelectFolder: (folderId: string) => void;
  messages: EmailMessage[];
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMarkFolderAsRead: (folderId: string) => void;
  onEmptyFolder: (folderId: string) => void;
  onMoveMessageToFolder: (messageId: string, targetFolderId: string) => void;
  accountEmail?: string;
}

interface ContextMenuState {
  folderId: string;
  x: number;
  y: number;
}

export function FolderPane({
  isOpen,
  onToggleOpen,
  folders,
  activeFolderId,
  onSelectFolder,
  messages,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMarkFolderAsRead,
  onEmptyFolder,
  onMoveMessageToFolder,
  accountEmail = 'alex.bennett@outlook.com'
}: FolderPaneProps) {
  // Expansion states for folder hierarchy
  const [isAccountExpanded, setIsAccountExpanded] = useState<boolean>(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState<boolean>(true);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(['projects', 'proj-design'])
  );

  // Drag over target highlight
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Inline creation / editing state
  const [inlineCreatingUnderId, setInlineCreatingUnderId] = useState<string | null | 'root'>(null);
  const [inlineNewFolderName, setInlineNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Close context menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setInlineCreatingUnderId(null);
        setRenamingFolderId(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute live unread count per folder from messages
  const unreadCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const msg of messages) {
      if (!msg.read) {
        map[msg.folder] = (map[msg.folder] || 0) + 1;
      }
    }
    return map;
  }, [messages]);

  // Compute live total count per folder
  const totalCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const msg of messages) {
      map[msg.folder] = (map[msg.folder] || 0) + 1;
    }
    return map;
  }, [messages]);

  const toggleFolderExpanded = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper to get correct icon for system and custom folders
  const getFolderIcon = (id: string, isExpanded?: boolean) => {
    switch (id) {
      case 'inbox':
        return <InboxIcon size={15} className="text-brand-cobalt flex-shrink-0" />;
      case 'drafts':
        return <FileText size={15} className="text-[#9D5D00] flex-shrink-0" />;
      case 'sent':
        return <Send size={15} className="text-[#107C41] flex-shrink-0" />;
      case 'archive':
        return <Archive size={15} className="text-gray-600 flex-shrink-0" />;
      case 'deleted':
        return <Trash2 size={15} className="text-gray-500 flex-shrink-0" />;
      case 'junk':
        return <AlertOctagon size={15} className="text-[#D83B01] flex-shrink-0" />;
      case 'notes':
        return <StickyNote size={15} className="text-[#A4262C] flex-shrink-0" />;
      default:
        return isExpanded ? (
          <FolderOpen size={15} className="text-brand-cobalt flex-shrink-0" />
        ) : (
          <FolderIcon size={15} className="text-brand-cobalt/85 flex-shrink-0" />
        );
    }
  };

  // Context menu trigger
  const handleOpenContextMenu = (folderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      folderId,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 200)
    });
  };

  // Drag & drop handlers
  const handleDragOver = (folderId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = (folderId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverFolderId === folderId) {
      setDragOverFolderId(null);
    }
  };

  const handleDrop = (folderId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    const msgId = e.dataTransfer.getData('text/plain');
    if (msgId) {
      onMoveMessageToFolder(msgId, folderId);
    }
  };

  const submitCreateFolder = (parentId: string | null = null) => {
    if (inlineNewFolderName.trim()) {
      onCreateFolder(inlineNewFolderName.trim(), parentId);
      setInlineNewFolderName('');
      setInlineCreatingUnderId(null);
      if (parentId) {
        // Auto-expand parent so new folder is visible
        setExpandedFolderIds(prev => new Set([...prev, parentId]));
      }
    }
  };

  const submitRenameFolder = (folderId: string) => {
    if (renameValue.trim()) {
      onRenameFolder(folderId, renameValue.trim());
      setRenamingFolderId(null);
      setRenameValue('');
    }
  };

  // Find targeted folder item for context menu
  const findFolderById = (list: FolderItem[], id: string): FolderItem | null => {
    for (const item of list) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFolderById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeContextFolder = contextMenu ? findFolderById(folders, contextMenu.folderId) : null;

  // Render a folder row recursively
  const renderFolderItem = (folder: FolderItem, depth = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolderIds.has(folder.id);
    const isActive = activeFolderId === folder.id;
    const isDragOver = dragOverFolderId === folder.id;
    const unread = unreadCountMap[folder.id] ?? folder.unreadCount ?? 0;
    const isRenaming = renamingFolderId === folder.id;

    return (
      <div key={folder.id} className="relative select-none">
        <div
          id={`folder-item-${folder.id}`}
          onContextMenu={(e) => handleOpenContextMenu(folder.id, e)}
          onDragOver={(e) => handleDragOver(folder.id, e)}
          onDragLeave={(e) => handleDragLeave(folder.id, e)}
          onDrop={(e) => handleDrop(folder.id, e)}
          onClick={() => {
            onSelectFolder(folder.id);
            // On small mobile screens, close drawer upon selecting a folder
            if (window.innerWidth < 768) {
              onToggleOpen();
            }
          }}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 text-xs cursor-pointer border-l-2 transition-colors rounded-none ${
            isDragOver
              ? 'bg-[#CCE8FF] text-brand-cobalt border-brand-cobalt font-semibold outline outline-1 outline-brand-cobalt'
              : isActive
                ? 'bg-[#EBF3FC] text-brand-cobalt font-semibold border-brand-cobalt'
                : 'border-transparent text-gray-700 hover:bg-[#F3F4F6]'
          }`}
          title={`${folder.name} (${unread} unread)`}
        >
          {/* Left content: Expand icon + Folder Icon + Folder Name / Input */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
            {/* Expand / Collapse toggle button for folders with children */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleFolderExpanded(folder.id, e)}
                className="p-0.5 text-gray-400 hover:text-gray-700 rounded-none flex-shrink-0"
                title={isExpanded ? 'Collapse subfolders' : 'Expand subfolders'}
              >
                <ChevronRight
                  size={13}
                  className={`transition-transform duration-150 ${isExpanded ? 'rotate-90 text-gray-600' : ''}`}
                />
              </button>
            ) : (
              <span className="w-3.5 flex-shrink-0" />
            )}

            {/* Folder Icon */}
            {getFolderIcon(folder.id, isExpanded)}

            {/* Folder Name or Inline Rename Input */}
            {isRenaming ? (
              <div
                className="flex items-center gap-1 flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRenameFolder(folder.id);
                    if (e.key === 'Escape') setRenamingFolderId(null);
                  }}
                  className="w-full text-xs px-1.5 py-0.5 bg-white border border-brand-cobalt outline-none font-normal"
                />
                <button
                  type="button"
                  onClick={() => submitRenameFolder(folder.id)}
                  className="p-0.5 text-brand-cobalt hover:bg-brand-ice"
                  title="Save name"
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingFolderId(null)}
                  className="p-0.5 text-gray-400 hover:text-gray-600"
                  title="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <span className={`truncate ${isActive ? 'font-semibold text-[#004578]' : ''}`}>
                {folder.name}
              </span>
            )}
          </div>

          {/* Right badges & Hover action menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Unread badge */}
            {unread > 0 && !isRenaming && (
              <span
                className={`text-[11px] px-1.5 py-0.2 font-semibold ${
                  isActive ? 'text-brand-cobalt font-bold' : 'text-gray-600'
                }`}
              >
                {unread}
              </span>
            )}

            {/* Hover ••• button */}
            <button
              type="button"
              id={`folder-actions-btn-${folder.id}`}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setContextMenu({
                  folderId: folder.id,
                  x: rect.right,
                  y: rect.bottom
                });
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-opacity rounded-none"
              title="Folder options"
            >
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>

        {/* Inline Subfolder creation under this folder */}
        {inlineCreatingUnderId === folder.id && (
          <div
            style={{ paddingLeft: `${22 + depth * 14}px` }}
            className="flex items-center gap-1 py-1 pr-2 bg-brand-ice/40 border-l-2 border-brand-cobalt"
          >
            <FolderPlus size={14} className="text-brand-cobalt flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Subfolder name..."
              value={inlineNewFolderName}
              onChange={(e) => setInlineNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitCreateFolder(folder.id);
                if (e.key === 'Escape') setInlineCreatingUnderId(null);
              }}
              className="w-full text-xs px-1.5 py-0.5 bg-white border border-brand-cobalt outline-none"
            />
            <button
              type="button"
              onClick={() => submitCreateFolder(folder.id)}
              className="p-0.5 text-brand-cobalt hover:bg-brand-ice"
              title="Create subfolder"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={() => setInlineCreatingUnderId(null)}
              className="p-0.5 text-gray-400 hover:text-gray-600"
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Recursive render of children if expanded */}
        {hasChildren && isExpanded && (
          <div className="border-l border-gray-200/80 ml-4">
            {folder.children!.map((child) => renderFolderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 md:hidden animate-in fade-in duration-200" 
        onClick={onToggleOpen}
        aria-hidden="true"
      />

      <aside
        id="outlook-folder-pane"
        aria-label="Mail Folders"
        className="fixed md:static inset-y-0 left-0 z-50 md:z-auto w-64 md:w-60 bg-[#F5F7F9] border-r border-gray-200 flex flex-col flex-shrink-0 select-none overflow-hidden shadow-xl md:shadow-none transition-transform duration-200"
      >
      {/* 1. Account Header Row with Collapse Chevron */}
      <div className="border-b border-gray-200 bg-white flex-shrink-0">
        <div
          id="account-header-row"
          onClick={() => setIsAccountExpanded(prev => !prev)}
          className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          title={accountEmail}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <ChevronDown
              size={14}
              className={`text-gray-500 transition-transform flex-shrink-0 ${
                !isAccountExpanded ? '-rotate-90' : ''
              }`}
            />
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-gray-900 truncate">
                {accountEmail}
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Connected • All folders up to date
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOpen();
            }}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-none"
            title="Hide folder pane"
          >
            <ChevronRight size={14} className="rotate-180" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Folder Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 space-y-2">
        {/* Favorites Group */}
        <div>
          <div
            onClick={() => setIsFavoritesExpanded(prev => !prev)}
            className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800"
          >
            <div className="flex items-center gap-1.5">
              <ChevronDown
                size={12}
                className={`text-gray-400 transition-transform ${
                  !isFavoritesExpanded ? '-rotate-90' : ''
                }`}
              />
              <span>Favorites</span>
            </div>
          </div>

          {isFavoritesExpanded && (
            <div className="space-y-0.5 pt-0.5">
              {folders.slice(0, 4).map((folder) => {
                const isActive = activeFolderId === folder.id;
                const isDragOver = dragOverFolderId === `fav-${folder.id}`;
                const unread = unreadCountMap[folder.id] ?? folder.unreadCount ?? 0;

                return (
                  <div
                    key={`fav-${folder.id}`}
                    id={`fav-folder-${folder.id}`}
                    onContextMenu={(e) => handleOpenContextMenu(folder.id, e)}
                    onDragOver={(e) => handleDragOver(`fav-${folder.id}`, e)}
                    onDragLeave={(e) => handleDragLeave(`fav-${folder.id}`, e)}
                    onDrop={(e) => handleDrop(folder.id, e)}
                    onClick={() => {
                      onSelectFolder(folder.id);
                      if (window.innerWidth < 768) {
                        onToggleOpen();
                      }
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer border-l-2 transition-colors ${
                      isDragOver
                        ? 'bg-[#CCE8FF] text-brand-cobalt border-brand-cobalt font-semibold outline outline-1 outline-brand-cobalt'
                        : isActive
                          ? 'bg-[#EBF3FC] text-brand-cobalt font-semibold border-brand-cobalt'
                          : 'border-transparent text-gray-700 hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFolderIcon(folder.id)}
                      <span className="truncate">{folder.name}</span>
                    </div>
                    {unread > 0 && (
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.2 ${
                          isActive ? 'text-brand-cobalt' : 'text-gray-600'
                        }`}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-200/80 mx-2" />

        {/* All Folders (Full Tree with Nesting) */}
        {isAccountExpanded && (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
              <span>All Folders</span>
              <button
                type="button"
                onClick={() => setInlineCreatingUnderId('root')}
                className="text-gray-400 hover:text-brand-cobalt p-0.5 rounded-none"
                title="Create top-level folder"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Root inline creation */}
            {inlineCreatingUnderId === 'root' && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-ice/50 border-l-2 border-brand-cobalt my-1">
                <FolderPlus size={14} className="text-brand-cobalt flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="New folder name..."
                  value={inlineNewFolderName}
                  onChange={(e) => setInlineNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitCreateFolder(null);
                    if (e.key === 'Escape') setInlineCreatingUnderId(null);
                  }}
                  className="w-full text-xs px-1.5 py-0.5 bg-white border border-brand-cobalt outline-none"
                />
                <button
                  type="button"
                  onClick={() => submitCreateFolder(null)}
                  className="p-0.5 text-brand-cobalt hover:bg-brand-ice"
                  title="Create folder"
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setInlineCreatingUnderId(null)}
                  className="p-0.5 text-gray-400 hover:text-gray-600"
                  title="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <div className="space-y-0.5">
              {folders.map((folder) => renderFolderItem(folder, 0))}
            </div>
          </div>
        )}
      </div>

      {/* 3. New Folder Action at Bottom */}
      <div className="p-2 border-t border-gray-200 bg-white flex-shrink-0">
        <button
          type="button"
          id="btn-create-new-folder"
          onClick={() => {
            setInlineCreatingUnderId('root');
            setInlineNewFolderName('');
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-brand-cobalt hover:bg-brand-ice/70 font-medium rounded-none border border-transparent hover:border-brand-cobalt/30 transition-colors"
        >
          <Plus size={14} />
          <span>New folder</span>
        </button>
      </div>

      {/* 4. Outlook Right-Click / Hover Context Menu */}
      {contextMenu && activeContextFolder && (
        <div
          ref={contextMenuRef}
          id="folder-context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-52 bg-white shadow-lg border border-gray-300 py-1 text-xs text-gray-800 animate-in fade-in duration-100 select-none"
        >
          <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            {activeContextFolder.name}
          </div>

          {/* New subfolder */}
          <button
            type="button"
            onClick={() => {
              setInlineCreatingUnderId(activeContextFolder.id);
              setInlineNewFolderName('');
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#EBF3FC] hover:text-brand-cobalt text-left"
          >
            <FolderPlus size={14} className="text-gray-500" />
            <span>New subfolder</span>
          </button>

          {/* Rename (only non-system folders) */}
          {!activeContextFolder.system && (
            <button
              type="button"
              onClick={() => {
                setRenamingFolderId(activeContextFolder.id);
                setRenameValue(activeContextFolder.name);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#EBF3FC] hover:text-brand-cobalt text-left"
            >
              <Edit2 size={14} className="text-gray-500" />
              <span>Rename</span>
            </button>
          )}

          {/* Mark all as read */}
          <button
            type="button"
            onClick={() => {
              onMarkFolderAsRead(activeContextFolder.id);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#EBF3FC] hover:text-brand-cobalt text-left"
          >
            <CheckCheck size={14} className="text-gray-500" />
            <span>Mark all as read</span>
          </button>

          {/* Empty folder */}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to empty the "${activeContextFolder.name}" folder? Items will be deleted.`
                )
              ) {
                onEmptyFolder(activeContextFolder.id);
              }
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#FEE2E2] hover:text-[#B91C1C] text-left text-gray-700"
          >
            <Trash2 size={14} className="text-gray-500" />
            <span>Empty folder</span>
          </button>

          {/* Delete folder (only non-system folders) */}
          {!activeContextFolder.system && (
            <>
              <div className="h-px bg-gray-100 my-1" />
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete folder "${activeContextFolder.name}" and all its subfolders?`
                    )
                  ) {
                    onDeleteFolder(activeContextFolder.id);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#FEE2E2] text-red-600 hover:text-red-700 text-left"
              >
                <Trash2 size={14} className="text-red-500" />
                <span>Delete folder</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
    </>
  );
}
