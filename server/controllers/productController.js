/* server/controllers/productController.js */
const path = require('path');
const fs   = require('fs');
const db   = require('../db/database');

// GET /api/products
exports.getAll = (req, res) => {
  const { category, search, visible } = req.query;
  let sql    = `
    SELECT p.*, c.nom AS category_nom, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // Les non-admins ne voient que les produits visibles
  if (!req.user || req.user.role !== 'admin') {
    sql += ' AND p.visible = 1';
  } else if (visible !== undefined && visible !== '') {
    // Admin peut filtrer par visible=0 ou visible=1 ; visible='' = tout afficher
    sql += ' AND p.visible = ?'; params.push(Number(visible));
  }
  // Si visible='' (admin sans filtre) → aucun filtre, tous les produits remontés

  if (category) { sql += ' AND c.slug = ?'; params.push(category); }
  if (search)   { sql += ' AND (p.nom LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' ORDER BY c.ordre ASC, p.id ASC';

  const products = db.prepare(sql).all(...params);
  res.json(products);
};

// GET /api/products/:id
exports.getOne = (req, res) => {
  const p = db.prepare(`
    SELECT p.*, c.nom AS category_nom, c.slug AS category_slug
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json(p);
};

// POST /api/products  (admin)
exports.create = (req, res) => {
  const { category_id, nom, description, prix, stock, visible } = req.body;
  if (!category_id || !nom || prix === undefined)
    return res.status(400).json({ error: 'category_id, nom et prix sont requis.' });

  const image_url = req.file ? `/uploads/products/${req.file.filename}` : '';
  const info = db.prepare(`
    INSERT INTO products (category_id, nom, description, prix, image_url, stock, visible)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(Number(category_id), nom, description || '', Number(prix), image_url, Number(stock || 0), visible === undefined ? 1 : Number(visible));

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(product);
};

// PUT /api/products/:id  (admin)
exports.update = (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' });

  const { category_id, nom, description, prix, stock, visible } = req.body;
  let image_url = product.image_url;

  if (req.file) {
    // Supprimer l'ancienne image locale si elle existe (pas les URLs externes)
    if (image_url && image_url.startsWith('/uploads/')) {
      const old = path.resolve('.' + image_url);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    image_url = `/uploads/products/${req.file.filename}`;
  }

  // Si remove_image=true envoyé, remettre l'image à vide
  if (req.body.remove_image === 'true') {
    if (image_url && image_url.startsWith('/uploads/')) {
      const old = path.resolve('.' + image_url);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    image_url = '';
  }

  db.prepare(`
    UPDATE products SET
      category_id = ?, nom = ?, description = ?,
      prix = ?, image_url = ?, stock = ?, visible = ?
    WHERE id = ?
  `).run(
    Number(category_id || product.category_id),
    nom || product.nom,
    description !== undefined ? description : product.description,
    Number(prix !== undefined ? prix : product.prix),
    image_url,
    Number(stock !== undefined ? stock : product.stock),
    Number(visible !== undefined ? visible : product.visible),
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
};

// DELETE /api/products/:id  (admin — soft delete)
exports.remove = (req, res) => {
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
  db.prepare('UPDATE products SET visible = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Produit masqué (soft delete).' });
};
