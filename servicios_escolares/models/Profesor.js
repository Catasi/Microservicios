const mongoose = require("mongoose");

const ProfesorSchema = new mongoose.Schema({
    no_empleado: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    puesto: { type: String, required: true },
    usuario: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("Profesor", ProfesorSchema);