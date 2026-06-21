/* server/start.js _ Initialise la BDD si besoin, puis démarre le serveur */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.env.DB_PATH || './server/db/atl_shop.bd');

// Vérifie si la base de données existe, sinon la crée
if (!fs.existsSync(dbPath)) {
    console.log('Base de données non trouvée, initialisation...');
    require('./db/init.js');
    console.log('Initialisation terminée.');
}else{
    console.log('Base de données trouvée, démarrage du serveur...');
}

require('./index.js');