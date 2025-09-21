import mongoose from "mongoose";

const AlumnoSchema = new mongoose.Schema({
  matricula: { type: String, required: true, unique: true },
  nombre:    { type: String, required: true },
  carrera:   { type: String, required: true },
  calificaciones: [{
    grupo:       { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", required: true },
    materia:     { type: String, required: true },
    calificacion:{ type: Number, required: true },
    profesor:    { type: mongoose.Schema.Types.ObjectId, ref: "Profesor", required: true },
    fecha:       { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Alumno = mongoose.models.Alumno || mongoose.model('Alumno', AlumnoSchema);

export default Alumno;


