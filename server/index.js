const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { ensureDatabaseReady } = require('./db');

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

// Ensure SQLite / sql.js is initialized before handling any API request
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseReady();
    next();
  } catch (err) {
    next(err);
  }
});

// Security headers (allowing iframe embedding for Arena live preview)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Static files for uploaded images & public assets
app.use('/uploads', express.static(config.uploadsDir));
app.use('/assets', express.static(path.resolve(process.cwd(), 'public/assets')));

// Rate limiting for login/register endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Celina Sousa Turismo API' });
});

// Serve frontend build in production when running standalone Node server
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/assets')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Erro não tratado no servidor:', err);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

let server = null;
if (require.main === module) {
  ensureDatabaseReady().then(() => {
    server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`Servidor Celina Sousa Turismo rodando em http://0.0.0.0:${config.port}`);
    });
  });
}

module.exports = { app, server };
