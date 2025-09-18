import mongoose from "mongoose";

const ProfesorSchema = new mongoose.Schema({
  numeroEmpleado: { type: String, required: true, unique: true },
  usuario:        { type: String, required: true, unique: true }, // 👈 agregado
  nombre:         { type: String, required: true },
  puesto:         { type: String, enum: ["Profesor"], required: true },
  passwordHash:   { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Profesor", ProfesorSchema);
