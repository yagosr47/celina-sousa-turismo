import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  Eye,
  MessageCircle,
  ShieldAlert,
  CheckCircle2,
  X,
  Calendar,
} from 'lucide-react';
import {
  apiFetch,
  buildWhatsAppUrl,
  formatDateBR,
  formatDateTimeBR,
} from '../../lib/api';
import { useApp } from '../../context/AppContext';

export default function AdminCustomersTab({ onDataChanged }) {
  const { showToast } = useApp();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Deactivation justification state
  const [deactReason, setDeactReason] = useState('');
  const [deactAuthorized, setDeactAuthorized] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const data = await apiFetch(`/api/admin/customers${q}`);
      setCustomers(data.customers || []);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar clientes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const openCustomerHistory = async (customerId) => {
    try {
      setLoadingDetail(true);
      setDeactReason('');
      setDeactAuthorized(false);
      const data = await apiFetch(`/api/admin/customers/${customerId}`);
      setSelectedDetail(data);
    } catch (err) {
      showToast('Erro ao consultar histórico do cliente.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleAccountStatus = async (nextActive) => {
    if (!selectedDetail?.customer) return;
    const customerId = selectedDetail.customer.id;
    try {
      setUpdatingStatus(true);
      const res = await apiFetch(`/api/admin/customers/${customerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          is_active: nextActive,
          reason: deactReason,
          authorized: deactAuthorized,
        }),
      });
      showToast(res.message, 'info');
      await openCustomerHistory(customerId);
      await loadCustomers();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar status da conta.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Gerenciamento de Clientes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Consulte clientes cadastrados, pesquise por nome ou e-mail e veja o histórico de solicitações.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {customers.length} cliente(s) cadastrado(s)
          </span>
        </div>

        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar cliente pelo nome, e-mail ou telefone..."
            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-20 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          Nenhum cliente encontrado para a pesquisa atual.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold">
                  <th className="py-3.5 px-4">Nome Completo</th>
                  <th className="py-3.5 px-4">E-mail</th>
                  <th className="py-3.5 px-4">Telefone / WhatsApp</th>
                  <th className="py-3.5 px-4">Solicitações</th>
                  <th className="py-3.5 px-4">Status da Conta</th>
                  <th className="py-3.5 px-4">Cadastro</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-4 px-4 text-slate-700">{c.email}</td>
                    <td className="py-4 px-4 text-slate-700">{c.phone || '—'}</td>
                    <td className="py-4 px-4 font-extrabold text-brand-700">
                      {c.bookings_count || 0}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.is_active ? 'Ativa' : 'Desativada'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {formatDateTimeBR(c.created_at)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openCustomerHistory(c.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Histórico
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL & HISTORY MODAL */}
      {(selectedDetail || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-brand-300 uppercase font-bold">
                  Ficha de Atendimento do Cliente
                </span>
                <h3 className="text-lg font-extrabold">
                  {selectedDetail?.customer?.name || 'Carregando...'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Carregando ficha do cliente...
              </div>
            ) : (
              selectedDetail && (
                <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                  {/* Customer Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-400 text-xs block">E-mail</span>
                      <strong className="text-slate-900">{selectedDetail.customer.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Telefone / WhatsApp</span>
                      <strong className="text-slate-900">
                        {selectedDetail.customer.phone || 'Não informado'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Consentimento LGPD</span>
                      <strong className="text-emerald-700">
                        {selectedDetail.customer.lgpd_consent ? 'Confirmado' : 'Pendente'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Segurança de Senha</span>
                      <strong className="text-slate-600">
                        Protegida por criptografia (oculta por privacidade)
                      </strong>
                    </div>
                  </div>

                  {selectedDetail.customer.phone && (
                    <a
                      href={buildWhatsAppUrl(
                        selectedDetail.customer.phone,
                        `Olá ${selectedDetail.customer.name}! Aqui é da Celina Sousa Turismo.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Iniciar Atendimento no WhatsApp
                    </a>
                  )}

                  {/* Bookings History */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Histórico de Solicitações ({selectedDetail.bookings?.length || 0})
                    </h4>
                    {(selectedDetail.bookings || []).length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Este cliente ainda não enviou solicitações de agendamento.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedDetail.bookings.map((b) => (
                          <div
                            key={b.id}
                            className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-brand-700">
                                {b.booking_code}
                              </span>{' '}
                              • <strong>{b.item_name}</strong>
                              <p className="text-slate-500 mt-0.5">
                                Data desejada: {formatDateBR(b.desired_date)} ({b.people_count}{' '}
                                pessoa(s))
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-800">
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Account Status Control */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-slate-500" />
                      Controle de Status da Conta
                    </h4>

                    {selectedDetail.customer.is_active ? (
                      <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                        <p className="text-xs text-rose-900 font-semibold">
                          Desativar conta do cliente (exige justificativa e autorização):
                        </p>
                        <input
                          type="text"
                          value={deactReason}
                          onChange={(e) => setDeactReason(e.target.value)}
                          placeholder="Informe a justificativa administrativa..."
                          className="w-full rounded-xl border border-rose-300 px-3 py-2 text-xs bg-white"
                        />
                        <label className="flex items-center gap-2 text-xs text-rose-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deactAuthorized}
                            onChange={(e) => setDeactAuthorized(e.target.checked)}
                            className="rounded border-rose-300 text-rose-600"
                          />
                          <span>
                            Autorizo a desativação desta conta com a justificativa informada acima.
                          </span>
                        </label>
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleToggleAccountStatus(false)}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                        >
                          {updatingStatus ? 'Processando...' : 'Desativar Conta'}
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                        <p className="text-amber-900">
                          <strong>Conta Desativada.</strong> Justificativa registrada:{' '}
                          {selectedDetail.customer.deactivation_reason || 'Não informada'}
                        </p>
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleToggleAccountStatus(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Reativar Conta do Cliente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
