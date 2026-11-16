import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  Target,
  Briefcase,
  Heart,
  CalendarPlus,
  Clock,
  MapPin,
  Mail,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
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

const DEFAULT_PERSONAL_STORY = `Minha história com o turismo começou em 2020, em um momento de grandes mudanças na minha vida. Após minha separação, assumi a responsabilidade de cuidar dos meus dois filhos, que na época tinham 9 e 12 anos. Em busca de uma nova oportunidade de renda, comecei a trabalhar com locações de hospedagens em Caldas Novas.

Pouco tempo depois, veio a pandemia, trazendo desafios e interrompendo nossas atividades por aproximadamente um ano. Foi um período difícil, mas nunca pensei em desistir.

Sempre fui apaixonada por lidar com pessoas. Sou comunicativa, carismática e acredito que pequenos gestos podem transformar experiências. Gosto de ajudar, acolher e, principalmente, de participar da realização de sonhos.

Foi assim que descobri no turismo muito mais do que uma profissão: encontrei uma verdadeira paixão e um propósito que carrego com amor, dedicação e responsabilidade.

Hoje, através da Celina Sousa Turismo, meu objetivo é proporcionar muito mais do que hospedagens e viagens: quero ajudar pessoas e famílias a viverem momentos especiais, criarem boas lembranças e desfrutarem de experiências que ficarão para sempre na memória.`;

export default function AboutPage() {
  const { siteData, openBookingModal } = useApp();
  const settings = siteData.settings || {};

  const servicesList = parseListSetting(settings.about_services);
  const differentialsList = parseListSetting(settings.about_differentials);

  const celinaPhotoUrl =
    settings.about_image_url &&
    settings.about_image_url !== '/assets/images/about-tourism.jpg'
      ? settings.about_image_url
      : '/assets/images/celina-sousa.jpeg';

  return (
    <div className="pb-20 space-y-14 sm:space-y-20">
      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white py-12 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
            Apresentação Pessoal & Institucional
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Sobre a {settings.company_name || 'Celina Sousa Turismo'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-lg max-w-3xl leading-relaxed">
            {settings.company_subtitle || 'Caldas Locações'} • Conheça minha história, minha paixão
            pelo turismo e nosso compromisso com você e sua família.
          </p>
        </div>
      </section>

      {/* Main Personal Presentation & Celina Photo with Multi-Tone Blue Borders */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Celina Photo with Light, Medium, and Dark Blue Borders */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-sm mx-auto">
                {/* Ambient Blue Glows (Light, Medium, Dark Blue) */}
                <div className="absolute -top-4 -left-4 w-32 h-32 rounded-full bg-sky-300/40 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-4 -right-4 w-36 h-36 rounded-full bg-blue-900/35 blur-2xl pointer-events-none" />

                {/* Layer 1 (Outer Border): Variação Azul Escuro -> Azul Médio -> Azul Claro */}
                <div className="relative p-2 sm:p-2.5 rounded-[2.2rem] bg-gradient-to-tr from-blue-950 via-blue-600 to-sky-300 shadow-2xl shadow-blue-900/25">
                  {/* Layer 2 (Middle Border): Variação Azul Claro -> Azul Médio -> Azul Escuro */}
                  <div className="p-1.5 sm:p-2 rounded-[1.8rem] bg-gradient-to-bl from-sky-300 via-sky-500 to-blue-900 border-2 border-sky-200/90">
                    {/* Layer 3 (Inner Frame): Moldura Azul Escuro Profundo */}
                    <div className="relative rounded-[1.4rem] overflow-hidden border-[3px] border-blue-950 bg-slate-900 aspect-[4/5]">
                      <img
                        src={celinaPhotoUrl}
                        alt="Celina Sousa — Celina Sousa Turismo"
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/95 via-blue-950/55 to-transparent p-4 sm:p-5 text-white">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-400/25 border border-sky-300/40 text-sky-200 text-[11px] font-extrabold uppercase tracking-wider">
                          <Heart className="w-3 h-3 text-sky-300 fill-sky-300" />
                          Fundadora & Anfitriã
                        </span>
                        <h2 className="text-lg sm:text-xl font-extrabold mt-1">Celina Sousa</h2>
                        <p className="text-xs text-sky-200/90">
                          {settings.company_name || 'Celina Sousa Turismo'} •{' '}
                          {settings.company_subtitle || 'Caldas Locações'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blue Palette Legend / Accent Bar */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="h-2 w-8 rounded-full bg-sky-300" title="Azul Claro" />
                  <span className="h-2 w-12 rounded-full bg-blue-600" title="Azul Médio" />
                  <span className="h-2 w-8 rounded-full bg-blue-950" title="Azul Escuro" />
                </div>
              </div>
            </div>

            {/* Right Column: Personal Presentation Story */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <BrandLogo size="sm" />
              </div>

              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider border border-sky-200">
                  Apresentação Pessoal
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Olá, sou Celina Sousa!
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base">
                <p>
                  Minha história com o turismo começou em 2020, em um momento de grandes mudanças na
                  minha vida. Após minha separação, assumi a responsabilidade de cuidar dos meus
                  dois filhos, que na época tinham 9 e 12 anos. Em busca de uma nova oportunidade de
                  renda, comecei a trabalhar com locações de hospedagens em Caldas Novas.
                </p>
                <p>
                  Pouco tempo depois, veio a pandemia, trazendo desafios e interrompendo nossas
                  atividades por aproximadamente um ano. Foi um período difícil, mas nunca pensei em
                  desistir.
                </p>
                <p>
                  Sempre fui apaixonada por lidar com pessoas. Sou comunicativa, carismática e
                  acredito que pequenos gestos podem transformar experiências. Gosto de ajudar,
                  acolher e, principalmente, de participar da realização de sonhos.
                </p>
                <p>
                  Foi assim que descobri no turismo muito mais do que uma profissão: encontrei uma
                  verdadeira paixão e um propósito que carrego com amor, dedicação e
                  responsabilidade.
                </p>
                <p>
                  Hoje, através da{' '}
                  <strong className="font-extrabold text-blue-900">Celina Sousa Turismo</strong>,
                  meu objetivo é proporcionar muito mais do que hospedagens e viagens: quero ajudar
                  pessoas e famílias a viverem momentos especiais, criarem boas lembranças e
                  desfrutarem de experiências que ficarão para sempre na memória.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-l-4 border-blue-600 shadow-xs">
                <p className="text-base sm:text-lg font-extrabold text-blue-950">
                  Será um prazer fazer parte da sua próxima viagem!
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openBookingModal()}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-700 hover:from-brand-500 hover:to-blue-600 text-white text-sm font-extrabold shadow-md transition-all"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Solicitar Agendamento</span>
                </button>
                <Link
                  to="/clubes"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-bold transition-all"
                >
                  <span>Explorar Clubes e Destinos</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Differentials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
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

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
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

      {/* Objective & Additional Info (only when configured) */}
      {(settings.about_objective || settings.email_contact || settings.business_hours || settings.address_info) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
            {settings.about_objective && (
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">Nosso Propósito</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {settings.about_objective}
                  </p>
                </div>
              </div>
            )}

            {(settings.email_contact || settings.business_hours || settings.address_info) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
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
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-600" />
                      Localização
                    </span>
                    <p className="font-bold text-slate-900">{settings.address_info}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
