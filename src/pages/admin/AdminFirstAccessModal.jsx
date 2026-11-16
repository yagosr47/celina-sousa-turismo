import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export default function AdminFirstAccessModal() {
  const { user, setUser, showToast } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user || !user.must_change_password) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('A confirmação da nova senha não confere.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
          newUsername,
          newEmail,
        }),
      });
      setUser(res.user);
      showToast(
        'Senha definitiva configurada com sucesso! Bem-vinda ao seu Painel Administrativo, Celina.',
        'success'
      );
    } catch (err) {
      setError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 px-6 py-6 text-white space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            Segurança do Primeiro Acesso
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Bem-vinda, Celina! Defina sua Nova Senha
          </h2>
          <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
            Por segurança, como este é o primeiro acesso utilizando a credencial temporária de
            inicialização, escolha agora uma senha pessoal exclusiva para proteger seu painel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Seu Usuário Administrativo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm font-medium outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Seu E-mail (opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="celina@exemplo.com"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Senha Temporária Atual *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite a senha temporária atual"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Nova Senha (mín. 8 caracteres) *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha segura"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
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
                placeholder="Repita a nova senha"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Salvando nova senha...' : 'Salvar Nova Senha e Acessar Painel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
