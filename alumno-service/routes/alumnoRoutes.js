import express from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import Alumno from "../models/Alumno.js";

const router = express.Router();

// =========================
// Ver grupos asignados a un alumno CHECRAR LAS RUTAS PORFIS
// =========================
router.get("/:id/grupos", async (req, res) => {
  try {
    const { id } = req.params;

    const alumno = await Alumno.findById(id).select("matricula nombre grupos");
    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    res.json({
      alumno: {
        id: alumno._id,
        matricula: alumno.matricula,
        nombre: alumno.nombre,
      },
      grupos: alumno.grupos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Ver calificaciones de un alumno
// =========================
router.get("/:id/calificaciones", async (req, res) => {
  try {
    const { id } = req.params;

    const alumno = await Alumno.findById(id).select("matricula nombre calificaciones");
    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    res.json({
      alumno: {
        id: alumno._id,
        matricula: alumno.matricula,
        nombre: alumno.nombre,
      },
      calificaciones: alumno.calificaciones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Actualizar contraseña de un alumno + notificar a SE y Auth
// =========================
router.put("/contrasena", async (req, res) => {
  try {
    const { id, password, passwordActual } = req.body;

    if (!id || !password) {
      return res.status(400).json({ error: "ID y nueva contraseña requeridos" });
    }

    const alumno = await Alumno.findById(id);
    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    // Verificar contraseña actual si fue enviada
    if (passwordActual) {
      const isMatch = await bcrypt.compare(passwordActual, alumno.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Contraseña actual incorrecta" });
      }
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    alumno.password = await bcrypt.hash(password, salt);

    await alumno.save();

    // Notificar a Servicios Escolares
    axios.post("http://localhost:5000/api/servicios-escolares/notificar", {
      alumnoId: id,
      matricula: alumno.matricula,
      mensaje: "El alumno ha actualizado su contraseña"
    }).catch(err => console.error("Error notificando a SE:", err.message));

    // Notificar a Autenticación
    axios.post("http://localhost:4000/api/auth/notificar-cambio", {
      alumnoId: id,
      usuario: alumno.usuario,
      mensaje: "El alumno ha actualizado su contraseña"
    }).catch(err => console.error("Error notificando a Auth:", err.message));

    res.json({ message: "Contraseña actualizada, notificado a SE y Auth" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
