/* server/routes/index.js — Toutes les routes API */
const express  = require('express');
const router   = express.Router();
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');
const upload   = require('../middleware/upload');

const auth     = require('../controllers/authController');
const users    = require('../controllers/userController');
const products = require('../controllers/productController');
const cats     = require('../controllers/categoryController');
const orders   = require('../controllers/orderController');
const admin    = require('../controllers/adminController');

// ── Auth ──────────────────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login',    auth.login);

// ── Utilisateur courant ───────────────────────────────────
router.get   ('/users/me',           requireAuth, users.getMe);
router.put   ('/users/me',           requireAuth, users.updateMe);
router.post  ('/users/me/password',  requireAuth, users.changePassword);
router.delete('/users/me',           requireAuth, users.deleteMe);

// ── Produits ──────────────────────────────────────────────
router.get   ('/products',     optionalAuth, products.getAll);
router.get   ('/products/:id', optionalAuth, products.getOne);
router.post  ('/products',     requireAuth, requireAdmin, upload.single('image'), products.create);
router.put   ('/products/:id', requireAuth, requireAdmin, upload.single('image'), products.update);
router.delete('/products/:id', requireAuth, requireAdmin, products.remove);

// ── Catégories ────────────────────────────────────────────
router.get   ('/categories',     cats.getAll);
router.post  ('/categories',     requireAuth, requireAdmin, cats.create);
router.put   ('/categories/:id', requireAuth, requireAdmin, cats.update);
router.delete('/categories/:id', requireAuth, requireAdmin, cats.remove);

// ── Commandes utilisateur ─────────────────────────────────
router.post('/orders', requireAuth, orders.create);
router.get ('/orders', requireAuth, orders.getMine);

// ── Administration ────────────────────────────────────────
router.get   ('/admin/stats',                requireAuth, requireAdmin, admin.getStats);
router.get   ('/admin/users',                requireAuth, requireAdmin, admin.getUsers);
router.put   ('/admin/users/:id/status',     requireAuth, requireAdmin, admin.setUserStatus);
router.delete('/admin/users/:id',            requireAuth, requireAdmin, admin.deleteUser);
router.get   ('/admin/orders',               requireAuth, requireAdmin, admin.getAllOrders);
router.put   ('/admin/orders/:id/status',    requireAuth, requireAdmin, admin.setOrderStatus);
router.get   ('/admin/settings',             admin.getSettings);   // public (lecture)
router.put   ('/admin/settings',             requireAuth, requireAdmin, admin.updateSettings);

module.exports = router;
