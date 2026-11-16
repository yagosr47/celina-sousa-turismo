import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  MessageCircle,
  CalendarPlus,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl } from '../lib/api';

export default function FaqPage() {
  const { siteData, openBookingModal } = useApp();
  const { faqs = [], settings = {} } = siteData;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [openId, setOpenId] = useState(faqs[0]?.id || null);

  const categories = [
    'Todas',
    ...Array.from(new Set(faqs.map((f) => f.category || 'Geral').filter(Boolean))),
  ];

  const filteredFaqs = faqs.filter((f) => {
    if (selectedCategory !== 'Todas' && (f.category || 'Geral') !== selectedCategory) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(f.question || '').toLowerCase().includes(q) ||
      String(f.answer || '').toLowerCase().includes(q)
    );
  });

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    'Olá Celina! Tenho uma dúvida que gostaria de tirar sobre os agendamentos e serviços da Celina Sousa Turismo.'
  );

  return (
    <div className="pb-20 space-y-12">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white py-14 sm:py-16 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
            <HelpCircle className="w-3.5 h-3.5" />
            Central de Dúvidas
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Perguntas Frequentes
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Confira como funciona a solicitação de reservas, consulta de valores, formas de
            pagamento e acompanhamento de agendamentos na Celina Sousa Turismo.
          </p>

          <div className="pt-2 max-w-xl relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar dúvida ou palavra-chave..."
              className="w-full rounded-xl bg-white text-slate-900 pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
            <p className="text-base font-bold text-slate-800">
              Nenhuma pergunta encontrada para sua busca.
            </p>
            <p className="text-sm text-slate-600">
              Fale diretamente com a Celina pelo WhatsApp para tirar qualquer dúvida específica.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-brand-600">
                        {faq.category || 'Geral'}
                      </span>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                        {faq.question}
                      </h2>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-brand-600 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 whitespace-pre-line">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Still have questions */}
        <div className="bg-gradient-to-r from-brand-50 to-white rounded-3xl border border-brand-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">
              Ainda ficou com alguma dúvida?
            </h3>
            <p className="text-sm text-slate-600">
              Entre em contato diretamente com a Celina Sousa Turismo pelo WhatsApp ou envie uma
              solicitação.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow"
            >
              <MessageCircle className="w-4 h-4" />
              Falar pelo WhatsApp
            </a>
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow"
            >
              <CalendarPlus className="w-4 h-4" />
              Solicitar Reserva
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
