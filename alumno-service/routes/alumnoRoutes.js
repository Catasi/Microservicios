const express = require("express");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const Alumno = require("../models/Alumno");
const router = express.Router();

// =========================
// Listar todos los alumnos, falta agregar la direccion API de alumnos 
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
    const { id, password, passwordActual } = req.body;

    if (!id || !password) {
      return res.status(400).json({ error: "ID y nueva contraseña requeridos" });
    }

    const alumno = await Alumno.findById(id);
    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    // verificar contraseña actual
    if (passwordActual) {
      const isMatch = await bcrypt.compare(passwordActual, alumno.password);
      if (!isMatch) return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(50);
    alumno.password = await bcrypt.hash(password, salt);
    await alumno.save();

    // Notificar al servicio de autenticación (no bloquea la respuesta)
    axios.post("http://localhost:4000/api/auth/notificar-cambio", {
      alumnoId: id,
      mensaje: "El alumno ha cambiado su contraseña",
    }).catch(err => console.error("Error notificando a auth-service:", err.message));

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
