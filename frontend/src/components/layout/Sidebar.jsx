import React from 'react'
import { useAuthStore } from '../../stores/authStore'
import { UI_TEXTS } from '../../constants/ui'

const Sidebar = ({ currentPage, onPageChange, isMobileOpen, setIsMobileOpen }) => {
  const { user } = useAuthStore()
  
  // Define icon components
  const icons = {
    dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    sectors: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    seeding: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    monitoring: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    harvest: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    income: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    projected: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    expenses: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    inventory: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
    reports: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v7m12 0a2 2 0 01-2 2H8a2 2 0 01-2-2m12 0l-4-4-4 4" /></svg>,
    investments: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    tools: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    briefcase: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  }

  // Define menu items based on user role
  const getMenuItems = () => {
    if (user?.role === 'investor') {
      return [
        { id: 'investor-dashboard', label: 'Panel Principal', icon: icons.dashboard },
        { id: 'investor-investments', label: 'Mis Inversiones', icon: icons.briefcase },
        { id: 'investor-seedings', label: 'Mis Siembras', icon: icons.seeding },
        { id: 'investor-tools', label: 'Herramientas', icon: icons.tools },
        { id: 'investor-returns', label: 'Retornos', icon: icons.income },
        { id: 'investor-reports', label: 'Reportes', icon: icons.reports }
      ]
    } else if (user?.role === 'maricultor') {
      return [
        { id: 'dashboard', label: UI_TEXTS.nav.dashboard, icon: icons.dashboard },
        { id: 'settings', label: 'Configuración', icon: icons.settings },
        { id: 'sectors', label: 'Sectores', icon: icons.sectors },
        { id: 'seeding', label: 'Siembras', icon: icons.seeding },
        { id: 'monitoring', label: UI_TEXTS.nav.monitoring, icon: icons.monitoring },
        { id: 'harvest', label: UI_TEXTS.nav.harvest, icon: icons.harvest },
        { id: 'income', label: 'Ingreso', icon: icons.income },
        { id: 'projected', label: 'Proyectados', icon: icons.projected },
        { id: 'expenses', label: 'Flujo de caja', icon: icons.expenses },
        { id: 'inventory', label: UI_TEXTS.nav.inventory, icon: icons.inventory },
        { id: 'reports', label: UI_TEXTS.nav.reports, icon: icons.reports },
        { id: 'investments', label: 'Inversores', icon: icons.investments }
      ]
    } else {
      // Default case (no other roles exist)
      return []
    }
  }
  
  const menuItems = getMenuItems()
  
  return (
    <>
      {/* Estilos para scrollbar personalizada */}
      <style>
        {`
          .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div className={`
        fixed top-16 left-0
        bg-white border-r border-slate-200
        transition-all duration-300
        h-[calc(100vh-4rem)]
        z-40 shadow-2xl
        flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        w-72 sm:w-80
      `}>
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-lg font-semibold text-slate-800">Navegación</span>
          </div>
        </div>

        <nav
          className="flex-1 overflow-y-auto p-3 min-h-0 sidebar-scroll"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}
        >
          <ul className="space-y-1 pb-4">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onPageChange(item.id)
                    setIsMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-200 group ${
                    currentPage === item.id
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="mr-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </div>
                  <span className="text-base font-medium">{item.label}</span>
                  {currentPage === item.id && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Footer del sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex-shrink-0">
          <div className="text-xs text-slate-500 text-center">
            {user?.role === 'investor' ? 'Panel Inversor' : 'Panel Maricultor'}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar