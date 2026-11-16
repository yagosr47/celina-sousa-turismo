import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Upload,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  Star,
  Image as ImageIcon,
  Globe,
  Building,
} from 'lucide-react';
import { apiFetch, uploadImages } from '../../lib/api';
import { useApp } from '../../context/AppContext';

function parseArrayToMultiline(raw) {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.join('\n');
  } catch {}
  return String(raw);
}

export default function AdminContentTab() {
  const { showToast, refreshSiteData } = useApp();

  const [subTab, setSubTab] = useState('identidade'); // identidade | sobre | faq | depoimentos | galeria
  const [settings, setSettings] = useState({});
  const [servicesText, setServicesText] = useState('');
  const [differentialsText, setDifferentialsText] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

  // FAQs state
  const [faqs, setFaqs] = useState([]);
  const [faqForm, setFaqForm] = useState({
    id: null,
    question: '',
    answer: '',
    category: 'Agendamentos',
  });

  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [testiForm, setTestiForm] = useState({
    id: null,
    customer_name: '',
    city_state: '',
    content: '',
    rating: 5,
    item_visited: '',
  });

  // Gallery state
  const [gallery, setGallery] = useState([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('Clubes e Piscinas');
  const [galleryDesc, setGalleryDesc] = useState('');

  const loadAllContent = useCallback(async () => {
    try {
      const [sRes, fRes, tRes, gRes] = await Promise.all([
        apiFetch('/api/admin/settings'),
        apiFetch('/api/admin/faqs'),
        apiFetch('/api/admin/testimonials'),
        apiFetch('/api/admin/gallery'),
      ]);
      const s = sRes.settings || {};
      setSettings(s);
      setServicesText(parseArrayToMultiline(s.about_services));
      setDifferentialsText(parseArrayToMultiline(s.about_differentials));
      setFaqs(fRes.faqs || []);
      setTestimonials(tRes.testimonials || []);
      setGallery(gRes.gallery || []);
    } catch (err) {
      showToast('Erro ao carregar configurações de conteúdo.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadAllContent();
  }, [loadAllContent]);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingSettings(true);
      const payload = {
        ...settings,
        about_services: JSON.stringify(
          servicesText
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean)
        ),
        about_differentials: JSON.stringify(
          differentialsText
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean)
        ),
      };
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      await refreshSiteData();
      showToast('Conteúdo do site salvo e atualizado automaticamente!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao salvar configurações.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUploadSettingImage = async (settingKey, fileList) => {
    if (!fileList || fileList.length === 0) return;
    try {
      setUploadingField(settingKey);
      const res = await uploadImages(fileList);
      const url = res.files?.[0]?.url;
      if (url) {
        const nextSettings = { ...settings, [settingKey]: url };
        setSettings(nextSettings);
        await apiFetch('/api/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ [settingKey]: url }),
        });
        await refreshSiteData();
        showToast('Imagem atualizada com sucesso!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Erro no envio da imagem.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  // FAQ Handlers
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!faqForm.question || !faqForm.answer) return;
    try {
      if (faqForm.id) {
        await apiFetch(`/api/admin/faqs/${faqForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(faqForm),
        });
        showToast('Pergunta frequente atualizada!', 'success');
      } else {
        await apiFetch('/api/admin/faqs', {
          method: 'POST',
          body: JSON.stringify(faqForm),
        });
        showToast('Nova pergunta frequente adicionada!', 'success');
      }
      setFaqForm({ id: null, question: '', answer: '', category: 'Agendamentos' });
      await loadAllContent();
      await refreshSiteData();
    } catch (err) {
      showToast('Erro ao salvar pergunta frequente.', 'error');
    }
  };

  const handleDeleteFaq = async (id) => {
    try {
      await apiFetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      await loadAllContent();
      await refreshSiteData();
      showToast('Pergunta removida.', 'info');
    } catch (err) {
      showToast('Erro ao remover pergunta.', 'error');
    }
  };

  // Testimonial Handlers
  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    if (!testiForm.customer_name || !testiForm.content) return;
    try {
      if (testiForm.id) {
        await apiFetch(`/api/admin/testimonials/${testiForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(testiForm),
        });
        showToast('Depoimento atualizado!', 'success');
      } else {
        await apiFetch('/api/admin/testimonials', {
          method: 'POST',
          body: JSON.stringify(testiForm),
        });
        showToast('Depoimento cadastrado e publicado!', 'success');
      }
      setTestiForm({
        id: null,
        customer_name: '',
        city_state: '',
        content: '',
        rating: 5,
        item_visited: '',
      });
      await loadAllContent();
      await refreshSiteData();
    } catch (err) {
      showToast('Erro ao salvar depoimento.', 'error');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    try {
      await apiFetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      await loadAllContent();
      await refreshSiteData();
      showToast('Depoimento excluído.', 'info');
    } catch (err) {
      showToast('Erro ao excluir depoimento.', 'error');
    }
  };

  // Gallery Handlers
  const handleUploadGalleryPhoto = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingField('gallery');
      const uploaded = await uploadImages(files);
      for (const f of uploaded.files || []) {
        await apiFetch('/api/admin/gallery', {
          method: 'POST',
          body: JSON.stringify({
            title: galleryTitle || 'Lazer e Turismo',
            category: galleryCategory || 'Destinos e Lazer',
            image_url: f.url,
            description: galleryDesc || '',
          }),
        });
      }
      setGalleryTitle('');
      setGalleryDesc('');
      await loadAllContent();
      await refreshSiteData();
      showToast('Foto(s) adicionada(s) à galeria inicial!', 'success');
    } catch (err) {
      showToast('Erro ao adicionar foto à galeria.', 'error');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const handleDeleteGalleryItem = async (id) => {
    try {
      await apiFetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      await loadAllContent();
      await refreshSiteData();
      showToast('Foto removida da galeria.', 'info');
    } catch (err) {
      showToast('Erro ao remover foto.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Gerenciamento de Conteúdo do Site
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Edite logotipo, banner, contatos, textos institucionais, perguntas frequentes, depoimentos e galeria.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'identidade', label: 'Identidade, Banner e Contatos', icon: Globe },
            { id: 'sobre', label: 'Página Sobre a Empresa', icon: Building },
            { id: 'faq', label: `Perguntas Frequentes (${faqs.length})`, icon: HelpCircle },
            { id: 'depoimentos', label: `Depoimentos (${testimonials.length})`, icon: Star },
            { id: 'galeria', label: `Galeria da Home (${gallery.length})`, icon: ImageIcon },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  subTab === t.id
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
      </div>

      {/* 1. IDENTIDADE, BANNER E CONTATOS */}
      {subTab === 'identidade' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
        >
          <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Logotipo, Banner Principal e Informações de Contato
          </h3>

          {/* Logo & Banner Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={settings.logo_url || '/assets/images/logo-profissional.svg'}
                  alt="Logo atual"
                  className="h-16 w-24 object-contain bg-white rounded-xl border border-slate-200 p-1"
                />
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Logotipo da Empresa</p>
                  <p className="text-xs text-slate-600 mt-0.5">Exibida no topo e rodapé</p>
                </div>
              </div>
              <label className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === 'logo_url' ? 'Enviando...' : 'Trocar Logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadSettingImage('logo_url', e.target.files)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={settings.hero_banner_url || '/assets/images/hero-resort.jpg'}
                  alt="Banner atual"
                  className="h-16 w-24 object-cover rounded-xl border border-slate-200"
                />
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Banner Principal</p>
                  <p className="text-xs text-slate-600 mt-0.5">Imagem de destaque da Home</p>
                </div>
              </div>
              <label className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === 'hero_banner_url' ? 'Enviando...' : 'Trocar Banner'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadSettingImage('hero_banner_url', e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Subtítulo / Marca Associada
              </label>
              <input
                type="text"
                value={settings.company_subtitle || ''}
                onChange={(e) => setSettings({ ...settings, company_subtitle: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Título do Banner Principal (Home)
              </label>
              <input
                type="text"
                value={settings.hero_title || ''}
                onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Subtítulo do Banner Principal
              </label>
              <input
                type="text"
                value={settings.hero_subtitle || ''}
                onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Texto de Apresentação da Empresa (Página Inicial)
            </label>
            <textarea
              rows={3}
              value={settings.presentation_text || ''}
              onChange={(e) => setSettings({ ...settings, presentation_text: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <h4 className="text-sm font-extrabold text-slate-900 pt-2">
            Canais de Contato e Atendimento
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Número do WhatsApp (apenas números com DDD)
              </label>
              <input
                type="text"
                value={settings.whatsapp_number || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                placeholder="64992065866"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Telefone Formatado para Exibição
              </label>
              <input
                type="text"
                value={settings.phone_display || ''}
                onChange={(e) => setSettings({ ...settings, phone_display: e.target.value })}
                placeholder="(64) 9 9206-5866"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Instagram (@usuario)
              </label>
              <input
                type="text"
                value={settings.instagram_handle || ''}
                onChange={(e) => setSettings({ ...settings, instagram_handle: e.target.value })}
                placeholder="@celinasousaturismo"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                E-mail de Atendimento (opcional)
              </label>
              <input
                type="email"
                value={settings.email_contact || ''}
                onChange={(e) => setSettings({ ...settings, email_contact: e.target.value })}
                placeholder="Deixe em branco se não utilizar"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Endereço / Localização (opcional)
              </label>
              <input
                type="text"
                value={settings.address_info || ''}
                onChange={(e) => setSettings({ ...settings, address_info: e.target.value })}
                placeholder="Informe endereço caso deseje exibir"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Horários de Atendimento (opcional)
              </label>
              <input
                type="text"
                value={settings.business_hours || ''}
                onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                placeholder="Ex: Segunda a Sábado, 08h às 19h"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Promotions Banner on Homepage */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <label className="inline-flex items-center gap-2 text-sm font-bold text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.promotions_active === '1'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promotions_active: e.target.checked ? '1' : '0',
                  })
                }
                className="rounded border-amber-400 text-amber-600 w-4 h-4"
              />
              <span>Ativar faixa de Ofertas e Promoções na Página Inicial</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={settings.promotions_banner_title || ''}
                onChange={(e) =>
                  setSettings({ ...settings, promotions_banner_title: e.target.value })
                }
                placeholder="Título da oferta/promoção..."
                className="w-full rounded-xl border border-amber-300 px-3.5 py-2 text-xs bg-white"
              />
              <input
                type="text"
                value={settings.promotions_banner_text || ''}
                onChange={(e) =>
                  setSettings({ ...settings, promotions_banner_text: e.target.value })
                }
                placeholder="Descrição da condição especial..."
                className="w-full rounded-xl border border-amber-300 px-3.5 py-2 text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Informações do Rodapé
            </label>
            <input
              type="text"
              value={settings.footer_text || ''}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Salvando...' : 'Salvar e Atualizar Site'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. PÁGINA SOBRE A EMPRESA */}
      {subTab === 'sobre' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
        >
          <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Conteúdo da Página Institucional (Sobre a Empresa)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                História da Empresa (opcional)
              </label>
              <textarea
                rows={4}
                value={settings.about_history || ''}
                onChange={(e) => setSettings({ ...settings, about_history: e.target.value })}
                placeholder="Conte a trajetória da Celina Sousa Turismo..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Objetivo da Empresa
              </label>
              <textarea
                rows={4}
                value={settings.about_objective || ''}
                onChange={(e) => setSettings({ ...settings, about_objective: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Serviços Oferecidos (um item por linha)
              </label>
              <textarea
                rows={5}
                value={servicesText}
                onChange={(e) => setServicesText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Diferenciais da Empresa (um item por linha)
              </label>
              <textarea
                rows={5}
                value={differentialsText}
                onChange={(e) => setDifferentialsText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Salvando...' : 'Salvar Página Sobre'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. PERGUNTAS FREQUENTES (FAQ) */}
      {subTab === 'faq' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveFaq}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h3 className="text-lg font-extrabold text-slate-900">
              {faqForm.id ? 'Editar Pergunta Frequente' : 'Adicionar Nova Pergunta Frequente'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Pergunta *
                </label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="Ex: Como funciona o agendamento?"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  placeholder="Ex: Agendamentos, Pagamentos"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Resposta *
              </label>
              <textarea
                rows={3}
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                placeholder="Digite a resposta oficial..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              {faqForm.id && (
                <button
                  type="button"
                  onClick={() =>
                    setFaqForm({ id: null, question: '', answer: '', category: 'Agendamentos' })
                  }
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-bold shadow"
              >
                <Plus className="w-4 h-4" />
                {faqForm.id ? 'Atualizar Pergunta' : 'Cadastrar Pergunta'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {faqs.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase text-brand-600">
                    {f.category}
                  </span>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {f.question}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">{f.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFaqForm(f)}
                    className="p-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(f.id)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DEPOIMENTOS DE CLIENTES */}
      {subTab === 'depoimentos' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveTestimonial}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
          >
            <h3 className="text-lg font-extrabold text-slate-900">
              {testiForm.id ? 'Editar Depoimento' : 'Cadastrar Depoimento de Cliente'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={testiForm.customer_name}
                  onChange={(e) =>
                    setTestiForm({ ...testiForm, customer_name: e.target.value })
                  }
                  placeholder="Nome do cliente"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Cidade / UF (opcional)
                </label>
                <input
                  type="text"
                  value={testiForm.city_state}
                  onChange={(e) => setTestiForm({ ...testiForm, city_state: e.target.value })}
                  placeholder="Ex: Goiânia - GO"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Clube / Viagem Visitada (opcional)
                </label>
                <input
                  type="text"
                  value={testiForm.item_visited}
                  onChange={(e) => setTestiForm({ ...testiForm, item_visited: e.target.value })}
                  placeholder="Ex: Caldas Locações"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Depoimento *
              </label>
              <textarea
                rows={3}
                value={testiForm.content}
                onChange={(e) => setTestiForm({ ...testiForm, content: e.target.value })}
                placeholder="Texto do depoimento enviado pelo cliente..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-bold shadow"
              >
                <Plus className="w-4 h-4" />
                {testiForm.id ? 'Atualizar Depoimento' : 'Publicar Depoimento'}
              </button>
            </div>
          </form>

          {testimonials.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Nenhum depoimento cadastrado. Quando você cadastrar depoimentos aqui, a seção aparecerá automaticamente na página inicial.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.customer_name}</p>
                    <p className="text-xs text-slate-400">
                      {[t.city_state, t.item_visited].filter(Boolean).join(' • ')}
                    </p>
                    <p className="text-xs text-slate-600 italic mt-2">"{t.content}"</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTestimonial(t.id)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. GALERIA DE IMAGENS DA HOME */}
      {subTab === 'galeria' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              Adicionar Fotos à Galeria da Página Inicial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={galleryTitle}
                onChange={(e) => setGalleryTitle(e.target.value)}
                placeholder="Título da foto (Ex: Piscinas Termais)"
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <input
                type="text"
                value={galleryCategory}
                onChange={(e) => setGalleryCategory(e.target.value)}
                placeholder="Categoria (Ex: Clubes e Piscinas)"
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <label className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 py-2.5 px-4 cursor-pointer shadow">
                <Upload className="w-4 h-4" />
                <span>
                  {uploadingField === 'gallery' ? 'Enviando...' : 'Escolher e Enviar Foto(s)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadGalleryPhoto}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2"
              >
                <img
                  src={g.image_url}
                  alt={g.title}
                  className="w-full h-44 object-cover rounded-xl"
                />
                <div className="flex items-center justify-between gap-2 px-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-brand-600">
                      {g.category}
                    </span>
                    <p className="text-xs font-bold text-slate-900">{g.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryItem(g.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
