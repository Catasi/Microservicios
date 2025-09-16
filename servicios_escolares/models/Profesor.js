import mongoose from "mongoose";

const ProfesorSchema = new mongoose.Schema({
    no_empleado: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    puesto: { type: String, required: true },
    usuario: { type: String, required: true, unique: true },
}, { timestamps: false });

export default mongoose.model("Profesores", ProfesorSchema);