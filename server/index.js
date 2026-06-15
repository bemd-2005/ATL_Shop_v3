/* server/index.js — Point d'entrée Express ATL Shop */
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Vérifier que la BDD est initialisée ──────────────────
const DB_PATH = path.resolve(process.env.DB_PATH || './server/db/atl_shop.db');
if (!fs.existsSync(DB_PATH)) {
  console.error('\n❌ Base de données introuvable !');
  console.error('   Lancez d\'abord : node server/db/init.js\n');
  process.exit(1);
}

// ── Middlewares ──────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://votre-domaine.cm']         // Adapter en prod
    : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Fichiers statiques ───────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ───────────────────────────────────────────
app.use('/api', require('./routes/index'));

// ── SPA Fallback (toutes les routes → index.html) ────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Gestion erreurs globales ─────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ error: 'Fichier trop volumineux (max 5 Mo).' });
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ATL Shop backend démarré sur http://localhost:${PORT}`);
  console.log(`   Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Base de données : ${DB_PATH}\n`);
});
