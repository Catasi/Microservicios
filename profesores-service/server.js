// Imports
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import profesorRoutes from "./routes/profesorRoutes.js";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";


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
const router = express.Router();

/* -------------------------
   Helpers y modelo interno
   ------------------------- */
const processedEventSchema = new mongoose.Schema({
  eventId: { type: String, index: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});
const ProcessedEvent = mongoose.models.ProcessedEvent || mongoose.model("ProcessedEvent", processedEventSchema);

// busca la primera key existente en el objeto
const getFirst = (obj, keys = []) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
    // también soporta anidado simple como 'profesor._id'
    if (k.includes('.')) {
      const parts = k.split('.');
      let cur = obj;
      for (const p of parts) { cur = cur?.[p]; if (cur === undefined) break; }
      if (cur !== undefined && cur !== null) return cur;
    }
  }
  return undefined;
};

// normaliza strings (por seguridad/consistencia)
const trimStr = s => typeof s === 'string' ? s.trim() : s;

/* -------------------------
   Funciones core de sync
   ------------------------- */

// crea/actualiza profesor (mapea nombres comunes)
async function ensureProfesor(data = {}) {
  const numeroEmpleado = trimStr(getFirst(data, ["numeroEmpleado", "no_empleado", "noEmpleado", "no_empleado"]));
  const usuario = trimStr(getFirst(data, ["usuario", "user"]));
  const nombre = trimStr(getFirst(data, ["nombre", "name"]));
  const puesto = getFirst(data, ["puesto", "role"]);
  const rawPassword = getFirst(data, ["password", "contrasenia", "contrasena", "pass"]);
  const incomingHash = getFirst(data, ["passwordHash", "password_hash"]);

  const filter = numeroEmpleado ? { numeroEmpleado } : (usuario ? { usuario } : (nombre ? { nombre } : {}));
  const update = {};
  if (nombre) update.nombre = nombre;
  if (usuario) update.usuario = usuario;
  if (puesto) update.puesto = puesto;
  if (numeroEmpleado) update.numeroEmpleado = numeroEmpleado;

  // si envían password en claro -> hasheamos; si envían passwordHash lo respetamos (pero idealmente no)
  if (rawPassword) {
    update.passwordHash = await bcrypt.hash(String(rawPassword), 10);
  } else if (incomingHash) {
    update.passwordHash = incomingHash;
  }

  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  const prof = await Profesor.findOneAndUpdate(filter, update, opts);
  return prof;
}

// crea/actualiza alumno (mapea nombres comunes)
async function ensureAlumno(data = {}) {
  const matricula = trimStr(getFirst(data, ["matricula", "matrícula", "id", "studentId"]));
  const nombre = trimStr(getFirst(data, ["nombre", "name"]));
  const usuario = trimStr(getFirst(data, ["usuario", "user"]));
  const carrera = trimStr(getFirst(data, ["carrera", "career"]));
  const rawPassword = getFirst(data, ["password", "contrasenia", "contrasena"]);
  const incomingHash = getFirst(data, ["passwordHash", "password_hash"]);

  const filter = matricula ? { matricula } : (usuario ? { usuario } : (nombre ? { nombre } : {}));
  const update = {};
  if (nombre) update.nombre = nombre;
  if (usuario) update.usuario = usuario;
  if (carrera) update.carrera = carrera;

  if (rawPassword) update.passwordHash = await bcrypt.hash(String(rawPassword), 10);
  else if (incomingHash) update.passwordHash = incomingHash;

  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  const alumno = await Alumno.findOneAndUpdate(filter, update, opts);
  return alumno;
}

// crea/actualiza grupo y asegura referencias (profesor -> ObjectId, alumnos -> [ObjectId])
async function ensureGrupo(data = {}) {
  const nombre = trimStr(getFirst(data, ["nombre", "name"]));
  const carrera = trimStr(getFirst(data, ["carrera", "career"]));
  // puede venir profesorId, profesor: {_id}, profe: {...} o profe.no_empleado
  let profesorId = getFirst(data, ["profesorId", "profesor._id", "profesorId._id", "_id"]);
  profesorId = profesorId ? String(profesorId) : null;

  // si vienen datos embebidos de profesor, creamos/actualizamos y obtenemos su _id
  const profPayload = getFirst(data, ["profesor", "profe", "profesorData"]);
  if (!profesorId && profPayload) {
    const prof = await ensureProfesor(profPayload);
    profesorId = prof?._id?.toString();
  }

  // si viene sólo no_empleado dentro de proff
  if (!profesorId) {
    const nr = getFirst(data, ["profe.no_empleado", "profe.noEmpleado", "profesor.no_empleado", "profesor.numeroEmpleado"]);
    if (nr) {
      const prof = await ensureProfesor({ numeroEmpleado: nr });
      profesorId = prof?._id?.toString();
    }
  }

  // alumnos puede venir como array de objetos, array de matrículas o array de objectIds
  const rawAlumnos = getFirst(data, ["alumnos", "students", "alumnosIds"]) || [];
  const alumnoIds = [];
  if (Array.isArray(rawAlumnos)) {
    for (const a of rawAlumnos) {
      if (!a) continue;
      if (typeof a === "string") {
        // puede ser matrícula o id
        let alumno = await Alumno.findOne({ matricula: a }) || (mongoose.isValidObjectId(a) ? await Alumno.findById(a) : null);
        if (!alumno) {
          // crea alumno mínimo con la matrícula
          alumno = await ensureAlumno({ matricula: a });
        }
        if (alumno) alumnoIds.push(alumno._id);
      } else if (typeof a === "object") {
        // objeto alumno completo
        const alumno = await ensureAlumno(a);
        if (alumno) alumnoIds.push(alumno._id);
      }
    }
  }

  const filter = data._id ? { _id: data._id } : (nombre && carrera ? { nombre, carrera } : {});
  const update = {};
  if (nombre) update.nombre = nombre;
  if (carrera) update.carrera = carrera;
  if (profesorId) update.profesor = profesorId;
  if (alumnoIds.length) update.alumnos = alumnoIds;

  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  const grupo = await Grupo.findOneAndUpdate(filter, update, opts);
  return grupo;
}

// eliminar o desvincular profesor (si el servicio admin lo borra)
async function handleProfesorDelete(payload = {}) {
  const numeroEmpleado = getFirst(payload, ["numeroEmpleado", "no_empleado"]);
  const usuario = getFirst(payload, ["usuario"]);
  const filter = numeroEmpleado ? { numeroEmpleado } : (usuario ? { usuario } : {});
  // borramos el profesor de la colección de Profesores (solo si quieres eliminar)
  if (filter && Object.keys(filter).length) {
    await Profesor.findOneAndDelete(filter);
    // además, desvincular en grupos: ponemos profesor = null (o creamos placeholder si lo prefieres)
    await Grupo.updateMany({ profesor: { $exists: true, $ne: null }, }, { $unset: { profesor: "" } });
    return { message: "Profesor eliminado localmente y grupos desvinculados" };
  }
  return { message: "Filtro insuficiente para borrar profesor" };
}

/* -------------------------
   Endpoint genérico /sync
   ------------------------- */

/*
  Uso:
  POST /api/profesores/sync
  Headers:
    x-service-token: <SYNC_TOKEN compartido>
  Body:
    {
      eventId: "uuid-1234",       // opcional pero recomendado (idempotencia)
      eventType: "nuevo-profesor" // o "actualizar-alumno", "crear-grupo", "borrar-profesor", etc.
      payload: { ... }            // datos
    }
*/
router.post("/sync", express.json(), async (req, res) => {
  try {
    // seguridad simple: token compartido
    const token = req.headers["x-service-token"];
    if (!token || token !== process.env.SYNC_TOKEN) {
      return res.status(401).json({ success: false, message: "Token de sync inválido" });
    }

    const { eventId, eventType, payload } = req.body;
    if (!payload) return res.status(400).json({ success: false, message: "Falta payload" });

    // idempotencia: si eventId ya procesado, devolvemos 200 OK
    if (eventId) {
      const seen = await ProcessedEvent.findOne({ eventId });
      if (seen) {
        return res.json({ success: true, message: "Evento ya procesado (idempotente)", eventId });
      }
    }

    // ruteo de tipo de evento. Si no se reconoce el eventType, intentamos inferir.
    let result;
    switch ((eventType || "").toLowerCase()) {
      case "nuevo-profesor":
      case "profesor-creado":
      case "create-profesor":
        result = await ensureProfesor(payload);
        break;

      case "actualizar-profesor":
      case "profesor-actualizado":
      case "update-profesor":
        result = await ensureProfesor(payload);
        break;

      case "borrar-profesor":
      case "delete-profesor":
        result = await handleProfesorDelete(payload);
        break;

      case "nuevo-alumno":
      case "alumno-creado":
      case "create-alumno":
        result = await ensureAlumno(payload);
        break;

      case "actualizar-alumno":
      case "alumno-actualizado":
      case "update-alumno":
        result = await ensureAlumno(payload);
        break;

      case "crear-grupo":
      case "grupo-creado":
      case "create-grupo":
        result = await ensureGrupo(payload);
        break;

      case "actualizar-grupo":
      case "grupo-actualizado":
      case "update-grupo":
        result = await ensureGrupo(payload);
        break;

      default:
        // intento de inferir por claves del payload
        if (getFirst(payload, ["matricula", "matrícula"])) result = await ensureAlumno(payload);
        else if (getFirst(payload, ["numeroEmpleado", "no_empleado", "noEmpleado"])) result = await ensureProfesor(payload);
        else if (getFirst(payload, ["nombre", "alumnos", "profe", "profesor"])) result = await ensureGrupo(payload);
        else result = { message: "No se pudo inferir el tipo de recurso; envía eventType explícito", keys: Object.keys(payload || {}) };
    }

    // marcar evento como procesado (idempotencia)
    if (eventId) {
      try { await ProcessedEvent.create({ eventId }); } catch (e) { /* si falla por unique, ok */ }
    }

    return res.json({ success: true, eventType: eventType || "inferred", result });
  } catch (error) {
    console.error("SYNC ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* -------------------------
   (Mantengo tus rutas originales)
   ------------------------- */

// 🔑 Login de profesor
router.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const profesor = await Profesor.findOne({ usuario });
    if (!profesor) return res.status(404).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, profesor.passwordHash);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: profesor._id, role: profesor.puesto, usuario: profesor.usuario },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 🔔 Notificar al servicio login
    axios.post("http://localhost:3001/api/auth/notificar-login", {
      usuario: profesor.usuario,
      numeroEmpleado: profesor.numeroEmpleado
    }, {
      headers: { "x-service-token": process.env.SYNC_TOKEN_COMPANERO }
    }).catch(err => console.error("Error notificando al otro servicio:", err.message));

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

// 📌 Subir o actualizar calificación y notificar al servicio de compañera

router.post("/mis-grupos/:grupoId/calificaciones", authMiddleware, async (req, res) => {
  try {
    const { matricula, materia, calificacion } = req.body;

    const grupo = await Grupo.findById(req.params.grupoId);
    if (!grupo) return res.status(404).json({ error: "Grupo no encontrado" });
    if (grupo.profesor.toString() !== req.user.id)
      return res.status(403).json({ error: "No autorizado" });

    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    const calIndex = alumno.calificaciones.findIndex(c =>
      c.grupo.toString() === req.params.grupoId && c.materia === materia
    );

    if (calIndex >= 0) {
      alumno.calificaciones[calIndex].calificacion = calificacion;
      alumno.calificaciones[calIndex].profesor = req.user.id;
      alumno.calificaciones[calIndex].fecha = new Date();
    } else {
      alumno.calificaciones.push({
        grupo: req.params.grupoId,
        materia,
        calificacion,
        profesor: req.user.id
      });
    }

    await alumno.save();

    // 🔔 Notificar al servicio de tu compañera
    axios.post("http://localhost:4001/api/alumnos/calificaciones", {
      alumnoId: alumno._id.toString(),
      matricula: alumno.matricula,
      grupo: grupo.nombre || grupo._id.toString(), // según lo que su DB use
      materia,
      calificacion
    }).catch(err => console.error("Error notificando a compañera:", err.message));

    res.json({ mensaje: "✅ Calificación registrada/actualizada y notificada", alumno });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


export default router;
