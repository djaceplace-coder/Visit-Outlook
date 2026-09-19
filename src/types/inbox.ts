export type EmailFolder = 'inbox' | 'drafts' | 'sent' | 'archive' | 'deleted';
export type EmailTab = 'focused' | 'other';

export interface EmailMessage {
  id: string;
  folder: EmailFolder;
  tab?: EmailTab;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  flagged: boolean;
}
