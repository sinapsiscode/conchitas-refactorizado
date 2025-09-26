import { create } from 'zustand'
// import { mockAPI } from '../services/mock/server' // DESACTIVADO - Migrado a JSON Server

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  
  // Fetch notifications for current user
  fetchNotifications: async (userId, filters = {}) => {
    set({ loading: true, error: null })
    try {
      // const response = await mockAPI.getNotifications(userId, filters) // TODO: Migrar a nuevo store con JSON Server
      const notifications = response.data || []
      
      // Calculate unread count
      const unreadCount = notifications.filter(n => n.status === 'unread').length
      
      set({ 
        notifications,
        unreadCount,
        loading: false 
      })
      
      return { success: true, data: notifications }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Get unread count only
  fetchUnreadCount: async (userId) => {
    try {
      // const response = await mockAPI.getUnreadCount(userId) // TODO: Migrar a nuevo store con JSON Server
      const count = response.data?.count || 0
      
      set({ unreadCount: count })
      return { success: true, count }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return { success: false, error: error.message }
    }
  },
  
  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      // const response = await mockAPI.markNotificationAsRead(notificationId) // TODO: Migrar a nuevo store con JSON Server
      const updatedNotification = response.data
      
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? updatedNotification : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
      
      return { success: true, data: updatedNotification }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (userId) => {
    set({ loading: true, error: null })
    try {
      // await mockAPI.markAllNotificationsAsRead(userId) // TODO: Migrar a nuevo store con JSON Server
      
      set(state => ({
        notifications: state.notifications.map(n => ({
          ...n,
          status: 'read',
          readAt: new Date().toISOString()
        })),
        unreadCount: 0,
        loading: false
      }))
      
      return { success: true }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      // await mockAPI.deleteNotification(notificationId) // TODO: Migrar a nuevo store con JSON Server
      
      set(state => {
        const deletedNotification = state.notifications.find(n => n.id === notificationId)
        const wasUnread = deletedNotification?.status === 'unread'
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        }
      })
      
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },
  
  // Create a new notification (for testing or manual creation)
  createNotification: async (notificationData) => {
    try {
      // const response = await mockAPI.createNotification(notificationData) // TODO: Migrar a nuevo store con JSON Server
      const newNotification = response.data
      
      set(state => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }))
      
      return { success: true, data: newNotification }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },
  
  // Get notifications by type
  getNotificationsByType: (type) => {
    return get().notifications.filter(n => n.type === type)
  },
  
  // Get notifications by priority
  getNotificationsByPriority: (priority) => {
    return get().notifications.filter(n => n.priority === priority)
  },
  
  // Get unread notifications
  getUnreadNotifications: () => {
    return get().notifications.filter(n => n.status === 'unread')
  },
  
  // Clear all notifications from state (not from DB)
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 })
  },
  
  // Set up polling for new notifications
  startPolling: (userId, intervalMs = 30000) => {
    const pollInterval = setInterval(async () => {
      const state = get()
      if (!state.loading) {
        await get().fetchUnreadCount(userId)
      }
    }, intervalMs)
    
    // Store interval ID for cleanup
    set({ pollInterval })
    
    return pollInterval
  },
  
  // Stop polling
  stopPolling: () => {
    const { pollInterval } = get()
    if (pollInterval) {
      clearInterval(pollInterval)
      set({ pollInterval: null })
    }
  },
  
  // Internal state
  pollInterval: null
}))