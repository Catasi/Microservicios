import mongoose from "mongoose";

const GrupoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  carrera: { type: String, required: true },
  profesor_nombre: { type: String, required: true},
  alumnos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Alumno" }]
}, { timestamps: true });

export default mongoose.model("Grupo", GrupoSchema);
