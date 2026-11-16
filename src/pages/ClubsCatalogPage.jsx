import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Building2,
  Filter,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ClubCard from '../components/ClubCard';

export default function ClubsCatalogPage() {
  const { siteData, loadingSite, user } = useApp();
  const { clubs = [] } = siteData;

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todas');

  const cities = useMemo(() => {
    const list = Array.from(
      new Set(clubs.map((c) => `${c.city}/${c.state}`).filter(Boolean))
    );
    return ['Todas', ...list];
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      const cityKey = `${c.city}/${c.state}`;
      if (selectedCity !== 'Todas' && cityKey !== selectedCity) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.city || '').toLowerCase().includes(q) ||
        String(c.short_description || '').toLowerCase().includes(q) ||
        String(c.summary_info || '').toLowerCase().includes(q)
      );
    });
  }, [clubs, search, selectedCity]);

  return (
    <div className="pb-20 space-y-12">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white py-12 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
                Catálogo Celina Sousa Turismo
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Clubes, Parques e Destinos
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Conheça todos os clubes e opções de lazer divulgados pela Celina Sousa Turismo —
                Caldas Locações. Clique em qualquer clube para saber mais detalhes, ver fotos da
                estrutura, piscinas e informações completas.
              </p>
            </div>

            {user?.role === 'admin' && (
              <Link
                to="/painel-celina?tab=clubes"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Gerenciar / Adicionar Clubes (ADM)</span>
              </Link>
            )}
          </div>

          {/* Search & City Filter */}
          <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 flex flex-col md:flex-row items-stretch md:items-center gap-3 max-w-4xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome do clube, cidade ou característica..."
                className="w-full rounded-xl bg-white/95 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-400 outline-none"
              />
            </div>

            {cities.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-300 hidden sm:block" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="rounded-xl bg-white/95 text-slate-900 px-4 py-3 text-sm font-bold outline-none"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city === 'Todas' ? 'Todas as localidades' : city}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
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
        ) : filteredClubs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center space-y-5 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {clubs.length === 0
                  ? 'Área de Clubes e Destinos'
                  : 'Nenhum clube encontrado para esta busca'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {clubs.length === 0
                  ? 'Os clubes, fotos e informações detalhadas são adicionados e atualizados pela administração da Celina Sousa Turismo.'
                  : 'Tente limpar o filtro de busca para visualizar todos os clubes disponíveis.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {(search || selectedCity !== 'Todas') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedCity('Todas');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
                >
                  Limpar Filtros
                </button>
              )}
              {user?.role === 'admin' ? (
                <Link
                  to="/painel-celina?tab=clubes"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cadastrar Clube no Painel ADM</span>
                </Link>
              ) : (
                <Link
                  to="/contato"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow"
                >
                  <span>Entrar em Contato para Informações</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
              <span>
                Exibindo <strong>{filteredClubs.length}</strong> clube(s) disponível(is) para
                consulta
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredClubs.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
