import React from 'react'

const LoadingSpinner = ({ size = 'md', message = 'Cargando...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]}`}></div>
      {message && <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">{message}</p>}
    </div>
  )
}

export default LoadingSpinner