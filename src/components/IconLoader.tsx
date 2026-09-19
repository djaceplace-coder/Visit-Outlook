import { useEffect } from 'react';
import { Logo } from './Logo';

interface IconLoaderProps {
  onComplete: () => void;
  userEmail?: string;
}

export function IconLoader({ onComplete, userEmail }: IconLoaderProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2100);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-[#0078D4]/6 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center">
        {/* Animated Icon with subtle scale pulse & glow */}
        <div className="relative">
          {/* Radial soft glow behind the icon */}
          <div className="absolute -inset-4 bg-[#0078D4]/15 rounded-full blur-xl animate-pulse" />

          {/* Logo container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 animate-[pulse_1.6s_ease-in-out_infinite] transition-transform">
            <Logo className="w-full h-full rounded-2xl sm:rounded-3xl shadow-lg border border-white/80" />
          </div>
        </div>

        {/* User Account pill if email provided */}
        {userEmail && (
          <div className="mt-6 px-3 py-1 bg-white border border-gray-200/80 rounded-full shadow-xs flex items-center gap-2 max-w-[280px]">
            <div className="w-4 h-4 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-[9px] font-bold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-700 font-medium truncate">
              {userEmail}
            </span>
          </div>
        )}

        {/* 5-dot Fluent wave loader */}
        <div className="flex gap-1.5 mt-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-cobalt"
              style={{
                animation: `bounce-wave 1.1s ease-in-out infinite`,
                animationDelay: `${i * 0.12}s`
              }}
            />
          ))}
        </div>

        {/* Loading text */}
        <div className="mt-3.5 text-center">
          <p className="text-xs font-semibold text-gray-700 tracking-wide">
            Signing in...
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Loading your workspace and messages
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce-wave {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-7px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
