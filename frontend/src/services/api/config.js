import axios from 'axios';

// Configuración base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4077';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      switch (error.response.status) {
        case 401:
          // Token expirado o inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
          break;
        case 403:
          console.error('Acceso denegado');
          break;
        case 404:
          console.error('Recurso no encontrado');
          break;
        case 500:
          console.error('Error del servidor');
          break;
        default:
          console.error('Error en la respuesta:', error.response.data);
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor');
    } else {
      // Algo sucedió al configurar la petición
      console.error('Error al configurar la petición:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;