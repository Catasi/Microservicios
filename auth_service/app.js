import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
try {
  await mongoose.connect('mongodb://localhost:27017/auth_db', {
  });  
  console.log('✅ Base de datos online Auth');
}catch(error){
  console.error('❌ Error connecting to MongoDB:', error);
  process.exit(1);
}


// Routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
});