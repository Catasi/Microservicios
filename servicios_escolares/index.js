
import express from 'express';
import mongoose from 'mongoose';
import dbConnection from './db.js';

const app = express();

//Archivos de conexión a la base de datos
dbConnection();

app.use(express.json());
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});


//Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Ocurrió un error en el servidor',
        error: err.message 
    });
});


//PUERTO DEL SERVIDOR
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});