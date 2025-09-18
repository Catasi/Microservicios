import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a MongoDB (Profesores)");
  } catch (error) {
    console.error("❌ Error al conectar Mongo:", error);
    process.exit(1);
  }
};

export default connectDB;
