import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Upload,
  Image as ImageIcon,
  Calendar,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  X,
  ExternalLink,
  Save,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch, uploadImages, formatDateBR } from '../../lib/api';
import { useApp } from '../../context/AppContext';

const EMPTY_CLUB_FORM = {
  id: null,
  name: '',
  city: 'Caldas Novas',
  state: 'GO',
  address_location: '',
  short_description: '',
  summary_info: '',
  full_description: '',
  characteristics: '',
  structure_available: '',
  pools_info: '',
  leisure_areas: '',
  restaurants_food: '',
  services_available: '',
  usage_rules: '',
  visitor_info: '',
  differentials: '',
  important_notes: '',
  price_info: '',
  payment_conditions: '',
  promotions: '',
  available_dates: '',
  related_packages: '',
  additional_commercial_info: '',
  cover_image: '/assets/images/waterpark-pools.jpg',
  is_featured: true,
  is_published: true,
  images: [],
};

export default function AdminClubsTab({ onDataChanged }) {
  const { showToast, refreshSiteData } = useApp();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClub, setEditingClub] = useState(null);
  const [formSection, setFormSection] = useState('basico'); // basico | estrutura | comercial | galeria | disponibilidade
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Availability form inside club editor
  const [availDate, setAvailDate] = useState('');
  const [availCap, setAvailCap] = useState(20);
  const [availStatus, setAvailStatus] = useState('available');
  const [availPriceNote, setAvailPriceNote] = useState('');

  // New image URL / category input
  const [newImgCategory, setNewImgCategory] = useState('Piscinas e Lazer');
  const [newImgCaption, setNewImgCaption] = useState('');

  const loadClubs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/clubs');
      setClubs(data.clubs || []);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar clubes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const startNewClub = () => {
    setEditingClub({ ...EMPTY_CLUB_FORM, images: [], availability: [] });
    setFormSection('basico');
  };

  const startEditClub = (club) => {
    setEditingClub({
      ...EMPTY_CLUB_FORM,
      ...club,
      images: club.images || [],
      availability: club.availability || [],
    });
    setFormSection('basico');
  };

  const handleSaveClub = async (e) => {
    if (e) e.preventDefault();
    if (!editingClub.name || !editingClub.city || !editingClub.state) {
      showToast('Preencha pelo menos o Nome, Cidade e Estado (UF) do clube.', 'error');
      setFormSection('basico');
      return;
    }

    try {
      setSaving(true);
      if (editingClub.id) {
        const res = await apiFetch(`/api/admin/clubs/${editingClub.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingClub),
        });
        setEditingClub(res.club);
        showToast('Clube atualizado com sucesso!', 'success');
      } else {
        const res = await apiFetch('/api/admin/clubs', {
          method: 'POST',
          body: JSON.stringify(editingClub),
        });
        setEditingClub(res.club);
        showToast('Novo clube cadastrado e publicado com sucesso!', 'success');
      }
      await loadClubs();
      await refreshSiteData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar o clube.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (club) => {
    try {
      await apiFetch(`/api/admin/clubs/${club.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...club,
          is_published: !club.is_published,
        }),
      });
      showToast(
        !club.is_published
          ? `Clube "${club.name}" publicado no site!`
          : `Clube "${club.name}" ocultado do site público.`,
        'info'
      );
      await loadClubs();
      await refreshSiteData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast(err.message || 'Erro ao alterar publicação.', 'error');
    }
  };

  const handleDeleteClub = async (club) => {
    if (!window.confirm(`Tem certeza que deseja excluir o clube "${club.name}"?`)) return;
    try {
      await apiFetch(`/api/admin/clubs/${club.id}`, { method: 'DELETE' });
      showToast('Clube excluído com sucesso.', 'info');
      if (editingClub?.id === club.id) setEditingClub(null);
      await loadClubs();
      await refreshSiteData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir clube.', 'error');
    }
  };

  // Image Upload Handler (works for both unsaved new club and existing club)
  const handleUploadPhotos = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const uploaded = await uploadImages(files);
      const newFiles = uploaded.files || [];

      if (editingClub.id) {
        const imagesPayload = newFiles.map((f, idx) => ({
          image_url: f.url,
          caption: newImgCaption || editingClub.name,
          category: newImgCategory || 'Geral',
          is_primary: editingClub.images.length === 0 && idx === 0,
        }));
        const res = await apiFetch(`/api/admin/clubs/${editingClub.id}/images`, {
          method: 'POST',
          body: JSON.stringify({ images: imagesPayload }),
        });
        setEditingClub(res.club);
        await loadClubs();
        await refreshSiteData();
      } else {
        const appended = [
          ...(editingClub.images || []),
          ...newFiles.map((f, idx) => ({
            id: `temp-${Date.now()}-${idx}`,
            image_url: f.url,
            caption: newImgCaption || editingClub.name,
            category: newImgCategory || 'Geral',
            is_primary: (editingClub.images || []).length === 0 && idx === 0,
          })),
        ];
        setEditingClub((prev) => ({
          ...prev,
          cover_image: appended[0]?.image_url || prev.cover_image,
          images: appended,
        }));
      }
      setNewImgCaption('');
      showToast(`${newFiles.length} foto(s) adicionada(s) com sucesso!`, 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao enviar fotos.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSetPrimaryImage = async (img) => {
    if (!editingClub.id) {
      setEditingClub((prev) => ({
        ...prev,
        cover_image: img.image_url,
        images: prev.images.map((i) => ({ ...i, is_primary: i.id === img.id })),
      }));
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/clubs/${editingClub.id}/images/${img.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_primary: true }),
      });
      setEditingClub(res.club);
      await loadClubs();
      await refreshSiteData();
      showToast('Foto definida como capa principal do clube!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao definir imagem principal.', 'error');
    }
  };

  const handleReplaceImageFile = async (img, fileList) => {
    if (!fileList || fileList.length === 0) return;
    try {
      setUploading(true);
      const uploaded = await uploadImages(fileList);
      const newUrl = uploaded.files?.[0]?.url;
      if (!newUrl) return;

      if (editingClub.id) {
        const res = await apiFetch(`/api/admin/clubs/${editingClub.id}/images/${img.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            image_url: newUrl,
            is_primary: img.is_primary,
          }),
        });
        setEditingClub(res.club);
        await loadClubs();
        await refreshSiteData();
      } else {
        setEditingClub((prev) => ({
          ...prev,
          cover_image: img.is_primary ? newUrl : prev.cover_image,
          images: prev.images.map((i) => (i.id === img.id ? { ...i, image_url: newUrl } : i)),
        }));
      }
      showToast('Imagem substituída com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao substituir imagem.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleMoveImage = async (index, direction) => {
    const list = [...(editingClub.images || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    if (!editingClub.id) {
      setEditingClub((prev) => ({ ...prev, images: list }));
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/clubs/${editingClub.id}/images-reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: list.map((i) => i.id) }),
      });
      setEditingClub(res.club);
      await refreshSiteData();
    } catch (err) {
      showToast('Erro ao reordenar fotos.', 'error');
    }
  };

  const handleDeleteImage = async (img) => {
    if (!editingClub.id) {
      setEditingClub((prev) => ({
        ...prev,
        images: prev.images.filter((i) => i.id !== img.id),
      }));
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/clubs/${editingClub.id}/images/${img.id}`, {
        method: 'DELETE',
      });
      setEditingClub(res.club);
      await loadClubs();
      await refreshSiteData();
      showToast('Foto removida da galeria.', 'info');
    } catch (err) {
      showToast(err.message || 'Erro ao remover foto.', 'error');
    }
  };

  const handleAddAvailability = async () => {
    if (!editingClub?.id) {
      showToast('Salve o clube primeiro antes de cadastrar datas de disponibilidade.', 'info');
      return;
    }
    if (!availDate) {
      showToast('Selecione uma data para cadastrar disponibilidade.', 'error');
      return;
    }
    try {
      const res = await apiFetch('/api/admin/availability', {
        method: 'POST',
        body: JSON.stringify({
          item_type: 'club',
          item_id: editingClub.id,
          available_date: availDate,
          max_capacity: Number(availCap),
          status: availStatus,
          price_note: availPriceNote,
        }),
      });
      setEditingClub((prev) => ({ ...prev, availability: res.availability || [] }));
      setAvailDate('');
      setAvailPriceNote('');
      showToast('Disponibilidade atualizada para a data!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao salvar disponibilidade.', 'error');
    }
  };

  const handleDeleteAvailability = async (slotId) => {
    try {
      await apiFetch(`/api/admin/availability/${slotId}`, { method: 'DELETE' });
      setEditingClub((prev) => ({
        ...prev,
        availability: (prev.availability || []).filter((a) => a.id !== slotId),
      }));
      showToast('Data removida.', 'info');
    } catch (err) {
      showToast('Erro ao remover data.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Gerenciar Clubes</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre clubes, hotéis, parques aquáticos e destinos sem limite de quantidade.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewClub}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Adicionar Novo Clube
        </button>
      </div>

      {/* EDITOR FORM WHEN ADDING OR EDITING A CLUB */}
      {editingClub && (
        <div className="bg-white rounded-3xl border-2 border-brand-500 shadow-xl overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
                {editingClub.id ? `Editando Clube #${editingClub.id}` : 'Novo Cadastro de Clube'}
              </span>
              <h3 className="text-lg font-extrabold">
                {editingClub.name || 'Preencha os dados do clube abaixo'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveClub}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-extrabold shadow"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Clube'}
              </button>
              <button
                type="button"
                onClick={() => setEditingClub(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-navigation inside Club Editor */}
          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-100 border-b border-slate-200 text-xs font-bold">
            {[
              { id: 'basico', label: '1. Dados Principais e Descrição' },
              { id: 'estrutura', label: '2. Estrutura, Piscinas e Regras' },
              { id: 'comercial', label: '3. Valores e Condições Comerciais' },
              { id: 'galeria', label: `4. Galeria de Fotos (${editingClub.images?.length || 0})` },
              { id: 'disponibilidade', label: '5. Datas e Disponibilidade' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFormSection(tab.id)}
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  formSection === tab.id
                    ? 'bg-brand-600 text-white shadow'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveClub} className="p-6 sm:p-8 space-y-6">
            {/* SECTION 1: BASIC INFO */}
            {formSection === 'basico' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Nome do Clube / Estabelecimento *
                    </label>
                    <input
                      type="text"
                      value={editingClub.name}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, name: e.target.value })
                      }
                      placeholder="Ex: Clube Águas Termais Caldas"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={editingClub.city}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, city: e.target.value })
                      }
                      placeholder="Ex: Caldas Novas"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Estado (UF) *
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editingClub.state}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, state: e.target.value.toUpperCase() })
                      }
                      placeholder="GO"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm uppercase outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Localização / Endereço / Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={editingClub.address_location || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, address_location: e.target.value })
                    }
                    placeholder="Informe endereço ou localização se desejar..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Breve Descrição (exibida no card)
                    </label>
                    <textarea
                      rows={3}
                      value={editingClub.short_description || ''}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, short_description: e.target.value })
                      }
                      placeholder="Resumo atraente de 1 ou 2 frases sobre o clube..."
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Informações Resumidas (separadas por ponto e vírgula ou linha)
                    </label>
                    <textarea
                      rows={3}
                      value={editingClub.summary_info || ''}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, summary_info: e.target.value })
                      }
                      placeholder="Ex: Piscinas termais; Área infantil; Restaurante no local; Estacionamento"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Descrição Completa
                  </label>
                  <textarea
                    rows={5}
                    value={editingClub.full_description || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, full_description: e.target.value })
                    }
                    placeholder="Apresentação detalhada do clube, ambiente, atrações e experiência..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingClub.is_published)}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, is_published: e.target.checked })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <span>Publicar clube no site público</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingClub.is_featured)}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, is_featured: e.target.checked })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <span>Exibir em Destaque na Página Inicial</span>
                  </label>
                </div>
              </div>
            )}

            {/* SECTION 2: STRUCTURE & RULES */}
            {formSection === 'estrutura' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Características
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.characteristics || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, characteristics: e.target.value })
                    }
                    placeholder="Características gerais do clube..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Estrutura Disponível
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.structure_available || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, structure_available: e.target.value })
                    }
                    placeholder="Vestiários, quiosques, guarda-volumes, estacionamento..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Piscinas
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.pools_info || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, pools_info: e.target.value })
                    }
                    placeholder="Piscinas termais, piscina de ondas, infantil, toboáguas..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Áreas de Lazer
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.leisure_areas || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, leisure_areas: e.target.value })
                    }
                    placeholder="Quadras, espaço kids, áreas verdes, saunas..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Restaurantes e Alimentação
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.restaurants_food || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, restaurants_food: e.target.value })
                    }
                    placeholder="Restaurantes, lanchonetes, bar molhado..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Serviços Disponíveis
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.services_available || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, services_available: e.target.value })
                    }
                    placeholder="Salva-vidas, wi-fi, locação de armários..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Diferenciais
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.differentials || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, differentials: e.target.value })
                    }
                    placeholder="Principais diferenciais deste clube..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Informações para Visitantes
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.visitor_info || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, visitor_info: e.target.value })
                    }
                    placeholder="Horários de abertura, documentos necessários..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Regras de Utilização
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.usage_rules || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, usage_rules: e.target.value })
                    }
                    placeholder="Regras sobre trajes de banho, entrada de alimentos/bebidas..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Observações Importantes
                  </label>
                  <textarea
                    rows={3}
                    value={editingClub.important_notes || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, important_notes: e.target.value })
                    }
                    placeholder="Avisos extras importantes..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            {/* SECTION 3: COMMERCIAL INFO */}
            {formSection === 'comercial' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Valores (quando cadastrados)
                  </label>
                  <input
                    type="text"
                    value={editingClub.price_info || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, price_info: e.target.value })
                    }
                    placeholder="Ex: Day Use a partir de R$ 80,00 ou Sob consulta"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Condições de Pagamento
                  </label>
                  <input
                    type="text"
                    value={editingClub.payment_conditions || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, payment_conditions: e.target.value })
                    }
                    placeholder="Ex: Pix, Cartão de Crédito..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Promoções (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={editingClub.promotions || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, promotions: e.target.value })
                    }
                    placeholder="Condições promocionais vigentes..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Datas Disponíveis / Dias de Funcionamento
                  </label>
                  <textarea
                    rows={2}
                    value={editingClub.available_dates || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, available_dates: e.target.value })
                    }
                    placeholder="Ex: Terça a Domingo das 08h às 18h"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Pacotes Relacionados
                  </label>
                  <textarea
                    rows={2}
                    value={editingClub.related_packages || ''}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, related_packages: e.target.value })
                    }
                    placeholder="Ex: Combo hospedagem + acesso ao clube..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Informações Comerciais Adicionais
                  </label>
                  <textarea
                    rows={2}
                    value={editingClub.additional_commercial_info || ''}
                    onChange={(e) =>
                      setEditingClub({
                        ...editingClub,
                        additional_commercial_info: e.target.value,
                      })
                    }
                    placeholder="Crianças até X anos, grupos, excursões..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            {/* SECTION 4: GALLERY & UPLOAD */}
            {formSection === 'galeria' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-brand-50/70 border border-brand-200 space-y-4">
                  <h4 className="text-sm font-extrabold text-brand-950 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-brand-600" />
                    Enviar Novas Fotos do Celular ou Computador
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Categoria das Fotos
                      </label>
                      <input
                        type="text"
                        value={newImgCategory}
                        onChange={(e) => setNewImgCategory(e.target.value)}
                        placeholder="Ex: Piscinas, Lazer, Restaurante"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Legenda (opcional)
                      </label>
                      <input
                        type="text"
                        value={newImgCaption}
                        onChange={(e) => setNewImgCaption(e.target.value)}
                        placeholder="Descrição da foto..."
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow">
                        <Upload className="w-4 h-4" />
                        <span>{uploading ? 'Enviando...' : 'Escolher e Enviar Fotos'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleUploadPhotos}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Current Gallery Grid */}
                {(editingClub.images || []).length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    Nenhuma foto na galeria ainda. Envie fotos acima para ilustrar o clube.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {editingClub.images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className={`rounded-2xl border p-3 bg-white space-y-2.5 ${
                          img.is_primary
                            ? 'border-brand-500 ring-2 ring-brand-200'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="relative h-40 rounded-xl overflow-hidden bg-slate-100">
                          <img
                            src={img.image_url}
                            alt={img.caption || 'Foto do clube'}
                            className="w-full h-full object-cover"
                          />
                          {Boolean(img.is_primary) && (
                            <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-brand-600 text-white text-[11px] font-bold shadow">
                              Foto Principal / Capa
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-semibold">
                            {img.category || 'Geral'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                          {!img.is_primary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img)}
                              className="px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 text-[11px] font-bold"
                            >
                              Definir Principal
                            </button>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, -1)}
                              disabled={idx === 0}
                              title="Mover para trás"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 1)}
                              disabled={idx === editingClub.images.length - 1}
                              title="Mover para frente"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <label
                              title="Substituir esta imagem"
                              className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold cursor-pointer"
                            >
                              Trocar
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleReplaceImageFile(img, e.target.files)}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img)}
                              title="Excluir foto"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 5: AVAILABILITY CALENDAR */}
            {formSection === 'disponibilidade' && (
              <div className="space-y-6">
                {!editingClub.id ? (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900">
                    Clique em <strong>"Salvar Clube"</strong> primeiro para liberar o cadastro de
                    datas específicas de disponibilidade e controle de vagas.
                  </div>
                ) : (
                  <>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-600" />
                        Cadastrar ou Atualizar Disponibilidade por Data
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Data *
                          </label>
                          <input
                            type="date"
                            value={availDate}
                            onChange={(e) => setAvailDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Capacidade Máx. (pessoas)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={availCap}
                            onChange={(e) => setAvailCap(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Situação da Data
                          </label>
                          <select
                            value={availStatus}
                            onChange={(e) => setAvailStatus(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white font-semibold"
                          >
                            <option value="available">Disponível</option>
                            <option value="limited">Poucas Vagas</option>
                            <option value="blocked">Bloqueada / Indisponível</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={handleAddAvailability}
                            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow"
                          >
                            Salvar Data
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Observação de Valor para esta Data (opcional)
                        </label>
                        <input
                          type="text"
                          value={availPriceNote}
                          onChange={(e) => setAvailPriceNote(e.target.value)}
                          placeholder="Ex: Tarifa de feriado ou final de semana..."
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-bold uppercase text-slate-500">
                        Datas Cadastradas ({editingClub.availability?.length || 0})
                      </h5>
                      {(editingClub.availability || []).length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Nenhuma data específica cadastrada. Solicitações para datas não listadas
                          entram automaticamente como "Aguardando análise".
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {editingClub.availability.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">
                                  {formatDateBR(slot.available_date)}
                                </p>
                                <p className="text-slate-500">
                                  Status: <strong>{slot.status}</strong> • Confirmados:{' '}
                                  {slot.confirmed_count}/{slot.max_capacity || '∞'}
                                </p>
                                {slot.price_note && (
                                  <p className="text-brand-700 font-medium">{slot.price_note}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteAvailability(slot.id)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Footer Save Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingClub(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-bold"
              >
                Fechar Editor
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-extrabold shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Alterações do Clube'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CLUBS LIST */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <p className="text-base font-bold text-slate-800">
            Nenhum clube cadastrado no momento.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Clique em "Adicionar Novo Clube" acima para cadastrar seu primeiro estabelecimento com
            fotos, estrutura e valores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={club.cover_image || '/assets/images/waterpark-pools.jpg'}
                  alt={club.name}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        club.is_published
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {club.is_published ? 'Publicado' : 'Oculto'}
                    </span>
                    {club.is_featured && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500" />
                        Destaque
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">{club.name}</h3>
                  <p className="text-xs text-slate-500">
                    {club.city}/{club.state} • {club.images?.length || 0} foto(s)
                  </p>
                  {club.price_info && (
                    <p className="text-xs font-bold text-brand-700">{club.price_info}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => startEditClub(club)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePublish(club)}
                  title={club.is_published ? 'Desativar publicação' : 'Publicar no site'}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                >
                  {club.is_published ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      Publicar
                    </>
                  )}
                </button>

                {club.is_published && (
                  <Link
                    to={`/clubes/${club.slug}`}
                    target="_blank"
                    title="Visualizar página pública do clube"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteClub(club)}
                  title="Excluir clube"
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
