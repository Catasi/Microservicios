import mongoose from "mongoose";

const ServiciosEscolaresSchema = new mongoose.Schema({
    no_empleado: { type: Number, required: true, unique: true },
    nombre: { type: String, required: true },
    puesto: { type: String,  required: true },
    usuario: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.model("ServiciosEscolares", ServiciosEscolaresSchema);