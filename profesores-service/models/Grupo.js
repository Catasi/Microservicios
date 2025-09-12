const mongoose = require("mongoose");

const GrupoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  carrera: { type: String, required: true },
  profesor: { type: mongoose.Schema.Types.ObjectId, ref: "Profesor", required: true },
  alumnos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Alumno" }]
}, { timestamps: true });

module.exports = mongoose.model("Grupo", GrupoSchema);
