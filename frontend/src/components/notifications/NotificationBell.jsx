import React, { useEffect, useState } from 'react'
import { useNotificationStore } from '../../stores'
import { useAuthStore } from '../../stores'
import NotificationCenter from './NotificationCenter'

const NotificationBell = () => {
  const { user } = useAuthStore()
  const { unreadCount, fetchUnreadCount, startPolling, stopPolling } = useNotificationStore()
  const [showNotifications, setShowNotifications] = useState(false)
  
  useEffect(() => {
    if (user?.id) {
      // Fetch initial count
      fetchUnreadCount(user.id)
      
      // Start polling for new notifications every 30 seconds
      const intervalId = startPolling(user.id, 30000)
      
      // Cleanup on unmount
      return () => {
        stopPolling()
      }
    }
  }, [user?.id])
  
  const handleClick = () => {
    setShowNotifications(!showNotifications)
  }
  
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-all duration-200"
        title="Notificaciones"
      >
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-danger-600 rounded-full shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  )
}

export default NotificationBell