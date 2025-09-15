//Se usa el import por el type module en el package.json
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbConnection = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Base de datos online');
        return conn;
    } catch (error) {
        console.log(error);
        throw new Error('Error a la hora de iniciar la base de datos');
    }
}

export default dbConnection;