import React from 'react'

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary',
  loading = false,
  error = null,
  className = ""
}) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-700 ring-1 ring-primary-200',
    secondary: 'bg-success-100 text-success-700 ring-1 ring-success-200',
    red: 'bg-danger-100 text-danger-700 ring-1 ring-danger-200',
    yellow: 'bg-warning-100 text-warning-700 ring-1 ring-warning-200',
    green: 'bg-success-100 text-success-700 ring-1 ring-success-200',
    blue: 'bg-info-100 text-info-700 ring-1 ring-info-200'
  }
  
  if (loading) {
    return (
      <div className={`stat-card ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="h-4 bg-slate-200 rounded w-1/2 sm:h-5"></div>
            <div className="h-6 w-6 bg-slate-200 rounded-lg sm:h-7 sm:w-7"></div>
          </div>
          <div className="h-7 bg-slate-200 rounded w-3/4 mb-2 sm:h-9"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={`stat-card border-danger-200 bg-danger-50 ${className}`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-sm font-medium text-slate-600 sm:text-base">{title}</h3>
          <span className="text-danger-500 text-lg sm:text-xl">⚠️</span>
        </div>
        <p className="text-sm text-danger-600 sm:text-base font-medium">{error}</p>
      </div>
    )
  }
  
  return (
    <div className={`stat-card hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${className}`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="text-sm font-medium text-slate-600 sm:text-base">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-xl sm:p-2.5 ${colorClasses[color]}`}>
            <span className="text-lg sm:text-xl">{icon}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1 sm:text-3xl tracking-tight">{value}</div>
      {subtitle && <p className="text-sm text-slate-600 sm:text-base">{subtitle}</p>}
    </div>
  )
}

export default StatCard