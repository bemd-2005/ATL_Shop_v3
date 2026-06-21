/* server/start.js _ Initialise la BDD si besoin, puis démarre le serveur */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.env.DB_PATH || './server/db/atl_shop.bd');

// Vérifie si la base de données existe, sinon la crée
if (!fs.existsSync(dbPath)) {
    console.log('Base de données non trouvée, initialisation...');
    try {
        execSync('node server/db/init.js', { 
            studio: 'inherit',
            cwd: path.resolve(__dirname, '../')
    });
    console.log('Base de données initialisée avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données :', error);
        process.exit(1);
    }
} else {
    console.log('Base de données trouvée, démarrage du serveur...');
}

require('./index.js');