import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import alumnoRoutes from "./routes/alumnoRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas API
app.use("/api/alumnos", alumnoRoutes);

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Catch-all para rutas que no sean API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Servidor
const router = express.Router();

// Recibe la creación de un alumno
router.post("/agregar-alumno", async (req, res) => {
  try {
    const { matricula, usuario, nombre, carrera, password } = req.body;

    // Verificar duplicados
    const existing = await Alumno.findOne({ matricula });
    if (existing) {
      return res.status(400).json({ error: "El alumno ya existe" });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    // Creacion alumno
    const alumno = new Alumno({
      matricula,
      usuario,
      nombre,
      carrera,
      password: passwordHash
    });

    await alumno.save();

    res.status(201).json({ message: "Alumno creado", alumno });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar alumno: " + err.message });
  }
});


// logear del alumno
router.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const alumno = await Alumno.findOne({ usuario });
    if (!alumno) return res.status(404).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, alumno.password);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: alumno._id, role: "alumno", usuario: alumno.usuario },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Notificar al servicio de autenticación (DAVID)
    axios.post("http://localhost:3001/api/auth/notificar-login", {
      usuario: alumno.usuario,
      matricula: alumno.matricula
    }, {
      headers: { "x-service-token": process.env.SYNC_TOKEN_COMPANERO }
    }).catch(err => console.error("Error notificando al otro servicio:", err.message));

    res.json({ mensaje: "Login exitoso", token, role: "alumno", alumno });
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

// Actualizar contraseña de alumno
router.put("/mi-password", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const alumno = await Alumno.findByIdAndUpdate(
      req.user.id,
      { password: passwordHash },
      { new: true }
    );
    if (!alumno) return res.status(404).json({ error: "Alumno no encontrado" });

    // Notificar al servicio de autenticación sobre el cambio de contraseña
    try {
      await axios.post(
        "http://localhost:3001/api/auth/change-password", // endpoint del servicio auth
        {
          username: alumno.usuario,  // nombre de usuario del alumno
          newPassword: password       // nueva contraseña
        },
        {
          headers: {
            "x-service-token": process.env.SYNC_TOKEN_COMPANERO,
            "Content-Type": "application/json"
          }
        }
      );
    } catch (err) {
      console.error("Error notificando al servicio de autenticación:", err.message);
    }

    res.json({ mensaje: "Contraseña actualizada ✅" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Ver el grupo al que estoy asignado
router.get("/mi-grupo", authMiddleware, async (req, res) => {
  try {
    // Buscar el grupo donde el alumno esté en la lista de alumnos
    const grupo = await Grupo.findOne({ alumnos: req.user.id })
      .populate("profesor", "numeroEmpleado usuario nombre puesto")
      .populate("alumnos", "matricula nombre carrera");

    if (!grupo) return res.status(404).json({ error: "No estás asignado a ningún grupo" });

    res.json(grupo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ver mis calificaciones
router.get("/mis-calificaciones", authMiddleware, async (req, res) => {
  try {
    // Buscar al alumno
    const alumno = await Alumno.findById(req.user.id)
      .populate("calificaciones.grupo", "nombre carrera") // traer info del grupo
      .populate("calificaciones.profesor", "numeroEmpleado nombre usuario puesto"); // info del profesor

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

export default router;
