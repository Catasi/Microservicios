// create-user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createUser() {
    try {
        console.log('🔗 Conectando a la base de datos...');
        
        // Conectar a la base de datos
        await mongoose.connect('mongodb://localhost:27017/auth_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Conectado a MongoDB');

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ username: 'adminrh' });
        if (existingUser) {
            console.log('⚠️  El usuario adminrh ya existe');
            mongoose.connection.close();
            return;
        }

        // Crear usuario de RH
        const user = new User({
            username: 'adminrh',
            password: 'password123', // Se encriptará automáticamente por el pre-save hook
            role: 'rh'
        });

        await user.save();
        console.log('✅ Usuario creado exitosamente:');
        console.log('📋 Usuario: adminrh');
        console.log('🔑 Contraseña: password123');
        console.log('🎯 Rol: rh');
        
        mongoose.connection.close();
        console.log('🔒 Conexión cerrada');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createUser();