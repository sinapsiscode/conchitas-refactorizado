import React from 'react'
import { UI_TEXTS } from '../../constants/ui'

const ProjectionResults = ({ results }) => {
  if (!results) return null
  
  const { baseResults, riskAdjustedResults, summary } = results
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(value || 0)
  }
  
  const getRecommendationColor = (recommendation) => {
    const colors = {
      [UI_TEXTS.projections.recommendations.highlyRecommended]: 'text-green-600 bg-green-100',
      [UI_TEXTS.projections.recommendations.recommended]: 'text-blue-600 bg-blue-100',
      [UI_TEXTS.projections.recommendations.acceptable]: 'text-yellow-600 bg-yellow-100',
      [UI_TEXTS.projections.recommendations.marginal]: 'text-orange-600 bg-orange-100',
      [UI_TEXTS.projections.recommendations.notRecommended]: 'text-red-600 bg-red-100'
    }
    return colors[recommendation] || 'text-gray-600 bg-gray-100'
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {UI_TEXTS.projections.results.executiveSummary}
        </h3>
        
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${getRecommendationColor(summary.recommendation)}`}>
            <div className="text-2xl font-bold mb-1">
              {summary.recommendation}
            </div>
            <div className="text-sm opacity-90">
              {UI_TEXTS.projections.results.riskLevel}: {summary.riskLevel} | {UI_TEXTS.projections.results.profitability}: {summary.profitability}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">{UI_TEXTS.projections.results.expectedROI}</div>
              <div className="text-xl font-semibold text-gray-900">
                {summary.keyMetrics.expectedROI.toFixed(2)}%
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">{UI_TEXTS.projections.results.paybackPeriod}</div>
              <div className="text-xl font-semibold text-gray-900">
                {summary.keyMetrics.paybackMonths} meses
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">{UI_TEXTS.projections.results.netProfit}</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatCurrency(summary.keyMetrics.netProfit)}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">{UI_TEXTS.projections.results.confidence}</div>
              <div className="text-xl font-semibold text-gray-900">
                {summary.keyMetrics.confidenceLevel}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Financial Results */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {UI_TEXTS.projections.results.financialResults}
        </h3>
        
        <div className="space-y-6">
          {/* Base Scenario */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {UI_TEXTS.projections.results.baseScenario}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">{UI_TEXTS.projections.results.totalRevenue}</span>
                <span className="font-medium">{formatCurrency(baseResults.totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">{UI_TEXTS.projections.results.totalCosts}</span>
                <span className="font-medium">{formatCurrency(baseResults.totalCosts)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Ganancia Neta</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(baseResults.netProfit)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">ROI</span>
                <span className="font-semibold text-blue-600">
                  {baseResults.roi.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Risk Adjusted */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {UI_TEXTS.projections.results.riskAdjusted}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Ingresos Ajustados</span>
                <span className="font-medium">{formatCurrency(riskAdjustedResults.totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Ganancia Neta Ajustada</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(riskAdjustedResults.netProfit)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">ROI Ajustado</span>
                <span className="font-semibold text-blue-600">
                  {riskAdjustedResults.roi.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Ajuste por Riesgo</span>
                <span className="text-red-600">
                  -{riskAdjustedResults.riskAdjustment.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scenario Analysis */}
      {results.scenarioResults && results.scenarioResults.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {UI_TEXTS.projections.results.scenarioAnalysis}
          </h3>
          
          <div className="space-y-3">
            {results.scenarioResults.map((scenario, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                    <div className="text-sm text-gray-600">
                      {UI_TEXTS.projections.scenarios.probability}: {scenario.probability}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      {scenario.results.roi.toFixed(2)}% ROI
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(scenario.results.netProfit)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {results.weightedResults && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">
                  {UI_TEXTS.projections.results.weightedAverage}
                </span>
                <div className="text-right">
                  <span className="text-lg font-semibold text-blue-600">
                    {results.weightedResults.roi.toFixed(2)}% ROI
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Monte Carlo Results */}
      {results.monteCarloResults && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {UI_TEXTS.projections.results.monteCarloAnalysis}
          </h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">{UI_TEXTS.projections.results.averageROI}</div>
                <div className="text-xl font-semibold text-gray-900">
                  {results.monteCarloResults.mean.toFixed(2)}%
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">{UI_TEXTS.projections.results.standardDeviation}</div>
                <div className="text-xl font-semibold text-gray-900">
                  ±{results.monteCarloResults.stdDev.toFixed(2)}%
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">{UI_TEXTS.projections.results.probabilityOfProfit}</span>
                <span className="font-medium text-green-600">
                  {results.monteCarloResults.probabilityPositive.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Probabilidad ROI {'>'} 10%</span>
                <span className="font-medium">
                  {results.monteCarloResults.probabilityAbove10.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Probabilidad ROI {'>'} 20%</span>
                <span className="font-medium">
                  {results.monteCarloResults.probabilityAbove20.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-900 mb-1">
                {UI_TEXTS.projections.results.confidenceInterval} (90%)
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {results.monteCarloResults.percentile5.toFixed(1)}% - {results.monteCarloResults.percentile95.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectionResults