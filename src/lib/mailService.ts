import { EmailMessage, FolderItem } from '../types/mail';
import { INITIAL_FOLDERS, INITIAL_MESSAGES } from '../data/initialMailData';

const FOLDERS_KEY = 'outlook_test_folders';
const MESSAGES_KEY = 'outlook_test_messages';

let inMemoryFolders: FolderItem[] = [...INITIAL_FOLDERS];
let inMemoryMessages: EmailMessage[] = [...INITIAL_MESSAGES];

function loadStoredFolders(): FolderItem[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryFolders = parsed;
        return parsed;
      }
    }
  } catch {
    // localStorage not accessible
  }
  return inMemoryFolders;
}

function saveStoredFolders(folders: FolderItem[]): void {
  inMemoryFolders = folders;
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch {
    // silent fallback
  }
}

function loadStoredMessages(): EmailMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryMessages = parsed;
        return parsed;
      }
    }
  } catch {
    // localStorage not accessible
  }
  return inMemoryMessages;
}

function saveStoredMessages(messages: EmailMessage[]): void {
  inMemoryMessages = messages;
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch {
    // silent fallback
  }
}

/**
 * Fetch Mail folders
 */
export async function fetchMailFolders(): Promise<FolderItem[]> {
  return loadStoredFolders();
}

/**
 * Fetch Mail messages
 */
export async function fetchMailMessages(): Promise<EmailMessage[]> {
  return loadStoredMessages();
}

/**
 * Insert a new message (e.g. Sent message or reply)
 */
export async function insertMailMessage(msg: {
  folder_id?: string;
  folder?: string;
  sender?: string;
  from?: { name?: string; email: string };
  recipients?: string[];
  to?: Array<{ name?: string; email: string }>;
  subject: string;
  body: string;
  has_attachments?: boolean;
  hasAttachments?: boolean;
}): Promise<EmailMessage | null> {
  const current = loadStoredMessages();
  
  const senderEmail = msg.sender || msg.from?.email || 'alex.bennett@outlook.com';
  const senderName = msg.from?.name || senderEmail.split('@')[0] || 'Alex Bennett';
  const folderId = msg.folder_id || msg.folder || 'sent';
  
  const toList: Array<{ name: string; email: string }> = msg.to 
    ? msg.to.map(t => ({ name: t.name || t.email.split('@')[0], email: t.email }))
    : (msg.recipients || []).map(r => ({ name: r.split('@')[0], email: r }));

  const newEmail: EmailMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    threadId: `thread-${Date.now()}`,
    folder: folderId,
    tab: 'focused',
    from: {
      name: senderName,
      email: senderEmail,
    },
    to: toList,
    cc: [],
    bcc: [],
    subject: msg.subject || '(No subject)',
    preview: msg.body ? msg.body.slice(0, 90).replace(/\n/g, ' ') : '',
    body: msg.body || '',
    date: 'Just now',
    timestamp: Date.now(),
    read: true,
    flagged: false,
    hasAttachments: Boolean(msg.has_attachments ?? msg.hasAttachments),
  };

  const updated = [newEmail, ...current];
  saveStoredMessages(updated);
  return newEmail;
}

/**
 * Update message fields (read, flagged, folder_id, etc.)
 */
export async function updateMailMessages(
  ids: string[], 
  updates: Partial<{ 
    is_read: boolean; 
    read: boolean;
    is_flagged: boolean; 
    flagged: boolean;
    pinned: boolean;
    folder_id: string;
    folder: string;
  }>
): Promise<boolean> {
  if (ids.length === 0) return true;

  const current = loadStoredMessages();
  const idSet = new Set(ids);

  const updated = current.map(m => {
    if (!idSet.has(m.id)) return m;

    const copy = { ...m };
    if (updates.read !== undefined) copy.read = updates.read;
    if (updates.is_read !== undefined) copy.read = updates.is_read;
    if (updates.flagged !== undefined) copy.flagged = updates.flagged;
    if (updates.is_flagged !== undefined) copy.flagged = updates.is_flagged;
    if (updates.folder !== undefined) copy.folder = updates.folder;
    if (updates.folder_id !== undefined) copy.folder = updates.folder_id;
    return copy;
  });

  saveStoredMessages(updated);
  return true;
}

/**
 * Delete message(s) permanently
 */
export async function deleteMailMessagesPermanently(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;

  const current = loadStoredMessages();
  const idSet = new Set(ids);
  const updated = current.filter(m => !idSet.has(m.id));
  saveStoredMessages(updated);
  return true;
}

/**
 * Create user custom folder
 */
export async function insertUserFolder(name: string, parentId?: string | null): Promise<string | null> {
  const current = loadStoredFolders();
  const newFolderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  const newFolder: FolderItem = {
    id: newFolderId,
    name,
    unreadCount: 0,
    parentId: parentId || null,
  };

  const updated = [...current, newFolder];
  saveStoredFolders(updated);
  return newFolderId;
}
