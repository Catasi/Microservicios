import mongoose from "mongoose";

const ProfesorSchema = new mongoose.Schema({
    numeroEmpleado: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
}, { timestamps: true }); 

export default mongoose.model("Profesor", ProfesorSchema); 