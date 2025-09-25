import React, { useState } from 'react'

const DensityEstimator = () => {
  const [densityData, setDensityData] = useState({
    sectorLength: 100,
    sectorWidth: 50,
    waterDepth: 12,
    numberOfLines: 20,
    shellsPerMeter: 8,
    lineSpacing: 2.5,
    currentAge: 3,
    targetSize: 55,
    cultivationSystem: 'suspended'
  })

  const [optimization, setOptimization] = useState(null)

  const cultivationSystems = {
    suspended: {
      name: 'Sistema Suspendido',
      maxDensity: 15,
      optimalDensity: 10,
      minSpacing: 2.0
    },
    bottom: {
      name: 'Cultivo de Fondo',
      maxDensity: 8,
      optimalDensity: 6,
      minSpacing: 3.0
    }
  }

  const calculateDensity = () => {
    const sectorArea = densityData.sectorLength * densityData.sectorWidth // m²
    const lineLength = densityData.sectorLength
    const totalLineLength = lineLength * densityData.numberOfLines // meters of line
    const totalShells = totalLineLength * densityData.shellsPerMeter
    const currentDensity = totalShells / sectorArea

    const system = cultivationSystems[densityData.cultivationSystem]
    
    // Calculate optimal configurations
    const optimalShells = sectorArea * system.optimalDensity
    const optimalLinesNeeded = optimalShells / (lineLength * densityData.shellsPerMeter)
    const optimalSpacing = densityData.sectorWidth / optimalLinesNeeded

    // Calculate maximum capacity
    const maxShells = sectorArea * system.maxDensity
    const maxLinesNeeded = maxShells / (lineLength * densityData.shellsPerMeter)
    const minSpacing = Math.max(system.minSpacing, densityData.sectorWidth / maxLinesNeeded)

    // Growth impact analysis
    const densityImpact = calculateGrowthImpact(currentDensity, system.optimalDensity)
    
    // Economic analysis
    const productionPerM2 = currentDensity * (1 - densityImpact.mortalityIncrease / 100)
    const revenuePerM2 = productionPerM2 * estimateWeightFromSize(densityData.targetSize) * getPriceEstimate(densityData.targetSize) / 1000

    // Spacing analysis
    const currentSpacing = densityData.sectorWidth / densityData.numberOfLines
    const spacingRecommendation = getSpacingRecommendation(currentSpacing, system)

    setOptimization({
      sectorArea,
      totalShells,
      currentDensity,
      optimalShells,
      optimalLinesNeeded,
      optimalSpacing,
      maxShells,
      maxLinesNeeded,
      minSpacing,
      currentSpacing,
      spacingRecommendation,
      densityImpact,
      productionPerM2,
      revenuePerM2,
      system,
      utilizationRate: (currentDensity / system.maxDensity) * 100
    })
  }

  const calculateGrowthImpact = (currentDensity, optimalDensity) => {
    const densityRatio = currentDensity / optimalDensity
    
    let growthReduction = 0
    let mortalityIncrease = 0
    
    if (densityRatio > 1.2) {
      growthReduction = Math.min((densityRatio - 1) * 15, 30)
      mortalityIncrease = Math.min((densityRatio - 1) * 8, 20)
    } else if (densityRatio < 0.7) {
      // Sub-optimal utilization but no negative effects
      growthReduction = 0
      mortalityIncrease = 0
    }

    return {
      densityRatio,
      growthReduction,
      mortalityIncrease,
      optimalRange: densityRatio >= 0.8 && densityRatio <= 1.2
    }
  }

  const estimateWeightFromSize = (size) => {
    return Math.pow(size / 10, 2.3) * 2.5
  }

  const getPriceEstimate = (size) => {
    if (size < 40) return 25
    if (size < 55) return 35
    if (size < 70) return 48
    return 60
  }

  const getSpacingRecommendation = (currentSpacing, system) => {
    if (currentSpacing < system.minSpacing) {
      return {
        status: 'too_close',
        message: 'Espaciado muy reducido - riesgo de competencia',
        recommendation: `Aumentar a mínimo ${system.minSpacing}m`
      }
    } else if (currentSpacing > 4.0) {
      return {
        status: 'too_wide',
        message: 'Espaciado amplio - oportunidad de optimización',
        recommendation: 'Reducir espaciado para mayor productividad'
      }
    } else {
      return {
        status: 'optimal',
        message: 'Espaciado adecuado',
        recommendation: 'Mantener configuración actual'
      }
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 }).format(num)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card p-3 sm:p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuración del Sector
        </h3>
        
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Largo del Sector (m)
            </label>
            <input
              type="number"
              value={densityData.sectorLength}
              onChange={(e) => setDensityData({ ...densityData, sectorLength: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="50"
              max="500"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Ancho del Sector (m)
            </label>
            <input
              type="number"
              value={densityData.sectorWidth}
              onChange={(e) => setDensityData({ ...densityData, sectorWidth: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="20"
              max="200"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Profundidad (m)
            </label>
            <input
              type="number"
              value={densityData.waterDepth}
              onChange={(e) => setDensityData({ ...densityData, waterDepth: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="30"
            />
            <span className="text-xs text-gray-500">Profundidad del agua</span>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Sistema de Cultivo
            </label>
            <select
              value={densityData.cultivationSystem}
              onChange={(e) => setDensityData({ ...densityData, cultivationSystem: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(cultivationSystems).map(([key, system]) => (
                <option key={key} value={key}>{system.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Número de Líneas
            </label>
            <input
              type="number"
              value={densityData.numberOfLines}
              onChange={(e) => setDensityData({ ...densityData, numberOfLines: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="100"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Conchas por Metro de Línea
            </label>
            <input
              type="number"
              value={densityData.shellsPerMeter}
              onChange={(e) => setDensityData({ ...densityData, shellsPerMeter: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="4"
              max="15"
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Edad Actual (meses)
            </label>
            <input
              type="number"
              value={densityData.currentAge}
              onChange={(e) => setDensityData({ ...densityData, currentAge: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="12"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Tamaño Objetivo (mm)
            </label>
            <input
              type="number"
              value={densityData.targetSize}
              onChange={(e) => setDensityData({ ...densityData, targetSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="35"
              max="80"
            />
          </div>
        </div>

        <button
          onClick={calculateDensity}
          className="mt-4 w-full py-3 px-4 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 transition-colors"
        >
          Calcular Densidad Óptima
        </button>
      </div>

      {optimization && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-teal-50 to-teal-100">
              <div className="text-teal-600 text-2xl mb-2">📏</div>
              <div className="text-sm text-teal-600">Área del Sector</div>
              <div className="text-xl font-bold text-teal-900">
                {formatNumber(optimization.sectorArea)} m²
              </div>
              <div className="text-xs text-teal-600">
                {densityData.sectorLength} × {densityData.sectorWidth} m
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-blue-600 text-2xl mb-2">🌊</div>
              <div className="text-sm text-blue-600">Densidad Actual</div>
              <div className="text-xl font-bold text-blue-900">
                {formatNumber(optimization.currentDensity)} /m²
              </div>
              <div className="text-xs text-blue-600">
                {optimization.totalShells.toLocaleString()} conchas total
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-green-600 text-2xl mb-2">🎯</div>
              <div className="text-sm text-green-600">Densidad Óptima</div>
              <div className="text-xl font-bold text-green-900">
                {formatNumber(optimization.system.optimalDensity)} /m²
              </div>
              <div className="text-xs text-green-600">
                Recomendado para el sistema
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-purple-600 text-2xl mb-2">📊</div>
              <div className="text-sm text-purple-600">Uso de Capacidad</div>
              <div className="text-xl font-bold text-purple-900">
                {formatNumber(optimization.utilizationRate)}%
              </div>
              <div className="text-xs text-purple-600">
                De la capacidad máxima
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div className="card p-3 sm:p-4 lg:p-6">
              <h4 className="font-medium text-gray-700 mb-3">Configuración Actual</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total de Conchas:</span>
                  <span className="text-sm font-medium">{optimization.totalShells.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Espaciado entre Líneas:</span>
                  <span className="text-sm font-medium">{formatNumber(optimization.currentSpacing)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Líneas Totales:</span>
                  <span className="text-sm font-medium">{densityData.numberOfLines}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Metro Lineal Total:</span>
                  <span className="text-sm font-medium">{formatNumber(densityData.sectorLength * densityData.numberOfLines)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Producción Estimada:</span>
                  <span className="text-sm font-medium text-green-600">{formatNumber(optimization.productionPerM2)} conchas/m²</span>
                </div>
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6">
              <h4 className="font-medium text-gray-700 mb-3">Configuración Óptima</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conchas Óptimas:</span>
                  <span className="text-sm font-medium text-green-600">{Math.round(optimization.optimalShells).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Líneas Recomendadas:</span>
                  <span className="text-sm font-medium text-green-600">{Math.round(optimization.optimalLinesNeeded)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Espaciado Óptimo:</span>
                  <span className="text-sm font-medium text-green-600">{formatNumber(optimization.optimalSpacing)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Capacidad Máxima:</span>
                  <span className="text-sm font-medium text-orange-600">{Math.round(optimization.maxShells).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ingreso Estimado:</span>
                  <span className="text-sm font-medium text-blue-600">{formatCurrency(optimization.revenuePerM2)}/m²</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <h4 className="font-medium text-gray-700 mb-3">Impacto en el Crecimiento</h4>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
              <div className={`p-4 rounded-lg border ${
                optimization.densityImpact.optimalRange ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="text-sm font-medium mb-1">
                  Ratio de Densidad
                </div>
                <div className={`text-2xl font-bold ${
                  optimization.densityImpact.optimalRange ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {formatNumber(optimization.densityImpact.densityRatio)}x
                </div>
                <div className="text-xs text-gray-600">
                  vs. densidad óptima
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                <div className="text-sm font-medium mb-1">
                  Reducción de Crecimiento
                </div>
                <div className="text-2xl font-bold text-red-600">
                  -{formatNumber(optimization.densityImpact.growthReduction)}%
                </div>
                <div className="text-xs text-gray-600">
                  Por alta densidad
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                <div className="text-sm font-medium mb-1">
                  Aumento de Mortalidad
                </div>
                <div className="text-2xl font-bold text-red-600">
                  +{formatNumber(optimization.densityImpact.mortalityIncrease)}%
                </div>
                <div className="text-xs text-gray-600">
                  Mortalidad adicional
                </div>
              </div>
            </div>
          </div>

          <div className={`card p-3 sm:p-4 lg:p-6 ${
            optimization.spacingRecommendation.status === 'optimal' ? 'bg-green-50 border-green-200' :
            optimization.spacingRecommendation.status === 'too_close' ? 'bg-red-50 border-red-200' :
            'bg-amber-50 border-amber-200'
          }`}>
            <h4 className="font-medium text-gray-700 mb-3">Recomendaciones de Espaciado</h4>
            <div className={`text-sm ${
              optimization.spacingRecommendation.status === 'optimal' ? 'text-green-800' :
              optimization.spacingRecommendation.status === 'too_close' ? 'text-red-800' :
              'text-amber-800'
            } space-y-2`}>
              <p className="font-medium">{optimization.spacingRecommendation.message}</p>
              <p>• {optimization.spacingRecommendation.recommendation}</p>
              <p>• Espaciado mínimo para {optimization.system.name}: {optimization.system.minSpacing}m</p>
              <p>• Densidad máxima recomendada: {optimization.system.maxDensity} conchas/m²</p>
              
              {optimization.densityImpact.densityRatio > 1.2 && (
                <>
                  <p>• Considere reducir número de líneas o conchas por metro</p>
                  <p>• Alta densidad puede reducir crecimiento y aumentar mortalidad</p>
                </>
              )}
              
              {optimization.utilizationRate < 60 && (
                <p>• Oportunidad de incrementar densidad para mayor productividad</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DensityEstimator