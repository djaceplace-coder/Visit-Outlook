import { useState, useEffect, type FormEvent } from 'react';
import { 
  Terminal, 
  Users, 
  History, 
  Copy, 
  Check, 
  Trash2, 
  RotateCcw, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Plus, 
  Mail, 
  ShieldCheck, 
  ShieldAlert,
  Play,
  UserCheck,
  UserPlus,
  Lock
} from 'lucide-react';
import { 
  loadUsers, 
  loadAttempts, 
  saveUsers, 
  clearAttempts, 
  resetUsersToDefault, 
  loginUser, 
  deleteUser, 
  LoginAttempt, 
  UsersMap, 
  USERS_FILE, 
  ATTEMPTS_FILE,
  loadAuthorizedUsers,
  addAuthorizedUser,
  removeAuthorizedUser,
  isUserAuthorizedForTest,
  PRIMARY_ADMIN_EMAIL,
  AUTHORIZED_TEST_USERS_FILE
} from '../lib/testAuth';

interface TestEnvironmentPageProps {
  currentUserEmail?: string;
  onNavigateToApp: (userEmail?: string) => void;
  onUserSwitch?: (userEmail: string) => void;
}

export function TestEnvironmentPage({ 
  currentUserEmail = PRIMARY_ADMIN_EMAIL, 
  onNavigateToApp,
  onUserSwitch 
}: TestEnvironmentPageProps) {
  // Access control state
  const [activeUserEmail, setActiveUserEmail] = useState(currentUserEmail);
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>(loadAuthorizedUsers);
  const [newUserToAuthorize, setNewUserToAuthorize] = useState('');
  const [authActionMessage, setAuthActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Core test data state
  const [users, setUsers] = useState<UsersMap>({});
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'attempts' | 'raw'>('users');
  const [copied, setCopied] = useState(false);

  // Quick Test Login Form state
  const [testEmail, setTestEmail] = useState('alex.bennett@outlook.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; time: string } | null>(null);

  // New connected account form
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);

  const isCurrentAuthorized = isUserAuthorizedForTest(activeUserEmail);

  const refreshData = () => {
    setUsers(loadUsers());
    setAttempts(loadAttempts());
    setAuthorizedUsers(loadAuthorizedUsers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleGrantAccess = (e: FormEvent) => {
    e.preventDefault();
    if (!newUserToAuthorize.trim()) return;
    const res = addAuthorizedUser(newUserToAuthorize.trim());
    if (res.success) {
      setAuthActionMessage({ type: 'success', text: res.message });
      setNewUserToAuthorize('');
      setAuthorizedUsers(loadAuthorizedUsers());
    } else {
      setAuthActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setAuthActionMessage(null), 4000);
  };

  const handleRevokeAccess = (email: string) => {
    const res = removeAuthorizedUser(email);
    if (res.success) {
      setAuthActionMessage({ type: 'success', text: res.message });
      setAuthorizedUsers(loadAuthorizedUsers());
    } else {
      setAuthActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setAuthActionMessage(null), 4000);
  };

  const handleCopyJson = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunLoginTest = (simulateSuccess = true) => {
    const email = testEmail.trim() || 'tester@outlook.com';
    const pass = testPassword || 'testpass';
    const res = loginUser(email, pass, simulateSuccess);
    refreshData();
    setTestResult({
      success: res.success,
      message: res.message,
      time: new Date().toLocaleTimeString(),
    });
  };

  const handleAddAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!newAccountEmail.trim()) return;
    const cleanEmail = newAccountEmail.trim().toLowerCase();
    const cleanPass = newAccountPassword.trim() || 'password123';
    
    const currentUsers = loadUsers();
    currentUsers[cleanEmail] = cleanPass;
    saveUsers(currentUsers);
    
    // Also record an initial connection attempt
    loginUser(cleanEmail, cleanPass, true);
    
    setNewAccountEmail('');
    setNewAccountPassword('');
    setShowAddAccountForm(false);
    refreshData();
  };

  const handleDeleteAccount = (email: string) => {
    deleteUser(email);
    refreshData();
  };

  const handleClearAttempts = () => {
    clearAttempts();
    setAttempts([]);
  };

  const handleResetDefaults = () => {
    resetUsersToDefault();
    refreshData();
  };

  const accountsList = Object.entries(users) as [string, string][];

  // If user is not authorized, display restricted access barrier
  if (!isCurrentAuthorized) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#1E293B] border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Lock size={28} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Test Environment Access Restricted
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access to this test environment is restricted. Only specified authorized accounts (<strong className="text-slate-200">{PRIMARY_ADMIN_EMAIL}</strong> and approved users) can view this console.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-xs text-left space-y-2">
            <div className="text-slate-400 font-medium">Currently viewing as:</div>
            <div className="font-mono text-slate-200 truncate bg-slate-800 px-2 py-1 rounded border border-slate-700">
              {activeUserEmail || 'anonymous (unauthenticated)'}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveUserEmail(PRIMARY_ADMIN_EMAIL);
                if (onUserSwitch) onUserSwitch(PRIMARY_ADMIN_EMAIL);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <ShieldCheck size={16} />
              <span>Continue as {PRIMARY_ADMIN_EMAIL}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToApp()}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Mail size={14} />
              <span>Return to Mail Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#1E293B]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/40 rounded flex items-center justify-center text-blue-400">
            <Terminal size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Test Environment
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">
                /test
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                <ShieldCheck size={13} />
                Access Authorized
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Connected accounts store ({USERS_FILE}) &amp; real-time attempt audit logger ({ATTEMPTS_FILE})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded text-xs text-slate-300">
            <UserCheck size={14} className="text-emerald-400" />
            <span className="font-mono text-[11px]">{activeUserEmail}</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToApp(activeUserEmail)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm cursor-pointer"
          >
            <Mail size={14} />
            <span>Open Mail Workspace (/)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Section: Authorized Test Users Management */}
        <section className="bg-[#1E293B] border border-blue-500/30 rounded-lg overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-blue-950/30">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-blue-400" />
              <div>
                <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                  Test Environment Access Permissions
                </h2>
                <p className="text-xs text-slate-400">
                  Specify which users have access to view and manage this /test environment
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded border border-blue-500/20">
              {authorizedUsers.length} Authorized {authorizedUsers.length === 1 ? 'User' : 'Users'}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Action notification banner */}
            {authActionMessage && (
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                authActionMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {authActionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{authActionMessage.text}</span>
              </div>
            )}

            {/* Add User Form */}
            <form onSubmit={handleGrantAccess} className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-4 border border-slate-800 rounded-lg">
              <div className="flex-1 min-w-[280px]">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Authorize Another User to View /test
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newUserToAuthorize}
                    onChange={e => setNewUserToAuthorize(e.target.value)}
                    placeholder="e.g. colleague@example.com"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    <UserPlus size={14} />
                    <span>Grant Access</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Authorized Users List */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Users with Access ({authorizedUsers.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {authorizedUsers.map(email => {
                  const isPrimary = email === PRIMARY_ADMIN_EMAIL;
                  return (
                    <div 
                      key={email}
                      className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                          isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate" title={email}>
                            {email}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {isPrimary ? (
                              <span className="text-blue-400 font-medium">Primary Admin</span>
                            ) : (
                              <span>Authorized</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isPrimary ? (
                          <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">
                            Owner
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeAccess(email)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                            title={`Revoke /test access for ${email}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Connected Accounts */}
        <section className="bg-[#1E293B] border border-slate-800 rounded-lg overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <Users size={18} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                Connected Accounts ({accountsList.length})
              </h2>
              <span className="text-xs text-slate-400 font-normal">
                Stored in <code className="text-blue-300 font-mono">{USERS_FILE}</code>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddAccountForm(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{showAddAccountForm ? 'Cancel' : 'Connect Account'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors cursor-pointer"
                title="Reset to default seeded users"
              >
                <RotateCcw size={13} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Add Account Form */}
          {showAddAccountForm && (
            <form onSubmit={handleAddAccount} className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-3">
              <input
                type="email"
                required
                placeholder="account@domain.com"
                value={newAccountEmail}
                onChange={e => setNewAccountEmail(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded focus:outline-none focus:border-blue-500 min-w-[240px]"
              />
              <input
                type="text"
                placeholder="password (defaults to password123)"
                value={newAccountPassword}
                onChange={e => setNewAccountPassword(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded focus:outline-none focus:border-blue-500 min-w-[220px]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors cursor-pointer"
              >
                Save &amp; Connect Account
              </button>
            </form>
          )}

          {/* Accounts Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accountsList.map(([email, pass]) => (
                <div 
                  key={email}
                  className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 rounded-lg p-4 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs">
                        {email[0]}
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        <CheckCircle2 size={11} />
                        Connected
                      </span>
                    </div>
                    <div className="font-semibold text-white text-xs truncate" title={email}>
                      {email}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <KeyRound size={12} className="text-slate-500 shrink-0" />
                      <span>pass:</span>
                      <code className="bg-slate-800 px-1.5 py-0.2 border border-slate-700 rounded text-slate-200">
                        {pass}
                      </code>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToApp(email)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                      <Play size={12} />
                      <span>Launch App</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTestEmail(email);
                        setTestPassword(pass);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors cursor-pointer"
                      title="Set in login tester"
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(email)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                      title="Remove account from users.json"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Quick Test Login Simulator */}
        <section className="bg-[#1E293B] border border-slate-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Authentication Attempt Simulator (No DB • Logs to {ATTEMPTS_FILE})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Test any credential. In this test environment, there is <strong className="text-slate-200">no check for if an account is registered</strong>. Any login is automatically recorded into <code className="text-sky-300 font-mono">{ATTEMPTS_FILE}</code>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-900/50 p-4 border border-slate-800 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Email
              </label>
              <input
                type="text"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="e.g. any_user@domain.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="text"
                value={testPassword}
                onChange={e => setTestPassword(e.target.value)}
                placeholder="e.g. secret_pass"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRunLoginTest(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Log OK Attempt</span>
              </button>
              <button
                type="button"
                onClick={() => handleRunLoginTest(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-700/80 hover:bg-rose-600 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                title="Test simulated failed attempt"
              >
                <XCircle size={14} />
                <span>Log Failed</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`mt-3 p-3 rounded border text-xs flex items-center justify-between ${
              testResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{testResult.message}</span>
                <span className="text-slate-400 font-mono">• Logged at {testResult.time} to {ATTEMPTS_FILE}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToApp(testEmail)}
                className="underline hover:text-white font-medium cursor-pointer"
              >
                Launch workspace as {testEmail} →
              </button>
            </div>
          )}
        </section>

        {/* Section 3: Data Store Modal / Tab Viewer */}
        <section className="bg-[#1E293B] border border-slate-800 rounded-lg overflow-hidden shadow-lg">
          {/* Tabs header */}
          <div className="px-6 pt-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users size={15} />
                <span>[u]sers ({accountsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('attempts')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'attempts'
                    ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History size={15} />
                <span>[a]ttempts ({attempts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'raw'
                    ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal size={15} />
                <span>Raw JSON View</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => handleCopyJson(activeTab === 'users' ? users : attempts)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy Current JSON'}</span>
              </button>
              {activeTab === 'attempts' && (
                <button
                  type="button"
                  onClick={handleClearAttempts}
                  disabled={attempts.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 text-xs rounded transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear Attempts</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  Contents of <code className="text-blue-300 font-mono">{USERS_FILE}</code>. Click any row to test login or launch.
                </div>
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Email Key</th>
                        <th className="p-3">Password Value</th>
                        <th className="p-3 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {accountsList.map(([email, pass]) => (
                        <tr key={email} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-semibold text-white">{email}</td>
                          <td className="p-3 text-slate-300">
                            <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                              {pass}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTestEmail(email);
                                setTestPassword(pass);
                              }}
                              className="text-blue-400 hover:underline cursor-pointer"
                            >
                              Load in Tester
                            </button>
                            <span className="text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={() => onNavigateToApp(email)}
                              className="text-emerald-400 hover:underline cursor-pointer"
                            >
                              Open Workspace
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  Contents of <code className="text-blue-300 font-mono">{ATTEMPTS_FILE}</code>. Chronological record of all authentication attempts.
                </div>
                {attempts.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-lg">
                    No attempts logged yet in {ATTEMPTS_FILE}. Run a login test or sign in from the main page to see attempts recorded here.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Timestamp (ISO)</th>
                          <th className="p-3">Email Attempted</th>
                          <th className="p-3">Password Attempted</th>
                          <th className="p-3 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {attempts.slice().reverse().map((att, i) => (
                          <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 text-slate-400">{att.time}</td>
                            <td className="p-3 text-white font-medium">{att.email}</td>
                            <td className="p-3 text-slate-300">
                              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                {att.password}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                att.success 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {att.success ? (
                                  <>
                                    <CheckCircle2 size={12} />
                                    <span>Success</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={12} />
                                    <span>Failed</span>
                                  </>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2 font-semibold">
                    {AUTHORIZED_TEST_USERS_FILE}:
                  </div>
                  <pre className="p-4 bg-slate-950 text-blue-400 rounded-lg text-xs font-mono overflow-auto max-h-80 border border-slate-800 leading-relaxed">
                    {JSON.stringify(authorizedUsers, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2 font-semibold">
                    {USERS_FILE}:
                  </div>
                  <pre className="p-4 bg-slate-950 text-emerald-400 rounded-lg text-xs font-mono overflow-auto max-h-80 border border-slate-800 leading-relaxed">
                    {JSON.stringify(users, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2 font-semibold">
                    {ATTEMPTS_FILE}:
                  </div>
                  <pre className="p-4 bg-slate-950 text-sky-400 rounded-lg text-xs font-mono overflow-auto max-h-80 border border-slate-800 leading-relaxed">
                    {JSON.stringify(attempts, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer info */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        Test Environment (/test) • Access managed for {authorizedUsers.length} authorized accounts
      </footer>
    </div>
  );
}
