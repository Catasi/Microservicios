const express = require('express');
const axios = require('axios');
const Professor = require('../models/Professor');
const router = express.Router();

// Middleware para verificar token - CORREGIDO
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }
        
        // Verificar token con auth service - USAR POST
        const authResponse = await axios.post('http://localhost:3001/api/auth/verify', 
            {},
            {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        req.user = authResponse.data;
        next();
    } catch (error) {
        console.error('Error verifying token:', error.response?.data || error.message);
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Registrar nuevo profesor - MEJORADO
router.post('/register', verifyToken, async (req, res) => {
    try {
        const { employeeNumber, name, position, username, password } = req.body;

        // Verificar si el profesor ya existe
        const existingProfessor = await Professor.findOne({ employeeNumber });
        if (existingProfessor) {
            return res.status(400).json({ error: 'El número de empleado ya existe' });
        }

        // Crear profesor en RH service
        const professor = new Professor({
            employeeNumber,
            name,
            position
        });
        await professor.save();

        // Crear usuario en Auth service
        try {
            await axios.post('http://localhost:3001/api/auth/register', {
                username,
                password,
                role: position
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (authError) {
            // Si falla el registro en auth, eliminar el profesor creado
            await Professor.findByIdAndDelete(professor._id);
            return res.status(500).json({ 
                error: 'Error al crear usuario de autenticación: ' + 
                      (authError.response?.data?.error || authError.message)
            });
        }

        res.status(201).json({ 
            message: 'Profesor registrado exitosamente',
            professor 
        });
    } catch (error) {
        console.error('Error en register:', error);
        res.status(500).json({ 
            error: 'Error al registrar profesor: ' + error.message 
        });
    }
});

// Obtener todos los profesores
router.get('/', verifyToken, async (req, res) => {
    try {
        const professors = await Professor.find({ active: true });
        res.json(professors);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener profesores' });
    }
});

// Endpoint de health check
router.get('/health', (req, res) => {
    res.json({ message: 'RH Service is running!' });
});

module.exports = router;