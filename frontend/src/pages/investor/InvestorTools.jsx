import React from 'react'
import IntegratedAnalyzer from '../../components/investor/IntegratedAnalyzer'

const InvestorTools = () => {
  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Analizador de Proyectos de Maricultura
        </h1>
        <p className="text-gray-600 mt-1">
          Herramienta integral para análisis completo de cultivo de conchas de abanico
        </p>
      </div>

      <IntegratedAnalyzer />
    </div>
  )
}

export default InvestorTools