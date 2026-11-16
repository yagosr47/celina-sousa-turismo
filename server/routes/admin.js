const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('../config');
const { db, slugify } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { upload, isValidImageHeader } = require('../middleware/upload');
const {
  createNotification,
  logAdminAction,
  getSiteSettingsObject,
} = require('../utils/helpers');

const router = express.Router();

// Protect all admin routes
router.use(requireAdmin);

function uniqueSlug(table, baseText, excludeId = null) {
  let base = slugify(baseText) || 'item';
  let candidate = base;
  let counter = 2;
  while (true) {
    const existing = excludeId
      ? db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(candidate, excludeId)
      : db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(candidate);
    if (!existing) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function getClubFull(id) {
  const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(Number(id));
  if (!club) return null;
  const images = db.prepare(`
    SELECT * FROM club_images
    WHERE club_id = ?
    ORDER BY is_primary DESC, sort_order ASC, id ASC
  `).all(club.id);
  const availability = db.prepare(`
    SELECT * FROM availability
    WHERE item_type = 'club' AND item_id = ?
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

function getTripFull(id) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(Number(id));
  if (!trip) return null;
  const images = db.prepare(`
    SELECT * FROM trip_images
    WHERE trip_id = ?
    ORDER BY is_primary DESC, sort_order ASC, id ASC
  `).all(trip.id);
  const availability = db.prepare(`
    SELECT * FROM availability
    WHERE item_type = 'trip' AND item_id = ?
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

// ==========================================
// 1. DASHBOARD
// ==========================================
router.get('/dashboard', (req, res) => {
  try {
    const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
    const totalClubs = db.prepare('SELECT COUNT(*) as c FROM clubs').get().c;
    const publishedClubs = db.prepare('SELECT COUNT(*) as c FROM clubs WHERE is_published = 1').get().c;
    const totalTrips = db.prepare('SELECT COUNT(*) as c FROM trips').get().c;
    const publishedTrips = db.prepare('SELECT COUNT(*) as c FROM trips WHERE is_published = 1').get().c;
    const pendingBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'Aguardando análise'").get().c;
    const confirmedBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'Confirmado'").get().c;
    const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
    const unreadMessages = db.prepare("SELECT COUNT(*) as c FROM messages WHERE status = 'Nova'").get().c;

    const bookingsByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
    `).all();

    const upcomingTrips = db.prepare(`
      SELECT id, name, slug, destination, departure_date, return_date, status, available_spots, total_spots, price_per_person, is_published
      FROM trips
      ORDER BY CASE WHEN departure_date IS NULL OR departure_date = '' THEN 1 ELSE 0 END, departure_date ASC, created_at DESC
      LIMIT 6
    `).all();

    const recentBookings = db.prepare(`
      SELECT * FROM bookings
      ORDER BY created_at DESC
      LIMIT 8
    `).all();

    const recentAuditLogs = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    return res.json({
      metrics: {
        totalCustomers,
        totalClubs,
        publishedClubs,
        totalTrips,
        publishedTrips,
        pendingBookings,
        confirmedBookings,
        totalBookings,
        unreadMessages,
      },
      bookingsByStatus,
      upcomingTrips,
      recentBookings,
      recentAuditLogs,
    });
  } catch (err) {
    console.error('Erro no dashboard admin:', err);
    return res.status(500).json({ error: 'Erro ao carregar indicadores do painel.' });
  }
});

// ==========================================
// 2. UPLOAD DE IMAGENS
// ==========================================
router.post('/upload', (req, res) => {
  upload.array('images', 15)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Erro no envio das imagens.' });
    }
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    const uploadedUrls = [];
    for (const file of files) {
      if (!isValidImageHeader(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {}
        return res.status(400).json({
          error: `O arquivo "${file.originalname}" não é uma imagem válida e foi bloqueado por segurança.`,
        });
      }
      let finalUrl = `/uploads/${file.filename}`;
      if (config.isServerless) {
        try {
          const buf = fs.readFileSync(file.path);
          finalUrl = `data:${file.mimetype || 'image/jpeg'};base64,${buf.toString('base64')}`;
        } catch {}
      }
      uploadedUrls.push({
        url: finalUrl,
        originalName: file.originalname,
        size: file.size,
      });
    }

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'UPLOAD_IMAGES',
      entityType: 'media',
      details: { count: uploadedUrls.length, files: uploadedUrls.map((u) => u.url) },
    });

    return res.status(201).json({
      message: `${uploadedUrls.length} imagem(ns) enviada(s) com sucesso!`,
      files: uploadedUrls,
    });
  });
});

// ==========================================
// 3. GERENCIAMENTO DE CLUBES
// ==========================================
router.get('/clubs', (req, res) => {
  try {
    const rows = db.prepare('SELECT id FROM clubs ORDER BY created_at DESC').all();
    const clubs = rows.map((r) => getClubFull(r.id));
    return res.json({ clubs });
  } catch (err) {
    console.error('Erro ao listar clubes no admin:', err);
    return res.status(500).json({ error: 'Erro ao carregar lista de clubes.' });
  }
});

router.get('/clubs/:id', (req, res) => {
  const club = getClubFull(req.params.id);
  if (!club) return res.status(404).json({ error: 'Clube não encontrado.' });
  return res.json({ club });
});

router.post('/clubs', (req, res) => {
  try {
    const {
      name,
      destination_id,
      city,
      state,
      address_location,
      short_description,
      summary_info,
      full_description,
      characteristics,
      structure_available,
      pools_info,
      leisure_areas,
      restaurants_food,
      services_available,
      usage_rules,
      visitor_info,
      differentials,
      important_notes,
      price_info,
      payment_conditions,
      promotions,
      available_dates,
      related_packages,
      additional_commercial_info,
      cover_image,
      is_featured,
      is_published,
      images,
    } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Informe o nome do clube ou estabelecimento.' });
    }
    if (!city || !state) {
      return res.status(400).json({ error: 'Informe a cidade e o estado (UF) do clube.' });
    }

    const slug = uniqueSlug('clubs', `${name}-${city}`);
    const initialCover = cover_image || (Array.isArray(images) && images[0] ? images[0].image_url || images[0] : '/assets/images/waterpark-pools.jpg');

    const result = db.prepare(`
      INSERT INTO clubs (
        name, slug, destination_id, city, state, address_location,
        short_description, summary_info, full_description,
        characteristics, structure_available, pools_info, leisure_areas,
        restaurants_food, services_available, usage_rules, visitor_info,
        differentials, important_notes,
        price_info, payment_conditions, promotions, available_dates,
        related_packages, additional_commercial_info,
        cover_image, is_featured, is_published,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        datetime('now'), datetime('now')
      )
    `).run(
      String(name).trim(),
      slug,
      destination_id ? Number(destination_id) : null,
      String(city).trim(),
      String(state).trim().toUpperCase(),
      address_location || null,
      short_description || null,
      summary_info || null,
      full_description || null,
      characteristics || null,
      structure_available || null,
      pools_info || null,
      leisure_areas || null,
      restaurants_food || null,
      services_available || null,
      usage_rules || null,
      visitor_info || null,
      differentials || null,
      important_notes || null,
      price_info || null,
      payment_conditions || null,
      promotions || null,
      available_dates || null,
      related_packages || null,
      additional_commercial_info || null,
      initialCover,
      is_featured ? 1 : 0,
      is_published === false ? 0 : 1
    );

    const clubId = Number(result.lastInsertRowid);

    if (Array.isArray(images) && images.length > 0) {
      const insertImg = db.prepare(`
        INSERT INTO club_images (club_id, image_url, caption, category, is_primary, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      images.forEach((img, idx) => {
        const url = typeof img === 'string' ? img : img.image_url;
        if (!url) return;
        const caption = typeof img === 'object' ? img.caption || null : null;
        const category = typeof img === 'object' ? img.category || 'Geral' : 'Geral';
        const isPrimary = idx === 0 ? 1 : 0;
        insertImg.run(clubId, url, caption, category, isPrimary, idx);
      });
    } else if (initialCover) {
      db.prepare(`
        INSERT INTO club_images (club_id, image_url, caption, category, is_primary, sort_order)
        VALUES (?, ?, ?, 'Principal', 1, 0)
      `).run(clubId, initialCover, String(name).trim());
    }

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'CREATE_CLUB',
      entityType: 'club',
      entityId: clubId,
      details: { name: String(name).trim(), city, state },
    });

    return res.status(201).json({
      message: 'Clube cadastrado com sucesso!',
      club: getClubFull(clubId),
    });
  } catch (err) {
    console.error('Erro ao criar clube:', err);
    return res.status(500).json({ error: 'Erro interno ao cadastrar o clube.' });
  }
});

router.put('/clubs/:id', (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId);
    if (!existing) {
      return res.status(404).json({ error: 'Clube não encontrado.' });
    }

    const {
      name = existing.name,
      destination_id = existing.destination_id,
      city = existing.city,
      state = existing.state,
      address_location = existing.address_location,
      short_description = existing.short_description,
      summary_info = existing.summary_info,
      full_description = existing.full_description,
      characteristics = existing.characteristics,
      structure_available = existing.structure_available,
      pools_info = existing.pools_info,
      leisure_areas = existing.leisure_areas,
      restaurants_food = existing.restaurants_food,
      services_available = existing.services_available,
      usage_rules = existing.usage_rules,
      visitor_info = existing.visitor_info,
      differentials = existing.differentials,
      important_notes = existing.important_notes,
      price_info = existing.price_info,
      payment_conditions = existing.payment_conditions,
      promotions = existing.promotions,
      available_dates = existing.available_dates,
      related_packages = existing.related_packages,
      additional_commercial_info = existing.additional_commercial_info,
      cover_image = existing.cover_image,
      is_featured = existing.is_featured,
      is_published = existing.is_published,
    } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'O nome do clube não pode ficar vazio.' });
    }

    const slug = String(name).trim() !== existing.name
      ? uniqueSlug('clubs', `${name}-${city}`, clubId)
      : existing.slug;

    db.prepare(`
      UPDATE clubs SET
        name = ?, slug = ?, destination_id = ?, city = ?, state = ?, address_location = ?,
        short_description = ?, summary_info = ?, full_description = ?,
        characteristics = ?, structure_available = ?, pools_info = ?, leisure_areas = ?,
        restaurants_food = ?, services_available = ?, usage_rules = ?, visitor_info = ?,
        differentials = ?, important_notes = ?,
        price_info = ?, payment_conditions = ?, promotions = ?, available_dates = ?,
        related_packages = ?, additional_commercial_info = ?,
        cover_image = ?, is_featured = ?, is_published = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      String(name).trim(),
      slug,
      destination_id ? Number(destination_id) : null,
      String(city).trim(),
      String(state).trim().toUpperCase(),
      address_location,
      short_description,
      summary_info,
      full_description,
      characteristics,
      structure_available,
      pools_info,
      leisure_areas,
      restaurants_food,
      services_available,
      usage_rules,
      visitor_info,
      differentials,
      important_notes,
      price_info,
      payment_conditions,
      promotions,
      available_dates,
      related_packages,
      additional_commercial_info,
      cover_image,
      is_featured ? 1 : 0,
      is_published ? 1 : 0,
      clubId
    );

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_CLUB',
      entityType: 'club',
      entityId: clubId,
      details: { name: String(name).trim(), is_published: Boolean(is_published) },
    });

    return res.json({
      message: 'Informações do clube atualizadas com sucesso!',
      club: getClubFull(clubId),
    });
  } catch (err) {
    console.error('Erro ao atualizar clube:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar o clube.' });
  }
});

router.delete('/clubs/:id', (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId);
    if (!existing) {
      return res.status(404).json({ error: 'Clube não encontrado.' });
    }
    db.prepare('DELETE FROM clubs WHERE id = ?').run(clubId);

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'DELETE_CLUB',
      entityType: 'club',
      entityId: clubId,
      details: { name: existing.name },
    });

    return res.json({ message: 'Clube excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir clube:', err);
    return res.status(500).json({ error: 'Erro ao excluir o clube.' });
  }
});

// Club Gallery Image Management
router.post('/clubs/:id/images', (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const club = db.prepare('SELECT * FROM clubs WHERE id = ?').get(clubId);
    if (!club) return res.status(404).json({ error: 'Clube não encontrado.' });

    const { image_url, caption, category, is_primary, images } = req.body;
    const currentMaxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM club_images WHERE club_id = ?').get(clubId).m;

    const listToInsert = Array.isArray(images)
      ? images
      : image_url
        ? [{ image_url, caption, category, is_primary }]
        : [];

    if (listToInsert.length === 0) {
      return res.status(400).json({ error: 'Informe a imagem para adicionar à galeria.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO club_images (club_id, image_url, caption, category, is_primary, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    listToInsert.forEach((item, idx) => {
      const url = typeof item === 'string' ? item : item.image_url;
      if (!url) return;
      const makePrimary = item.is_primary ? 1 : 0;
      if (makePrimary) {
        db.prepare('UPDATE club_images SET is_primary = 0 WHERE club_id = ?').run(clubId);
        db.prepare("UPDATE clubs SET cover_image = ?, updated_at = datetime('now') WHERE id = ?").run(url, clubId);
      }
      insertStmt.run(
        clubId,
        url,
        item.caption || null,
        item.category || 'Geral',
        makePrimary,
        currentMaxOrder + 1 + idx
      );
    });

    return res.status(201).json({
      message: 'Imagem(ns) adicionada(s) à galeria do clube!',
      club: getClubFull(clubId),
    });
  } catch (err) {
    console.error('Erro ao adicionar imagem ao clube:', err);
    return res.status(500).json({ error: 'Erro ao adicionar imagem à galeria.' });
  }
});

router.put('/clubs/:id/images/:imageId', (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    const img = db.prepare('SELECT * FROM club_images WHERE id = ? AND club_id = ?').get(imageId, clubId);
    if (!img) return res.status(404).json({ error: 'Imagem não encontrada.' });

    const {
      image_url = img.image_url,
      caption = img.caption,
      category = img.category,
      is_primary,
      sort_order = img.sort_order,
    } = req.body;

    if (is_primary) {
      db.prepare('UPDATE club_images SET is_primary = 0 WHERE club_id = ?').run(clubId);
      db.prepare("UPDATE clubs SET cover_image = ?, updated_at = datetime('now') WHERE id = ?").run(image_url, clubId);
    }

    db.prepare(`
      UPDATE club_images
      SET image_url = ?, caption = ?, category = ?, is_primary = ?, sort_order = ?
      WHERE id = ? AND club_id = ?
    `).run(
      image_url,
      caption,
      category || 'Geral',
      is_primary !== undefined ? (is_primary ? 1 : 0) : img.is_primary,
      Number(sort_order),
      imageId,
      clubId
    );

    return res.json({
      message: 'Imagem da galeria atualizada!',
      club: getClubFull(clubId),
    });
  } catch (err) {
    console.error('Erro ao atualizar imagem do clube:', err);
    return res.status(500).json({ error: 'Erro ao atualizar imagem.' });
  }
});

router.put('/clubs/:id/images-reorder', (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Informe a ordem das imagens.' });
    }
    const stmt = db.prepare('UPDATE club_images SET sort_order = ? WHERE id = ? AND club_id = ?');
    orderedIds.forEach((id, index) => {
      stmt.run(index, Number(id), clubId);
    });
    return res.json({
      message: 'Ordem da galeria atualizada!',
      club: getClubFull(clubId),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao reordenar galeria.' });
  }
});

router.delete('/clubs/:id/images/:imageId', (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    const img = db.prepare('SELECT * FROM club_images WHERE id = ? AND club_id = ?').get(imageId, clubId);
    if (!img) return res.status(404).json({ error: 'Imagem não encontrada.' });

    db.prepare('DELETE FROM club_images WHERE id = ? AND club_id = ?').run(imageId, clubId);

    // If deleted image was primary, promote next available image
    if (img.is_primary) {
      const nextImg = db.prepare('SELECT * FROM club_images WHERE club_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1').get(clubId);
      if (nextImg) {
        db.prepare('UPDATE club_images SET is_primary = 1 WHERE id = ?').run(nextImg.id);
        db.prepare("UPDATE clubs SET cover_image = ?, updated_at = datetime('now') WHERE id = ?").run(nextImg.image_url, clubId);
      }
    }

    return res.json({
      message: 'Imagem removida da galeria.',
      club: getClubFull(clubId),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover imagem.' });
  }
});

// ==========================================
// 4. GERENCIAMENTO DE VIAGENS E PACOTES
// ==========================================
router.get('/trips', (req, res) => {
  try {
    const rows = db.prepare('SELECT id FROM trips ORDER BY created_at DESC').all();
    const trips = rows.map((r) => getTripFull(r.id));
    return res.json({ trips });
  } catch (err) {
    console.error('Erro ao listar viagens no admin:', err);
    return res.status(500).json({ error: 'Erro ao carregar viagens.' });
  }
});

router.get('/trips/:id', (req, res) => {
  const trip = getTripFull(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });
  return res.json({ trip });
});

router.post('/trips', (req, res) => {
  try {
    const {
      name,
      destination,
      destination_id,
      cover_image,
      short_description,
      full_description,
      departure_date,
      return_date,
      departure_time,
      boarding_location,
      price_per_person,
      payment_methods,
      included_items,
      not_included_items,
      transport_info,
      lodging_info,
      total_spots,
      available_spots,
      notes,
      status,
      is_featured,
      is_published,
      images,
    } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Informe o nome da viagem ou pacote.' });
    }
    if (!destination || String(destination).trim().length < 2) {
      return res.status(400).json({ error: 'Informe o destino da viagem.' });
    }

    const validStatuses = ['Disponível', 'Poucas vagas', 'Esgotada', 'Encerrada', 'Em breve'];
    const finalStatus = validStatuses.includes(status) ? status : 'Disponível';
    const slug = uniqueSlug('trips', `${name}-${destination}`);
    const initialCover = cover_image || (Array.isArray(images) && images[0] ? images[0].image_url || images[0] : '/assets/images/travel-excursion.jpg');

    const parsedTotalSpots = total_spots !== '' && total_spots !== null && total_spots !== undefined ? Number(total_spots) : null;
    const parsedAvailSpots = available_spots !== '' && available_spots !== null && available_spots !== undefined
      ? Number(available_spots)
      : parsedTotalSpots;

    const result = db.prepare(`
      INSERT INTO trips (
        name, slug, destination, destination_id, cover_image,
        short_description, full_description,
        departure_date, return_date, departure_time, boarding_location,
        price_per_person, payment_methods,
        included_items, not_included_items,
        transport_info, lodging_info,
        total_spots, available_spots, notes,
        status, is_featured, is_published,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        datetime('now'), datetime('now')
      )
    `).run(
      String(name).trim(),
      slug,
      String(destination).trim(),
      destination_id ? Number(destination_id) : null,
      initialCover,
      short_description || null,
      full_description || null,
      departure_date || null,
      return_date || null,
      departure_time || null,
      boarding_location || null,
      price_per_person || null,
      payment_methods || null,
      included_items || null,
      not_included_items || null,
      transport_info || null,
      lodging_info || null,
      parsedTotalSpots,
      parsedAvailSpots,
      notes || null,
      finalStatus,
      is_featured ? 1 : 0,
      is_published === false ? 0 : 1
    );

    const tripId = Number(result.lastInsertRowid);

    if (Array.isArray(images) && images.length > 0) {
      const insertImg = db.prepare(`
        INSERT INTO trip_images (trip_id, image_url, caption, category, is_primary, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      images.forEach((img, idx) => {
        const url = typeof img === 'string' ? img : img.image_url;
        if (!url) return;
        insertImg.run(
          tripId,
          url,
          typeof img === 'object' ? img.caption || null : null,
          typeof img === 'object' ? img.category || 'Geral' : 'Geral',
          idx === 0 ? 1 : 0,
          idx
        );
      });
    } else if (initialCover) {
      db.prepare(`
        INSERT INTO trip_images (trip_id, image_url, caption, category, is_primary, sort_order)
        VALUES (?, ?, ?, 'Principal', 1, 0)
      `).run(tripId, initialCover, String(name).trim());
    }

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'CREATE_TRIP',
      entityType: 'trip',
      entityId: tripId,
      details: { name: String(name).trim(), destination, status: finalStatus },
    });

    return res.status(201).json({
      message: 'Viagem cadastrada com sucesso!',
      trip: getTripFull(tripId),
    });
  } catch (err) {
    console.error('Erro ao criar viagem:', err);
    return res.status(500).json({ error: 'Erro interno ao cadastrar a viagem.' });
  }
});

router.put('/trips/:id', (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!existing) return res.status(404).json({ error: 'Viagem não encontrada.' });

    const {
      name = existing.name,
      destination = existing.destination,
      destination_id = existing.destination_id,
      cover_image = existing.cover_image,
      short_description = existing.short_description,
      full_description = existing.full_description,
      departure_date = existing.departure_date,
      return_date = existing.return_date,
      departure_time = existing.departure_time,
      boarding_location = existing.boarding_location,
      price_per_person = existing.price_per_person,
      payment_methods = existing.payment_methods,
      included_items = existing.included_items,
      not_included_items = existing.not_included_items,
      transport_info = existing.transport_info,
      lodging_info = existing.lodging_info,
      total_spots = existing.total_spots,
      available_spots = existing.available_spots,
      notes = existing.notes,
      status = existing.status,
      is_featured = existing.is_featured,
      is_published = existing.is_published,
    } = req.body;

    const validStatuses = ['Disponível', 'Poucas vagas', 'Esgotada', 'Encerrada', 'Em breve'];
    const finalStatus = validStatuses.includes(status) ? status : existing.status;
    const slug = String(name).trim() !== existing.name
      ? uniqueSlug('trips', `${name}-${destination}`, tripId)
      : existing.slug;

    const parsedTotalSpots = total_spots !== '' && total_spots !== null && total_spots !== undefined ? Number(total_spots) : null;
    const parsedAvailSpots = available_spots !== '' && available_spots !== null && available_spots !== undefined ? Number(available_spots) : null;

    db.prepare(`
      UPDATE trips SET
        name = ?, slug = ?, destination = ?, destination_id = ?, cover_image = ?,
        short_description = ?, full_description = ?,
        departure_date = ?, return_date = ?, departure_time = ?, boarding_location = ?,
        price_per_person = ?, payment_methods = ?,
        included_items = ?, not_included_items = ?,
        transport_info = ?, lodging_info = ?,
        total_spots = ?, available_spots = ?, notes = ?,
        status = ?, is_featured = ?, is_published = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      String(name).trim(),
      slug,
      String(destination).trim(),
      destination_id ? Number(destination_id) : null,
      cover_image,
      short_description,
      full_description,
      departure_date,
      return_date,
      departure_time,
      boarding_location,
      price_per_person,
      payment_methods,
      included_items,
      not_included_items,
      transport_info,
      lodging_info,
      parsedTotalSpots,
      parsedAvailSpots,
      notes,
      finalStatus,
      is_featured ? 1 : 0,
      is_published ? 1 : 0,
      tripId
    );

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_TRIP',
      entityType: 'trip',
      entityId: tripId,
      details: { name: String(name).trim(), status: finalStatus, is_published: Boolean(is_published) },
    });

    return res.json({
      message: 'Viagem atualizada com sucesso!',
      trip: getTripFull(tripId),
    });
  } catch (err) {
    console.error('Erro ao atualizar viagem:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar a viagem.' });
  }
});

router.delete('/trips/:id', (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!existing) return res.status(404).json({ error: 'Viagem não encontrada.' });

    db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'DELETE_TRIP',
      entityType: 'trip',
      entityId: tripId,
      details: { name: existing.name },
    });

    return res.json({ message: 'Viagem excluída com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir a viagem.' });
  }
});

// Trip Gallery Images
router.post('/trips/:id/images', (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });

    const { image_url, caption, category, is_primary, images } = req.body;
    const currentMaxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM trip_images WHERE trip_id = ?').get(tripId).m;

    const listToInsert = Array.isArray(images)
      ? images
      : image_url
        ? [{ image_url, caption, category, is_primary }]
        : [];

    if (listToInsert.length === 0) {
      return res.status(400).json({ error: 'Informe a imagem para adicionar à galeria da viagem.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO trip_images (trip_id, image_url, caption, category, is_primary, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    listToInsert.forEach((item, idx) => {
      const url = typeof item === 'string' ? item : item.image_url;
      if (!url) return;
      const makePrimary = item.is_primary ? 1 : 0;
      if (makePrimary) {
        db.prepare('UPDATE trip_images SET is_primary = 0 WHERE trip_id = ?').run(tripId);
        db.prepare("UPDATE trips SET cover_image = ?, updated_at = datetime('now') WHERE id = ?").run(url, tripId);
      }
      insertStmt.run(
        tripId,
        url,
        item.caption || null,
        item.category || 'Geral',
        makePrimary,
        currentMaxOrder + 1 + idx
      );
    });

    return res.status(201).json({
      message: 'Imagem(ns) adicionada(s) à galeria da viagem!',
      trip: getTripFull(tripId),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao adicionar imagem à viagem.' });
  }
});

router.put('/trips/:id/images/:imageId', (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    const img = db.prepare('SELECT * FROM trip_images WHERE id = ? AND trip_id = ?').get(imageId, tripId);
    if (!img) return res.status(404).json({ error: 'Imagem não encontrada.' });

    const {
      image_url = img.image_url,
      caption = img.caption,
      category = img.category,
      is_primary,
      sort_order = img.sort_order,
    } = req.body;

    if (is_primary) {
      db.prepare('UPDATE trip_images SET is_primary = 0 WHERE trip_id = ?').run(tripId);
      db.prepare("UPDATE trips SET cover_image = ?, updated_at = datetime('now') WHERE id = ?").run(image_url, tripId);
    }

    db.prepare(`
      UPDATE trip_images
      SET image_url = ?, caption = ?, category = ?, is_primary = ?, sort_order = ?
      WHERE id = ? AND trip_id = ?
    `).run(
      image_url,
      caption,
      category || 'Geral',
      is_primary !== undefined ? (is_primary ? 1 : 0) : img.is_primary,
      Number(sort_order),
      imageId,
      tripId
    );

    return res.json({
      message: 'Imagem atualizada!',
      trip: getTripFull(tripId),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar imagem da viagem.' });
  }
});

router.delete('/trips/:id/images/:imageId', (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    const img = db.prepare('SELECT * FROM trip_images WHERE id = ? AND trip_id = ?').get(imageId, tripId);
    if (!img) return res.status(404).json({ error: 'Imagem não encontrada.' });

    db.prepare('DELETE FROM trip_images WHERE id = ? AND trip_id = ?').run(imageId, tripId);

    if (img.is_primary) {
      const nextImg = db.prepare('SELECT * FROM trip_images WHERE trip_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1').get(tripId);
      if (nextImg) {
        db.prepare('UPDATE trip_images SET is_primary = 1 WHERE id = ?').run(nextImg.id);
        db.prepare("UPDATE trips SET cover_image = ?, updated_at = datetime('now') WHERE id = ?").run(nextImg.image_url, tripId);
      }
    }

    return res.json({
      message: 'Imagem removida da viagem.',
      trip: getTripFull(tripId),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover imagem.' });
  }
});

// ==========================================
// 5. GERENCIAMENTO DE DISPONIBILIDADE
// ==========================================
router.get('/availability', (req, res) => {
  try {
    const { itemType, itemId } = req.query;
    let sql = 'SELECT * FROM availability WHERE 1=1';
    const params = [];
    if (itemType) {
      sql += ' AND item_type = ?';
      params.push(String(itemType));
    }
    if (itemId) {
      sql += ' AND item_id = ?';
      params.push(Number(itemId));
    }
    sql += ' ORDER BY available_date ASC';
    const slots = db.prepare(sql).all(...params);
    return res.json({ availability: slots });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar disponibilidades.' });
  }
});

router.post('/availability', (req, res) => {
  try {
    const { item_type, item_id, available_date, max_capacity, status, price_note, notes } = req.body;
    if (!item_type || !item_id || !available_date) {
      return res.status(400).json({ error: 'Informe o tipo, o item e a data de disponibilidade.' });
    }

    const cap = Math.max(0, parseInt(max_capacity || '0', 10));
    const validStatus = ['available', 'limited', 'blocked', 'full'].includes(status) ? status : 'available';

    const existing = db.prepare(`
      SELECT * FROM availability WHERE item_type = ? AND item_id = ? AND available_date = ?
    `).get(String(item_type), Number(item_id), String(available_date));

    if (existing) {
      db.prepare(`
        UPDATE availability
        SET max_capacity = ?, status = ?, price_note = ?, notes = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(cap, validStatus, price_note || null, notes || null, existing.id);
    } else {
      db.prepare(`
        INSERT INTO availability (item_type, item_id, available_date, max_capacity, confirmed_count, status, price_note, notes)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?)
      `).run(String(item_type), Number(item_id), String(available_date), cap, validStatus, price_note || null, notes || null);
    }

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'UPSERT_AVAILABILITY',
      entityType: 'availability',
      entityId: `${item_type}-${item_id}-${available_date}`,
      details: { max_capacity: cap, status: validStatus },
    });

    const updatedSlots = db.prepare(`
      SELECT * FROM availability WHERE item_type = ? AND item_id = ? ORDER BY available_date ASC
    `).all(String(item_type), Number(item_id));

    return res.json({
      message: 'Disponibilidade atualizada com sucesso!',
      availability: updatedSlots,
    });
  } catch (err) {
    console.error('Erro ao salvar disponibilidade:', err);
    return res.status(500).json({ error: 'Erro ao salvar disponibilidade.' });
  }
});

router.delete('/availability/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM availability WHERE id = ?').run(Number(req.params.id));
    return res.json({ message: 'Data de disponibilidade removida.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover disponibilidade.' });
  }
});

// ==========================================
// 6. GERENCIAMENTO DE AGENDAMENTOS E SOLICITAÇÕES
// ==========================================
router.get('/bookings', (req, res) => {
  try {
    const { status, search, itemType } = req.query;
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(String(status));
    }
    if (itemType) {
      sql += ' AND item_type = ?';
      params.push(String(itemType));
    }
    if (search) {
      const term = `%${String(search).toLowerCase()}%`;
      sql += ' AND (lower(booking_code) LIKE ? OR lower(customer_name) LIKE ? OR lower(customer_email) LIKE ? OR lower(item_name) LIKE ?)';
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC';
    const bookings = db.prepare(sql).all(...params);
    return res.json({ bookings });
  } catch (err) {
    console.error('Erro ao listar agendamentos:', err);
    return res.status(500).json({ error: 'Erro ao carregar solicitações de agendamento.' });
  }
});

router.get('/bookings/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(req.params.id));
  if (!booking) return res.status(404).json({ error: 'Solicitação não encontrada.' });
  return res.json({ booking });
});

router.put('/bookings/:id', (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!existing) {
      return res.status(404).json({ error: 'Solicitação de agendamento não encontrada.' });
    }

    const {
      status = existing.status,
      admin_notes = existing.admin_notes,
      customer_feedback_note = existing.customer_feedback_note,
      desired_date = existing.desired_date,
      people_count = existing.people_count,
    } = req.body;

    const validStatuses = [
      'Aguardando análise',
      'Aprovado',
      'Recusado',
      'Aguardando pagamento',
      'Confirmado',
      'Cancelado',
      'Concluído',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status de agendamento inválido.' });
    }

    const nextPeople = Math.max(1, parseInt(people_count || existing.people_count, 10));
    const nextDate = String(desired_date || existing.desired_date);
    const wasConfirmed = existing.status === 'Confirmado';
    const willBeConfirmed = status === 'Confirmado';

    // Check conflicts when confirming a reservation
    if (willBeConfirmed && !wasConfirmed && existing.item_id) {
      if (existing.item_type === 'trip') {
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(existing.item_id);
        if (trip && trip.available_spots !== null && trip.available_spots !== undefined) {
          if (nextPeople > trip.available_spots) {
            return res.status(409).json({
              error: `Conflito de disponibilidade: a viagem possui apenas ${trip.available_spots} vaga(s) restante(s), insuficiente para confirmar ${nextPeople} pessoa(s).`,
            });
          }
        }
      }

      const slot = db.prepare(`
        SELECT * FROM availability
        WHERE item_type = ? AND item_id = ? AND available_date = ?
      `).get(existing.item_type, existing.item_id, nextDate);

      const otherConfirmed = db.prepare(`
        SELECT COALESCE(SUM(people_count), 0) as total_confirmed
        FROM bookings
        WHERE item_type = ? AND item_id = ? AND desired_date = ? AND status = 'Confirmado' AND id != ?
      `).get(existing.item_type, existing.item_id, nextDate, bookingId);

      const confirmedSum = otherConfirmed ? Number(otherConfirmed.total_confirmed) : 0;

      if (slot) {
        if (slot.status === 'blocked') {
          return res.status(409).json({
            error: `Conflito de disponibilidade: a data ${nextDate} está bloqueada no calendário de disponibilidade.`,
          });
        }
        if (slot.max_capacity > 0 && confirmedSum + nextPeople > slot.max_capacity) {
          const remaining = Math.max(0, slot.max_capacity - confirmedSum);
          return res.status(409).json({
            error: `Conflito de disponibilidade: capacidade máxima para ${nextDate} é de ${slot.max_capacity} vaga(s) e já existem ${confirmedSum} confirmada(s) (restam ${remaining}).`,
          });
        }
      }
    }

    // Update booking record
    db.prepare(`
      UPDATE bookings
      SET status = ?,
          admin_notes = ?,
          customer_feedback_note = ?,
          desired_date = ?,
          people_count = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(status, admin_notes, customer_feedback_note, nextDate, nextPeople, bookingId);

    // Sync capacity counters when transitioning to/from 'Confirmado'
    if (!wasConfirmed && willBeConfirmed && existing.item_id) {
      if (existing.item_type === 'trip') {
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(existing.item_id);
        if (trip && trip.available_spots !== null && trip.available_spots !== undefined) {
          const newAvail = Math.max(0, trip.available_spots - nextPeople);
          const nextTripStatus = newAvail === 0 ? 'Esgotada' : newAvail <= 5 ? 'Poucas vagas' : trip.status;
          db.prepare("UPDATE trips SET available_spots = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
            .run(newAvail, nextTripStatus, existing.item_id);
        }
      }

      const slot = db.prepare(`
        SELECT * FROM availability WHERE item_type = ? AND item_id = ? AND available_date = ?
      `).get(existing.item_type, existing.item_id, nextDate);

      if (slot) {
        const newConfirmedCount = Number(slot.confirmed_count || 0) + nextPeople;
        const newSlotStatus = slot.max_capacity > 0 && newConfirmedCount >= slot.max_capacity ? 'full' : slot.status;
        db.prepare(`
          UPDATE availability
          SET confirmed_count = ?, status = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(newConfirmedCount, newSlotStatus, slot.id);
      }
    } else if (wasConfirmed && !willBeConfirmed && existing.item_id) {
      if (existing.item_type === 'trip') {
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(existing.item_id);
        if (trip && trip.available_spots !== null && trip.available_spots !== undefined) {
          const newAvail = trip.available_spots + existing.people_count;
          const nextTripStatus = trip.status === 'Esgotada' && newAvail > 0 ? 'Disponível' : trip.status;
          db.prepare("UPDATE trips SET available_spots = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
            .run(newAvail, nextTripStatus, existing.item_id);
        }
      }

      const slot = db.prepare(`
        SELECT * FROM availability WHERE item_type = ? AND item_id = ? AND available_date = ?
      `).get(existing.item_type, existing.item_id, existing.desired_date);

      if (slot) {
        const newConfirmedCount = Math.max(0, Number(slot.confirmed_count || 0) - existing.people_count);
        const newSlotStatus = slot.status === 'full' && (slot.max_capacity === 0 || newConfirmedCount < slot.max_capacity)
          ? 'available'
          : slot.status;
        db.prepare(`
          UPDATE availability
          SET confirmed_count = ?, status = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(newConfirmedCount, newSlotStatus, slot.id);
      }
    }

    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

    // Send customer notification
    let targetUserId = updatedBooking.user_id;
    if (!targetUserId && updatedBooking.customer_email) {
      const matchedUser = db.prepare("SELECT id FROM users WHERE lower(email) = lower(?) AND role = 'customer'").get(updatedBooking.customer_email);
      if (matchedUser) targetUserId = matchedUser.id;
    }

    if (targetUserId) {
      let notifTitle = 'Atualização de status na sua solicitação';
      let notifType = 'status_update';
      if (status === 'Aprovado') {
        notifTitle = 'Agendamento aprovado!';
        notifType = 'booking_approved';
      } else if (status === 'Recusado') {
        notifTitle = 'Agendamento recusado';
        notifType = 'booking_rejected';
      } else if (status === 'Confirmado') {
        notifTitle = 'Reserva confirmada!';
        notifType = 'booking_confirmed';
      } else if (
        nextDate !== existing.desired_date ||
        nextPeople !== existing.people_count ||
        customer_feedback_note !== existing.customer_feedback_note
      ) {
        notifTitle = 'Alteração importante na reserva';
        notifType = 'booking_changed';
      }

      const extraNote = customer_feedback_note ? ` Observação da Celina: "${customer_feedback_note}".` : '';
      createNotification({
        recipientRole: 'customer',
        recipientUserId: targetUserId,
        type: notifType,
        title: notifTitle,
        message: `O status da solicitação ${updatedBooking.booking_code} (${updatedBooking.item_name}) foi atualizado para "${status}".${extraNote}`,
        link: '/minha-conta?tab=agendamentos',
        relatedBookingId: bookingId,
      });
    }

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_BOOKING',
      entityType: 'booking',
      entityId: updatedBooking.booking_code,
      details: { previousStatus: existing.status, newStatus: status, admin_notes },
    });

    return res.json({
      message: `Solicitação ${updatedBooking.booking_code} atualizada para "${status}"!`,
      booking: updatedBooking,
    });
  } catch (err) {
    console.error('Erro ao atualizar solicitação:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar a solicitação.' });
  }
});

// ==========================================
// 7. GERENCIAMENTO DE CLIENTES (SEM EXPOR SENHAS!)
// ==========================================
router.get('/customers', (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT
        u.id, u.name, u.email, u.phone, u.role, u.is_active,
        u.deactivation_reason, u.lgpd_consent, u.lgpd_consent_at,
        u.created_at, u.updated_at,
        (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id OR lower(b.customer_email) = lower(u.email)) as bookings_count
      FROM users u
      WHERE u.role = 'customer'
    `;
    const params = [];

    if (search) {
      const term = `%${String(search).toLowerCase()}%`;
      sql += ' AND (lower(u.name) LIKE ? OR lower(u.email) LIKE ? OR lower(u.phone) LIKE ?)';
      params.push(term, term, term);
    }

    sql += ' ORDER BY u.created_at DESC';
    const customers = db.prepare(sql).all(...params).map((c) => ({
      ...c,
      is_active: Boolean(c.is_active),
      lgpd_consent: Boolean(c.lgpd_consent),
    }));

    return res.json({ customers });
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    return res.status(500).json({ error: 'Erro ao carregar clientes cadastrados.' });
  }
});

router.get('/customers/:id', (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const customer = db.prepare(`
      SELECT
        id, name, email, phone, role, is_active,
        deactivation_reason, lgpd_consent, lgpd_consent_at,
        created_at, updated_at
      FROM users
      WHERE id = ? AND role = 'customer'
    `).get(customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const bookings = db.prepare(`
      SELECT * FROM bookings
      WHERE user_id = ? OR lower(customer_email) = lower(?)
      ORDER BY created_at DESC
    `).all(customer.id, customer.email || '');

    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE user_id = ? OR lower(email) = lower(?)
      ORDER BY created_at DESC
    `).all(customer.id, customer.email || '');

    return res.json({
      customer: {
        ...customer,
        is_active: Boolean(customer.is_active),
        lgpd_consent: Boolean(customer.lgpd_consent),
      },
      bookings,
      messages,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao consultar detalhes do cliente.' });
  }
});

router.put('/customers/:id/status', (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const { is_active, reason, authorized } = req.body;

    const customer = db.prepare(`
      SELECT id, name, email, is_active FROM users WHERE id = ? AND role = 'customer'
    `).get(customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const nextActive = Boolean(is_active);
    if (!nextActive) {
      if (!reason || String(reason).trim().length < 5) {
        return res.status(400).json({
          error: 'Para desativar uma conta de cliente, é obrigatório informar a justificativa (mínimo 5 caracteres).',
        });
      }
      if (!authorized) {
        return res.status(400).json({
          error: 'Confirme a autorização administrativa para desativar a conta.',
        });
      }
    }

    db.prepare(`
      UPDATE users
      SET is_active = ?, deactivation_reason = ?, updated_at = datetime('now')
      WHERE id = ? AND role = 'customer'
    `).run(nextActive ? 1 : 0, nextActive ? null : String(reason).trim(), customerId);

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: nextActive ? 'ACTIVATE_CUSTOMER' : 'DEACTIVATE_CUSTOMER',
      entityType: 'customer',
      entityId: customerId,
      details: { email: customer.email, reason: nextActive ? 'Reativação' : String(reason).trim() },
    });

    return res.json({
      message: nextActive ? 'Conta do cliente reativada com sucesso.' : 'Conta do cliente desativada com justificativa registrada.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar status da conta do cliente.' });
  }
});

// ==========================================
// 8. GERENCIAMENTO DE CONTEÚDO E CONFIGURAÇÕES DO SITE
// ==========================================
router.get('/settings', (req, res) => {
  try {
    return res.json({ settings: getSiteSettingsObject() });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao carregar configurações do site.' });
  }
});

router.put('/settings', (req, res) => {
  try {
    const updates = req.body || {};
    const upsert = db.prepare(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    for (const [key, val] of Object.entries(updates)) {
      if (typeof key !== 'string') continue;
      const serialized = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
      upsert.run(key, serialized);
    }

    logAdminAction({
      adminUserId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_SITE_SETTINGS',
      entityType: 'site_settings',
      details: { updatedKeys: Object.keys(updates) },
    });

    return res.json({
      message: 'Conteúdo e configurações do site atualizados com sucesso!',
      settings: getSiteSettingsObject(),
    });
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    return res.status(500).json({ error: 'Erro ao salvar configurações do site.' });
  }
});

// ==========================================
// 9. PERGUNTAS FREQUENTES (FAQ)
// ==========================================
router.get('/faqs', (req, res) => {
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC').all();
  return res.json({ faqs: faqs.map((f) => ({ ...f, is_published: Boolean(f.is_published) })) });
});

router.post('/faqs', (req, res) => {
  try {
    const { question, answer, category, is_published, sort_order } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Preencha a pergunta e a resposta.' });
    }
    const result = db.prepare(`
      INSERT INTO faqs (question, answer, category, is_published, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      String(question).trim(),
      String(answer).trim(),
      category || 'Geral',
      is_published === false ? 0 : 1,
      Number(sort_order || 0)
    );
    const created = db.prepare('SELECT * FROM faqs WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ message: 'Pergunta frequente cadastrada!', faq: created });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cadastrar pergunta frequente.' });
  }
});

router.put('/faqs/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM faqs WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Pergunta não encontrada.' });

    const {
      question = existing.question,
      answer = existing.answer,
      category = existing.category,
      is_published = existing.is_published,
      sort_order = existing.sort_order,
    } = req.body;

    db.prepare(`
      UPDATE faqs
      SET question = ?, answer = ?, category = ?, is_published = ?, sort_order = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(String(question).trim(), String(answer).trim(), category, is_published ? 1 : 0, Number(sort_order), id);

    const updated = db.prepare('SELECT * FROM faqs WHERE id = ?').get(id);
    return res.json({ message: 'Pergunta frequente atualizada!', faq: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar pergunta frequente.' });
  }
});

router.delete('/faqs/:id', (req, res) => {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Pergunta frequente excluída.' });
});

// ==========================================
// 10. DEPOIMENTOS DE CLIENTES
// ==========================================
router.get('/testimonials', (req, res) => {
  const testimonials = db.prepare('SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC').all();
  return res.json({
    testimonials: testimonials.map((t) => ({ ...t, is_published: Boolean(t.is_published) })),
  });
});

router.post('/testimonials', (req, res) => {
  try {
    const { customer_name, city_state, content, rating, item_visited, is_published, sort_order } = req.body;
    if (!customer_name || !content) {
      return res.status(400).json({ error: 'Informe o nome do cliente e o depoimento.' });
    }
    const result = db.prepare(`
      INSERT INTO testimonials (customer_name, city_state, content, rating, item_visited, is_published, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(customer_name).trim(),
      city_state || null,
      String(content).trim(),
      Math.min(5, Math.max(1, Number(rating || 5))),
      item_visited || null,
      is_published === false ? 0 : 1,
      Number(sort_order || 0)
    );
    const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ message: 'Depoimento cadastrado!', testimonial: created });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao salvar depoimento.' });
  }
});

router.put('/testimonials/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Depoimento não encontrado.' });

    const {
      customer_name = existing.customer_name,
      city_state = existing.city_state,
      content = existing.content,
      rating = existing.rating,
      item_visited = existing.item_visited,
      is_published = existing.is_published,
      sort_order = existing.sort_order,
    } = req.body;

    db.prepare(`
      UPDATE testimonials
      SET customer_name = ?, city_state = ?, content = ?, rating = ?, item_visited = ?, is_published = ?, sort_order = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      String(customer_name).trim(),
      city_state,
      String(content).trim(),
      Math.min(5, Math.max(1, Number(rating || 5))),
      item_visited,
      is_published ? 1 : 0,
      Number(sort_order || 0),
      id
    );
    const updated = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    return res.json({ message: 'Depoimento atualizado!', testimonial: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar depoimento.' });
  }
});

router.delete('/testimonials/:id', (req, res) => {
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Depoimento excluído.' });
});

// ==========================================
// 11. GALERIA DE IMAGENS DO SITE E DESTINOS
// ==========================================
router.get('/gallery', (req, res) => {
  const gallery = db.prepare('SELECT * FROM gallery_items ORDER BY sort_order ASC, id DESC').all();
  return res.json({ gallery: gallery.map((g) => ({ ...g, is_published: Boolean(g.is_published) })) });
});

router.post('/gallery', (req, res) => {
  try {
    const { title, category, image_url, description, is_published, sort_order } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Informe o título e a imagem.' });
    }
    const result = db.prepare(`
      INSERT INTO gallery_items (title, category, image_url, description, is_published, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      String(title).trim(),
      category || 'Destinos e Lazer',
      image_url,
      description || null,
      is_published === false ? 0 : 1,
      Number(sort_order || 0)
    );
    const item = db.prepare('SELECT * FROM gallery_items WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ message: 'Foto adicionada à galeria institucional!', item });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao adicionar foto à galeria.' });
  }
});

router.delete('/gallery/:id', (req, res) => {
  db.prepare('DELETE FROM gallery_items WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Foto removida da galeria.' });
});

// Destinations CRUD
router.get('/destinations', (req, res) => {
  const destinations = db.prepare('SELECT * FROM destinations ORDER BY name ASC').all();
  return res.json({ destinations });
});

router.post('/destinations', (req, res) => {
  try {
    const { name, city, state, description, cover_image } = req.body;
    if (!name || !city || !state) {
      return res.status(400).json({ error: 'Informe nome, cidade e estado do destino.' });
    }
    const slug = uniqueSlug('destinations', `${name}-${city}`);
    const result = db.prepare(`
      INSERT INTO destinations (name, slug, city, state, description, cover_image, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(String(name).trim(), slug, String(city).trim(), String(state).trim().toUpperCase(), description || null, cover_image || null);
    const created = db.prepare('SELECT * FROM destinations WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ message: 'Destino cadastrado!', destination: created });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cadastrar destino.' });
  }
});

router.delete('/destinations/:id', (req, res) => {
  db.prepare('DELETE FROM destinations WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Destino removido.' });
});

// ==========================================
// 12. MENSAGENS DE CONTATO E LOGS DE AUDITORIA
// ==========================================
router.get('/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  return res.json({ messages });
});

router.put('/messages/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Mensagem não encontrada.' });

    const { status = existing.status, admin_notes = existing.admin_notes } = req.body;
    db.prepare(`
      UPDATE messages SET status = ?, admin_notes = ?, updated_at = datetime('now') WHERE id = ?
    `).run(status, admin_notes, id);

    const updated = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    return res.json({ message: 'Mensagem atualizada!', item: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar mensagem.' });
  }
});

router.delete('/messages/:id', (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Mensagem excluída.' });
});

router.get('/audit-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  return res.json({ logs });
});

module.exports = router;
