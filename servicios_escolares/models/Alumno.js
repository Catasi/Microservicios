import mongoose from "mongoose";

const AlumnoSchema = new mongoose.Schema({
    matricula: { type: Number, required: true, unique: true },
    nombre: { type: String, required: true },
    carrera: { type: String, required: true },
    usuario: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.model("Alumno", AlumnoSchema);