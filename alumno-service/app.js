const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const alumnoRoutes = require("./routes/alumnoRoutes");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas Api
app.use("/api/alumnos", alumnoRoutes);

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Catch-all para rutas que no sean API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`🚀 Servicio Alumnos corriendo en http://localhost:${PORT}`);
});
