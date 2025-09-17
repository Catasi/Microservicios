import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; 
import alumnoRoutes from "./routes/alumnoRoutes.js"; 

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// Rutas API
// =========================
app.use("/api/alumnos", alumnoRoutes);

// =========================
// Puerto
// =========================
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`🚀 Servicio Alumnos corriendo en http://localhost:${PORT}`);
});
