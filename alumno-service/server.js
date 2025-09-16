import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js"; // recuerda la extensión .js
import alumnoRoutes from "./routes/alumnoRoutes.js"; // extensión .js

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas API
app.use("/api/alumnos", alumnoRoutes);

// Archivos estáticos
app.use(express.static(path.join(path.resolve(), "public")));

// Catch-all: cualquier ruta que no sea /api devuelve login.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(path.resolve(), "public", "login.html"));
});

// Puerto
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`🚀 Servicio Alumnos corriendo en http://localhost:${PORT}`);
});