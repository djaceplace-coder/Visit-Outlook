import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Calendar, CheckSquare, Sparkles } from 'lucide-react';

interface EnvelopeLoaderProps {
  onComplete: () => void;
}

export function EnvelopeLoader({ onComplete }: EnvelopeLoaderProps) {
  // Phase lifecycle:
  // 1. 'opening': flap folds open
  // 2. 'panels-out': 3 panels emerge and stack upwards like a split deck on their side
  // 3. 'panels-retract': 3 panels slide back down into the envelope
  // 4. 'closing': flap folds back shut
  // 5. 'done': transitions to sign in
  const [phase, setPhase] = useState<'opening' | 'panels-out' | 'panels-retract' | 'closing' | 'done'>('opening');

  useEffect(() => {
    // 0.0s - 0.6s: Flap opens
    const timerOpen = setTimeout(() => {
      setPhase('panels-out');
    }, 600);

    // 0.6s - 2.5s: Panels stack upwards in a split deck and hover
    const timerRetract = setTimeout(() => {
      setPhase('panels-retract');
    }, 2400);

    // 2.5s - 3.1s: Panels are back inside, flap closes
    const timerClose = setTimeout(() => {
      setPhase('closing');
    }, 3100);

    // 3.6s: Complete and enter sign-in
    const timerDone = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 3700);

    return () => {
      clearTimeout(timerOpen);
      clearTimeout(timerRetract);
      clearTimeout(timerClose);
      clearTimeout(timerDone);
    };
  }, [onComplete]);

  const isFlapOpen = phase === 'panels-out' || phase === 'panels-retract';
  const arePanelsOut = phase === 'panels-out';

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-[#0078D4]/6 via-transparent to-transparent pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Outer Glow behind the envelope icon */}
        <div className="absolute -top-10 w-48 h-48 bg-[#0078D4]/15 rounded-full blur-2xl pointer-events-none animate-pulse" />

        {/* 
          ENVELOPE ICON (Same size & type as post-password loader icon: w-28 h-28 sm:w-32 sm:h-32)
        */}
        <div 
          className="relative w-28 h-28 sm:w-32 sm:h-32"
          style={{ perspective: '900px' }}
        >
          {/* ============================================================
              3 STACKED PANELS (Split deck on their side, stacking upwards)
              ============================================================ */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center items-end pointer-events-none z-10">
            {/* Panel 1: Bottom of the stack (Mail & Inbox Summary) */}
            <motion.div
              className="absolute w-36 h-22 sm:w-40 sm:h-24 bg-white/95 backdrop-blur-md rounded-xl border border-blue-100 shadow-[0_8px_20px_rgba(0,120,212,0.18)] p-2.5 flex flex-col justify-between"
              initial={{ y: 0, x: 0, rotate: 0, scale: 0.7, opacity: 0 }}
              animate={
                arePanelsOut
                  ? { y: -52, x: -16, rotate: -8, scale: 0.92, opacity: 1 }
                  : { y: 10, x: 0, rotate: 0, scale: 0.7, opacity: 0 }
              }
              transition={{
                duration: arePanelsOut ? 0.75 : 0.5,
                ease: arePanelsOut ? [0.16, 1, 0.3, 1] : [0.7, 0, 0.84, 0]
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#0078D4] text-white flex items-center justify-center shadow-xs">
                    <Mail size={12} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 tracking-tight">Inbox</span>
                </div>
                <span className="text-[9px] font-semibold bg-blue-50 text-[#0078D4] px-1.5 py-0.5 rounded-full">
                  12 New
                </span>
              </div>
              <div className="space-y-1 my-auto">
                <div className="h-2 bg-blue-100/70 rounded-full w-4/5" />
                <div className="h-1.5 bg-gray-100 rounded-full w-full" />
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100/80 text-[9px] text-gray-400">
                <span>alex.bennett@outlook.com</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </motion.div>

            {/* Panel 2: Middle of the stack (Calendar / Events) */}
            <motion.div
              className="absolute w-36 h-22 sm:w-40 sm:h-24 bg-white/95 backdrop-blur-md rounded-xl border border-indigo-100 shadow-[0_10px_24px_rgba(0,90,158,0.22)] p-2.5 flex flex-col justify-between"
              initial={{ y: 0, x: 0, rotate: 0, scale: 0.7, opacity: 0 }}
              animate={
                arePanelsOut
                  ? { y: -98, x: 0, rotate: 2, scale: 0.96, opacity: 1 }
                  : { y: 10, x: 0, rotate: 0, scale: 0.7, opacity: 0 }
              }
              transition={{
                duration: arePanelsOut ? 0.8 : 0.48,
                ease: arePanelsOut ? [0.16, 1, 0.3, 1] : [0.7, 0, 0.84, 0],
                delay: arePanelsOut ? 0.05 : 0
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#005A9E] text-white flex items-center justify-center shadow-xs">
                    <Calendar size={12} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 tracking-tight">Calendar</span>
                </div>
                <span className="text-[9px] font-semibold bg-indigo-50 text-[#005A9E] px-1.5 py-0.5 rounded-full">
                  Today
                </span>
              </div>
              <div className="space-y-1 my-auto">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 rounded-full bg-[#0078D4]" />
                  <div className="h-2 bg-indigo-100/80 rounded-full w-2/3" />
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full w-full" />
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100/80 text-[9px] text-gray-400">
                <span>3 meetings scheduled</span>
                <span className="text-[9px] text-[#0078D4] font-medium">10:00 AM</span>
              </div>
            </motion.div>

            {/* Panel 3: Top of the stack (Tasks / Productivity Hub) */}
            <motion.div
              className="absolute w-36 h-22 sm:w-40 sm:h-24 bg-white/95 backdrop-blur-md rounded-xl border border-sky-100 shadow-[0_12px_28px_rgba(0,120,212,0.25)] p-2.5 flex flex-col justify-between"
              initial={{ y: 0, x: 0, rotate: 0, scale: 0.7, opacity: 0 }}
              animate={
                arePanelsOut
                  ? { y: -142, x: 18, rotate: 10, scale: 1, opacity: 1 }
                  : { y: 10, x: 0, rotate: 0, scale: 0.7, opacity: 0 }
              }
              transition={{
                duration: arePanelsOut ? 0.85 : 0.45,
                ease: arePanelsOut ? [0.16, 1, 0.3, 1] : [0.7, 0, 0.84, 0],
                delay: arePanelsOut ? 0.1 : 0
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#0078D4] to-[#2886DE] text-white flex items-center justify-center shadow-xs">
                    <CheckSquare size={12} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 tracking-tight">To Do &amp; Sync</span>
                </div>
                <Sparkles size={11} className="text-amber-500" />
              </div>
              <div className="space-y-1.5 my-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-xs border border-emerald-500 bg-emerald-50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-2xs" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-3/4" />
                </div>
                <div className="h-1.5 bg-sky-100/70 rounded-full w-5/6" />
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100/80 text-[9px] text-gray-400">
                <span>All connected</span>
                <span className="text-emerald-600 font-semibold text-[9px]">Synced</span>
              </div>
            </motion.div>
          </div>

          {/* ============================================================
              ENVELOPE BACK BODY (Squircle matching the Outlook icon)
              ============================================================ */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#005A9E] to-[#004578] shadow-lg border border-white/60 overflow-hidden">
            {/* Interior slot cavity where panels descend */}
            <div className="absolute inset-x-2 top-2 h-10 bg-[#003B66] rounded-t-xl" />
          </div>

          {/* ============================================================
              ENVELOPE FRONT POCKET & OUTLOOK EMBLEM (Covers lower half)
              ============================================================ */}
          <div className="absolute inset-x-0 bottom-0 top-3 rounded-b-2xl sm:rounded-b-3xl overflow-hidden z-20 pointer-events-none">
            {/* Front pocket with Outlook blue gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0062AD] via-[#0078D4] to-[#108BE3] border-t border-white/30 shadow-md">
              {/* Geometric envelope fold line accents */}
              <svg 
                className="absolute inset-0 w-full h-full opacity-60" 
                viewBox="0 0 128 116" 
                preserveAspectRatio="none"
              >
                <path d="M0 0 L64 54 L128 0" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
                <path d="M0 116 L64 48 L128 116" stroke="white" strokeWidth="1.5" strokeOpacity="0.25" fill="none" />
              </svg>

              {/* The iconic Outlook 'O' Squircle Emblem on the front-left pocket */}
              <div className="absolute bottom-2.5 left-2.5 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#004578] via-[#005A9E] to-[#0078D4] shadow-md border border-white/30 flex items-center justify-center">
                <span className="text-white font-extrabold text-base sm:text-lg tracking-tight select-none drop-shadow-xs">
                  O
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================
              ENVELOPE TOP FLAP (Folds open backwards and seals shut)
              ============================================================ */}
          <motion.div
            className="absolute top-0 inset-x-0 h-14 sm:h-16 z-30 pointer-events-none"
            style={{ 
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d'
            }}
            initial={{ rotateX: 0 }}
            animate={{ 
              rotateX: isFlapOpen ? -175 : 0 
            }}
            transition={{
              duration: 0.65,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <div className="w-full h-full relative">
              <svg 
                className="w-full h-full drop-shadow-md" 
                viewBox="0 0 128 64" 
                fill="none" 
                preserveAspectRatio="none"
              >
                {/* Triangular folding flap with rounded tip */}
                <path 
                  d="M0 0 L64 58 Q64 59 64 58 L128 0 Z" 
                  fill={isFlapOpen ? '#004E8C' : '#0078D4'} 
                />
                <path 
                  d="M0 0 L64 58 L128 0" 
                  stroke="rgba(255,255,255,0.4)" 
                  strokeWidth="1.5" 
                  fill="none" 
                />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* ============================================================
            BRANDING & FLUENT WAVE LOADER
            ============================================================ */}
        <div className="mt-12 flex flex-col items-center">
          <span className="font-semibold text-lg text-gray-800 tracking-tight mb-3">
            Outlook
          </span>

          {/* 5-dot wave loader */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#0078D4]"
                style={{
                  animation: `fluent-bounce 1.1s ease-in-out infinite`,
                  animationDelay: `${i * 0.12}s`
                }}
              />
            ))}
          </div>

          <span className="mt-3 text-xs text-gray-400 font-medium">
            {phase === 'closing' || phase === 'done' ? 'Ready to sign in...' : 'Opening your workspace...'}
          </span>

          {/* Skip button */}
          <button
            type="button"
            onClick={onComplete}
            className="mt-5 text-[11px] text-gray-400 hover:text-[#0078D4] underline transition-colors cursor-pointer"
          >
            Skip to Sign in
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fluent-bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
