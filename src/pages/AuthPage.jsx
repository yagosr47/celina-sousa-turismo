import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register, showToast, siteData } = useApp();

  const initialMode = searchParams.get('modo') || 'login';
  const [mode, setMode] = useState(
    ['login', 'cadastro', 'admin', 'recuperar'].includes(initialMode) ? initialMode : 'login'
  );

  useEffect(() => {
    const paramMode = searchParams.get('modo');
    if (paramMode === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    if (paramMode && ['login', 'cadastro', 'recuperar'].includes(paramMode)) {
      setMode(paramMode);
      setError('');
    }
  }, [searchParams, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/painel-celina' : '/minha-conta', { replace: true });
    }
  }, [user, navigate]);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLgpd, setRegLgpd] = useState(true);

  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Recovery states
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recConfirmPassword, setRecConfirmPassword] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (newMode) => {
    setError('');
    setSuccessMsg('');
    setMode(newMode);
    setSearchParams({ modo: newMode });
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const data = await login({
        identifier: loginEmail,
        password: loginPassword,
        loginMode: 'customer',
      });
      showToast(`Bem-vindo(a), ${data.user.name}!`, 'success');
      navigate(data.redirectTo || '/minha-conta');
    } catch (err) {
      setError(err.message || 'Erro ao entrar na conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirmPassword) {
      setError('A confirmação de senha não confere com a senha informada.');
      return;
    }
    try {
      setLoading(true);
      const data = await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        lgpdConsent: regLgpd,
      });
      showToast(`Conta criada com sucesso! Bem-vindo(a), ${data.user.name}!`, 'success');
      navigate('/minha-conta');
    } catch (err) {
      setError(err.message || 'Erro ao criar sua conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const data = await login({
        identifier: adminIdentifier,
        password: adminPassword,
        loginMode: 'admin',
      });
      showToast('Acesso administrativo autenticado com sucesso!', 'success');
      navigate('/painel-celina');
    } catch (err) {
      setError(err.message || 'Credenciais administrativas inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const res = await apiFetch('/api/auth/recover-password', {
        method: 'POST',
        body: JSON.stringify({
          email: recEmail,
          phone: recPhone,
          newPassword: recNewPassword,
          confirmPassword: recConfirmPassword,
        }),
      });
      setSuccessMsg(res.message || 'Senha redefinida com sucesso!');
      showToast('Senha redefinida! Agora faça login.', 'success');
      setTimeout(() => switchMode('login'), 2000);
    } catch (err) {
      setError(err.message || 'Erro ao recuperar a senha.');
    } finally {
      setLoading(false);
    }
  };

  const settings = siteData.settings || {};

  return (
    <div className="min-h-[82vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-gradient-to-b from-brand-50/40 via-slate-50 to-slate-100">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Brand Header */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 px-6 py-7 text-center text-white space-y-3">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-3 py-1.5 shadow">
            <img
              src={settings.logo_url || '/assets/images/logo-original.jpeg'}
              alt="Celina Sousa Turismo"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              {mode === 'admin'
                ? 'Acesso Administrativo Exclusivo'
                : mode === 'cadastro'
                  ? 'Criar Conta de Cliente'
                  : mode === 'recuperar'
                    ? 'Recuperação Segura de Senha'
                    : 'Entrar na Minha Conta'}
            </h1>
            <p className="text-xs sm:text-sm text-brand-200 mt-0.5">
              {mode === 'admin'
                ? 'Painel de gerenciamento exclusivo da Celina Sousa Turismo'
                : 'Acompanhe seus agendamentos, solicitações e reservas'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs (Customer Only) */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 border-b border-slate-200 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'login' || mode === 'recuperar'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>Entrar na minha conta</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode('cadastro')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'cadastro'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Criar uma conta</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN DO CLIENTE */}
          {mode === 'login' && (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-700">Senha</label>
                  <button
                    type="button"
                    onClick={() => switchMode('recuperar')}
                    className="text-xs font-bold text-brand-700 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-extrabold text-sm shadow-md transition-all"
              >
                {loading ? 'Entrando...' : 'Entrar na Minha Conta'}
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Ainda não possui conta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('cadastro')}
                  className="font-bold text-brand-700 hover:underline"
                >
                  Criar uma conta gratuita
                </button>
              </p>
            </form>
          )}

          {/* 2. CADASTRO DO CLIENTE */}
          {mode === 'cadastro' && (
            <form onSubmit={handleCustomerRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-mail *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="(64) 99999-9999"
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Senha (mín. 6 caracteres) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Crie uma senha"
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Confirmação de Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regLgpd}
                  onChange={(e) => setRegLgpd(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  required
                />
                <span>
                  Concordo com o uso dos meus dados de contato exclusivamente para acompanhamento de
                  agendamentos, reservas e atendimento pela Celina Sousa Turismo (LGPD).
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-extrabold text-sm shadow-md transition-all"
              >
                {loading ? 'Criando sua conta...' : 'Criar Minha Conta'}
              </button>
            </form>
          )}

          {/* 3. ACESSO ADMINISTRATIVO EXCLUSIVO DA CELINA */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Ambiente Administrativo Protegido</p>
                  <p className="mt-0.5 text-slate-300">
                    Acesso restrito à responsável pela Celina Sousa Turismo para gerenciamento de
                    clubes, viagens, clientes e agendamentos.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Usuário ou E-mail Administrativo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="Ex: celina.admin"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Senha Administrativa
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Digite sua senha administrativa"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-3 text-sm focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-extrabold text-sm shadow-md transition-all"
              >
                {loading ? 'Verificando credenciais...' : 'Acessar Painel da Celina'}
              </button>
            </form>
          )}

          {/* 4. RECUPERAÇÃO DE SENHA DO CLIENTE */}
          {mode === 'recuperar' && (
            <form onSubmit={handleRecoverPassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-xs text-brand-900 flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  Informe o e-mail e o telefone cadastrados na sua conta para validar sua identidade
                  e definir uma nova senha.
                </span>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  E-mail da Conta *
                </label>
                <input
                  type="email"
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Telefone Cadastrado (com DDD) *
                </label>
                <input
                  type="tel"
                  value={recPhone}
                  onChange={(e) => setRecPhone(e.target.value)}
                  placeholder="(64) 99999-9999"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={recNewPassword}
                    onChange={(e) => setRecNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={recConfirmPassword}
                    onChange={(e) => setRecConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Voltar ao Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold"
                >
                  {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
