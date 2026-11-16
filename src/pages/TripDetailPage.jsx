import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Bus,
  Hotel,
  CheckCircle2,
  XCircle,
  CreditCard,
  Info,
  CalendarPlus,
  MessageCircle,
  Share2,
  ArrowLeft,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch, buildWhatsAppUrl, formatDateBR } from '../lib/api';
import ImageLightbox from '../components/ImageLightbox';

const STATUS_STYLES = {
  Disponível: 'bg-emerald-500 text-white',
  'Poucas vagas': 'bg-amber-500 text-white',
  'Em breve': 'bg-brand-600 text-white',
  Esgotada: 'bg-rose-600 text-white',
  Encerrada: 'bg-slate-600 text-white',
};

export default function TripDetailPage() {
  const { slug } = useParams();
  const { siteData, openBookingModal, showToast } = useApp();
  const settings = siteData.settings || {};

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiFetch(`/api/public/trips/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!active) return;
        setTrip(data.trip);
        setActiveImageIdx(0);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Viagem não encontrada.');
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
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${trip?.name} — Celina Sousa Turismo`,
          text: `Confira a viagem ${trip?.name} (${trip?.destination}) na Celina Sousa Turismo!`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link da viagem copiado com sucesso!', 'success');
    } catch {
      showToast('Copie o link do navegador para compartilhar.', 'info');
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

  if (error || !trip) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900">
          {error || 'Viagem não encontrada'}
        </h1>
        <Link
          to="/viagens"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Viagens e Pacotes
        </Link>
      </div>
    );
  }

  const allImages =
    trip.images && trip.images.length > 0
      ? trip.images
      : [
          {
            id: 0,
            image_url: trip.cover_image || '/assets/images/travel-excursion.jpg',
            caption: trip.name,
            category: 'Principal',
          },
        ];

  const safeIdx = activeImageIdx < allImages.length ? activeImageIdx : 0;
  const currentMainImage = allImages[safeIdx] || allImages[0];
  const canBook = trip.status !== 'Esgotada' && trip.status !== 'Encerrada';

  const whatsappTripUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    `Olá Celina! Estou vendo a viagem *${trip.name}* (Destino: *${trip.destination}*) no site da Celina Sousa Turismo e gostaria de consultar informações e vagas.`
  );

  return (
    <div className="pb-20 space-y-12">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/viagens"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-brand-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Viagens e Pacotes
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
            >
              <Share2 className="w-4 h-4 text-brand-600" />
              Compartilhar viagem
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  Destino: {trip.destination}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    STATUS_STYLES[trip.status] || 'bg-brand-600 text-white'
                  }`}
                >
                  Status: {trip.status}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
                {trip.name}
              </h1>
              {trip.short_description && (
                <p className="text-slate-600 text-sm sm:text-base max-w-3xl">
                  {trip.short_description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {canBook && (
                <button
                  type="button"
                  onClick={() =>
                    openBookingModal({
                      itemType: 'trip',
                      itemId: trip.id,
                      itemName: trip.name,
                      defaultDate: trip.departure_date || '',
                    })
                  }
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md transition-all"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Solicitar reserva
                </button>
              )}
              <a
                href={whatsappTripUrl}
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
        {/* Left 8 cols */}
        <div className="lg:col-span-8 space-y-8">
          {/* Gallery */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
            <div className="relative h-72 sm:h-[420px] rounded-2xl overflow-hidden bg-slate-900 group">
              <img
                src={currentMainImage.image_url}
                alt={currentMainImage.caption || trip.name}
                onClick={() => setLightboxIdx(safeIdx)}
                className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((safeIdx - 1 + allImages.length) % allImages.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/75 hover:bg-brand-600 text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIdx((safeIdx + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/75 hover:bg-brand-600 text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setLightboxIdx(safeIdx)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 text-white text-xs font-bold backdrop-blur-sm"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Ampliar foto
              </button>
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === safeIdx
                        ? 'border-brand-600 ring-2 ring-brand-300'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.caption || `${trip.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Complete Description */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Descrição Completa do Roteiro
            </h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {trip.full_description ||
                trip.short_description ||
                'Consulte todos os detalhes deste roteiro diretamente com a Celina Sousa Turismo.'}
            </p>
          </div>

          {/* Included & Not Included */}
          {(trip.included_items || trip.not_included_items) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trip.included_items && (
                <div className="bg-emerald-50/60 rounded-3xl border border-emerald-200 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-extrabold">O que está incluso</h3>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {trip.included_items}
                  </p>
                </div>
              )}

              {trip.not_included_items && (
                <div className="bg-rose-50/60 rounded-3xl border border-rose-200 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <h3 className="text-base font-extrabold">O que não está incluso</h3>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {trip.not_included_items}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Transport, Lodging & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trip.transport_info && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900">
                  <Bus className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-extrabold">Informações sobre Transporte</h3>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {trip.transport_info}
                </p>
              </div>
            )}

            {trip.lodging_info && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900">
                  <Hotel className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-extrabold">Informações sobre Hospedagem</h3>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {trip.lodging_info}
                </p>
              </div>
            )}
          </div>

          {trip.notes && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-slate-900">
                <Info className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-extrabold">Observações Importantes</h3>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                {trip.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right 4 cols: Summary & Reservation Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-md space-y-5 sticky top-24">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Valor por Pessoa
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {trip.price_per_person || 'Valor sob consulta'}
              </h3>
              {trip.payment_methods && (
                <p className="text-xs text-slate-600 mt-1.5 flex items-start gap-1.5">
                  <CreditCard className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>{trip.payment_methods}</span>
                </p>
              )}
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              {trip.departure_date && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 text-brand-600" />
                    Data de Saída:
                  </span>
                  <strong className="text-slate-900">{formatDateBR(trip.departure_date)}</strong>
                </div>
              )}

              {trip.return_date && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 text-brand-600" />
                    Data de Retorno:
                  </span>
                  <strong className="text-slate-900">{formatDateBR(trip.return_date)}</strong>
                </div>
              )}

              {trip.departure_time && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4 text-brand-600" />
                    Horário de Saída:
                  </span>
                  <strong className="text-slate-900">{trip.departure_time}</strong>
                </div>
              )}

              {trip.boarding_location && (
                <div className="py-2 border-b border-slate-100 space-y-1">
                  <span className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    Local de Embarque:
                  </span>
                  <p className="font-bold text-slate-900 pl-6">{trip.boarding_location}</p>
                </div>
              )}

              {trip.available_spots !== null && trip.available_spots !== undefined && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4 text-brand-600" />
                    Vagas Disponíveis:
                  </span>
                  <strong className="text-brand-700">
                    {trip.available_spots}
                    {trip.total_spots ? ` de ${trip.total_spots}` : ''}
                  </strong>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              {canBook ? (
                <button
                  type="button"
                  onClick={() =>
                    openBookingModal({
                      itemType: 'trip',
                      itemId: trip.id,
                      itemName: trip.name,
                      defaultDate: trip.departure_date || '',
                    })
                  }
                  className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Solicitar reserva
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold text-center">
                  Reservas indisponíveis ({trip.status})
                </div>
              )}

              <a
                href={whatsappTripUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Consultar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {lightboxIdx !== null && (
        <ImageLightbox
          images={allImages}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={(idx) => setLightboxIdx(idx)}
        />
      )}
    </div>
  );
}
