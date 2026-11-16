import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, ArrowRight, CalendarPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateBR } from '../lib/api';

const STATUS_BADGE = {
  Disponível: 'bg-emerald-500 text-white',
  'Poucas vagas': 'bg-amber-500 text-white',
  'Em breve': 'bg-brand-600 text-white',
  Esgotada: 'bg-rose-600 text-white',
  Encerrada: 'bg-slate-600 text-white',
};

export default function TripCard({ trip }) {
  const { openBookingModal } = useApp();

  const coverUrl =
    trip.cover_image ||
    (trip.images && trip.images[0] && trip.images[0].image_url) ||
    '/assets/images/travel-excursion.jpg';

  const canBook = trip.status !== 'Esgotada' && trip.status !== 'Encerrada';

  return (
    <article className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Cover */}
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={coverUrl}
          alt={trip.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-bold shadow">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            {trip.destination}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shadow ${
              STATUS_BADGE[trip.status] || 'bg-brand-600 text-white'
            }`}
          >
            {trip.status}
          </span>
        </div>

        {trip.price_per_person && (
          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold border border-white/15">
            {trip.price_per_person}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-700 transition-colors">
            <Link to={`/viagens/${trip.slug}`}>{trip.name}</Link>
          </h3>

          {trip.short_description && (
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {trip.short_description}
            </p>
          )}

          <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 pt-1">
            {(trip.departure_date || trip.return_date) && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                <span>
                  {trip.departure_date ? `Saída: ${formatDateBR(trip.departure_date)}` : ''}
                  {trip.return_date ? ` • Retorno: ${formatDateBR(trip.return_date)}` : ''}
                </span>
              </div>
            )}
            {trip.available_spots !== null && trip.available_spots !== undefined && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600 shrink-0" />
                <span>
                  Vagas disponíveis: <strong>{trip.available_spots}</strong>
                  {trip.total_spots ? ` de ${trip.total_spots}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <Link
            to={`/viagens/${trip.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all"
          >
            <span>Ver detalhes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
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
              className="inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Solicitar reserva</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
