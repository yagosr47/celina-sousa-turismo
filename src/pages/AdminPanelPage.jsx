import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Compass,
  CalendarCheck2,
  Users,
  Settings,
  MessageSquare,
  Bell,
  ExternalLink,
  LogOut,
  ShieldAlert,
  Menu,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch, formatDateTimeBR } from '../lib/api';
import BrandLogo from '../components/BrandLogo';
import AdminFirstAccessModal from './admin/AdminFirstAccessModal';
import AdminDashboardTab from './admin/AdminDashboardTab';
import AdminClubsTab from './admin/AdminClubsTab';
import AdminTripsTab from './admin/AdminTripsTab';
import AdminBookingsTab from './admin/AdminBookingsTab';
import AdminCustomersTab from './admin/AdminCustomersTab';
import AdminContentTab from './admin/AdminContentTab';
import AdminAccountMessagesTab from './admin/AdminAccountMessagesTab';

export default function AdminPanelPage() {
  const {
    user,
    authLoading,
    logout,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);

  const loadDashboard = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const data = await apiFetch('/api/admin/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Erro ao carregar resumo admin:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      loadDashboard();
    }
  }, [authLoading, user, loadDashboard]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setMobileNavOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="text-sm font-bold text-slate-600 animate-pulse">
          Carregando Painel Administrativo da Celina...
        </div>
      </div>
    );
  }

  // Security check: If not logged in, redirect to admin login
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-100">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-brand-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Acesso Restrito à Administração
          </h1>
          <p className="text-sm text-slate-600">
            Faça login com sua conta administrativa da Celina Sousa Turismo para acessar este painel.
          </p>
          <Link
            to="/entrar?modo=admin"
            className="inline-flex items-center justify-center w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold"
          >
            Ir para Login Administrativo
          </Link>
        </div>
      </div>
    );
  }

  // Security check: Customer accounts are strictly blocked from accessing Admin Panel
  if (user.role !== 'admin') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-100">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Acesso Negado — Área Exclusiva
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sua conta é de cliente e não possui permissão para acessar o Painel Administrativo da
            Celina Sousa Turismo.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/minha-conta"
              className="w-full py-3 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold"
            >
              Ir para Minha Área de Cliente
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 px-5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
            >
              Voltar ao Site Público
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {};

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    {
      id: 'agendamentos',
      label: 'Agendamentos',
      icon: CalendarCheck2,
      badge: metrics.pendingBookings || null,
    },
    { id: 'clubes', label: 'Gerenciar Clubes', icon: Building2 },
    { id: 'viagens', label: 'Gerenciar Viagens', icon: Compass },
    { id: 'clientes', label: 'Gerenciar Clientes', icon: Users },
    { id: 'conteudo', label: 'Conteúdo do Site', icon: Settings },
    {
      id: 'mensagens',
      label: 'Mensagens & Conta',
      icon: MessageSquare,
      badge: metrics.unreadMessages || null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* First-Access Mandatory Password Exchange Modal */}
      <AdminFirstAccessModal />

      {/* Dedicated Admin Header */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
              aria-label="Menu do painel"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <BrandLogo variant="dark" size="sm" />
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-extrabold uppercase tracking-wider">
              Painel da Celina
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">Ver Site Público</span>
              <span className="sm:hidden">Site</span>
            </Link>

            <button
              type="button"
              onClick={() => setNotifDrawerOpen((p) => !p)}
              className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              aria-label="Notificações da Celina"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Desktop Tab Bar */}
        <div className="hidden lg:block bg-slate-900 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-brand-500 text-slate-950 font-extrabold shadow'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-slate-950 text-brand-300' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 grid grid-cols-1 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center justify-between ${
                    isActive
                      ? 'bg-brand-500 text-slate-950 font-extrabold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Notification Slide-down Panel */}
      {notifDrawerOpen && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Notificações Administrativas ({unreadCount} não lida(s))
              </h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs font-bold text-brand-700 hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotifDrawerOpen(false)}
                  className="text-xs font-bold text-slate-500"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Nenhuma notificação registrada.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markNotificationRead(n.id)}
                    className={`py-2.5 px-3 rounded-xl cursor-pointer ${
                      !n.is_read ? 'bg-brand-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-slate-900">{n.title}</strong>
                      <span className="text-slate-400">{formatDateTimeBR(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <AdminDashboardTab
            dashboard={dashboardData}
            onNavigateTab={(t) => handleSelectTab(t)}
          />
        )}
        {activeTab === 'agendamentos' && (
          <AdminBookingsTab onDataChanged={loadDashboard} />
        )}
        {activeTab === 'clubes' && (
          <AdminClubsTab onDataChanged={loadDashboard} />
        )}
        {activeTab === 'viagens' && (
          <AdminTripsTab onDataChanged={loadDashboard} />
        )}
        {activeTab === 'clientes' && (
          <AdminCustomersTab onDataChanged={loadDashboard} />
        )}
        {activeTab === 'conteudo' && <AdminContentTab />}
        {activeTab === 'mensagens' && (
          <AdminAccountMessagesTab onDataChanged={loadDashboard} />
        )}
      </main>
    </div>
  );
}
