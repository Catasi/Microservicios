import express from 'express';
import ServiciosEscolares from "../models/Servicios_escolares.js";
import Alumnos from "../models/Alumno.js";
import Profesores from "../models/Profesor.js";
import Grupo from '../models/Grupos.js';

const router = express.Router();

// Ruta para agregar alumno
router.post('/agregar-alumno', async (req, res) => {
    try {
        const { nombre, matricula, usuario, carrera } = req.body;
        if (!nombre || !matricula || !usuario || !carrera) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos (nombre, matricula, usuario, carrera)' 
            });
        }

        const existeAlumno = await Alumnos.findOne({ matricula });
        if (existeAlumno) {
            return res.status(409).json({ 
                success: false,
                message: 'Ya existe un alumno con esa matrícula' 
            });
        }

        const nuevoAlumno = new Alumnos({ nombre, matricula, usuario, carrera});
        await nuevoAlumno.save();
        res.status(201).json({
            success: true,
            message: 'Alumno agregado exitosamente', 
            alumno: nuevoAlumno });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al agregar alumno', 
            error: error.message });
    }
});

// Ruta para buscar alumno por matrícula
router.post('/buscar-alumno', async (req, res) => {
    try {
        const { matricula } = req.body;

        if (!matricula) {
            return res.status(400).json({ 
                success: false,
                message: 'La matrícula es requerida' 
            });
        }

        const alumno = await Alumnos.findOne({ matricula });
        if (!alumno) {
            return res.status(404).json({ 
                success: false,
                message: 'Alumno no encontrado' });
        }
        res.json({
            success: true,
            alumno: alumno});
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al buscar alumno', 
            error: error.message });
    }
});

// Ruta para modificar alumno existente
router.put('/modificar-alumno/:matricula', async (req, res) => {
    try {
        const { matricula } = req.params;
        const { nombre, usuario, carrera } = req.body;
        if (!nombre || !usuario || !carrera) {
            return res.status(400).json({ 
                success: false,
                message: 'Todos los campos son requeridos (nombre, usuario, carrera)' 
            });
        }
        const alumnoActualizado = await Alumnos.findOneAndUpdate(
            { matricula }, 
            { nombre, usuario, carrera },
            { new: true, runValidators: true }
        );
        if (!alumnoActualizado) {
            return res.status(404).json({ 
                success: false,
                message: 'Alumno no encontrado' 
            });
        }
        res.json({ 
            success: true,
            message: 'Alumno modificado exitosamente', 
            alumno: alumnoActualizado });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error al modificar alumno', 
            error: error.message });
    }
});

// Ruta para obtener los profesores (getAll)
router.get('/profesores', async (req, res) => {
    try {
        const profesores = await Profesores.find();
        res.json({
            success: true,
            profesores: profesores });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener profesores', 
            error: error.message });
    }
});


// Ruta para crear grupo
router.post('/crear-grupo', async (req, res) => {
    try {
    const { nombre, carrera, profesorId, alumnos } = req.body;
        
        // Validación de campos requeridos
        if (!nombre || !carrera || !profesorId) {
            console.log('Validación falló');
            return res.status(400).json({ 
                message: 'Los campos nombre, carrera y profesorId son requeridos' 
            });
        }

        // Buscar el profesor completo por ID
        const profesor = await Profesores.findById(profesorId);
        
        if (!profesor) {
            return res.status(404).json({ 
                message: 'Profesor no encontrado' 
            });
        }

        //  Crear grupo con estructura correcta 
        const nuevoGrupo = new Grupo({ 
            nombre, 
            carrera,
            profe: {
                nombre: profesor.nombre,
                no_empleado: profesor.no_empleado,
                usuario: profesor.usuario
            },
            alumnos: alumnos || [] 
        });
        
        await nuevoGrupo.save();
        res.status(201).json({ 
            success: true,
            message: 'Grupo creado exitosamente', 
            grupo: nuevoGrupo 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al crear grupo', 
            error: error.message 
        });
    }
});

//  Ruta para actualizar alumno
router.put('/actualizar-alumno/:matricula', async (req, res) => {
    try {
        const { matricula } = req.params;
        const { nombre, carrera } = req.body;
        
        const alumnoActualizado = await Alumnos.findOneAndUpdate(
            { matricula }, 
            { nombre, carrera },
            { new: true, runValidators: true }
        );
        
        if (!alumnoActualizado) {
            return res.status(404).json({ 
                success: false,
                message: 'Alumno no encontrado' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Alumno actualizado exitosamente',
            alumno: alumnoActualizado 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al actualizar alumno', 
            error: error.message 
        });
    }
});

// ||| Notificaciones entre microservicios |||

// Nuevo profesor
router.post('/nuevo-profesor', express.json(), async (req, res) => {
    try {
        const { nombre, no_empleado, usuario, puesto } = req.body;
        const nuevoProfe = new Profesores({ nombre, no_empleado, usuario, puesto});
        await nuevoProfe.save();
        res.status(201).json({
            success: true,
            message: 'Profesor agregado exitosamente', 
            profesor: nuevoProfe });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al agregar profesor', 
            error: error.message });
    }
});


export default router; 
