import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  CalendarPlus,
  MessageCircle,
  Instagram,
  Sparkles,
  ArrowRight,
  Building2,
  Compass,
  ShieldCheck,
  Star,
  HelpCircle,
  ChevronDown,
  Image as ImageIcon,
  PhoneCall,
  Maximize2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl } from '../lib/api';
import ClubCard from '../components/ClubCard';
import TripCard from '../components/TripCard';
import ImageLightbox from '../components/ImageLightbox';

export default function HomePage() {
  const { siteData, loadingSite, openBookingModal } = useApp();
  const { settings, clubs, trips, testimonials, faqs, gallery } = siteData;

  const [selectedGalleryCat, setSelectedGalleryCat] = useState('Todas');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [openFaqId, setOpenFaqId] = useState(null);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    'Olá Celina! Vim pelo site da Celina Sousa Turismo e gostaria de solicitar informações sobre clubes, locações e viagens.'
  );

  const galleryCategories = [
    'Todas',
    ...Array.from(new Set((gallery || []).map((g) => g.category).filter(Boolean))),
  ];

  const filteredGallery =
    selectedGalleryCat === 'Todas'
      ? gallery
      : gallery.filter((g) => g.category === selectedGalleryCat);

  const clubsWithPromos = (clubs || []).filter((c) => c.promotions && String(c.promotions).trim() !== '');
  const hasPromoBanner =
    settings.promotions_active === '1' &&
    (settings.promotions_banner_title || settings.promotions_banner_text);

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO BANNER PRINCIPAL */}
      <section className="relative min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden bg-slate-900">
        <img
          src={settings.hero_banner_url || '/assets/images/hero-resort.jpg'}
          alt={settings.company_name || 'Celina Sousa Turismo'}
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/40 backdrop-blur-md text-brand-200 text-xs sm:text-sm font-bold">
              <Plane className="w-4 h-4 text-brand-300" />
              <span>{settings.hero_badge || 'Celina Sousa Turismo • Caldas Locações'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              {settings.hero_title ||
                'Clubes, Locações, Destinos e Viagens com Atendimento Personalizado'}
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              {settings.hero_subtitle ||
                'Conheça opções de lazer, clubes, hospedagens e viagens selecionadas por Celina Sousa Turismo. Solicite informações ou seu agendamento online com praticidade e segurança.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => openBookingModal()}
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl transition-all hover:-translate-y-0.5"
              >
                <CalendarPlus className="w-5 h-5" />
                <span>Solicitar Agendamento</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-xl transition-all hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Atendimento no WhatsApp</span>
              </a>

              <Link
                to="/clubes"
                className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm sm:text-base border border-white/20 transition-all"
              >
                <span>Ver Clubes e Destinos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl text-xs text-slate-200">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-brand-300 shrink-0" />
                <span>Atendimento direto e transparente</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <Building2 className="w-5 h-5 text-brand-300 shrink-0" />
                <span>Clubes, Parques e Caldas Locações</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <Compass className="w-5 h-5 text-brand-300 shrink-0" />
                <span>Acompanhamento online da reserva</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. APRESENTAÇÃO DA CELINA SOUSA TURISMO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 rounded-2xl p-6 border border-brand-100 shadow-inner">
            <img
              src={settings.logo_url || '/assets/images/logo-original.jpeg'}
              alt={settings.company_name || 'Celina Sousa Turismo'}
              className="max-h-56 w-auto object-contain rounded-xl"
            />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                {settings.phone_display || '(64) 9 9206-5866'}
              </a>
              <a
                href={settings.instagram_url || 'https://www.instagram.com/celinasousaturismo/'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-bold hover:bg-brand-100 transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-brand-600" />
                {settings.instagram_handle || '@celinasousaturismo'}
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
              Apresentação Institucional
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
              {settings.presentation_title || 'Bem-vindo à Celina Sousa Turismo'}
            </h2>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg whitespace-pre-line">
              {settings.presentation_text ||
                'A Celina Sousa Turismo — Caldas Locações atua na divulgação e intermediação de locações, clubes, parques aquáticos, hotéis, destinos turísticos e viagens. Nosso objetivo é oferecer um atendimento transparente, organizado e direto para que você e sua família planejem seus momentos de lazer com tranquilidade.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/sobre"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all"
              >
                <span>Conhecer Mais Sobre a Empresa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contato"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-800 text-sm font-bold transition-all"
              >
                <span>Solicitar Informações</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OFERTAS E PROMOÇÕES (QUANDO CADASTRADAS) */}
      {(hasPromoBanner || clubsWithPromos.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white p-8 sm:p-10 shadow-xl border border-brand-700/50 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ofertas e Condições Especiais
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  {settings.promotions_banner_title || 'Promoções e Destaques Cadastrados'}
                </h2>
                {settings.promotions_banner_text && (
                  <p className="text-brand-100 text-sm sm:text-base max-w-2xl">
                    {settings.promotions_banner_text}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => openBookingModal()}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow transition-all"
              >
                <CalendarPlus className="w-4 h-4" />
                Consultar Promoção
              </button>
            </div>

            {clubsWithPromos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {clubsWithPromos.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-bold text-white">{c.name}</h3>
                      <p className="text-xs text-brand-200 mt-0.5">{c.promotions}</p>
                    </div>
                    <Link
                      to={`/clubes/${c.slug}`}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-brand-50"
                    >
                      Ver Clube
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. CATÁLOGO DE CLUBES E DESTINOS EM DESTAQUE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
              Catálogo Principal
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">
              Clubes e Destinos
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Conheça clubes, parques aquáticos, hotéis e destinos com fotos e detalhes completos.
            </p>
          </div>
          <Link
            to="/clubes"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800"
          >
            <span>Ver catálogo completo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingSite ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-3xl bg-slate-200/70 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="max-w-lg mx-auto space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                Catálogo de Clubes e Destinos em Atualização
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Os clubes e opções de lazer estão sendo organizados pela Celina Sousa Turismo. Você já
                pode solicitar atendimento personalizado ou agendamento diretamente abaixo!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => openBookingModal({ itemType: 'destination' })}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow"
              >
                <CalendarPlus className="w-4 h-4" />
                Solicitar Consulta / Agendamento
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow"
              >
                <MessageCircle className="w-4 h-4" />
                Consultar Clubes pelo WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {clubs.slice(0, 6).map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </section>

      {/* 5. VIAGENS E PACOTES DISPONÍVEIS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
              Roteiros e Excursões
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">
              Viagens e Pacotes Disponíveis
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Excursões e pacotes organizados com acompanhamento completo da Celina Sousa Turismo.
            </p>
          </div>
          <Link
            to="/viagens"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800"
          >
            <span>Ver todas as viagens</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingSite ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-3xl bg-slate-200/70 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Compass className="w-7 h-7" />
            </div>
            <div className="max-w-lg mx-auto space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                Novos Roteiros e Viagens sob Consulta
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Consulte a programação de próximas excursões e viagens diretamente com a Celina Sousa
                Turismo ou solicite informações para seu grupo.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => openBookingModal({ itemType: 'trip' })}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow"
              >
                <CalendarPlus className="w-4 h-4" />
                Solicitar Informações de Viagem
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {trips.slice(0, 6).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      {/* 6. GALERIA DE IMAGENS */}
      {gallery && gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
                <ImageIcon className="w-3.5 h-3.5" />
                Lazer e Experiências
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">
                Galeria de Imagens
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1">
                Clique em qualquer foto para visualizar em tamanho ampliado.
              </p>
            </div>

            {galleryCategories.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {galleryCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedGalleryCat(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedGalleryCat === cat
                        ? 'bg-brand-600 text-white shadow'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGallery.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setLightboxIndex(idx)}
                className="group relative h-64 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-sm hover:shadow-xl transition-all"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300">
                    {item.category}
                  </span>
                  <h3 className="text-base font-bold mt-0.5">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lightboxIndex !== null && (
            <ImageLightbox
              images={filteredGallery}
              currentIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNavigate={(nextIdx) => setLightboxIndex(nextIdx)}
            />
          )}
        </section>
      )}

      {/* 7. DEPOIMENTOS DE CLIENTES (QUANDO CADASTRADOS) */}
      {testimonials && testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
              Avaliações Reais
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">
              Depoimentos de Clientes
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Veja a experiência de quem agendou clubes, locações e viagens com a Celina Sousa Turismo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.rating || 5 }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed">"{t.content}"</p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{t.customer_name}</p>
                  <p className="text-xs text-slate-500">
                    {[t.city_state, t.item_visited].filter(Boolean).join(' • ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. PERGUNTAS FREQUENTES EM DESTAQUE */}
      {faqs && faqs.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
                <HelpCircle className="w-3.5 h-3.5" />
                Tire suas dúvidas
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Perguntas Frequentes
              </h2>
            </div>
            <Link
              to="/perguntas-frequentes"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              <span>Ver todas as perguntas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {faqs.slice(0, 4).map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-brand-600 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 9. BANNER FINAL DE CONTATO E SOLICITAÇÃO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-12 lg:p-14 shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
              Atendimento Personalizado
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
              Pronto para planejar seu próximo momento de lazer?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Solicite seu agendamento pela plataforma ou fale diretamente com a Celina Sousa Turismo
              pelo WhatsApp {settings.phone_display || '(64) 9 9206-5866'} e siga nosso Instagram{' '}
              {settings.instagram_handle || '@celinasousaturismo'}.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <CalendarPlus className="w-5 h-5" />
              Solicitar Agendamento Online
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Falar pelo WhatsApp ({settings.phone_display || '(64) 9 9206-5866'})
            </a>
            <Link
              to="/contato"
              className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/15 transition-all"
            >
              <span>Enviar Mensagem / Solicitar Informações</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
