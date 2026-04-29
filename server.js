const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Route racine
app.get('/', (req, res) => {
    res.json({
        message: 'Hello World!',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Route /hello
app.get('/hello', (req, res) => {
    res.json({
        message: 'Hello depuis Jenkins Pipeline Node.js!'
    });
});

// Route /health
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        service: 'Node-CI-Atelier3'
    });
});

// Export de l'app pour les tests
module.exports = app;

// Lancer le serveur seulement si exécuté directement
if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Serveur démarré sur le port ${port}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
    });
}
