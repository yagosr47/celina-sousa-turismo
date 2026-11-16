import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building2, CalendarPlus, Compass, User, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MobileBottomNav() {
  const { user, openBookingModal, unreadCount } = useApp();

  return (
    <nav
      aria-label="Navegação rápida mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgb(15,23,42,0.08)] px-2 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Início</span>
        </NavLink>

        <NavLink
          to="/clubes"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Building2 className="w-5 h-5" />
          <span>Clubes</span>
        </NavLink>

        {/* Central Elevated CTA Button */}
        <div className="flex items-center justify-center -mt-5">
          <button
            type="button"
            onClick={() => openBookingModal()}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-sky-700 text-white shadow-lg shadow-brand-600/35 ring-4 ring-white active:scale-95 transition-transform"
            aria-label="Solicitar Agendamento"
          >
            <CalendarPlus className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-tight mt-0.5">
              Agendar
            </span>
          </button>
        </div>

        <NavLink
          to="/viagens"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Compass className="w-5 h-5" />
          <span>Viagens</span>
        </NavLink>

        <NavLink
          to={user ? (user.role === 'admin' ? '/painel-celina' : '/minha-conta') : '/entrar'}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {user?.role === 'admin' ? (
            <ShieldCheck className="w-5 h-5 text-brand-600" />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="truncate max-w-[60px]">
            {user ? (user.role === 'admin' ? 'Painel' : 'Conta') : 'Entrar'}
          </span>
          {user && unreadCount > 0 && (
            <span className="absolute top-1 right-3.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </NavLink>
      </div>
    </nav>
  );
}
