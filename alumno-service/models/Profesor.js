import mongoose from "mongoose";

const ProfesorSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
}, { timestamps: true }); 

export default mongoose.model("Profesor", ProfesorSchema); 