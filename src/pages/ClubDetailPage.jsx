import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  CalendarPlus,
  MessageCircle,
  Share2,
  ArrowLeft,
  Maximize2,
  CheckCircle2,
  Waves,
  Utensils,
  Sparkles,
  ShieldAlert,
  Info,
  Building2,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch, buildWhatsAppUrl, formatDateBR } from '../lib/api';
import ImageLightbox from '../components/ImageLightbox';
import TripCard from '../components/TripCard';

export default function ClubDetailPage() {
  const { slug } = useParams();
  const { siteData, openBookingModal, showToast } = useApp();
  const settings = siteData.settings || {};

  const [club, setClub] = useState(null);
  const [relatedTrips, setRelatedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Quick availability checker state
  const [checkDate, setCheckDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [checkPeople, setCheckPeople] = useState(2);
  const [availResult, setAvailResult] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiFetch(`/api/public/clubs/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!active) return;
        setClub(data.club);
        setRelatedTrips(data.relatedTrips || []);
        setActiveImageIdx(0);
        setSelectedCategory('Todas');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Clube não encontrado.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const handleQuickCheck = async () => {
    if (!club || !checkDate) return;
    try {
      setCheckingAvail(true);
      const res = await apiFetch(
        `/api/public/check-availability?itemType=club&itemId=${club.id}&desiredDate=${encodeURIComponent(checkDate)}&peopleCount=${encodeURIComponent(checkPeople)}`
      );
      setAvailResult(res);
    } catch (err) {
      showToast(err.message || 'Erro ao consultar disponibilidade.', 'error');
    } finally {
      setCheckingAvail(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${club?.name} — Celina Sousa Turismo`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Confira ${club?.name} na Celina Sousa Turismo!`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link do clube copiado para a área de transferência!', 'success');
    } catch {
      showToast('Copie o endereço da barra do navegador para compartilhar.', 'info');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-[440px] bg-slate-200 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900">
          {error || 'Clube não encontrado'}
        </h1>
        <p className="text-sm text-slate-600">
          O clube que você procura pode ter sido atualizado ou não está publicado no momento.
        </p>
        <Link
          to="/clubes"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Clubes e Destinos
        </Link>
      </div>
    );
  }

  const allImages =
    club.images && club.images.length > 0
      ? club.images
      : [
          {
            id: 0,
            image_url: club.cover_image || '/assets/images/waterpark-pools.jpg',
            caption: club.name,
            category: 'Principal',
          },
        ];

  const categories = [
    'Todas',
    ...Array.from(new Set(allImages.map((img) => img.category || 'Geral').filter(Boolean))),
  ];

  const filteredImages =
    selectedCategory === 'Todas'
      ? allImages
      : allImages.filter((img) => (img.category || 'Geral') === selectedCategory);

  const safeActiveIdx = activeImageIdx < filteredImages.length ? activeImageIdx : 0;
  const currentMainImage = filteredImages[safeActiveIdx] || filteredImages[0];

  const whatsappClubUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    `Olá Celina! Estou vendo a página do clube *${club.name}* (${club.city}/${club.state}) no site da Celina Sousa Turismo e gostaria de consultar informações e disponibilidade.`
  );

  const detailBlocks = [
    {
      title: 'Características do Clube',
      icon: Sparkles,
      content: club.characteristics,
    },
    {
      title: 'Estrutura Disponível',
      icon: Building2,
      content: club.structure_available,
    },
    {
      title: 'Piscinas e Parque Aquático',
      icon: Waves,
      content: club.pools_info,
    },
    {
      title: 'Áreas de Lazer',
      icon: CheckCircle2,
      content: club.leisure_areas,
    },
    {
      title: 'Restaurantes e Alimentação',
      icon: Utensils,
      content: club.restaurants_food,
    },
    {
      title: 'Serviços Disponíveis',
      icon: CheckCircle2,
      content: club.services_available,
    },
    {
      title: 'Diferenciais',
      icon: Sparkles,
      content: club.differentials,
    },
    {
      title: 'Informações para Visitantes',
      icon: Info,
      content: club.visitor_info,
    },
    {
      title: 'Regras de Utilização',
      icon: ShieldAlert,
      content: club.usage_rules,
    },
    {
      title: 'Observações Importantes',
      icon: AlertCircle,
      content: club.important_notes,
    },
  ].filter((block) => block.content && String(block.content).trim() !== '');

  return (
    <div className="pb-20 space-y-12">
      {/* Top Breadcrumb & Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/clubes"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-brand-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Clubes e Destinos
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
            >
              <Share2 className="w-4 h-4 text-brand-600" />
              Compartilhar clube
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  {club.city} — {club.state}
                </span>
                {club.address_location && (
                  <span className="text-xs text-slate-500 font-medium">
                    • {club.address_location}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
                {club.name}
              </h1>
              {club.short_description && (
                <p className="text-slate-600 text-sm sm:text-base max-w-3xl">
                  {club.short_description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  openBookingModal({
                    itemType: 'club',
                    itemId: club.id,
                    itemName: club.name,
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md transition-all"
              >
                <CalendarPlus className="w-4 h-4" />
                Solicitar agendamento
              </button>
              <a
                href={whatsappClubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: Gallery + Full Details */}
        <div className="lg:col-span-8 space-y-10">
          {/* GALERIA DE IMAGENS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Galeria de Fotos</h2>
                <p className="text-xs text-slate-500">
                  {filteredImages.length} foto(s) disponível(is) • Clique na imagem para ampliar
                </p>
              </div>
              {categories.length > 2 && (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActiveImageIdx(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedCategory === cat
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Photo */}
            <div className="relative h-72 sm:h-[420px] rounded-2xl overflow-hidden bg-slate-900 group">
              <img
                src={currentMainImage.image_url}
                alt={currentMainImage.caption || club.name}
                onClick={() => setLightboxIdx(safeActiveIdx)}
                className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {filteredImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx(
                        (safeActiveIdx - 1 + filteredImages.length) % filteredImages.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/75 hover:bg-brand-600 text-white shadow-lg transition-colors"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((safeActiveIdx + 1) % filteredImages.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/75 hover:bg-brand-600 text-white shadow-lg transition-colors"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setLightboxIdx(safeActiveIdx)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-sm transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Ampliar foto
              </button>

              {currentMainImage.caption && (
                <div className="absolute bottom-3 left-3 max-w-[65%] px-3 py-1.5 rounded-xl bg-slate-900/75 backdrop-blur-sm text-white text-xs font-medium truncate">
                  {currentMainImage.caption}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {filteredImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-1">
                {filteredImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative h-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === safeActiveIdx
                        ? 'border-brand-600 ring-2 ring-brand-300 scale-[1.02]'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.caption || `${club.name} foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DESCRIÇÃO COMPLETA */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Sobre {club.name}
            </h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {club.full_description ||
                club.short_description ||
                'Entre em contato com a Celina Sousa Turismo para mais informações detalhadas sobre este estabelecimento.'}
            </p>
            {club.summary_info && (
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Destaques Resumidos
                </span>
                <p className="text-sm font-semibold text-brand-800 bg-brand-50 border border-brand-100 rounded-2xl p-4">
                  {club.summary_info}
                </p>
              </div>
            )}
          </div>

          {/* ESTRUTURA, PISCINAS, LAZER, RESTAURANTES, SERVIÇOS E REGRAS */}
          {detailBlocks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {detailBlocks.map((block, index) => {
                const IconComponent = block.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{block.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {block.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Commercial Information + Availability Checker + Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Commercial Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-md space-y-5 sticky top-24">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Informações Comerciais
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {club.price_info || 'Valores sob consulta'}
              </h3>
              {club.payment_conditions && (
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>{club.payment_conditions}</span>
                </p>
              )}
            </div>

            {club.promotions && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider block text-amber-700">
                  Promoção / Condição Especial
                </span>
                <p className="font-medium">{club.promotions}</p>
              </div>
            )}

            {club.available_dates && (
              <div className="space-y-1 text-xs text-slate-700">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Datas Disponíveis / Funcionamento:
                </span>
                <p className="pl-5 text-slate-600 whitespace-pre-line">{club.available_dates}</p>
              </div>
            )}

            {club.related_packages && (
              <div className="space-y-1 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">Pacotes Relacionados:</span>
                <p className="text-slate-600 whitespace-pre-line">{club.related_packages}</p>
              </div>
            )}

            {club.additional_commercial_info && (
              <div className="space-y-1 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">Informações Adicionais:</span>
                <p className="text-slate-600 whitespace-pre-line">
                  {club.additional_commercial_info}
                </p>
              </div>
            )}

            {/* Quick Availability Consultation Widget */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Consultar Disponibilidade Rápida
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Data</label>
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => {
                      setCheckDate(e.target.value);
                      setAvailResult(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Pessoas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={checkPeople}
                    onChange={(e) => {
                      setCheckPeople(Math.max(1, parseInt(e.target.value || '1', 10)));
                      setAvailResult(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs font-medium bg-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickCheck}
                disabled={checkingAvail}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                {checkingAvail ? 'Verificando...' : 'Consultar disponibilidade'}
              </button>

              {availResult && (
                <div
                  className={`p-3 rounded-xl text-xs border leading-relaxed ${
                    !availResult.canRequest
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : availResult.hasConfirmedAvailability
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {formatDateBR(checkDate)} ({checkPeople} pessoa(s))
                  </p>
                  <p className="mt-1">{availResult.message}</p>
                </div>
              )}
            </div>

            {/* 4 Required Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  openBookingModal({
                    itemType: 'club',
                    itemId: club.id,
                    itemName: club.name,
                    defaultDate: checkDate,
                  })
                }
                className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <CalendarPlus className="w-4 h-4" />
                Solicitar agendamento
              </button>

              <a
                href={whatsappClubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Falar pelo WhatsApp
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4 text-brand-600" />
                Compartilhar clube
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED TRIPS / PACKAGES */}
      {relatedTrips.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Viagens e Pacotes Relacionados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {lightboxIdx !== null && (
        <ImageLightbox
          images={filteredImages}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={(idx) => setLightboxIdx(idx)}
        />
      )}
    </div>
  );
}
