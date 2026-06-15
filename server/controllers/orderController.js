/* server/controllers/orderController.js */
const db     = require('../db/database');
const mailer = require('../services/mailer');

// POST /api/orders
exports.create = async (req, res) => {
  const { items } = req.body;
  if (!items || !items.length)
    return res.status(400).json({ error: 'Le panier est vide.' });

  // Calcul total
  const total = items.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0);

  // Insérer la commande
  const info = db.prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)').run(req.user.id, total);
  const orderId = info.lastInsertRowid;

  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, nom_produit, quantity, price_at_time) VALUES (?,?,?,?,?)'
  );
  const insertMany = db.transaction((rows) => rows.forEach(i =>
    insertItem.run(orderId, i.id || null, i.name || i.nom || '', Number(i.quantity), Number(i.price || i.prix || 0))
  ));
  insertMany(items);

  // Récupérer la commande complète
  const order     = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems= db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const fullOrder = { ...order, items: orderItems };

  // Récupérer les infos utilisateur
  const user = db.prepare('SELECT id, nom, email, username FROM users WHERE id = ?').get(req.user.id);

  // Envoyer l'email de notification (non bloquant)
  mailer.sendOrderNotification(fullOrder, user).catch(err =>
    console.error('[Mailer] Erreur notification:', err.message)
  );

  // Générer le lien WhatsApp
  const whatsappLink = buildWhatsAppLink(fullOrder, user);

  // Réponse au client
  res.status(201).json({
    ...fullOrder,
    whatsapp_url: whatsappLink
  });
};

// GET /api/orders — historique utilisateur
exports.getMine = (req, res) => {
  const orders = db.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  const withItems = orders.map(o => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
  }));
  res.json(withItems);
};

// ── Génération lien WhatsApp ──────────────────────────────
function buildWhatsAppLink(order, user) {
  const number   = process.env.WHATSAPP_NUMBER || '237695100878';
  const shopName = process.env.SHOP_NAME || 'ATL Shop';
  const orderNum = String(order.id).padStart(6, '0');

  const fmt = p => new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';

  const lignes = order.items.map(i =>
    `• ${i.nom_produit || i.name} × ${i.quantity} — ${fmt((i.price_at_time || i.price || 0) * i.quantity)}`
  ).join('\n');

  const date = new Date(order.created_at || new Date())
    .toLocaleString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const message = [
    `🛒 *COMMANDE #${orderNum} — ${shopName}*`,
    ``,
    `📦 *Produits :*`,
    lignes,
    ``,
    `💰 *Total : ${fmt(order.total)}*`,
    `👤 Client : ${user.nom}`,
    `📧 Email : ${user.email}`,
    `📅 Date : ${date}`,
    ``,
    `Bonjour, je souhaite confirmer et régler cette commande. Merci !`
  ].join('\n');

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
