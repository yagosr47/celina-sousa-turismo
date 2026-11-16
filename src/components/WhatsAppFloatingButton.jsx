import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl } from '../lib/api';

export default function WhatsAppFloatingButton() {
  const { siteData } = useApp();
  const settings = siteData.settings || {};
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    'Olá Celina! Vim pelo site da Celina Sousa Turismo e gostaria de mais informações.'
  );

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com Celina Sousa Turismo pelo WhatsApp"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 inline-flex items-center gap-2.5 p-3.5 sm:px-4 sm:py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-700/30 hover:shadow-2xl transition-all hover:scale-105 active:scale-95 group ring-2 ring-white/80"
    >
      <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-white" />
      </span>
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline">Falar no WhatsApp</span>
    </a>
  );
}
