/*
// JS para la interfaz de alumno junto con su barra de navegacion 
*/


// Navegación entre secciones
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');
}

/*
// Manejo de la información del alumno simulada
*/

const alumno = {
    nombre: "Valeria Rea",
    matricula: "20251001",
    usuario: "valerea",
    carrera: "Ingeniería en Sistemas",
    grupos: ["ISC-7A", "ISC-7B"],
    calificaciones: [
        { materia: "Matemáticas", profesor: "Lic. García", calificacion: 9.5, fecha: "2025-09-15" },
        { materia: "Física", profesor: "Dra. López", calificacion: 8.7, fecha: "2025-09-12" }
    ]
};


window.onload = () => {
    // Información general
    document.getElementById('alumnoNombre').textContent = alumno.nombre;
    document.getElementById('idNombre').textContent = alumno.nombre;
    document.getElementById('idMatricula').textContent = alumno.matricula;
    document.getElementById('idUsuario').textContent = alumno.usuario;
    document.getElementById('idCarrera').textContent = alumno.carrera;

    // Calificaciones
    const tbody = document.getElementById('tablaCalificaciones').querySelector('tbody');
    alumno.calificaciones.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.materia}</td><td>${c.profesor}</td><td>${c.calificacion}</td><td>${c.fecha}</td>`;
        tbody.appendChild(tr);
    });

    // Grupos
    const container = document.getElementById('studentsContainer');
    if(alumno.grupos.length > 0) {
        container.innerHTML = '';
        alumno.grupos.forEach(g => {
            const tag = document.createElement('div');
            tag.className = 'student-tag';
            tag.textContent = g;
            container.appendChild(tag);
        });
    }
}

/*
// Cambio de contraseña
*/

document.getElementById('formContrasena').addEventListener('submit', function(e) {
    e.preventDefault();
    const actual = document.getElementById('contrasenaActual').value;
    const nueva = document.getElementById('nuevaContrasena').value;

    // Simulación de actualización
    alert(`Contraseña cambiada correctamente\nActual: ${actual}\nNueva: ${nueva}`);
    this.reset();
});
