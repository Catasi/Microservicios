document.addEventListener('DOMContentLoaded', () => {
            
    const token = localStorage.getItem('token');
    console.log('Token en localStorage:', token);
    
    if (!token) {
        alert('No hay token. Redirigiendo al login...');
        window.location.replace('/login.html');
    }

    // Verificar token al cargar la página
    verifyToken();

    const usuario = localStorage.getItem('userName') || localStorage.getItem('username');
    loadUserInfo(usuario);

    async function loadUserInfo(usuario) {
        try {
            const response = await fetch(`http://localhost:4005/api/SE/inicio-sesion?usuario=${usuario}`);
            const data = await response.json();
        
            if (data.success) {
                const userData = data.servicios_escolares;
            
                console.log('✅ Datos del usuario:', userData);
                document.getElementById('usuario').textContent = userData.nombre;
                document.getElementById('puesto').textContent = userData.puesto;
                console.log('✅ Info del usuario cargada correctamente');
                    console.log('Info del usuario cargada:', data);
            } else {
                console.error('Error:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error al cargar info del usuario:', error);
        }
    }


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

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            const userData = await response.json();
            console.log('✅ Token válido para:', userData.username);
            
        } catch (error) {
            console.error('❌ Token inválido:', error);
            alert('Sesión expirada. Por favor inicia sesión again.');
            logout();
        }
    }
});

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.replace('/login.html');
    }

    // Debug: Mostrar info del token
    // if (token) {
    //     try {
    //         const payload = JSON.parse(atob(token.split('.')[1]));
    //         console.log('🔐 Token info:', {
    //             username: payload.username,
    //             role: payload.role,
    //             exp: new Date(payload.exp * 1000)
    //         });
    //     } catch (e) {
    //         console.log('❌ No se pudo decodificar el token');
    //     }
    // }
