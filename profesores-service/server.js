// Imports
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import Profesor from "./models/Profesor.js";
import Grupo from "./models/Grupo.js";
import Alumno from "./models/Alumno.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

// Configuración inicial
dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 4003;

// Necesario para __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({
  origin: "*", // permite cualquier microservicio o frontend
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Catch-all para rutas que no sean API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "test-profesores.html"));
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Registro de profesor
app.post("/api/profesores/register", async (req, res) => {
  try {
    const { numeroEmpleado, usuario, nombre, puesto, password } = req.body;

    const existing = await Profesor.findOne({ numeroEmpleado });
    if (existing) return res.status(400).json({ error: "El profesor ya existe" });

    const passwordHash = await bcrypt.hash(password, 10);

    const profesor = new Profesor({ numeroEmpleado, usuario, nombre, puesto, passwordHash });
    await profesor.save();

    res.status(201).json({ message: "Profesor creado en mi servicio", profesor });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar profesor: " + err.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Login de profesor
app.post("/api/profesores/login", async (req, res) => {
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

    // Notificar al servicio login
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

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Ver mis grupos
app.get("/api/profesores/mis-grupos", authMiddleware, async (req, res) => {
  try {
    const profesor = await Profesor.findOne({ usuario: req.user.username });
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

    const grupos = await Grupo.find({ profesor: profesor._id })
      .populate("alumnos", "matricula nombre carrera")
      .populate("profesor", "numeroEmpleado usuario nombre puesto");

    res.json({ grupos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Actualizar contraseña
app.put("/api/profesores/mi-password", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const profesor = await Profesor.findByIdAndUpdate(req.user.id, { passwordHash }, { new: true });
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

    try {
      await axios.post("http://localhost:3001/api/auth/change-password", {
        username: profesor.usuario,
        newPassword: password
      }, {
        headers: {
          "x-service-token": process.env.SYNC_TOKEN_COMPANERO,
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      console.error("Error notificando al servicio de compañera:", err.message);
    }

    res.json({ mensaje: "Contraseña actualizada ✅" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Ver alumnos de un grupo
app.get("/api/profesores/mis-grupos/:grupoId/alumnos", authMiddleware, async (req, res) => {
  try {
    const profesor = await Profesor.findOne({ usuario: req.user.username });
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

    const grupo = await Grupo.findById(req.params.grupoId)
      .populate("alumnos", "matricula nombre carrera calificaciones");
    if (!grupo) return res.status(404).json({ error: "Grupo no encontrado" });

    if (grupo.profesor.toString() !== profesor._id.toString())
      return res.status(403).json({ error: "No autorizado" });

    res.json(grupo.alumnos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Subir o actualizar calificación
app.post("/api/profesores/mis-grupos/:grupoId/calificaciones", authMiddleware, async (req, res) => {
  try {
    const profesor = await Profesor.findOne({ usuario: req.user.username });
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });

    const { matricula, materia, calificacion } = req.body;

    const grupo = await Grupo.findById(req.params.grupoId);
    if (!grupo) return res.status(404).json({ error: "Grupo no encontrado" });
    if (grupo.profesor.toString() !== profesor._id.toString())
      return res.status(403).json({ error: "No autorizado" });

    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    const calIndex = alumno.calificaciones.findIndex(c =>
      c.grupo.toString() === req.params.grupoId && c.materia === materia
    );

    if (calIndex >= 0) {
      alumno.calificaciones[calIndex].calificacion = calificacion;
      alumno.calificaciones[calIndex].profesor = profesor._id;
      alumno.calificaciones[calIndex].fecha = new Date();
    } else {
      alumno.calificaciones.push({ grupo: req.params.grupoId, materia, calificacion, profesor: profesor._id });
    }

    await alumno.save();

    axios.post("http://localhost:4001/api/alumnos/calificaciones", {
      alumnoId: alumno._id.toString(),
      matricula: alumno.matricula,
      grupo: grupo.nombre || grupo._id.toString(),
      materia,
      calificacion
    }).catch(err => console.error("Error notificando a compañera:", err.message));

    res.json({ mensaje: "✅ Calificación registrada/actualizada y notificada", alumno });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Recibir grupo desde otro servicio
app.post("/api/profesores/nuevo-grupo", async (req, res) => {
  try {
    const { nombre, materia, carrera, profe, alumnos } = req.body;

    // Validaciones básicas
    if (!nombre || !materia || !carrera || !profe) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Crear el grupo directamente con los datos recibidos
    const nuevoGrupo = new Grupo({
      nombre,      // nombre del grupo
      materia,
      carrera,
      profe,       // objeto completo del profesor
      alumnos: alumnos || [] // array de objetos de alumnos
    });

    await nuevoGrupo.save();

    res.status(201).json({ 
      message: "Grupo creado correctamente", 
      grupo: nuevoGrupo 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////

// 🔹 Endpoint para traer info del profesor logueado
app.get("/api/profesores/mis-datos", authMiddleware, async (req, res) => {
  console.log("req.user:", req.user);  // <--- debug
  try {
    const profesor = await Profesor.findOne({ usuario: req.user.username }).select("-passwordHash");
    if (!profesor) return res.status(404).json({ error: "Profesor no encontrado" });
    res.json(profesor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/////////////////////////////////////////////////////////////////////////////////////////////////////
// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Profesores corriendo en http://localhost:${PORT}`);
});
