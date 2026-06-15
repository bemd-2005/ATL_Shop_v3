/* public/js/panier.js — Panier localStorage + commande API */

const CART_KEY = 'atl_cart';

function getCart()  { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {items:[],total:0}; } catch { return {items:[],total:0}; } }

function saveCart(cart) {
  cart.total = cart.items.reduce((s,i) => s + i.price * i.quantity, 0);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = getCart().items.reduce((s,i) => s + i.quantity, 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart(product) {
  const cart = getCart();
  const ex   = cart.items.find(i => i.id === product.id);
  if (ex) ex.quantity += 1;
  else cart.items.push({...product, quantity:1});
  saveCart(cart);
  showToast(`${product.name} ajouté au panier !`, 'success');
  animateBadge();
}

function removeFromCart(id)        { const c=getCart(); c.items=c.items.filter(i=>i.id!==id); saveCart(c); }
function updateQuantity(id, qty)   { const c=getCart(); const it=c.items.find(i=>i.id===id); if(!it)return; if(qty<=0){removeFromCart(id);return;} it.quantity=qty; saveCart(c); }
function clearCart()               { saveCart({items:[],total:0}); }

// ── Passer la commande via API ────────────────────────────
async function passerCommande() {
  const cart = getCart();
  if (!cart.items.length) { showToast('⚠️ Votre panier est vide.', 'warning'); return false; }
  if (!isLoggedIn())      { showToast('⚠️ Connectez-vous pour passer commande.', 'warning'); setTimeout(()=>window.location.href='login.html',1400); return false; }

  try {
    await apiPlaceOrder(cart.items.map(i => ({
      id: i.id, name: i.name, price: i.price, quantity: i.quantity
    })));
    showToast(' Commande passée avec succès ! Nous vous contacterons.', 'success');
    clearCart();
    return true;
  } catch (err) {
    showToast(' ' + (err.message || 'Erreur lors de la commande.'), 'error');
    return false;
  }
}

function animateBadge() {
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.classList.remove('badge-pop'); void b.offsetWidth; b.classList.add('badge-pop');
  });
}

// ── Toast global ──────────────────────────────────────────
function showToast(message, type='success') {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(c);
  }
  const colors = { success:'linear-gradient(135deg,#1b5e20,#2e7d32)', error:'linear-gradient(135deg,#b71c1c,#c62828)', info:'linear-gradient(135deg,#0d47a1,#1565c0)', warning:'linear-gradient(135deg,#e65100,#f57c00)' };
  const t = document.createElement('div');
  t.style.cssText = `background:${colors[type]||colors.info};color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.3);transform:translateX(120%);transition:transform .35s cubic-bezier(.34,1.56,.64,1);max-width:280px;cursor:pointer;pointer-events:all;`;
  t.textContent = message;
  const timer = setTimeout(()=>dismiss(t), 3500);
  t.addEventListener('click', ()=>dismiss(t));
  c.appendChild(t);
  requestAnimationFrame(()=> t.style.transform = 'translateX(0)');
  function dismiss(el){ clearTimeout(timer); el.style.transform='translateX(120%)'; setTimeout(()=>el.remove(),380); }
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
