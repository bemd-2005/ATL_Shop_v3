/* server/controllers/authController.js */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db/database');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
exports.register = (req, res) => {
  const { nom, email, password, username } = req.body;

  if (!nom || !email || !password)
    return res.status(400).json({ error: 'Nom, email et mot de passe sont requis.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Format email invalide.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Mot de passe trop court (minimum 6 caractères).' });

  const emailExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (emailExists) return res.status(409).json({ error: 'Cet email est déjà utilisé.' });

  const uname = username || email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() || 'user_' + Date.now();
  const usernameExists = db.prepare('SELECT id FROM users WHERE username = ?').get(uname);
  const finalUsername  = usernameExists ? uname + '_' + Date.now() : uname;

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (username, email, nom, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).run(finalUsername, email.toLowerCase(), nom, hash, 'client');

  const user  = db.prepare('SELECT id, username, email, nom, role FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = makeToken(user);
  res.status(201).json({ token, user });
};

// POST /api/auth/login
exports.login = (req, res) => {
  const { login: loginInput, password } = req.body;
  if (!loginInput || !password)
    return res.status(400).json({ error: 'Identifiant et mot de passe requis.' });

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? OR email = ?'
  ).get(loginInput.toLowerCase(), loginInput.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
  if (user.status === 'suspended')
    return res.status(403).json({ error: 'Compte suspendu. Contactez l\'administrateur.' });

  const token = makeToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, nom: user.nom, role: user.role }
  });
};
