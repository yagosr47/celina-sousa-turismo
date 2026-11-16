const fs = require('fs');
const path = require('path');
const config = require('./config');

const dbDir = path.dirname(config.databasePath);
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
  }
} catch {}

let DatabaseSync = null;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch {
  DatabaseSync = null;
}

class SqlJsSyncAdapter {
  constructor(filePath) {
    this.filePath = filePath;
    this.rawDb = null;
  }

  initWithSqlJs(SQL) {
    if (this.rawDb) return;
    if (fs.existsSync(this.filePath)) {
      const buf = fs.readFileSync(this.filePath);
      this.rawDb = new SQL.Database(new Uint8Array(buf));
    } else {
      this.rawDb = new SQL.Database();
    }
  }

  persist() {
    if (!this.rawDb) return;
    try {
      const data = this.rawDb.export();
      fs.writeFileSync(this.filePath, Buffer.from(data));
    } catch {}
  }

  exec(sql) {
    if (!this.rawDb) return;
    this.rawDb.exec(sql);
    this.persist();
  }

  prepare(sql) {
    const self = this;
    return {
      get(...params) {
        if (!self.rawDb) return undefined;
        const stmt = self.rawDb.prepare(sql);
        try {
          if (params.length > 0) stmt.bind(params.map((p) => (p === undefined ? null : p)));
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params) {
        if (!self.rawDb) return [];
        const stmt = self.rawDb.prepare(sql);
        const rows = [];
        try {
          if (params.length > 0) stmt.bind(params.map((p) => (p === undefined ? null : p)));
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          return rows;
        } finally {
          stmt.free();
        }
      },
      run(...params) {
        if (!self.rawDb) return { lastInsertRowid: 0, changes: 0 };
        self.rawDb.run(
          sql,
          params.map((p) => (p === undefined ? null : p))
        );
        const res = self.rawDb.exec('SELECT last_insert_rowid()');
        const lastInsertRowid = res?.[0]?.values?.[0]?.[0] || 0;
        const changes = self.rawDb.getRowsModified();
        self.persist();
        return { lastInsertRowid, changes };
      },
    };
  }
}

const db = DatabaseSync
  ? new DatabaseSync(config.databasePath)
  : new SqlJsSyncAdapter(config.databasePath);

let dbInitialized = false;
let sqlJsReadyPromise = null;

async function ensureDatabaseReady() {
  if (dbInitialized) return;
  if (!DatabaseSync) {
    if (!sqlJsReadyPromise) {
      const initSqlJs = require('sql.js');
      sqlJsReadyPromise = initSqlJs().then((SQL) => {
        db.initWithSqlJs(SQL);
        initDatabase();
        dbInitialized = true;
      });
    }
    await sqlJsReadyPromise;
  } else {
    initDatabase();
    dbInitialized = true;
  }
}

if (DatabaseSync) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      must_change_password INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      deactivation_reason TEXT,
      lgpd_consent INTEGER NOT NULL DEFAULT 1,
      lgpd_consent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      address_location TEXT,
      short_description TEXT,
      summary_info TEXT,
      full_description TEXT,
      characteristics TEXT,
      structure_available TEXT,
      pools_info TEXT,
      leisure_areas TEXT,
      restaurants_food TEXT,
      services_available TEXT,
      usage_rules TEXT,
      visitor_info TEXT,
      differentials TEXT,
      important_notes TEXT,
      price_info TEXT,
      payment_conditions TEXT,
      promotions TEXT,
      available_dates TEXT,
      related_packages TEXT,
      additional_commercial_info TEXT,
      cover_image TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS club_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT,
      category TEXT DEFAULT 'Geral',
      is_primary INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      destination TEXT NOT NULL,
      destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
      cover_image TEXT,
      short_description TEXT,
      full_description TEXT,
      departure_date TEXT,
      return_date TEXT,
      departure_time TEXT,
      boarding_location TEXT,
      price_per_person TEXT,
      payment_methods TEXT,
      included_items TEXT,
      not_included_items TEXT,
      transport_info TEXT,
      lodging_info TEXT,
      total_spots INTEGER,
      available_spots INTEGER,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Disponível' CHECK(status IN ('Disponível', 'Poucas vagas', 'Esgotada', 'Encerrada', 'Em breve')),
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trip_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT,
      category TEXT DEFAULT 'Geral',
      is_primary INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL CHECK(item_type IN ('club', 'trip')),
      item_id INTEGER NOT NULL,
      available_date TEXT NOT NULL,
      max_capacity INTEGER NOT NULL DEFAULT 0,
      confirmed_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'limited', 'blocked', 'full')),
      price_note TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(item_type, item_id, available_date)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      item_type TEXT NOT NULL CHECK(item_type IN ('club', 'trip', 'destination')),
      item_id INTEGER,
      item_name TEXT NOT NULL,
      desired_date TEXT NOT NULL,
      return_date TEXT,
      people_count INTEGER NOT NULL DEFAULT 1,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      additional_info TEXT,
      availability_verified INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Aguardando análise' CHECK(status IN (
        'Aguardando análise',
        'Aprovado',
        'Recusado',
        'Aguardando pagamento',
        'Confirmado',
        'Cancelado',
        'Concluído'
      )),
      admin_notes TEXT,
      customer_feedback_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      email TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      related_item_type TEXT,
      related_item_id INTEGER,
      related_item_name TEXT,
      status TEXT NOT NULL DEFAULT 'Nova' CHECK(status IN ('Nova', 'Lida', 'Respondida', 'Arquivada')),
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_role TEXT NOT NULL CHECK(recipient_role IN ('admin', 'customer')),
      recipient_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      related_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      city_state TEXT,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      item_visited TEXT,
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'Geral',
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gallery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Destinos e Lazer',
      image_url TEXT NOT NULL,
      description TEXT,
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      admin_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      phone TEXT,
      token_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'expired')),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // 1. Seed or update Admin user using irreversible cryptographic hash
  const existingAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (name, username, email, phone, password_hash, role, must_change_password, is_active)
      VALUES (?, 'adm_protegido', NULL, '64992065866', ?, 'admin', 0, 1)
    `).run(
      config.adminInitName || 'Celina Sousa',
      config.adminPassBcrypt
    );
  } else if (existingAdmin.must_change_password === 1 || existingAdmin.username !== 'adm_protegido') {
    db.prepare(`
      UPDATE users
      SET username = 'adm_protegido',
          password_hash = ?,
          must_change_password = 0,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(config.adminPassBcrypt, existingAdmin.id);
  }

  // 2. Seed Site Settings with ONLY verified facts from the official brand image & prompt
  const defaultSettings = {
    company_name: 'Celina Sousa Turismo',
    company_subtitle: 'Caldas Locações',
    logo_url: '/assets/images/logo-original.jpeg',
    hero_badge: 'Celina Sousa Turismo • Caldas Locações',
    hero_title: 'Clubes, Locações, Destinos e Viagens com Atendimento Personalizado',
    hero_subtitle: 'Conheça opções de lazer, clubes, hospedagens e viagens selecionadas por Celina Sousa Turismo. Solicite informações ou seu agendamento online com praticidade e segurança.',
    hero_banner_url: '/assets/images/hero-resort.jpg',
    presentation_title: 'Bem-vindo à Celina Sousa Turismo',
    presentation_text: 'A Celina Sousa Turismo — Caldas Locações atua na divulgação e intermediação de locações, clubes, parques aquáticos, hotéis, destinos turísticos e viagens. Nosso objetivo é oferecer um atendimento transparente, organizado e direto para que você e sua família planejem seus momentos de lazer com tranquilidade.',
    whatsapp_number: '64992065866',
    phone_display: '(64) 9 9206-5866',
    instagram_handle: '@celinasousaturismo',
    instagram_url: 'https://www.instagram.com/celinasousaturismo/',
    email_contact: '',
    address_info: '',
    business_hours: '',
    about_history: '',
    about_objective: 'Conectar clientes a clubes, locações em Caldas e região, destinos turísticos e excursões com atendimento dedicado, informações claras e acompanhamento em todas as etapas da solicitação.',
    about_services: JSON.stringify([
      'Caldas Locações — Locações para temporada e lazer',
      'Divulgação e agendamento de Clubes e Parques Aquáticos',
      'Hotéis, Hospedagens e Destinos Turísticos',
      'Viagens e Excursões organizadas',
      'Atendimento personalizado via plataforma e WhatsApp'
    ]),
    about_differentials: JSON.stringify([
      'Atendimento direto e humanizado com Celina Sousa',
      'Acompanhamento transparente do status da sua solicitação online',
      'Informações detalhadas e fotos organizadas de cada clube, local ou viagem',
      'Canal rápido via WhatsApp (64) 9 9206-5866 e Instagram @celinasousaturismo'
    ]),
    about_image_url: '/assets/images/about-tourism.jpg',
    about_secondary_image_url: '/assets/images/resort-apartment.jpg',
    promotions_banner_title: '',
    promotions_banner_text: '',
    promotions_active: '0',
    footer_text: 'Celina Sousa Turismo — Caldas Locações. Atendimento especializado em turismo, clubes, locações e viagens.',
    lgpd_notice: 'Seus dados pessoais (nome, e-mail e telefone) são coletados exclusivamente para o processamento de suas solicitações de agendamento, histórico de reservas e contato direto pela equipe da Celina Sousa Turismo, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).'
  };

  const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  // 3. Seed Initial Gallery Items (using authentic generated tourism images, editable by Celina)
  const galleryCount = db.prepare('SELECT COUNT(*) as c FROM gallery_items').get().c;
  if (galleryCount === 0) {
    const insertGallery = db.prepare(`
      INSERT INTO gallery_items (title, category, image_url, description, is_published, sort_order)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    insertGallery.run(
      'Águas Termais e Lazer',
      'Clubes e Piscinas',
      '/assets/images/hero-resort.jpg',
      'Ambientes de piscinas e lazer para toda a família.',
      1
    );
    insertGallery.run(
      'Parques Aquáticos e Diversão',
      'Parques Aquáticos',
      '/assets/images/waterpark-pools.jpg',
      'Estrutura de lazer aquático e descanso.',
      2
    );
    insertGallery.run(
      'Caldas Locações e Hospedagem',
      'Locações e Conforto',
      '/assets/images/resort-apartment.jpg',
      'Opções de locação e estadias confortáveis.',
      3
    );
    insertGallery.run(
      'Destinos e Viagens',
      'Viagens e Excursões',
      '/assets/images/travel-excursion.jpg',
      'Roteiros turísticos e viagens selecionadas.',
      4
    );
    insertGallery.run(
      'Descanso e Contemplação',
      'Hotéis e Resorts',
      '/assets/images/about-tourism.jpg',
      'Experiências de descanso com atendimento personalizado.',
      5
    );
  }

  // 4. Seed Initial FAQs (strictly factual about how the platform and consultation work, without inventing commercial policies)
  const faqCount = db.prepare('SELECT COUNT(*) as c FROM faqs').get().c;
  if (faqCount === 0) {
    const insertFaq = db.prepare(`
      INSERT INTO faqs (question, answer, category, is_published, sort_order)
      VALUES (?, ?, ?, 1, ?)
    `);
    insertFaq.run(
      'Como solicitar uma reserva ou agendamento?',
      'Você pode escolher o clube, destino ou viagem desejada aqui no site, selecionar a data pretendida e a quantidade de pessoas e enviar sua solicitação. A Celina receberá seu pedido no painel administrativo, verificará a disponibilidade e atualizará o status da sua reserva.',
      'Agendamentos',
      1
    );
    insertFaq.run(
      'Como consultar valores e condições de cada clube ou viagem?',
      'Os valores e condições comerciais cadastrados ficam visíveis na página de detalhes de cada clube ou viagem. Caso o item esteja sob consulta ou você deseje um orçamento específico para seu grupo, basta clicar em "Consultar disponibilidade" ou "Falar pelo WhatsApp".',
      'Valores e Consultas',
      2
    );
    insertFaq.run(
      'Como funciona o acompanhamento do meu agendamento?',
      'Ao criar sua conta gratuita no botão "Entrar", você tem acesso à Área do Cliente. Lá é possível visualizar o código identificador de cada solicitação e acompanhar todas as etapas (Aguardando análise, Aprovado, Aguardando pagamento, Confirmado ou Concluído).',
      'Agendamentos',
      3
    );
    insertFaq.run(
      'Quais são as formas de pagamento?',
      'As formas e condições de pagamento são informadas na descrição comercial de cada clube, locação ou pacote de viagem e confirmadas diretamente com a Celina Sousa Turismo durante a aprovação da sua solicitação.',
      'Pagamentos',
      4
    );
    insertFaq.run(
      'Como entrar em contato direto com a Celina Sousa Turismo?',
      'Você pode falar diretamente pelo WhatsApp no número (64) 9 9206-5866, acompanhar as novidades no Instagram @celinasousaturismo ou enviar uma mensagem pelo formulário na página de Contato.',
      'Atendimento',
      5
    );
    insertFaq.run(
      'Como consultar a disponibilidade de uma viagem ou excursão?',
      'Acesse a seção "Viagens e Pacotes" no menu principal para conferir o status atualizado de cada roteiro (Disponível, Poucas vagas, Em breve, Esgotada ou Encerrada) e enviar sua solicitação de reserva.',
      'Viagens',
      6
    );
  }
}

if (DatabaseSync) {
  initDatabase();
  dbInitialized = true;
}

module.exports = {
  db,
  slugify,
  ensureDatabaseReady,
};
