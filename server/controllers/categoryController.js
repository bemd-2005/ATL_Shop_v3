/* server/controllers/categoryController.js */
const db = require('../db/database');

exports.getAll = (_req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY ordre ASC').all());
};
exports.create = (req, res) => {
  const { nom, slug, description, icon, layout, ordre } = req.body;
  if (!nom || !slug) return res.status(400).json({ error: 'nom et slug requis.' });
  const exists = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  if (exists) return res.status(409).json({ error: 'Ce slug est déjà utilisé.' });
  const info = db.prepare(
    'INSERT INTO categories (nom, slug, description, icon, layout, ordre) VALUES (?,?,?,?,?,?)'
  ).run(nom, slug, description||'', icon||'fa-tag', layout||'horizontal', Number(ordre||0));
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid));
};
exports.update = (req, res) => {
  const c = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Catégorie introuvable.' });
  const { nom, description, icon, layout, ordre } = req.body;
  db.prepare('UPDATE categories SET nom=?,description=?,icon=?,layout=?,ordre=? WHERE id=?')
    .run(nom||c.nom, description!==undefined?description:c.description, icon||c.icon, layout||c.layout, Number(ordre!==undefined?ordre:c.ordre), req.params.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
};
exports.remove = (req, res) => {
  const c = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Catégorie introuvable.' });
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Catégorie supprimée.' });
};
