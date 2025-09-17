import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import professorRoutes from './routes/professors.js';

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