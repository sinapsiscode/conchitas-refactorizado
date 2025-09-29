import React, { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../stores'
import { useSectorStore } from '../../stores'
import { useHarvestStore } from '../../stores'
import { useExpenseStore } from '../../stores'
import { useInvestmentStore } from '../../stores'
import { useMonitoringStore } from '../../stores'
import { useSeedOriginStore } from '../../stores'
import { batteriesService, cultivationLinesService } from '../../services/api'
import StatCard from '../../components/common/StatCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToPDF } from '../../utils/exportPDF'
import * as XLSX from 'xlsx'

const ReportsPage = () => {
  const { user } = useAuthStore()
  const { sectors, fetchSectors } = useSectorStore()
  const { harvestPlans, pricing, fetchHarvestPlans, fetchPricing, loading: harvestLoading } = useHarvestStore()
  const { expenses, fetchExpenses } = useExpenseStore()
  const { investments, fetchInvestments } = useInvestmentStore()
  const { monitoringRecords, fetchAllMonitoring } = useMonitoringStore()
  const { seedOrigins, fetchSeedOrigins } = useSeedOriginStore()

  // Estados adicionales para siembras
  const [seedings, setSeedings] = useState([])
  const [batteries, setBatteries] = useState([])
  const [cultivationLines, setCultivationLines] = useState([])

  // Estado para filtros y configuración de reportes
  const [reportFilters, setReportFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Inicio del año
    dateTo: new Date().toISOString().split('T')[0], // Hoy
    sectorId: '',
    reportSections: {
      cashFlow: true,
      harvests: true,
      seedings: true,
      productionReport: true,
      nextHarvests: true,
      freeLots: true,
      completedHarvests: true,
      dashboard: true
    }
  })

  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    cashFlow: true,
    dashboard: true
  })

  useEffect(() => {
    const loadAllData = async () => {
      if (user?.id) {
        setLoading(true)
        try {
          const promises = [
            fetchSectors(user.id),
            fetchHarvestPlans(user.id),
            fetchPricing(),
            fetchExpenses({ userId: user.id }),
            fetchAllMonitoring(),
            fetchSeedOrigins(user.id)
          ]
          
          // Para inversores, cargar sus inversiones
          if (user.role === 'investor') {
            promises.push(fetchInvestments(user.id, 'investor'))
          }
          
          await Promise.all(promises)

          // Cargar siembras (lotes), baterías y líneas de cultivo
          // Los sectores ya están disponibles en el store
          const sectorsWithLots = sectors || []

          // Extraer todos los lotes (siembras) de todos los sectores
          const allSeedings = sectorsWithLots.flatMap(sector =>
            (sector.lots || []).map(lot => ({
              ...lot,
              sectorName: sector.name,
              sectorLocation: sector.location
            }))
          )

          // Obtener todas las baterías y líneas de cultivo de todos los sectores
          const allBatteries = []
          const allCultivationLines = []

          for (const sector of sectorsWithLots) {
            try {
              const batteriesResponse = await batteriesService.getAll({ sectorId: sector.id })
              if (batteriesResponse) {
                allBatteries.push(...batteriesResponse)
              }

              const linesResponse = await cultivationLinesService.getAll({ sectorId: sector.id })
              if (linesResponse) {
                allCultivationLines.push(...linesResponse)
              }
            } catch (error) {
              console.warn(`Error loading batteries/lines for sector ${sector.id}:`, error)
            }
          }

          setSeedings(allSeedings)
          setBatteries(allBatteries)
          setCultivationLines(allCultivationLines)
        } catch (error) {
          console.error('Error loading report data:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadAllData()
  }, [user?.id])

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  // Función para formatear fechas
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE')
  }

  // Funciones helper para siembras
  const getAllConversionsFromConchitas = (conchitas) => {
    const manojos = Math.floor(conchitas / 100)
    const mallas = Math.floor(manojos / 10)
    return { conchitas, manojos, mallas }
  }

  const calculateTimeElapsed = (startDate) => {
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = Math.abs(now - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) {
      return `${diffDays} día${diffDays !== 1 ? 's' : ''}`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      const remainingDays = diffDays % 30
      return remainingDays > 0
        ? `${months} mes${months !== 1 ? 'es' : ''}, ${remainingDays} día${remainingDays !== 1 ? 's' : ''}`
        : `${months} mes${months !== 1 ? 'es' : ''}`
    } else {
      const years = Math.floor(diffDays / 365)
      const remainingMonths = Math.floor((diffDays % 365) / 30)
      return remainingMonths > 0
        ? `${years} año${years !== 1 ? 's' : ''}, ${remainingMonths} mes${remainingMonths !== 1 ? 'es' : ''}`
        : `${years} año${years !== 1 ? 's' : ''}`
    }
  }

  const calculateDaysToHarvest = (harvestDate) => {
    if (!harvestDate) return 'No especificada'
    const harvest = new Date(harvestDate)
    const now = new Date()
    const diffTime = harvest - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''} atrasado`
    } else if (diffDays === 0) {
      return 'Hoy'
    } else {
      return `${diffDays} día${diffDays !== 1 ? 's' : ''}`
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      'seeded': 'bg-blue-100 text-blue-800',
      'growing': 'bg-green-100 text-green-800',
      'ready': 'bg-yellow-100 text-yellow-800',
      'harvested': 'bg-gray-100 text-gray-800',
      'empty': 'bg-purple-100 text-purple-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const statusLabels = {
      'seeded': 'Sembrado',
      'growing': 'Creciendo',
      'ready': 'Listo',
      'harvested': 'Cosechado',
      'empty': 'Libre'
    }
    return statusLabels[status] || status
  }

  // Función para exportar a Excel
  const handleExportExcel = () => {
    try {
      // Preparar datos de siembras para Excel
      const seedingsForExport = seedings.map(seeding => {
        const getBatteryLetter = (batteryId) => {
          const battery = batteries.find(b => b.id === batteryId)
          return battery?.letter || '?'
        }

        const getLineInfo = (lineId) => {
          const line = cultivationLines.find(l => l.id === lineId)
          return line || null
        }

        let batteryLineInfo = 'Sin especificar'
        if (seeding.multipleLines && seeding.multipleLines.length > 0) {
          batteryLineInfo = seeding.multipleLines.map(l => {
            const line = getLineInfo(l.lineId)
            if (line && seeding.batteryId) {
              const batteryLetter = getBatteryLetter(seeding.batteryId)
              return `${batteryLetter}-${line.lineNumber}`
            }
            return l.lineName || 'Sin especificar'
          }).join(', ')
        } else if (seeding.batteryId && seeding.lineId) {
          const batteryLetter = getBatteryLetter(seeding.batteryId)
          const line = getLineInfo(seeding.lineId)
          if (line) {
            batteryLineInfo = `${batteryLetter}-${line.lineNumber}`
          }
        } else if (seeding.lineName) {
          batteryLineInfo = seeding.lineName
        }

        const currentConversions = getAllConversionsFromConchitas(seeding.currentQuantity || 0)

        return {
          'Sector': seeding.sectorName,
          'Fecha Siembra': new Date(seeding.entryDate).toLocaleDateString('es-PE'),
          'Origen': seeding.origin,
          'Sistema de Cultivo': seeding.cultivationSystem || 'Cultivo suspendido',
          'Batería-Línea': batteryLineInfo,
          'N° de boyas': seeding.buoysUsed || 0,
          'Cantidad Actual (Manojos)': currentConversions.manojos.toLocaleString(),
          'Cantidad Actual (Mallas)': currentConversions.mallas,
          'Cantidad Actual (Conchas)': currentConversions.conchitas.toLocaleString(),
          'Mortalidad Esperada': `${seeding.expectedMonthlyMortality}% mensual`,
          'Inversión': seeding.cost,
          'Tiempo Transcurrido': calculateTimeElapsed(seeding.entryDate),
          'Días para Cosecha': seeding.projectedHarvestDate ? calculateDaysToHarvest(seeding.projectedHarvestDate) : 'No especificada',
          'Cosecha Proyectada': seeding.projectedHarvestDate ? new Date(seeding.projectedHarvestDate).toLocaleDateString('es-PE') : 'No especificada',
          'Estado': getStatusText(seeding.status)
        }
      })

      // Crear workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(seedingsForExport)

      // Agregar hoja
      XLSX.utils.book_append_sheet(wb, ws, "Reporte de Siembras")

      // Descargar archivo
      const fileName = `reporte_siembras_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Error al exportar el reporte a Excel. Por favor, inténtalo nuevamente.')
    }
  }

  // Manejo de filtros
  const handleFilterChange = (key, value) => {
    setReportFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSectionToggle = (section, enabled) => {
    setReportFilters(prev => ({
      ...prev,
      reportSections: {
        ...prev.reportSections,
        [section]: enabled
      }
    }))
  }

  const toggleExpandSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Función para manejar la exportación a PDF
  const handleExportPDF = () => {
    exportToPDF({
      reportFilters,
      dashboardMetrics,
      filteredData,
      cashFlowData: { months: [] }, // Datos vacíos por defecto
      formatDate,
      formatCurrency
    })
  }  // Función para exportar a CSV
  const exportToCSV = () => {
    try {
      const csvData = []
      
      // Header del reporte
      csvData.push(['REPORTE INTEGRAL DE MARICULTURA'])
      csvData.push([`Período: ${formatDate(reportFilters.dateFrom)} - ${formatDate(reportFilters.dateTo)}`])
      csvData.push([`Generado: ${new Date().toLocaleString('es-PE')}`])
      csvData.push([]) // Línea vacía
      
      // Dashboard metrics
      if (dashboardMetrics && reportFilters.reportSections.dashboard) {
        csvData.push(['=== DASHBOARD GENERAL ==='])
        csvData.push(['Métrica', 'Valor'])
        csvData.push(['Ingresos Totales', formatCurrency(dashboardMetrics.totalRevenue)])
        csvData.push(['Gastos Totales', formatCurrency(dashboardMetrics.totalExpenses)])
        csvData.push(['Utilidad Neta', formatCurrency(dashboardMetrics.netProfit)])
        csvData.push(['Margen de Utilidad (%)', dashboardMetrics.profitMargin.toFixed(1)])
        csvData.push(['Cosechas Completadas', dashboardMetrics.completedHarvests])
        csvData.push(['Total Cosechado', dashboardMetrics.totalHarvested.toLocaleString()])
        csvData.push(['Lotes Activos', dashboardMetrics.activeLots])
        csvData.push(['Lotes Libres', dashboardMetrics.freeLots])
        csvData.push([]) // Línea vacía
      }
      
      // Estado de Cosechas
      if (reportFilters.reportSections.harvests) {
        csvData.push(['=== ESTADO DE COSECHAS ==='])
        csvData.push(['Fecha', 'Sector', 'Cantidad', 'Estado', 'Ingreso Estimado'])
        filteredData.harvests.forEach(harvest => {
          const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
          let estimatedRevenue = 0
          if (harvest.sizeDistribution && pricing.length) {
            Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
              const price = pricing.find(p => p.sizeCategory === size && p.isActive)
              if (price && quantity) {
                estimatedRevenue += quantity * price.pricePerUnit
              }
            })
          }
          
          csvData.push([
            formatDate(harvest.actualDate || harvest.plannedDate),
            sector?.name || 'N/A',
            (harvest.actualQuantity || harvest.estimatedQuantity || 0).toLocaleString(),
            harvest.status === 'completed' ? 'Completada' :
            harvest.status === 'planned' ? 'Planificada' :
            harvest.status === 'in_progress' ? 'En Progreso' : harvest.status,
            formatCurrency(estimatedRevenue)
          ])
        })
        csvData.push([]) // Línea vacía
      }
      
      // Cosechas Realizadas
      if (reportFilters.reportSections.completedHarvests) {
        const completedHarvests = filteredData.harvests.filter(h => h.status === 'completed')
        
        if (completedHarvests.length > 0) {
          csvData.push(['=== COSECHAS REALIZADAS ==='])
          
          // Métricas agregadas
          const totalHarvested = completedHarvests.reduce((sum, h) => sum + (h.actualQuantity || 0), 0)
          const totalRevenue = completedHarvests.reduce((sum, harvest) => {
            if (!harvest.sizeDistribution || !pricing.length) return sum
            let harvestRevenue = 0
            Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
              const price = pricing.find(p => p.sizeCategory === size && p.isActive)
              if (price && quantity) {
                harvestRevenue += quantity * price.pricePerUnit
              }
            })
            return sum + harvestRevenue
          }, 0)
          
          const harvestExpenses = filteredData.expenses.filter(e => e.category === 'harvest')
          const totalHarvestCosts = harvestExpenses.reduce((sum, e) => sum + e.amount, 0)
          
          csvData.push(['-- Resumen General --'])
          csvData.push(['Total Cosechas Completadas', completedHarvests.length])
          csvData.push(['Total Unidades Cosechadas', totalHarvested.toLocaleString()])
          csvData.push(['Ingresos Totales', formatCurrency(totalRevenue)])
          csvData.push(['Costos de Cosecha', formatCurrency(totalHarvestCosts)])
          csvData.push(['Margen Neto', formatCurrency(totalRevenue - totalHarvestCosts)])
          csvData.push(['Margen %', totalRevenue > 0 ? `${((totalRevenue - totalHarvestCosts) / totalRevenue * 100).toFixed(1)}%` : '0%'])
          csvData.push(['Promedio por Cosecha', formatCurrency(totalRevenue / completedHarvests.length)])
          csvData.push([]) // Línea vacía
          
          // Distribución por tallas
          const sizeDistribution = completedHarvests.reduce((acc, harvest) => {
            if (harvest.sizeDistribution) {
              Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                acc[size] = (acc[size] || 0) + quantity
              })
            }
            return acc
          }, {})
          
          csvData.push(['-- Distribución por Tallas --'])
          csvData.push(['Talla', 'Cantidad', 'Porcentaje'])
          ;['XS', 'S', 'M', 'L', 'XL'].forEach(size => {
            const quantity = sizeDistribution[size] || 0
            const percentage = totalHarvested > 0 ? (quantity / totalHarvested * 100) : 0
            csvData.push([size, quantity.toLocaleString(), `${percentage.toFixed(1)}%`])
          })
          csvData.push([]) // Línea vacía
          
          // Detalle de cosechas
          csvData.push(['-- Detalle de Cosechas Completadas --'])
          csvData.push(['Fecha', 'Sector', 'Lote', 'Cantidad', 'Tallas', 'Ingresos', 'Costos', 'Margen', 'Responsable'])
          
          completedHarvests
            .sort((a, b) => new Date(b.actualDate || b.plannedDate) - new Date(a.actualDate || a.plannedDate))
            .forEach(harvest => {
              const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
              const lot = sector?.lots?.find(l => l.id === harvest.lotId)
              
              let revenue = 0
              if (harvest.sizeDistribution && pricing.length) {
                Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                  const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                  if (price && quantity) {
                    revenue += quantity * price.pricePerUnit
                  }
                })
              }
              
              const harvestCosts = harvestExpenses
                .filter(e => e.harvestId === harvest.id || 
                            (e.date === harvest.actualDate && e.sectorId === harvest.sectorId))
                .reduce((sum, e) => sum + e.amount, 0)
              
              const margin = revenue - harvestCosts
              const marginPercent = revenue > 0 ? (margin / revenue * 100) : 0
              
              const tallasStr = harvest.sizeDistribution ? 
                Object.entries(harvest.sizeDistribution)
                  .filter(([, quantity]) => quantity > 0)
                  .map(([size, quantity]) => `${size}:${quantity}`)
                  .join(' / ') : 'N/A'
              
              csvData.push([
                formatDate(harvest.actualDate || harvest.plannedDate),
                sector?.name || 'N/A',
                lot ? lot.id.slice(-8).toUpperCase() : 'N/A',
                (harvest.actualQuantity || 0).toLocaleString(),
                tallasStr,
                formatCurrency(revenue),
                formatCurrency(harvestCosts),
                `${formatCurrency(margin)} (${marginPercent.toFixed(1)}%)`,
                harvest.responsibleName || 'N/A'
              ])
            })
          
          csvData.push([]) // Línea vacía
          
          // Análisis por sector
          const harvestsBySector = completedHarvests.reduce((acc, harvest) => {
            const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
            const sectorName = sector?.name || 'N/A'
            
            if (!acc[sectorName]) {
              acc[sectorName] = {
                count: 0,
                quantity: 0,
                revenue: 0
              }
            }
            
            acc[sectorName].count++
            acc[sectorName].quantity += harvest.actualQuantity || 0
            
            if (harvest.sizeDistribution && pricing.length) {
              Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                if (price && quantity) {
                  acc[sectorName].revenue += quantity * price.pricePerUnit
                }
              })
            }
            
            return acc
          }, {})
          
          csvData.push(['-- Rendimiento por Sector --'])
          csvData.push(['Sector', 'Cosechas', 'Cantidad Total', 'Ingresos Totales'])
          Object.entries(harvestsBySector)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .forEach(([sector, data]) => {
              csvData.push([
                sector,
                data.count,
                data.quantity.toLocaleString(),
                formatCurrency(data.revenue)
              ])
            })
          
          csvData.push([]) // Línea vacía
        }
      }
      
      
      // Convertir a CSV
      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n')
      
      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `reporte-maricultura-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      alert('Error al exportar el reporte a CSV. Por favor, inténtalo nuevamente.')
    }
  }

  // Datos filtrados por temporalidad
  const filteredData = useMemo(() => {
    const startDate = new Date(reportFilters.dateFrom)
    const endDate = new Date(reportFilters.dateTo)
    endDate.setHours(23, 59, 59, 999)

    // Para inversores: obtener los lotes donde tienen inversiones
    let investorLotIds = []
    if (user?.role === 'investor' && investments.length > 0) {
      investorLotIds = investments.map(investment => investment.lotId).filter(Boolean)
    }

    // Filtrar cosechas por fecha
    let filteredHarvests = harvestPlans.filter(plan => {
      const harvestDate = new Date(plan.actualDate || plan.plannedDate)
      const inDateRange = harvestDate >= startDate && harvestDate <= endDate
      const inSector = !reportFilters.sectorId || plan.sectorId === reportFilters.sectorId
      return inDateRange && inSector
    })

    // Para inversores: solo mostrar cosechas de sus siembras
    if (user?.role === 'investor' && investorLotIds.length > 0) {
      filteredHarvests = filteredHarvests.filter(harvest => 
        harvest.lotId && investorLotIds.includes(harvest.lotId)
      )
    }

    // Filtrar gastos por fecha
    let filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const inDateRange = expenseDate >= startDate && expenseDate <= endDate
      const inSector = !reportFilters.sectorId || expense.sectorId === reportFilters.sectorId
      return inDateRange && inSector
    })

    // Para inversores: solo mostrar gastos relacionados con sus siembras
    if (user?.role === 'investor' && investorLotIds.length > 0) {
      // Obtener los sectores donde el inversor tiene participación
      const investorSectorIds = []
      sectors.forEach(sector => {
        if (sector.lots && sector.lots.some(lot => investorLotIds.includes(lot.id))) {
          investorSectorIds.push(sector.id)
        }
      })
      
      filteredExpenses = filteredExpenses.filter(expense => 
        (expense.lotId && investorLotIds.includes(expense.lotId)) ||
        (expense.sectorId && investorSectorIds.includes(expense.sectorId))
      )
    }


    // Filtrar sectores
    let filteredSectors = reportFilters.sectorId 
      ? sectors.filter(s => s.id === reportFilters.sectorId)
      : sectors
      
    // Para inversores: solo mostrar sectores donde tienen inversiones
    if (user?.role === 'investor' && investorLotIds.length > 0) {
      filteredSectors = filteredSectors.filter(sector => 
        (sector.lots || []).some(lot => investorLotIds.includes(lot.id))
      ).map(sector => ({
        ...sector,
        lots: (sector.lots || []).filter(lot => investorLotIds.includes(lot.id))
      }))
    }

    return {
      harvests: filteredHarvests,
      expenses: filteredExpenses,
      sectors: filteredSectors,
      startDate,
      endDate
    }
  }, [harvestPlans, expenses, sectors, reportFilters, user?.role, investments])

  // Cálculos del dashboard general
  const dashboardMetrics = useMemo(() => {
    if (!filteredData.sectors.length) return null

    // Para inversores: usar métricas basadas en sus inversiones
    if (user?.role === 'investor') {
      // Calcular total invertido
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
      
      // Calcular total distribuido (retornos)
      const totalReturns = investments.reduce((sum, inv) => sum + (inv.totalDistributed || 0), 0)
      
      // Utilidad neta del inversor
      const netProfit = totalReturns - totalInvested
      
      // ROI promedio
      const avgROI = totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0
      
      return {
        totalRevenue: totalReturns, // Para inversores, "ingresos" son sus retornos
        totalExpenses: totalInvested, // Para inversores, "egresos" son sus inversiones  
        netProfit: netProfit,
        profitMargin: totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0,
        completedHarvests: investments.filter(inv => inv.status === 'completed').length,
        plannedHarvests: investments.filter(inv => inv.status === 'active').length,
        totalHarvested: 0, // Los inversores no cosechan directamente
        activeLots: investments.filter(inv => inv.status === 'active').length,
        freeLots: 0, // No aplica para inversores
        upcomingHarvests: 0, // Se calculará después
        totalLots: investments.length,
        currentStock: 0, // No aplica para inversores
        averageRevenuePerHarvest: investments.length > 0 ? totalReturns / investments.length : 0,
        avgROI: avgROI
      }
    }

    // Métricas de cosechas para maricultores
    const completedHarvests = filteredData.harvests.filter(h => h.status === 'completed')
    const plannedHarvests = filteredData.harvests.filter(h => h.status === 'planned')
    
    
    // Ingresos totales
    const totalRevenue = completedHarvests.reduce((sum, harvest) => {
      if (!harvest.sizeDistribution || !pricing.length) return sum
      let harvestRevenue = 0
      Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
        const price = pricing.find(p => p.sizeCategory === size && p.isActive)
        if (price && quantity) {
          harvestRevenue += quantity * price.pricePerUnit
        }
      })
      return sum + harvestRevenue
    }, 0)

    // Gastos totales
    const totalExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Utilidad neta
    const netProfit = totalRevenue - totalExpenses

    // Cantidad total cosechada
    const totalHarvested = completedHarvests.reduce((sum, harvest) => 
      sum + (harvest.actualQuantity || 0), 0
    )

    // Lotes activos y libres
    const allLots = filteredData.sectors.flatMap(sector => sector.lots || [])
    const activeLots = allLots.filter(lot => lot.status !== 'harvested' && lot.status !== 'empty')
    const freeLots = allLots.filter(lot => lot.status === 'empty' || !lot.status)

    // Próximas cosechas (en los próximos 60 días)
    const today = new Date()
    const next60Days = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000))
    const upcomingHarvests = allLots.filter(lot => {
      if (!lot.projectedHarvestDate) return false
      const projectedDate = new Date(lot.projectedHarvestDate)
      return projectedDate >= today && projectedDate <= next60Days && lot.status !== 'harvested'
    })

    // Stock de inventario actual (removido)
    const currentStock = 0

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0,
      completedHarvests: completedHarvests.length,
      plannedHarvests: plannedHarvests.length,
      totalHarvested,
      activeLots: activeLots.length,
      freeLots: freeLots.length,
      upcomingHarvests: upcomingHarvests.length,
      totalLots: allLots.length,
      currentStock,
      averageRevenuePerHarvest: completedHarvests.length > 0 ? totalRevenue / completedHarvests.length : 0
    }
  }, [filteredData, pricing])

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando datos para reportes..." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Reportes Integrales</h1>
          <p className="text-gray-600 mt-1">
            Análisis completo de operaciones, inventario y estado financiero
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            onClick={() => window.print()}
          >
            🖨️ Imprimir Reporte
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            onClick={exportToCSV}
            disabled={loading}
          >
            📤 Exportar CSV
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            onClick={handleExportPDF}
            disabled={loading}
          >
            📄 Exportar PDF
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            onClick={handleExportExcel}
            disabled={loading}
          >
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros de Reporte */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🔍 Configuración del Reporte</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha inicio
            </label>
            <input
              type="date"
              className="input-field"
              value={reportFilters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha fin
            </label>
            <input
              type="date"
              className="input-field"
              value={reportFilters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector (opcional)
            </label>
            <select
              className="input-field"
              value={reportFilters.sectorId}
              onChange={(e) => handleFilterChange('sectorId', e.target.value)}
            >
              <option value="">Todos los sectores</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de secciones del reporte */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Secciones a incluir:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
{Object.entries({
              dashboard: 'Dashboard General',
              cashFlow: 'Flujo de Movimientos',
              harvests: 'Estado de Cosechas',
              seedings: 'Estado de Siembras',
              productionReport: 'Reporte de Producción',
              nextHarvests: 'Próximas Cosechas',
              freeLots: 'Lotes Libres',
              completedHarvests: 'Cosechas Realizadas'
            }).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reportFilters.reportSections[key]}
                  onChange={(e) => handleSectionToggle(key, e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard General */}
      {reportFilters.reportSections.dashboard && dashboardMetrics && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🏢 Dashboard General</h2>
            <button 
              onClick={() => toggleExpandSection('dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.dashboard ? '📖 Contraer' : '📑 Expandir'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Ingresos Totales"
              value={formatCurrency(dashboardMetrics.totalRevenue)}
              subtitle={`Período: ${formatDate(reportFilters.dateFrom)} - ${formatDate(reportFilters.dateTo)}`}
              icon="💰"
              color="green"
            />
            <StatCard
              title="Gastos Totales"
              value={formatCurrency(dashboardMetrics.totalExpenses)}
              subtitle="Operacionales + Cosechas"
              icon="💸"
              color="red"
            />
            <StatCard
              title="Utilidad Neta"
              value={formatCurrency(dashboardMetrics.netProfit)}
              subtitle={`Margen: ${dashboardMetrics.profitMargin.toFixed(1)}%`}
              icon="📈"
              color={dashboardMetrics.netProfit >= 0 ? "blue" : "red"}
            />
            <StatCard
              title="Cosechas Completadas"
              value={dashboardMetrics.completedHarvests}
              subtitle={`${dashboardMetrics.totalHarvested.toLocaleString()} unidades`}
              icon="🐚"
              color="secondary"
            />
          </div>

          {expandedSections.dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Lotes Activos"
                value={dashboardMetrics.activeLots}
                subtitle={`de ${dashboardMetrics.totalLots} totales`}
                icon="🌱"
                color="green"
              />
              <StatCard
                title="Lotes Libres"
                value={dashboardMetrics.freeLots}
                subtitle="Disponibles para siembra"
                icon="🏞️"
                color="gray"
              />
              <StatCard
                title="Próximas Cosechas"
                value={dashboardMetrics.upcomingHarvests}
                subtitle="En los próximos 60 días"
                icon="⏰"
                color="yellow"
              />
            </div>
          )}
        </div>
      )}

      {/* Sección de información del período */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm text-gray-600">
          <strong>Período del reporte:</strong> {formatDate(reportFilters.dateFrom)} - {formatDate(reportFilters.dateTo)}
          {reportFilters.sectorId && (
            <span className="ml-4">
              <strong>Sector:</strong> {sectors.find(s => s.id === reportFilters.sectorId)?.name || 'N/A'}
            </span>
          )}
          <span className="ml-4">
            <strong>Generado:</strong> {new Date().toLocaleString('es-PE')}
          </span>
        </div>
      </div>

      {/* Flujo de Movimientos Total */}
      {reportFilters.reportSections.cashFlow && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              💰 Flujo de Movimientos{user?.role === 'investor' ? ' de Siembras' : ' Total'}
            </h2>
            <button 
              onClick={() => toggleExpandSection('cashFlow')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.cashFlow ? '📖 Contraer' : '📑 Expandir'}
            </button>
          </div>
          
          {user?.role === 'investor' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Información para inversores:</strong> Esta sección muestra únicamente los ingresos y gastos relacionados con las siembras en las que usted ha invertido.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">+</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {user?.role === 'investor' ? 'Retornos' : 'Ingresos'}
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(dashboardMetrics?.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-green-700">
                    {user?.role === 'investor' 
                      ? `${dashboardMetrics?.completedHarvests || 0} inversiones completadas`
                      : `${dashboardMetrics?.completedHarvests || 0} cosechas completadas`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">-</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {user?.role === 'investor' ? 'Inversiones' : 'Egresos'}
                  </p>
                  <p className="text-xl font-bold text-red-900">
                    {formatCurrency(dashboardMetrics?.totalExpenses || 0)}
                  </p>
                  <p className="text-xs text-red-700">
                    {user?.role === 'investor' 
                      ? `${investments.length} inversiones activas`
                      : `${filteredData.expenses.length} transacciones`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className={`${dashboardMetrics?.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${dashboardMetrics?.netProfit >= 0 ? 'bg-blue-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">=</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${dashboardMetrics?.netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>Balance</p>
                  <p className={`text-xl font-bold ${dashboardMetrics?.netProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                    {formatCurrency(dashboardMetrics?.netProfit || 0)}
                  </p>
                  <p className={`text-xs ${dashboardMetrics?.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {dashboardMetrics?.profitMargin.toFixed(1) || 0}% margen
                  </p>
                </div>
              </div>
            </div>
          </div>

          {expandedSections.cashFlow && (
            <div className="space-y-6">
              {/* Tabla de movimientos */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">📋 Detalle de Movimientos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Ingresos de cosechas */}
                      {filteredData.harvests
                        .filter(h => h.status === 'completed')
                        .sort((a, b) => new Date(b.actualDate || b.plannedDate) - new Date(a.actualDate || a.plannedDate))
                        .slice(0, 10)
                        .map((harvest) => {
                          const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
                          let revenue = 0
                          if (harvest.sizeDistribution && pricing.length) {
                            Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                              const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                              if (price && quantity) {
                                revenue += quantity * price.pricePerUnit
                              }
                            })
                          }
                          
                          
                          return (
                            <tr key={`harvest-${harvest.id}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(harvest.actualDate || harvest.plannedDate)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Ingreso - Cosecha
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                Cosecha - {sector?.name || 'N/A'} ({(harvest.actualQuantity || 0).toLocaleString()} unidades)
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-right text-green-600">
                                +{formatCurrency(revenue)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {sector?.name || 'N/A'}
                              </td>
                            </tr>
                          )
                        })}

                      {/* Gastos */}
                      {filteredData.expenses
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 10)
                        .map((expense) => {
                          const sector = filteredData.sectors.find(s => s.id === expense.sectorId)
                          
                          return (
                            <tr key={`expense-${expense.id}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(expense.date)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  expense.category === 'operational' ? 'bg-red-100 text-red-800' :
                                  expense.category === 'harvest' ? 'bg-orange-100 text-orange-800' :
                                  expense.category === 'material' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  Egreso - {expense.category === 'operational' ? 'Operacional' :
                                           expense.category === 'harvest' ? 'Cosecha' :
                                           expense.category === 'material' ? 'Material' :
                                           expense.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {expense.description}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-right text-red-600">
                                -{formatCurrency(expense.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {sector?.name || 'N/A'}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
                {user?.role === 'investor' ? (
                  // Para inversores: mostrar sus inversiones y distribuciones
                  investments.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Mostrando movimientos de sus inversiones. Total de inversiones: {investments.length}
                    </p>
                  )
                ) : (
                  // Para maricultores: mostrar mensaje normal
                  (filteredData.harvests.filter(h => h.status === 'completed').length + filteredData.expenses.length) > 20 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Mostrando los últimos 20 movimientos. Total de movimientos en el período: {filteredData.harvests.filter(h => h.status === 'completed').length + filteredData.expenses.length}
                    </p>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado de Cosechas */}
      {reportFilters.reportSections.harvests && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🐚 Estado de Cosechas</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredData.harvests.filter(h => h.status === 'completed').length}
              </div>
              <div className="text-sm text-green-800">Completadas</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredData.harvests.filter(h => h.status === 'planned').length}
              </div>
              <div className="text-sm text-blue-800">Planificadas</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredData.harvests.filter(h => h.status === 'in_progress').length}
              </div>
              <div className="text-sm text-yellow-800">En Progreso</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {filteredData.harvests.length}
              </div>
              <div className="text-sm text-gray-800">Total</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ingreso Est.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.harvests
                  .sort((a, b) => new Date(b.actualDate || b.plannedDate) - new Date(a.actualDate || a.plannedDate))
                  .map((harvest) => {
                    const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
                    let estimatedRevenue = 0
                    if (harvest.sizeDistribution && pricing.length) {
                      Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                        const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                        if (price && quantity) {
                          estimatedRevenue += quantity * price.pricePerUnit
                        }
                      })
                    }

                    return (
                      <tr key={harvest.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(harvest.actualDate || harvest.plannedDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {sector?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {(harvest.actualQuantity || harvest.estimatedQuantity || 0).toLocaleString()} unidades
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            harvest.status === 'completed' ? 'bg-green-100 text-green-800' :
                            harvest.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                            harvest.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {harvest.status === 'completed' ? 'Completada' :
                             harvest.status === 'planned' ? 'Planificada' :
                             harvest.status === 'in_progress' ? 'En Progreso' :
                             harvest.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(estimatedRevenue)}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla Completa de Siembras */}
      {reportFilters.reportSections.seedings && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🌱 Reporte Completo de Siembras</h2>

          {seedings.length === 0 ? (
            <EmptyState
              title="No hay siembras registradas"
              message="No se encontraron siembras para mostrar en el reporte."
              icon="🌱"
              className="py-8"
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sector
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Siembra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Origen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sistema de Cultivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batería-Línea
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° de boyas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad Actual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mortalidad Esperada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inversión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiempo Transcurrido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Días para Cosecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cosecha Proyectada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {seedings.map((seeding) => (
                      <tr key={seeding.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{seeding.sectorName}</div>
                            <div className="text-xs text-gray-500">{seeding.sectorLocation || 'Sin ubicación'}</div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(seeding.entryDate).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {seeding.origin}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            seeding.cultivationSystem === 'Cultivo suspendido'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {seeding.cultivationSystem || 'Cultivo suspendido'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                          {(() => {
                            const getBatteryLetter = (batteryId) => {
                              const battery = batteries.find(b => b.id === batteryId)
                              return battery?.letter || '?'
                            }

                            const getLineInfo = (lineId) => {
                              const line = cultivationLines.find(l => l.id === lineId)
                              return line || null
                            }

                            if (seeding.multipleLines && seeding.multipleLines.length > 0) {
                              const lineElements = seeding.multipleLines.map((l, idx) => {
                                const line = getLineInfo(l.lineId)
                                if (line && seeding.batteryId) {
                                  const batteryLetter = getBatteryLetter(seeding.batteryId)
                                  const batteryLineName = `${batteryLetter}-${line.lineNumber}`
                                  return (
                                    <div key={idx} className="mb-1 last:mb-0">
                                      <div className="font-medium">{batteryLineName}</div>
                                    </div>
                                  )
                                }
                                return (
                                  <div key={idx} className="mb-1 last:mb-0">
                                    <div className="font-medium">{l.lineName || 'Sin especificar'}</div>
                                  </div>
                                )
                              })

                              if (seeding.multipleLines.length === 1) {
                                return lineElements[0]
                              } else {
                                return (
                                  <div>
                                    <div className="text-xs text-gray-600 mb-1">
                                      {seeding.multipleLines.length} líneas:
                                    </div>
                                    {lineElements}
                                  </div>
                                )
                              }
                            }

                            if (seeding.batteryId && seeding.lineId) {
                              const batteryLetter = getBatteryLetter(seeding.batteryId)
                              const line = getLineInfo(seeding.lineId)
                              if (line) {
                                const batteryLineName = `${batteryLetter}-${line.lineNumber}`
                                return (
                                  <div>
                                    <div className="font-medium">{batteryLineName}</div>
                                  </div>
                                )
                              }
                            }

                            if (seeding.lineName) {
                              return (
                                <div>
                                  <div className="font-medium">{seeding.lineName}</div>
                                </div>
                              )
                            }

                            return (
                              <div>
                                <div className="font-medium text-gray-400">Sin especificar</div>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {(() => {
                            const buoysUsed = seeding.buoysUsed || 0
                            if (buoysUsed === 0) {
                              let estimatedBuoys = 0
                              if (seeding.multipleLines && seeding.multipleLines.length > 0) {
                                seeding.multipleLines.forEach(line => {
                                  if (line.systems && line.systems.length > 0) {
                                    estimatedBuoys += line.systems.length * 2
                                  }
                                })
                              }
                              if (seeding.systems && seeding.systems.length > 0) {
                                estimatedBuoys = Math.max(estimatedBuoys, seeding.systems.length * 2)
                              }
                              if (estimatedBuoys === 0) {
                                const estimatedSystems = Math.ceil((seeding.currentQuantity || 0) / 10000)
                                estimatedBuoys = Math.max(1, estimatedSystems) * 2
                              }
                              return (
                                <div className="text-gray-400 italic">
                                  ~{estimatedBuoys.toLocaleString()}
                                  <div className="text-xs text-gray-300">
                                    estimado
                                  </div>
                                </div>
                              )
                            }
                            return (
                              <div className="font-medium text-blue-600">
                                {buoysUsed.toLocaleString()}
                                <div className="text-xs text-green-600">
                                  del inventario
                                </div>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            const currentQuantity = seeding.currentQuantity || 0
                            const initialQuantity = seeding.initialQuantity || 0
                            const currentConversions = getAllConversionsFromConchitas(currentQuantity)
                            const initialConversions = getAllConversionsFromConchitas(initialQuantity)

                            return (
                              <div>
                                <div className="font-medium">
                                  {currentConversions.manojos.toLocaleString()} manojos
                                </div>
                                <div className="text-xs text-gray-500">
                                  {currentConversions.mallas} mallas • {currentConversions.conchitas.toLocaleString()} conchas
                                </div>
                                <div className="text-xs text-gray-400">
                                  Inicial: {initialConversions.manojos.toLocaleString()} manojos • {initialConversions.mallas} mallas
                                </div>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {seeding.expectedMonthlyMortality}% mensual
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(seeding.cost)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">
                            {calculateTimeElapsed(seeding.entryDate)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className={seeding.projectedHarvestDate ? '' : 'text-gray-400'}>
                            {seeding.projectedHarvestDate
                              ? calculateDaysToHarvest(seeding.projectedHarvestDate)
                              : 'No especificada'
                            }
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {seeding.projectedHarvestDate
                            ? new Date(seeding.projectedHarvestDate).toLocaleDateString('es-PE')
                            : 'No especificada'
                          }
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(seeding.status)}`}>
                            {getStatusText(seeding.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reporte de Producción de Siembras */}
      {reportFilters.reportSections.productionReport && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Reporte de Producción de Siembras</h2>
          
          {(() => {
            // Obtener todos los lotes activos (sembrados)
            const activeLots = filteredData.sectors.flatMap(sector => 
              (sector.lots || []).filter(lot => 
                lot.status !== 'harvested' && 
                lot.status !== 'empty' && 
                lot.status
              ).map(lot => ({
                ...lot,
                sectorName: sector.name,
                sectorId: sector.id,
                cultivationLines: lot.cultivationLines || [],
                lastMonitoring: monitoringRecords
                  .filter(m => m.lotId === lot.id)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
              }))
            )

            if (activeLots.length === 0) {
              return (
                <EmptyState
                  title="No hay siembras activas"
                  message="No se encontraron siembras activas para mostrar en el reporte de producción."
                  icon="🌱"
                  className="py-8"
                />
              )
            }

            // Calcular totales generales
            const totalStats = activeLots.reduce((acc, lot) => {
              const monitoring = lot.lastMonitoring
              const estimatedQuantity = monitoring?.averageCount 
                ? monitoring.averageCount * (lot.cultivationLines?.length || 0) * 100
                : lot.currentQuantity || lot.initialQuantity || 0
              
              const estimatedManojos = Math.floor(estimatedQuantity / 100)
              
              acc.totalLots++
              acc.totalLines += lot.cultivationLines?.length || 0
              acc.totalQuantity += estimatedQuantity
              acc.totalManojos += estimatedManojos
              
              return acc
            }, { totalLots: 0, totalLines: 0, totalQuantity: 0, totalManojos: 0 })

            // Agrupar por sector para análisis
            const productionBySector = activeLots.reduce((acc, lot) => {
              if (!acc[lot.sectorName]) {
                acc[lot.sectorName] = {
                  lots: [],
                  totalLines: 0,
                  totalQuantity: 0,
                  totalManojos: 0
                }
              }
              
              const monitoring = lot.lastMonitoring
              const estimatedQuantity = monitoring?.averageCount 
                ? monitoring.averageCount * (lot.cultivationLines?.length || 0) * 100
                : lot.currentQuantity || lot.initialQuantity || 0
              
              acc[lot.sectorName].lots.push(lot)
              acc[lot.sectorName].totalLines += lot.cultivationLines?.length || 0
              acc[lot.sectorName].totalQuantity += estimatedQuantity
              acc[lot.sectorName].totalManojos += Math.floor(estimatedQuantity / 100)
              
              return acc
            }, {})

            return (
              <div>
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                      Siembras Activas
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {totalStats.totalLots}
                    </div>
                    <div className="text-xs text-blue-700">
                      Lotes en producción
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">
                      Líneas de Cultivo
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {totalStats.totalLines.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-700">
                      Total de líneas
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
                      Stock en Manojos
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {totalStats.totalManojos.toLocaleString()}
                    </div>
                    <div className="text-xs text-purple-700">
                      Manojos estimados
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-yellow-600 uppercase tracking-wider mb-1">
                      Stock Total
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {totalStats.totalQuantity.toLocaleString()}
                    </div>
                    <div className="text-xs text-yellow-700">
                      Unidades estimadas
                    </div>
                  </div>
                </div>

                {/* Resumen por Sector */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">📍 Producción por Sector</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(productionBySector)
                      .sort(([,a], [,b]) => b.totalManojos - a.totalManojos)
                      .map(([sectorName, data]) => (
                        <div key={sectorName} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{sectorName}</h4>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {data.lots.length} lote{data.lots.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Líneas:</span>
                              <span className="font-medium">{data.totalLines.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Manojos:</span>
                              <span className="font-medium text-purple-600">
                                {data.totalManojos.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Unidades:</span>
                              <span className="font-medium">{data.totalQuantity.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Tabla detallada */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">📋 Detalle de Producción por Lote</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sector
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Líneas de Cultivo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Promedio/Línea
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock (Manojos)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock (Unidades)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Último Muestreo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Origen Semilla
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeLots
                          .sort((a, b) => {
                            // Ordenar por sector y luego por cantidad estimada
                            if (a.sectorName !== b.sectorName) {
                              return a.sectorName.localeCompare(b.sectorName)
                            }
                            const aQuantity = a.lastMonitoring?.averageCount 
                              ? a.lastMonitoring.averageCount * (a.cultivationLines?.length || 0) * 100
                              : a.currentQuantity || 0
                            const bQuantity = b.lastMonitoring?.averageCount 
                              ? b.lastMonitoring.averageCount * (b.cultivationLines?.length || 0) * 100
                              : b.currentQuantity || 0
                            return bQuantity - aQuantity
                          })
                          .map((lot) => {
                            const monitoring = lot.lastMonitoring
                            const cultivationLines = lot.cultivationLines || []
                            const lineDetails = cultivationLines.length > 0
                              ? cultivationLines.map(line => line.name || line.code).join(', ')
                              : 'Sin líneas definidas'
                            
                            const averagePerLine = monitoring?.averageCount || 0
                            const estimatedQuantity = averagePerLine 
                              ? averagePerLine * cultivationLines.length * 100
                              : lot.currentQuantity || lot.initialQuantity || 0
                            const estimatedManojos = Math.floor(estimatedQuantity / 100)
                            
                            const statusColors = {
                              seeded: 'bg-blue-100 text-blue-800',
                              growing: 'bg-green-100 text-green-800',
                              ready: 'bg-yellow-100 text-yellow-800'
                            }
                            
                            return (
                              <tr key={lot.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="font-medium">{lot.sectorName}</div>
                                  <div className="text-xs text-gray-500">
                                    Lote: {lot.id.slice(-8).toUpperCase()}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="font-medium">{cultivationLines.length} líneas</div>
                                  <div className="text-xs text-gray-500" title={lineDetails}>
                                    {lineDetails.length > 30 
                                      ? lineDetails.substring(0, 30) + '...' 
                                      : lineDetails}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {monitoring ? (
                                    <div>
                                      <div className="font-medium">{averagePerLine.toLocaleString()}</div>
                                      <div className="text-xs text-gray-500">
                                        unidades/línea
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">Sin datos</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                                  {estimatedManojos.toLocaleString()} manojos
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {estimatedQuantity.toLocaleString()} u
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    statusColors[lot.status] || 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {lot.status === 'seeded' ? 'Sembrado' :
                                     lot.status === 'growing' ? 'Creciendo' :
                                     lot.status === 'ready' ? 'Listo' :
                                     lot.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {monitoring ? (
                                    <div>
                                      <div>{formatDate(monitoring.date)}</div>
                                      <div className="text-xs">
                                        {monitoring.mortality ? `Mortalidad: ${monitoring.mortality}%` : ''}
                                      </div>
                                    </div>
                                  ) : (
                                    'No registrado'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {lot.origin || 'N/A'}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen estadístico */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-3">📊 Análisis de Stock Actual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Por Estado de Cultivo:</h4>
                      <div className="space-y-1">
                        {['seeded', 'growing', 'ready'].map(status => {
                          const lotsInStatus = activeLots.filter(l => l.status === status)
                          const quantityInStatus = lotsInStatus.reduce((sum, lot) => {
                            const monitoring = lot.lastMonitoring
                            return sum + (monitoring?.averageCount 
                              ? monitoring.averageCount * (lot.cultivationLines?.length || 0) * 100
                              : lot.currentQuantity || lot.initialQuantity || 0)
                          }, 0)
                          const manojosInStatus = Math.floor(quantityInStatus / 100)
                          
                          if (lotsInStatus.length === 0) return null
                          
                          return (
                            <div key={status} className="flex justify-between text-blue-700">
                              <span>
                                {status === 'seeded' ? 'Sembrados' :
                                 status === 'growing' ? 'En Crecimiento' :
                                 'Listos para Cosecha'}:
                              </span>
                              <span className="font-medium">
                                {manojosInStatus.toLocaleString()} manojos ({lotsInStatus.length} lotes)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Proyección de Valor:</h4>
                      <div className="space-y-1 text-blue-700">
                        <div className="flex justify-between">
                          <span>Valor estimado (precio promedio):</span>
                          <span className="font-medium">
                            {formatCurrency(totalStats.totalManojos * 150)} {/* Asumiendo S/. 150 por manojo */}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Promedio por lote:</span>
                          <span className="font-medium">
                            {Math.floor(totalStats.totalManojos / totalStats.totalLots).toLocaleString()} manojos
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Promedio por línea:</span>
                          <span className="font-medium">
                            {Math.floor(totalStats.totalQuantity / totalStats.totalLines).toLocaleString()} unidades
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Inventario */}

      {/* Próximas Cosechas */}
      {reportFilters.reportSections.nextHarvests && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⏰ Próximas Cosechas</h2>
          
          {(() => {
            const today = new Date()
            const next60Days = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000))
            const upcomingLots = filteredData.sectors.flatMap(sector => 
              (sector.lots || []).filter(lot => {
                if (!lot.projectedHarvestDate) return false
                const projectedDate = new Date(lot.projectedHarvestDate)
                return projectedDate >= today && projectedDate <= next60Days && lot.status !== 'harvested'
              }).map(lot => ({
                ...lot,
                sectorName: sector.name,
                daysUntilHarvest: Math.ceil((new Date(lot.projectedHarvestDate) - today) / (1000 * 60 * 60 * 24))
              }))
            ).sort((a, b) => new Date(a.projectedHarvestDate) - new Date(b.projectedHarvestDate))

            if (upcomingLots.length === 0) {
              return (
                <EmptyState
                  title="No hay cosechas próximas"
                  message="No se encontraron lotes programados para cosechar en los próximos 60 días."
                  icon="⏰"
                  className="py-8"
                />
              )
            }

            return (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {upcomingLots.filter(lot => lot.daysUntilHarvest <= 7).length}
                    </div>
                    <div className="text-sm text-yellow-800">Esta semana</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {upcomingLots.filter(lot => lot.daysUntilHarvest <= 30).length}
                    </div>
                    <div className="text-sm text-orange-800">Este mes</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {upcomingLots.length}
                    </div>
                    <div className="text-sm text-blue-800">Total próximos 60 días</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Proyectada</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Restantes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Est.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {upcomingLots.map((lot) => (
                        <tr key={lot.id} className={`hover:bg-gray-50 ${
                          lot.daysUntilHarvest <= 7 ? 'bg-yellow-25' : 
                          lot.daysUntilHarvest <= 30 ? 'bg-orange-25' : ''
                        }`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {lot.sectorName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(lot.projectedHarvestDate)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              lot.daysUntilHarvest <= 7 ? 'bg-red-100 text-red-800' :
                              lot.daysUntilHarvest <= 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {lot.daysUntilHarvest} días
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {lot.currentQuantity?.toLocaleString() || 0} unidades
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              lot.status === 'ready' ? 'bg-green-100 text-green-800' :
                              lot.status === 'growing' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lot.status === 'ready' ? 'Listo' :
                               lot.status === 'growing' ? 'Creciendo' :
                               lot.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {lot.origin}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Cosechas Realizadas */}
      {reportFilters.reportSections.completedHarvests && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">✅ Cosechas Realizadas</h2>
          
          {(() => {
            // Filtrar solo cosechas completadas
            const completedHarvests = filteredData.harvests.filter(h => h.status === 'completed')
            
            if (completedHarvests.length === 0) {
              return (
                <EmptyState
                  title="No hay cosechas completadas"
                  message="No se encontraron cosechas completadas en el período seleccionado."
                  icon="🐚"
                  className="py-8"
                />
              )
            }

            // Calcular métricas agregadas
            const totalHarvested = completedHarvests.reduce((sum, h) => sum + (h.actualQuantity || 0), 0)
            const totalRevenue = completedHarvests.reduce((sum, harvest) => {
              if (!harvest.sizeDistribution || !pricing.length) return sum
              let harvestRevenue = 0
              Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                if (price && quantity) {
                  harvestRevenue += quantity * price.pricePerUnit
                }
              })
              return sum + harvestRevenue
            }, 0)

            // Calcular costos de cosecha
            const harvestExpenses = filteredData.expenses.filter(e => e.category === 'harvest')
            const totalHarvestCosts = harvestExpenses.reduce((sum, e) => sum + e.amount, 0)
            
            // Distribución por tallas
            const sizeDistribution = completedHarvests.reduce((acc, harvest) => {
              if (harvest.sizeDistribution) {
                Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                  acc[size] = (acc[size] || 0) + quantity
                })
              }
              return acc
            }, {})

            // Análisis por sector
            const harvestsBySector = completedHarvests.reduce((acc, harvest) => {
              const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
              const sectorName = sector?.name || 'N/A'
              
              if (!acc[sectorName]) {
                acc[sectorName] = {
                  count: 0,
                  quantity: 0,
                  revenue: 0
                }
              }
              
              acc[sectorName].count++
              acc[sectorName].quantity += harvest.actualQuantity || 0
              
              // Calcular ingresos por sector
              if (harvest.sizeDistribution && pricing.length) {
                Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                  const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                  if (price && quantity) {
                    acc[sectorName].revenue += quantity * price.pricePerUnit
                  }
                })
              }
              
              return acc
            }, {})

            // Calcular promedio de mortalidad (si hay datos de siembra inicial)
            const averageMortality = completedHarvests.reduce((acc, harvest) => {
              if (harvest.initialQuantity && harvest.actualQuantity) {
                const mortality = ((harvest.initialQuantity - harvest.actualQuantity) / harvest.initialQuantity) * 100
                acc.sum += mortality
                acc.count++
              }
              return acc
            }, { sum: 0, count: 0 })

            const avgMortalityRate = averageMortality.count > 0 ? 
              (averageMortality.sum / averageMortality.count) : null

            // Top 5 mejores cosechas
            const topHarvests = [...completedHarvests]
              .map(harvest => {
                let revenue = 0
                if (harvest.sizeDistribution && pricing.length) {
                  Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                    const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                    if (price && quantity) {
                      revenue += quantity * price.pricePerUnit
                    }
                  })
                }
                return { ...harvest, revenue }
              })
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 5)

            return (
              <div>
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">
                      Total Cosechas
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {completedHarvests.length}
                    </div>
                    <div className="text-xs text-green-700">
                      Período analizado
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                      Cantidad Total
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {totalHarvested.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-700">
                      Unidades cosechadas
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
                      Ingresos Totales
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(totalRevenue)}
                    </div>
                    <div className="text-xs text-purple-700">
                      Ventas generadas
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-yellow-600 uppercase tracking-wider mb-1">
                      Margen Neto
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {formatCurrency(totalRevenue - totalHarvestCosts)}
                    </div>
                    <div className="text-xs text-yellow-700">
                      {totalRevenue > 0 ? `${((totalRevenue - totalHarvestCosts) / totalRevenue * 100).toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                </div>

                {/* Distribución por tallas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-3">📊 Distribución por Tallas</h3>
                    <div className="space-y-2">
                      {['XS', 'S', 'M', 'L', 'XL'].map(size => {
                        const quantity = sizeDistribution[size] || 0
                        const percentage = totalHarvested > 0 ? (quantity / totalHarvested * 100) : 0
                        const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                        
                        return (
                          <div key={size} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                size === 'XL' ? 'bg-purple-100 text-purple-800' :
                                size === 'L' ? 'bg-blue-100 text-blue-800' :
                                size === 'M' ? 'bg-green-100 text-green-800' :
                                size === 'S' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {size}
                              </span>
                              <span className="text-sm text-gray-600">
                                {price ? `${formatCurrency(price.pricePerUnit)}/u` : 'N/A'}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{quantity.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-3">📈 Rendimiento por Sector</h3>
                    <div className="space-y-2">
                      {Object.entries(harvestsBySector)
                        .sort(([,a], [,b]) => b.revenue - a.revenue)
                        .slice(0, 5)
                        .map(([sector, data]) => (
                          <div key={sector} className="flex items-center justify-between p-2 rounded border">
                            <div>
                              <span className="font-medium text-sm">{sector}</span>
                              <div className="text-xs text-gray-500">
                                {data.count} cosecha{data.count !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">{formatCurrency(data.revenue)}</div>
                              <div className="text-xs text-gray-500">
                                {data.quantity.toLocaleString()} u
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Métricas adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Promedio por Cosecha
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(totalRevenue / completedHarvests.length)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(totalHarvested / completedHarvests.length).toLocaleString()} unidades
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      Costos de Cosecha
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(totalHarvestCosts)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {harvestExpenses.length} transacciones
                    </div>
                  </div>
                  
                  {avgMortalityRate !== null && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        Tasa de Mortalidad Prom.
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {avgMortalityRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        En cosechas con datos
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabla detallada de cosechas */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">📋 Detalle de Cosechas Completadas</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector/Lote</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distribución</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costos</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {completedHarvests
                          .sort((a, b) => new Date(b.actualDate || b.plannedDate) - new Date(a.actualDate || a.plannedDate))
                          .map((harvest) => {
                            const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
                            const lot = sector?.lots?.find(l => l.id === harvest.lotId)
                            
                            let revenue = 0
                            if (harvest.sizeDistribution && pricing.length) {
                              Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
                                const price = pricing.find(p => p.sizeCategory === size && p.isActive)
                                if (price && quantity) {
                                  revenue += quantity * price.pricePerUnit
                                }
                              })
                            }
                            
                            // Buscar costos asociados a esta cosecha
                            const harvestCosts = harvestExpenses
                              .filter(e => e.harvestId === harvest.id || 
                                          (e.date === harvest.actualDate && e.sectorId === harvest.sectorId))
                              .reduce((sum, e) => sum + e.amount, 0)
                            
                            const margin = revenue - harvestCosts
                            const marginPercent = revenue > 0 ? (margin / revenue * 100) : 0
                            
                            return (
                              <tr key={harvest.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {formatDate(harvest.actualDate || harvest.plannedDate)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div>{sector?.name || 'N/A'}</div>
                                  {lot && (
                                    <div className="text-xs text-gray-500">
                                      Lote: {lot.id.slice(-8).toUpperCase()}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {(harvest.actualQuantity || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {harvest.sizeDistribution && Object.entries(harvest.sizeDistribution)
                                      .filter(([, quantity]) => quantity > 0)
                                      .map(([size, quantity]) => (
                                        <span key={size} className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                                          {size}: {quantity.toLocaleString()}
                                        </span>
                                      ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-green-600 font-medium text-right">
                                  {formatCurrency(revenue)}
                                </td>
                                <td className="px-4 py-3 text-sm text-red-600 text-right">
                                  {formatCurrency(harvestCosts)}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-right">
                                  <div className={margin >= 0 ? 'text-blue-600' : 'text-red-600'}>
                                    {formatCurrency(margin)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {marginPercent.toFixed(1)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {harvest.responsibleName || 'N/A'}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top 5 mejores cosechas */}
                {topHarvests.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-3">🏆 Top 5 Mejores Cosechas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {topHarvests.map((harvest, index) => {
                        const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
                        return (
                          <div key={harvest.id} className={`border rounded-lg p-3 ${
                            index === 0 ? 'bg-yellow-50 border-yellow-300' :
                            index === 1 ? 'bg-gray-50 border-gray-300' :
                            index === 2 ? 'bg-orange-50 border-orange-300' :
                            'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-2xl">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(harvest.actualDate || harvest.plannedDate)}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {sector?.name || 'N/A'}
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(harvest.revenue)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(harvest.actualQuantity || 0).toLocaleString()} unidades
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Comparación con proyecciones */}
                {(() => {
                  const plannedRevenue = completedHarvests.reduce((sum, harvest) => {
                    if (!harvest.estimatedQuantity) return sum
                    // Estimar ingresos proyectados basados en cantidad estimada
                    const avgPricePerUnit = harvest.actualQuantity > 0 ? 
                      (harvest.revenue || 0) / harvest.actualQuantity : 100 // Precio promedio por defecto
                    return sum + (harvest.estimatedQuantity * avgPricePerUnit)
                  }, 0)
                  
                  const revenueVariance = plannedRevenue > 0 ? 
                    ((totalRevenue - plannedRevenue) / plannedRevenue * 100) : 0
                  
                  if (plannedRevenue > 0) {
                    return (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">📊 Análisis vs Proyecciones</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-blue-600">Ingresos Proyectados</div>
                            <div className="text-lg font-bold text-blue-900">{formatCurrency(plannedRevenue)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600">Ingresos Reales</div>
                            <div className="text-lg font-bold text-blue-900">{formatCurrency(totalRevenue)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600">Variación</div>
                            <div className={`text-lg font-bold ${revenueVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {revenueVariance >= 0 ? '+' : ''}{revenueVariance.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            )
          })()}
        </div>
      )}

      {/* Lotes Libres */}
      {reportFilters.reportSections.freeLots && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏞️ Lotes Libres</h2>
          
          {(() => {
            const freeLots = filteredData.sectors.flatMap(sector => 
              (sector.lots || []).filter(lot => lot.status === 'empty' || !lot.status).map(lot => ({
                ...lot,
                sectorName: sector.name,
                hectares: sector.hectares / (sector.lots?.length || 1) // Approximate hectares per lot
              }))
            )

            if (freeLots.length === 0) {
              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-yellow-600 text-4xl mb-3">⚠️</div>
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">No hay lotes libres disponibles</h3>
                    <p className="text-sm text-yellow-700">
                      Todos los lotes están actualmente en uso o han sido cosechados. 
                      Considera planificar nuevas siembras cuando se liberen espacios.
                    </p>
                  </div>
                </div>
              )
            }

            const totalFreeHectares = freeLots.reduce((sum, lot) => sum + (lot.hectares || 0), 0)

            return (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {freeLots.length}
                    </div>
                    <div className="text-sm text-green-800">Lotes Disponibles</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalFreeHectares.toFixed(1)}
                    </div>
                    <div className="text-sm text-blue-800">Hectáreas Libres</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {((freeLots.length / filteredData.sectors.flatMap(s => s.lots || []).length) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-purple-800">Capacidad Libre</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Lote</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hectáreas Aprox.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Cosecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidad Est.</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {freeLots.map((lot) => {
                        // Find last harvest for this lot
                        const lastHarvest = harvestPlans
                          .filter(h => h.lotId === lot.id && h.status === 'completed')
                          .sort((a, b) => new Date(b.actualDate || b.plannedDate) - new Date(a.actualDate || a.plannedDate))[0]
                        
                        // Estimate capacity based on sector averages
                        const estimatedCapacity = Math.floor((lot.hectares || 0.5) * 50000) // Rough estimate

                        return (
                          <tr key={lot.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {lot.sectorName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                              {lot.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {(lot.hectares || 0.5).toFixed(1)} ha
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {lastHarvest ? formatDate(lastHarvest.actualDate || lastHarvest.plannedDate) : 'Nunca'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Disponible
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              ~{estimatedCapacity.toLocaleString()} unidades
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Recomendaciones para Siembras</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>Capacidad total disponible:</strong> ~{freeLots.reduce((sum, lot) => sum + Math.floor((lot.hectares || 0.5) * 50000), 0).toLocaleString()} unidades</p>
                    <p>• <strong>Hectáreas disponibles:</strong> {totalFreeHectares.toFixed(1)} ha</p>
                    <p>• <strong>Sectores con mayor disponibilidad:</strong> {
                      Object.entries(
                        freeLots.reduce((acc, lot) => {
                          acc[lot.sectorName] = (acc[lot.sectorName] || 0) + 1
                          return acc
                        }, {})
                      )
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([sector, count]) => `${sector} (${count} lotes)`)
                      .join(', ')
                    }</p>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default ReportsPage