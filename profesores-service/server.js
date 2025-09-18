// Imports
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import profesorRoutes from "./routes/profesorRoutes.js";

// Configuración inicial
dotenv.config();
connectDB();

const app = express();

// Necesario para __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas API
app.use("/api/profesores", profesorRoutes);

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Catch-all para rutas que no sean API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Servidor
const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`🚀 Servicio Profesores corriendo en http://localhost:${PORT}`);
});
