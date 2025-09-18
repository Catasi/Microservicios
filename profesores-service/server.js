import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Profesor from "../models/Profesor.js";
import Grupo from "../models/Grupo.js";
import Alumno from "../models/Alumno.js";

const router = express.Router();

// 🔑 Login de profesor
router.post("/login", async (req, res) => {
  try {
    const { numeroEmpleado, password } = req.body;
    const profesor = await Profesor.findOne({ numeroEmpleado });
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

    const match = await bcrypt.compare(password, profesor.passwordHash);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: profesor._id, role: profesor.puesto, numeroEmpleado: profesor.numeroEmpleado },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ mensaje: "Login exitoso", token, role: profesor.puesto, profesor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// 📌 Actualizar contraseña
router.put("/mi-password", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const profesor = await Profesor.findByIdAndUpdate(
      req.user.id,
      { passwordHash },
      { new: true }
    );
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

    res.json({ mensaje: "Contraseña actualizada ✅" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 📌 Ver mis grupos
router.get("/mis-grupos", authMiddleware, async (req, res) => {
  try {
    const grupos = await Grupo.find({ profesor: req.user.id })
      .populate("alumnos", "matricula nombre carrera")
      .populate("profesor", "numeroEmpleado usuario nombre puesto");
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ver alumnos de un grupo
router.get("/mis-grupos/:grupoId/alumnos", authMiddleware, async (req, res) => {
  try {
    const grupo = await Grupo.findById(req.params.grupoId)
      .populate("alumnos", "matricula nombre carrera calificaciones");
    if (!grupo) return res.status(404).json({ error: "Grupo no encontrado" });

    if (grupo.profesor.toString() !== req.user.id)
      return res.status(403).json({ error: "No autorizado" });

    res.json(grupo.alumnos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Subir o actualizar calificación
router.post("/mis-grupos/:grupoId/calificaciones", authMiddleware, async (req, res) => {
  try {
    const { matricula, materia, calificacion } = req.body;

    const grupo = await Grupo.findById(req.params.grupoId);
    if (!grupo) return res.status(404).json({ error: "Grupo no encontrado" });
    if (grupo.profesor.toString() !== req.user.id)
      return res.status(403).json({ error: "No autorizado" });

    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    // Buscar calificación existente por grupo y materia
    const calIndex = alumno.calificaciones.findIndex(c =>
      c.grupo.toString() === req.params.grupoId && c.materia === materia
    );

    if (calIndex >= 0) {
      // Actualiza la calificación existente y asigna al profesor
      alumno.calificaciones[calIndex].calificacion = calificacion;
      alumno.calificaciones[calIndex].profesor = req.user.id;
      alumno.calificaciones[calIndex].fecha = new Date();
    } else {
      // Crea una nueva calificación con grupo, materia y profesor
      alumno.calificaciones.push({
        grupo: req.params.grupoId,
        materia,
        calificacion,
        profesor: req.user.id
      });
    }

    await alumno.save();
    res.json({ mensaje: "✅ Calificación registrada/actualizada", alumno });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas API
const profesorRoutes = require("./routes/profesorRoutes");
app.use("/api/profesores", profesorRoutes);

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Catch-all para rutas que no sean API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`🚀 Servicio Profesores corriendo en http://localhost:${PORT}`);
});

