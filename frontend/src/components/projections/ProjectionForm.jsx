import React, { useState, useEffect } from 'react'
import { useProjectionStore } from '../../stores/projectionStore'
import { UI_TEXTS } from '../../constants/ui'

const ProjectionForm = ({ projection, onSubmit, onCalculate, isEdit = false }) => {
  const { parameters } = useProjectionStore()
  const defaults = parameters.marketDefaults.piuraSechura
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'investment',
    baseInvestment: 50000,
    projectionMonths: 24,
    marketVariables: {
      pricePerUnit: defaults.avgPricePerUnit,
      mortalityRate: defaults.avgMortalityRate,
      growthRate: 100,
      harvestCycles: 3,
      cycleMonths: 8
    },
    costStructure: {
      seedCostPerUnit: 0.05,
      maintenanceCostMonthly: 500,
      harvestCostPerUnit: 0.15,
      fixedCostsMonthly: 300
    },
    riskFactors: {
      climaticRisk: 10,
      marketRisk: 15,
      operationalRisk: 5,
      financialRisk: 5
    }
  })
  
  useEffect(() => {
    if (projection) {
      setFormData({
        name: projection.name || '',
        description: projection.description || '',
        type: projection.type || 'investment',
        baseInvestment: projection.baseInvestment || 50000,
        projectionMonths: projection.projectionMonths || 24,
        marketVariables: projection.marketVariables || formData.marketVariables,
        costStructure: projection.costStructure || formData.costStructure,
        riskFactors: projection.riskFactors || formData.riskFactors
      })
    }
  }, [projection])
  
  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: parseFloat(value) || value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: field === 'baseInvestment' || field === 'projectionMonths' 
          ? parseFloat(value) || 0 
          : value
      }))
    }
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  const calculateTotalRisk = () => {
    return Object.values(formData.riskFactors).reduce((sum, risk) => sum + risk, 0)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {UI_TEXTS.projections.form.basicInfo}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {UI_TEXTS.projections.form.name}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange(null, 'name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={UI_TEXTS.projections.placeholders.projectionName}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {UI_TEXTS.projections.form.description}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange(null, 'description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={UI_TEXTS.projections.placeholders.projectionDescription}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {UI_TEXTS.projections.form.initialInvestment}
              </label>
              <input
                type="number"
                value={formData.baseInvestment}
                onChange={(e) => handleChange(null, 'baseInvestment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1000"
                step="1000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {UI_TEXTS.projections.form.period}
              </label>
              <input
                type="number"
                value={formData.projectionMonths}
                onChange={(e) => handleChange(null, 'projectionMonths', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="6"
                max="60"
                required
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Market Variables */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Variables de Mercado
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por Unidad (S/)
            </label>
            <input
              type="number"
              value={formData.marketVariables.pricePerUnit}
              onChange={(e) => handleChange('marketVariables', 'pricePerUnit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.1"
              required
            />
            <span className="text-xs text-gray-500">
              Promedio: S/ {defaults.avgPricePerUnit}
            </span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasa de Mortalidad (%)
            </label>
            <input
              type="number"
              value={formData.marketVariables.mortalityRate}
              onChange={(e) => handleChange('marketVariables', 'mortalityRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              required
            />
            <span className="text-xs text-gray-500">
              Promedio: {defaults.avgMortalityRate}%
            </span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciclos de Cosecha
            </label>
            <input
              type="number"
              value={formData.marketVariables.harvestCycles}
              onChange={(e) => handleChange('marketVariables', 'harvestCycles', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meses por Ciclo
            </label>
            <input
              type="number"
              value={formData.marketVariables.cycleMonths}
              onChange={(e) => handleChange('marketVariables', 'cycleMonths', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="6"
              max="12"
              required
            />
          </div>
        </div>
      </div>
      
      {/* Cost Structure */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Estructura de Costos
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo de Semilla (S/ por unidad)
            </label>
            <input
              type="number"
              value={formData.costStructure.seedCostPerUnit}
              onChange={(e) => handleChange('costStructure', 'seedCostPerUnit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mantenimiento Mensual (S/)
            </label>
            <input
              type="number"
              value={formData.costStructure.maintenanceCostMonthly}
              onChange={(e) => handleChange('costStructure', 'maintenanceCostMonthly', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo de Cosecha (S/ por unidad)
            </label>
            <input
              type="number"
              value={formData.costStructure.harvestCostPerUnit}
              onChange={(e) => handleChange('costStructure', 'harvestCostPerUnit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costos Fijos Mensuales (S/)
            </label>
            <input
              type="number"
              value={formData.costStructure.fixedCostsMonthly}
              onChange={(e) => handleChange('costStructure', 'fixedCostsMonthly', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="50"
              required
            />
          </div>
        </div>
      </div>
      
      {/* Risk Factors */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Factores de Riesgo
        </h3>
        
        <div className="space-y-4">
          {Object.entries(formData.riskFactors).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">
                  {key === 'climaticRisk' && UI_TEXTS.projections.form.climaticRisk}
                  {key === 'marketRisk' && UI_TEXTS.projections.form.marketRisk}
                  {key === 'operationalRisk' && UI_TEXTS.projections.form.operationalRisk}
                  {key === 'financialRisk' && UI_TEXTS.projections.form.financialRisk}
                </label>
                <span className="text-sm font-medium text-gray-900">{value}%</span>
              </div>
              <input
                type="range"
                value={value}
                onChange={(e) => handleChange('riskFactors', key, e.target.value)}
                className="w-full"
                min="0"
                max="30"
              />
            </div>
          ))}
          
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Riesgo Total</span>
              <span className={`text-lg font-semibold ${
                calculateTotalRisk() <= 20 ? 'text-green-600' :
                calculateTotalRisk() <= 40 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {calculateTotalRisk()}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isEdit ? UI_TEXTS.projections.messages.updateProjection : UI_TEXTS.projections.messages.saveProjection}
        </button>
        
        <button
          type="button"
          onClick={onCalculate}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {UI_TEXTS.projections.actions.calculate}
        </button>
      </div>
    </form>
  )
}

export default ProjectionForm