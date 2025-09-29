// ProjectionParametersSchema eliminado con MockAPI - ahora parametros por defecto
const DEFAULT_PROJECTION_PARAMETERS = {
  monthlyGrowthRate: 0.15,
  monthlyMortalityRate: 0.05,
  harvestSizeMin: 60,
  harvestSizeMax: 80,
  pricePerKg: 12.5
}

export class ProjectionService {
  constructor() {
    this.parameters = DEFAULT_PROJECTION_PARAMETERS
  }

  // Calculate complete projection
  calculateProjection(projectionData) {
    const {
      baseInvestment,
      projectionMonths,
      marketVariables,
      costStructure,
      riskFactors,
      scenarios = []
    } = projectionData

    // Base calculation
    const baseResults = this.calculateBaseScenario(
      baseInvestment,
      projectionMonths,
      marketVariables,
      costStructure
    )

    // Apply risk adjustments
    const riskAdjustedResults = this.applyRiskFactors(baseResults, riskFactors)

    // Calculate scenarios
    const scenarioResults = scenarios.map(scenario => ({
      ...scenario,
      results: this.calculateScenario(
        baseInvestment,
        projectionMonths,
        marketVariables,
        costStructure,
        scenario.adjustments
      )
    }))

    // Calculate weighted average if scenarios have probabilities
    const weightedResults = this.calculateWeightedResults(scenarioResults)

    return {
      baseResults,
      riskAdjustedResults,
      scenarioResults,
      weightedResults,
      summary: this.generateSummary(baseResults, riskAdjustedResults, weightedResults),
      calculatedAt: new Date().toISOString()
    }
  }

  // Calculate base scenario without adjustments
  calculateBaseScenario(investment, months, market, costs) {
    const cycles = Math.floor(months / market.cycleMonths)
    const monthlyData = []
    let cumulativeCashFlow = -investment
    let totalRevenue = 0
    let totalCosts = investment

    for (let month = 1; month <= months; month++) {
      const cycleNumber = Math.floor((month - 1) / market.cycleMonths) + 1
      const monthInCycle = ((month - 1) % market.cycleMonths) + 1
      
      // Monthly costs
      const monthlyCosts = costs.maintenanceCostMonthly + costs.fixedCostsMonthly
      totalCosts += monthlyCosts
      cumulativeCashFlow -= monthlyCosts

      // Revenue at harvest (end of cycle)
      let monthlyRevenue = 0
      if (monthInCycle === market.cycleMonths && cycleNumber <= cycles) {
        const seedQuantity = investment / (costs.seedCostPerUnit * cycles)
        const survivingQuantity = seedQuantity * (1 - market.mortalityRate / 100)
        const harvestQuantity = survivingQuantity * (market.growthRate / 100)
        monthlyRevenue = harvestQuantity * market.pricePerUnit
        const harvestCosts = harvestQuantity * costs.harvestCostPerUnit
        
        totalRevenue += monthlyRevenue
        totalCosts += harvestCosts
        cumulativeCashFlow += (monthlyRevenue - harvestCosts)
      }

      monthlyData.push({
        month,
        revenue: monthlyRevenue,
        costs: monthlyCosts,
        netIncome: monthlyRevenue - monthlyCosts,
        cumulativeCashFlow,
        roi: investment > 0 ? ((cumulativeCashFlow + investment) / investment - 1) * 100 : 0
      })
    }

    const netProfit = totalRevenue - totalCosts
    const roi = investment > 0 ? (netProfit / investment) * 100 : 0
    const paybackPeriod = this.calculatePaybackPeriod(monthlyData)
    const irr = this.calculateIRR(monthlyData, investment)

    return {
      monthlyData,
      totalRevenue,
      totalCosts,
      netProfit,
      roi,
      paybackPeriod,
      irr,
      cycles,
      averageMonthlyReturn: netProfit / months
    }
  }

  // Calculate scenario with adjustments
  calculateScenario(investment, months, market, costs, adjustments) {
    // Apply adjustments to parameters
    const adjustedMarket = {
      ...market,
      pricePerUnit: market.pricePerUnit * (1 + adjustments.priceAdjustment / 100),
      mortalityRate: market.mortalityRate * (1 + adjustments.mortalityAdjustment / 100),
      growthRate: market.growthRate * (1 + adjustments.volumeAdjustment / 100)
    }

    const adjustedCosts = {
      seedCostPerUnit: costs.seedCostPerUnit * (1 + adjustments.costAdjustment / 100),
      maintenanceCostMonthly: costs.maintenanceCostMonthly * (1 + adjustments.costAdjustment / 100),
      harvestCostPerUnit: costs.harvestCostPerUnit * (1 + adjustments.costAdjustment / 100),
      fixedCostsMonthly: costs.fixedCostsMonthly * (1 + adjustments.costAdjustment / 100)
    }

    return this.calculateBaseScenario(investment, months, adjustedMarket, adjustedCosts)
  }

  // Apply risk factors to results
  applyRiskFactors(results, riskFactors) {
    const totalRisk = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / 100
    const riskMultiplier = 1 - (totalRisk / 2) // Max 50% reduction for 100% total risk

    return {
      ...results,
      totalRevenue: results.totalRevenue * riskMultiplier,
      netProfit: results.netProfit * riskMultiplier,
      roi: results.roi * riskMultiplier,
      riskAdjustment: (1 - riskMultiplier) * 100,
      confidenceLevel: 100 - totalRisk
    }
  }

  // Calculate weighted results from scenarios
  calculateWeightedResults(scenarios) {
    if (!scenarios.length) return null

    const totalProbability = scenarios.reduce((sum, s) => sum + (s.probability || 0), 0)
    if (totalProbability === 0) return null

    const weightedResults = {
      totalRevenue: 0,
      totalCosts: 0,
      netProfit: 0,
      roi: 0,
      paybackPeriod: 0,
      irr: 0
    }

    scenarios.forEach(scenario => {
      const weight = scenario.probability / totalProbability
      weightedResults.totalRevenue += scenario.results.totalRevenue * weight
      weightedResults.totalCosts += scenario.results.totalCosts * weight
      weightedResults.netProfit += scenario.results.netProfit * weight
      weightedResults.roi += scenario.results.roi * weight
      weightedResults.paybackPeriod += scenario.results.paybackPeriod * weight
      weightedResults.irr += scenario.results.irr * weight
    })

    return weightedResults
  }

  // Calculate payback period
  calculatePaybackPeriod(monthlyData) {
    for (let i = 0; i < monthlyData.length; i++) {
      if (monthlyData[i].cumulativeCashFlow >= 0) {
        return i + 1
      }
    }
    return monthlyData.length + 1 // Beyond projection period
  }

  // Calculate Internal Rate of Return (simplified)
  calculateIRR(monthlyData, initialInvestment) {
    // Simplified IRR calculation
    const finalValue = monthlyData[monthlyData.length - 1]?.cumulativeCashFlow + initialInvestment || 0
    const months = monthlyData.length
    
    if (finalValue <= 0 || months === 0) return 0
    
    // Monthly IRR
    const monthlyIRR = Math.pow(finalValue / initialInvestment, 1 / months) - 1
    // Annualized IRR
    return monthlyIRR * 12 * 100
  }

  // Generate summary of results
  generateSummary(base, riskAdjusted, weighted) {
    const summary = {
      recommendation: this.getRecommendation(base.roi, riskAdjusted.roi),
      riskLevel: this.getRiskLevel(riskAdjusted.riskAdjustment),
      profitability: this.getProfitability(base.roi),
      keyMetrics: {
        expectedROI: riskAdjusted.roi,
        paybackMonths: riskAdjusted.paybackPeriod || base.paybackPeriod,
        confidenceLevel: riskAdjusted.confidenceLevel,
        netProfit: riskAdjusted.netProfit
      }
    }

    if (weighted) {
      summary.scenarioAnalysis = {
        weightedROI: weighted.roi,
        weightedProfit: weighted.netProfit,
        recommendation: this.getRecommendation(weighted.roi, weighted.roi)
      }
    }

    return summary
  }

  // Get investment recommendation
  getRecommendation(baseROI, adjustedROI) {
    if (adjustedROI >= 25) return 'Altamente Recomendado'
    if (adjustedROI >= 15) return 'Recomendado'
    if (adjustedROI >= 8) return 'Aceptable'
    if (adjustedROI >= 0) return 'Marginal'
    return 'No Recomendado'
  }

  // Get risk level description
  getRiskLevel(riskAdjustment) {
    if (riskAdjustment <= 10) return 'Bajo'
    if (riskAdjustment <= 20) return 'Moderado'
    if (riskAdjustment <= 30) return 'Alto'
    return 'Muy Alto'
  }

  // Get profitability level
  getProfitability(roi) {
    if (roi >= 30) return 'Excelente'
    if (roi >= 20) return 'Muy Buena'
    if (roi >= 10) return 'Buena'
    if (roi >= 5) return 'Moderada'
    if (roi >= 0) return 'Baja'
    return 'Negativa'
  }

  // Create standard scenarios
  createStandardScenarios() {
    return [
      {
        id: 'optimistic',
        name: 'Escenario Optimista',
        type: 'optimistic',
        adjustments: {
          priceAdjustment: 15,
          mortalityAdjustment: -20,
          costAdjustment: -10,
          volumeAdjustment: 10
        },
        probability: 25
      },
      {
        id: 'realistic',
        name: 'Escenario Realista',
        type: 'realistic',
        adjustments: {
          priceAdjustment: 0,
          mortalityAdjustment: 0,
          costAdjustment: 0,
          volumeAdjustment: 0
        },
        probability: 50
      },
      {
        id: 'pessimistic',
        name: 'Escenario Pesimista',
        type: 'pessimistic',
        adjustments: {
          priceAdjustment: -15,
          mortalityAdjustment: 30,
          costAdjustment: 15,
          volumeAdjustment: -10
        },
        probability: 25
      }
    ]
  }

  // Monte Carlo simulation for advanced risk analysis
  monteCarloSimulation(projectionData, iterations = 1000) {
    const results = []
    
    for (let i = 0; i < iterations; i++) {
      // Generate random variations within reasonable bounds
      const randomAdjustments = {
        priceAdjustment: (Math.random() - 0.5) * 30, // -15% to +15%
        mortalityAdjustment: (Math.random() - 0.5) * 40, // -20% to +20%
        costAdjustment: (Math.random() - 0.5) * 20, // -10% to +10%
        volumeAdjustment: (Math.random() - 0.5) * 20 // -10% to +10%
      }
      
      const scenario = this.calculateScenario(
        projectionData.baseInvestment,
        projectionData.projectionMonths,
        projectionData.marketVariables,
        projectionData.costStructure,
        randomAdjustments
      )
      
      results.push(scenario.roi)
    }
    
    // Calculate statistics
    results.sort((a, b) => a - b)
    const mean = results.reduce((sum, r) => sum + r, 0) / iterations
    const median = results[Math.floor(iterations / 2)]
    const percentile5 = results[Math.floor(iterations * 0.05)]
    const percentile95 = results[Math.floor(iterations * 0.95)]
    const stdDev = Math.sqrt(
      results.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / iterations
    )
    
    return {
      mean,
      median,
      stdDev,
      percentile5,
      percentile95,
      confidenceInterval: [percentile5, percentile95],
      probabilityPositive: results.filter(r => r > 0).length / iterations * 100,
      probabilityAbove10: results.filter(r => r > 10).length / iterations * 100,
      probabilityAbove20: results.filter(r => r > 20).length / iterations * 100
    }
  }
}

// Export singleton instance
export const projectionService = new ProjectionService()