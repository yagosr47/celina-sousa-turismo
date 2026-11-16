import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Eye,
  MessageCircle,
  CheckCircle2,
  Calendar,
  Users,
  X,
  Save,
} from 'lucide-react';
import {
  apiFetch,
  buildWhatsAppUrl,
  formatDateBR,
  formatDateTimeBR,
} from '../../lib/api';
import { useApp } from '../../context/AppContext';

const BOOKING_STATUSES = [
  'Aguardando análise',
  'Aprovado',
  'Recusado',
  'Aguardando pagamento',
  'Confirmado',
  'Cancelado',
  'Concluído',
];

const STATUS_BADGE = {
  'Aguardando análise': 'bg-amber-100 text-amber-800 border-amber-300',
  Aprovado: 'bg-sky-100 text-sky-800 border-sky-300',
  'Aguardando pagamento': 'bg-purple-100 text-purple-800 border-purple-300',
  Confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Recusado: 'bg-rose-100 text-rose-800 border-rose-300',
  Cancelado: 'bg-slate-200 text-slate-700 border-slate-300',
  Concluído: 'bg-brand-100 text-brand-800 border-brand-300',
};

export default function AdminBookingsTab({ onDataChanged }) {
  const { showToast, refreshNotifications } = useApp();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPeople, setEditPeople] = useState(1);
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [editCustomerFeedback, setEditCustomerFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const data = await apiFetch(`/api/admin/bookings?${params.toString()}`);
      setBookings(data.bookings || []);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar solicitações.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, showToast]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const openBookingDetail = (b) => {
    setSelectedBooking(b);
    setEditStatus(b.status);
    setEditDate(b.desired_date);
    setEditPeople(b.people_count);
    setEditAdminNotes(b.admin_notes || '');
    setEditCustomerFeedback(b.customer_feedback_note || '');
  };

  const handleSaveBookingUpdate = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      setSaving(true);
      const res = await apiFetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editStatus,
          desired_date: editDate,
          people_count: Number(editPeople),
          admin_notes: editAdminNotes,
          customer_feedback_note: editCustomerFeedback,
        }),
      });
      setSelectedBooking(res.booking);
      showToast(res.message || 'Solicitação atualizada com sucesso!', 'success');
      await loadBookings();
      await refreshNotifications();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar a solicitação.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Gerenciamento de Agendamentos e Solicitações
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Analise solicitações, aprove, recuse, confirme reservas e registre observações.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {bookings.length} solicitação(ões) encontrada(s)
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código (CST-...), nome do cliente, e-mail ou clube/viagem..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold bg-white outline-none focus:border-brand-500"
            >
              <option value="">Todos os Status</option>
              {BOOKING_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table / Cards of Bookings */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          Nenhuma solicitação encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Nome do Cliente & Contato</th>
                  <th className="py-3.5 px-4">Clube ou Viagem</th>
                  <th className="py-3.5 px-4">Data Solicitada</th>
                  <th className="py-3.5 px-4">Pessoas</th>
                  <th className="py-3.5 px-4">Data da Solicitação</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-extrabold text-brand-700">
                      {b.booking_code}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">{b.customer_name}</p>
                      <p className="text-xs text-slate-500">
                        {b.customer_phone} • {b.customer_email}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{b.item_name}</td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {formatDateBR(b.desired_date)}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">{b.people_count}</td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {formatDateTimeBR(b.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          STATUS_BADGE[b.status] || 'bg-slate-100'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openBookingDetail(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Gerenciar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL & STATUS UPDATE MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-brand-300">
                  Solicitação #{selectedBooking.booking_code}
                </span>
                <h3 className="text-lg font-extrabold">{selectedBooking.item_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBookingUpdate} className="p-6 sm:p-8 space-y-5">
              {/* Customer Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 text-xs block">Cliente</span>
                  <strong className="text-slate-900">{selectedBooking.customer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Telefone / WhatsApp</span>
                  <strong className="text-slate-900">{selectedBooking.customer_phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">E-mail</span>
                  <strong className="text-slate-900 break-all">
                    {selectedBooking.customer_email}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Registrado em</span>
                  <strong className="text-slate-900">
                    {formatDateTimeBR(selectedBooking.created_at)}
                  </strong>
                </div>
              </div>

              {selectedBooking.additional_info && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">
                    Informações Adicionais enviadas pelo Cliente:
                  </span>
                  <p className="text-amber-800">{selectedBooking.additional_info}</p>
                </div>
              )}

              {/* Quick Status Buttons */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                  Atualizar Status da Solicitação
                </label>
                <div className="flex flex-wrap gap-2">
                  {BOOKING_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        editStatus === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Data Solicitada / Agendada
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Quantidade de Pessoas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPeople}
                    onChange={(e) => setEditPeople(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Mensagem / Retorno para o Cliente (visível na conta do cliente)
                </label>
                <textarea
                  rows={2}
                  value={editCustomerFeedback}
                  onChange={(e) => setEditCustomerFeedback(e.target.value)}
                  placeholder="Ex: Disponibilidade confirmada! Entre em contato pelo WhatsApp para envio do comprovante..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Observações Administrativas Internas (visível apenas para a Celina)
                </label>
                <textarea
                  rows={2}
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Anotações internas sobre pagamento, vouchers ou atendimento..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <a
                  href={buildWhatsAppUrl(
                    selectedBooking.customer_phone,
                    `Olá ${selectedBooking.customer_name}! Aqui é da Celina Sousa Turismo sobre sua solicitação *${selectedBooking.booking_code}* (${selectedBooking.item_name} para ${formatDateBR(editDate)}). Status atual: *${editStatus}*.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chamar Cliente no WhatsApp
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-extrabold shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Salvando...' : 'Salvar e Notificar Cliente'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
