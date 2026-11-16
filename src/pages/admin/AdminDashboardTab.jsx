import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  MessageSquare,
  PlusCircle,
  Settings,
  Image as ImageIcon,
  ExternalLink,
  Smartphone,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrencyBR } from '../../lib/api';

export default function AdminDashboardTab({ dashboard, onNavigateTab }) {
  const { siteData } = useApp();
  const { clubs = [], gallery = [] } = siteData;

  if (!dashboard) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-3xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const { metrics } = dashboard;

  const cards = [
    {
      title: 'Clubes Publicados',
      value: clubs.length,
      subtitle: 'Com páginas "Saber mais de cada clube"',
      icon: Building2,
      color: 'bg-brand-50 text-brand-700 border-brand-200',
      onClick: () => onNavigateTab('clubes'),
    },
    {
      title: 'Fotos na Galeria Geral',
      value: gallery.length,
      subtitle: 'Imagens exibidas no site público',
      icon: ImageIcon,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      onClick: () => onNavigateTab('conteudo'),
    },
    {
      title: 'Clientes Cadastrados',
      value: metrics.totalCustomers,
      subtitle: 'Contas criadas na plataforma',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      onClick: () => onNavigateTab('clientes'),
    },
    {
      title: 'Mensagens de Contato',
      value: metrics.unreadMessages,
      subtitle: 'Dúvidas recebidas pelo site',
      icon: MessageSquare,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      onClick: () => onNavigateTab('mensagens'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Device Persistence Notice & Quick Actions */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-xs font-extrabold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" />
            Login ADM Salvo Neste Dispositivo
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Gestão de Clubes e Conteúdo do Site
          </h2>
          <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
            Adicione novos clubes, envie fotos de capa e galeria, edite descrições completas,
            piscinas, estrutura e regras. Tudo o que você salvar aqui atualiza imediatamente a área{' '}
            <strong>"Saber mais sobre este clube"</strong> para seus clientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('clubes')}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar / Editar Clubes</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('conteudo')}
            className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Editar Textos e Fotos</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={card.onClick}
              className="text-left bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {card.title}
                </p>
                <p className="text-3xl font-extrabold text-slate-900">{card.value ?? 0}</p>
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-2xl border ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Lista Rápida de Clubes Publicados ("Saber mais de cada clube") */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Clubes na Vitrine ("Saber mais de cada clube")
            </h3>
            <p className="text-xs text-slate-500">
              Visualize os clubes cadastrados ou clique em Gerenciar Clubes para adicionar fotos,
              piscinas e detalhes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('clubes')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow"
          >
            <Building2 className="w-4 h-4" />
            <span>Abrir Gerenciador de Clubes</span>
          </button>
        </div>

        {clubs.length === 0 ? (
          <div className="p-10 text-center space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1 max-w-md mx-auto">
              <p className="text-base font-bold text-slate-900">
                Nenhum clube cadastrado no momento
              </p>
              <p className="text-xs text-slate-500">
                Clique no botão abaixo para cadastrar seus clubes, parques aquáticos e hospedagens
                com fotos e informações completas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('clubes')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Primeiro Clube Agora</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clubs.map((club) => {
              const locationLabel = [club.city, club.state].filter(Boolean).join(' - ');
              const priceLabel = formatCurrencyBR(club.day_use_price);
              return (
                <div
                  key={club.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={club.cover_image || '/assets/images/waterpark-family.jpg'}
                      alt={club.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{club.name}</h4>
                      {locationLabel && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-600" />
                          {locationLabel}
                        </p>
                      )}
                      {priceLabel && (
                        <p className="text-xs font-bold text-brand-700 mt-0.5">
                          Valor: {priceLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/clubes/${club.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Página do Clube</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('clubes')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                    >
                      <span>Editar no ADM</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
