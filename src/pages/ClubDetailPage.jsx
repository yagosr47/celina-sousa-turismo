import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
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
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import ImageLightbox from '../components/ImageLightbox';

export default function ClubDetailPage() {
  const { slug } = useParams();
  const { user, showToast } = useApp();

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiFetch(`/api/public/clubs/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!active) return;
        setClub(data.club);
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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${club?.name} — Celina Sousa Turismo`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Confira todos os detalhes de ${club?.name} na Celina Sousa Turismo!`,
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
    <div className="pb-20 space-y-10 sm:space-y-12">
      {/* Top Breadcrumb & Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/clubes"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-brand-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Todos os Clubes
            </Link>

            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Link
                  to="/painel-celina?tab=clubes"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  <span>Editar no Painel ADM</span>
                </Link>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                <Share2 className="w-4 h-4 text-brand-600" />
                Compartilhar clube
              </button>
            </div>
          </div>

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
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: Gallery + Full Details */}
        <div className="lg:col-span-8 space-y-10">
          {/* GALERIA DE IMAGENS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Galeria de Fotos do Clube</h2>
                <p className="text-xs text-slate-500">
                  {filteredImages.length} foto(s) • Clique na imagem para ampliar em tela cheia
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
              Saber Mais Sobre {club.name}
            </h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {club.full_description ||
                club.short_description ||
                'Confira abaixo todas as informações detalhadas cadastradas sobre este clube.'}
            </p>
            {club.summary_info && (
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Principais Atrações e Destaques
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

        {/* RIGHT COLUMN: Ficha de Informações do Clube */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-md space-y-5 sticky top-24">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Ficha Informativa do Clube
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {club.price_info || 'Informações sob consulta'}
              </h3>
              {club.payment_conditions && (
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>{club.payment_conditions}</span>
                </p>
              )}
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Localidade</span>
                  <span className="text-slate-600">
                    {club.city} - {club.state}
                    {club.address_location ? ` (${club.address_location})` : ''}
                  </span>
                </div>
              </div>

              {club.available_dates && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Funcionamento / Períodos
                    </span>
                    <span className="text-slate-600 whitespace-pre-line">
                      {club.available_dates}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {club.promotions && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider block text-amber-700">
                  Condição Especial / Destaque
                </span>
                <p className="font-medium">{club.promotions}</p>
              </div>
            )}

            {club.related_packages && (
              <div className="space-y-1 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">Opções Relacionadas:</span>
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

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <Link
                to="/contato"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-blue-700 hover:from-brand-500 hover:to-blue-600 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Info className="w-4 h-4" />
                <span>Tirar Dúvidas Sobre Este Clube</span>
              </Link>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4 text-brand-600" />
                Compartilhar informações do clube
              </button>
            </div>
          </div>
        </div>
      </div>

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
