import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  User,
  Building2,
  Bell,
  Lock,
  LogOut,
  CheckCircle2,
  MapPin,
  Save,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch, formatDateBR, formatCurrencyBR } from '../lib/api';

export default function CustomerAreaPage() {
  const {
    user,
    authLoading,
    logout,
    notifications,
    fetchCustomerNotifications,
    showToast,
    setUser,
    siteData,
  } = useApp();

  const { clubs = [] } = siteData;
  const [activeTab, setActiveTab] = useState('clubes');

  // Profile form
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    city: '',
    state: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (user && user.role === 'customer') {
      setProfile({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || '',
      });
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/painel-celina" replace />;
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const data = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      setUser(data.user);
      showToast('Dados atualizados e salvos neste dispositivo!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      showToast('A confirmação da nova senha não confere.', 'error');
      return;
    }
    setSavingPwd(true);
    try {
      await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: pwdForm.current_password,
          new_password: pwdForm.new_password,
        }),
      });
      showToast('Senha alterada com sucesso!', 'success');
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      await fetchCustomerNotifications();
      showToast('Notificações marcadas como lidas.', 'info');
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300 font-extrabold text-2xl">
            {user.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-brand-300 font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              Área do Cliente • Login Salvo Neste Dispositivo
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{user.name}</h1>
            <p className="text-xs sm:text-sm text-brand-100">
              {user.email} • {user.phone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/clubes"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow transition-all"
          >
            <Building2 className="w-4 h-4" />
            <span>Explorar Clubes</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('clubes')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'clubes'
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Clubes ({clubs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notificacoes')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'notificacoes'
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Avisos</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dados')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'dados'
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Meus Dados</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('senha')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'senha'
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Alterar Senha</span>
        </button>
      </div>

      {/* TAB: CLUBES DISPONÍVEIS */}
      {activeTab === 'clubes' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Clubes e Destinos — Saiba Mais de Cada Clube
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Clique em qualquer clube para acessar fotos, estrutura, piscinas e informações
                completas.
              </p>
            </div>
            <Link
              to="/clubes"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800"
            >
              <span>Ver Catálogo Completo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {clubs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Catálogo de Clubes em Atualização
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Os clubes e parques aquáticos divulgados pela Celina Sousa Turismo aparecem aqui
                  com todos os detalhes.
                </p>
              </div>
              <Link
                to="/contato"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow"
              >
                <span>Falar com Nossa Equipe</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => {
                const locationLabel = [club.city, club.state].filter(Boolean).join(' - ');
                const priceLabel = formatCurrencyBR(club.day_use_price);
                return (
                  <div
                    key={club.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <Link
                        to={`/clubes/${club.slug}`}
                        className="block relative h-44 bg-slate-100 overflow-hidden"
                      >
                        <img
                          src={club.cover_image || '/assets/images/waterpark-family.jpg'}
                          alt={club.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                        {locationLabel && (
                          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-[11px] font-medium">
                            <MapPin className="w-3 h-3 text-brand-300" />
                            {locationLabel}
                          </span>
                        )}
                      </Link>
                      <div className="p-5 space-y-2">
                        <h3 className="text-lg font-extrabold text-slate-900">{club.name}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {club.short_description ||
                            'Clique em saber mais para ver fotos, estrutura, piscinas e informações deste clube.'}
                        </p>
                        {priceLabel && (
                          <p className="text-xs font-bold text-brand-700 pt-1">
                            Valor de referência: {priceLabel}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-5 pt-0">
                      <Link
                        to={`/clubes/${club.slug}`}
                        className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all"
                      >
                        <Info className="w-4 h-4" />
                        <span>Saber mais sobre este clube</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: NOTIFICAÇÕES */}
      {activeTab === 'notificacoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Avisos e Atualizações</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkNotificationsRead}
                className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              Você ainda não possui avisos.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    n.is_read
                      ? 'bg-white border-slate-200'
                      : 'bg-brand-50/70 border-brand-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    <span className="text-[11px] text-slate-400">{formatDateBR(n.created_at)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: DADOS CADASTRAIS */}
      {activeTab === 'dados' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Atualizar Meus Dados</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Mantenha seu telefone e cidade atualizados. Seu login permanece salvo neste
                dispositivo.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              Salvo no Dispositivo
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail Cadastrado (não editável)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp / Telefone *
              </label>
              <input
                type="tel"
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm uppercase focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm shadow transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB: ALTERAR SENHA */}
      {activeTab === 'senha' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-xl shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Alterar Minha Senha</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sua senha é criptografada com segurança.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha Atual *</label>
              <input
                type="password"
                required
                value={pwdForm.current_password}
                onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nova Senha (mínimo 6 caracteres) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                required
                value={pwdForm.confirm_password}
                onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingPwd}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm shadow transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>{savingPwd ? 'Atualizando...' : 'Confirmar Nova Senha'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
