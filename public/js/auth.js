/* public/js/auth.js — UI Auth (dépend de api.js)
   Gère l'affichage navbar selon l'état de connexion JWT.
   ===================================================== */

// Mise à jour de la navbar selon l'état de connexion
async function updateAuthUI() {
  const loggedIn = isLoggedIn();

  const ids = {
    loginLink:    document.getElementById('nav-login-link'),
    registerLink: document.getElementById('nav-register-link'),
    userGreet:    document.getElementById('nav-user-greet'),
    profilLink:   document.getElementById('nav-profil-link'),
    logoutBtn:    document.getElementById('nav-logout-btn'),
    mobileLogin:  document.getElementById('mobile-login-link'),
    mobileReg:    document.getElementById('mobile-register-link'),
    mobileProfil: document.getElementById('mobile-profil-link'),
    mobileLogout: document.getElementById('mobile-logout-link'),
    adminLink:    document.getElementById('nav-admin-link'),
  };

  const show = (el, d='flex') => el && (el.style.display = d);
  const hide = (el)           => el && (el.style.display = 'none');

  if (loggedIn) {
    hide(ids.loginLink); hide(ids.registerLink);
    hide(ids.mobileLogin); hide(ids.mobileReg);

    show(ids.logoutBtn,    'inline-flex');
    show(ids.profilLink,   'inline-flex');
    show(ids.mobileProfil, 'flex');
    show(ids.mobileLogout, 'flex');

    // Charger le nom depuis le cache ou l'API
    const user = await getCurrentUserCached();
    if (user) {
      if (ids.userGreet) { ids.userGreet.textContent = `👤 ${user.nom}`; show(ids.userGreet, 'flex'); }
      // Lien admin si role=admin
      if (user.role === 'admin') {
        show(ids.adminLink, 'inline-flex');
      }
    }
  } else {
    show(ids.loginLink,    'inline-flex');
    show(ids.registerLink, 'inline-flex');
    show(ids.mobileLogin,  'flex');
    show(ids.mobileReg,    'flex');
    hide(ids.userGreet); hide(ids.profilLink); hide(ids.logoutBtn);
    hide(ids.mobileProfil); hide(ids.mobileLogout); hide(ids.adminLink);
  }
}

// Déconnexion (alias global appelé par les boutons)
function logout() { apiLogout(); }

// Init
document.addEventListener('DOMContentLoaded', updateAuthUI);
