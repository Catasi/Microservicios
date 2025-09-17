import mongoose from "mongoose";  
import dotenv from "dotenv";
import Alumno from "./models/Alumno.js";
import Grupo from "./models/Grupo.js";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const seed = async () => {
  try {
    // Limpiar colecciones
    await Alumno.deleteMany({});
    await Grupo.deleteMany({});

    // Crear un grupo
    const grupo = new Grupo({
      nombre: "Desarrollo Web",
      carrera: "TSU Desarrollo de Software",
      alumnos: [],
    });
    await grupo.save();

    // Alumno 1
    const alumno1 = new Alumno({
      matricula: "A001",
      nombre: "Vanesa",
      carrera: "TSU Desarrollo de Software",
      password: "12345", 
      calificaciones: [
        { grupo: grupo._id, materia: "Programación", calificacion: 95 },
      ],
    });
    await alumno1.save();
    grupo.alumnos.push(alumno1._id);

    // Alumno 2
    const alumno2 = new Alumno({
      matricula: "A002",
      nombre: "Luis",
      carrera: "TSU Desarrollo de Software",
      password: "54321",
      calificaciones: [
        { grupo: grupo._id, materia: "Programación", calificacion: 88 },
      ],
    });
    await alumno2.save();
    grupo.alumnos.push(alumno2._id);

    // Alumno 3
    const alumno3 = new Alumno({
      matricula: "A003",
      nombre: "María",
      carrera: "TSU Desarrollo de Software",
      password: "abc123",
      calificaciones: [
        { grupo: grupo._id, materia: "Programación", calificacion: 92 },
      ],
    });
    await alumno3.save();
    grupo.alumnos.push(alumno3._id);

    // Guardar grupo actualizado
    await grupo.save();

    console.log("✅ Datos de prueba creados");
    console.log("ID alumnos:", alumno1._id.toString(), alumno2._id.toString(), alumno3._id.toString());
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
// Para ejecutar: node alumno-service/seed.js
// Asegúrate de tener MongoDB corriendo y la URL en .env correcta
// También instala las dependencias con: npm install mongoose dotenv
// Luego corre el script con: node alumno-service/seed.js
// Esto limpiará las colecciones y añadirá datos de prueba
// Revisa la consola para ver los IDs generados de los alumnos  
