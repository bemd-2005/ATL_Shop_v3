/* server/db/database.js — Connexion SQLite singleton */
require('dotenv').config();
const path     = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(process.env.DB_PATH || './server/db/atl_shop.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
