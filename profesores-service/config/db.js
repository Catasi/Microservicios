import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/profesores_db", {
    });
    console.log("✅ Conectado a MongoDB (Profesores)");
  } catch (error) {
    console.error("❌ Error al conectar Mongo:", error);
    process.exit(1);
  }
};

export default connectDB;
