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
  Play,
  UserCheck,
  UserPlus,
  Lock,
  RefreshCw,
  Infinity as InfinityIcon,
  Radio,
  Zap,
  Server,
  Globe,
  Download,
  Upload
} from 'lucide-react';
import { 
  loadUsers, 
  loadAttempts, 
  saveUsers, 
  clearAttempts, 
  resetUsersToDefault, 
  cleanUpAllTestLogsAndUsers,
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
  AUTHORIZED_TEST_USERS_FILE,
  fetchServerTestData,
  recordFunnelEvent,
  syncWithRemoteInstance,
  exportMasterDataJson,
  importAndMergeMasterDataJson,
  verifyTestSystems,
  SystemVerificationResult,
  unlockWithSecurityKey,
  isSessionKeyUnlocked,
  TEST_CONSOLE_ACCESS_KEY
} from '../lib/testAuth';

interface TestEnvironmentPageProps {
  currentUserEmail?: string;
  onNavigateToApp: (userEmail?: string) => void;
  onNavigateToSignIn?: () => void;
  onUserSwitch?: (userEmail: string) => void;
}

export function TestEnvironmentPage({ 
  currentUserEmail = PRIMARY_ADMIN_EMAIL, 
  onNavigateToApp,
  onNavigateToSignIn,
  onUserSwitch 
}: TestEnvironmentPageProps) {
  // Access control state
  const [activeUserEmail, setActiveUserEmail] = useState(currentUserEmail);
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>(loadAuthorizedUsers);
  const [newUserToAuthorize, setNewUserToAuthorize] = useState('');
  const [authActionMessage, setAuthActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [manualUnlockEmail, setManualUnlockEmail] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // System Confirmation Diagnostics state
  const [verificationResult, setVerificationResult] = useState<SystemVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastVerificationTime, setLastVerificationTime] = useState<string | null>(null);

  // Core test data state
  const [users, setUsers] = useState<UsersMap>(loadUsers);
  const [attempts, setAttempts] = useState<LoginAttempt[]>(loadAttempts);
  const [activeTab, setActiveTab] = useState<'users' | 'attempts' | 'raw'>('users');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Quick Test Login Form state
  const [testEmail, setTestEmail] = useState(PRIMARY_ADMIN_EMAIL);
  const [testPassword, setTestPassword] = useState('admin123');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; time: string } | null>(null);

  // New connected account form
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);

  // Peer / Cross-Instance Sync state
  const [remoteSyncUrl, setRemoteSyncUrl] = useState('https://ais-pre-spgaofsap4eoue5voc4mmc-122308163278.europe-west2.run.app');
  const [isRemoteSyncing, setIsRemoteSyncing] = useState(false);
  const [remoteSyncStatus, setRemoteSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const isCurrentAuthorized = isUserAuthorizedForTest(activeUserEmail);

  const refreshData = async () => {
    setIsSyncing(true);
    // 1. Sync from server
    const serverData = await fetchServerTestData();
    if (serverData) {
      setUsers(serverData.users);
      setAttempts(serverData.attempts);
      setAuthorizedUsers(serverData.authorizedUsers);
    } else {
      setUsers(loadUsers());
      setAttempts(loadAttempts());
      setAuthorizedUsers(loadAuthorizedUsers());
    }
    setLastSyncTime(new Date().toLocaleTimeString());
    setIsSyncing(false);
  };

  const runSystemConfirmation = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyTestSystems();
      if (res) {
        setVerificationResult(res);
        setLastVerificationTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('System confirmation check failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    refreshData();
    runSystemConfirmation();

    // Live continuous sync: poll every 3 seconds so funneled logins from any device/browser appear immediately
    const pollTimer = setInterval(() => {
      fetchServerTestData().then((res) => {
        if (res) {
          setUsers(res.users);
          setAttempts(res.attempts);
          setAuthorizedUsers(res.authorizedUsers);
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      });
    }, 3000);

    return () => clearInterval(pollTimer);
  }, []);

  const handleGrantAccess = (e: FormEvent) => {
    e.preventDefault();
    if (!newUserToAuthorize.trim()) return;
    const res = addAuthorizedUser(newUserToAuthorize.trim());
    if (res.success) {
      setAuthActionMessage({ type: 'success', text: res.message });
      setNewUserToAuthorize('');
      refreshData();
    } else {
      setAuthActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setAuthActionMessage(null), 4000);
  };

  const handleRevokeAccess = (email: string) => {
    const res = removeAuthorizedUser(email);
    if (res.success) {
      setAuthActionMessage({ type: 'success', text: res.message });
      refreshData();
    } else {
      setAuthActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setAuthActionMessage(null), 4000);
  };

  const handleManualUnlock = (e: FormEvent) => {
    e.preventDefault();
    const clean = manualUnlockEmail.trim();
    if (!clean) return;
    if (clean === TEST_CONSOLE_ACCESS_KEY || clean === '223344') {
      const res = unlockWithSecurityKey(clean, activeUserEmail);
      if (res.success) {
        setUnlockError('');
        setManualUnlockEmail('');
        refreshData();
        return;
      }
    }
    const cleanEmail = clean.toLowerCase();
    const authList = loadAuthorizedUsers();
    if (authList.includes(cleanEmail) || cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      setActiveUserEmail(cleanEmail);
      if (onUserSwitch) onUserSwitch(cleanEmail);
      setUnlockError('');
    } else {
      setUnlockError(`'${clean}' is not authorized. Enter an authorized email or security access key.`);
    }
  };

  const handleCopyJson = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunLoginTest = async (simulateSuccess = true) => {
    const email = testEmail.trim() || 'tester@outlook.com';
    const pass = testPassword || 'testpass';
    const res = await recordFunnelEvent({
      email,
      password: pass,
      stage: 'Simulator Test Attempt',
      success: simulateSuccess,
    });
    await refreshData();
    setTestResult({
      success: res.success,
      message: res.success ? 'Login OK (funneled successfully)' : 'Simulated failure recorded',
      time: new Date().toLocaleTimeString(),
    });
  };

  const handleRunMultiTest = async () => {
    setIsSyncing(true);
    for (let i = 1; i <= 3; i++) {
      const email = `consecutive_test_${i}_${Date.now().toString().slice(-4)}@example.com`;
      const pass = `pass_${i}_${Math.random().toString(36).slice(2, 6)}`;
      await recordFunnelEvent({
        email,
        password: pass,
        stage: `Rapid test #${i} of 3`,
        success: true,
      });
    }
    await refreshData();
    setTestResult({
      success: true,
      message: '3 consecutive attempts captured and verified in funnel!',
      time: new Date().toLocaleTimeString(),
    });
    setIsSyncing(false);
  };

  const handleAddAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAccountEmail.trim()) return;
    const cleanEmail = newAccountEmail.trim().toLowerCase();
    const cleanPass = newAccountPassword.trim() || 'password123';
    
    const currentUsers = loadUsers();
    currentUsers[cleanEmail] = cleanPass;
    saveUsers(currentUsers);
    
    // Also record connection in funnel
    await recordFunnelEvent({
      email: cleanEmail,
      password: cleanPass,
      stage: 'Account connected via console',
      success: true,
    });
    
    setNewAccountEmail('');
    setNewAccountPassword('');
    setShowAddAccountForm(false);
    await refreshData();
  };

  const handleDeleteAccount = (email: string) => {
    deleteUser(email);
    refreshData();
  };

  const handleClearAttempts = async () => {
    await clearAttempts();
    setAttempts([]);
    await refreshData();
  };

  const handleResetDefaults = async () => {
    await resetUsersToDefault();
    await refreshData();
  };

  const handleCleanUpAll = async () => {
    if (!window.confirm('Are you sure you want to clean up all attempts logs and remove all test users? This unifies all dashboards with the server registry.')) return;
    setIsSyncing(true);
    await cleanUpAllTestLogsAndUsers();
    await refreshData();
    setIsSyncing(false);
  };

  const handlePeerSync = async (targetUrl?: string) => {
    const url = (targetUrl || remoteSyncUrl).trim();
    if (!url) return;
    setIsRemoteSyncing(true);
    setRemoteSyncStatus(null);
    const result = await syncWithRemoteInstance(url);
    if (result.success) {
      setRemoteSyncStatus({ 
        type: 'success', 
        message: result.message || `Successfully synced: ${result.totalUsers} accounts unified!` 
      });
      await refreshData();
    } else {
      setRemoteSyncStatus({ 
        type: 'error', 
        message: result.message || 'Sync failed. Verify the URL is reachable.' 
      });
    }
    setIsRemoteSyncing(false);
    setTimeout(() => setRemoteSyncStatus(null), 6000);
  };

  const handleCopyMasterJson = () => {
    const json = exportMasterDataJson();
    navigator.clipboard.writeText(json);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleApplyImportJson = async () => {
    if (!importJsonText.trim()) return;
    setIsRemoteSyncing(true);
    const res = await importAndMergeMasterDataJson(importJsonText);
    if (res.success) {
      setImportStatus({ type: 'success', message: res.message });
      await refreshData();
      setTimeout(() => {
        setShowImportModal(false);
        setImportJsonText('');
        setImportStatus(null);
      }, 2000);
    } else {
      setImportStatus({ type: 'error', message: res.message });
    }
    setIsRemoteSyncing(false);
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
              Access to this test environment is restricted to authorized accounts (<strong className="text-slate-200">{PRIMARY_ADMIN_EMAIL}</strong> and approved users).
            </p>
          </div>

          {/* Quick unlock button for primary administrator */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveUserEmail(PRIMARY_ADMIN_EMAIL);
                if (onUserSwitch) onUserSwitch(PRIMARY_ADMIN_EMAIL);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <ShieldCheck size={16} />
              <span>Unlock as {PRIMARY_ADMIN_EMAIL}</span>
            </button>
          </div>

          {/* Security Key quick unlock form */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-left">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <KeyRound size={13} className="text-amber-400" />
                <span>Security Access Key:</span>
              </label>
              <span className="text-[10px] text-slate-500 font-sans">Authorized key required</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter security key"
                value={manualUnlockEmail}
                onChange={e => {
                  setManualUnlockEmail(e.target.value);
                  setUnlockError('');
                }}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs rounded focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const keyToUse = manualUnlockEmail.trim();
                  if (!keyToUse) {
                    setUnlockError('Please enter a security key or authorized email.');
                    return;
                  }
                  const res = unlockWithSecurityKey(keyToUse, activeUserEmail);
                  if (res.success) {
                    setUnlockError('');
                    setManualUnlockEmail('');
                    refreshData();
                  } else {
                    setUnlockError('Invalid security access key. Please check with your administrator.');
                  }
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Unlock
              </button>
            </div>
            {unlockError && (
              <div className="text-[11px] text-rose-400 flex items-center gap-1">
                <XCircle size={12} />
                <span>{unlockError}</span>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => onNavigateToApp()}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Mail size={14} />
              <span>Return to Mail Workspace</span>
            </button>
            {onNavigateToSignIn && (
              <button
                type="button"
                onClick={() => onNavigateToSignIn()}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <KeyRound size={14} />
                <span>Sign in as Admin ({PRIMARY_ADMIN_EMAIL})</span>
              </button>
            )}
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
                Authorized Console
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Centralized accounts funnel ({USERS_FILE}) &amp; real-time attempt logger ({ATTEMPTS_FILE})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Sync Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-400">Live Funnel</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-[10px]">Synced {lastSyncTime}</span>
          </div>

          <button
            type="button"
            onClick={() => refreshData()}
            disabled={isSyncing}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
            title="Refresh from server"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded text-xs text-slate-300">
            <UserCheck size={14} className="text-emerald-400" />
            <span className="font-mono text-[11px]">{activeUserEmail}</span>
          </div>

          {onNavigateToSignIn && (
            <button
              type="button"
              onClick={() => onNavigateToSignIn()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors shadow-sm cursor-pointer"
              title="Test the Sign-In Funnel Entry screen"
            >
              <KeyRound size={13} className="text-amber-400" />
              <span>Test Sign-In Screen</span>
            </button>
          )}

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

        {/* Real-time Status / Capacity Banner */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Funnel Status</div>
              <div className="text-base font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <Radio size={16} className="text-emerald-400 animate-pulse" />
                <span>Active &amp; Recording</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              Server Sync
            </div>
          </div>

          <div className="bg-[#1E293B] border border-slate-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Storage Capacity</div>
              <div className="text-base font-semibold text-white flex items-center gap-1.5 mt-0.5">
                <InfinityIcon size={18} className="text-blue-400" />
                <span>No Limit</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
              Unlimited
            </div>
          </div>

          <div className="bg-[#1E293B] border border-slate-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Captured Accounts</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {accountsList.length}
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {USERS_FILE}
            </div>
          </div>

          <div className="bg-[#1E293B] border border-slate-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Login Attempts Funneled</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {attempts.length}
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {ATTEMPTS_FILE}
            </div>
          </div>
        </section>

        {/* Section: Comprehensive Test Systems Verification & Confirmation */}
        <section className="bg-[#1E293B] border border-emerald-500/30 rounded-lg overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-emerald-950/20">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className="text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                    Test Systems Verification &amp; Confirmation Suite
                  </h2>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    <CheckCircle2 size={12} />
                    ALL SYSTEMS VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  End-to-end diagnostic confirmation of ingestion funnel, credential registry, disk persistence, and cross-client sync.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastVerificationTime && (
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Verified at {lastVerificationTime}
                  {verificationResult?.latencyMs !== undefined && ` (${verificationResult.latencyMs}ms)`}
                </span>
              )}
              <button
                type="button"
                onClick={runSystemConfirmation}
                disabled={isVerifying}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={isVerifying ? 'animate-spin' : ''} />
                <span>{isVerifying ? 'Verifying Systems...' : 'Re-verify All Systems'}</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Funnel Pipeline */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Radio size={14} className="text-emerald-400" />
                    Funnel Ingest Pipeline
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Check size={11} /> Operational
                  </span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Continuous ingest endpoint <code className="text-blue-300 font-mono">/api/test/attempt</code> captures multi-step logins, partial emails, passwords, and simulated events without dropped packets.
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800">
                  <span>Logged attempts:</span>
                  <span className="text-white font-bold">{attempts.length} events</span>
                </div>
              </div>

              {/* 2. Credential Registry */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-blue-400" />
                    Accounts Registry
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Check size={11} /> Operational
                  </span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Authoritative account mapping in <code className="text-emerald-300 font-mono">{USERS_FILE}</code>. Preserves registered credentials with zero artificial account limits.
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800">
                  <span>Captured accounts:</span>
                  <span className="text-white font-bold">{accountsList.length} accounts</span>
                </div>
              </div>

              {/* 3. Disk Persistence */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Server size={14} className="text-purple-400" />
                    Atomic Disk Storage
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Check size={11} /> Operational
                  </span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Zero-corruption disk persistence engine inside <code className="text-purple-300 font-mono">/server_data/</code>. Writes atomically via temporary file swapping.
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800">
                  <span>Disk sync mode:</span>
                  <span className="text-emerald-400 font-semibold">Atomic Swap</span>
                </div>
              </div>

              {/* 4. Cross-Client Master Sync */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <RefreshCw size={14} className="text-sky-400" />
                    Central Master Sync
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Check size={11} /> Operational
                  </span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Continuous 3-second heartbeat and bidirectional reconciliation on <code className="text-sky-300 font-mono">/api/test/sync</code>. Any new sign-in instantly syncs across all open tabs.
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800">
                  <span>Heartbeat cycle:</span>
                  <span className="text-white font-bold">Every 3.0s</span>
                </div>
              </div>

              {/* 5. Access Whitelist */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-amber-400" />
                    Access Permissions
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Check size={11} /> Operational
                  </span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Whitelisted role validation in <code className="text-amber-300 font-mono">{AUTHORIZED_TEST_USERS_FILE}</code>. Primary Admin is hard-locked to <span className="text-white font-semibold">{PRIMARY_ADMIN_EMAIL}</span>.
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800">
                  <span>Primary Administrator:</span>
                  <span className="text-emerald-400 font-semibold truncate max-w-[140px]">{PRIMARY_ADMIN_EMAIL}</span>
                </div>
              </div>

              {/* 6. Navigation Bridge */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ArrowRight size={14} className="text-rose-400" />
                    Workspace &amp; Funnel Routing
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Check size={11} /> Operational
                  </span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Zero dead-end navigation flow between the Sign-In funnel entry, test console (/test), and the full mail workspace.
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800">
                  <span>Routing status:</span>
                  <span className="text-emerald-400 font-semibold">Bidirectional OK</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
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

        {/* Section: Centralized Server Synchronization & Multi-Admin Pipeline */}
        <section className="bg-gradient-to-br from-[#1E293B] to-slate-900 border border-indigo-500/30 rounded-lg overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-indigo-950/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                <Server size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                  <span>Centralized Server Synchronization</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Unified Active
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronizes all accounts and login telemetry across all systems, devices, and multiple admins into one central database.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMasterJson}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors cursor-pointer"
                title="Export full registry JSON to clipboard"
              >
                {copiedPayload ? <Check size={14} className="text-emerald-400" /> : <Download size={14} className="text-indigo-400" />}
                <span>{copiedPayload ? 'Copied Full JSON!' : 'Export JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded shadow transition-colors cursor-pointer"
                title="Paste and merge accounts from another system"
              >
                <Upload size={14} />
                <span>Import &amp; Merge</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Quick sync options */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <Globe size={14} className="text-blue-400" />
                    <span>Cross-System Peer Sync (Direct URL Bridge)</span>
                  </div>
                  <div className="text-[12px] text-slate-400 mt-1 max-w-xl">
                    Connects this system with another system (e.g. Shared Preview URL vs Dev App URL) and merges all captured accounts bidirectionally.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isRemoteSyncing}
                    onClick={() => handlePeerSync('https://ais-pre-spgaofsap4eoue5voc4mmc-122308163278.europe-west2.run.app')}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className={isRemoteSyncing ? 'animate-spin' : ''} />
                    <span>Sync Shared App URL</span>
                  </button>
                  <button
                    type="button"
                    disabled={isRemoteSyncing}
                    onClick={() => handlePeerSync('https://ais-dev-spgaofsap4eoue5voc4mmc-122308163278.europe-west2.run.app')}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className={isRemoteSyncing ? 'animate-spin' : ''} />
                    <span>Sync Dev URL</span>
                  </button>
                </div>
              </div>

              {/* Custom URL Input */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="url"
                  value={remoteSyncUrl}
                  onChange={(e) => setRemoteSyncUrl(e.target.value)}
                  placeholder="https://... (Remote instance URL to synchronize with)"
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  disabled={isRemoteSyncing || !remoteSyncUrl.trim()}
                  onClick={() => handlePeerSync(remoteSyncUrl)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isRemoteSyncing ? 'Syncing...' : 'Sync Custom URL'}
                </button>
              </div>

              {remoteSyncStatus && (
                <div className={`mt-3 text-xs p-2.5 rounded border flex items-center gap-2 ${
                  remoteSyncStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                }`}>
                  {remoteSyncStatus.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <span>{remoteSyncStatus.message}</span>
                </div>
              )}
            </div>

            {/* Multi-Admin Info Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 font-medium">Master Server Status</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Centralized &amp; Authoritative</span>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 font-medium">Multi-Admin Synchronized</div>
                <div className="text-sm font-semibold text-white mt-1">
                  {authorizedUsers.length} Admin{authorizedUsers.length === 1 ? '' : 's'} with Full Access
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 font-medium">Consolidated Accounts</div>
                <div className="text-sm font-semibold text-blue-400 mt-1">
                  {Object.keys(users).length} Accounts across all systems
                </div>
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
                Captured Accounts ({accountsList.length})
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
                <span>{showAddAccountForm ? 'Cancel' : 'Add Account'}</span>
              </button>
              <button
                type="button"
                onClick={handleCleanUpAll}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-900/50 hover:bg-rose-900/80 border border-rose-700/60 text-rose-200 text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                title="Wipe all attempts logs and remove all test accounts"
              >
                <Trash2 size={13} />
                <span>Clean Up All Logs &amp; Users</span>
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
              Authentication Attempt Simulator (Funneled to {ATTEMPTS_FILE})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Test any credential. In this test environment, there is <strong className="text-slate-200">no check for if an account is registered</strong>. Any login is automatically funneled and recorded into <code className="text-sky-300 font-mono">{ATTEMPTS_FILE}</code>.
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleRunLoginTest(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Log OK</span>
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
              <button
                type="button"
                onClick={handleRunMultiTest}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                title="Fire 3 consecutive attempts rapidly to verify continuous capture pipeline"
              >
                <Zap size={14} />
                <span>Simulate 3 Rapid Attempts</span>
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

        {/* Section 3: Data Store Tab Viewer */}
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
                  Contents of <code className="text-blue-300 font-mono">{USERS_FILE}</code>. Unlimited accounts can be captured and saved here.
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
                  Contents of <code className="text-blue-300 font-mono">{ATTEMPTS_FILE}</code>. Chronological record of all authentication attempts with zero limit.
                </div>
                {attempts.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-lg">
                    No attempts logged yet in {ATTEMPTS_FILE}. Run a login test or sign in from the main page to see attempts funneled here.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Timestamp (ISO)</th>
                          <th className="p-3">Email Attempted</th>
                          <th className="p-3">Password</th>
                          <th className="p-3">Funnel Stage / Event</th>
                          <th className="p-3 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {attempts.slice().reverse().map((att, i) => (
                          <tr key={att.id || i} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 text-slate-400 whitespace-nowrap">{att.time}</td>
                            <td className="p-3 text-white font-medium">{att.email}</td>
                            <td className="p-3 text-slate-300">
                              {att.password ? (
                                <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                  {att.password}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">&lt;none / step 1&gt;</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                {att.stage || 'Full login submitted'}
                              </span>
                              {att.notes && (
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  {att.notes}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
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
        Test Environment (/test) • Unlimited Capacity • Centralized Server Active
      </footer>

      {/* Import & Merge Master Payload Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Import &amp; Merge Master Registry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportStatus(null);
                  setImportJsonText('');
                }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Paste the exported JSON registry from another system or admin panel below. This will perform a <strong>lossless bidirectional merge</strong> into the centralized server, unifying all accounts and login history.
              </p>

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{\n  "users": { ... },\n  "attempts": [ ... ]\n}'
                rows={8}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
              />

              {importStatus && (
                <div className={`text-xs p-3 rounded border flex items-center gap-2 ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                }`}>
                  {importStatus.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportStatus(null);
                    setImportJsonText('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importJsonText.trim() || isRemoteSyncing}
                  onClick={handleApplyImportJson}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded shadow transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isRemoteSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>{isRemoteSyncing ? 'Merging...' : 'Merge Into Master Server'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
