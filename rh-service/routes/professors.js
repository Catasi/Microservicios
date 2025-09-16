const express = require('express');
const axios = require('axios');
const Professor = require('../models/Professor');
const router = express.Router();

// Middleware para verificar token (simplificado)
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    
    // Verificar token con auth service
    const authResponse = await axios.get('http://localhost:3001/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    req.user = authResponse.data;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Registrar nuevo profesor
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { employeeNumber, name, position, username, password } = req.body;

    // Crear profesor en RH service
    const professor = new Professor({
      employeeNumber,
      name,
      position
    });
    await professor.save();

    // Crear usuario en Auth service
    await axios.post('http://localhost:3001/api/auth/register', {
      username,
      password,
      role: position
    });

    res.status(201).json({ 
      message: 'Profesor registrado exitosamente',
      professor 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar profesor' });
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

module.exports = router;