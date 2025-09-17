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
<<<<<<< HEAD
const apiAlumnos = "http://localhost:4001/api/alumnos";
=======
app.use(express.json()); // ← AGREGAR ESTO (global)
const apiAlumnos = "http://localhost:4003/api/alumnos";
>>>>>>> b46b6347c1f9d8c66c93476f882391e9b6fea8f4
const apiProfesores = "http://localhost:4002/api/profesores";
const apiRH = "http://localhost:3002/api/professors";  // si es esta?
const apiSE = "http://localhost:3001/api/SE";

app.get('/', (req, res) => {
    res.send('Hellouuu, si da con Express');
});

<<<<<<< HEAD
// SERVICIOS ESCOLARES notifica que hay un nuevo alumno a ALUMNOS y AUTENTICACION
app.post('/notificar-nuevo-alumno', express.json(), async (req, res) => {
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
app.post('actualizar-alumno', express.json(), async (req, res) => {
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
app.post('/nuevo-grupo', express.json(), async (req, res) => {
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

// RH notifica cambio de contraseña a AUTENTICACION


// RH notifica nuevo profesor a AUTENTICACION, PROFESORES y SERVICIOS ESCOLARES
// endpoint para notificar a SE = /nuevo-profesor
// datos que a enviar: nombre, numero de empleado, usuario, puesto :D

// ALUMNO notifica cambio de contraseña a AUTENTICACION
app.post('/alumno/cambio-password', express.json(), async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        // 🔔 Notificar a Autenticación
        const respuesta = await fetch(`${apiAuth}/notify-password-change`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, newPassword })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            console.log('✅ Contraseña notificada exitosamente a Autenticación');
            res.json({ success: true, message: 'Cambio de contraseña enviado correctamente' });
        } else {
            console.error('❌ Error al notificar cambio de contraseña:', data.error);
            res.status(respuesta.status).json({ success: false, error: data.error });
        }
    } catch (error) {
        console.error('🔥 Error en notificación de cambio de contraseña:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// PROFESOR notifica cambio de contraseña a AUTENTICACION

// PROFESOR notifica nueva calificacion a ALUMNOS


=======
>>>>>>> b46b6347c1f9d8c66c93476f882391e9b6fea8f4
//Inicialización del servidor
app.listen(7020, () => {
    console.log('Servidor escuchando el puerto 7020');
});
