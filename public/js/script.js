/* public/js/script.js — Catalogue ATL Shop (API-driven) */

// ── Config catégories (correspond aux slugs BDD) ──────────
const CATEGORY_CONFIG = {
  cameras:      { label:' Caméras & Sécurité',         layout:'horizontal', icon:'fa-video' },
  electronique: { label:' Matériel Informatique',       layout:'vertical',   icon:'fa-microchip' },
  domotique:    { label:' Réseaux & Connectique',       layout:'horizontal', icon:'fa-network-wired' },
  logistique:   { label:' Électricité & Éclairage',     layout:'vertical',   icon:'fa-bolt' },
  maintenance:  { label:' Maintenance & Installation',  layout:'horizontal', icon:'fa-screwdriver-wrench' }
};

function formatPrice(p) { return new Intl.NumberFormat('fr-FR').format(p) + ' FCFA'; }

// ── Skeletons ─────────────────────────────────────────────
function renderSkeletons(container, count=4, layout='horizontal') {
  container.innerHTML = Array(count).fill(0).map(()=>`
    <div class="skeleton-card ${layout==='horizontal'?'skeleton-h':'skeleton-v'}">
      <div class="skel skel-img"></div><div class="skel skel-title"></div>
      <div class="skel skel-desc"></div><div class="skel skel-price"></div><div class="skel skel-btn"></div>
    </div>`).join('');
}

// ── Carte produit ─────────────────────────────────────────
function createProductCard(product, layout) {
  const card = document.createElement('div');
  card.className = `product-card ${layout==='horizontal'?'card-h':'card-v'}`;
  card.dataset.nom  = (product.nom||'').toLowerCase();
  card.dataset.desc = (product.description||'').toLowerCase();
  card.dataset.cat  = product.category_slug || product.categorie || 'public/images/unité centrale1.jpg';

  const imgSrc  = product.image_url || product.image || '';
  const catLabel= CATEGORY_CONFIG[card.dataset.cat]?.label?.split(' ').slice(1).join(' ') || card.dataset.cat;
  const safeName= (product.nom||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${imgSrc}" alt="${product.nom}" loading="lazy"public/images/unité centrale1.jpg
           onerror="this.src=''">
      <div class="card-overlay"><span class="card-cat-badge">${catLabel}</span></div>
    </div>
    <div class="card-body-info">
      <h3 class="card-product-title">${product.nom}</h3>
      <p class="card-product-desc">${product.description||''}</p>
      <div class="card-footer-info">
        <span class="card-product-price">${formatPrice(product.prix)}</span>
        <button class="btn-add-cart"
          onclick="handleAddToCart(${product.id},'${safeName}',${product.prix},'${imgSrc}',this)">
          <i class="fa-solid fa-cart-plus"></i> Ajouter
        </button>
      </div>
    </div>`;
  return card;
}

// ── Rendu catégorie ───────────────────────────────────────
function renderCategory(wrapperId, products, layout) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;
  wrapper.innerHTML = '';

  if (layout === 'horizontal') {
    const row = document.createElement('div');
    row.className = 'scroll-horizontal';
    products.forEach(p => row.appendChild(createProductCard(p, 'horizontal')));
    wrapper.appendChild(row);
  } else {
    const grid = document.createElement('div');
    grid.className = 'grid-vertical';
    const visible = products.slice(0, 6);
    const hidden  = products.slice(6);
    visible.forEach(p => grid.appendChild(createProductCard(p, 'vertical')));
    wrapper.appendChild(grid);
    if (hidden.length) {
      const btn = document.createElement('button');
      btn.className = 'btn-voir-plus';
      btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Voir ${hidden.length} de plus`;
      btn.addEventListener('click', () => { hidden.forEach(p=>grid.appendChild(createProductCard(p,'vertical'))); btn.remove(); });
      wrapper.appendChild(btn);
    }
  }
}

// ── Add to cart handler ───────────────────────────────────
function handleAddToCart(id, nom, prix, image, btn) {
  addToCart({ id, name: nom, price: prix, image });
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Ajouté !';
  btn.classList.add('added');
  setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('added'); }, 1400);
}

// ── Flèches + drag scroll ─────────────────────────────────
function attachScrollArrows() {
  document.querySelectorAll('.category-section').forEach(section => {
    const row  = section.querySelector('.scroll-horizontal');
    if (!row) return;
    section.querySelector('.arrow-left')?.addEventListener('click', ()=>row.scrollBy({left:-300,behavior:'smooth'}));
    section.querySelector('.arrow-right')?.addEventListener('click',()=>row.scrollBy({left: 300,behavior:'smooth'}));
  });
}
function attachDragScroll() {
  document.querySelectorAll('.scroll-horizontal').forEach(el => {
    let isDown=false, startX, scrollLeft;
    el.addEventListener('mousedown',  e=>{ isDown=true; el.classList.add('grabbing'); startX=e.pageX-el.offsetLeft; scrollLeft=el.scrollLeft; });
    el.addEventListener('mouseleave', ()=>{ isDown=false; el.classList.remove('grabbing'); });
    el.addEventListener('mouseup',    ()=>{ isDown=false; el.classList.remove('grabbing'); });
    el.addEventListener('mousemove',  e=>{ if(!isDown)return; e.preventDefault(); el.scrollLeft=scrollLeft-(e.pageX-el.offsetLeft-startX)*1.5; });
  });
}

// ── Filtre recherche ──────────────────────────────────────
function filterProducts(term) {
  const t = term.toLowerCase().trim();
  let total = 0;
  document.querySelectorAll('.product-card').forEach(c => {
    const show = !t || c.dataset.nom.includes(t) || c.dataset.desc.includes(t);
    c.style.display = show ? '' : 'none';
    if (show) total++;
  });
  document.querySelectorAll('.category-section').forEach(s => {
    s.style.display = [...s.querySelectorAll('.product-card')].some(c=>c.style.display!=='none') ? '' : 'none';
  });
  const nr = document.getElementById('no-result');
  if (nr) nr.style.display = total === 0 ? 'block' : 'none';
}

// ── Chargement produits depuis l'API ──────────────────────
async function loadProducts() {
  const main = document.getElementById('categories-container');
  if (!main) return;

  // Construire les sections avec skeletons
  main.innerHTML = Object.keys(CATEGORY_CONFIG).map(slug => `
    <section class="category-section" id="section-${slug}">
      <div class="category-header">
        <h2 class="category-title"><i class="fa-solid ${CATEGORY_CONFIG[slug].icon}"></i> ${CATEGORY_CONFIG[slug].label}</h2>
        ${CATEGORY_CONFIG[slug].layout==='horizontal' ? `
          <div class="scroll-arrows">
            <button class="arrow-btn arrow-left" aria-label="Gauche"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="arrow-btn arrow-right" aria-label="Droite"><i class="fa-solid fa-chevron-right"></i></button>
          </div>` : ''}
      </div>
      <div id="cat-${slug}" class="cat-wrapper"></div>
    </section>`).join('');

  Object.entries(CATEGORY_CONFIG).forEach(([slug,cfg]) => {
    const w = document.getElementById('cat-'+slug);
    if (w) renderSkeletons(w, cfg.layout==='horizontal'?4:3, cfg.layout);
  });

  try {
    const products = await apiGetProducts();

    // Grouper par slug catégorie
    const grouped = {};
    products.forEach(p => {
      const slug = p.category_slug;
      if (!grouped[slug]) grouped[slug] = [];
      grouped[slug].push(p);
    });

    Object.entries(CATEGORY_CONFIG).forEach(([slug,cfg]) => {
      renderCategory('cat-'+slug, grouped[slug]||[], cfg.layout);
    });

    attachScrollArrows();
    attachDragScroll();
  } catch (err) {
    main.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:48px;color:#f97316;margin-bottom:16px;display:block;"></i>
        <p style="font-size:18px;margin-bottom:8px;">Impossible de charger les produits.</p>
        <p style="font-size:14px;">${err.message || 'Vérifiez que le serveur Node.js est lancé.'}</p>
      </div>`;
  }
}

// ── Dark mode ─────────────────────────────────────────────
function initDarkMode() {
  const t = document.getElementById('dark-toggle');
  if (!t) return;
  if (localStorage.getItem('atl_dark')==='true') { document.body.classList.add('dark'); t.innerHTML='<i class="fa-solid fa-sun"></i>'; }
  t.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('atl_dark', document.body.classList.contains('dark'));
    t.innerHTML = document.body.classList.contains('dark') ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  });
}

// ── Burger menu ───────────────────────────────────────────
function initBurger() {
  const b = document.getElementById('burger-btn'), m = document.getElementById('mobile-menu');
  if (!b||!m) return;
  b.addEventListener('click', ()=>{ m.classList.toggle('open'); b.classList.toggle('active'); });
  document.addEventListener('click', e=>{ if(!b.contains(e.target)&&!m.contains(e.target)){ m.classList.remove('open'); b.classList.remove('active'); } });
}

// ── Page fade ─────────────────────────────────────────────
function initPageFade() {
  document.body.style.opacity='0'; document.body.style.transition='opacity .35s ease';
  requestAnimationFrame(()=>document.body.style.opacity='1');
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href||href.startsWith('#')||href.startsWith('http')||href.startsWith('tel')||href.startsWith('mailto')) return;
    link.addEventListener('click', e=>{ e.preventDefault(); document.body.style.opacity='0'; setTimeout(()=>window.location.href=href,350); });
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  initDarkMode();
  initBurger();
  // Recherche
  const si = document.getElementById('search-input');
  if (si) { si.addEventListener('input', ()=>filterProducts(si.value)); si.closest('form')?.addEventListener('submit',e=>e.preventDefault()); }
  const sm = document.getElementById('search-input-main');
  if (sm) { sm.addEventListener('input', ()=>filterProducts(sm.value)); }
  setTimeout(initPageFade, 100);
});
