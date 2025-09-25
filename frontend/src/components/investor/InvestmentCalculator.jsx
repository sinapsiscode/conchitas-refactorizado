import React, { useState } from 'react'

const InvestmentCalculator = () => {
  const [investmentAmount, setInvestmentAmount] = useState(10000)
  const [expectedROI, setExpectedROI] = useState(25)
  const [investmentPeriod, setInvestmentPeriod] = useState(6)
  const [riskLevel, setRiskLevel] = useState('moderate')
  const [showResults, setShowResults] = useState(false)

  const scenarios = {
    pessimistic: {
      roi: -0.5,
      probability: 15,
      description: 'Pérdidas por mortalidad o problemas ambientales'
    },
    conservative: {
      roi: 0.6,
      probability: 25,
      description: 'Retorno por debajo del promedio'
    },
    moderate: {
      roi: 1.0,
      probability: 40,
      description: 'Retorno promedio del mercado'
    },
    optimistic: {
      roi: 1.4,
      probability: 20,
      description: 'Retorno por encima del promedio'
    }
  }

  const riskFactors = {
    low: { adjustment: 0.7, description: 'Maricultores experimentados, zonas seguras' },
    moderate: { adjustment: 1.0, description: 'Condiciones estándar del mercado' },
    high: { adjustment: 1.3, description: 'Nuevos maricultores o zonas con riesgos' }
  }

  const calculateScenarios = () => {
    const baseROI = expectedROI / 100
    const riskAdjustment = riskFactors[riskLevel].adjustment
    
    return Object.entries(scenarios).map(([key, scenario]) => {
      const adjustedROI = baseROI * scenario.roi * riskAdjustment
      const finalAmount = investmentAmount * (1 + adjustedROI)
      const profit = finalAmount - investmentAmount
      const monthlyReturn = profit / investmentPeriod
      
      return {
        name: key,
        ...scenario,
        finalAmount,
        profit,
        monthlyReturn,
        adjustedROI: adjustedROI * 100
      }
    })
  }

  const calculateExpectedValue = () => {
    const results = calculateScenarios()
    const expectedValue = results.reduce((sum, scenario) => {
      return sum + (scenario.finalAmount * scenario.probability / 100)
    }, 0)
    
    const expectedProfit = expectedValue - investmentAmount
    const expectedROI = (expectedProfit / investmentAmount) * 100
    
    return {
      expectedValue,
      expectedProfit,
      expectedROI,
      breakEvenProbability: results
        .filter(s => s.profit >= 0)
        .reduce((sum, s) => sum + s.probability, 0)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const handleCalculate = () => {
    setShowResults(true)
  }

  const scenarioResults = showResults ? calculateScenarios() : []
  const expectedResults = showResults ? calculateExpectedValue() : null

  const getScenarioColor = (scenario) => {
    const colors = {
      pessimistic: 'red',
      conservative: 'yellow',
      moderate: 'blue',
      optimistic: 'green'
    }
    return colors[scenario] || 'gray'
  }

  const getScenarioLabel = (scenario) => {
    const labels = {
      pessimistic: 'Pesimista',
      conservative: 'Conservador',
      moderate: 'Moderado',
      optimistic: 'Optimista'
    }
    return labels[scenario] || scenario
  }

  return (
    <div className="card p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Calculadora de Inversión
        </h2>
        <p className="text-sm text-gray-600">
          Simula diferentes escenarios para evaluar tu inversión potencial
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Monto a Invertir (S/)
            </label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1000"
              step="1000"
            />
            <span className="text-xs text-gray-500 mt-1">
              Inversión mínima recomendada: S/ 5,000
            </span>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              ROI Esperado (%)
            </label>
            <input
              type="number"
              value={expectedROI}
              onChange={(e) => setExpectedROI(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              step="5"
            />
            <span className="text-xs text-gray-500 mt-1">
              Promedio histórico: 20-30%
            </span>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Período de Inversión (meses)
            </label>
            <select
              value={investmentPeriod}
              onChange={(e) => setInvestmentPeriod(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="9">9 meses</option>
              <option value="12">12 meses</option>
            </select>
            <span className="text-xs text-gray-500 mt-1">
              Ciclo típico: 6-9 meses
            </span>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Nivel de Riesgo
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Bajo</option>
              <option value="moderate">Moderado</option>
              <option value="high">Alto</option>
            </select>
            <span className="text-xs text-gray-500 mt-1">
              {riskFactors[riskLevel].description}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        Calcular Escenarios
      </button>

      {showResults && (
        <>
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Análisis de Escenarios
            </h3>
            
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 mb-6">
              {scenarioResults.map((scenario) => {
                const color = getScenarioColor(scenario.name)
                return (
                  <div
                    key={scenario.name}
                    className={`p-4 rounded-lg border-2 border-${color}-200 bg-${color}-50`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-semibold text-${color}-800`}>
                        {getScenarioLabel(scenario.name)}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded bg-${color}-100 text-${color}-700`}>
                        {scenario.probability}% probabilidad
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {scenario.description}
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Retorno:</span>
                        <span className={`font-medium text-${color}-700`}>
                          {formatCurrency(scenario.finalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ganancia:</span>
                        <span className={`font-medium ${scenario.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenario.profit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">ROI:</span>
                        <span className={`font-medium ${scenario.adjustedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {scenario.adjustedROI.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">
                Valor Esperado (Ponderado)
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Retorno Esperado</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(expectedResults.expectedValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ganancia Esperada</p>
                  <p className={`text-lg font-bold ${expectedResults.expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(expectedResults.expectedProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">ROI Esperado</p>
                  <p className={`text-lg font-bold ${expectedResults.expectedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {expectedResults.expectedROI.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Prob. de Ganancia</p>
                  <p className="text-lg font-bold text-blue-600">
                    {expectedResults.breakEvenProbability}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-amber-600 mr-2">⚠️</span>
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Aviso Importante</p>
                  <p className="text-amber-700">
                    Esta calculadora proporciona estimaciones basadas en datos históricos y probabilidades.
                    Los resultados reales pueden variar debido a factores ambientales, de mercado y operacionales.
                    Siempre consulte con un asesor financiero antes de tomar decisiones de inversión.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Factores de Riesgo a Considerar
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Riesgos Ambientales</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cambios de temperatura del agua</li>
                  <li>• Fenómenos climáticos (El Niño/La Niña)</li>
                  <li>• Contaminación marina</li>
                  <li>• Enfermedades y parásitos</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Riesgos de Mercado</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Fluctuación de precios</li>
                  <li>• Demanda del mercado</li>
                  <li>• Competencia internacional</li>
                  <li>• Regulaciones gubernamentales</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default InvestmentCalculator