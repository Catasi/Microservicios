
/*
// Aquí se encuentra solo el JavaScript específico para la interfaz de Servicios Escolares
*/

document.getElementById('ActualizarAlumno').classList.add('oculto');

// Navegación entre secciones
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover clase active de todos los botones
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(sectionId).classList.add('active');
    
    // Activar el botón correspondiente
    event.target.classList.add('active');
}

// Limpiar formulario de alumno
function clearForm() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentCard').classList.remove('show');
    document.getElementById('searchMatricula').value = '';
    
    document.getElementById('ActualizarAlumno').classList.add('oculto');
    document.getElementById('GuardarAlumno').classList.remove('oculto');
}

// Limpiar formulario de grupo
function clearGroupForm() {
    document.getElementById('groupForm').reset();
    groupStudents = [];
    updateStudentsList();
}

// Mensajes de notificaciones o alertas
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.innerHTML = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; 
        padding: 15px; border-radius: 5px; z-index: 1000;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white; font-weight: bold;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}


/*
// Aquí se encuentra solo el JavaScript para las solicitudes de API
*/

// Variable para almacenar alumnos del grupo

let groupStudents = [];
let allProfesores = [];
const API = "http://localhost:4005/api/SE";
const apiAlumnos = "http://localhost:4001/api/alumnos";
const apiProfesores = "http://localhost:4003/api/profesores";
const apiRH = "http://localhost:3002/api/professors";
const apiAuth = "http://localhost:3001/api/auth"
const apiSE = "http://localhost:4005/api/SE";

fetchProfessors();

// Crear constraseña alumnos
function crearContrasena(nombre, matricula, usuario, carrera) {
    // Validar que los campos no estén vacíos
    if (!nombre || !matricula) {
        return 'default123'; // Contraseña por defecto si faltan datos
    }
    
    // Opción 1: Super sencilla - primeras 2 letras de nombre + últimos 4 dígitos de matrícula
    const contrasena = nombre.substring(0, 2).toLowerCase() + matricula.slice(-4);
    
    return contrasena;
}


// Agregar alumno nuevo
async function addNewStudent() {
    const nombre = document.getElementById('nombre').value;
    const matricula = document.getElementById('matricula').value;
    const usuario = document.getElementById('usuario').value;
    const carrera = document.getElementById('carrera').value;
    
    const contrasenia = crearContrasena(nombre, matricula, usuario, carrera);
    console.log('Contraseña generada:', contrasenia);

    const res = await fetch(`${API}/agregar-alumno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, matricula, usuario, carrera, contrasenia })
    });
    const data = await res.json();
    // console.log(data);
    if (data.success === true) {
        showNotification('Alumno agregado exitosamente');
        clearForm();
    } else {
        showNotification('Error al agregar alumno: ' + data.message, 'error');
    }

    // Notificar nuevo alumno a ALUMNOS
    const eventType = "nuevo-alumno";
    const payload = { nombre, matricula, usuario, carrera, contrasenia };

    const restAlumnos = await fetch(`${apiAlumnos}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, payload })
    });
    const dataAlumnos = await restAlumnos.json();
    console.log('Respuesta de API alumnos:', dataAlumnos);

    // Notificar nuevo alumno a AUTENTICACION
    const role = "alumno";
    const username = usuario;
    const password = contrasenia;

    const restAuth = await fetch(`${apiAuth}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
    });
    const dataAuth = await restAuth.json();
    console.log('Respuesta de API auth:', dataAuth);
}

// Buscar alumno
async function searchStudent() {
    document.getElementById('GuardarAlumno').classList.add('oculto');
    document.getElementById('ActualizarAlumno').classList.remove('oculto');

    const matricula = document.getElementById('searchMatricula').value;
    const res = await fetch(`${API}/buscar-alumno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula })
    });
    const data = await res.json();
    // console.log(data);

    if (data.success) {
        // Simulamos una búsqueda exitosa
        document.getElementById('studentCard').classList.add('show');
        
        // Llenar el formulario con los datos encontrados
        document.getElementById('nombre').value = data.alumno.nombre;
        document.getElementById('matricula').value = data.alumno.matricula;
        document.getElementById('usuario').value = data.alumno.usuario;
        document.getElementById('carrera').value = data.alumno.carrera;
        
        // Mostrar datos en la tarjeta
        document.getElementById('studentName').textContent  = data.alumno.nombre;
        document.getElementById('studentMatricula').textContent  = data.alumno.matricula;
        document.getElementById('studentUser').textContent  = data.alumno.usuario;
        document.getElementById('studentCarrera').textContent  = data.alumno.carrera;
    } else {
        showNotification('Por favor ingrese una matrícula válida', 'error');
        clearForm();
    }
}

// Modificar alumno
async function modifyStudent() {
    const nombre = document.getElementById('nombre').value;
    const matricula = document.getElementById('matricula').value;
    const usuario = document.getElementById('usuario').value;
    const carrera = document.getElementById('carrera').value;

    const res = await fetch(`${API}/modificar-alumno/${matricula}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, usuario, carrera })
    });
    const data = await res.json();
    // console.log(data);
    if (data.success) {
        showNotification('Alumno modificado exitosamente');
        clearForm();
    } else {
        showNotification('Error al modificar alumno: ' + data.message, 'error');
    }

    // Notificar nuevo alumno
    const eventType = "actualizar-alumno";
    const payload = { nombre, matricula, usuario, carrera };

    const restAlum = await fetch(`${apiAlumnos}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, payload })
    });
    const dataAlum = await restAlum.json();
    console.log('Respuesta del API alumnos:', dataAlum);
}

// Obtener profesores GetAll
async function fetchProfessors() {
    const res = await fetch(`${API}/profesores`);
    const data = await res.json();
    // console.log(data);
    if (data.success) {
        allProfesores = data.profesores;
        const select = document.getElementById('profesorSelect');
        select.innerHTML = '<option value="">Seleccione un profesor</option>';
        data.profesores.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof._id;
            option.textContent = prof.nombre;
            select.appendChild(option);
        });
    } else {
        showNotification('Error al cargar profesores: ' + data.message, 'error');
    }
}

// Función auxiliar para buscar alumno (reutiliza el endpoint)
async function findStudentByMatricula(matricula) {
    try {
        const res = await fetch(`${API}/buscar-alumno`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricula })
        });
        const data = await res.json();
        return data.success ? data.alumno : null;
    } catch (error) {
        console.error('Error al buscar alumno:', error);
        return null;
    }
}

// Agregar un grupo
async function createGroup() {
    const nombre = document.getElementById('grupoNombre').value;
    const carrera = document.getElementById('carreraGrupo').value;
    const profesor = document.getElementById('profesorSelect').value;
    const materia = document.getElementById('materiaGrupo').value;
    const alumnos = groupStudents;
    console.log("Alumnos que voy a mandar:", alumnos);
    const alumnosData = groupStudents.map(a => a._id);

    if (!nombre || !carrera || !profesor || !materia) {
        showNotification('Por favor complete todos los campos del grupo', 'error');
        return;
    }
    if (alumnos.length === 0) {
        showNotification('Por favor agregue al menos un alumno al grupo', 'error');
        return;
    }
    const res = await fetch(`${API}/crear-grupo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, carrera, materia, profesorId: profesor, alumnos })
    });
    const data = await res.json();
    // console.log(data);
    if (data.success) {
        showNotification('Grupo creado exitosamente');
        clearGroupForm();
    }
    else {
        showNotification('Error al crear grupo: ' + data.message, 'error');
    }

    const profesorObj = allProfesores.find(prof => prof._id === profesor);
    // console.log('profesorObj:', profesorObj);

    // Notificar nuevo grupo a ALUMNOS
    const rest = await fetch(`${apiAlumnos}/recibir-grupo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, carrera, materia, profesorId: profesor, alumnos })
    });
        const dataA = await rest.json();
        console.log('Respuesta del API alumnos:', dataA);

    // Notificar nuevo grupo a PROFESORES
    const restProf = await fetch(`${apiProfesores}/nuevo-grupo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, carrera, materia, profesorId: profesor, alumnos })
    });
        const dataProf = await restProf.json();
        console.log('Respuesta del API profesores:', dataProf);

}


// Agregar alumno al grupo
async function addStudentToGroup() {
    const matricula = document.getElementById('addStudentMatricula').value;
    
    if (!matricula) {
        showNotification('Por favor ingrese una matrícula', 'error');
        return;
    }

    // Buscar alumno reutilizando el endpoint
    const student = await findStudentByMatricula(matricula);
    if (!student) {
        showNotification('No se encontró un alumno con esa matrícula', 'error');
        document.getElementById('addStudentMatricula').value = '';
        return;
    }

    // Verificar si ya está agregado
    if (groupStudents.find(s => s.matricula == matricula)) {
        showNotification('El alumno ya está agregado al grupo', 'error');
        return;
    }

    // Agregar alumno al grupo
    groupStudents.push(student);
    updateStudentsList();
    document.getElementById('addStudentMatricula').value = '';
    showNotification(`Alumno ${student.nombre} agregado al grupo`);
}

// Actualizar la lista visual de alumnos
function updateStudentsList() {
    const container = document.getElementById('studentsContainer');
    
    if (groupStudents.length === 0) {
        container.className = '';
        container.innerHTML = '<p style="color: #666; text-align: center; margin: 0;">No hay alumnos agregados</p>';
    } else {
        container.className = 'has-students';
        container.innerHTML = groupStudents.map(student => `
            <div class="student-tag">
                ${student.nombre} (${student.matricula})
                <button class="remove-btn" onclick="removeStudentFromGroup(${student.matricula})" title="Remover alumno">×</button>
            </div>
        `).join('') + '<p style="color: #666; text-align: center; margin: 0;">No hay alumnos agregados</p>';
    }
}

// Remover alumno del grupo
function removeStudentFromGroup(matricula) {
    groupStudents = groupStudents.filter(s => s.matricula != matricula);
    updateStudentsList();
}


// Manejar envío de formulario de grupo
document.getElementById('groupForm').addEventListener('submit', function(e) {
    e.preventDefault();
});