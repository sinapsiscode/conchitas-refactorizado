import { create } from 'zustand';
import { notificationsService } from '../services/api';

export const useNotificationStore = create((set, get) => ({
  // Estado
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pollingIntervalId: null,

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

  // Obtener solo el conteo de no leídas
  fetchUnreadCount: async (userId) => {
    try {
      const notifications = await notificationsService.getAll({
        userId,
        read: false
      });
      const unreadCount = notifications.length;
      set({ unreadCount });
      return { success: true, count: unreadCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Marcar notificación como leída
  markAsRead: async (notificationId) => {
    try {
      await notificationsService.update(notificationId, { read: true });
      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Marcar todas como leídas
  markAllAsRead: async (userId) => {
    try {
      const unreadNotifications = get().notifications.filter(n => !n.read);

      // Actualizar todas las notificaciones no leídas
      await Promise.all(
        unreadNotifications.map(n =>
          notificationsService.update(n.id, { read: true })
        )
      );

      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Crear nueva notificación
  createNotification: async (notificationData) => {
    try {
      const newNotification = await notificationsService.create({
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString()
      });

      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }));

      return { success: true, data: newNotification };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Eliminar notificación
  deleteNotification: async (notificationId) => {
    try {
      const notification = get().notifications.find(n => n.id === notificationId);
      await notificationsService.delete(notificationId);

      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== notificationId),
        unreadCount: notification && !notification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Iniciar polling para nuevas notificaciones
  startPolling: (userId, interval = 30000) => {
    // Detener polling existente si hay uno
    const existingInterval = get().pollingIntervalId;
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Fetch inmediato
    get().fetchUnreadCount(userId);

    // Configurar nuevo intervalo
    const intervalId = setInterval(() => {
      get().fetchUnreadCount(userId);
    }, interval);

    set({ pollingIntervalId: intervalId });
    return intervalId;
  },

  // Detener polling
  stopPolling: () => {
    const intervalId = get().pollingIntervalId;
    if (intervalId) {
      clearInterval(intervalId);
      set({ pollingIntervalId: null });
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));