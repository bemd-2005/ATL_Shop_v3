/* server/middleware/auth.js — JWT middleware */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const db  = require('../db/database');

// Vérifie le token JWT et attache req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Token manquant. Connectez-vous.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user    = db.prepare('SELECT id, username, email, nom, role, status FROM users WHERE id = ?').get(payload.id);
    if (!user)              return res.status(401).json({ error: 'Utilisateur introuvable.' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Compte suspendu. Contactez l\'administrateur.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré. Reconnectez-vous.' });
  }
}

// Vérifie que l'utilisateur est admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }
  next();
}

// Optionnel : attache req.user si token présent, continue sans erreur sinon
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = db.prepare('SELECT id, username, email, nom, role, status FROM users WHERE id = ?').get(payload.id);
  } catch {}
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
