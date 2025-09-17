
import express from 'express';
import mongoose from 'mongoose';
import dbConnection from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api_routes.js'; 

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Archivos de conexión a la base de datos
dbConnection();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

// Rutas
app.use('/api/SE', apiRoutes);

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));


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
const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});