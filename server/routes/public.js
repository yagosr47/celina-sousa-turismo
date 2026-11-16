const express = require('express');
const { db } = require('../db');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const {
  createNotification,
  generateBookingCode,
  getSiteSettingsObject,
} = require('../utils/helpers');

const router = express.Router();

function attachClubRelations(club) {
  if (!club) return null;
  const images = db.prepare(`
    SELECT * FROM club_images
    WHERE club_id = ?
    ORDER BY is_primary DESC, sort_order ASC, id ASC
  `).all(club.id);

  const availability = db.prepare(`
    SELECT * FROM availability
    WHERE item_type = 'club' AND item_id = ? AND available_date >= date('now')
    ORDER BY available_date ASC
  `).all(club.id);

  return {
    ...club,
    is_featured: Boolean(club.is_featured),
    is_published: Boolean(club.is_published),
    images,
    availability,
  };
}

function attachTripRelations(trip) {
  if (!trip) return null;
  const images = db.prepare(`
    SELECT * FROM trip_images
    WHERE trip_id = ?
    ORDER BY is_primary DESC, sort_order ASC, id ASC
  `).all(trip.id);

  const availability = db.prepare(`
    SELECT * FROM availability
    WHERE item_type = 'trip' AND item_id = ? AND available_date >= date('now')
    ORDER BY available_date ASC
  `).all(trip.id);

  return {
    ...trip,
    is_featured: Boolean(trip.is_featured),
    is_published: Boolean(trip.is_published),
    images,
    availability,
  };
}

// GET /api/public/bootstrap
router.get('/bootstrap', (req, res) => {
  try {
    const settings = getSiteSettingsObject();
    const clubs = db.prepare(`
      SELECT * FROM clubs
      WHERE is_published = 1
      ORDER BY is_featured DESC, created_at DESC
    `).all().map(attachClubRelations);

    const trips = db.prepare(`
      SELECT * FROM trips
      WHERE is_published = 1
      ORDER BY is_featured DESC, departure_date ASC, created_at DESC
    `).all().map(attachTripRelations);

    const destinations = db.prepare(`
      SELECT * FROM destinations
      WHERE is_active = 1
      ORDER BY name ASC
    `).all();

    const testimonials = db.prepare(`
      SELECT * FROM testimonials
      WHERE is_published = 1
      ORDER BY sort_order ASC, created_at DESC
    `).all();

    const faqs = db.prepare(`
      SELECT * FROM faqs
      WHERE is_published = 1
      ORDER BY sort_order ASC, id ASC
    `).all();

    const gallery = db.prepare(`
      SELECT * FROM gallery_items
      WHERE is_published = 1
      ORDER BY sort_order ASC, id DESC
    `).all();

    return res.json({
      settings,
      clubs,
      trips,
      destinations,
      testimonials,
      faqs,
      gallery,
    });
  } catch (err) {
    console.error('Erro em /api/public/bootstrap:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados iniciais do site.' });
  }
});

// GET /api/public/clubs
router.get('/clubs', (req, res) => {
  try {
    const { search, city } = req.query;
    let sql = 'SELECT * FROM clubs WHERE is_published = 1';
    const params = [];

    if (search) {
      sql += ' AND (lower(name) LIKE ? OR lower(city) LIKE ? OR lower(short_description) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term);
    }
    if (city) {
      sql += ' AND lower(city) = ?';
      params.push(String(city).toLowerCase());
    }

    sql += ' ORDER BY is_featured DESC, created_at DESC';
    const clubs = db.prepare(sql).all(...params).map(attachClubRelations);
    return res.json({ clubs });
  } catch (err) {
    console.error('Erro ao listar clubes:', err);
    return res.status(500).json({ error: 'Erro ao carregar clubes e destinos.' });
  }
});

// GET /api/public/clubs/:slugOrId
router.get('/clubs/:slugOrId', (req, res) => {
  try {
    const { slugOrId } = req.params;
    let club = null;
    if (/^\d+$/.test(slugOrId)) {
      club = db.prepare('SELECT * FROM clubs WHERE id = ? AND is_published = 1').get(Number(slugOrId));
    }
    if (!club) {
      club = db.prepare('SELECT * FROM clubs WHERE slug = ? AND is_published = 1').get(slugOrId);
    }
    if (!club) {
      return res.status(404).json({ error: 'Clube ou destino não encontrado.' });
    }

    const detailedClub = attachClubRelations(club);

    // Related trips for the same city or destination
    const relatedTrips = db.prepare(`
      SELECT * FROM trips
      WHERE is_published = 1 AND (lower(destination) LIKE ? OR destination_id = ?)
      ORDER BY departure_date ASC LIMIT 4
    `).all(`%${String(club.city || '').toLowerCase()}%`, club.destination_id || -1).map(attachTripRelations);

    return res.json({
      club: detailedClub,
      relatedTrips,
    });
  } catch (err) {
    console.error('Erro ao buscar detalhes do clube:', err);
    return res.status(500).json({ error: 'Erro ao carregar detalhes do clube.' });
  }
});

// GET /api/public/trips
router.get('/trips', (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = 'SELECT * FROM trips WHERE is_published = 1';
    const params = [];

    if (search) {
      sql += ' AND (lower(name) LIKE ? OR lower(destination) LIKE ? OR lower(short_description) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY is_featured DESC, departure_date ASC, created_at DESC';
    const trips = db.prepare(sql).all(...params).map(attachTripRelations);
    return res.json({ trips });
  } catch (err) {
    console.error('Erro ao listar viagens:', err);
    return res.status(500).json({ error: 'Erro ao carregar viagens e pacotes.' });
  }
});

// GET /api/public/trips/:slugOrId
router.get('/trips/:slugOrId', (req, res) => {
  try {
    const { slugOrId } = req.params;
    let trip = null;
    if (/^\d+$/.test(slugOrId)) {
      trip = db.prepare('SELECT * FROM trips WHERE id = ? AND is_published = 1').get(Number(slugOrId));
    }
    if (!trip) {
      trip = db.prepare('SELECT * FROM trips WHERE slug = ? AND is_published = 1').get(slugOrId);
    }
    if (!trip) {
      return res.status(404).json({ error: 'Viagem ou excursão não encontrada.' });
    }

    return res.json({
      trip: attachTripRelations(trip),
    });
  } catch (err) {
    console.error('Erro ao buscar detalhes da viagem:', err);
    return res.status(500).json({ error: 'Erro ao carregar detalhes da viagem.' });
  }
});

// GET /api/public/check-availability
router.get('/check-availability', (req, res) => {
  try {
    const { itemType, itemId, desiredDate, peopleCount } = req.query;
    const count = Math.max(1, parseInt(peopleCount || '1', 10));

    if (!itemType || !itemId || !desiredDate) {
      return res.status(400).json({ error: 'Informe o local/viagem e a data desejada.' });
    }

    if (itemType === 'trip') {
      const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(itemId));
      if (!trip) {
        return res.status(404).json({ error: 'Viagem não encontrada.' });
      }
      if (trip.status === 'Esgotada' || trip.status === 'Encerrada') {
        return res.json({
          canRequest: false,
          hasConfirmedAvailability: false,
          status: 'unavailable',
          message: `Esta viagem encontra-se com status "${trip.status}" e não aceita novas reservas no momento.`,
        });
      }
      if (trip.available_spots !== null && trip.available_spots !== undefined && trip.available_spots > 0) {
        if (count > trip.available_spots) {
          return res.json({
            canRequest: false,
            hasConfirmedAvailability: false,
            status: 'conflict',
            message: `Conflito de disponibilidade: restam apenas ${trip.available_spots} vaga(s) disponível(is) para esta viagem.`,
          });
        }
        return res.json({
          canRequest: true,
          hasConfirmedAvailability: true,
          status: 'available',
          remainingSpots: trip.available_spots,
          message: `Disponibilidade pré-cadastrada localizada (${trip.available_spots} vaga(s) restante(s)). Sua solicitação será enviada para confirmação final da Celina.`,
        });
      }
    }

    const slot = db.prepare(`
      SELECT * FROM availability
      WHERE item_type = ? AND item_id = ? AND available_date = ?
    `).get(String(itemType), Number(itemId), String(desiredDate));

    // Also check already confirmed bookings for this item & date
    const confirmedBookings = db.prepare(`
      SELECT COALESCE(SUM(people_count), 0) as total_confirmed
      FROM bookings
      WHERE item_type = ? AND item_id = ? AND desired_date = ? AND status = 'Confirmado'
    `).get(String(itemType), Number(itemId), String(desiredDate));

    const alreadyConfirmed = confirmedBookings ? Number(confirmedBookings.total_confirmed) : 0;

    if (!slot) {
      return res.json({
        canRequest: true,
        hasConfirmedAvailability: false,
        status: 'pending_verification',
        alreadyConfirmed,
        message: 'Data sujeita à verificação de disponibilidade pela Celina. Sua solicitação será registrada como "Aguardando análise" sem confirmação imediata.',
      });
    }

    if (slot.status === 'blocked' || slot.status === 'full') {
      return res.json({
        canRequest: false,
        hasConfirmedAvailability: false,
        status: 'conflict',
        message: 'Esta data está bloqueada ou com lotação esgotada por reservas confirmadas. Por favor, selecione outra data ou consulte pelo WhatsApp.',
      });
    }

    const effectiveConfirmed = Math.max(Number(slot.confirmed_count || 0), alreadyConfirmed);
    if (slot.max_capacity > 0 && effectiveConfirmed + count > slot.max_capacity) {
      const remaining = Math.max(0, slot.max_capacity - effectiveConfirmed);
      return res.json({
        canRequest: false,
        hasConfirmedAvailability: false,
        status: 'conflict',
        remainingSpots: remaining,
        message: remaining > 0
          ? `Conflito de disponibilidade: para a data ${desiredDate}, há apenas ${remaining} vaga(s) restante(s) devido a reservas já confirmadas.`
          : `Data indisponível: todas as vagas para ${desiredDate} já estão ocupadas por reservas confirmadas.`,
      });
    }

    return res.json({
      canRequest: true,
      hasConfirmedAvailability: true,
      status: 'available',
      remainingSpots: slot.max_capacity > 0 ? slot.max_capacity - effectiveConfirmed : null,
      priceNote: slot.price_note || null,
      message: 'Data com disponibilidade pré-cadastrada! Sua solicitação será enviada para análise e aprovação da Celina.',
    });
  } catch (err) {
    console.error('Erro ao verificar disponibilidade:', err);
    return res.status(500).json({ error: 'Erro ao consultar disponibilidade.' });
  }
});

// POST /api/public/bookings
router.post('/bookings', optionalAuth, (req, res) => {
  try {
    const {
      itemType,
      itemId,
      itemName,
      desiredDate,
      returnDate,
      peopleCount,
      customerName,
      customerEmail,
      customerPhone,
      additionalInfo,
    } = req.body;

    const validTypes = ['club', 'trip', 'destination'];
    const normalizedType = validTypes.includes(itemType) ? itemType : 'club';
    const count = Math.max(1, parseInt(peopleCount || '1', 10));

    const finalName = String(customerName || (req.user && req.user.name) || '').trim();
    const finalEmail = String(customerEmail || (req.user && req.user.email) || '').trim().toLowerCase();
    const finalPhone = String(customerPhone || (req.user && req.user.phone) || '').trim();

    if (!finalName || finalName.length < 3) {
      return res.status(400).json({ error: 'Informe seu nome completo para a solicitação.' });
    }
    if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      return res.status(400).json({ error: 'Informe um e-mail válido para acompanhamento da solicitação.' });
    }
    if (!finalPhone || finalPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Informe um telefone/WhatsApp válido com DDD.' });
    }
    if (!desiredDate) {
      return res.status(400).json({ error: 'Selecione a data desejada para o agendamento.' });
    }

    let resolvedItemName = String(itemName || '').trim();
    let availabilityVerified = 0;

    if (normalizedType === 'club' && itemId) {
      const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(Number(itemId));
      if (!club) {
        return res.status(404).json({ error: 'Clube selecionado não encontrado.' });
      }
      resolvedItemName = club.name;
    } else if (normalizedType === 'trip' && itemId) {
      const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(itemId));
      if (!trip) {
        return res.status(404).json({ error: 'Viagem selecionada não encontrada.' });
      }
      if (trip.status === 'Esgotada' || trip.status === 'Encerrada') {
        return res.status(409).json({
          error: `Não é possível solicitar reserva: esta viagem está com status "${trip.status}".`,
        });
      }
      if (trip.available_spots !== null && trip.available_spots !== undefined && trip.available_spots > 0) {
        if (count > trip.available_spots) {
          return res.status(409).json({
            error: `Conflito de disponibilidade: restam apenas ${trip.available_spots} vaga(s) para esta viagem.`,
          });
        }
        availabilityVerified = 1;
      }
      resolvedItemName = trip.name;
    }

    if (!resolvedItemName) {
      return res.status(400).json({ error: 'Selecione um clube, destino ou viagem válida.' });
    }

    // Check availability table & confirmed reservations to prevent conflicts
    if (itemId) {
      const slot = db.prepare(`
        SELECT * FROM availability
        WHERE item_type = ? AND item_id = ? AND available_date = ?
      `).get(normalizedType, Number(itemId), String(desiredDate));

      const confirmedBookings = db.prepare(`
        SELECT COALESCE(SUM(people_count), 0) as total_confirmed
        FROM bookings
        WHERE item_type = ? AND item_id = ? AND desired_date = ? AND status = 'Confirmado'
      `).get(normalizedType, Number(itemId), String(desiredDate));

      const alreadyConfirmed = confirmedBookings ? Number(confirmedBookings.total_confirmed) : 0;

      if (slot) {
        if (slot.status === 'blocked' || slot.status === 'full') {
          return res.status(409).json({
            error: 'Conflito de disponibilidade: esta data já se encontra bloqueada ou com capacidade esgotada por reservas confirmadas.',
          });
        }
        const effectiveConfirmed = Math.max(Number(slot.confirmed_count || 0), alreadyConfirmed);
        if (slot.max_capacity > 0 && effectiveConfirmed + count > slot.max_capacity) {
          const remaining = Math.max(0, slot.max_capacity - effectiveConfirmed);
          return res.status(409).json({
            error: remaining > 0
              ? `Conflito de disponibilidade: há apenas ${remaining} vaga(s) disponível(is) para ${desiredDate}.`
              : `Conflito de disponibilidade: lotação máxima atingida para ${desiredDate} devido a reservas confirmadas.`,
          });
        }
        availabilityVerified = 1;
      }
    }

    // Generate unique booking code
    let bookingCode = generateBookingCode();
    while (db.prepare('SELECT id FROM bookings WHERE booking_code = ?').get(bookingCode)) {
      bookingCode = generateBookingCode();
    }

    // Link to user account if logged in or if email matches an existing customer account
    let linkedUserId = req.user ? req.user.id : null;
    if (!linkedUserId) {
      const existingCustomer = db.prepare("SELECT id FROM users WHERE lower(email) = ? AND role = 'customer'").get(finalEmail);
      if (existingCustomer) {
        linkedUserId = existingCustomer.id;
      }
    }

    // Always register initially as 'Aguardando análise' so Celina approves/confirms
    const initialStatus = 'Aguardando análise';

    const insertResult = db.prepare(`
      INSERT INTO bookings (
        booking_code, user_id, item_type, item_id, item_name,
        desired_date, return_date, people_count,
        customer_name, customer_email, customer_phone,
        additional_info, availability_verified, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      bookingCode,
      linkedUserId,
      normalizedType,
      itemId ? Number(itemId) : null,
      resolvedItemName,
      String(desiredDate),
      returnDate ? String(returnDate) : null,
      count,
      finalName,
      finalEmail,
      finalPhone,
      additionalInfo ? String(additionalInfo).trim() : null,
      availabilityVerified,
      initialStatus
    );

    const newBookingId = Number(insertResult.lastInsertRowid);
    const createdBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(newBookingId);

    // Notify Celina
    createNotification({
      recipientRole: 'admin',
      type: 'new_booking',
      title: 'Novo agendamento solicitado',
      message: `${finalName} solicitou agendamento (${bookingCode}) para "${resolvedItemName}" em ${desiredDate} (${count} pessoa(s)). Reserva aguardando análise.`,
      link: `/painel-celina?tab=agendamentos&code=${bookingCode}`,
      relatedBookingId: newBookingId,
    });

    // Notify Customer
    if (linkedUserId) {
      createNotification({
        recipientRole: 'customer',
        recipientUserId: linkedUserId,
        type: 'booking_received',
        title: 'Solicitação recebida',
        message: `Sua solicitação ${bookingCode} para "${resolvedItemName}" foi registrada com status "Aguardando análise". A Celina analisará a disponibilidade em breve.`,
        link: '/minha-conta?tab=agendamentos',
        relatedBookingId: newBookingId,
      });
    }

    return res.status(201).json({
      message: availabilityVerified
        ? 'Solicitação registrada com sucesso! Há disponibilidade pré-cadastrada e seu pedido está aguardando análise e confirmação da Celina.'
        : 'Solicitação registrada como pendente ("Aguardando análise")! Como esta data requer confirmação de disponibilidade, a reserva ainda não está confirmada e será analisada pela Celina.',
      booking: createdBooking,
    });
  } catch (err) {
    console.error('Erro ao criar solicitação de agendamento:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar sua solicitação de agendamento.' });
  }
});

// GET /api/public/my-bookings (Authenticated Customer's own bookings)
router.get('/my-bookings', requireAuth, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT * FROM bookings
      WHERE user_id = ? OR lower(customer_email) = lower(?)
      ORDER BY created_at DESC
    `).all(req.user.id, req.user.email || '');

    return res.json({ bookings });
  } catch (err) {
    console.error('Erro ao listar agendamentos do cliente:', err);
    return res.status(500).json({ error: 'Erro ao carregar seus agendamentos.' });
  }
});

// POST /api/public/my-bookings/:id/cancel (Customer cancels their own request)
router.post('/my-bookings/:id/cancel', requireAuth, (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { reason } = req.body;

    const booking = db.prepare(`
      SELECT * FROM bookings
      WHERE id = ? AND (user_id = ? OR lower(customer_email) = lower(?))
    `).get(bookingId, req.user.id, req.user.email || '');

    if (!booking) {
      return res.status(404).json({ error: 'Solicitação não encontrada na sua conta.' });
    }

    if (booking.status === 'Cancelado' || booking.status === 'Concluído' || booking.status === 'Recusado') {
      return res.status(400).json({
        error: `Não é possível cancelar uma solicitação que já está com status "${booking.status}".`,
      });
    }

    const previousStatus = booking.status;
    const cancelNote = reason
      ? `Cancelado pelo cliente em ${new Date().toLocaleDateString('pt-BR')}: ${String(reason).trim()}`
      : `Cancelado pelo cliente em ${new Date().toLocaleDateString('pt-BR')}.`;

    db.prepare(`
      UPDATE bookings
      SET status = 'Cancelado',
          customer_feedback_note = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(cancelNote, bookingId);

    // If it was previously 'Confirmado', release capacity
    if (previousStatus === 'Confirmado' && booking.item_id) {
      if (booking.item_type === 'trip') {
        db.prepare(`
          UPDATE trips
          SET available_spots = CASE
            WHEN available_spots IS NOT NULL THEN available_spots + ?
            ELSE NULL
          END
          WHERE id = ?
        `).run(booking.people_count, booking.item_id);
      }
      db.prepare(`
        UPDATE availability
        SET confirmed_count = MAX(0, confirmed_count - ?),
            status = CASE WHEN status = 'full' THEN 'available' ELSE status END,
            updated_at = datetime('now')
        WHERE item_type = ? AND item_id = ? AND available_date = ?
      `).run(booking.people_count, booking.item_type, booking.item_id, booking.desired_date);
    }

    createNotification({
      recipientRole: 'admin',
      type: 'booking_cancelled',
      title: 'Solicitação cancelada pelo cliente',
      message: `O cliente ${req.user.name} cancelou a solicitação ${booking.booking_code} (${booking.item_name}).`,
      link: `/painel-celina?tab=agendamentos&code=${booking.booking_code}`,
      relatedBookingId: bookingId,
    });

    createNotification({
      recipientRole: 'customer',
      recipientUserId: req.user.id,
      type: 'status_update',
      title: 'Solicitação cancelada',
      message: `Sua solicitação ${booking.booking_code} para "${booking.item_name}" foi cancelada conforme solicitado.`,
      link: '/minha-conta?tab=agendamentos',
      relatedBookingId: bookingId,
    });

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    return res.json({
      message: 'Solicitação cancelada com sucesso.',
      booking: updated,
    });
  } catch (err) {
    console.error('Erro ao cancelar agendamento:', err);
    return res.status(500).json({ error: 'Erro ao cancelar a solicitação.' });
  }
});

// GET /api/public/notifications
router.get('/notifications', requireAuth, (req, res) => {
  try {
    let notifications = [];
    if (req.user.role === 'admin') {
      notifications = db.prepare(`
        SELECT * FROM notifications
        WHERE recipient_role = 'admin'
        ORDER BY created_at DESC LIMIT 60
      `).all();
    } else {
      notifications = db.prepare(`
        SELECT * FROM notifications
        WHERE recipient_role = 'customer' AND recipient_user_id = ?
        ORDER BY created_at DESC LIMIT 60
      `).all(req.user.id);
    }
    return res.json({
      notifications: notifications.map((n) => ({ ...n, is_read: Boolean(n.is_read) })),
    });
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    return res.status(500).json({ error: 'Erro ao carregar notificações.' });
  }
});

// PUT /api/public/notifications/:id/read
router.put('/notifications/:id/read', requireAuth, (req, res) => {
  try {
    const notifId = Number(req.params.id);
    if (req.user.role === 'admin') {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_role = 'admin'").run(notifId);
    } else {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_role = 'customer' AND recipient_user_id = ?").run(notifId, req.user.id);
    }
    return res.json({ message: 'Notificação marcada como lida.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
});

// PUT /api/public/notifications/read-all
router.put('/notifications/read-all', requireAuth, (req, res) => {
  try {
    if (req.user.role === 'admin') {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE recipient_role = 'admin'").run();
    } else {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE recipient_role = 'customer' AND recipient_user_id = ?").run(req.user.id);
    }
    return res.json({ message: 'Todas as notificações foram marcadas como lidas.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao marcar notificações como lidas.' });
  }
});

// POST /api/public/contact
router.post('/contact', optionalAuth, (req, res) => {
  try {
    const {
      name,
      contact,
      email,
      subject,
      message,
      relatedItemType,
      relatedItemId,
      relatedItemName,
    } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Informe seu nome.' });
    }
    if (!contact || String(contact).trim().length < 6) {
      return res.status(400).json({ error: 'Informe um telefone/WhatsApp ou e-mail para retorno.' });
    }
    if (!subject || String(subject).trim().length < 2) {
      return res.status(400).json({ error: 'Informe o assunto da mensagem.' });
    }
    if (!message || String(message).trim().length < 5) {
      return res.status(400).json({ error: 'Escreva sua mensagem ou dúvida.' });
    }

    const result = db.prepare(`
      INSERT INTO messages (
        user_id, name, contact, email, subject, message,
        related_item_type, related_item_id, related_item_name, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Nova', datetime('now'), datetime('now'))
    `).run(
      req.user ? req.user.id : null,
      String(name).trim(),
      String(contact).trim(),
      email ? String(email).trim() : null,
      String(subject).trim(),
      String(message).trim(),
      relatedItemType || null,
      relatedItemId ? Number(relatedItemId) : null,
      relatedItemName || null
    );

    createNotification({
      recipientRole: 'admin',
      type: 'new_message',
      title: 'Nova mensagem recebida',
      message: `${String(name).trim()} enviou uma mensagem sobre "${String(subject).trim()}".`,
      link: '/painel-celina?tab=mensagens',
    });

    return res.status(201).json({
      message: 'Sua mensagem foi enviada com sucesso! A Celina Sousa Turismo responderá em breve.',
      id: Number(result.lastInsertRowid),
    });
  } catch (err) {
    console.error('Erro ao enviar mensagem de contato:', err);
    return res.status(500).json({ error: 'Erro ao enviar sua mensagem.' });
  }
});

module.exports = router;
