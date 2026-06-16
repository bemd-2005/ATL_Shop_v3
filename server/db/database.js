/* server/db/database.js — Connexion SQLite singleton */
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

// Créer le dossier db s'il n'existe pas
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'atl_shop.db');

// Ouvrir la base de données (mode lecture/écriture, créé si absent)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base :', err.message);
  } else {
    console.log('✅ Base SQLite connectée :', dbPath);
  }
});

// Activer les contraintes de clés étrangères
db.run('PRAGMA foreign_keys = ON');

module.exports = db;