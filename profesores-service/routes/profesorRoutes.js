const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Profesor = require("../models/Profesor");
const Grupo = require("../models/Grupo");
const Alumno = require("../models/Alumno");

const router = express.Router();

// Login de profesor
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

    // ✅ Devuelve también el role
    res.json({ mensaje: "Login exitoso", token, role: profesor.puesto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Middleware para validar token JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contiene id, role y numeroEmpleado
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// 📌 Actualizar mi propia contraseña
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
      .populate("alumnos", "matricula nombre carrera");
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Ver alumnos de un grupo
router.get("/mis-grupos/:grupoId/alumnos", authMiddleware, async (req, res) => {
  try {
    const grupo = await Grupo.findById(req.params.grupoId)
      .populate("alumnos", "matricula nombre carrera");
    if (!grupo) return res.status(404).json({ error: "Grupo no encontrado" });

    // Validar que el grupo pertenezca al profesor
    if (grupo.profesor.toString() !== req.user.id)
      return res.status(403).json({ error: "No autorizado" });

    res.json(grupo.alumnos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Subir calificación a un alumno de mi grupo
router.post("/mis-grupos/:grupoId/calificaciones", authMiddleware, async (req, res) => {
  try {
    const { matricula, materia, calificacion } = req.body;

    const grupo = await Grupo.findById(req.params.grupoId);
    if (!grupo) return res.status(404).json({ error: "Grupo no encontrado" });

    // Validar que el grupo pertenezca al profesor
    if (grupo.profesor.toString() !== req.user.id)
      return res.status(403).json({ error: "No autorizado" });

    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    alumno.calificaciones.push({
      grupo: req.params.grupoId,
      materia,
      calificacion
    });
    await alumno.save();

    res.json({ mensaje: "✅ Calificación registrada", alumno });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
