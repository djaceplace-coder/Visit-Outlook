import React from 'react';

interface EmptyInboxGraphicProps {
  title?: string;
  subtitle?: string;
  onLoadSamples?: () => void;
}

export function EmptyInboxGraphic({ 
  title = "All done for the day", 
  subtitle = "Enjoy your empty inbox.",
  onLoadSamples 
}: EmptyInboxGraphicProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
      {/* 3D Frosted Mailbox Tray with Cyan Glow */}
      <div className="relative mb-5 flex items-center justify-center">
        <svg
          width="130"
          height="120"
          viewBox="0 0 130 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
        >
          <defs>
            {/* Outer Box Gradient */}
            <linearGradient id="boxOuterGrad" x1="65" y1="10" x2="65" y2="105" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#EDEFEF" />
              <stop offset="100%" stopColor="#D5D9DC" />
            </linearGradient>

            {/* Inner Glow Gradient */}
            <linearGradient id="innerCyanGlow" x1="65" y1="15" x2="65" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#BAE6FD" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.2" />
            </linearGradient>

            {/* Front Lip Gradient */}
            <linearGradient id="frontLipGrad" x1="65" y1="65" x2="65" y2="105" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F1F3F5" />
              <stop offset="100%" stopColor="#DDE1E5" />
            </linearGradient>

            {/* Subtle Rim Highlight */}
            <linearGradient id="rimLight" x1="20" y1="15" x2="110" y2="15" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
            </linearGradient>

            {/* Drop Shadow Filter */}
            <filter id="trayShadow" x="-10%" y="-5%" width="120%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Soft Ground Shadow */}
          <ellipse cx="65" cy="108" rx="45" ry="6" fill="#94A3B8" fillOpacity="0.22" />

          {/* Main 3D Tray Back Wall */}
          <rect
            x="18"
            y="14"
            width="94"
            height="90"
            rx="20"
            fill="url(#boxOuterGrad)"
            filter="url(#trayShadow)"
          />

          {/* Inner Cavity with Cyan Light Glow */}
          <rect
            x="24"
            y="18"
            width="82"
            height="70"
            rx="14"
            fill="url(#innerCyanGlow)"
          />

          {/* Gentle Radial Cyan Light Flare in center */}
          <circle cx="65" cy="48" r="28" fill="#38BDF8" fillOpacity="0.22" filter="blur(8px)" />

          {/* Front Curved Face with Center Cutout */}
          <path
            d="
              M 18 64
              C 18 58, 22 55, 28 55
              L 38 55
              C 44 55, 46 72, 54 72
              L 76 72
              C 84 72, 86 55, 92 55
              L 102 55
              C 108 55, 112 58, 112 64
              L 112 84
              C 112 96, 102 104, 90 104
              L 40 104
              C 28 104, 18 96, 18 84
              Z
            "
            fill="url(#frontLipGrad)"
          />

          {/* Top highlight line on front cutout */}
          <path
            d="
              M 28 55
              L 38 55
              C 44 55, 46 72, 54 72
              L 76 72
              C 84 72, 86 55, 92 55
              L 102 55
            "
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Subtle bottom edge curvature line */}
          <path
            d="M 28 98 C 45 102, 85 102, 102 98"
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Typography strictly matching screenshot */}
      <h3 className="text-sm font-bold text-[#242424] tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#616161]">
        {subtitle}
      </p>

      {/* Optional helper to quickly load demo messages */}
      {onLoadSamples && (
        <button
          type="button"
          onClick={onLoadSamples}
          className="mt-4 px-3 py-1 text-[11px] font-medium text-brand-cobalt bg-brand-ice/60 hover:bg-brand-ice border border-brand-cobalt/20 transition-colors"
        >
          Populate sample emails
        </button>
      )}
    </div>
  );
}
