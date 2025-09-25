import React, { useState } from 'react'

const SeedingCalculator = () => {
  const [seedingData, setSeedingData] = useState({
    numberOfBundles: 50,
    pricePerBundle: 15,
    origin: 'Samanco',
    expectedMortality: 20,
    harvestTime: 6,
    sectorSize: 1000,
    additionalCosts: 500
  })

  const [results, setResults] = useState(null)

  const origins = {
    'Samanco': { price: 15, quality: 'alta', mortality: 15 },
    'Casma': { price: 12, quality: 'media', mortality: 20 },
    'Huarmey': { price: 18, quality: 'premium', mortality: 10 },
    'Supe': { price: 14, quality: 'media', mortality: 18 }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const calculateSeeding = () => {
    const shellsPerBundle = 96
    const totalShells = seedingData.numberOfBundles * shellsPerBundle
    const bundleCost = seedingData.numberOfBundles * seedingData.pricePerBundle
    const totalInitialCost = bundleCost + seedingData.additionalCosts
    
    const originData = origins[seedingData.origin]
    const adjustedMortality = originData.mortality
    const survivingShells = Math.round(totalShells * (1 - adjustedMortality / 100))
    
    const densityPerM2 = totalShells / seedingData.sectorSize
    const survivingDensityPerM2 = survivingShells / seedingData.sectorSize
    
    const costPerShell = totalInitialCost / totalShells
    const costPerSurvivingShell = totalInitialCost / survivingShells
    
    setResults({
      totalShells,
      survivingShells,
      bundleCost,
      totalInitialCost,
      adjustedMortality,
      densityPerM2,
      survivingDensityPerM2,
      costPerShell,
      costPerSurvivingShell,
      shellsLost: totalShells - survivingShells,
      originQuality: originData.quality
    })
  }

  const handleOriginChange = (origin) => {
    setSeedingData({
      ...seedingData,
      origin,
      pricePerBundle: origins[origin].price,
      expectedMortality: origins[origin].mortality
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card p-3 sm:p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Parámetros de Siembra
        </h3>
        
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Número de Manojos
            </label>
            <input
              type="number"
              value={seedingData.numberOfBundles}
              onChange={(e) => setSeedingData({ ...seedingData, numberOfBundles: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            <span className="text-xs text-gray-500">96 conchas por manojo</span>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Tamaño del Sector (m²)
            </label>
            <input
              type="number"
              value={seedingData.sectorSize}
              onChange={(e) => setSeedingData({ ...seedingData, sectorSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
            />
            <span className="text-xs text-gray-500">Área de cultivo en metros cuadrados</span>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Origen de Semilla
            </label>
            <select
              value={seedingData.origin}
              onChange={(e) => handleOriginChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(origins).map(([location, data]) => (
                <option key={location} value={location}>
                  {location} - {formatCurrency(data.price)} (Calidad {data.quality})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Tiempo de Cosecha (meses)
            </label>
            <select
              value={seedingData.harvestTime}
              onChange={(e) => setSeedingData({ ...seedingData, harvestTime: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="4">4 meses (comercial pequeña)</option>
              <option value="6">6 meses (comercial estándar)</option>
              <option value="8">8 meses (exportación)</option>
              <option value="10">10 meses (premium)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Costos Adicionales (S/)
            </label>
            <input
              type="number"
              value={seedingData.additionalCosts}
              onChange={(e) => setSeedingData({ ...seedingData, additionalCosts: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <span className="text-xs text-gray-500">Transporte, linternas, cuerdas, etc.</span>
          </div>
        </div>

        <button
          onClick={calculateSeeding}
          className="mt-4 w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Calcular Siembra
        </button>
      </div>

      {results && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-blue-600 text-2xl mb-2">🌱</div>
              <div className="text-sm text-blue-600">Conchas Sembradas</div>
              <div className="text-xl font-bold text-blue-900">
                {results.totalShells.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">
                {seedingData.numberOfBundles} manojos
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-green-600 text-2xl mb-2">✅</div>
              <div className="text-sm text-green-600">Conchas Supervivientes</div>
              <div className="text-xl font-bold text-green-900">
                {results.survivingShells.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">
                {(100 - results.adjustedMortality)}% supervivencia
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-red-50 to-red-100">
              <div className="text-red-600 text-2xl mb-2">💰</div>
              <div className="text-sm text-red-600">Inversión Total</div>
              <div className="text-xl font-bold text-red-900">
                {formatCurrency(results.totalInitialCost)}
              </div>
              <div className="text-xs text-red-600">
                Incluye costos adicionales
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div className="card p-3 sm:p-4 lg:p-6">
              <h4 className="font-medium text-gray-700 mb-3">Desglose de Costos</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Costo de Manojos:</span>
                  <span className="text-sm font-medium">{formatCurrency(results.bundleCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Costos Adicionales:</span>
                  <span className="text-sm font-medium">{formatCurrency(seedingData.additionalCosts)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-semibold text-gray-700">Total:</span>
                  <span className="text-sm font-bold">{formatCurrency(results.totalInitialCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Costo por Concha:</span>
                  <span className="text-sm font-medium">{formatCurrency(results.costPerShell)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Costo por Superviviente:</span>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(results.costPerSurvivingShell)}</span>
                </div>
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6">
              <h4 className="font-medium text-gray-700 mb-3">Análisis de Densidad</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Densidad Inicial:</span>
                  <span className="text-sm font-medium">{results.densityPerM2.toFixed(1)} conchas/m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Densidad Final:</span>
                  <span className="text-sm font-medium text-green-600">{results.survivingDensityPerM2.toFixed(1)} conchas/m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conchas Perdidas:</span>
                  <span className="text-sm font-medium text-red-600">{results.shellsLost.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-600">Recomendación de Densidad:</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {results.densityPerM2 > 15 ? 
                      '⚠️ Densidad alta - riesgo de competencia' : 
                      results.densityPerM2 < 8 ? 
                      '📈 Densidad baja - oportunidad de optimizar' :
                      '✅ Densidad óptima'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-indigo-50 to-purple-50">
            <h4 className="font-medium text-gray-700 mb-3">Información del Origen</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Origen Seleccionado</div>
                <div className="text-lg font-semibold text-gray-900">{seedingData.origin}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Calidad</div>
                <div className="text-lg font-semibold text-purple-600 capitalize">{results.originQuality}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Mortalidad Esperada</div>
                <div className="text-lg font-semibold text-red-600">{results.adjustedMortality}%</div>
              </div>
            </div>
          </div>

          <div className="card bg-amber-50 border-amber-200">
            <h4 className="font-medium text-amber-900 mb-2">Recomendaciones</h4>
            <div className="text-sm text-amber-800 space-y-1">
              {results.densityPerM2 > 15 && (
                <p>• Considere reducir la densidad para mejorar el crecimiento y supervivencia</p>
              )}
              {results.adjustedMortality > 25 && (
                <p>• Alta mortalidad esperada - evalúe cambiar de origen o mejorar condiciones</p>
              )}
              {seedingData.harvestTime < 6 && (
                <p>• Tiempo de cosecha corto - verifique que alcance el tamaño comercial deseado</p>
              )}
              <p>• Monitoree regularmente para detectar problemas temprano</p>
              <p>• Mantenga registros de mortalidad real vs. estimada</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SeedingCalculator