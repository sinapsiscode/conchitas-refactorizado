import React from 'react'

const EmptyState = ({ 
  title = "No hay datos disponibles", 
  message = "No se encontraron elementos para mostrar",
  icon = "📊",
  action = null,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-4 text-center sm:p-6 lg:p-8 ${className}`}>
      <div className="text-3xl mb-3 sm:text-4xl sm:mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900 mb-2 sm:text-lg">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 max-w-sm sm:text-base sm:mb-6 sm:max-w-md">{message}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}

export default EmptyState