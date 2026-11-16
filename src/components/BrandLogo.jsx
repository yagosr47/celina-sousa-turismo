import React from 'react';
import { Plane } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BrandLogo({ variant = 'default', showImage = true, size = 'md' }) {
  const { siteData } = useApp();
  const settings = siteData.settings || {};
  const companyName = settings.company_name || 'Celina Sousa Turismo';
  const companySubtitle = settings.company_subtitle || 'Caldas Locações';
  const logoUrl = settings.logo_url || '/assets/images/logo-original.jpeg';

  const isLightText = variant === 'dark';

  const sizeClasses = {
    sm: 'h-9',
    md: 'h-12',
    lg: 'h-16',
  };

  return (
    <div className="inline-flex items-center gap-3 select-none group">
      {showImage && logoUrl ? (
        <div
          className={`relative overflow-hidden rounded-xl bg-white shadow-sm border border-brand-200/80 flex items-center justify-center px-2 py-1 transition-transform duration-200 group-hover:scale-[1.02] ${sizeClasses[size] || sizeClasses.md}`}
        >
          <img
            src={logoUrl}
            alt={companyName}
            className="h-full w-auto object-contain"
          />
        </div>
      ) : (
        <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-md">
          <Plane className="w-5 h-5 -rotate-12" />
        </div>
      )}

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight ${
              size === 'lg' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
            } ${isLightText ? 'text-white' : 'text-slate-900'}`}
          >
            {companyName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
              isLightText
                ? 'bg-brand-500/20 text-brand-300 border border-brand-400/30'
                : 'bg-brand-50 text-brand-700 border border-brand-200'
            }`}
          >
            <Plane className="w-3 h-3 text-brand-500" />
            {companySubtitle}
          </span>
        </div>
      </div>
    </div>
  );
}
