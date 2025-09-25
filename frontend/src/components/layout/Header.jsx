import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { UI_TEXTS } from '../../constants/ui'
import NotificationBell from '../notifications/NotificationBell'

const Header = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-slate-200/60 backdrop-blur-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Menu Button - show on all screen sizes now */}
            <button
              onClick={onToggleMobileMenu}
              className="p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200"
              aria-label="Abrir menú de navegación"
            >
              {isMobileMenuOpen ? (
                // X icon when menu is open
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon when menu is closed
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <div className="flex-shrink-0">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-xl sm:text-2xl">🐚</span>
                <h1 className="text-base font-bold text-slate-900 hidden sm:block sm:text-lg md:text-xl tracking-tight">
                  {UI_TEXTS.app.title}
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user && (
              <>
                {/* Notification Bell - Only show for investors and maricultors */}
                {(user.role === 'investor' || user.role === 'maricultor') && (
                  <NotificationBell />
                )}
                
                <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 text-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:space-x-2 sm:text-sm"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center sm:w-9 sm:h-9 shadow-sm">
                      <span className="text-white text-xs font-semibold sm:text-sm">
                        {user.firstName?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden md:block text-xs font-medium text-slate-700 sm:text-sm">
                      {user.firstName} {user.lastName}
                    </span>
                    <svg
                      className="w-3 h-3 text-slate-400 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20 sm:w-52">
                      <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 sm:px-5">
                        {user.email}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors duration-150 sm:px-5 sm:text-sm"
                      >
                        {UI_TEXTS.nav.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header