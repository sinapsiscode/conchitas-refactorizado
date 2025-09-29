import apiClient from './config';

/**
 * Servicio de autenticación
 * Maneja todas las operaciones relacionadas con autenticación
 */
const authService = {
  /**
   * Iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise} Datos del usuario y token
   */
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      // El servidor retorna {success: true, data: {user, token}}
      // Necesitamos extraer user y token de la respuesta
      if (response.success && response.data) {
        return response.data; // Retornar {user, token}
      }

      // Si el formato es diferente, intentar con la respuesta directa
      return response;
    } catch (error) {
      // Manejar errores específicos del servidor
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  /**
   * Registrar nuevo usuario
   * @param {Object} userData - Datos del nuevo usuario
   * @returns {Promise} Usuario creado
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);

      // El servidor Express ya devuelve el usuario sin password
      return response;
    } catch (error) {
      // Manejar errores específicos del servidor
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  /**
   * Obtener usuario actual
   * @param {string} userId - ID del usuario
   * @returns {Promise} Datos del usuario
   */
  async getCurrentUser(userId) {
    try {
      const user = await apiClient.get(`/users/${userId}`);
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar usuario
   * @param {string} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise} Usuario actualizado
   */
  async updateUser(userId, userData) {
    try {
      const updatedData = {
        ...userData,
        updatedAt: new Date().toISOString(),
      };

      // Si se está actualizando el password, no devolver el campo
      const user = await apiClient.patch(`/users/${userId}`, updatedData);
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener todos los usuarios
   * @returns {Promise} Lista de usuarios
   */
  async getAllUsers() {
    try {
      const users = await apiClient.get('/users');
      return users;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cerrar sesión
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export default authService;