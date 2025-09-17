import mongoose from "mongoose";

const AlumnoSchema = new mongoose.Schema({
    matricula: { type: Number, required: true, unique: true },
    nombre: { type: String, required: true },
    carrera: { type: String, required: true },
    usuario: { type: String, required: true, unique: true },
    constrasenia: { type: String, required: true },
}, { timestamps: false });

export default mongoose.model("Alumnos", AlumnoSchema);