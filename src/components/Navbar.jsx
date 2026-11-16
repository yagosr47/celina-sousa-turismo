import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  Bell,
  CalendarPlus,
  LogOut,
  CheckCheck,
  ChevronDown,
  PhoneCall,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl, formatDateTimeBR } from '../lib/api';

export default function Navbar() {
  const {
    user,
    logout,
    siteData,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    openBookingModal,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const authRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    setAuthMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (authRef.current && !authRef.current.contains(e.target)) {
        setAuthMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const settings = siteData.settings || {};
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    'Olá Celina! Vim pelo site da Celina Sousa Turismo e gostaria de informações.'
  );

  const navLinks = [
    { to: '/', label: 'Início', end: true },
    { to: '/clubes', label: 'Clubes e Destinos' },
    { to: '/viagens', label: 'Viagens e Pacotes' },
    { to: '/sobre', label: 'Sobre a Empresa' },
    { to: '/perguntas-frequentes', label: 'Perguntas Frequentes' },
    { to: '/contato', label: 'Contato' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      {/* Top Info Strip */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-brand-200">
              {settings.company_name || 'Celina Sousa Turismo'} • {settings.company_subtitle || 'Caldas Locações'}
            </span>
            <span className="hidden sm:inline text-white/40">|</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 hover:text-brand-200 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-brand-300" />
              WhatsApp: {settings.phone_display || '(64) 9 9206-5866'}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={settings.instagram_url || 'https://www.instagram.com/celinasousaturismo/'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-200 transition-colors font-medium"
            >
              Instagram: {settings.instagram_handle || '@celinasousaturismo'}
            </a>
            <span className="text-white/30">|</span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-brand-200 hover:text-white font-bold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-300" />
              <span>Portal ADM (Celina)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0" aria-label="Página inicial Celina Sousa Turismo">
          <BrandLogo size="md" />
        </Link>

        {/* Desktop Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200'
                    : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => openBookingModal()}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Agendar</span>
          </button>

          {/* Notification Bell when logged in */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shadow">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Notificações</h3>
                      <p className="text-xs text-slate-500">
                        {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo em dia'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        Nenhuma notificação no momento.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.is_read) markNotificationRead(n.id);
                            if (n.link) navigate(n.link);
                            setNotifOpen(false);
                          }}
                          className={`p-3.5 cursor-pointer transition-colors hover:bg-slate-50 ${
                            !n.is_read ? 'bg-brand-50/50' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800">{n.title}</span>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          <span className="block text-[11px] text-slate-400 mt-1.5">
                            {formatDateTimeBR(n.created_at)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Entrar / Account Menu */}
          {!user ? (
            <div className="relative" ref={authRef}>
              <button
                type="button"
                onClick={() => setAuthMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-800 text-sm font-bold transition-all shadow-sm"
              >
                <User className="w-4 h-4 text-brand-700" />
                <span>Entrar</span>
                <ChevronDown className="w-4 h-4 text-brand-600" />
              </button>

              {authMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Acesso à Plataforma
                    </p>
                  </div>
                  <Link
                    to="/entrar?modo=login"
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-brand-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-brand-100 text-brand-700 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Entrar na minha conta</p>
                      <p className="text-xs text-slate-500">Acompanhe seus agendamentos e reservas</p>
                    </div>
                  </Link>

                  <Link
                    to="/entrar?modo=cadastro"
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-brand-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Criar uma conta</p>
                      <p className="text-xs text-slate-500">Cadastre-se gratuitamente para agendar</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={user.role === 'admin' ? '/painel-celina' : '/minha-conta'}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all ${
                  user.role === 'admin'
                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                    : 'bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200'
                }`}
              >
                {user.role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-brand-400" />
                    <span className="hidden sm:inline">Painel da Celina</span>
                    <span className="sm:hidden">Painel ADM</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-brand-600" />
                    <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                  </>
                )}
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sair da conta"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="xl:hidden p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openBookingModal();
              }}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <CalendarPlus className="w-4 h-4" />
              Solicitar Agendamento
            </button>

            {!user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Link
                  to="/entrar?modo=login"
                  className="py-2.5 px-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-800 font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar na minha conta
                </Link>
                <Link
                  to="/entrar?modo=cadastro"
                  className="py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Criar uma conta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
