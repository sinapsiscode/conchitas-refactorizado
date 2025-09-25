import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const exportToPDF = ({
  reportFilters,
  dashboardMetrics,
  filteredData,
  cashFlowData,
  formatDate,
  formatCurrency
}) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margins = { top: 15, bottom: 15, left: 12, right: 12 }
    const contentWidth = pageWidth - margins.left - margins.right
    let yPosition = margins.top

    // Función auxiliar para verificar espacio y agregar página
    const checkPageSpace = (neededSpace) => {
      if (yPosition + neededSpace > pageHeight - margins.bottom) {
        doc.addPage()
        yPosition = margins.top
        return true
      }
      return false
    }

    // Función auxiliar para agregar título de sección
    const addSectionTitle = (title, color = [59, 130, 246], icon = '') => {
      checkPageSpace(15)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...color)
      doc.text(`${icon} ${title}`, margins.left, yPosition)
      yPosition += 8

      // Línea decorativa bajo el título
      doc.setDrawColor(...color)
      doc.setLineWidth(0.5)
      doc.line(margins.left, yPosition - 2, pageWidth - margins.right, yPosition - 2)
      yPosition += 5
    }

    // ENCABEZADO DEL REPORTE
    doc.setFontSize(18)
    doc.setTextColor(31, 41, 55)
    doc.setFont('helvetica', 'bold')
    doc.text('REPORTE INTEGRAL DE MARICULTURA', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 12

    // Información del período
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(75, 85, 99)
    doc.text(`Período: ${formatDate(reportFilters.dateFrom)} - ${formatDate(reportFilters.dateTo)}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // 1. SECCIÓN DASHBOARD - MÉTRICAS PRINCIPALES
    if (dashboardMetrics && reportFilters.reportSections.dashboard) {
      addSectionTitle('DASHBOARD - MÉTRICAS PRINCIPALES', [34, 197, 94], '📊')

      // Métricas en formato de tabla
      const metricsData = [
        ['Ingresos Totales', formatCurrency(dashboardMetrics.totalRevenue)],
        ['Gastos Totales', formatCurrency(dashboardMetrics.totalExpenses)],
        ['Utilidad Neta', formatCurrency(dashboardMetrics.netProfit)],
        ['Margen de Utilidad', `${dashboardMetrics.profitMargin?.toFixed(1) || 0}%`],
        ['Cosechas Completadas', dashboardMetrics.completedHarvests?.toString() || '0'],
        ['Cosechas Planificadas', dashboardMetrics.plannedHarvests?.toString() || '0'],
        ['Total Cosechado', dashboardMetrics.totalHarvested?.toLocaleString() || '0'],
        ['Lotes Activos', dashboardMetrics.activeLots?.toString() || '0'],
        ['Lotes Libres', dashboardMetrics.freeLots?.toString() || '0']
      ]

      doc.autoTable({
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.6 },
          1: { cellWidth: contentWidth * 0.4, halign: 'right' }
        },
        margin: { left: margins.left, right: margins.right }
      })
      yPosition = doc.lastAutoTable.finalY + 15
    }

    // 2. SECCIÓN ESTADO DE COSECHAS
    if (reportFilters.reportSections.harvests && filteredData?.harvests?.length > 0) {
      checkPageSpace(30)
      addSectionTitle('ESTADO DE COSECHAS', [59, 130, 246], '🌾')

      const harvestsData = filteredData.harvests.map(harvest => {
        const sector = filteredData.sectors?.find(s => s.id === harvest.sectorId)
        const statusText = harvest.status === 'completed' ? 'Completada' :
                          harvest.status === 'planned' ? 'Planificada' :
                          harvest.status === 'cancelled' ? 'Cancelada' : 'En Proceso'

        return [
          formatDate(harvest.actualDate || harvest.plannedDate),
          sector?.name || 'N/A',
          (harvest.actualQuantity || harvest.plannedQuantity || 0).toLocaleString(),
          statusText,
          harvest.responsibleName || 'N/A'
        ]
      })

      doc.autoTable({
        startY: yPosition,
        head: [['Fecha', 'Sector', 'Cantidad', 'Estado', 'Responsable']],
        body: harvestsData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.18 },
          1: { cellWidth: contentWidth * 0.25 },
          2: { cellWidth: contentWidth * 0.15, halign: 'right' },
          3: { cellWidth: contentWidth * 0.17, halign: 'center' },
          4: { cellWidth: contentWidth * 0.25 }
        },
        margin: { left: margins.left, right: margins.right }
      })
      yPosition = doc.lastAutoTable.finalY + 15
    }

    // 3. SECCIÓN ESTADO DE SIEMBRAS ACTIVAS
    if (reportFilters.reportSections.seedings) {
      checkPageSpace(30)
      addSectionTitle('ESTADO DE SIEMBRAS ACTIVAS', [168, 85, 247], '🌱')

      // Obtener lotes activos
      const allLots = filteredData?.sectors?.flatMap(sector => sector.lots || []) || []
      const activeLots = allLots.filter(lot => lot && lot.status !== 'harvested' && lot.status !== 'empty')

      if (activeLots.length > 0) {
        const seedingsData = activeLots.map(lot => [
          lot.origin || 'N/A',
          lot.sectorName || 'N/A',
          lot.entryDate ? formatDate(lot.entryDate) : 'N/D',
          lot.currentQuantity ? lot.currentQuantity.toLocaleString() : '0',
          lot.projectedHarvestDate ? formatDate(lot.projectedHarvestDate) : 'N/D',
          lot.status === 'seeded' ? 'Sembrado' :
          lot.status === 'growing' ? 'Creciendo' :
          lot.status === 'ready' ? 'Listo' : 'Activo'
        ])

        doc.autoTable({
          startY: yPosition,
          head: [['Origen', 'Sector', 'F. Siembra', 'Cantidad', 'F. Cosecha Proyectada', 'Estado']],
          body: seedingsData,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [168, 85, 247],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.18 },
            1: { cellWidth: contentWidth * 0.15 },
            2: { cellWidth: contentWidth * 0.15 },
            3: { cellWidth: contentWidth * 0.15, halign: 'right' },
            4: { cellWidth: contentWidth * 0.17 },
            5: { cellWidth: contentWidth * 0.2, halign: 'center' }
          },
          margin: { left: margins.left, right: margins.right }
        })
        yPosition = doc.lastAutoTable.finalY + 15
      } else {
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text('No hay siembras activas en el período seleccionado.', margins.left, yPosition)
        yPosition += 15
      }
    }

    // 4. SECCIÓN FLUJO DE MOVIMIENTOS
    if (reportFilters.reportSections.cashFlow) {
      checkPageSpace(30)
      addSectionTitle('FLUJO DE MOVIMIENTOS', [239, 68, 68], '💰')

      // Combinar ingresos y gastos
      const movements = []

      // Agregar ingresos de cosechas completadas
      if (filteredData?.harvests) {
        filteredData.harvests
          .filter(h => h.status === 'completed')
          .forEach(harvest => {
            const sector = filteredData.sectors?.find(s => s.id === harvest.sectorId)
            // Calcular ingreso estimado (esto debería venir de los datos reales)
            const estimatedRevenue = (harvest.actualQuantity || 0) * 15 // Precio promedio estimado

            movements.push({
              date: harvest.actualDate || harvest.plannedDate,
              type: 'Ingreso',
              description: `Cosecha - ${sector?.name || 'N/A'}`,
              amount: estimatedRevenue,
              sector: sector?.name || 'N/A'
            })
          })
      }

      // Agregar gastos
      if (filteredData?.expenses) {
        filteredData.expenses.forEach(expense => {
          const sector = filteredData.sectors?.find(s => s.id === expense.sectorId)
          movements.push({
            date: expense.date,
            type: 'Gasto',
            description: `${expense.category} - ${expense.description || ''}`,
            amount: -expense.amount,
            sector: sector?.name || 'N/A'
          })
        })
      }

      // Ordenar por fecha descendente
      movements.sort((a, b) => new Date(b.date) - new Date(a.date))

      if (movements.length > 0) {
        const movementsData = movements.slice(0, 20).map(movement => [
          formatDate(movement.date),
          movement.type,
          movement.description,
          movement.sector,
          formatCurrency(Math.abs(movement.amount))
        ])

        doc.autoTable({
          startY: yPosition,
          head: [['Fecha', 'Tipo', 'Descripción', 'Sector', 'Monto']],
          body: movementsData,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [239, 68, 68],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.15 },
            1: { cellWidth: contentWidth * 0.12, halign: 'center' },
            2: { cellWidth: contentWidth * 0.35 },
            3: { cellWidth: contentWidth * 0.18 },
            4: { cellWidth: contentWidth * 0.2, halign: 'right' }
          },
          margin: { left: margins.left, right: margins.right },
          didParseCell: function(data) {
            // Colorear filas según el tipo
            if (data.section === 'body') {
              const isIncome = movementsData[data.row.index][1] === 'Ingreso'
              if (isIncome) {
                data.cell.styles.textColor = [22, 163, 74] // Verde para ingresos
              } else {
                data.cell.styles.textColor = [239, 68, 68] // Rojo para gastos
              }
            }
          }
        })
        yPosition = doc.lastAutoTable.finalY + 15

        // Resumen financiero
        const totalIngresos = movements.filter(m => m.amount > 0).reduce((sum, m) => sum + m.amount, 0)
        const totalGastos = movements.filter(m => m.amount < 0).reduce((sum, m) => sum + Math.abs(m.amount), 0)
        const utilidadNeta = totalIngresos - totalGastos

        checkPageSpace(25)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(31, 41, 55)
        doc.text('RESUMEN FINANCIERO', margins.left, yPosition)
        yPosition += 8

        const summaryData = [
          ['Total Ingresos', formatCurrency(totalIngresos)],
          ['Total Gastos', formatCurrency(totalGastos)],
          ['Utilidad Neta', formatCurrency(utilidadNeta)]
        ]

        doc.autoTable({
          startY: yPosition,
          body: summaryData,
          theme: 'plain',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.6 },
            1: { cellWidth: contentWidth * 0.4, halign: 'right' }
          },
          margin: { left: margins.left, right: margins.right },
          didParseCell: function(data) {
            if (data.row.index === 2) { // Utilidad Neta
              const isPositive = utilidadNeta >= 0
              data.cell.styles.textColor = isPositive ? [22, 163, 74] : [239, 68, 68]
            }
          }
        })
        yPosition = doc.lastAutoTable.finalY + 15
      } else {
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text('No hay movimientos financieros en el período seleccionado.', margins.left, yPosition)
        yPosition += 15
      }
    }

    // 5. SECCIÓN REPORTE DE PRODUCCIÓN
    if (reportFilters.reportSections.productionReport) {
      checkPageSpace(30)
      addSectionTitle('REPORTE DE PRODUCCIÓN', [16, 185, 129], '📈')

      // Calcular métricas de producción por sector
      const productionBySector = {}

      if (filteredData?.harvests && filteredData?.sectors) {
        filteredData.harvests
          .filter(h => h.status === 'completed')
          .forEach(harvest => {
            const sector = filteredData.sectors.find(s => s.id === harvest.sectorId)
            const sectorName = sector?.name || 'Sin Sector'

            if (!productionBySector[sectorName]) {
              productionBySector[sectorName] = {
                harvests: 0,
                totalQuantity: 0,
                averageQuantity: 0
              }
            }

            productionBySector[sectorName].harvests++
            productionBySector[sectorName].totalQuantity += harvest.actualQuantity || 0
          })

        // Calcular promedios
        Object.keys(productionBySector).forEach(sector => {
          const data = productionBySector[sector]
          data.averageQuantity = data.harvests > 0 ? data.totalQuantity / data.harvests : 0
        })
      }

      if (Object.keys(productionBySector).length > 0) {
        const productionData = Object.entries(productionBySector).map(([sector, data]) => [
          sector,
          data.harvests.toString(),
          data.totalQuantity.toLocaleString(),
          Math.round(data.averageQuantity).toLocaleString()
        ])

        doc.autoTable({
          startY: yPosition,
          head: [['Sector', 'N° Cosechas', 'Total Producido', 'Promedio por Cosecha']],
          body: productionData,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.3 },
            1: { cellWidth: contentWidth * 0.2, halign: 'center' },
            2: { cellWidth: contentWidth * 0.25, halign: 'right' },
            3: { cellWidth: contentWidth * 0.25, halign: 'right' }
          },
          margin: { left: margins.left, right: margins.right }
        })
        yPosition = doc.lastAutoTable.finalY + 15
      } else {
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text('No hay datos de producción en el período seleccionado.', margins.left, yPosition)
        yPosition += 15
      }
    }

    // 6. SECCIÓN PRÓXIMAS COSECHAS
    if (reportFilters.reportSections.nextHarvests) {
      checkPageSpace(30)
      addSectionTitle('PRÓXIMAS COSECHAS', [245, 158, 11], '📅')

      // Obtener cosechas planificadas y próximas
      const upcomingHarvests = []

      if (filteredData?.harvests) {
        const today = new Date()
        const futureHarvests = filteredData.harvests
          .filter(h => h.status === 'planned' && new Date(h.plannedDate) >= today)
          .sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate))

        upcomingHarvests.push(...futureHarvests)
      }

      // También incluir lotes que están listos para cosechar
      if (filteredData?.sectors) {
        const readyLots = filteredData.sectors
          .flatMap(sector => (sector.lots || []).map(lot => ({ ...lot, sectorName: sector.name })))
          .filter(lot => lot.status === 'ready' && lot.projectedHarvestDate)
          .sort((a, b) => new Date(a.projectedHarvestDate) - new Date(b.projectedHarvestDate))

        readyLots.forEach(lot => {
          upcomingHarvests.push({
            plannedDate: lot.projectedHarvestDate,
            sectorId: null,
            sectorName: lot.sectorName,
            plannedQuantity: lot.currentQuantity,
            status: 'ready',
            responsibleName: 'Por asignar',
            origin: lot.origin
          })
        })
      }

      if (upcomingHarvests.length > 0) {
        const upcomingData = upcomingHarvests.slice(0, 15).map(harvest => {
          const sector = harvest.sectorName ||
            (filteredData?.sectors?.find(s => s.id === harvest.sectorId)?.name) || 'N/A'

          return [
            formatDate(harvest.plannedDate || harvest.projectedHarvestDate),
            sector,
            (harvest.plannedQuantity || harvest.currentQuantity || 0).toLocaleString(),
            harvest.status === 'ready' ? 'Listo para Cosechar' :
            harvest.status === 'planned' ? 'Planificada' : 'Pendiente',
            harvest.responsibleName || 'Por asignar'
          ]
        })

        doc.autoTable({
          startY: yPosition,
          head: [['Fecha Programada', 'Sector', 'Cantidad Estimada', 'Estado', 'Responsable']],
          body: upcomingData,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [245, 158, 11],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.18 },
            1: { cellWidth: contentWidth * 0.22 },
            2: { cellWidth: contentWidth * 0.18, halign: 'right' },
            3: { cellWidth: contentWidth * 0.22, halign: 'center' },
            4: { cellWidth: contentWidth * 0.2 }
          },
          margin: { left: margins.left, right: margins.right }
        })
        yPosition = doc.lastAutoTable.finalY + 15
      } else {
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text('No hay cosechas próximas programadas.', margins.left, yPosition)
        yPosition += 15
      }
    }

    // 7. SECCIÓN LOTES LIBRES
    if (reportFilters.reportSections.freeLots) {
      checkPageSpace(30)
      addSectionTitle('LOTES LIBRES DISPONIBLES', [107, 114, 128], '🏞️')

      // Obtener lotes libres/vacíos
      const freeLots = []

      if (filteredData?.sectors) {
        filteredData.sectors.forEach(sector => {
          if (sector.lots) {
            sector.lots
              .filter(lot => lot.status === 'empty' || !lot.status)
              .forEach(lot => {
                freeLots.push({
                  ...lot,
                  sectorName: sector.name,
                  sectorId: sector.id
                })
              })
          }
        })
      }

      if (freeLots.length > 0) {
        const freeLotsData = freeLots.map(lot => [
          lot.sectorName || 'N/A',
          lot.name || lot.id || 'N/A',
          lot.area || 'N/D',
          lot.depth || 'N/D',
          lot.lastHarvestDate ? formatDate(lot.lastHarvestDate) : 'Nunca',
          lot.lastCleaningDate ? formatDate(lot.lastCleaningDate) : 'N/D'
        ])

        doc.autoTable({
          startY: yPosition,
          head: [['Sector', 'Lote', 'Área', 'Profundidad', 'Última Cosecha', 'Última Limpieza']],
          body: freeLotsData,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [107, 114, 128],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.2 },
            1: { cellWidth: contentWidth * 0.15 },
            2: { cellWidth: contentWidth * 0.15, halign: 'center' },
            3: { cellWidth: contentWidth * 0.15, halign: 'center' },
            4: { cellWidth: contentWidth * 0.175 },
            5: { cellWidth: contentWidth * 0.175 }
          },
          margin: { left: margins.left, right: margins.right }
        })
        yPosition = doc.lastAutoTable.finalY + 15
      } else {
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text('No hay lotes libres disponibles en este momento.', margins.left, yPosition)
        yPosition += 15
      }
    }

    // 8. SECCIÓN COSECHAS REALIZADAS (HISTORIAL)
    if (reportFilters.reportSections.completedHarvests) {
      checkPageSpace(30)
      addSectionTitle('HISTORIAL DE COSECHAS REALIZADAS', [34, 197, 94], '✅')

      const completedHarvests = filteredData?.harvests?.filter(h => h.status === 'completed') || []

      if (completedHarvests.length > 0) {
        // Ordenar por fecha más reciente
        const sortedHarvests = completedHarvests
          .sort((a, b) => new Date(b.actualDate || b.plannedDate) - new Date(a.actualDate || a.plannedDate))
          .slice(0, 20) // Mostrar las últimas 20

        const completedData = sortedHarvests.map(harvest => {
          const sector = filteredData?.sectors?.find(s => s.id === harvest.sectorId)
          const plannedQuantity = harvest.plannedQuantity || 0
          const actualQuantity = harvest.actualQuantity || 0
          const efficiency = plannedQuantity > 0 ? ((actualQuantity / plannedQuantity) * 100).toFixed(1) : '0'

          return [
            formatDate(harvest.actualDate || harvest.plannedDate),
            sector?.name || 'N/A',
            plannedQuantity.toLocaleString(),
            actualQuantity.toLocaleString(),
            `${efficiency}%`,
            harvest.responsibleName || 'N/A'
          ]
        })

        doc.autoTable({
          startY: yPosition,
          head: [['Fecha', 'Sector', 'Planificado', 'Real', 'Eficiencia', 'Responsable']],
          body: completedData,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [34, 197, 94],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.15 },
            1: { cellWidth: contentWidth * 0.2 },
            2: { cellWidth: contentWidth * 0.15, halign: 'right' },
            3: { cellWidth: contentWidth * 0.15, halign: 'right' },
            4: { cellWidth: contentWidth * 0.12, halign: 'center' },
            5: { cellWidth: contentWidth * 0.23 }
          },
          margin: { left: margins.left, right: margins.right },
          didParseCell: function(data) {
            // Colorear la eficiencia según el porcentaje
            if (data.section === 'body' && data.column.index === 4) {
              const efficiency = parseFloat(completedData[data.row.index][4])
              if (efficiency >= 90) {
                data.cell.styles.textColor = [34, 197, 94] // Verde
              } else if (efficiency >= 70) {
                data.cell.styles.textColor = [245, 158, 11] // Amarillo
              } else {
                data.cell.styles.textColor = [239, 68, 68] // Rojo
              }
            }
          }
        })
        yPosition = doc.lastAutoTable.finalY + 15

        // Resumen de eficiencia
        const totalPlanned = completedHarvests.reduce((sum, h) => sum + (h.plannedQuantity || 0), 0)
        const totalActual = completedHarvests.reduce((sum, h) => sum + (h.actualQuantity || 0), 0)
        const overallEfficiency = totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(1) : '0'

        checkPageSpace(20)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(31, 41, 55)
        doc.text('RESUMEN DE EFICIENCIA', margins.left, yPosition)
        yPosition += 8

        const efficiencyData = [
          ['Total Planificado', totalPlanned.toLocaleString()],
          ['Total Cosechado', totalActual.toLocaleString()],
          ['Eficiencia General', `${overallEfficiency}%`]
        ]

        doc.autoTable({
          startY: yPosition,
          body: efficiencyData,
          theme: 'plain',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.6 },
            1: { cellWidth: contentWidth * 0.4, halign: 'right' }
          },
          margin: { left: margins.left, right: margins.right },
          didParseCell: function(data) {
            if (data.row.index === 2) { // Eficiencia General
              const efficiency = parseFloat(overallEfficiency)
              if (efficiency >= 90) {
                data.cell.styles.textColor = [34, 197, 94]
              } else if (efficiency >= 70) {
                data.cell.styles.textColor = [245, 158, 11]
              } else {
                data.cell.styles.textColor = [239, 68, 68]
              }
            }
          }
        })
        yPosition = doc.lastAutoTable.finalY + 15
      } else {
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text('No hay cosechas realizadas en el período seleccionado.', margins.left, yPosition)
        yPosition += 15
      }
    }

    // PIE DE PÁGINA
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margins.right, pageHeight - 5, { align: 'right' })
      doc.text('© Sistema de Gestión Maricultura - Reporte Confidencial', margins.left, pageHeight - 5)
    }

    // Guardar el PDF
    const fileName = `reporte_maricultura_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)

  } catch (error) {
    console.error('Error exportando a PDF:', error)
    alert('Error al exportar el reporte a PDF. Por favor, inténtalo nuevamente.')
  }
}