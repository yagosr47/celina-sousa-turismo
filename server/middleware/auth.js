const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../db');

const COOKIE_NAME = 'cst_auth_token';

function signUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  return null;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    must_change_password: Boolean(user.must_change_password),
    is_active: Boolean(user.is_active),
    lgpd_consent: Boolean(user.lgpd_consent),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function getAuthenticatedUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.prepare(`
      SELECT id, name, username, email, phone, role, must_change_password, is_active, lgpd_consent, created_at, updated_at
      FROM users WHERE id = ?
    `).get(decoded.id);
    if (!user || !user.is_active) return null;
    return sanitizeUser(user);
  } catch {
    return null;
  }
}

function optionalAuth(req, res, next) {
  req.user = getAuthenticatedUser(req);
  next();
}

function requireAuth(req, res, next) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão expirada ou não autenticada. Faça login para continuar.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Autenticação necessária para acessar o painel administrativo.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Esta área é exclusiva da administração da Celina Sousa Turismo.',
    });
  }
  req.user = user;
  next();
}

module.exports = {
  COOKIE_NAME,
  signUserToken,
  setAuthCookie,
  clearAuthCookie,
  sanitizeUser,
  optionalAuth,
  requireAuth,
  requireAdmin,
};
