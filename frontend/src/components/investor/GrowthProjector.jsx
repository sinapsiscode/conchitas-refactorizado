import React, { useState } from 'react'

const GrowthProjector = () => {
  const [growthData, setGrowthData] = useState({
    initialSize: 15,
    currentMonth: 1,
    totalMonths: 6,
    waterTemp: 18,
    feedingLevel: 'normal',
    currentDensity: 12,
    expectedFinalSize: 0
  })

  const [projection, setProjection] = useState(null)

  const growthRates = {
    size: {
      '10-20mm': { base: 3.5, optimal: 4.2 },
      '20-35mm': { base: 4.8, optimal: 5.5 },
      '35-50mm': { base: 3.2, optimal: 4.0 },
      '50-70mm': { base: 2.5, optimal: 3.2 },
      '70mm+': { base: 1.8, optimal: 2.3 }
    },
    weight: {
      '10-20mm': { baseGrams: 0.5, optimal: 0.7 },
      '20-35mm': { baseGrams: 2.8, optimal: 3.5 },
      '35-50mm': { baseGrams: 8.5, optimal: 11.0 },
      '50-70mm': { baseGrams: 18.2, optimal: 23.5 },
      '70mm+': { baseGrams: 35.0, optimal: 45.0 }
    }
  }

  const getSizeCategory = (size) => {
    if (size < 20) return '10-20mm'
    if (size < 35) return '20-35mm' 
    if (size < 50) return '35-50mm'
    if (size < 70) return '50-70mm'
    return '70mm+'
  }

  const getGrowthMultiplier = () => {
    let multiplier = 1.0

    // Temperature factor
    if (growthData.waterTemp < 16) multiplier *= 0.7
    else if (growthData.waterTemp > 22) multiplier *= 0.8
    else if (growthData.waterTemp >= 18 && growthData.waterTemp <= 20) multiplier *= 1.1

    // Feeding factor
    if (growthData.feedingLevel === 'intensive') multiplier *= 1.15
    else if (growthData.feedingLevel === 'minimal') multiplier *= 0.85

    // Density factor
    if (growthData.currentDensity > 15) multiplier *= 0.85
    else if (growthData.currentDensity < 8) multiplier *= 1.05

    return multiplier
  }

  const projectGrowth = () => {
    const months = []
    let currentSize = growthData.initialSize
    let currentWeight = 0.5

    const multiplier = getGrowthMultiplier()
    const isOptimalConditions = multiplier > 1.05

    for (let month = 1; month <= growthData.totalMonths; month++) {
      const sizeCategory = getSizeCategory(currentSize)
      const growthRate = isOptimalConditions ? 
        growthRates.size[sizeCategory].optimal : 
        growthRates.size[sizeCategory].base
      
      const monthlyGrowth = growthRate * multiplier
      currentSize += monthlyGrowth

      // Calculate weight based on size
      const weightCategory = getSizeCategory(currentSize)
      const baseWeight = isOptimalConditions ?
        growthRates.weight[weightCategory].optimal :
        growthRates.weight[weightCategory].baseGrams

      // Weight grows exponentially with size
      const sizeRatio = currentSize / 15 // relative to initial 15mm
      currentWeight = baseWeight * Math.pow(sizeRatio, 2.3)

      months.push({
        month,
        size: Math.round(currentSize * 10) / 10,
        weight: Math.round(currentWeight * 10) / 10,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        category: getSizeCategory(currentSize),
        marketable: currentSize >= 45
      })
    }

    const finalMonth = months[months.length - 1]
    const totalGrowth = finalMonth.size - growthData.initialSize
    const avgMonthlyGrowth = totalGrowth / growthData.totalMonths
    const survivalRate = calculateSurvivalRate(finalMonth.size)

    setProjection({
      months,
      finalSize: finalMonth.size,
      finalWeight: finalMonth.weight,
      totalGrowth,
      avgMonthlyGrowth,
      survivalRate,
      marketCategory: getMarketCategory(finalMonth.size),
      multiplier
    })
  }

  const calculateSurvivalRate = (finalSize) => {
    // Base survival rate decreases with longer growing periods
    let baseSurvival = 80
    
    if (growthData.totalMonths > 8) baseSurvival -= 10
    if (growthData.currentDensity > 15) baseSurvival -= 5
    if (growthData.waterTemp < 16 || growthData.waterTemp > 22) baseSurvival -= 5
    
    return Math.max(baseSurvival, 60)
  }

  const getMarketCategory = (size) => {
    if (size < 35) return { name: 'No comercial', price: 0 }
    if (size < 45) return { name: 'Comercial pequeña', price: 25 }
    if (size < 60) return { name: 'Comercial estándar', price: 35 }
    if (size < 75) return { name: 'Exportación', price: 50 }
    return { name: 'Premium/Jumbo', price: 65 }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 }).format(num)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card p-3 sm:p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Parámetros de Crecimiento
        </h3>
        
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Tamaño Inicial (mm)
            </label>
            <input
              type="number"
              value={growthData.initialSize}
              onChange={(e) => setGrowthData({ ...growthData, initialSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="30"
              step="0.5"
            />
            <span className="text-xs text-gray-500">Tamaño de semilla típico: 12-18mm</span>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Período Total (meses)
            </label>
            <select
              value={growthData.totalMonths}
              onChange={(e) => setGrowthData({ ...growthData, totalMonths: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="4">4 meses</option>
              <option value="5">5 meses</option>
              <option value="6">6 meses</option>
              <option value="7">7 meses</option>
              <option value="8">8 meses</option>
              <option value="9">9 meses</option>
              <option value="10">10 meses</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Temperatura del Agua (°C)
            </label>
            <input
              type="number"
              value={growthData.waterTemp}
              onChange={(e) => setGrowthData({ ...growthData, waterTemp: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="14"
              max="25"
              step="0.5"
            />
            <span className="text-xs text-gray-500">Rango óptimo: 18-20°C</span>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Nivel de Alimentación
            </label>
            <select
              value={growthData.feedingLevel}
              onChange={(e) => setGrowthData({ ...growthData, feedingLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="minimal">Mínima (natural)</option>
              <option value="normal">Normal (complementaria)</option>
              <option value="intensive">Intensiva (suplemento)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Densidad Actual (conchas/m²)
            </label>
            <input
              type="number"
              value={growthData.currentDensity}
              onChange={(e) => setGrowthData({ ...growthData, currentDensity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="25"
            />
            <span className="text-xs text-gray-500">Recomendado: 8-15 conchas/m²</span>
          </div>
        </div>

        <button
          onClick={projectGrowth}
          className="mt-4 w-full py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          Proyectar Crecimiento
        </button>
      </div>

      {projection && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-green-600 text-2xl mb-2">📏</div>
              <div className="text-sm text-green-600">Tamaño Final</div>
              <div className="text-xl font-bold text-green-900">
                {formatNumber(projection.finalSize)} mm
              </div>
              <div className="text-xs text-green-600">
                +{formatNumber(projection.totalGrowth)} mm total
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-blue-600 text-2xl mb-2">⚖️</div>
              <div className="text-sm text-blue-600">Peso Final</div>
              <div className="text-xl font-bold text-blue-900">
                {formatNumber(projection.finalWeight)} g
              </div>
              <div className="text-xs text-blue-600">
                Peso individual estimado
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-purple-600 text-2xl mb-2">📈</div>
              <div className="text-sm text-purple-600">Crecimiento Mensual</div>
              <div className="text-xl font-bold text-purple-900">
                {formatNumber(projection.avgMonthlyGrowth)} mm
              </div>
              <div className="text-xs text-purple-600">
                Promedio por mes
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="text-orange-600 text-2xl mb-2">💰</div>
              <div className="text-sm text-orange-600">Categoría de Mercado</div>
              <div className="text-lg font-bold text-orange-900">
                {projection.marketCategory.name}
              </div>
              <div className="text-xs text-orange-600">
                S/ {projection.marketCategory.price}/kg aprox.
              </div>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <h4 className="font-medium text-gray-700 mb-3">Proyección Mensual</h4>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Mes
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Tamaño (mm)
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Peso (g)
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Crecimiento
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Categoría
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Comercial
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projection.months.map((month) => (
                    <tr key={month.month} className={month.marketable ? 'bg-green-50' : ''}>
                      <td className="px-3 py-3 text-sm sm:px-4 font-medium text-gray-900">
                        {month.month}
                      </td>
                      <td className="px-3 py-3 text-sm sm:px-4 text-right">
                        {formatNumber(month.size)}
                      </td>
                      <td className="px-3 py-3 text-sm sm:px-4 text-right">
                        {formatNumber(month.weight)}
                      </td>
                      <td className="px-3 py-3 text-sm sm:px-4 text-right text-green-600">
                        +{formatNumber(month.monthlyGrowth)}
                      </td>
                      <td className="px-3 py-3 text-sm sm:px-4 text-center">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {month.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {month.marketable ? (
                          <span className="text-green-600 text-lg">✓</span>
                        ) : (
                          <span className="text-gray-400 text-lg">○</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div className="card p-3 sm:p-4 lg:p-6">
              <h4 className="font-medium text-gray-700 mb-3">Análisis de Condiciones</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Multiplicador de Crecimiento:</span>
                  <span className={`text-sm font-medium ${projection.multiplier >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(projection.multiplier)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Supervivencia Estimada:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {projection.survivalRate}%
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    {projection.multiplier > 1.05 ? 
                      '✅ Condiciones óptimas para crecimiento' :
                      projection.multiplier < 0.9 ?
                      '⚠️ Condiciones subóptimas - revisar parámetros' :
                      '✓ Condiciones normales'
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6">
              <h4 className="font-medium text-gray-700 mb-3">Recomendaciones</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {growthData.waterTemp < 18 && (
                  <p className="text-amber-600">• Temperatura baja - crecimiento más lento</p>
                )}
                {growthData.currentDensity > 15 && (
                  <p className="text-red-600">• Alta densidad - considere raleo</p>
                )}
                {projection.finalSize < 45 && (
                  <p className="text-orange-600">• Extender período para alcanzar tamaño comercial</p>
                )}
                {projection.finalSize > 70 && (
                  <p className="text-green-600">• Excelente - categoría premium</p>
                )}
                <p className="text-blue-600">• Monitorear crecimiento mensual real</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default GrowthProjector