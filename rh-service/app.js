const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const professorRoutes = require('./routes/professors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/rh_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Routes
app.use('/api/professors', professorRoutes);

app.listen(PORT, () => {
  console.log(`RH Service running on port ${PORT}`);
});