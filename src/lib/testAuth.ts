/**
 * Pure client-side test environment authentication and attempt logger
 * Mirrors the users.json and attempts.json test environment logic.
 * Note: No check for if account is registered - it is a test environment.
 */

export interface LoginAttempt {
  time: string;
  email: string;
  password: string;
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

export function loadAuthorizedUsers(): string[] {
  try {
    const raw = localStorage.getItem(AUTHORIZED_TEST_USERS_FILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure primary admin is always included
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
  // Initialize with default users if not yet stored
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
 * users[email] = password
 * save(USERS_FILE, users)
 */
export function registerUser(email: string, password: string): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();

  users[cleanEmail] = password;
  saveUsers(users);
  return {
    success: true,
    message: 'Registered',
  };
}

/**
 * Login verification and attempt recorder:
 * Since this is a test environment, there is NO check for whether an account is pre-registered.
 * Every attempt is faithfully logged to attempts.json with timestamp, email, password, and success status.
 * The account is also saved to users.json (connected accounts).
 */
export function loginUser(email: string, password: string, forceSuccess = true): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const attempts = loadAttempts();

  // In this test environment: no check if account is registered.
  // Save or update account in users.json
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
}

export function clearAttempts(): void {
  saveAttempts([]);
}

export function resetUsersToDefault(): void {
  saveUsers(DEFAULT_USERS);
}

