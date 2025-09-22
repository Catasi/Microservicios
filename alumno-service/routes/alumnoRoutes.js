// routes/alumnoRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import axios from "axios";

import Alumno from "../models/Alumno.js";
import Grupo from "../models/Grupo.js";

const router = express.Router();

const processedEventSchema = new mongoose.Schema({
  eventId: { type: String, index: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});
const ProcessedEvent =
  mongoose.models.ProcessedEvent ||
  mongoose.model("ProcessedEvent", processedEventSchema);

const trimStr = (s) => (typeof s === "string" ? s.trim() : s);
const getFirst = (obj, keys = []) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (
      Object.prototype.hasOwnProperty.call(obj, k) &&
      obj[k] !== undefined &&
      obj[k] !== null
    )
      return obj[k];
  }
  return undefined;
};

/* -------------------------
   Funcion sync
   ------------------------- */
async function ensureAlumno(data = {}) {
  const matricula = trimStr(
    getFirst(data, ["matricula", "matrícula", "id", "studentId"])
  );
  const nombre = trimStr(getFirst(data, ["nombre", "name"]));
  const usuario = trimStr(getFirst(data, ["usuario", "user"]));
  const carrera = trimStr(getFirst(data, ["carrera", "career"]));
  const rawPassword = getFirst(data, ["password", "contrasenia", "contrasena"]);
  const incomingHash = getFirst(data, ["passwordHash", "password_hash"]);

  const filter = matricula
    ? { matricula }
    : usuario
    ? { usuario }
    : { nombre };

  const update = {};
  if (nombre) update.nombre = nombre;
  if (usuario) update.usuario = usuario;
  if (carrera) update.carrera = carrera;

  if (rawPassword) update.passwordHash = await bcrypt.hash(String(rawPassword), 10);
  else if (incomingHash) update.passwordHash = incomingHash;

  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  return await Alumno.findOneAndUpdate(filter, update, opts);
}

/* -------------------------
   Endpoint 
   ------------------------- */
router.post("/sync", express.json(), async (req, res) => {
  try {
    const token = req.headers["x-service-token"];
    if (!token || token !== process.env.SYNC_TOKEN) {
      return res.status(401).json({ success: false, message: "Token inválido" });
    }

    const { eventId, eventType, payload } = req.body;
    if (!payload) return res.status(400).json({ success: false, message: "Falta payload" });

    if (eventId) {
      const seen = await ProcessedEvent.findOne({ eventId });
      if (seen) return res.json({ success: true, message: "Evento ya procesado", eventId });
    }

    let result;
    switch ((eventType || "").toLowerCase()) {
      case "nuevo-alumno":
      case "alumno-creado":
      case "create-alumno":
      case "actualizar-alumno":
      case "update-alumno":
        result = await ensureAlumno(payload);
        break;

      case "nueva-calificacion":
      case "update-calificacion":
        result = await handleNuevaCalificacion(payload);
        break;

      default:
        result = { message: "Tipo de evento no reconocido", keys: Object.keys(payload) };
    }

    if (eventId) {
      try { await ProcessedEvent.create({ eventId }); } catch (e) {}
    }

    return res.json({ success: true, eventType: eventType || "inferred", result });
  } catch (error) {
    console.error("SYNC ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Procesar nueva calificación recibida desde profesor
async function handleNuevaCalificacion(payload = {}) {
  const { matricula, grupo, materia, calificacion, profesor } = payload;
  const alumno = await Alumno.findOne({ matricula });
  if (!alumno) return { error: "Alumno no encontrado" };

  const calIndex = alumno.calificaciones.findIndex(
    (c) => c.materia === materia && c.grupo?.toString() === grupo
  );

  if (calIndex >= 0) {
    alumno.calificaciones[calIndex].calificacion = calificacion;
    alumno.calificaciones[calIndex].profesor = profesor;
    alumno.calificaciones[calIndex].fecha = new Date();
  } else {
    alumno.calificaciones.push({
      grupo,
      materia,
      calificacion,
      profesor,
      fecha: new Date()
    });
  }
  await alumno.save();
  return alumno;
}

/* -------------------------
   Autenticación y login
   ------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { matricula, password } = req.body;
    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    const match = await bcrypt.compare(password, alumno.passwordHash);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: alumno._id, matricula: alumno.matricula, role: "alumno" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ mensaje: "Login exitoso", token, alumno });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

/* -------------------------
   Cambio de contraseña
   ------------------------- */
router.put("/mi-password", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Falta nueva contraseña" });

    const passwordHash = await bcrypt.hash(password, 10);
    const alumno = await Alumno.findByIdAndUpdate(
      req.user.id,
      { passwordHash },
      { new: true }
    );
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    // Notificar a Servicios Escolares y Auth
    axios.post("http://localhost:5000/api/servicios-escolares/notificar", {
      alumnoId: alumno._id,
      matricula: alumno.matricula,
      mensaje: "Alumno actualizó su contraseña"
    }).catch(err => console.error("Error notificando a SE:", err.message));

    axios.post("http://localhost:4000/api/auth/notificar-cambio", {
      alumnoId: alumno._id,
      usuario: alumno.usuario,
      mensaje: "Alumno actualizó su contraseña"
    }).catch(err => console.error("Error notificando a Auth:", err.message));

    res.json({ mensaje: "Contraseña actualizada y notificada" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* -------------------------
   Consultas
   ------------------------- */
router.get("/mis-grupos", authMiddleware, async (req, res) => {
  try {
    const grupos = await Grupo.find({ alumnos: req.user.id })
      .populate("profesor", "numeroEmpleado nombre puesto")
      .populate("alumnos", "matricula nombre carrera");
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/mis-calificaciones", authMiddleware, async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.user.id).select("matricula nombre calificaciones");
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });
    res.json(alumno.calificaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
