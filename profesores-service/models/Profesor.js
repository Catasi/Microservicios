const mongoose = require("mongoose");

const ProfesorSchema = new mongoose.Schema({
  numeroEmpleado: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  puesto: { type: String, enum: ["RH", "Servicios Escolares", "Profesor"], required: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Profesor", ProfesorSchema);
