import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch, getRememberDevicePreference } from '../lib/api';
import { ProfessionalEmblem } from '../components/BrandLogo';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register, showToast, siteData } = useApp();

  const initialMode = searchParams.get('modo') === 'cadastro' ? 'cadastro' : 'login';
  const [mode, setMode] = useState(initialMode);

  // Unified Login state (Customer or Admin)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(() => getRememberDevicePreference());
  const [showPass, setShowPass] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLgpd, setRegLgpd] = useState(true);

  // Recovery state
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recConfirmPassword, setRecConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const m = searchParams.get('modo');
    if (m === 'cadastro' || m === 'recuperar' || m === 'login') {
      setMode(m);
      setError('');
      setSuccessMsg('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/painel-celina', { replace: true });
      } else {
        navigate('/minha-conta', { replace: true });
      }
    }
  }, [user, navigate]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSearchParams({ modo: nextMode });
    setError('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const data = await login({
        identifier: loginIdentifier,
        password: loginPassword,
        rememberDevice,
      });
      if (data.user.role === 'admin') {
        showToast('Acesso administrativo liberado! Bem-vinda, Celina!', 'success');
        navigate('/painel-celina', { replace: true });
      } else {
        showToast('Login realizado! Seu acesso foi salvo neste dispositivo.', 'success');
        navigate('/minha-conta', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Credenciais inválidas. Verifique seu e-mail/usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!regLgpd) {
      setError('É necessário concordar com o aviso de privacidade (LGPD) para criar sua conta.');
      return;
    }
    try {
      setLoading(true);
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        lgpdConsent: regLgpd,
      });
      showToast('Conta criada com sucesso e salva neste dispositivo!', 'success');
      navigate('/minha-conta', { replace: true });
    } catch (err) {
      setError(err.message || 'Erro ao criar conta.');
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
    <div className="min-h-[82vh] py-10 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-gradient-to-b from-brand-50/40 via-slate-50 to-slate-100">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Brand Header */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 px-6 py-7 text-center text-white space-y-3">
          <div className="inline-flex items-center justify-center">
            <ProfessionalEmblem className="w-16 h-16 drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              {mode === 'cadastro'
                ? 'Criar Nova Conta'
                : mode === 'recuperar'
                  ? 'Recuperação Segura de Senha'
                  : 'Entrar na Plataforma'}
            </h1>
            <p className="text-xs sm:text-sm text-brand-200 mt-0.5">
              {settings.company_name || 'Celina Sousa Turismo'} •{' '}
              {settings.company_subtitle || 'Caldas Locações'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
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
            <LogIn className="w-4 h-4" />
            <span>Entrar</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode('cadastro')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'cadastro'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Conta</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. UNIFIED LOGIN (CUSTOMER OR ADMIN) */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  E-mail ou Usuário
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Digite seu e-mail ou usuário"
                    autoComplete="username"
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
                    autoComplete="current-password"
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

              {/* Save Login on Device Option */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                  <Smartphone className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Salvar meu login e manter conectado neste dispositivo</span>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-blue-700 hover:from-brand-500 hover:to-blue-600 disabled:opacity-60 text-white text-sm font-extrabold shadow-md transition-all"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                Ainda não possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('cadastro')}
                  className="font-bold text-brand-700 hover:underline"
                >
                  Criar uma conta gratuitamente
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER CUSTOMER */}
          {mode === 'cadastro' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                    placeholder="Seu nome completo"
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
                    Confirmar Senha *
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

              {/* LGPD Consent */}
              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regLgpd}
                  onChange={(e) => setRegLgpd(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="leading-relaxed">
                  Concordo com o armazenamento dos meus dados (nome, e-mail e telefone) para acesso
                  à plataforma e atendimento pela{' '}
                  <strong>{settings.company_name || 'Celina Sousa Turismo'}</strong>, conforme a
                  LGPD.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white text-sm font-extrabold shadow-md transition-all"
              >
                {loading ? 'Criando sua conta...' : 'Criar Minha Conta'}
              </button>
            </form>
          )}

          {/* 3. PASSWORD RECOVERY */}
          {mode === 'recuperar' && (
            <form onSubmit={handleRecoverPassword} className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
                <div className="text-xs text-brand-900 space-y-1">
                  <p className="font-bold">Redefinição Segura de Senha</p>
                  <p>
                    Informe o e-mail e o telefone/WhatsApp cadastrados em sua conta para definir uma
                    nova senha imediatamente.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  E-mail Cadastrado *
                </label>
                <input
                  type="email"
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp Cadastrado *
                </label>
                <input
                  type="tel"
                  value={recPhone}
                  onChange={(e) => setRecPhone(e.target.value)}
                  placeholder="(64) 99999-9999"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={recNewPassword}
                    onChange={(e) => setRecNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
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
                    value={recConfirmPassword}
                    onChange={(e) => setRecConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  Voltar ao Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold shadow"
                >
                  {loading ? 'Redefinindo...' : 'Redefinir Minha Senha'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
