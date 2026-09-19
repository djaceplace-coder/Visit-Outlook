import { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Users, 
  History, 
  Copy, 
  Check, 
  Trash2, 
  RotateCcw, 
  KeyRound, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { 
  loadUsers, 
  loadAttempts, 
  clearAttempts, 
  resetUsersToDefault,
  LoginAttempt,
  UsersMap 
} from '../lib/testAuth';

interface TestEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser?: (email: string, password?: string) => void;
}

export function TestEnvironmentModal({ isOpen, onClose, onSelectUser }: TestEnvironmentModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'attempts'>('users');
  const [users, setUsers] = useState<UsersMap>({});
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [copied, setCopied] = useState(false);

  const refreshData = () => {
    setUsers(loadUsers());
    setAttempts(loadAttempts());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    const dataToCopy = activeTab === 'users' ? users : attempts;
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearAttempts = () => {
    clearAttempts();
    setAttempts([]);
  };

  const handleResetUsers = () => {
    resetUsersToDefault();
    setUsers(loadUsers());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-none border border-gray-300 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden text-gray-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-brand-cobalt/10 flex items-center justify-center text-brand-cobalt">
              <Terminal size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">
                Test Environment Data Store
              </h2>
              <p className="text-xs text-gray-500">
                Mock local storage simulating <code className="text-xs bg-gray-100 px-1 py-0.5 border border-gray-200">users.json</code> &amp; <code className="text-xs bg-gray-100 px-1 py-0.5 border border-gray-200">attempts.json</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-none transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 px-5 pt-2 bg-gray-50/50 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'border-brand-cobalt text-brand-cobalt font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} />
            <span>[u]sers ({Object.keys(users).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('attempts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'attempts'
                ? 'border-brand-cobalt text-brand-cobalt font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={16} />
            <span>[a]ttempts ({attempts.length})</span>
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-gray-100/60 border-b border-gray-200 text-xs text-gray-600">
          <span className="font-mono">
            {activeTab === 'users' ? 'File: users.json' : 'File: attempts.json'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-none transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
            </button>
            {activeTab === 'users' ? (
              <button
                onClick={handleResetUsers}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-none transition-colors cursor-pointer shadow-2xs"
                title="Reset to default seeded users"
              >
                <RotateCcw size={13} />
                <span>Reset Defaults</span>
              </button>
            ) : (
              <button
                onClick={handleClearAttempts}
                disabled={attempts.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 hover:bg-red-50 text-red-600 disabled:opacity-40 disabled:pointer-events-none rounded-none transition-colors cursor-pointer shadow-2xs"
              >
                <Trash2 size={13} />
                <span>Clear Attempts</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
          {activeTab === 'users' ? (
            <div className="space-y-4">
              <div className="text-gray-500 font-sans text-xs">
                Click any user below to auto-populate the sign-in fields:
              </div>

              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(users) as [string, string][]).map(([email, pass]) => (
                  <div 
                    key={email}
                    onClick={() => {
                      if (onSelectUser) {
                        onSelectUser(email, pass);
                        onClose();
                      }
                    }}
                    className="p-3 bg-white border border-gray-200 hover:border-brand-cobalt/60 hover:bg-brand-cobalt/5 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound size={15} className="text-gray-400 group-hover:text-brand-cobalt" />
                      <span className="font-semibold text-gray-900">{email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-[11px]">password:</span>
                      <code className="bg-gray-100 px-2 py-0.5 border border-gray-200 text-gray-800">
                        {pass}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw JSON View */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-gray-500 font-sans text-xs mb-2 font-medium">
                  Raw users.json content:
                </div>
                <pre className="p-3 bg-gray-900 text-emerald-400 rounded-none overflow-x-auto text-[11px] leading-relaxed max-h-48 border border-gray-800">
                  {JSON.stringify(users, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-sans">
                  No login attempts recorded yet in attempts.json.
                  <p className="text-xs mt-1 text-gray-500">
                    Try logging in with valid or invalid credentials to see attempts recorded in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-500 font-sans text-xs mb-1 font-medium">
                    Attempt logs (chronological):
                  </div>
                  {attempts.map((attempt, idx) => (
                    <div 
                      key={idx}
                      className={`p-2.5 border flex items-center justify-between text-xs ${
                        attempt.success 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                          : 'bg-rose-50/70 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {attempt.success ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-rose-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold">{attempt.email}</span>
                          <span className="text-gray-500 mx-1.5">•</span>
                          <span className="text-gray-500 font-mono text-[11px]">{attempt.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[11px]">attempted:</span>
                        <code className="bg-white/80 px-1.5 py-0.5 border text-[11px]">
                          {attempt.password}
                        </code>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          attempt.success ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {attempt.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Raw JSON View */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-gray-500 font-sans text-xs mb-2 font-medium">
                      Raw attempts.json content:
                    </div>
                    <pre className="p-3 bg-gray-900 text-sky-400 rounded-none overflow-x-auto text-[11px] leading-relaxed max-h-48 border border-gray-800">
                      {JSON.stringify(attempts, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <span>Testing environment: client-side JSON store</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-none transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
