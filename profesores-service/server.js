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

const PORT = process.env.PORT || 4003;
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
  res.sendFile(path.join(__dirname, "public", "test-profesores.html"));
});

// Servidor
const router = express.Router();

app.listen(PORT, () => {
  console.log(`🚀 Servidor Profesores corriendo en http://localhost:${PORT}`);
});


/////////////////////////////////////////////////////////////////////////////////////////////////////

//Revibe la creacion de profesor 
router.post("/register", async (req, res) => {
  try {
    const { numeroEmpleado, usuario, nombre, puesto, password } = req.body;

    // Verificar duplicados
    const existing = await Profesor.findOne({ numeroEmpleado });
    if (existing) {
      return res.status(400).json({ error: "El profesor ya existe" });
    }

    // Hashear password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear profesor
    const profesor = new Profesor({
      numeroEmpleado,
      usuario,
      nombre,
      puesto,
      passwordHash,
    });

    await profesor.save();

    res.status(201).json({ message: "Profesor creado en mi servicio", profesor });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar profesor: " + err.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////

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

/////////////////////////////////////////////////////////////////////////////////////////////////////

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

/////////////////////////////////////////////////////////////////////////////////////////////////////

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

     // 3️⃣ Notificar al servicio 
    try {
      await axios.post(
        "http://localhost:3001/api/auth/change-password", // endpoint 
        {
          username: profesor.usuario,  // nombre de usuario del profesor
          newPassword: password        // nueva contraseña en texto plano
        },
        {
          headers: {
            "x-service-token": process.env.SYNC_TOKEN_COMPANERO, // opcional, seguridad
            "Content-Type": "application/json"
          }
        }
      );
    } catch (err) {
      console.error("Error notificando al servicio de compañera:", err.message);
      // Puedes decidir si quieres revertir el cambio o solo avisar
    }

    res.json({ mensaje: "Contraseña actualizada ✅" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////

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

/////////////////////////////////////////////////////////////////////////////////////////////////////

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


/////////////////////////////////////////////////////////////////////////////////////////////////////

// Recibir grupo desde el otro servicio
router.post("/nuevo-grupo", async (req, res) => {
    try {
        const { nombre, materia, carrera, profesor, alumnos } = req.body;

        // Buscar profesor en TU base por número de empleado
        const profe = await Profesor.findOne({ numeroEmpleado: profesor.no_empleado });
        if (!profe) return res.status(404).json({ error: "Profesor no encontrado en mi servicio" });

        // Buscar alumnos en TU base y mapear a ObjectId
        const alumnosIds = [];
        for (let a of alumnos) {
            const alumno = await Alumno.findOne({ matricula: a.matricula });
            if (alumno) alumnosIds.push(alumno._id);
        }

        // Crear grupo en TU servicio
        const nuevoGrupo = new Grupo({
            grupo: nombre,
            materia,
            carrera,
            profesor: profe._id,
            alumnos: alumnosIds
        });

        await nuevoGrupo.save();

        res.status(201).json({ message: "Grupo creado en mi servicio", grupo: nuevoGrupo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
