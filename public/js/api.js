/* public/js/api.js — Client API ATL Shop
   Toutes les communications avec le backend passent par ce fichier.
   ================================================================= */

const API_BASE = '/api';
const TOKEN_KEY = 'atl_token';

// ── Helpers ──────────────────────────────────────────────
function getToken()        { return localStorage.getItem(TOKEN_KEY); }
function setToken(t)       { localStorage.setItem(TOKEN_KEY, t); }
function clearToken()      { localStorage.removeItem(TOKEN_KEY); }

function authHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const token   = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

async function apiFetch(endpoint, options = {}) {
  try {
    const res  = await fetch(API_BASE + endpoint, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, message: data.error || 'Erreur serveur.' };
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 0, message: 'Serveur inaccessible. Vérifiez que le backend est lancé.' };
  }
}

// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════
async function apiRegister(nom, email, password) {
  const data = await apiFetch('/auth/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ nom, email, password })
  });
  setToken(data.token);
  return data;
}

async function apiLogin(login, password) {
  const data = await apiFetch('/auth/login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ login, password })
  });
  setToken(data.token);
  return data;
}

function apiLogout() {
  clearToken();
  // Conserver dark mode et panier
  const dark = localStorage.getItem('atl_dark');
  const cart = localStorage.getItem('atl_cart');
  localStorage.clear();
  if (dark) localStorage.setItem('atl_dark', dark);
  if (cart) localStorage.setItem('atl_cart', cart);
  window.location.href = 'index.html';
}

// ══════════════════════════════════════════════
// USER / PROFIL
// ══════════════════════════════════════════════
function apiGetMe() {
  return apiFetch('/users/me', { headers: authHeaders() });
}
function apiUpdateMe(data) {
  return apiFetch('/users/me', {
    method: 'PUT', headers: authHeaders(),
    body: JSON.stringify(data)
  });
}
function apiChangePassword(oldPassword, newPassword) {
  return apiFetch('/users/me/password', {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ oldPassword, newPassword })
  });
}
function apiDeleteMe() {
  return apiFetch('/users/me', { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════
// PRODUITS
// ══════════════════════════════════════════════
function apiGetProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch('/products' + (qs ? '?' + qs : ''), { headers: authHeaders() });
}
function apiGetProduct(id) {
  return apiFetch('/products/' + id, { headers: authHeaders() });
}
function apiCreateProduct(formData) {
  const headers = {};
  const token   = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return apiFetch('/products', { method: 'POST', headers, body: formData });
}
function apiUpdateProduct(id, formData) {
  const headers = {};
  const token   = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return apiFetch('/products/' + id, { method: 'PUT', headers, body: formData });
}
function apiDeleteProduct(id) {
  return apiFetch('/products/' + id, { method: 'DELETE', headers: authHeaders() });
}

// ══════════════════════════════════════════════
// CATÉGORIES
// ══════════════════════════════════════════════
function apiGetCategories()         { return apiFetch('/categories'); }
function apiCreateCategory(data)    { return apiFetch('/categories',     { method:'POST',   headers:authHeaders(), body:JSON.stringify(data) }); }
function apiUpdateCategory(id,data) { return apiFetch('/categories/'+id, { method:'PUT',    headers:authHeaders(), body:JSON.stringify(data) }); }
function apiDeleteCategory(id)      { return apiFetch('/categories/'+id, { method:'DELETE', headers:authHeaders() }); }

// ══════════════════════════════════════════════
// COMMANDES
// ══════════════════════════════════════════════
function apiPlaceOrder(items) {
  return apiFetch('/orders', {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ items })
  });
}
function apiGetMyOrders() {
  return apiFetch('/orders', { headers: authHeaders() });
}

// ══════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════
function apiAdminStats()               { return apiFetch('/admin/stats',                    { headers: authHeaders() }); }
function apiAdminGetUsers()            { return apiFetch('/admin/users',                    { headers: authHeaders() }); }
function apiAdminSetUserStatus(id, s)  { return apiFetch('/admin/users/'+id+'/status',      { method:'PUT',    headers:authHeaders(), body:JSON.stringify({status:s}) }); }
function apiAdminDeleteUser(id)        { return apiFetch('/admin/users/'+id,                { method:'DELETE', headers:authHeaders() }); }
function apiAdminGetOrders()           { return apiFetch('/admin/orders',                   { headers: authHeaders() }); }
function apiAdminSetOrderStatus(id,s)  { return apiFetch('/admin/orders/'+id+'/status',     { method:'PUT',    headers:authHeaders(), body:JSON.stringify({status:s}) }); }
function apiGetSettings()              { return apiFetch('/admin/settings'); }
function apiAdminUpdateSettings(data)  { return apiFetch('/admin/settings',                 { method:'PUT',    headers:authHeaders(), body:JSON.stringify(data) }); }

// ══════════════════════════════════════════════
// SESSION (cache local pour éviter trop de /me)
// ══════════════════════════════════════════════
let _cachedUser = null;

async function getCurrentUserCached() {
  if (_cachedUser) return _cachedUser;
  if (!getToken()) return null;
  try {
    _cachedUser = await apiGetMe();
    return _cachedUser;
  } catch {
    clearToken();
    return null;
  }
}

function isLoggedIn() { return !!getToken(); }

function invalidateUserCache() { _cachedUser = null; }
