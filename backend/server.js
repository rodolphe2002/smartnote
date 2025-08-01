require('dotenv').config(); // Charger les variables d'environnement dès le début

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const iaRoute = require("./routes/iaRoute");

const app = express();

// === Middlewares ===
app.use(cors());
app.use(express.json()); // Remplace body-parser.json()
app.use(express.static(path.join(__dirname, '..', 'public')));

// === Routes ===
app.use("/api", iaRoute);


// === Routes HTML ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});



// === Connexion MongoDB et lancement du serveur ===
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connecté');

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB :', err);
  });
