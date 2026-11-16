import React from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function ProfessionalEmblem({ className = 'w-11 h-11' }) {
  return (
    <svg
      viewBox="0 0 144 144"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cstEmblemBg" x1="8" y1="6" x2="136" y2="138" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="52%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="cstSunGrad" x1="46" y1="24" x2="96" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="cstWaveGrad" x1="16" y1="96" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="136" height="136" rx="36" fill="url(#cstEmblemBg)" />
      <rect
        x="7"
        y="7"
        width="130"
        height="130"
        rx="33"
        stroke="#7DD3FC"
        strokeOpacity="0.38"
        strokeWidth="2"
      />

      {/* Golden Sun */}
      <circle cx="72" cy="60" r="26" fill="url(#cstSunGrad)" />
      <circle
        cx="72"
        cy="60"
        r="32"
        stroke="#FDE047"
        strokeOpacity="0.3"
        strokeWidth="2.5"
        strokeDasharray="4 5"
      />

      {/* Resort Palm Silhouette */}
      <path d="M55 96C56 78 62 63 68 51C65 65 62 80 61 96H55Z" fill="#0F172A" />
      <path d="M68 52C56 45 43 47 35 54C46 52 56 53 66 57L68 52Z" fill="#0F172A" />
      <path d="M68 51C59 39 48 35 38 38C49 40 58 45 66 53L68 51Z" fill="#0F172A" />
      <path d="M68 51C78 39 90 37 100 42C89 42 79 46 70 53L68 51Z" fill="#0F172A" />
      <path d="M68 52C81 47 93 50 101 58C91 54 80 53 70 56L68 52Z" fill="#0F172A" />

      {/* Thermal Resort Waves */}
      <path
        d="M16 97C32 89 48 89 64 96C80 103 98 103 128 92V114C98 123 80 123 64 116C48 109 32 109 16 117V97Z"
        fill="url(#cstWaveGrad)"
      />
      <path
        d="M24 117C40 111 56 111 72 117C88 123 104 123 120 116V127C100 135 84 134 72 129C56 123 40 123 24 128V117Z"
        fill="#E0F2FE"
        fillOpacity="0.92"
      />

      {/* Flight Arc & Jet */}
      <path
        d="M27 40C49 21 84 17 111 30"
        stroke="#FFFFFF"
        strokeOpacity="0.82"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="3.5 4.5"
      />
      <path d="M120 34L106 25L109 32L103 37L120 34Z" fill="#FFFFFF" />
    </svg>
  );
}

export default function BrandLogo({ variant = 'default', showImage = true, size = 'md' }) {
  const { siteData } = useApp();
  const settings = siteData.settings || {};
  const companyName = settings.company_name || 'Celina Sousa Turismo';
  const companySubtitle = settings.company_subtitle || 'Caldas Locações';
  const logoUrl = settings.logo_url || '/assets/images/logo-profissional.svg';

  const isLightText = variant === 'dark';

  // Use custom uploaded image only if admin changed it to a custom upload
  const isCustomUploadedLogo =
    logoUrl &&
    logoUrl !== '/assets/images/logo-original.jpeg' &&
    logoUrl !== '/assets/images/logo-profissional.svg';

  const emblemSizes = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  };

  return (
    <div className="inline-flex items-center gap-2.5 sm:gap-3 select-none group">
      {showImage && (
        <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
          {isCustomUploadedLogo ? (
            <div className="h-10 sm:h-12 rounded-2xl bg-white shadow-sm border border-brand-200/80 flex items-center justify-center px-2 py-1 overflow-hidden">
              <img src={logoUrl} alt={companyName} className="h-full w-auto object-contain" />
            </div>
          ) : (
            <div className="relative">
              <ProfessionalEmblem className={`${emblemSizes[size] || emblemSizes.md} drop-shadow-md`} />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col leading-none min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-extrabold tracking-tight truncate ${
              size === 'lg'
                ? 'text-lg sm:text-2xl'
                : size === 'sm'
                  ? 'text-sm sm:text-base'
                  : 'text-[15px] sm:text-lg'
            } ${isLightText ? 'text-white' : 'text-slate-900'}`}
          >
            {companyName}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span
            className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${
              isLightText
                ? 'bg-brand-500/20 text-brand-300 border border-brand-400/30'
                : 'bg-gradient-to-r from-brand-600 to-sky-600 text-white shadow-xs'
            }`}
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-300 shrink-0" />
            <span className="truncate">{companySubtitle}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
