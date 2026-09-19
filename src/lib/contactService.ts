import { Contact } from '../types/contacts';
import { INITIAL_CONTACTS } from '../data/initialContactsData';

const CONTACTS_KEY = 'outlook_test_contacts';
let inMemoryContacts: Contact[] = [...INITIAL_CONTACTS];

function loadStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryContacts = parsed;
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable
  }
  return inMemoryContacts;
}

function saveStoredContacts(contacts: Contact[]): void {
  inMemoryContacts = contacts;
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch {
    // silent fallback
  }
}

export async function fetchContacts(): Promise<Contact[]> {
  return loadStoredContacts();
}

export async function insertContact(contact: Contact): Promise<Contact | null> {
  const current = loadStoredContacts();
  const newContact: Contact = {
    ...contact,
    id: contact.id || `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  };
  const updated = [newContact, ...current];
  saveStoredContacts(updated);
  return newContact;
}

export async function updateContact(contact: Contact): Promise<boolean> {
  const current = loadStoredContacts();
  const updated = current.map(c => c.id === contact.id ? contact : c);
  saveStoredContacts(updated);
  return true;
}

export async function deleteContact(id: string): Promise<boolean> {
  const current = loadStoredContacts();
  const updated = current.filter(c => c.id !== id);
  saveStoredContacts(updated);
  return true;
}
