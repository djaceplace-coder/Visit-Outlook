import React from 'react';
import { Mail } from 'lucide-react';

interface OutlookMobileQrGraphicProps {
  className?: string;
  compact?: boolean;
}

export function OutlookMobileQrGraphic({ className = '', compact = false }: OutlookMobileQrGraphicProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200 ${className}`}>
      {/* QR Code Container */}
      <div className={`relative ${compact ? 'mb-3 p-2.5' : 'mb-5 p-3.5'} bg-white border border-gray-150 shadow-xs rounded-xl flex items-center justify-center`}>
        {/* SVG QR Code */}
        <svg
          width={compact ? "112" : "136"}
          height={compact ? "112" : "136"}
          viewBox="0 0 144 144"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-900"
        >
          {/* Background white */}
          <rect width="144" height="144" rx="8" fill="white" />

          {/* Top-Left Finder Pattern */}
          <rect x="12" y="12" width="34" height="34" rx="7" fill="none" stroke="#242424" strokeWidth="4" />
          <rect x="22" y="22" width="14" height="14" rx="3" fill="#242424" />

          {/* Top-Right Finder Pattern */}
          <rect x="98" y="12" width="34" height="34" rx="7" fill="none" stroke="#242424" strokeWidth="4" />
          <rect x="108" y="22" width="14" height="14" rx="3" fill="#242424" />

          {/* Bottom-Left Finder Pattern */}
          <rect x="12" y="98" width="34" height="34" rx="7" fill="none" stroke="#242424" strokeWidth="4" />
          <rect x="22" y="108" width="14" height="14" rx="3" fill="#242424" />

          {/* QR Data Pattern Dots (accurate matrix aesthetic) */}
          <g fill="#242424">
            {/* Top row alignment and timing */}
            <rect x="52" y="14" width="4" height="4" rx="1" />
            <rect x="60" y="14" width="4" height="4" rx="1" />
            <rect x="72" y="14" width="4" height="4" rx="1" />
            <rect x="84" y="14" width="4" height="4" rx="1" />
            
            <rect x="56" y="22" width="4" height="4" rx="1" />
            <rect x="68" y="22" width="4" height="4" rx="1" />
            <rect x="80" y="22" width="4" height="4" rx="1" />

            <rect x="52" y="30" width="4" height="4" rx="1" />
            <rect x="64" y="30" width="4" height="4" rx="1" />
            <rect x="76" y="30" width="4" height="4" rx="1" />
            <rect x="88" y="30" width="4" height="4" rx="1" />

            <rect x="52" y="38" width="4" height="4" rx="1" />
            <rect x="60" y="38" width="4" height="4" rx="1" />
            <rect x="72" y="38" width="4" height="4" rx="1" />

            {/* Left mid column dots */}
            <rect x="14" y="52" width="4" height="4" rx="1" />
            <rect x="22" y="52" width="4" height="4" rx="1" />
            <rect x="34" y="52" width="4" height="4" rx="1" />
            <rect x="42" y="52" width="4" height="4" rx="1" />

            <rect x="14" y="62" width="4" height="4" rx="1" />
            <rect x="26" y="62" width="4" height="4" rx="1" />
            <rect x="38" y="62" width="4" height="4" rx="1" />

            <rect x="18" y="72" width="4" height="4" rx="1" />
            <rect x="30" y="72" width="4" height="4" rx="1" />
            <rect x="42" y="72" width="4" height="4" rx="1" />

            <rect x="14" y="82" width="4" height="4" rx="1" />
            <rect x="26" y="82" width="4" height="4" rx="1" />
            <rect x="34" y="82" width="4" height="4" rx="1" />

            {/* Right mid column dots */}
            <rect x="100" y="52" width="4" height="4" rx="1" />
            <rect x="112" y="52" width="4" height="4" rx="1" />
            <rect x="124" y="52" width="4" height="4" rx="1" />

            <rect x="106" y="62" width="4" height="4" rx="1" />
            <rect x="118" y="62" width="4" height="4" rx="1" />
            <rect x="126" y="62" width="4" height="4" rx="1" />

            <rect x="100" y="72" width="4" height="4" rx="1" />
            <rect x="114" y="72" width="4" height="4" rx="1" />
            <rect x="122" y="72" width="4" height="4" rx="1" />

            <rect x="104" y="82" width="4" height="4" rx="1" />
            <rect x="116" y="82" width="4" height="4" rx="1" />
            <rect x="126" y="82" width="4" height="4" rx="1" />

            {/* Bottom dots */}
            <rect x="52" y="98" width="4" height="4" rx="1" />
            <rect x="64" y="98" width="4" height="4" rx="1" />
            <rect x="76" y="98" width="4" height="4" rx="1" />
            <rect x="88" y="98" width="4" height="4" rx="1" />
            <rect x="102" y="98" width="4" height="4" rx="1" />
            <rect x="114" y="98" width="4" height="4" rx="1" />
            <rect x="126" y="98" width="4" height="4" rx="1" />

            <rect x="58" y="106" width="4" height="4" rx="1" />
            <rect x="70" y="106" width="4" height="4" rx="1" />
            <rect x="82" y="106" width="4" height="4" rx="1" />
            <rect x="108" y="106" width="4" height="4" rx="1" />
            <rect x="120" y="106" width="4" height="4" rx="1" />

            <rect x="52" y="116" width="4" height="4" rx="1" />
            <rect x="64" y="116" width="4" height="4" rx="1" />
            <rect x="78" y="116" width="4" height="4" rx="1" />
            <rect x="90" y="116" width="4" height="4" rx="1" />
            <rect x="102" y="116" width="4" height="4" rx="1" />
            <rect x="114" y="116" width="4" height="4" rx="1" />
            <rect x="124" y="116" width="4" height="4" rx="1" />

            <rect x="58" y="126" width="4" height="4" rx="1" />
            <rect x="72" y="126" width="4" height="4" rx="1" />
            <rect x="84" y="126" width="4" height="4" rx="1" />
            <rect x="96" y="126" width="4" height="4" rx="1" />
            <rect x="110" y="126" width="4" height="4" rx="1" />
            <rect x="122" y="126" width="4" height="4" rx="1" />
          </g>

          {/* Center cutout clear area for Outlook badge */}
          <rect x="52" y="52" width="40" height="40" rx="8" fill="white" />
        </svg>

        {/* Outlook icon badge in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-xs">
            <div className="w-7 h-7 rounded-md bg-[#0078D4] flex items-center justify-center text-white">
              <Mail size={16} strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Heading */}
      <h3 className="text-sm sm:text-base font-semibold text-[#242424] tracking-tight mb-1.5">
        You're going places. Take Outlook with you for free.
      </h3>

      {/* Subtext */}
      <p className="text-xs text-[#616161] max-w-sm leading-relaxed">
        Scan the QR code with your phone camera to download Outlook mobile
      </p>
    </div>
  );
}
