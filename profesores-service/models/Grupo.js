import mongoose from "mongoose";

const GrupoSchema = new mongoose.Schema({
  materia:  { type: String, required: true },
  grupo:    { type: String, required: true },
  carrera:  { type: String, required: true },
  profesor: { type: mongoose.Schema.Types.ObjectId, ref: "Profesor", required: true },
  alumnos:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Alumno" }]
}, { timestamps: true });

export default mongoose.model("Grupo", GrupoSchema);
