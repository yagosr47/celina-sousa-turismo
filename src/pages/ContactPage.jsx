import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Instagram,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch, buildWhatsAppUrl } from '../lib/api';

export default function ContactPage() {
  const { siteData, user, showToast } = useApp();
  const { settings = {}, clubs = [], trips = [] } = siteData;

  const [name, setName] = useState(user?.name || '');
  const [contact, setContact] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedOk, setSubmittedOk] = useState(false);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || '');
      setContact((prev) => prev || user.phone || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    selectedItem
      ? `Olá Celina! Vim pela página de Contato do site e gostaria de informações sobre *${selectedItem}*.`
      : 'Olá Celina! Vim pela página de Contato do site da Celina Sousa Turismo e gostaria de falar com o atendimento.'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch('/api/public/contact', {
        method: 'POST',
        body: JSON.stringify({
          name,
          contact,
          email,
          subject: subject || (selectedItem ? `Consulta sobre ${selectedItem}` : 'Atendimento Geral'),
          message,
          relatedItemName: selectedItem || null,
        }),
      });
      setSubmittedOk(true);
      setSubject('');
      setMessage('');
      showToast('Mensagem enviada com sucesso para a Celina Sousa Turismo!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao enviar mensagem.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20 space-y-12">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white py-14 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
            Atendimento Direto
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Contato e Atendimento
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Fale com a Celina Sousa Turismo pelo WhatsApp, acompanhe nosso Instagram ou envie sua
            mensagem diretamente pelo formulário abaixo.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Channels */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900">
              Canais Oficiais de Atendimento
            </h2>

            <div className="space-y-4">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all group"
              >
                <div className="p-3 rounded-xl bg-emerald-600 text-white shadow">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    WhatsApp Oficial
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {settings.phone_display || '(64) 9 9206-5866'}
                  </p>
                  <span className="text-xs text-emerald-700 font-semibold group-hover:underline">
                    Clique para iniciar conversa no WhatsApp →
                  </span>
                </div>
              </a>

              {/* Instagram */}
              <a
                href={settings.instagram_url || 'https://www.instagram.com/celinasousaturismo/'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-2xl bg-brand-50 hover:bg-brand-100/80 border border-brand-200 transition-all group"
              >
                <div className="p-3 rounded-xl bg-brand-600 text-white shadow">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                    Instagram da Empresa
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {settings.instagram_handle || '@celinasousaturismo'}
                  </p>
                  <span className="text-xs text-brand-700 font-semibold group-hover:underline">
                    Seguir e acompanhar novidades no Instagram →
                  </span>
                </div>
              </a>

              {/* Telefone */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="p-3 rounded-xl bg-slate-800 text-white">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Telefone de Contato
                  </span>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {settings.phone_display || '(64) 9 9206-5866'}
                  </p>
                </div>
              </div>

              {settings.email_contact && (
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="p-3 rounded-xl bg-slate-800 text-white">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      E-mail
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 break-all">
                      {settings.email_contact}
                    </p>
                  </div>
                </div>
              )}

              {settings.address_info && (
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="p-3 rounded-xl bg-slate-800 text-white">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Localização
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {settings.address_info}
                    </p>
                  </div>
                </div>
              )}

              {settings.business_hours && (
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="p-3 rounded-xl bg-slate-800 text-white">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Horários de Atendimento
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {settings.business_hours}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Envie uma Mensagem para a Celina
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Preencha seus dados e sua dúvida. A mensagem é registrada diretamente no painel da
                Celina Sousa Turismo.
              </p>
            </div>

            {submittedOk && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold">Mensagem recebida com sucesso!</p>
                  <p>
                    A Celina foi notificada no painel administrativo e retornará pelo contato
                    informado. Se preferir atendimento imediato, clique no botão do WhatsApp ao lado.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="(64) 99999-9999"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Clube ou Viagem de Interesse (opcional)
                  </label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                  >
                    <option value="">Atendimento geral / Outro</option>
                    {clubs.length > 0 && (
                      <optgroup label="Clubes e Destinos">
                        {clubs.map((c) => (
                          <option key={`club-${c.id}`} value={c.name}>
                            Clube: {c.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {trips.length > 0 && (
                      <optgroup label="Viagens e Pacotes">
                        {trips.map((t) => (
                          <option key={`trip-${t.id}`} value={t.name}>
                            Viagem: {t.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Assunto *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Consulta de valores, Locação em Caldas, Excursão em família..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Mensagem *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva como a Celina Sousa Turismo pode ajudar você..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-extrabold shadow-md transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Enviando...' : 'Enviar Mensagem'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
