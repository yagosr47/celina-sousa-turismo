const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Hashes criptográficos irreversíveis (SHA-256 e Bcrypt) — nenhuma credencial fica em texto puro no repositório
const DEFAULT_ADMIN_USER_SHA256 = '966d873584b7ef3f41e6af248f7798a7c6467356b8a0918ccf0ab68cdb35b0ac';
const DEFAULT_ADMIN_PASS_BCRYPT = '$2a$10$sgE7DSJ7.ygWI7PidrrBU.TtjY.mKl6ll6eExrJr3FBQt3oUjdoZC';

const fallbackJwtSecret = crypto
  .createHash('sha256')
  .update(`cst-caldas-locacoes-jwt-${DEFAULT_ADMIN_USER_SHA256}-${DEFAULT_ADMIN_PASS_BCRYPT}`)
  .digest('hex');

const config = {
  isServerless,
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || fallbackJwtSecret,
  databasePath: isServerless
    ? '/tmp/celina_turismo.db'
    : path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/celina_turismo.db'),
  uploadsDir: isServerless
    ? '/tmp/uploads'
    : path.resolve(process.cwd(), process.env.UPLOADS_DIR || './public/uploads'),
  adminUserSha256: process.env.ADMIN_USER_SHA256 || DEFAULT_ADMIN_USER_SHA256,
  adminPassBcrypt: process.env.ADMIN_PASS_BCRYPT || DEFAULT_ADMIN_PASS_BCRYPT,
  adminInitName: process.env.ADMIN_INIT_NAME || 'Celina Sousa',
};

module.exports = config;
