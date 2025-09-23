//const alumnoId = "ID_DEL_ALUMNO"; // reemplazar con el _id real del alumno logueado que se genero en SE

// Navegación entre secciones
function showSection(sectionId, event) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');
    if (event) event.currentTarget.classList.add('active');
}

// Cargar información del alumno desde backend API
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(`/api/alumno/${alumnoId}`);
        const alumno = await res.json();

        document.getElementById('idNombre').textContent = alumno.nombre;
        document.getElementById('idMatricula').textContent = alumno.matricula;
        document.getElementById('idUsuario').textContent = alumno.usuario;
        document.getElementById('idCarrera').textContent = alumno.carrera;

        // Calificaciones
        const tbody = document.getElementById('tablaCalificaciones').querySelector('tbody');
        tbody.innerHTML = "";
        alumno.calificaciones.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${c.materia}</td><td>${c.profesor}</td><td>${c.calificacion}</td><td>${new Date(c.fecha).toLocaleDateString()}</td>`;
            tbody.appendChild(tr);
        });

        // Grupos
        const container = document.getElementById('groupsContainer');
        container.innerHTML = "";
        if (alumno.grupos.length > 0) {
            alumno.grupos.forEach(g => {
                const tag = document.createElement('div');
                tag.className = 'student-tag';
                tag.textContent = g;
                container.appendChild(tag);
            });
        } else {
            container.innerHTML = "<p>No hay grupos asignados</p>";
        }

    } catch (error) {
        console.error("Error cargando alumno:", error);
    }
});

// Cambio de contraseña
document.getElementById('formContrasena').addEventListener('submit', async function(e) {
    e.preventDefault();
    const contrasenaActual = document.getElementById('contrasenaActual').value;
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;

    try {
        const res = await fetch('/api/alumno/contrasena', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alumnoId, contrasenaActual, nuevaContrasena })
        });
        const data = await res.json();
        alert(data.message);
        this.reset();
    } catch (error) {
        alert("Error al cambiar la contraseña: " + error.message);
    }
});
