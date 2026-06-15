/* server/controllers/userController.js */
const bcrypt = require('bcryptjs');
const db     = require('../db/database');

// GET /api/users/me
exports.getMe = (req, res) => {
  const user = db.prepare('SELECT id, username, email, nom, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
};

// PUT /api/users/me
exports.updateMe = (req, res) => {
  const { nom, email } = req.body;
  if (!nom && !email) return res.status(400).json({ error: 'Aucune donnée à mettre à jour.' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  const newNom   = nom   || user.nom;
  const newEmail = email ? email.toLowerCase() : user.email;

  if (email && email.toLowerCase() !== user.email) {
    const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, req.user.id);
    if (conflict) return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
  }

  db.prepare('UPDATE users SET nom = ?, email = ? WHERE id = ?').run(newNom, newEmail, req.user.id);
  const updated = db.prepare('SELECT id, username, email, nom, role FROM users WHERE id = ?').get(req.user.id);
  res.json(updated);
};

// POST /api/users/me/password
exports.changePassword = (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis.' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'Nouveau mot de passe trop court (minimum 6 caractères).' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(oldPassword, user.password_hash))
    return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: 'Mot de passe mis à jour.' });
};

// DELETE /api/users/me
exports.deleteMe = (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({ message: 'Compte supprimé.' });
};
