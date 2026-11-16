import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  Target,
  Briefcase,
  PhoneCall,
  Instagram,
  MessageCircle,
  CalendarPlus,
  Clock,
  MapPin,
  Mail,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl } from '../lib/api';
import BrandLogo from '../components/BrandLogo';

function parseListSetting(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return String(raw)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AboutPage() {
  const { siteData, openBookingModal } = useApp();
  const settings = siteData.settings || {};

  const servicesList = parseListSetting(settings.about_services);
  const differentialsList = parseListSetting(settings.about_differentials);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    'Olá Celina! Vim pela página Sobre a Empresa no site da Celina Sousa Turismo e gostaria de mais informações.'
  );

  return (
    <div className="pb-20 space-y-16">
      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
            Institucional
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Sobre a {settings.company_name || 'Celina Sousa Turismo'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-lg max-w-3xl leading-relaxed">
            {settings.company_subtitle || 'Caldas Locações'} • Atendimento dedicado em clubes,
            locações, destinos turísticos e viagens.
          </p>
        </div>
      </section>

      {/* Main Presentation & Photos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <BrandLogo size="md" />
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {settings.presentation_title || 'Apresentação da Empresa'}
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base">
                {settings.presentation_text ||
                  'A Celina Sousa Turismo — Caldas Locações atua na divulgação e intermediação de locações, clubes, parques aquáticos, hotéis, destinos turísticos e viagens.'}
              </p>
            </div>

            {settings.about_history && String(settings.about_history).trim() !== '' && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                <h4 className="text-base font-extrabold text-slate-900">Nossa História</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {settings.about_history}
                </p>
              </div>
            )}

            {settings.about_objective && (
              <div className="p-6 rounded-3xl bg-brand-50/70 border border-brand-200 space-y-2">
                <div className="flex items-center gap-2 text-brand-800">
                  <Target className="w-5 h-5 text-brand-600" />
                  <h4 className="text-base font-extrabold">Nosso Objetivo</h4>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {settings.about_objective}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 h-72 sm:h-80 rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
              <img
                src={settings.about_image_url || '/assets/images/about-tourism.jpg'}
                alt="Turismo e Lazer Celina Sousa Turismo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-52 rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
              <img
                src={settings.about_secondary_image_url || '/assets/images/resort-apartment.jpg'}
                alt="Caldas Locações e Hospedagem"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-52 rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
              <img
                src="/assets/images/waterpark-pools.jpg"
                alt="Clubes e Parques Aquáticos"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services & Differentials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-50 text-brand-700">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Serviços Oferecidos</h2>
              <p className="text-xs text-slate-500">O que você encontra na Celina Sousa Turismo</p>
            </div>
          </div>

          <ul className="space-y-3">
            {servicesList.map((service, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-800"
              >
                <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <span>{service}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-50 text-brand-700">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Nossos Diferenciais</h2>
              <p className="text-xs text-slate-500">Por que planejar seu lazer conosco</p>
            </div>
          </div>

          <ul className="space-y-3">
            {differentialsList.map((diff, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-50/50 border border-brand-100 text-sm font-medium text-slate-800"
              >
                <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <span>{diff}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Attendance Information */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Informações de Atendimento</h2>
              <p className="text-sm text-slate-600 mt-1">
                Canais oficiais da Celina Sousa Turismo para tirar dúvidas e solicitar reservas.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openBookingModal()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow"
              >
                <CalendarPlus className="w-4 h-4" />
                Solicitar Agendamento
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow"
              >
                <MessageCircle className="w-4 h-4" />
                Falar no WhatsApp
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-brand-600" />
                WhatsApp / Telefone
              </span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-extrabold text-slate-900 hover:text-brand-700 text-base"
              >
                {settings.phone_display || '(64) 9 9206-5866'}
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-brand-600" />
                Instagram Oficial
              </span>
              <a
                href={settings.instagram_url || 'https://www.instagram.com/celinasousaturismo/'}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-extrabold text-slate-900 hover:text-brand-700 text-base"
              >
                {settings.instagram_handle || '@celinasousaturismo'}
              </a>
            </div>

            {settings.email_contact && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-brand-600" />
                  E-mail
                </span>
                <p className="font-bold text-slate-900 break-all">{settings.email_contact}</p>
              </div>
            )}

            {settings.business_hours && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-600" />
                  Horário de Atendimento
                </span>
                <p className="font-bold text-slate-900">{settings.business_hours}</p>
              </div>
            )}

            {settings.address_info && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  Localização
                </span>
                <p className="font-bold text-slate-900">{settings.address_info}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
