export type EmailFolderId = 
  | 'inbox' 
  | 'drafts' 
  | 'sent' 
  | 'archive' 
  | 'deleted' 
  | 'junk' 
  | 'notes'
  | string; // for custom nested folders

export interface FolderItem {
  id: string;
  name: string;
  iconName?: string;
  unreadCount: number;
  totalCount?: number;
  system?: boolean;
  parentId?: string | null;
  children?: FolderItem[];
}

export type EmailTab = 'focused' | 'other';

export interface MeetingInviteDetails {
  title: string;
  start: string;
  end: string;
  location?: string;
  isTeams?: boolean;
  status?: 'accepted' | 'tentative' | 'declined' | 'pending';
  organizer?: { name: string; email: string };
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'img' | 'doc' | 'sheet' | 'zip';
  url?: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  folder: EmailFolderId;
  tab: EmailTab;
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  to: Array<{ name: string; email: string }>;
  cc?: Array<{ name: string; email: string }>;
  bcc?: Array<{ name: string; email: string }>;
  subject: string;
  preview: string;
  body: string;
  date: string;
  timestamp: number;
  read: boolean;
  flagged: boolean;
  pinned?: boolean;
  category?: string;
  hasAttachments?: boolean;
  attachments?: EmailAttachment[];
  importance?: 'low' | 'normal' | 'high';
  meetingInvite?: MeetingInviteDetails;
  snoozedUntil?: string;
}

export type SortField = 'date' | 'from' | 'subject' | 'importance';
export type SortDirection = 'desc' | 'asc';
export type FilterField = 'all' | 'unread' | 'flagged' | 'to_me' | 'has_files';

export type Density = 'comfortable' | 'compact';
export type ReadingPanePosition = 'right' | 'bottom' | 'off';
export type RibbonTab = 'home' | 'view' | 'help';
