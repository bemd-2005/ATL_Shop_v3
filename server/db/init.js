/* ================================================
   server/db/init.js  —  ATL Shop BDD init + seed
   Run: node server/db/init.js
   ================================================ */

require('dotenv').config();
const path    = require('path');
const fs      = require('fs');
const bcrypt  = require('bcryptjs');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(process.env.DB_PATH || './server/db/atl_shop.db');

// Créer le répertoire si absent
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📦 Initialisation de la base de données ATL Shop...');

// ── Création des tables ──────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT    UNIQUE NOT NULL,
    email        TEXT    UNIQUE NOT NULL,
    nom          TEXT    NOT NULL,
    password_hash TEXT   NOT NULL,
    role         TEXT    NOT NULL DEFAULT 'client' CHECK(role IN ('client','admin')),
    status       TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT    NOT NULL,
    slug        TEXT    UNIQUE NOT NULL,
    description TEXT,
    icon        TEXT    DEFAULT 'fa-tag',
    layout      TEXT    NOT NULL DEFAULT 'horizontal' CHECK(layout IN ('horizontal','vertical')),
    ordre       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    nom         TEXT    NOT NULL,
    description TEXT,
    prix        REAL    NOT NULL DEFAULT 0,
    image_url   TEXT    DEFAULT '',
    stock       INTEGER NOT NULL DEFAULT 0,
    visible     INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total      REAL    NOT NULL DEFAULT 0,
    status     TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipped','delivered','cancelled')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id     INTEGER REFERENCES products(id) ON DELETE SET NULL,
    nom_produit    TEXT    NOT NULL,
    quantity       INTEGER NOT NULL DEFAULT 1,
    price_at_time  REAL    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

console.log('✅ Tables créées');

// ── Seed : admin user ────────────────────────────
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('atl2025', 10);
  db.prepare(`
    INSERT INTO users (username, email, nom, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('admin', 'admin@atlsarl.cm', 'Administrateur', hash, 'admin');
  console.log('✅ Admin créé : admin / atl2025');
}

const client1 = db.prepare('SELECT id FROM users WHERE username = ?').get('client1');
if (!client1) {
  const hash = bcrypt.hashSync('client123', 10);
  db.prepare(`
    INSERT INTO users (username, email, nom, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('client1', 'client1@example.com', 'Jean Dupont', hash, 'client');
  console.log('✅ Client test créé : client1 / client123');
}

// ── Seed : catégories ────────────────────────────
const cats = [
  { nom:'Caméras & Sécurité',          slug:'cameras',      description:'Vidéosurveillance, DVR, contrôle accès', icon:'fa-video',               layout:'horizontal', ordre:1 },
  { nom:'Matériel Informatique',        slug:'electronique', description:'PC, laptops, périphériques',             icon:'fa-microchip',            layout:'vertical',   ordre:2 },
  { nom:'Réseaux & Connectique',        slug:'domotique',    description:'Câblage réseau, switches, modems',       icon:'fa-network-wired',        layout:'horizontal', ordre:3 },
  { nom:'Électricité & Éclairage',      slug:'logistique',   description:'Lampadaires, interrupteurs, prises',     icon:'fa-bolt',                 layout:'vertical',   ordre:4 },
  { nom:'Maintenance & Installation',   slug:'maintenance',  description:'Matériel d\'installation et maintenance', icon:'fa-screwdriver-wrench',  layout:'horizontal', ordre:5 },
];

const insertCat = db.prepare(`
  INSERT OR IGNORE INTO categories (nom, slug, description, icon, layout, ordre)
  VALUES (@nom, @slug, @description, @icon, @layout, @ordre)
`);
cats.forEach(c => insertCat.run(c));
console.log('✅ Catégories créées');

// ── Seed : produits ──────────────────────────────
const getCatId = (slug) => db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)?.id;

const PLACEHOLDER = (txt) => `https://placehold.co/400x300/1a1a2e/ff6b35?text=${encodeURIComponent(txt)}`;

const products = [
  // Caméras
  { slug:'cameras',      nom:'Caméra Solaire 4G',            prix:45000, stock:10, description:'Caméra solaire autonome, connexion 4G, vision nocturne',                    image_url = 'public/images/caméra.jpg' },
  { slug:'cameras',      nom:'Caméra Dôme Dahua',            prix:11000, stock:25, description:'Caméra dôme intérieure HD, grand angle, idéale bureaux',                    image:PLACEHOLDER('Dôme Dahua') },
  { slug:'cameras',      nom:'Caméra Bullet IP Hilook',      prix:23000, stock:18, description:'Caméra bullet extérieure IP66, infrarouge 30m',                              image:PLACEHOLDER('Bullet IP') },
  { slug:'cameras',      nom:'Caméra Bullet Hikvision',      prix:11000, stock:20, description:'Caméra bullet qualité pro Hikvision, IP67',                                  image:PLACEHOLDER('Hikvision') },
  { slug:'cameras',      nom:'DVR Dahua 8 canaux',           prix:45000, stock:8,  description:'Enregistreur numérique 8 canaux, port HDD, accès distant',                  image:PLACEHOLDER('DVR Dahua') },
  { slug:'cameras',      nom:'Lecteur Biométrique',          prix:60000, stock:6,  description:'Contrôle d\'accès empreinte digitale + carte RFID',                         image:PLACEHOLDER('Biométrique') },
  { slug:'cameras',      nom:'Switch POE 8 ports',           prix:35000, stock:12, description:'Switch Power over Ethernet 8 ports, alimentation caméras IP',               image:PLACEHOLDER('Switch POE') },
  { slug:'cameras',      nom:'Modem WIFI Double bande',      prix:25000, stock:15, description:'Routeur WIFI 2.4/5GHz, portée 50m, 4 ports LAN',                            image:PLACEHOLDER('Modem WIFI') },
  // Electronique
  { slug:'electronique', nom:'Ordinateur Complet Core i5 HP',prix:60000, stock:5,  description:'PC complet HP Core i5, 8Go RAM, 500Go HDD, clavier+souris inclus',         image:PLACEHOLDER('PC Core i5') },
  { slug:'electronique', nom:'Clavier Azerty USB',           prix:2500,  stock:50, description:'Clavier azerty filaire silencieux, compatible USB A',                       image:PLACEHOLDER('Clavier') },
  { slug:'electronique', nom:'Unité Centrale Bureau',        prix:45000, stock:7,  description:'Tour PC Core i3/i5, idéale usage professionnel et bureautique',             image:PLACEHOLDER('Tour PC') },
  { slug:'electronique', nom:'Moniteur 19 pouces Full HD',   prix:20000, stock:10, description:'Écran PC 19" Full HD 1080p, ports VGA/HDMI',                                image:PLACEHOLDER('Moniteur') },
  { slug:'electronique', nom:'Laptop HP/Lenovo Core i5',     prix:80000, stock:4,  description:'Ordinateur portable HP ou Lenovo, Core i5, 256Go SSD, 8Go RAM',            image:PLACEHOLDER('Laptop') },
  { slug:'electronique', nom:'Disque Dur Externe 1To',       prix:15000, stock:20, description:'Disque dur externe 1To USB 3.0, compact et portable',                       image:PLACEHOLDER('HDD Ext') },
  { slug:'electronique', nom:'Clé USB 64Go',                 prix:4000,  stock:40, description:'Clé USB 64Go USB 3.0, transfert haute vitesse',                             image:PLACEHOLDER('Clé USB') },
  { slug:'electronique', nom:'Licence Anti-Virus 1 an',      prix:10000, stock:99, description:'Protection antivirus 1 an, PC et Mac, mises à jour incluses',              image:PLACEHOLDER('Anti-virus') },
  // Réseaux
  { slug:'domotique',    nom:'Connecteur RJ45 Cat6 (x100)',  prix:2500,  stock:30, description:'Lot 100 connecteurs RJ45 Cat6, qualité professionnelle',                   image:PLACEHOLDER('RJ45 x100') },
  { slug:'domotique',    nom:'Câble Réseau Sertie 10m',      prix:10000, stock:20, description:'Câble réseau RJ45 pré-sertie Cat5e 10 mètres',                              image:PLACEHOLDER('Câble 10m') },
  { slug:'domotique',    nom:'Bobine FTP Cat6 305m',         prix:45000, stock:5,  description:'Bobine câble FTP blindé Cat6 305 mètres, gaine LSZH',                      image:PLACEHOLDER('FTP 305m') },
  { slug:'domotique',    nom:'Connecteur BNC (x10)',         prix:1500,  stock:60, description:'Lot 10 connecteurs BNC pour câble coaxial vidéosurveillance',              image:PLACEHOLDER('BNC x10') },
  // Électricité
  { slug:'logistique',   nom:'Lampadaire Solaire 60W',       prix:80000, stock:3,  description:'Lampadaire solaire extérieur 60W, autonomie 12h, détecteur de mouvement', image:PLACEHOLDER('Lampadaire') },
  { slug:'logistique',   nom:'Lampe Solaire Portable',       prix:20000, stock:12, description:'Lampe solaire portable, recharge USB et panneau solaire intégré',          image:PLACEHOLDER('Lampe Sol.') },
  { slug:'logistique',   nom:'Rallonge Multiprise 3m',       prix:2500,  stock:30, description:'Rallonge multiprise 5 prises, câble 3m, interrupteur sécurité',            image:PLACEHOLDER('Rallonge') },
  // Maintenance
  { slug:'maintenance',  nom:'Interrupteur Encastrable',     prix:2000,  stock:50, description:'Interrupteur simple/double/va-et-vient encastrable, norme CE',            image:PLACEHOLDER('Interrupteur') },
  { slug:'maintenance',  nom:'Prise Électrique 2P+T',        prix:2000,  stock:50, description:'Prise électrique encastrable norme CEE7, avec terre',                     image:PLACEHOLDER('Prise') },
  { slug:'maintenance',  nom:'Disjoncteur 16A/32A',          prix:3000,  stock:25, description:'Disjoncteur modulaire 16A ou 32A, protection surcharge et court-circuit', image:PLACEHOLDER('Disjoncteur') },
  { slug:'maintenance',  nom:'Câble Alimentation H07 10m',   prix:10000, stock:15, description:'Câble alimentation électrique H07RN-F 3x2.5mm² 10 mètres',               image:PLACEHOLDER('Câble Alim') },
];

const insertProd = db.prepare(`
  INSERT OR IGNORE INTO products (category_id, nom, description, prix, image_url, stock)
  VALUES (?, ?, ?, ?, ?, ?)
`);
products.forEach(p => {
  const catId = getCatId(p.slug);
  if (catId) insertProd.run(catId, p.nom, p.description, p.prix, p.image, p.stock);
});
console.log(`✅ ${products.length} produits insérés`);

// ── Seed : settings ──────────────────────────────
const defaultSettings = [
  ['site_name',      'ATL Shop'],
  ['site_tagline',   'Votre partenaire en sécurité & technologie — Cameroun'],
  ['contact_phone',  '+237 695 100 878'],
  ['contact_email',  'contact@afrikaans.cm'],
  ['contact_city',   'Douala, Cameroun'],
  ['footer_text',    'Sécurité · Informatique · Électricité · Maintenance'],
  ['primary_color',  '#c92a2a'],
  ['secondary_color','#e0692e'],
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
defaultSettings.forEach(([k, v]) => insertSetting.run(k, v));
console.log('✅ Paramètres initialisés');

db.close();
console.log('\n🎉 Base de données prête : ' + DB_PATH);
console.log('   Compte admin : admin / atl2025');
console.log('   Compte test  : client1 / client123\n');
