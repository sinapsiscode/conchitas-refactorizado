import { create } from 'zustand';
import { authService } from '../services/api';

/**
 * Store de autenticación usando API real con json-server
 * Reemplaza el authStore original que usaba MockAPI
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  /**
   * Inicializar autenticación desde localStorage
   */
  initializeAuth: () => {
    // Limpiar datos viejos de MockAPI primero
    const oldKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('conchas-abanico:')
    );
    oldKeys.forEach(key => localStorage.removeItem(key));

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);

        // Verificar que el token no sea el viejo formato de MockAPI
        if (token.includes('conchas') || !parsedUser.id) {
          // Token viejo, limpiar
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return;
        }

        set({
          user: parsedUser,
          token,
          isAuthenticated: true,
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      }
    }
  },

  /**
   * Iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   */
  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const response = await authService.login(email, password);
      const { user, token } = response;

      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return { success: true, user };
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Error al iniciar sesión',
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Registrar nuevo usuario
   * @param {Object} userData - Datos del nuevo usuario
   */
  register: async (userData) => {
    set({ loading: true, error: null });

    try {
      const user = await authService.register(userData);

      set({
        loading: false,
        error: null,
      });

      return { success: true, user };
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Error al registrar usuario',
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualizar datos del usuario
   * @param {Object} userData - Datos a actualizar
   */
  updateUser: async (userData) => {
    const { user } = get();
    if (!user) return { success: false, error: 'No hay usuario autenticado' };

    set({ loading: true, error: null });

    try {
      const updatedUser = await authService.updateUser(user.id, userData);

      // Actualizar en localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      set({
        user: updatedUser,
        loading: false,
        error: null,
      });

      return { success: true, user: updatedUser };
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Error al actualizar usuario',
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Cerrar sesión
   */
  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /**
   * Limpiar errores
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Refrescar datos del usuario actual
   */
  refreshUser: async () => {
    const { user } = get();
    if (!user) return;

    set({ loading: true });

    try {
      const updatedUser = await authService.getCurrentUser(user.id);

      // Actualizar en localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      set({
        user: updatedUser,
        loading: false,
      });

      return { success: true, user: updatedUser };
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Error al refrescar usuario',
      });
      return { success: false, error: error.message };
    }
  },
}));