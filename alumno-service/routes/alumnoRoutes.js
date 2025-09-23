import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Alumno from "../models/Alumno.js";
import Grupo from "../models/Grupo.js";
import Profesor from "../models/Profesor.js";

const router = express.Router();

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

/* -------------------------
   Helpers internos
   ------------------------- */
const trimStr = s => typeof s === 'string' ? s.trim() : s;

const getFirst = (obj, keys = []) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
  }
  return undefined;
};

// =========================
// Crear/actualizar alumno desde SE
// =========================
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

  if (rawPassword) update.password = await bcrypt.hash(String(rawPassword), 10);
  else if (incomingHash) update.password = incomingHash;

  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  return await Alumno.findOneAndUpdate(filter, update, opts);
}

// ==========================
//  endpoint (recibe alumnos de SE)
// ==========================
router.post("/sync", express.json(), async (req, res) => {
  try {
    const { eventType, payload } = req.body;
    if (!payload) return res.status(400).json({ success: false, message: "Falta payload" });

    let result;
    switch ((eventType || "").toLowerCase()) {
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

      default:
        if (getFirst(payload, ["matricula", "matrícula"])) result = await ensureAlumno(payload);
        else result = { message: "No se pudo inferir el tipo de recurso; envía eventType explícito", keys: Object.keys(payload || {}) };
    }

    res.json({ success: true, eventType: eventType || "inferred", result });

  } catch (error) {
    console.error("SYNC ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================
// Login alumno
// ==========================
router.post("/login", async (req, res) => {
  try {
    const { matricula, password } = req.body;
    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    const match = await bcrypt.compare(password, alumno.password);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: alumno._id, matricula: alumno.matricula, usuario: alumno.usuario },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ mensaje: "Login exitoso", token, alumno });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// Cambiar mi contraseña
// ==========================
router.put("/mi-password", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Contraseña requerida" });

    const passwordHash = await bcrypt.hash(password, 10);
    const alumno = await Alumno.findByIdAndUpdate(req.user.id, { password: passwordHash }, { new: true });
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    res.json({ mensaje: "Contraseña actualizada ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
// Ver mis grupos
// ==========================
// router.get("/mis-grupos", authMiddleware, async (req, res) => {
// try {
//    const grupos = await Grupo.find({ alumnos: req.user.id })
//      .populate("alumnos", "matricula nombre carrera")
//      .populate("profesor", "numeroEmpleado usuario nombre puesto");
//    res.json(grupos);
//  } catch (error) {
//    res.status(500).json({ error: error.message });
 // }
//});


// Recibir grupo desde el servicio de profesores no estoy segura si es este el endpoint correcto
 /* router.post("/recibir-grupo", async (req, res) => {
  try {
    const { nombre, carrera, profesorNoEmpleado, alumnos } = req.body;

    // Buscar profesor por número de empleado
    const profesor = await Profesor.findOne({ numeroEmpleado: profesorNoEmpleado });
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

    // Buscar alumnos en la DB y mapear a ObjectId
    const alumnoIds = [];
    for (const a of alumnos) {
      const alumno = await Alumno.findOne({ matricula: a.matricula });
      if (alumno) alumnoIds.push(alumno._id);
    }

    if (!alumnoIds.length) return res.status(400).json({ error: "No se encontraron alumnos válidos" });

    // Crear o actualizar grupo
    const grupo = await Grupo.findOneAndUpdate(
      { nombre, carrera },
      { nombre, carrera, profesor: profesor._id, alumnos: alumnoIds },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: "Grupo recibido y registrado", grupo });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar grupo: " + error.message });
  }
});
*/

// Recibir grupo desde SE para asignar alumnos
router.post("/recibir-grupo", async (req, res) => {
  try {
    const { nombre, materia, carrera, profesor, alumnos } = req.body;
    // console.log('req.body:', req.body); // ← Para ver qué datos llegan
    // console.log('profesorObj:', profesor);

    // Buscar profesor en la base por su número de empleado
    const profesorobj = await Profesor.findOne({ numeroEmpleado: profesor.no_empleado });
    if (!profesorobj) {
      return res.status(404).json({ error: "Profesor no encontrado en mi servicio" });
    }

    // Buscar alumnos en la DB y mapearlos a sus ObjectId
    // const alumnoIds = [];
    // for (let a of alumnos) {
    //   const alumno = await Alumno.findOne({ matricula: a.matricula });
    //   if (alumno) alumnoIds.push(alumno._id);
    // }
    //  Crear o actualizar grupo en este servicio
    const grupo = new Grupo({ nombre, carrera, profesor_nombre: profesorobj.nombre, alumnos });
    await grupo.save();

    res.status(201).json({ message: "✅ Grupo recibido y registrado para alumnos", grupo });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar grupo: " + err.message });
  }
});


//  Ver mis calificaciones
router.get("/calificaciones", authMiddleware, async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.user.id)
      .populate("calificaciones.grupo", "nombre carrera")
      .populate("calificaciones.profesor", "numeroEmpleado nombre usuario puesto");

    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    res.json({
      alumno: {
        id: alumno._id,
        matricula: alumno.matricula,
        nombre: alumno.nombre,
        carrera: alumno.carrera
      },
      calificaciones: alumno.calificaciones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recibir calificación desde Profesor Service
router.post("/recibir-calificacion", async (req, res) => {
  try {
    const { matricula, materia, calificacion, grupoId, profesorId } = req.body;

    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    const calIndex = alumno.calificaciones.findIndex(c =>
      c.grupo?.toString() === grupoId && c.materia === materia
    );

    if (calIndex >= 0) {
      alumno.calificaciones[calIndex].calificacion = calificacion;
      alumno.calificaciones[calIndex].profesor = profesorId;
      alumno.calificaciones[calIndex].fecha = new Date();
    } else {
      alumno.calificaciones.push({
        grupo: grupoId,
        materia,
        calificacion,
        profesor: profesorId,
        fecha: new Date()
      });
    }

    await alumno.save();
    res.status(201).json({ message: "✅ Calificación recibida y guardada", alumno });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//rouer.get inicio
  router.get('/inicio-sesion', async (req, res) => {
    try {
        const { usuario } = req.query;
        if (!usuario) {
            return res.status(400).json({
                success: false,
                message: 'El campo usuario es requerido'
            });
        }

        const alumno = await Alumno.findOne({ usuario: usuario });
        
        if (!alumno) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            data: {
                nombre: alumno.nombre,
                matricula: alumno.matricula,
                usuario: alumno.usuario,
                carrera: alumno.carrera
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message });
    }
});

export default router;
