import React, { useEffect } from 'react'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  size = 'md',
  children,
  showCloseButton = true,
  footer,
  className = ""
}) => {
  // Cerrar con Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm sm:max-w-md',
    md: 'max-w-md sm:max-w-lg lg:max-w-2xl',
    lg: 'max-w-lg sm:max-w-2xl lg:max-w-4xl',
    xl: 'max-w-xl sm:max-w-3xl lg:max-w-5xl',
    full: 'max-w-full mx-4'
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-2xl
          w-full ${sizeClasses[size]}
          max-h-[95vh] overflow-hidden flex flex-col
          transform transition-all duration-300 ease-out
          animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5 z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && (
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-slate-600 sm:text-base">
                    {subtitle}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                  aria-label="Cerrar modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 bg-white border-t border-slate-100 p-4 sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para el contenido del modal con padding estándar
Modal.Content = ({ children, className = "" }) => (
  <div className={`p-4 sm:p-6 ${className}`}>
    {children}
  </div>
)

// Componente para las acciones del footer
Modal.Actions = ({ children, align = 'right', className = "" }) => (
  <div className={`flex gap-4 px-2 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'} ${className}`}>
    {children}
  </div>
)

export default Modal