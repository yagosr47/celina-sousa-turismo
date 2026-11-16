import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCustomerSiteUrl } from '../lib/api';

export default function AdminLoginPage({ isStandalonePortal = false }) {
  const { user, login, logout, showToast, siteData } = useApp();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate(isStandalonePortal ? '/' : '/painel-celina', { replace: true });
    }
  }, [user, navigate, isStandalonePortal]);

  const settings = siteData.settings || {};

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await login({
        identifier,
        password,
        loginMode: 'admin',
      });
      showToast('Bem-vinda ao Portal Administrativo, Celina!', 'success');
      navigate(isStandalonePortal ? '/' : '/painel-celina', { replace: true });
    } catch (err) {
      setError(err.message || 'Credenciais administrativas inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Decorative Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl px-2.5 py-1 shadow">
              <img
                src={settings.logo_url || '/assets/images/logo-original.jpeg'}
                alt="Celina Sousa Turismo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-white block leading-tight">
                {settings.company_name || 'Celina Sousa Turismo'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
                Portal Administrativo Exclusivo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
              <Database className="w-3.5 h-3.5" />
              Sincronizado com o Site de Clientes
            </span>
            {isStandalonePortal ? (
              <a
                href={getCustomerSiteUrl('/')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-brand-400" />
                <span>Ir para Site de Clientes</span>
              </a>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-brand-400" />
                <span>Ir para Site de Clientes</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 px-6 py-7 text-center space-y-3 border-b border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-slate-950/60 border border-brand-400/30 text-brand-300 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-300">
                Ambiente Restrito • ADM
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-0.5">
                Acesso da Celina Sousa
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Gerencie clubes, viagens, fotos, clientes e solicitações em tempo real.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {user && user.role !== 'admin' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <p>
                  Você está conectado com uma conta de cliente (<strong>{user.email}</strong>). Para
                  entrar no Portal Administrativo, encerre a sessão de cliente ou entre com sua
                  credencial de administradora abaixo.
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-bold"
                >
                  Desconectar conta de cliente
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Usuário ou E-mail Administrativo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="celina.admin"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 pl-10 pr-4 py-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Senha Administrativa
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha exclusiva"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 pl-10 pr-10 py-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:bg-slate-700 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span>{loading ? 'Autenticando...' : 'Entrar no Painel da Celina'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
                Integração em tempo real ativa
              </span>
              <span>Caldas Locações</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        Portal Administrativo Exclusivo — {settings.company_name || 'Celina Sousa Turismo'} • Acesso
        protegido
      </footer>
    </div>
  );
}
