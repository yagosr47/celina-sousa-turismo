import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Bell,
  CalendarPlus,
  MessageCircle,
  History,
  FileText,
  LogOut,
  Eye,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  apiFetch,
  buildWhatsAppUrl,
  formatDateBR,
  formatDateTimeBR,
} from '../lib/api';

const STATUS_COLORS = {
  'Aguardando análise': 'bg-amber-100 text-amber-800 border-amber-300',
  Aprovado: 'bg-sky-100 text-sky-800 border-sky-300',
  'Aguardando pagamento': 'bg-purple-100 text-purple-800 border-purple-300',
  Confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Recusado: 'bg-rose-100 text-rose-800 border-rose-300',
  Cancelado: 'bg-slate-200 text-slate-700 border-slate-300',
  Concluído: 'bg-brand-100 text-brand-800 border-brand-300',
};

export default function CustomerAreaPage() {
  const {
    user,
    setUser,
    authLoading,
    logout,
    siteData,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
    openBookingModal,
    showToast,
  } = useApp();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'agendamentos';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Profile form
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadMyBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const data = await apiFetch('/api/public/my-bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/entrar?modo=login', { replace: true });
      } else {
        setProfileName(user.name || '');
        setProfileEmail(user.email || '');
        setProfilePhone(user.phone || '');
        loadMyBookings();
      }
    }
  }, [authLoading, user, navigate, loadMyBookings]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
        }),
      });
      setUser(res.user);
      showToast('Suas informações pessoais foram atualizadas!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar perfil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast('A confirmação da nova senha não confere.', 'error');
      return;
    }
    try {
      setSavingPassword(true);
      await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Sua senha foi alterada com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar senha.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancelling(true);
      const res = await apiFetch(`/api/public/my-bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.booking : b))
      );
      setSelectedBooking(res.booking);
      setCancelReason('');
      refreshNotifications();
      showToast('Solicitação cancelada com sucesso.', 'info');
    } catch (err) {
      showToast(err.message || 'Não foi possível cancelar a solicitação.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  const settings = siteData.settings || {};
  const activeRequests = bookings.filter(
    (b) => !['Concluído', 'Cancelado', 'Recusado'].includes(b.status)
  );
  const historyBookings = bookings.filter((b) =>
    ['Concluído', 'Confirmado', 'Cancelado', 'Recusado'].includes(b.status)
  );

  return (
    <div className="pb-20 space-y-10">
      {/* Top Customer Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white py-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
              Área Exclusiva do Cliente
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold">
              Olá, {user.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {user.email} {user.phone ? `• ${user.phone}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-sm font-extrabold shadow"
            >
              <CalendarPlus className="w-4 h-4" />
              Novo Agendamento
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/15"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-2">
          {[
            {
              id: 'agendamentos',
              label: 'Meus Agendamentos e Solicitações',
              icon: Calendar,
              badge: bookings.length,
            },
            {
              id: 'historico',
              label: 'Histórico de Viagens e Reservas',
              icon: History,
            },
            {
              id: 'notificacoes',
              label: 'Notificações',
              icon: Bell,
              badge: unreadCount > 0 ? unreadCount : null,
            },
            {
              id: 'dados',
              label: 'Dados da Conta',
              icon: User,
            },
            {
              id: 'senha',
              label: 'Alterar Senha',
              icon: Lock,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-sm font-bold flex items-center justify-between gap-2 transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                      isActive
                        ? 'bg-white text-brand-700'
                        : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: MEUS AGENDAMENTOS E SOLICITAÇÕES */}
          {activeTab === 'agendamentos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Meus Agendamentos e Solicitações
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Acompanhe em tempo real o status de cada solicitação enviada para a Celina.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openBookingModal()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Solicitar Novo Agendamento
                  </button>
                </div>

                {loadingBookings ? (
                  <div className="space-y-3">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-bold text-slate-900">
                        Você ainda não possui solicitações de agendamento
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Escolha um clube, destino ou viagem e solicite seu agendamento online.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openBookingModal()}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold shadow"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Fazer Minha Primeira Solicitação
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-brand-300 bg-slate-50/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold">
                              {b.booking_code}
                            </span>
                            <span
                              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                                STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {b.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              Solicitado em {formatDateTimeBR(b.created_at)}
                            </span>
                          </div>

                          <h3 className="text-lg font-extrabold text-slate-900">{b.item_name}</h3>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                            <span>
                              <strong>Data Desejada:</strong> {formatDateBR(b.desired_date)}
                              {b.return_date ? ` até ${formatDateBR(b.return_date)}` : ''}
                            </span>
                            <span>
                              <strong>Pessoas:</strong> {b.people_count}
                            </span>
                          </div>

                          {b.customer_feedback_note && (
                            <div className="mt-2 p-3 rounded-xl bg-brand-50 border border-brand-200 text-xs text-brand-900">
                              <strong>Retorno / Observação:</strong> {b.customer_feedback_note}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm"
                          >
                            <Eye className="w-4 h-4 text-brand-600" />
                            Ver detalhes
                          </button>

                          <a
                            href={buildWhatsAppUrl(
                              settings.whatsapp_number,
                              `Olá Celina! Gostaria de falar sobre a minha solicitação *${b.booking_code}* (${b.item_name} para ${formatDateBR(b.desired_date)}).`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HISTÓRICO DE VIAGENS E RESERVAS */}
          {activeTab === 'historico' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Histórico de Viagens e Reservas
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Registro completo das suas reservas confirmadas, concluídas ou encerradas.
                </p>
              </div>

              {historyBookings.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
                  Nenhuma viagem concluída ou finalizada até o momento. Suas solicitações em aberto
                  aparecem na aba "Meus Agendamentos".
                </div>
              ) : (
                <div className="space-y-3">
                  {historyBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {b.booking_code}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              STATUS_COLORS[b.status] || 'bg-slate-100'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 mt-1">{b.item_name}</p>
                        <p className="text-xs text-slate-500">
                          Data: {formatDateBR(b.desired_date)} • {b.people_count} pessoa(s)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(b)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-brand-700 hover:bg-brand-50"
                      >
                        Detalhes
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICAÇÕES */}
          {activeTab === 'notificacoes' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Minhas Notificações</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Avisos de aprovação, atualização de status e informações da sua reserva.
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs font-bold text-brand-700 hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Você não possui notificações no momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markNotificationRead(n.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        !n.is_read
                          ? 'bg-brand-50/70 border-brand-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                        <span className="text-xs text-slate-400">
                          {formatDateTimeBR(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DADOS DA CONTA */}
          {activeTab === 'dados' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Dados da Conta e Informações Pessoais
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Mantenha seu telefone e e-mail atualizados para facilitar o contato da Celina.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp com DDD *
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold shadow"
                >
                  {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: ALTERAR SENHA */}
          {activeTab === 'senha' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Alterar Minha Senha</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Escolha uma senha segura com pelo menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Senha Atual *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nova Senha (mín. 8 caracteres) *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold shadow"
                >
                  {savingPassword ? 'Atualizando senha...' : 'Atualizar Senha'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES E CANCELAMENTO DA SOLICITAÇÃO */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-brand-300">
                  Código: {selectedBooking.booking_code}
                </span>
                <h3 className="text-lg font-extrabold">{selectedBooking.item_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Status atual:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    STATUS_COLORS[selectedBooking.status] || 'bg-slate-100'
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block text-xs">Data Desejada</span>
                  <strong className="text-slate-900">
                    {formatDateBR(selectedBooking.desired_date)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Quantidade de Pessoas</span>
                  <strong className="text-slate-900">
                    {selectedBooking.people_count} pessoa(s)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Solicitante</span>
                  <strong className="text-slate-900">{selectedBooking.customer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Data do Pedido</span>
                  <strong className="text-slate-900">
                    {formatDateTimeBR(selectedBooking.created_at)}
                  </strong>
                </div>
              </div>

              {selectedBooking.additional_info && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-700 block">
                    Suas observações enviadas:
                  </span>
                  <p className="text-slate-600">{selectedBooking.additional_info}</p>
                </div>
              )}

              {selectedBooking.customer_feedback_note && (
                <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-xs space-y-1">
                  <span className="font-bold text-brand-900 block">
                    Retorno da Celina Sousa Turismo:
                  </span>
                  <p className="text-brand-800">{selectedBooking.customer_feedback_note}</p>
                </div>
              )}

              {/* Cancel option if allowed */}
              {!['Cancelado', 'Concluído', 'Recusado'].includes(selectedBooking.status) && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-700">
                    Deseja cancelar esta solicitação?
                  </p>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Motivo do cancelamento (opcional)"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                  >
                    {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento da Solicitação'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
