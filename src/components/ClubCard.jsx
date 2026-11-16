import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Sparkles, CheckCircle2, Info } from 'lucide-react';

export default function ClubCard({ club }) {
  const coverUrl =
    club.cover_image ||
    (club.images && club.images[0] && club.images[0].image_url) ||
    '/assets/images/waterpark-pools.jpg';

  const summaryItems = club.summary_info
    ? String(club.summary_info)
        .split(/[•\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return (
    <article className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Cover Image */}
      <Link to={`/clubes/${club.slug}`} className="relative h-56 overflow-hidden bg-slate-100 block">
        <img
          src={coverUrl}
          alt={club.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-bold shadow">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            {club.city} - {club.state}
          </span>
          {club.is_featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-600 text-white text-xs font-bold shadow">
              <Sparkles className="w-3 h-3" />
              Destaque
            </span>
          )}
        </div>

        {club.price_info && (
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold border border-white/15">
            {club.price_info}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-700 transition-colors">
            <Link to={`/clubes/${club.slug}`}>{club.name}</Link>
          </h3>

          {club.short_description && (
            <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
              {club.short_description}
            </p>
          )}

          {summaryItems.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {summaryItems.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 text-xs font-semibold border border-brand-100"
                >
                  <CheckCircle2 className="w-3 h-3 text-brand-600 shrink-0" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100">
          <Link
            to={`/clubes/${club.slug}`}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-blue-700 hover:from-brand-500 hover:to-blue-600 text-white text-sm font-extrabold shadow-sm transition-all"
          >
            <Info className="w-4 h-4" />
            <span>Saber mais sobre este clube</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
