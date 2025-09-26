import { create } from 'zustand';
import { notificationsService } from '../services/api';

export const useNotificationStore = create((set, get) => ({
  // Estado
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Obtener notificaciones
  fetchNotifications: async (userId) => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationsService.getAll({ userId });
      const unreadCount = notifications.filter(n => !n.read).length;
      set({ notifications, unreadCount, loading: false });
      return { success: true, data: notifications };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));