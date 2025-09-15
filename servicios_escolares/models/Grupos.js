const mongoose = require("mongoose");

const GruposSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    carrera: { type: String, required: true },
    profe: { 
        nombre: String,
        no_empleado: Number,
        usuario: String
    },
    alumnos: [{
        nombre: String,
        matricula: Number,
        usuario: String
    }]
}, { timestamps: true });

module.exports = mongoose.model("Grupos", GruposSchema);