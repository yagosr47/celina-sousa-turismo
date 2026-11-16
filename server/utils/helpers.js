const { db } = require('../db');

function createNotification({
  recipientRole,
  recipientUserId = null,
  type,
  title,
  message,
  link = null,
  relatedBookingId = null,
}) {
  try {
    db.prepare(`
      INSERT INTO notifications (recipient_role, recipient_user_id, type, title, message, link, related_booking_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      recipientRole,
      recipientUserId,
      type,
      title,
      message,
      link,
      relatedBookingId
    );
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
  }
}

function logAdminAction({
  adminUserId,
  adminName,
  action,
  entityType,
  entityId = null,
  details = null,
}) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (admin_user_id, admin_name, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      adminUserId || null,
      adminName || 'Administradora',
      action,
      entityType,
      entityId ? String(entityId) : null,
      typeof details === 'object' && details !== null ? JSON.stringify(details) : details
    );
  } catch (err) {
    console.error('Erro ao registrar log administrativo:', err);
  }
}

function generateBookingCode() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CST-${datePart}-${randomPart}`;
}

function getSiteSettingsObject() {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

module.exports = {
  createNotification,
  logAdminAction,
  generateBookingCode,
  getSiteSettingsObject,
};
