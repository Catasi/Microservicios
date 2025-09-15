
/*
// Aquí se encuentra solo el JavaScript específico para la interfaz de Servicios Escolares
*/

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
}

// Limpiar formulario de grupo
function clearGroupForm() {
    document.getElementById('groupForm').reset();
    groupStudents = [];
    updateStudentsList();
}


/*
// Aquí se encuentra solo el JavaScript para las solicitudes de API
*/

// Variable para almacenar alumnos del grupo
let groupStudents = [];
const API = "http://localhost:3001/api/SE";

// Buscar alumno
async function searchStudent() {
    const matricula = document.getElementById('searchMatricula').value;
    const res = await fetch(`${API}/buscar-alumno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula })
    });
    const data = await res.json();
    console.log(data);

    if (data.success) {
        // Simulamos una búsqueda exitosa
        document.getElementById('studentCard').classList.add('show');
        
        // Llenar el formulario con los datos encontrados
        document.getElementById('nombre').value = data.alumno.nombre;
        document.getElementById('matricula').value = data.alumno.matricula;
        document.getElementById('usuario').value = data.alumno.usuario;
        document.getElementById('studentName').textContent  = data.alumno.nombre;
        document.getElementById('studentMatricula').textContent  = data.alumno.matricula;
        document.getElementById('studentUser').textContent  = data.alumno.usuario;
    } else {
        alert('Por favor ingrese una matrícula válida');
        clearForm();
    }
}

// Agregar alumno al grupo
function addStudentToGroup() {
    const matricula = document.getElementById('addStudentMatricula').value;
    
    if (!matricula) {
        alert('Por favor ingrese una matrícula');
        return;
    }

    // Verificar si el alumno existe
    const student = studentsDB[matricula];
    if (!student) {
        alert('No se encontró un alumno con esa matrícula');
        return;
    }

    // Verificar si ya está agregado
    if (groupStudents.find(s => s.matricula == matricula)) {
        alert('El alumno ya está agregado al grupo');
        return;
    }

    // Agregar alumno al grupo
    groupStudents.push(student);
    updateStudentsList();
    document.getElementById('addStudentMatricula').value = '';
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

// Limpiar formulario de alumno
function clearForm() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentCard').classList.remove('show');
    document.getElementById('searchMatricula').value = '';
}

// Limpiar formulario de grupo
function clearGroupForm() {
    document.getElementById('groupForm').reset();
    groupStudents = [];
    updateStudentsList();
}

// Manejar envío de formulario de alumno
document.getElementById('studentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Alumno guardado exitosamente');
});

// Manejar envío de formulario de grupo
document.getElementById('groupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const groupData = {
        nombre: document.getElementById('grupoNombre').value,
        carrera: document.getElementById('carrera').value,
        profesorId: document.getElementById('profesorSelect').value,
        alumnos: groupStudents
    };
    
    console.log('Grupo creado:', groupData);
    alert(`Grupo "${groupData.nombre}" creado exitosamente con ${groupStudents.length} alumnos`);
});