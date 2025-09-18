//Se usa el import por el type module en el package.json
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbConnection = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Servicios_Escolares", {
        });
        console.log('✅ Base de datos online Servicios Escolares');
        return conn;
    } catch (error) {
        console.log(error);
        throw new Error('❌ Error a la hora de iniciar la base de datos');
    }
}

export default dbConnection;