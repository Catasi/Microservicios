import mongoose from "mongoose";

const GruposSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  carrera: { type: String, required: true },
  materia: { type: String, required: true },
  profe: { 
    nombre: String,
    no_empleado: Number,
    usuario: String
  },
  alumnos: [{
    nombre: String,
    matricula: Number,
    usuario: String
  }]
}, { timestamps: false });

export default mongoose.model("Grupos", GruposSchema);
