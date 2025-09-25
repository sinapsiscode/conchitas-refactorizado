import React, { useEffect, useState } from 'react'
import { useNotificationStore } from '../../stores/notificationStore'
import { useAuthStore } from '../../stores/authStore'
import { UI_TEXTS } from '../../constants/ui'
import LoadingSpinner from '../common/LoadingSpinner'

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useAuthStore()
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore()
  
  const [filter, setFilter] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications(user.id)
    }
  }, [isOpen, user?.id, fetchNotifications])
  
  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId)
  }
  
  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      await markAllAsRead(user.id)
    }
  }
  
  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId)
  }
  
  const getFilteredNotifications = () => {
    let filtered = [...notifications]
    
    if (filter !== 'all') {
      filtered = filtered.filter(n => n.status === filter)
    }
    
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === selectedPriority)
    }
    
    return filtered
  }
  
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-slate-100 text-slate-600 border-slate-200',
      medium: 'bg-info-100 text-info-700 border-info-200',
      high: 'bg-warning-100 text-warning-700 border-warning-200',
      urgent: 'bg-danger-100 text-danger-700 border-danger-200'
    }
    return colors[priority] || colors.medium
  }
  
  const getTypeIcon = (type) => {
    const icons = {
      distribution_received: '💰',
      harvest_completed: '🎣',
      harvest_upcoming: '📅',
      investment_accepted: '✅',
      mortality_alert: '⚠️',
      new_monitoring: '📊',
      lot_status_change: '🔄',
      payment_received: '💵',
      system: 'ℹ️'
    }
    return icons[type] || '📬'
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Justo ahora'
    if (diffMins < 60) return `Hace ${diffMins} minutos`
    if (diffHours < 24) return `Hace ${diffHours} horas`
    if (diffDays < 7) return `Hace ${diffDays} días`
    
    return date.toLocaleDateString('es-PE')
  }
  
  if (!isOpen) return null
  
  const filteredNotifications = getFilteredNotifications()
  
  if (!isOpen) return null

  return (
    <>
      {/* Invisible overlay to catch clicks outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />
      
      {/* Dropdown Panel - Responsive */}
      <div className="fixed inset-x-3 sm:absolute sm:inset-x-auto sm:right-0 top-20 sm:top-12 sm:mt-2 sm:w-96 max-h-[70vh] sm:max-h-[600px] bg-white rounded-lg shadow-2xl border border-slate-200 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 overflow-hidden">
            <div className="flex flex-col h-full max-h-[70vh] sm:max-h-[600px]">
              {/* Header */}
              <div className="border-b border-slate-200 px-3 sm:px-4 py-3 bg-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Notificaciones
                    </h3>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-primary-600 bg-primary-100 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Quick Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="all">Todas</option>
                    <option value="unread">No leídas</option>
                    <option value="read">Leídas</option>
                  </select>
                  
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
              </div>
              
              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {loading ? (
                  <div className="p-6 sm:p-8">
                    <LoadingSpinner size="md" message="Cargando notificaciones..." />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-3 opacity-40">📭</div>
                    <p className="text-slate-500 text-sm font-medium">No hay notificaciones</p>
                    <p className="text-slate-400 text-xs mt-1">Las nuevas aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-3 sm:px-4 py-3 transition-all duration-200 hover:bg-slate-50 ${
                          notification.status === 'unread' 
                            ? 'bg-primary-50/30 border-l-4 border-primary-500' 
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 text-xl mt-0.5">
                            {getTypeIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 line-clamp-1">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                  {notification.message}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  {notification.priority === 'urgent' && (
                                    <span className="inline-flex px-1.5 py-0.5 text-xs font-medium text-danger-700 bg-danger-100 rounded">
                                      Urgente
                                    </span>
                                  )}
                                  {notification.priority === 'high' && (
                                    <span className="inline-flex px-1.5 py-0.5 text-xs font-medium text-warning-700 bg-warning-100 rounded">
                                      Alta
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {formatDate(notification.createdAt)}
                                  </span>
                                </div>
                              </div>
                            
                              <div className="flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  {notification.status === 'unread' && (
                                    <button
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-100 rounded transition-all duration-200"
                                      title="Marcar como leída"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(notification.id)}
                                    className="p-1 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-all duration-200"
                                    title="Eliminar"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {notification.actionUrl && (
                              <button
                                className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                                onClick={() => {
                                  // Handle navigation to action URL
                                  console.log('Navigate to:', notification.actionUrl)
                                }}
                              >
                                {notification.actionText || 'Ver más'} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
    </>
  )
}

export default NotificationCenter