/* server/controllers/adminController.js */
const db = require('../db/database');

// GET /api/admin/stats
exports.getStats = (_req, res) => {
  const totalUsers    = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'client'").get().n;
  const totalProducts = db.prepare("SELECT COUNT(*) AS n FROM products WHERE visible = 1").get().n;
  const totalOrders   = db.prepare("SELECT COUNT(*) AS n FROM orders").get().n;
  const revenue       = db.prepare("SELECT IFNULL(SUM(total),0) AS n FROM orders WHERE status != 'cancelled'").get().n;
  const recentOrders  = db.prepare(`
    SELECT o.*, u.nom AS user_nom, u.email AS user_email
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 10
  `).all();
  res.json({ totalUsers, totalProducts, totalOrders, revenue, recentOrders });
};

// GET /api/admin/users
exports.getUsers = (_req, res) => {
  const users = db.prepare(
    'SELECT id, username, email, nom, role, status, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
};

// PUT /api/admin/users/:id/status
exports.setUserStatus = (req, res) => {
  const { status } = req.body;
  if (!['active','suspended'].includes(status))
    return res.status(400).json({ error: 'Statut invalide. Valeurs acceptées : active, suspended.' });
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Impossible de suspendre un admin.' });
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: `Compte ${status === 'suspended' ? 'suspendu' : 'réactivé'}.` });
};

// DELETE /api/admin/users/:id
exports.deleteUser = (req, res) => {
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Impossible de supprimer un admin.' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'Utilisateur supprimé.' });
};

// GET /api/admin/orders
exports.getAllOrders = (_req, res) => {
  const orders = db.prepare(`
    SELECT o.*, u.nom AS user_nom, u.email AS user_email
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `).all();
  const withItems = orders.map(o => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
  }));
  res.json(withItems);
};

// PUT /api/admin/orders/:id/status
exports.setOrderStatus = (req, res) => {
  const { status } = req.body;
  const valid = ['pending','confirmed','shipped','delivered','cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide.' });
  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Statut mis à jour.' });
};

// GET /api/admin/settings
exports.getSettings = (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj  = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
};

// PUT /api/admin/settings
exports.updateSettings = (req, res) => {
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx     = db.transaction((data) => {
    for (const [k, v] of Object.entries(data)) update.run(k, String(v));
  });
  tx(req.body);
  res.json({ message: 'Paramètres mis à jour.' });
};
