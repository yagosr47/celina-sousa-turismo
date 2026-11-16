import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  X,
  ExternalLink,
  Save,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch, uploadImages, formatDateBR, getCustomerSiteUrl } from '../../lib/api';
import { useApp } from '../../context/AppContext';

const EMPTY_TRIP_FORM = {
  id: null,
  name: '',
  destination: '',
  cover_image: '/assets/images/travel-excursion.jpg',
  short_description: '',
  full_description: '',
  departure_date: '',
  return_date: '',
  departure_time: '',
  boarding_location: '',
  price_per_person: '',
  payment_methods: '',
  included_items: '',
  not_included_items: '',
  transport_info: '',
  lodging_info: '',
  total_spots: '',
  available_spots: '',
  notes: '',
  status: 'Disponível',
  is_featured: true,
  is_published: true,
  images: [],
};

const TRIP_STATUSES = ['Disponível', 'Poucas vagas', 'Esgotada', 'Encerrada', 'Em breve'];

export default function AdminTripsTab({ onDataChanged }) {
  const { showToast, refreshSiteData } = useApp();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTrip, setEditingTrip] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/trips');
      setTrips(data.trips || []);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar viagens.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const startNewTrip = () => {
    setEditingTrip({ ...EMPTY_TRIP_FORM, images: [] });
  };

  const startEditTrip = (trip) => {
    setEditingTrip({
      ...EMPTY_TRIP_FORM,
      ...trip,
      total_spots: trip.total_spots ?? '',
      available_spots: trip.available_spots ?? '',
      images: trip.images || [],
    });
  };

  const handleSaveTrip = async (e) => {
    if (e) e.preventDefault();
    if (!editingTrip.name || !editingTrip.destination) {
      showToast('Preencha o Nome da Viagem e o Destino.', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingTrip.id) {
        const res = await apiFetch(`/api/admin/trips/${editingTrip.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingTrip),
        });
        setEditingTrip(res.trip);
        showToast('Viagem atualizada com sucesso!', 'success');
      } else {
        const res = await apiFetch('/api/admin/trips', {
          method: 'POST',
          body: JSON.stringify(editingTrip),
        });
        setEditingTrip(res.trip);
        showToast('Nova viagem cadastrada com sucesso!', 'success');
      }
      await loadTrips();
      await refreshSiteData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar viagem.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (trip) => {
    try {
      await apiFetch(`/api/admin/trips/${trip.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...trip,
          is_published: !trip.is_published,
        }),
      });
      showToast(
        !trip.is_published
          ? `Viagem "${trip.name}" publicada no site!`
          : `Viagem "${trip.name}" retirada do site público.`,
        'info'
      );
      await loadTrips();
      await refreshSiteData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast('Erro ao alterar publicação.', 'error');
    }
  };

  const handleDeleteTrip = async (trip) => {
    if (!window.confirm(`Tem certeza que deseja excluir a viagem "${trip.name}"?`)) return;
    try {
      await apiFetch(`/api/admin/trips/${trip.id}`, { method: 'DELETE' });
      showToast('Viagem excluída com sucesso.', 'info');
      if (editingTrip?.id === trip.id) setEditingTrip(null);
      await loadTrips();
      await refreshSiteData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast('Erro ao excluir viagem.', 'error');
    }
  };

  const handleUploadTripPhotos = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const uploaded = await uploadImages(files);
      const newFiles = uploaded.files || [];

      if (editingTrip.id) {
        const imagesPayload = newFiles.map((f, idx) => ({
          image_url: f.url,
          caption: editingTrip.name,
          category: 'Roteiro',
          is_primary: editingTrip.images.length === 0 && idx === 0,
        }));
        const res = await apiFetch(`/api/admin/trips/${editingTrip.id}/images`, {
          method: 'POST',
          body: JSON.stringify({ images: imagesPayload }),
        });
        setEditingTrip(res.trip);
        await loadTrips();
        await refreshSiteData();
      } else {
        const appended = [
          ...(editingTrip.images || []),
          ...newFiles.map((f, idx) => ({
            id: `temp-${Date.now()}-${idx}`,
            image_url: f.url,
            caption: editingTrip.name,
            category: 'Roteiro',
            is_primary: (editingTrip.images || []).length === 0 && idx === 0,
          })),
        ];
        setEditingTrip((prev) => ({
          ...prev,
          cover_image: appended[0]?.image_url || prev.cover_image,
          images: appended,
        }));
      }
      showToast(`${newFiles.length} foto(s) adicionada(s) à viagem!`, 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao enviar fotos.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSetPrimaryTripImage = async (img) => {
    if (!editingTrip.id) {
      setEditingTrip((prev) => ({
        ...prev,
        cover_image: img.image_url,
        images: prev.images.map((i) => ({ ...i, is_primary: i.id === img.id })),
      }));
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/trips/${editingTrip.id}/images/${img.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_primary: true }),
      });
      setEditingTrip(res.trip);
      await loadTrips();
      await refreshSiteData();
      showToast('Foto principal da viagem atualizada!', 'success');
    } catch (err) {
      showToast('Erro ao definir foto principal.', 'error');
    }
  };

  const handleDeleteTripImage = async (img) => {
    if (!editingTrip.id) {
      setEditingTrip((prev) => ({
        ...prev,
        images: prev.images.filter((i) => i.id !== img.id),
      }));
      return;
    }
    try {
      const res = await apiFetch(`/api/admin/trips/${editingTrip.id}/images/${img.id}`, {
        method: 'DELETE',
      });
      setEditingTrip(res.trip);
      await loadTrips();
      await refreshSiteData();
      showToast('Foto removida.', 'info');
    } catch (err) {
      showToast('Erro ao remover foto.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Gerenciar Viagens</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre excursões, pacotes e viagens com datas, valores, vagas, transporte e hospedagem.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewTrip}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-extrabold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Criar Nova Viagem
        </button>
      </div>

      {/* TRIP EDITOR */}
      {editingTrip && (
        <div className="bg-white rounded-3xl border-2 border-brand-500 shadow-xl overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
                {editingTrip.id ? `Editando Viagem #${editingTrip.id}` : 'Nova Viagem / Pacote'}
              </span>
              <h3 className="text-lg font-extrabold">
                {editingTrip.name || 'Preencha os detalhes da viagem'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveTrip}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-extrabold shadow"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Viagem'}
              </button>
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveTrip} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nome da Viagem *
                </label>
                <input
                  type="text"
                  value={editingTrip.name}
                  onChange={(e) => setEditingTrip({ ...editingTrip, name: e.target.value })}
                  placeholder="Ex: Excursão Caldas Novas Fim de Semana"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Destino *
                </label>
                <input
                  type="text"
                  value={editingTrip.destination}
                  onChange={(e) => setEditingTrip({ ...editingTrip, destination: e.target.value })}
                  placeholder="Ex: Caldas Novas - GO"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Data de Saída
                </label>
                <input
                  type="date"
                  value={editingTrip.departure_date || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, departure_date: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Data de Retorno
                </label>
                <input
                  type="date"
                  value={editingTrip.return_date || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, return_date: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Horário de Saída
                </label>
                <input
                  type="text"
                  value={editingTrip.departure_time || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, departure_time: e.target.value })
                  }
                  placeholder="Ex: 06:00"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Status da Viagem *
                </label>
                <select
                  value={editingTrip.status}
                  onChange={(e) => setEditingTrip({ ...editingTrip, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold bg-white outline-none focus:border-brand-500"
                >
                  {TRIP_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Local de Embarque
                </label>
                <input
                  type="text"
                  value={editingTrip.boarding_location || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, boarding_location: e.target.value })
                  }
                  placeholder="Ponto de partida..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Valor por Pessoa
                </label>
                <input
                  type="text"
                  value={editingTrip.price_per_person || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, price_per_person: e.target.value })
                  }
                  placeholder="Ex: R$ 450,00 ou Sob consulta"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Quantidade Total de Vagas
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingTrip.total_spots}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, total_spots: e.target.value })
                  }
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Vagas Disponíveis
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingTrip.available_spots}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, available_spots: e.target.value })
                  }
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Formas de Pagamento
              </label>
              <input
                type="text"
                value={editingTrip.payment_methods || ''}
                onChange={(e) =>
                  setEditingTrip({ ...editingTrip, payment_methods: e.target.value })
                }
                placeholder="Ex: Pix, parcelamento no cartão..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Breve Descrição (exibida no card)
                </label>
                <textarea
                  rows={2}
                  value={editingTrip.short_description || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, short_description: e.target.value })
                  }
                  placeholder="Resumo curto do roteiro..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Descrição Completa
                </label>
                <textarea
                  rows={2}
                  value={editingTrip.full_description || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, full_description: e.target.value })
                  }
                  placeholder="Programação completa da viagem..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  O que está incluso
                </label>
                <textarea
                  rows={3}
                  value={editingTrip.included_items || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, included_items: e.target.value })
                  }
                  placeholder="Transporte executivo, hospedagem, ingressos..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  O que não está incluso
                </label>
                <textarea
                  rows={3}
                  value={editingTrip.not_included_items || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, not_included_items: e.target.value })
                  }
                  placeholder="Despesas pessoais, alimentação extra..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Informações sobre Transporte
                </label>
                <textarea
                  rows={2}
                  value={editingTrip.transport_info || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, transport_info: e.target.value })
                  }
                  placeholder="Ônibus turismo, ar-condicionado..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Informações sobre Hospedagem
                </label>
                <textarea
                  rows={2}
                  value={editingTrip.lodging_info || ''}
                  onChange={(e) =>
                    setEditingTrip({ ...editingTrip, lodging_info: e.target.value })
                  }
                  placeholder="Hotel, pousada ou locação..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={editingTrip.notes || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, notes: e.target.value })}
                  placeholder="Avisos importantes para os passageiros..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Trip Gallery Upload */}
            <div className="p-5 rounded-2xl bg-brand-50/70 border border-brand-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-extrabold text-brand-950">
                  Fotos da Viagem ({editingTrip.images?.length || 0})
                </h4>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold cursor-pointer shadow">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Enviando...' : 'Adicionar Fotos'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadTripPhotos}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {(editingTrip.images || []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {editingTrip.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className={`p-2 rounded-xl bg-white border space-y-2 ${
                        img.is_primary ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt="Foto viagem"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <div className="flex items-center justify-between gap-1">
                        {img.is_primary ? (
                          <span className="text-[10px] font-bold text-brand-700">Capa Principal</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryTripImage(img)}
                            className="text-[10px] font-bold text-slate-600 hover:text-brand-700"
                          >
                            Definir Capa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTripImage(img)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingTrip.is_published)}
                    onChange={(e) =>
                      setEditingTrip({ ...editingTrip, is_published: e.target.checked })
                    }
                    className="rounded border-slate-300 text-brand-600 w-4 h-4"
                  />
                  <span>Publicar viagem no site</span>
                </label>

                <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingTrip.is_featured)}
                    onChange={(e) =>
                      setEditingTrip({ ...editingTrip, is_featured: e.target.checked })
                    }
                    className="rounded border-slate-300 text-brand-600 w-4 h-4"
                  />
                  <span>Destacar na Página Inicial</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-extrabold shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Viagem'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TRIPS LIST */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <p className="text-base font-bold text-slate-800">Nenhuma viagem cadastrada ainda.</p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Clique em "Criar Nova Viagem" acima para adicionar uma excursão ou pacote turístico.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={trip.cover_image || '/assets/images/travel-excursion.jpg'}
                  alt={trip.name}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        trip.is_published
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {trip.is_published ? 'Publicada' : 'Oculta'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold">
                      {trip.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">{trip.name}</h3>
                  <p className="text-xs text-slate-500">
                    Destino: {trip.destination}
                    {trip.departure_date ? ` • Saída: ${formatDateBR(trip.departure_date)}` : ''}
                  </p>
                  <p className="text-xs font-bold text-brand-700">
                    {trip.price_per_person || 'Valor sob consulta'}
                    {trip.available_spots !== null && trip.available_spots !== undefined
                      ? ` • ${trip.available_spots} vaga(s)`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => startEditTrip(trip)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(trip)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                >
                  {trip.is_published ? (
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
                {trip.is_published && (
                  <a
                    href={getCustomerSiteUrl(`/viagens/${trip.slug}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Visualizar página pública da viagem no Site de Clientes"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteTrip(trip)}
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
