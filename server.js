const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dati in memoria (per ora, poi useremo Supabase)
let conflicts = {
  "russia-ucraina": {
    title: "Russia vs Ucraina",
    sides: { a: "Russia", b: "Ucraina" },
    votes: { a: 0, b: 0 },
    messages: []
  },
  "israele-palestina": {
    title: "Israele vs Palestina", 
    sides: { a: "Israele", b: "Palestina" },
    votes: { a: 0, b: 0 },
    messages: []
  }
};

// Quando un utente si connette
io.on('connection', (socket) => {
  console.log('Utente connesso');

  // Manda tutti i conflitti al nuovo utente
  socket.emit('conflicts', conflicts);

  // Quando un utente vota
  socket.on('vote', ({ conflictId, side, username, message, country }) => {
    if (!conflicts[conflictId]) return;

    conflicts[conflictId].votes[side]++;
    conflicts[conflictId].messages.push({
      username,
      message,
      side,
      country,
      time: new Date().toISOString()
    });

    // Manda aggiornamento a TUTTI in tempo reale
    io.emit('update', { conflictId, data: conflicts[conflictId] });
  });

  socket.on('disconnect', () => {
    console.log('Utente disconnesso');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});