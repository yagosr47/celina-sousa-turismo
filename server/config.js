const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const crypto = require('crypto');

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex'),
  databasePath: path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/celina_turismo.db'),
  uploadsDir: path.resolve(process.cwd(), process.env.UPLOADS_DIR || './public/uploads'),
  adminInitUsername: process.env.ADMIN_INIT_USERNAME || '',
  adminInitPassword: process.env.ADMIN_INIT_PASSWORD || '',
  adminInitName: process.env.ADMIN_INIT_NAME || 'Celina Sousa',
};

module.exports = config;
