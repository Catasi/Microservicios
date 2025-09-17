import express from "express";
import bcrypt from "bcryptjs";
import axios from "axios"; // 🔹 cliente HTTP para notificar

import Alumno from "../models/Alumno.js";
import Grupo from "../models/Grupo.js";

const router = express.Router();

// =========================
// Listar todos los alumnos
// =========================
router.get("/", async (req, res) => {
  try {
    const alumnos = await Alumno.find().select("matricula nombre carrera");
    res.json(alumnos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Actualizar contraseña
// =========================
router.put("/contrasena", async (req, res) => {
  try {
    const { id, password } = req.body;
    if (!id) return res.status(400).json({ error: "ID del alumno requerido" });
    if (!password) return res.status(400).json({ error: "Contraseña requerida" });

    const passwordHash = await bcrypt.hash(password, 10);

    const alumno = await Alumno.findByIdAndUpdate(
      id,
      { password: passwordHash },
      { new: true }
    );

    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    // 🔹 Notificar al microservicio de Autenticación
    try {
      await axios.post("http://localhost:4002/api/auth/notificar-password", {
        id: alumno._id,
        matricula: alumno.matricula,
        password: passwordHash,
      });
    } catch (notifyError) {
      console.error("⚠️ Error notificando a Autenticación:", notifyError.message);
      // No detenemos el flujo, solo avisamos
    }

    res.json({ mensaje: "Contraseña actualizada ✅ y notificada a Autenticación" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Ver calificaciones
// =========================
router.get("/calificaciones", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID del alumno requerido" });

    const alumno = await Alumno.findById(id).populate(
      "calificaciones.grupo",
      "nombre carrera"
    );

    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    res.json(alumno.calificaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Ver grupos
// =========================
router.get("/grupos", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID del alumno requerido" });

    const grupos = await Grupo.find({ alumnos: id }).select("nombre carrera");
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

