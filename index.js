// console.log('Si está jalandooo');

// const http = require('node:http')

// const server = http.createServer((req, res) => {
// console.log('solicitud recivida')
// res.end('Hellouuu, si da')
// })

// server.listen(7020, () => {
// console.log('Servidor escuchando el puerto 7020') 
// })



import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json()); // ← AGREGAR ESTO (global)
const apiAlumnos = "http://localhost:4003/api/alumnos";
const apiProfesores = "http://localhost:4002/api/profesores";
const apiRH = "http://localhost:3002/api/professors";  // si es esta?
const apiSE = "http://localhost:3001/api/SE";

app.get('/', (req, res) => {
    res.send('Hellouuu, si da con Express');
});

// SERVICIOS ESCOLARES notifica que hay un nuevo alumno a ALUMNOS y AUTENTICACION
app.post('/notificar-nuevo-alumno', async (req, res) => {
    try {
        const { nombre, matricula, usuario, carrera } = req.body;
        
        // Api para notificar a Alumnos
        const respuesta = await fetch(`${apiAlumnos}/nuevo-alumno`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, matricula, usuario, carrera })
        });
        
        const data = await respuesta.json();
        
        if (respuesta.ok) {
            console.log('Alumno notificado exitosamente al servicio de Alumnos');
            res.json({ success: true, message: 'Notificación enviada correctamente' });
        } else {
            console.error('Error al notificar alumno al servicio de Alumnos:', data.message);
            res.status(respuesta.status).json({ success: false, error: data.message });
        }

        // Api para notificar a Autenticacion

        // Aquí no sé a quien notificar :v
    } catch (error) {
        console.error('Error en notificación:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// SERVICIOS ESCOLARES notifica que se modificaron los datos de un alumno
app.post('/actualizar-alumno', async (req, res) => {
    try {
        const { nombre, matricula, usuario, carrera } = req.body;
        const respuesta = await fetch(`${apiAlumnos}/modificar-alumno/${matricula}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, usuario, carrera })
        });
        const data = await respuesta.json();
        if (respuesta.ok) {
            console.log('Alumno actualizado exitosamente en el servicio de Alumnos');
            res.json({ success: true, message: 'Actualización enviada correctamente' });
        } else {
            console.error('Error al actualizar alumno en el servicio de Alumnos:', data.message);
            res.status(respuesta.status).json({ success: false, error: data.message });
        }
    } catch (error) {
        console.error('Error en actualización:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// SERVICIOS ESCOLARES notifica que se creó un nuevo grupo a ALUMNOS y PROFESORES
app.post('/nuevo-grupo', async (req, res) => {
    try {
        const { nombre, carrera, profesor, alumnos } = req.body;

        // Api para notificar a Alumnos
        const respuestaAlumnos = await fetch(`${apiAlumnos}/asignar-grupo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, carrera, profesor, alumnos })
        });
        const dataAlumnos = await respuestaAlumnos.json();
        if (!respuestaAlumnos.ok) {
            console.error('Error al notificar grupo al servicio de Alumnos:', dataAlumnos.message);
            return res.status(respuestaAlumnos.status).json({ success: false, error: dataAlumnos.message });
        } 

        // Api para notificar a Profesores
        const respuestaProfesores = await fetch(`${apiProfesores}/asignar-grupo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, carrera, profesor, alumnos })
        });
        const dataProfesores = await respuestaProfesores.json();
        if (!respuestaProfesores.ok) {
            console.error('Error al notificar grupo al servicio de Profesores:', dataProfesores.message);
            return res.status(respuestaProfesores.status).json({ success: false, error: dataProfesores.message });
        }

        // Si ambas notificaciones fueron exitosas
        console.log('Grupo notificado exitosamente a los servicios de Alumnos y Profesores');
        res.json({ success: true, message: 'Notificación de grupo enviada correctamente' });
    } catch (error) {
        console.error('Error en notificación de grupo:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// RH notifica nuevo profesor a AUTENTICACION, PROFESORES y SERVICIOS ESCOLARES
app.post('/rh/nuevo-profesor', async (req, res) => {
    try {
        const { numeroEmpleado, nombre, puesto, usuario, password } = req.body;
        
        // Validar puesto
        const puestosValidos = ['profesor', 'rh', 'servicios_escolares'];
        if (!puestosValidos.includes(puesto)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Puesto inválido. Debe ser: profesor, rh o servicios_escolares' 
            });
        }

        // 1. ✅ NOTIFICAR A AUTENTICACIÓN (Crear usuario)
        const respuestaAuth = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: usuario, 
                password: password, 
                role: puesto
            })
        });

        if (!respuestaAuth.ok) {
            const errorAuth = await respuestaAuth.json();
            return res.status(400).json({ 
                success: false, 
                error: 'Error en autenticación: ' + errorAuth.error 
            });
        }

        // 2. ✅ NOTIFICAR A PROFESORES (Tu servicio RH)
        const respuestaRH = await fetch('http://localhost:3002/api/professors/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeNumber: numeroEmpleado,
                name: nombre,
                position: puesto,
                username: usuario,
                password: password
            })
        });

        if (!respuestaRH.ok) {
            const errorRH = await respuestaRH.json();
            return res.status(400).json({ 
                success: false, 
                error: 'Error en RH: ' + errorRH.error 
            });
        }

        // 3. ✅ NOTIFICAR A SERVICIOS ESCOLARES
        const respuestaSE = await fetch(`${apiSE}/nuevo-profesor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numeroEmpleado,
                nombre,
                puesto,
                usuario
            })
        });

        // Si falla SE, no es crítico pero lo registramos
        if (!respuestaSE.ok) {
            console.warn('⚠️  Profesor creado, pero no se pudo notificar a Servicios Escolares');
        }

        console.log('✅ Profesor notificado a todos los servicios exitosamente');
        res.json({ 
            success: true, 
            message: 'Profesor registrado y notificado a Autenticación, RH y Servicios Escolares' 
        });

    } catch (error) {
        console.error('Error al notificar nuevo profesor:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// RH notifica cambio de contraseña a AUTENTICACION
app.post('/rh/cambio-password', async (req, res) => {
    try {
        const { usuario, oldPassword, newPassword } = req.body;
        
        const respuesta = await fetch('http://localhost:3001/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usuario,
                oldPassword: oldPassword,
                newPassword: newPassword
            })
        });

        const data = await respuesta.json();
        
        if (respuesta.ok) {
            console.log('✅ Contraseña cambiada exitosamente en Autenticación');
            res.json({ success: true, message: 'Contraseña actualizada correctamente' });
        } else {
            console.error('Error al cambiar contraseña:', data.error);
            res.status(respuesta.status).json({ success: false, error: data.error });
        }
    } catch (error) {
        console.error('Error en cambio de contraseña:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});
// endpoint para notificar a SE = /nuevo-profesor
// datos que a enviar: nombre, numero de empleado, usuario, puesto :D

// ALUMNO notifica cambio de contraseña a AUTENTICACION


// PROFESOR notifica cambio de contraseña a AUTENTICACION

// PROFESOR notifica nueva calificacion a ALUMNOS


//Inicialización del servidor
app.listen(7020, () => {
    console.log('Servidor escuchando el puerto 7020');
});
