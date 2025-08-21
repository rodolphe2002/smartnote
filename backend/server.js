// Charger les variables d'environnement dès le début
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const iaRoute = require('./routes/iaRoute');

const app = express();
const port = process.env.PORT || 5000;

// === Middlewares ===
app.use(cors());
app.use(express.json()); // Pour parser le JSON
app.use(express.static(path.join(__dirname, '..', 'public')));

// === Routes ===
app.use("/api", iaRoute);

// === Route HTML principale ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// === Lancement du serveur ===
app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});
