import axios from "axios";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

    const token = authHeader.split(' ')[1];

    const resp = await axios.post('http://localhost:3001/api/auth/verify', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Guardar info completa del usuario
    req.user = {
      username: resp.data.username,
      role: resp.data.role,
      id: resp.data.id || null // opcional si auth_service lo devuelve
    };

    next();
  } catch (err) {
    console.error('Token inválido según auth_service', err.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
}