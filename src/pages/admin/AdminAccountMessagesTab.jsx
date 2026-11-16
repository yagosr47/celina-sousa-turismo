import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  History,
  MessageCircle,
  CheckCircle2,
  Trash2,
  Lock,
  User,
  Save,
} from 'lucide-react';
import {
  apiFetch,
  buildWhatsAppUrl,
  formatDateTimeBR,
} from '../../lib/api';
import { useApp } from '../../context/AppContext';

export default function AdminAccountMessagesTab({ initialSection = 'mensagens', onDataChanged }) {
  const { user, setUser, showToast } = useApp();

  const [section, setSection] = useState(initialSection); // mensagens | conta | logs
  const [messages, setMessages] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin account profile
  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminUsername, setAdminUsername] = useState(user?.username || '');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [adminPhone, setAdminPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Admin password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, lRes] = await Promise.all([
        apiFetch('/api/admin/messages'),
        apiFetch('/api/admin/audit-logs'),
      ]);
      setMessages(mRes.messages || []);
      setAuditLogs(lRes.logs || []);
    } catch (err) {
      showToast('Erro ao carregar mensagens e registros.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkMessageStatus = async (msgId, status) => {
    try {
      await apiFetch(`/api/admin/messages/${msgId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await loadData();
      if (onDataChanged) onDataChanged();
      showToast(`Mensagem marcada como "${status}".`, 'info');
    } catch (err) {
      showToast('Erro ao atualizar mensagem.', 'error');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await apiFetch(`/api/admin/messages/${msgId}`, { method: 'DELETE' });
      await loadData();
      if (onDataChanged) onDataChanged();
      showToast('Mensagem excluída.', 'info');
    } catch (err) {
      showToast('Erro ao excluir mensagem.', 'error');
    }
  };

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: adminName,
          username: adminUsername,
          email: adminEmail,
          phone: adminPhone,
        }),
      });
      setUser(res.user);
      showToast('Dados da conta administrativa atualizados!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar perfil administrativo.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateAdminPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast('A confirmação da nova senha não confere.', 'error');
      return;
    }
    try {
      setSavingPass(true);
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      setUser(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Senha administrativa alterada com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar senha.', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-wrap gap-2">
        {[
          {
            id: 'mensagens',
            label: `Mensagens Recebidas (${messages.length})`,
            icon: MessageSquare,
          },
          {
            id: 'conta',
            label: 'Minha Conta Administrativa (Celina)',
            icon: ShieldCheck,
          },
          {
            id: 'logs',
            label: 'Histórico de Ações Administrativas',
            icon: History,
          },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                section === t.id
                  ? 'bg-brand-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* MENSAGENS DE CONTATO */}
      {section === 'mensagens' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Mensagens Enviadas pelo Formulário de Contato
            </h3>
            <p className="text-xs text-slate-500">
              Consulte as mensagens dos visitantes e responda diretamente pelo WhatsApp.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Carregando mensagens...</div>
          ) : messages.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-50 text-center text-sm text-slate-500">
              Nenhuma mensagem recebida pelo formulário até o momento.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border space-y-3 ${
                    m.status === 'Nova'
                      ? 'bg-brand-50/40 border-brand-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          m.status === 'Nova'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {m.status}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {m.subject}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">{formatDateTimeBR(m.created_at)}</span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>De:</strong> {m.name} • <strong>Contato:</strong> {m.contact}{' '}
                    {m.email ? `(${m.email})` : ''}
                    {m.related_item_name ? ` • Item: ${m.related_item_name}` : ''}
                  </p>

                  <p className="text-sm text-slate-800 bg-white p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                    {m.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={buildWhatsAppUrl(
                          m.contact,
                          `Olá ${m.name}! Aqui é da Celina Sousa Turismo em resposta à sua mensagem sobre "${m.subject}".`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleMarkMessageStatus(m.id, 'Respondida')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Responder no WhatsApp
                      </a>
                      {m.status === 'Nova' && (
                        <button
                          type="button"
                          onClick={() => handleMarkMessageStatus(m.id, 'Lida')}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Marcar como Lida
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(m.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MINHA CONTA ADMINISTRATIVA (CELINA) */}
      {section === 'conta' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleUpdateAdminProfile}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-slate-900">
              <User className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-extrabold">Dados de Acesso da Celina</h3>
            </div>
            <p className="text-xs text-slate-500">
              Altere seu nome, usuário de login e e-mail administrativo quando desejar.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Nome da Administradora *
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Usuário de Login Administrativo *
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                E-mail Administrativo (opcional)
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="celina@exemplo.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-extrabold shadow"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Salvando...' : 'Salvar Dados Administrativos'}</span>
            </button>
          </form>

          <form
            onSubmit={handleUpdateAdminPassword}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-slate-900">
              <Lock className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-extrabold">Alterar Senha Administrativa</h3>
            </div>
            <p className="text-xs text-slate-500">
              Atualize sua senha de acesso ao Painel da Celina com segurança.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Senha Atual *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Nova Senha (mín. 8 caracteres) *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPass}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingPass ? 'Alterando...' : 'Atualizar Senha Administrativa'}</span>
            </button>
          </form>
        </div>
      )}

      {/* HISTÓRICO DE AUDITORIA */}
      {section === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900">
            Registro de Ações Administrativas Importantes
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700">
                    {log.action}
                  </span>{' '}
                  <strong className="text-slate-800">{log.entity_type}</strong>
                  {log.entity_id ? ` (#${log.entity_id})` : ''}
                  {log.details && (
                    <p className="text-slate-500 mt-0.5 break-all">{log.details}</p>
                  )}
                </div>
                <span className="text-slate-400 shrink-0">
                  {formatDateTimeBR(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
