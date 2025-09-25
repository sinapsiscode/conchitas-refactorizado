import React, { useState, useEffect } from 'react'

const ReturnCalculator = () => {
  const [showPriceConfig, setShowPriceConfig] = useState(false)
  const [returnData, setReturnData] = useState({
    initialInvestment: 25000,
    numberOfShells: 4800,
    finalSize: 55,
    survivalRate: 75,
    harvestMonth: 6,
    currentSeason: 'high',
    operatingCosts: 3000,
    marketDestination: 'local'
  })

  const [results, setResults] = useState(null)
  
  // Cargar precios guardados o usar predeterminados
  const getStoredPrices = () => {
    const stored = localStorage.getItem('investorCustomPrices')
    return stored ? JSON.parse(stored) : {
      local: {
        'small': { low: 20, high: 28, peak: 32 },
        'standard': { low: 28, high: 38, peak: 45 },
        'large': { low: 35, high: 48, peak: 55 },
        'jumbo': { low: 45, high: 60, peak: 70 }
      },
      export: {
        'small': { low: 35, high: 45, peak: 50 },
        'standard': { low: 45, high: 60, peak: 70 },
        'large': { low: 55, high: 75, peak: 85 },
        'jumbo': { low: 70, high: 90, peak: 110 }
      }
    }
  }
  
  const [customPrices, setCustomPrices] = useState(getStoredPrices)
  
  // Guardar precios cuando cambien
  useEffect(() => {
    localStorage.setItem('investorCustomPrices', JSON.stringify(customPrices))
  }, [customPrices])

  // Usar precios personalizados
  const marketPrices = customPrices

  const seasonalFactors = {
    low: 0.85,
    normal: 1.0,
    high: 1.15,
    peak: 1.25
  }

  const getSizeCategory = (size) => {
    if (size < 40) return 'small'
    if (size < 55) return 'standard'
    if (size < 70) return 'large'
    return 'jumbo'
  }

  const calculateWeightFromSize = (size) => {
    // Empirical formula for scallop weight based on size
    return Math.pow(size / 10, 2.3) * 2.5
  }

  const calculateReturns = () => {
    const sizeCategory = getSizeCategory(returnData.finalSize)
    const basePrice = marketPrices[returnData.marketDestination][sizeCategory][returnData.currentSeason]
    const seasonalAdjustment = seasonalFactors[returnData.currentSeason]
    const finalPrice = basePrice * seasonalAdjustment

    const survivingShells = Math.round(returnData.numberOfShells * (returnData.survivalRate / 100))
    const avgWeight = calculateWeightFromSize(returnData.finalSize)
    const totalWeight = (survivingShells * avgWeight) / 1000 // Convert to kg
    
    const grossRevenue = totalWeight * finalPrice
    const netRevenue = grossRevenue - returnData.operatingCosts
    const netProfit = netRevenue - returnData.initialInvestment
    const roi = ((netProfit / returnData.initialInvestment) * 100)
    const monthlyROI = roi / returnData.harvestMonth

    // Calculate scenarios
    const scenarios = ['low', 'normal', 'high', 'peak'].map(season => {
      const scenarioPrice = marketPrices[returnData.marketDestination][sizeCategory][season] * seasonalFactors[season]
      const scenarioRevenue = totalWeight * scenarioPrice - returnData.operatingCosts
      const scenarioProfit = scenarioRevenue - returnData.initialInvestment
      const scenarioROI = (scenarioProfit / returnData.initialInvestment) * 100

      return {
        season,
        price: scenarioPrice,
        revenue: scenarioRevenue,
        profit: scenarioProfit,
        roi: scenarioROI
      }
    })

    setResults({
      survivingShells,
      totalWeight,
      avgWeight,
      finalPrice,
      grossRevenue,
      netRevenue,
      netProfit,
      roi,
      monthlyROI,
      sizeCategory,
      costPerKg: returnData.initialInvestment / totalWeight,
      scenarios,
      breakEvenPrice: (returnData.initialInvestment + returnData.operatingCosts) / totalWeight
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const getSeasonLabel = (season) => {
    const labels = {
      low: 'Baja temporada',
      normal: 'Temporada normal',
      high: 'Alta temporada',
      peak: 'Temporada pico'
    }
    return labels[season]
  }
  
  const updatePrice = (market, category, season, value) => {
    setCustomPrices(prev => ({
      ...prev,
      [market]: {
        ...prev[market],
        [category]: {
          ...prev[market][category],
          [season]: parseFloat(value) || 0
        }
      }
    }))
  }
  
  const resetPricesToDefault = () => {
    setCustomPrices({
      local: {
        'small': { low: 20, high: 28, peak: 32 },
        'standard': { low: 28, high: 38, peak: 45 },
        'large': { low: 35, high: 48, peak: 55 },
        'jumbo': { low: 45, high: 60, peak: 70 }
      },
      export: {
        'small': { low: 35, high: 45, peak: 50 },
        'standard': { low: 45, high: 60, peak: 70 },
        'large': { low: 55, high: 75, peak: 85 },
        'jumbo': { low: 70, high: 90, peak: 110 }
      }
    })
  }
  
  const getCategoryLabel = (category) => {
    const labels = {
      small: 'Pequeñas (< 40mm)',
      standard: 'Estándar (40-55mm)',
      large: 'Grandes (55-70mm)',
      jumbo: 'Extra grandes (> 70mm)'
    }
    return labels[category]
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card p-3 sm:p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Parámetros de Cosecha y Venta
        </h3>
        
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Inversión Inicial (S/)
            </label>
            <input
              type="number"
              value={returnData.initialInvestment}
              onChange={(e) => setReturnData({ ...returnData, initialInvestment: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1000"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Número de Conchas Sembradas
            </label>
            <input
              type="number"
              value={returnData.numberOfShells}
              onChange={(e) => setReturnData({ ...returnData, numberOfShells: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Tamaño Final (mm)
            </label>
            <input
              type="number"
              value={returnData.finalSize}
              onChange={(e) => setReturnData({ ...returnData, finalSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="30"
              max="90"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Tasa de Supervivencia (%)
            </label>
            <input
              type="number"
              value={returnData.survivalRate}
              onChange={(e) => setReturnData({ ...returnData, survivalRate: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="50"
              max="95"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Mes de Cosecha
            </label>
            <select
              value={returnData.harvestMonth}
              onChange={(e) => setReturnData({ ...returnData, harvestMonth: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="4">Mes 4</option>
              <option value="5">Mes 5</option>
              <option value="6">Mes 6</option>
              <option value="7">Mes 7</option>
              <option value="8">Mes 8</option>
              <option value="9">Mes 9</option>
              <option value="10">Mes 10</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Temporada de Venta
            </label>
            <select
              value={returnData.currentSeason}
              onChange={(e) => setReturnData({ ...returnData, currentSeason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Baja temporada</option>
              <option value="normal">Temporada normal</option>
              <option value="high">Alta temporada</option>
              <option value="peak">Temporada pico (fiestas)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Mercado Destino
            </label>
            <select
              value={returnData.marketDestination}
              onChange={(e) => setReturnData({ ...returnData, marketDestination: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="local">Mercado Local</option>
              <option value="export">Exportación</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Costos Operativos (S/)
            </label>
            <input
              type="number"
              value={returnData.operatingCosts}
              onChange={(e) => setReturnData({ ...returnData, operatingCosts: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <span className="text-xs text-gray-500">Mantenimiento, limpieza, cosecha</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 sm:flex-row">
          <button
            onClick={calculateReturns}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors w-full sm:flex-1"
          >
            Calcular Retornos
          </button>
          <button
            onClick={() => setShowPriceConfig(!showPriceConfig)}
            className="px-4 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors w-full sm:w-auto"
            title="Configurar precios de venta"
          >
            ⚙️ Precios
          </button>
        </div>
      </div>
      
      {/* Price Configuration Panel */}
      {showPriceConfig && (
        <div className="card p-3 sm:p-4 lg:p-6 border-2 border-blue-200 bg-blue-50">
          <div className="flex flex-col space-y-3 mb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h3 className="text-lg font-semibold text-blue-900">
              💰 Configuración de Precios de Venta
            </h3>
            <button
              onClick={resetPricesToDefault}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 w-full sm:w-auto"
            >
              Restaurar Predeterminados
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Mercado Local */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                🇵🇪 Mercado Local
              </h4>
              
              <div className="space-y-4">
                {Object.entries(customPrices.local).map(([category, prices]) => (
                  <div key={category}>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {getCategoryLabel(category)}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Baja</label>
                        <input
                          type="number"
                          value={prices.low}
                          onChange={(e) => updatePrice('local', category, 'low', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Alta</label>
                        <input
                          type="number"
                          value={prices.high}
                          onChange={(e) => updatePrice('local', category, 'high', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Pico</label>
                        <input
                          type="number"
                          value={prices.peak}
                          onChange={(e) => updatePrice('local', category, 'peak', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Exportación */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                🌍 Exportación
              </h4>
              
              <div className="space-y-4">
                {Object.entries(customPrices.export).map(([category, prices]) => (
                  <div key={category}>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {getCategoryLabel(category)}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Baja</label>
                        <input
                          type="number"
                          value={prices.low}
                          onChange={(e) => updatePrice('export', category, 'low', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Alta</label>
                        <input
                          type="number"
                          value={prices.high}
                          onChange={(e) => updatePrice('export', category, 'high', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Pico</label>
                        <input
                          type="number"
                          value={prices.peak}
                          onChange={(e) => updatePrice('export', category, 'peak', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Nota:</strong> Los precios se expresan en soles por kilogramo (S//kg). 
              Ajuste los precios según las condiciones actuales del mercado y sus canales de venta.
            </p>
          </div>
        </div>
      )}

      {results && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-green-600 text-2xl mb-2">💵</div>
              <div className="text-sm text-green-600">Ingreso Bruto</div>
              <div className="text-xl font-bold text-green-900">
                {formatCurrency(results.grossRevenue)}
              </div>
              <div className="text-xs text-green-600">
                {formatCurrency(results.finalPrice)}/kg
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-blue-600 text-2xl mb-2">💰</div>
              <div className="text-sm text-blue-600">Ganancia Neta</div>
              <div className={`text-xl font-bold ${results.netProfit >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                {formatCurrency(results.netProfit)}
              </div>
              <div className="text-xs text-blue-600">
                Después de costos
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-purple-600 text-2xl mb-2">📈</div>
              <div className="text-sm text-purple-600">ROI Total</div>
              <div className={`text-xl font-bold ${results.roi >= 0 ? 'text-purple-900' : 'text-red-600'}`}>
                {results.roi.toFixed(1)}%
              </div>
              <div className="text-xs text-purple-600">
                En {returnData.harvestMonth} meses
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="text-orange-600 text-2xl mb-2">⚖️</div>
              <div className="text-sm text-orange-600">Producción Total</div>
              <div className="text-xl font-bold text-orange-900">
                {results.totalWeight.toFixed(0)} kg
              </div>
              <div className="text-xs text-orange-600">
                {results.survivingShells.toLocaleString()} conchas
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div className="card p-3 sm:p-4 lg:p-6">
              <h4 className="font-medium text-gray-700 mb-3">Desglose Financiero</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inversión Inicial:</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(returnData.initialInvestment)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Costos Operativos:</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(returnData.operatingCosts)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-semibold text-gray-700">Costo Total:</span>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(returnData.initialInvestment + returnData.operatingCosts)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ingreso Bruto:</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(results.grossRevenue)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold text-gray-700">Ganancia Neta:</span>
                  <span className={`text-sm font-bold ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-3 sm:p-4 lg:p-6">
              <h4 className="font-medium text-gray-700 mb-3">Métricas de Producción</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Categoría de Tamaño:</span>
                  <span className="text-sm font-medium capitalize">
                    {results.sizeCategory} ({returnData.finalSize}mm)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peso Promedio:</span>
                  <span className="text-sm font-medium">
                    {results.avgWeight.toFixed(1)} g/concha
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Supervivencia:</span>
                  <span className="text-sm font-medium">
                    {returnData.survivalRate}% ({results.survivingShells.toLocaleString()})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Costo por Kg:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(results.costPerKg)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Punto de Equilibrio:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatCurrency(results.breakEvenPrice)}/kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <h4 className="font-medium text-gray-700 mb-3">Análisis por Temporada</h4>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Temporada
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Precio/kg
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Ingreso Neto
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-4">
                      Ganancia
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-4">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.scenarios.map((scenario) => {
                    const isCurrentSeason = scenario.season === returnData.currentSeason
                    return (
                      <tr key={scenario.season} className={isCurrentSeason ? 'bg-blue-50' : ''}>
                        <td className="px-3 py-3 text-sm sm:px-4 font-medium text-gray-900">
                          {getSeasonLabel(scenario.season)}
                          {isCurrentSeason && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Actual
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm sm:px-4 text-right">
                          {formatCurrency(scenario.price)}
                        </td>
                        <td className="px-3 py-3 text-sm sm:px-4 text-right">
                          {formatCurrency(scenario.revenue)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${scenario.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenario.profit)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${scenario.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {scenario.roi.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <h4 className="font-medium text-amber-900 mb-3">Recomendaciones</h4>
            <div className="text-sm text-amber-800 space-y-1">
              {results.roi < 15 && (
                <p>• ROI bajo - considere optimizar costos o extender período de crecimiento</p>
              )}
              {results.finalPrice < results.breakEvenPrice && (
                <p>• Precio actual por debajo del punto de equilibrio - evalúe cambiar temporada</p>
              )}
              {returnData.finalSize < 45 && (
                <p>• Tamaño pequeño - considere extender el cultivo para mejor precio</p>
              )}
              {returnData.survivalRate < 70 && (
                <p>• Baja supervivencia - revise técnicas de manejo y condiciones</p>
              )}
              <p>• Monitoree precios de mercado para timing óptimo de cosecha</p>
              <p>• Considere diversificar temporadas de siembra para reducir riesgo</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ReturnCalculator