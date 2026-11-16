const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../db');
const {
  signUserToken,
  setAuthCookie,
  clearAuthCookie,
  sanitizeUser,
  requireAuth,
} = require('../middleware/auth');
const { createNotification, logAdminAction } = require('../utils/helpers');

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

// POST /api/auth/register (Customer registration)
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, lgpdConsent } = req.body;

    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ error: 'Informe seu nome completo (mínimo de 3 caracteres).' });
    }
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
    }
    const cleanPhone = String(phone || '').trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Informe um telefone/WhatsApp válido com DDD.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'A senha deve possuir pelo menos 6 caracteres.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'A confirmação de senha não confere com a senha digitada.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        error: 'Já existe uma conta cadastrada com este e-mail. Faça login ou recupere sua senha.',
      });
    }

    const passwordHash = bcrypt.hashSync(String(password), 10);
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, must_change_password, is_active, lgpd_consent, lgpd_consent_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'customer', 0, 1, ?, ?, datetime('now'), datetime('now'))
    `).run(
      String(name).trim(),
      normalizedEmail,
      cleanPhone,
      passwordHash,
      lgpdConsent === false ? 0 : 1,
      now
    );

    const newUserId = Number(result.lastInsertRowid);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);

    // Notify Celina of new account
    createNotification({
      recipientRole: 'admin',
      type: 'new_customer',
      title: 'Nova conta cadastrada',
      message: `O cliente ${user.name} (${user.email}) cadastrou-se na plataforma.`,
      link: '/painel-celina?tab=clientes',
    });

    // Welcome notification for customer
    createNotification({
      recipientRole: 'customer',
      recipientUserId: newUserId,
      type: 'welcome',
      title: 'Bem-vindo(a) à Celina Sousa Turismo!',
      message: 'Sua conta foi criada com sucesso. Agora você pode solicitar agendamentos e acompanhar o status em tempo real.',
      link: '/minha-conta',
    });

    const safeUser = sanitizeUser(user);
    const token = signUserToken(safeUser);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ error: 'Erro interno ao realizar o cadastro.' });
  }
});

// POST /api/auth/login (Customer & Admin Login)
router.post('/login', (req, res) => {
  try {
    const { identifier, email, username, password, loginMode } = req.body;
    const rawLogin = String(identifier || email || username || '').trim();

    if (!rawLogin || !password) {
      return res.status(400).json({ error: 'Informe suas credenciais de acesso e senha.' });
    }

    let user = null;
    if (loginMode === 'admin') {
      user = db.prepare(`
        SELECT * FROM users
        WHERE role = 'admin' AND (lower(username) = lower(?) OR lower(email) = lower(?))
      `).get(rawLogin, rawLogin);
    } else {
      user = db.prepare(`
        SELECT * FROM users
        WHERE lower(email) = lower(?) OR lower(username) = lower(?)
      `).get(rawLogin, rawLogin);
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu usuário/e-mail e senha.' });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Esta conta encontra-se desativada. Entre em contato com o atendimento da Celina Sousa Turismo.',
      });
    }

    const passwordValid = bcrypt.compareSync(String(password), user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu usuário/e-mail e senha.' });
    }

    if (loginMode === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        error: 'Esta conta não possui permissões administrativas. Utilize o login de clientes.',
      });
    }

    const safeUser = sanitizeUser(user);
    const token = signUserToken(safeUser);
    setAuthCookie(res, token);

    if (user.role === 'admin') {
      logAdminAction({
        adminUserId: user.id,
        adminName: user.name,
        action: 'LOGIN_ADMIN',
        entityType: 'auth',
        entityId: user.id,
        details: 'Acesso administrativo realizado com sucesso',
      });
    }

    return res.json({
      message: 'Login realizado com sucesso!',
      user: safeUser,
      token,
      redirectTo: user.role === 'admin' ? '/painel-celina' : '/minha-conta',
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno ao processar o login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: 'Sessão encerrada com sucesso.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  let unreadCount = 0;
  if (req.user.role === 'admin') {
    unreadCount = db.prepare(`
      SELECT COUNT(*) as c FROM notifications WHERE recipient_role = 'admin' AND is_read = 0
    `).get().c;
  } else {
    unreadCount = db.prepare(`
      SELECT COUNT(*) as c FROM notifications WHERE recipient_role = 'customer' AND recipient_user_id = ? AND is_read = 0
    `).get(req.user.id).c;
  }
  return res.json({
    user: req.user,
    unreadNotifications: unreadCount,
  });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, email, phone, username } = req.body;

    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ error: 'Informe um nome válido (mínimo de 3 caracteres).' });
    }

    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }

    if (normalizedEmail) {
      const emailConflict = db.prepare('SELECT id FROM users WHERE lower(email) = ? AND id != ?').get(normalizedEmail, req.user.id);
      if (emailConflict) {
        return res.status(409).json({ error: 'Este e-mail já está em uso por outra conta.' });
      }
    }

    let nextUsername = req.user.username;
    if (req.user.role === 'admin' && username !== undefined) {
      const trimmedUsername = String(username).trim();
      if (!trimmedUsername || trimmedUsername.length < 3) {
        return res.status(400).json({ error: 'O nome de usuário administrativo deve ter pelo menos 3 caracteres.' });
      }
      const userConflict = db.prepare('SELECT id FROM users WHERE lower(username) = lower(?) AND id != ?').get(trimmedUsername, req.user.id);
      if (userConflict) {
        return res.status(409).json({ error: 'Este nome de usuário já está em uso.' });
      }
      nextUsername = trimmedUsername;
    }

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, phone = ?, username = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      String(name).trim(),
      normalizedEmail,
      phone ? String(phone).trim() : null,
      nextUsername,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (req.user.role === 'admin') {
      logAdminAction({
        adminUserId: req.user.id,
        adminName: updated.name,
        action: 'UPDATE_ADMIN_PROFILE',
        entityType: 'user',
        entityId: req.user.id,
        details: { username: updated.username, email: updated.email },
      });
    }

    return res.json({
      message: 'Dados da conta atualizados com sucesso!',
      user: sanitizeUser(updated),
    });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar dados do perfil.' });
  }
});

// PUT /api/auth/password (Change password & First-access mandatory password exchange)
router.put('/password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword, newUsername, newEmail } = req.body;

    const fullUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!fullUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!currentPassword || !bcrypt.compareSync(String(currentPassword), fullUser.password_hash)) {
      return res.status(400).json({ error: 'A senha atual informada está incorreta.' });
    }

    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({
        error: 'A nova senha deve ter pelo menos 8 caracteres para maior segurança.',
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'A confirmação da nova senha não confere.' });
    }

    if (bcrypt.compareSync(String(newPassword), fullUser.password_hash)) {
      return res.status(400).json({
        error: 'A nova senha deve ser diferente da senha temporária/atual.',
      });
    }

    let updatedUsername = fullUser.username;
    let updatedEmail = fullUser.email;

    if (fullUser.role === 'admin') {
      if (newUsername && String(newUsername).trim().length >= 3) {
        const cleanU = String(newUsername).trim();
        const conflict = db.prepare('SELECT id FROM users WHERE lower(username) = lower(?) AND id != ?').get(cleanU, fullUser.id);
        if (conflict) {
          return res.status(409).json({ error: 'O novo nome de usuário escolhido já está em uso.' });
        }
        updatedUsername = cleanU;
      }
      if (newEmail !== undefined && String(newEmail).trim() !== '') {
        const cleanE = String(newEmail).trim().toLowerCase();
        if (!isValidEmail(cleanE)) {
          return res.status(400).json({ error: 'O e-mail informado não é válido.' });
        }
        const conflict = db.prepare('SELECT id FROM users WHERE lower(email) = ? AND id != ?').get(cleanE, fullUser.id);
        if (conflict) {
          return res.status(409).json({ error: 'O e-mail informado já está em uso.' });
        }
        updatedEmail = cleanE;
      }
    }

    const newHash = bcrypt.hashSync(String(newPassword), 10);
    db.prepare(`
      UPDATE users
      SET password_hash = ?, username = ?, email = ?, must_change_password = 0, updated_at = datetime('now')
      WHERE id = ?
    `).run(newHash, updatedUsername, updatedEmail, fullUser.id);

    const refreshed = db.prepare('SELECT * FROM users WHERE id = ?').get(fullUser.id);

    if (fullUser.role === 'admin') {
      logAdminAction({
        adminUserId: fullUser.id,
        adminName: refreshed.name,
        action: 'CHANGE_PASSWORD',
        entityType: 'user',
        entityId: fullUser.id,
        details: 'Senha administrativa atualizada com sucesso',
      });
    }

    return res.json({
      message: 'Senha alterada com sucesso!',
      user: sanitizeUser(refreshed),
    });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    return res.status(500).json({ error: 'Erro interno ao alterar a senha.' });
  }
});

// POST /api/auth/recover-password (Secure password recovery verifying email + registered phone)
router.post('/recover-password', (req, res) => {
  try {
    const { email, phone, newPassword, confirmPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanPhoneDigits = String(phone || '').replace(/\D/g, '');

    if (!normalizedEmail || !cleanPhoneDigits || cleanPhoneDigits.length < 8) {
      return res.status(400).json({
        error: 'Informe o e-mail e o telefone cadastrados na sua conta para validação de segurança.',
      });
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'A confirmação da nova senha não confere.' });
    }

    const user = db.prepare("SELECT * FROM users WHERE lower(email) = ? AND role = 'customer'").get(normalizedEmail);
    if (!user) {
      return res.status(404).json({
        error: 'Não encontramos uma conta com os dados informados. Verifique o e-mail e o telefone.',
      });
    }

    const userPhoneDigits = String(user.phone || '').replace(/\D/g, '');
    if (!userPhoneDigits || userPhoneDigits.slice(-8) !== cleanPhoneDigits.slice(-8)) {
      return res.status(400).json({
        error: 'O telefone informado não corresponde ao cadastro deste e-mail.',
      });
    }

    const newHash = bcrypt.hashSync(String(newPassword), 10);
    const tokenHash = crypto.createHash('sha256').update(`${user.id}-${Date.now()}`).digest('hex');

    db.prepare(`
      INSERT INTO password_reset_requests (user_id, email, phone, token_hash, status, expires_at)
      VALUES (?, ?, ?, ?, 'completed', datetime('now', '+1 hour'))
    `).run(user.id, normalizedEmail, cleanPhoneDigits, tokenHash);

    db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).run(newHash, user.id);

    createNotification({
      recipientRole: 'customer',
      recipientUserId: user.id,
      type: 'security',
      title: 'Senha redefinida com sucesso',
      message: 'Sua senha de acesso foi redefinida pelo processo de recuperação segura.',
      link: '/minha-conta',
    });

    return res.json({
      message: 'Sua senha foi redefinida com sucesso! Agora você já pode entrar na sua conta.',
    });
  } catch (err) {
    console.error('Erro na recuperação de senha:', err);
    return res.status(500).json({ error: 'Erro ao processar a recuperação de senha.' });
  }
});

module.exports = router;
