//simulacion de ddatos de prueba

import mongoose from "mongoose";
import dotenv from "dotenv";
import Alumno from "./models/Alumno.js";
import Grupo from "./models/Grupo.js";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const seed = async () => {
  try {
    // Limpiar colecciones (opcional)
    await Alumno.deleteMany({});
    await Grupo.deleteMany({});

    // Crear un grupo
    const grupo = new Grupo({
      nombre: "Desarrollo Web",
      carrera: "TSU Desarrollo de Software",
      alumnos: [],
    });
    await grupo.save();

    // Crear un alumno
    const alumno = new Alumno({
      matricula: "A001",
      nombre: "Vanesa",
      carrera: "TSU Desarrollo de Software",
      password: "123456", // se puede cambiar luego con /mi-password
      calificaciones: [
        { grupo: grupo._id, materia: "Programación", calificacion: 95 },
      ],
    });
    await alumno.save();

    // Asociar alumno al grupo
    grupo.alumnos.push(alumno._id);
    await grupo.save();

    console.log("✅ Datos de prueba creados");
    console.log("ID del alumno:", alumno._id.toString());
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
