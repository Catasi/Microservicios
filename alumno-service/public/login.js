document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    console.log('Token en localStorage:', token);

    if (!token) {
        alert('No hay token. Redirigiendo al login...');
        window.location.replace('/login.html');
    }

    // Verificar token al cargar la página
    verifyToken();

    // Obtener usuario desde localStorage
    const usuario = localStorage.getItem('userName') || localStorage.getItem('username');
    if (usuario) loadAlumnoInfo(usuario);



    // Cargar info del alumno desde el servicio
    async function loadAlumnoInfo(usuario) {
        try {
            const response = await fetch(`http://localhost:4001/api/alumnos/inicio-sesion?usuario=${usuario}`);
            const data = await response.json();

            if (data.success) {
                const alumno = data.data;
                console.log('✅ Datos del alumno:', alumno);
                document.getElementById('idNombre').textContent = alumno.nombre;
                document.getElementById('idUsuario').textContent = alumno.usuario;
                document.getElementById('idMatricula').textContent = alumno.matricula;
                document.getElementById('idCarrera').textContent = alumno.carrera;

                console.log('✅ Info del alumno cargada correctamente');
            } else {
                console.error('Error al cargar info del alumno:', data.message);
            }
        } catch (error) {
            console.error('Error al cargar info del alumno:', error);
        }
    }

    // Verificar validez del token
    async function verifyToken() {
        try {
            console.log('🔍 Verificando token...');
            const response = await fetch('http://localhost:3001/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Token inválido');

            const userData = await response.json();
            console.log('✅ Token válido para:', userData.username);

        } catch (error) {
            console.error('❌ Token inválido:', error);
            alert('Sesión expirada. Por favor inicia sesión nuevamente.');
            logout();
        }
    }

    // Botón de Cerrar Sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Función de logout
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        //localStorage.removeItem('username');
        window.location.replace('/login.html');
    }
});
