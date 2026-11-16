import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiFetch, buildWhatsAppUrl, formatDateBR } from '../lib/api';

export default function BookingModal() {
  const {
    bookingModal,
    closeBookingModal,
    siteData,
    user,
    showToast,
    refreshNotifications,
  } = useApp();

  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [itemType, setItemType] = useState('club');
  const [itemId, setItemId] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [peopleCount, setPeopleCount] = useState(2);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [availabilityState, setAvailabilityState] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const clubs = siteData.clubs || [];
  const trips = siteData.trips || [];
  const settings = siteData.settings || {};

  useEffect(() => {
    if (bookingModal.isOpen) {
      setStep(1);
      setCreatedBooking(null);
      setErrorMsg('');
      setAvailabilityState(null);

      const initialType = bookingModal.itemType || (clubs.length > 0 ? 'club' : trips.length > 0 ? 'trip' : 'destination');
      setItemType(initialType);

      if (bookingModal.itemId) {
        setItemId(String(bookingModal.itemId));
      } else if (initialType === 'club' && clubs.length > 0) {
        setItemId(String(clubs[0].id));
      } else if (initialType === 'trip' && trips.length > 0) {
        setItemId(String(trips[0].id));
      } else {
        setItemId('');
      }

      setCustomItemName(bookingModal.itemName || '');
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      setDesiredDate(bookingModal.defaultDate || tomorrow);
      setReturnDate('');
      setPeopleCount(2);
      setAdditionalInfo('');

      setCustomerName(user?.name || '');
      setCustomerEmail(user?.email || '');
      setCustomerPhone(user?.phone || '');
    }
  }, [bookingModal.isOpen, bookingModal.itemType, bookingModal.itemId, bookingModal.itemName, bookingModal.defaultDate, user, clubs.length, trips.length]);

  // Real-time availability check when item, date, or peopleCount changes
  useEffect(() => {
    if (!bookingModal.isOpen) return;
    if ((itemType === 'club' || itemType === 'trip') && itemId && desiredDate) {
      let active = true;
      setCheckingAvail(true);
      apiFetch(
        `/api/public/check-availability?itemType=${encodeURIComponent(itemType)}&itemId=${encodeURIComponent(itemId)}&desiredDate=${encodeURIComponent(desiredDate)}&peopleCount=${encodeURIComponent(peopleCount)}`
      )
        .then((res) => {
          if (active) setAvailabilityState(res);
        })
        .catch(() => {
          if (active) setAvailabilityState(null);
        })
        .finally(() => {
          if (active) setCheckingAvail(false);
        });
      return () => {
        active = false;
      };
    } else {
      setAvailabilityState({
        canRequest: true,
        hasConfirmedAvailability: false,
        status: 'pending_verification',
        message:
          'Solicitação sujeita à verificação de disponibilidade pela Celina. O pedido será registrado como "Aguardando análise" sem confirmação imediata.',
      });
    }
  }, [bookingModal.isOpen, itemType, itemId, desiredDate, peopleCount]);

  if (!bookingModal.isOpen) return null;

  const selectedEntityName = () => {
    if (itemType === 'club') {
      const c = clubs.find((x) => String(x.id) === String(itemId));
      return c ? c.name : customItemName;
    }
    if (itemType === 'trip') {
      const t = trips.find((x) => String(x.id) === String(itemId));
      return t ? t.name : customItemName;
    }
    return customItemName;
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      const name = selectedEntityName();
      if (!name || name.trim().length < 2) {
        setErrorMsg('Selecione um clube, viagem ou informe o destino desejado.');
        return;
      }
      if (!desiredDate) {
        setErrorMsg('Selecione a data desejada.');
        return;
      }
      if (peopleCount < 1) {
        setErrorMsg('Informe uma quantidade válida de pessoas.');
        return;
      }
      if (availabilityState && availabilityState.canRequest === false) {
        setErrorMsg(availabilityState.message || 'Data sem disponibilidade para a quantidade informada.');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const finalItemName = selectedEntityName();
    if (!customerName || customerName.trim().length < 3) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Informe um telefone/WhatsApp válido com DDD.');
      return;
    }

    try {
      setSubmitting(true);
      const data = await apiFetch('/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify({
          itemType,
          itemId: itemType === 'destination' ? null : Number(itemId) || null,
          itemName: finalItemName,
          desiredDate,
          returnDate: returnDate || null,
          peopleCount: Number(peopleCount),
          customerName,
          customerEmail,
          customerPhone,
          additionalInfo,
        }),
      });

      setCreatedBooking(data.booking);
      setStep(3);
      showToast('Solicitação de agendamento registrada com sucesso!', 'success');
      if (user) {
        refreshNotifications();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao registrar a solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-800 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-200">
              Celina Sousa Turismo • Caldas Locações
            </span>
            <h2 className="text-xl font-bold mt-0.5">
              {step === 3 ? 'Solicitação Registrada' : 'Solicitar Agendamento / Reserva'}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeBookingModal}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fechar janela de agendamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 3 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3 text-xs font-bold">
            <div
              className={`flex items-center gap-2 ${
                step === 1 ? 'text-brand-700' : 'text-emerald-600'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
                  step === 1 ? 'bg-brand-600' : 'bg-emerald-600'
                }`}
              >
                1
              </span>
              <span>Destino, Data e Pessoas</span>
            </div>
            <div className="h-px flex-1 bg-slate-300" />
            <div
              className={`flex items-center gap-2 ${
                step === 2 ? 'text-brand-700' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step === 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </span>
              <span>Confirmação de Dados</span>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Select Club/Trip/Destination, Date & People */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. O que você deseja agendar?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('club');
                      if (clubs.length > 0) setItemId(String(clubs[0].id));
                      else setItemId('');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      itemType === 'club'
                        ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Clube / Parque
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('trip');
                      if (trips.length > 0) setItemId(String(trips[0].id));
                      else setItemId('');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      itemType === 'trip'
                        ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Viagem / Pacote
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('destination');
                      setItemId('');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      itemType === 'destination'
                        ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Locação / Outro
                  </button>
                </div>
              </div>

              {itemType === 'club' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Escolha o Clube ou Estabelecimento
                  </label>
                  {clubs.length > 0 ? (
                    <select
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    >
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.city}/{c.state}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Informe o nome do clube que deseja consultar..."
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    />
                  )}
                </div>
              )}

              {itemType === 'trip' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Escolha a Viagem ou Excursão
                  </label>
                  {trips.length > 0 ? (
                    <select
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    >
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.destination}) — Status: {t.status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Informe a viagem ou roteiro que deseja consultar..."
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    />
                  )}
                </div>
              )}

              {itemType === 'destination' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Informe o Destino, Hotel ou Locação desejada
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Ex: Locação em Caldas Novas, Ingresso Parque Aquático..."
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    2. Data Desejada *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="date"
                      value={desiredDate}
                      onChange={(e) => setDesiredDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    3. Quantidade de Pessoas *
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value || '1', 10)))}
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Data de Retorno (opcional)
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={desiredDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                />
              </div>

              {/* Real-time Availability Feedback */}
              {checkingAvail ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-brand-600" />
                  Verificando disponibilidades cadastradas pela Celina...
                </div>
              ) : availabilityState ? (
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed flex items-start gap-3 ${
                    !availabilityState.canRequest
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : availabilityState.hasConfirmedAvailability
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {!availabilityState.canRequest ? (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  ) : availabilityState.hasConfirmedAvailability ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {!availabilityState.canRequest
                        ? 'Data Indisponível / Conflito de Vagas'
                        : availabilityState.hasConfirmedAvailability
                          ? 'Disponibilidade Pré-Cadastrada Localizada'
                          : 'Solicitação Sujeita à Análise de Disponibilidade'}
                    </p>
                    <p className="mt-0.5">{availabilityState.message}</p>
                    {availabilityState.priceNote && (
                      <p className="mt-1 font-semibold">
                        Observação de valor para a data: {availabilityState.priceNote}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={availabilityState && availabilityState.canRequest === false}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-sm font-bold shadow-md transition-all"
                >
                  <span>Continuar para Dados</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Contact Details & Confirmation */}
          {step === 2 && (
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200 text-xs sm:text-sm space-y-1">
                <p className="font-bold text-brand-900">Resumo da sua solicitação:</p>
                <p className="text-slate-700">
                  <strong>Item escolhido:</strong> {selectedEntityName()}
                </p>
                <p className="text-slate-700">
                  <strong>Data desejada:</strong> {formatDateBR(desiredDate)}
                  {returnDate ? ` até ${formatDateBR(returnDate)}` : ''} •{' '}
                  <strong>{peopleCount} pessoa(s)</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp com DDD *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(64) 99999-9999"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  4. Informações Adicionais / Observações (opcional)
                </label>
                <textarea
                  rows={3}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Informe dúvidas, idades de crianças, preferências de horário ou acomodação..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  Ao confirmar, sua solicitação será registrada com status{' '}
                  <strong>"Aguardando análise"</strong>. A Celina receberá o pedido no painel
                  administrativo e atualizará o status após verificar a disponibilidade.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-bold shadow-md transition-all"
                >
                  {submitting ? 'Registrando solicitação...' : 'Confirmar e Enviar Solicitação'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Created Booking Receipt */}
          {step === 3 && createdBooking && (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  Status: {createdBooking.status}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
                  Solicitação Registrada!
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Sua solicitação foi enviada para análise da Celina Sousa Turismo. Guarde seu código
                  identificador abaixo:
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-brand-300 max-w-md mx-auto space-y-2 text-left">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Código Identificador
                  </span>
                  <span className="text-base font-extrabold text-brand-700 font-mono">
                    {createdBooking.booking_code}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-700 pt-1">
                  <p>
                    <strong>Local / Viagem:</strong> {createdBooking.item_name}
                  </p>
                  <p>
                    <strong>Data Desejada:</strong> {formatDateBR(createdBooking.desired_date)}
                  </p>
                  <p>
                    <strong>Quantidade:</strong> {createdBooking.people_count} pessoa(s)
                  </p>
                  <p>
                    <strong>Solicitante:</strong> {createdBooking.customer_name} (
                    {createdBooking.customer_phone})
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={buildWhatsAppUrl(
                    settings.whatsapp_number,
                    `Olá Celina! Acabei de registrar a solicitação de agendamento código *${createdBooking.booking_code}* para *${createdBooking.item_name}* na data *${formatDateBR(createdBooking.desired_date)}* (${createdBooking.people_count} pessoa(s)). Gostaria de acompanhar a disponibilidade!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar Código pelo WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => {
                    closeBookingModal();
                    navigate(user ? '/minha-conta' : '/entrar?modo=login');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow transition-all"
                >
                  <span>Acompanhar na Minha Conta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
