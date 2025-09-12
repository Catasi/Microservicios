const mongoose = require("mongoose");

const AlumnoSchema = new mongoose.Schema({
  matricula: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  carrera: { type: String, required: true },
  calificaciones: [{
    grupo: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo" },
    materia: String,
    calificacion: Number,
    fecha: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Alumno", AlumnoSchema);
