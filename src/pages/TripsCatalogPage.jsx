import React, { useState, useMemo } from 'react';
import {
  Search,
  Compass,
  CalendarPlus,
  MessageCircle,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl } from '../lib/api';
import TripCard from '../components/TripCard';

export default function TripsCatalogPage() {
  const { siteData, loadingSite, openBookingModal } = useApp();
  const { trips = [], settings = {} } = siteData;

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const statusOptions = [
    'Todos',
    'Disponível',
    'Poucas vagas',
    'Em breve',
    'Esgotada',
    'Encerrada',
  ];

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (selectedStatus !== 'Todos' && t.status !== selectedStatus) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(t.name || '').toLowerCase().includes(q) ||
        String(t.destination || '').toLowerCase().includes(q) ||
        String(t.short_description || '').toLowerCase().includes(q)
      );
    });
  }, [trips, search, selectedStatus]);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    'Olá Celina! Gostaria de consultar informações sobre as próximas viagens e excursões disponíveis.'
  );

  return (
    <div className="pb-20 space-y-12">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white py-14 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
              Excursões e Roteiros
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Viagens e Pacotes
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Confira os pacotes e viagens organizados pela Celina Sousa Turismo. Acesse cada
              roteiro para ver datas, embarque, transporte, hospedagem e solicitar sua reserva.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 flex flex-col md:flex-row items-stretch md:items-center gap-3 max-w-4xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome da viagem ou destino..."
                className="w-full rounded-xl bg-white/95 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-400 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-300 hidden sm:block" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl bg-white/95 text-slate-900 px-4 py-3 text-sm font-bold outline-none"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st === 'Todos' ? 'Todos os status' : `Status: ${st}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loadingSite ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-3xl bg-slate-200/70 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center space-y-5 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {trips.length === 0
                  ? 'Programação de Viagens sob Consulta'
                  : 'Nenhuma viagem encontrada para este filtro'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {trips.length === 0
                  ? 'A Celina atualiza os pacotes e excursões diretamente pelo Painel Administrativo. Solicite informações sobre próximas saídas ou excursões abaixo.'
                  : 'Altere os filtros de busca ou fale com a Celina pelo WhatsApp para consultar novos roteiros.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {(search || selectedStatus !== 'Todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedStatus('Todos');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
                >
                  Limpar Filtros
                </button>
              )}
              <button
                type="button"
                onClick={() => openBookingModal({ itemType: 'trip' })}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow"
              >
                <CalendarPlus className="w-4 h-4" />
                Solicitar Reserva / Consulta
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow"
              >
                <MessageCircle className="w-4 h-4" />
                Falar pelo WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
              <span>
                Exibindo <strong>{filteredTrips.length}</strong> viagem(ns) / pacote(s)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
