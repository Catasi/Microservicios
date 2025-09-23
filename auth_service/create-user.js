// create-user.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

async function createUser() {
    try {
        const name = 'vans';
        const constrasenia = '123456789';
        const rol = 'alumno';
        console.log('🔗 Conectando a la base de datos...');


        
        // Conectar a la base de datos
        await mongoose.connect('mongodb://localhost:27017/auth_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Conectado a MongoDB');

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ username: name });
        if (existingUser) {
            console.log('⚠️  El usuario' + name + 'ya existe');
            mongoose.connection.close();
            return;
        }

        // Crear usuario de RH
        const user = new User({
            username: name,
            password: constrasenia, // Se encriptará automáticamente por el pre-save hook
            role: rol
        });

        await user.save();
        console.log('✅ Usuario creado exitosamente:');
        console.log('📋 Usuario:' + name);
        console.log('🔑 Contraseña:' +constrasenia);
        console.log('🎯 Rol:' + rol);
        
        mongoose.connection.close();
        console.log('🔒 Conexión cerrada');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createUser();