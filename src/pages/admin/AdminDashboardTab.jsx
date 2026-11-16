import React from 'react';
import {
  Users,
  Building2,
  Compass,
  Clock,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Calendar,
  TrendingUp,
  PlusCircle,
} from 'lucide-react';
import { formatDateBR, formatDateTimeBR } from '../../lib/api';

const STATUS_COLORS = {
  'Aguardando análise': 'bg-amber-100 text-amber-800 border-amber-300',
  Aprovado: 'bg-sky-100 text-sky-800 border-sky-300',
  'Aguardando pagamento': 'bg-purple-100 text-purple-800 border-purple-300',
  Confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Recusado: 'bg-rose-100 text-rose-800 border-rose-300',
  Cancelado: 'bg-slate-200 text-slate-700 border-slate-300',
  Concluído: 'bg-brand-100 text-brand-800 border-brand-300',
};

const BAR_COLORS = {
  'Aguardando análise': 'bg-amber-500',
  Aprovado: 'bg-sky-500',
  'Aguardando pagamento': 'bg-purple-500',
  Confirmado: 'bg-emerald-500',
  Recusado: 'bg-rose-500',
  Cancelado: 'bg-slate-400',
  Concluído: 'bg-brand-600',
};

export default function AdminDashboardTab({ dashboard, onNavigateTab }) {
  const metrics = dashboard?.metrics || {
    totalCustomers: 0,
    totalClubs: 0,
    publishedClubs: 0,
    totalTrips: 0,
    publishedTrips: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalBookings: 0,
    unreadMessages: 0,
  };

  const bookingsByStatus = dashboard?.bookingsByStatus || [];
  const upcomingTrips = dashboard?.upcomingTrips || [];
  const recentBookings = dashboard?.recentBookings || [];

  const totalStatusCount = Math.max(
    1,
    bookingsByStatus.reduce((acc, s) => acc + Number(s.count || 0), 0)
  );

  const cards = [
    {
      label: 'Total de Clientes Cadastrados',
      value: metrics.totalCustomers,
      sub: 'Contas de clientes ativas',
      icon: Users,
      color: 'from-brand-500 to-brand-700',
      tab: 'clientes',
    },
    {
      label: 'Total de Clubes Cadastrados',
      value: metrics.totalClubs,
      sub: `${metrics.publishedClubs} publicado(s) no site`,
      icon: Building2,
      color: 'from-cyan-500 to-teal-700',
      tab: 'clubes',
    },
    {
      label: 'Total de Viagens Cadastradas',
      value: metrics.totalTrips,
      sub: `${metrics.publishedTrips} publicada(s) no site`,
      icon: Compass,
      color: 'from-indigo-500 to-indigo-700',
      tab: 'viagens',
    },
    {
      label: 'Solicitações Pendentes',
      value: metrics.pendingBookings,
      sub: 'Aguardando sua análise',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      tab: 'agendamentos',
    },
    {
      label: 'Reservas Confirmadas',
      value: metrics.confirmedBookings,
      sub: 'Agendamentos confirmados',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-700',
      tab: 'agendamentos',
    },
    {
      label: 'Mensagens Novas',
      value: metrics.unreadMessages,
      sub: 'Formulário de contato',
      icon: MessageSquare,
      color: 'from-slate-700 to-slate-900',
      tab: 'mensagens',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
            Visão Geral do Sistema
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Painel de Controle — Celina Sousa Turismo
          </h2>
          <p className="text-xs sm:text-sm text-brand-100">
            Todas as alterações feitas aqui atualizam o site público automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('clubes')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 hover:bg-brand-300 text-slate-950 text-xs sm:text-sm font-extrabold shadow"
          >
            <PlusCircle className="w-4 h-4" />
            Gerenciar Clubes
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('viagens')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold border border-white/20"
          >
            <PlusCircle className="w-4 h-4" />
            Gerenciar Viagens
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('agendamentos')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold border border-white/20"
          >
            Ver Solicitações ({metrics.pendingBookings})
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(c.tab)}
              className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {c.label}
                </span>
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">{c.value}</p>
                <p className="text-xs text-slate-500 group-hover:text-brand-700 transition-colors">
                  {c.sub} →
                </p>
              </div>
              <div
                className={`p-3.5 rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-md`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Upcoming Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Status Chart */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Indicadores de Solicitações
                </h3>
                <p className="text-xs text-slate-500">Distribuição por status</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total: {metrics.totalBookings}
            </span>
          </div>

          {bookingsByStatus.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
              Os gráficos de distribuição serão preenchidos conforme os clientes enviarem
              solicitações de agendamento.
            </div>
          ) : (
            <div className="space-y-3.5">
              {bookingsByStatus.map((item) => {
                const pct = Math.round((Number(item.count) / totalStatusCount) * 100);
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{item.status}</span>
                      <span className="text-slate-900">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          BAR_COLORS[item.status] || 'bg-brand-600'
                        }`}
                        style={{ width: `${Math.max(6, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Trips */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Próximas Viagens</h3>
              <p className="text-xs text-slate-500">Viagens e excursões cadastradas</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('viagens')}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
            >
              <span>Gerenciar viagens</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingTrips.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-500">Nenhuma viagem cadastrada ainda.</p>
              <button
                type="button"
                onClick={() => onNavigateTab('viagens')}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
              >
                Cadastrar Primeira Viagem
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingTrips.map((t) => (
                <div
                  key={t.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{t.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Destino: {t.destination}</span>
                      {t.departure_date && (
                        <span>• Saída: {formatDateBR(t.departure_date)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    {t.available_spots !== null && t.available_spots !== undefined
                      ? `${t.available_spots} vaga(s)`
                      : t.price_per_person || ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Agendamentos Recentes</h3>
            <p className="text-xs text-slate-500">
              Últimas solicitações recebidas dos clientes
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('agendamentos')}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
          >
            <span>Ver todos os agendamentos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center text-sm text-slate-500">
            Nenhuma solicitação de agendamento registrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                  <th className="py-3 pr-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Clube / Viagem</th>
                  <th className="py-3 px-4">Data Solicitada</th>
                  <th className="py-3 px-4">Pessoas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3.5 pr-4 font-mono font-bold text-brand-700">
                      {b.booking_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{b.customer_name}</p>
                      <p className="text-xs text-slate-500">{b.customer_phone}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{b.item_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        {formatDateBR(b.desired_date)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {b.people_count}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('agendamentos')}
                        className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold"
                      >
                        Analisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
