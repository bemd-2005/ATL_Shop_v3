# ATL Shop v3 — Backend Node.js + Frontend complet

## Architecture
```
ATL_Shop_v3/
├── server/
│   ├── index.js                  ← Point d'entrée Express
│   ├── db/
│   │   ├── init.js               ← Script initialisation BDD + seed
│   │   └── database.js           ← Connexion SQLite singleton
│   ├── middleware/
│   │   ├── auth.js               ← JWT middleware (requireAuth, requireAdmin)
│   │   └── upload.js             ← Multer (images produits)
│   ├── controllers/
│   │   ├── authController.js     ← register, login
│   │   ├── userController.js     ← profil CRUD
│   │   ├── productController.js  ← produits CRUD + upload
│   │   ├── categoryController.js ← catégories CRUD
│   │   ├── orderController.js    ← commandes
│   │   └── adminController.js    ← stats, users admin, settings
│   └── routes/
│       └── index.js              ← Toutes les routes /api
├── public/                       ← Front-end statique servi par Express
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── profil.html
│   ├── panier.html
│   ├── services.html
│   ├── admin.html                ← Interface administration
│   ├── css/style.css
│   └── js/
│       ├── api.js                ← Toutes les fonctions fetch API
│       ├── auth.js               ← UI navbar dynamique JWT
│       ├── panier.js             ← Panier localStorage + commande API
│       └── script.js             ← Catalogue dynamique
├── uploads/products/             ← Images produits uploadées
├── .env                          ← Variables d'environnement
├── .env.example
└── package.json
```

## Installation

### 1. Prérequis
- Node.js v18+ installé
- npm

### 2. Installer les dépendances
```bash
cd ATL_Shop_v3
npm install
```

### 3. Configurer l'environnement
```bash
cp .env.example .env
# Éditer .env : changer JWT_SECRET en production
```

### 4. Initialiser la base de données
```bash
node server/db/init.js
```
Résultat attendu :
```
📦 Initialisation de la base de données ATL Shop...
✅ Tables créées
✅ Admin créé : admin / atl2025
✅ Client test créé : client1 / client123
✅ Catégories créées
✅ 27 produits insérés
✅ Paramètres initialisés
🎉 Base de données prête
```

### 5. Démarrer le serveur
```bash
npm start               # Production
npm run dev             # Développement (nodemon, rechargement auto)
```

Accès : **http://localhost:3000**

---

## Comptes de test
| Utilisateur | Mot de passe | Rôle  | Email               |
|-------------|-------------|-------|---------------------|
| admin       | atl2025     | Admin | admin@atlsarl.cm    |
| client1     | client123   | Client| client1@example.com |

---

## API REST — Résumé des endpoints

### Public
| Méthode | Endpoint             | Description           |
|---------|----------------------|-----------------------|
| POST    | /api/auth/register   | Inscription           |
| POST    | /api/auth/login      | Connexion → JWT       |
| GET     | /api/products        | Liste produits        |
| GET     | /api/products/:id    | Détail produit        |
| GET     | /api/categories      | Liste catégories      |
| GET     | /api/admin/settings  | Paramètres site       |

### Utilisateur connecté (Bearer token)
| Méthode | Endpoint              | Description              |
|---------|-----------------------|--------------------------|
| GET     | /api/users/me         | Mon profil               |
| PUT     | /api/users/me         | Modifier nom/email       |
| POST    | /api/users/me/password| Changer mot de passe     |
| DELETE  | /api/users/me         | Supprimer mon compte     |
| POST    | /api/orders           | Passer une commande      |
| GET     | /api/orders           | Mes commandes            |

### Admin uniquement
| Méthode | Endpoint                      | Description           |
|---------|-------------------------------|-----------------------|
| GET     | /api/admin/stats              | Dashboard stats       |
| GET     | /api/admin/users              | Tous les utilisateurs |
| PUT     | /api/admin/users/:id/status   | Suspendre/réactiver   |
| DELETE  | /api/admin/users/:id          | Supprimer utilisateur |
| GET     | /api/admin/orders             | Toutes les commandes  |
| PUT     | /api/admin/orders/:id/status  | Changer statut        |
| PUT     | /api/admin/settings           | Modifier paramètres   |
| POST    | /api/products                 | Ajouter produit       |
| PUT     | /api/products/:id             | Modifier produit      |
| DELETE  | /api/products/:id             | Masquer produit       |
| POST    | /api/categories               | Ajouter catégorie     |
| PUT     | /api/categories/:id           | Modifier catégorie    |
| DELETE  | /api/categories/:id           | Supprimer catégorie   |

---

## Page Admin — Fonctionnalités
Accès : **/admin.html** (réservé au rôle `admin`)

- **Tableau de bord** : stats globales (clients, produits, commandes, CA) + commandes récentes
- **Produits** : CRUD complet avec upload image, toggle visible/masqué
- **Catégories** : CRUD avec choix du layout (horizontal/vertical)
- **Utilisateurs** : liste, suspension/réactivation, suppression
- **Commandes** : liste complète avec changement de statut
- **Paramètres** : nom du site, slogan, contact, footer (dynamiques)

---

## Déploiement VPS

```bash
# 1. Transférer les fichiers sur le serveur
# 2. npm install --production
# 3. node server/db/init.js
# 4. Changer JWT_SECRET dans .env
# 5. Lancer avec pm2 (gestionnaire de processus)
npm install -g pm2
pm2 start server/index.js --name "atl-shop"
pm2 save
pm2 startup
```

**Nginx reverse proxy** (exemple) :
```nginx
server {
    listen 80;
    server_name votre-domaine.cm;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /uploads/ {
        alias /chemin/vers/ATL_Shop_v3/uploads/;
    }
}
```

---

## Sécurité
- ✅ Mots de passe hashés avec **bcryptjs** (10 rounds)
- ✅ Authentification **JWT** (7 jours d'expiration)
- ✅ Protection des routes admin
- ✅ Validation des entrées côté serveur
- ✅ CORS configuré
- ✅ Upload limité à 5 Mo, types whitlistés
- ⚠️ En production : utiliser HTTPS (Let's Encrypt via Certbot)


https://placehold.co/400x300/1a1a2e/888?text=ATL
https://placehold.co/400x300/1a1a2e/888?text=ATL