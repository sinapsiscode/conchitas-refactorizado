import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { UI_TEXTS } from '../../constants/ui'

// Report configuration from constants
const REPORT_CONFIG = {
  company: {
    name: 'Sistema de Cultivo de Conchas de Abanico',
    address: 'Piura-Sechura, Perú',
    phone: '+51 999 999 999',
    email: 'info@conchas.com',
    logo: '🐚'
  },
  colors: {
    primary: '#1e40af',
    secondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#1f2937',
    lightGray: '#f3f4f6'
  },
  fonts: {
    regular: 'helvetica',
    bold: 'helvetica'
  }
}

export class ReportService {
  constructor() {
    this.config = REPORT_CONFIG
  }

  // Generate Investment Report PDF for Investor
  generateInvestmentReportPDF(investorData, investments, distributions, summary) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    let yPosition = 20

    // Header
    this.addPDFHeader(doc, yPosition)
    yPosition += 40

    // Report Title
    doc.setFontSize(18)
    doc.setTextColor(this.config.colors.primary)
    doc.text('Reporte de Inversiones', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Investor Information
    doc.setFontSize(12)
    doc.setTextColor(this.config.colors.text)
    doc.text(`Inversor: ${investorData.firstName} ${investorData.lastName}`, 20, yPosition)
    yPosition += 7
    doc.text(`Email: ${investorData.email}`, 20, yPosition)
    yPosition += 7
    doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString('es-PE')}`, 20, yPosition)
    yPosition += 15

    // Summary Section
    doc.setFontSize(14)
    doc.setTextColor(this.config.colors.primary)
    doc.text('Resumen General', 20, yPosition)
    yPosition += 10

    const summaryData = [
      ['Total Invertido', `S/ ${this.formatCurrency(summary.totalInvested)}`],
      ['Retornos Totales', `S/ ${this.formatCurrency(summary.totalReturned || 0)}`],
      ['Ganancia Neta', `S/ ${this.formatCurrency(summary.netProfit || 0)}`],
      ['ROI Promedio', `${(summary.averageROI || 0).toFixed(2)}%`],
      ['Inversiones Activas', summary.activeInvestments],
      ['Inversiones Completadas', summary.completedInvestments]
    ]

    doc.autoTable({
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: this.config.colors.primary,
        textColor: '#ffffff'
      },
      styles: {
        fontSize: 10
      }
    })

    yPosition = doc.lastAutoTable.finalY + 15

    // Investments Detail
    if (investments && investments.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(this.config.colors.primary)
      doc.text('Detalle de Inversiones', 20, yPosition)
      yPosition += 10

      const investmentData = investments.map(inv => [
        new Date(inv.investmentDate).toLocaleDateString('es-PE'),
        inv.lotName || 'N/A',
        `S/ ${this.formatCurrency(inv.amount)}`,
        `${inv.percentage.toFixed(2)}%`,
        `S/ ${this.formatCurrency(inv.totalDistributed || 0)}`,
        this.getStatusText(inv.status)
      ])

      doc.autoTable({
        startY: yPosition,
        head: [['Fecha', 'Lote', 'Monto', 'Participación', 'Retornos', 'Estado']],
        body: investmentData,
        theme: 'striped',
        headStyles: {
          fillColor: this.config.colors.primary,
          textColor: '#ffffff'
        },
        styles: {
          fontSize: 9
        }
      })

      yPosition = doc.lastAutoTable.finalY + 15
    }

    // Distributions History
    if (distributions && distributions.length > 0 && yPosition < pageHeight - 60) {
      doc.setFontSize(14)
      doc.setTextColor(this.config.colors.primary)
      doc.text('Historial de Distribuciones', 20, yPosition)
      yPosition += 10

      const distributionData = distributions.slice(0, 10).map(dist => [
        new Date(dist.distributionDate).toLocaleDateString('es-PE'),
        `S/ ${this.formatCurrency(dist.originalInvestment)}`,
        `S/ ${this.formatCurrency(dist.distributedAmount)}`,
        `${dist.roi.toFixed(2)}%`,
        this.getPaymentStatus(dist.status)
      ])

      doc.autoTable({
        startY: yPosition,
        head: [['Fecha', 'Inversión', 'Retorno', 'ROI', 'Estado']],
        body: distributionData,
        theme: 'striped',
        headStyles: {
          fillColor: this.config.colors.secondary,
          textColor: '#ffffff'
        },
        styles: {
          fontSize: 9
        }
      })
    }

    // Footer
    this.addPDFFooter(doc)

    // Save the PDF
    const fileName = `reporte_inversiones_${investorData.firstName}_${investorData.lastName}_${new Date().getTime()}.pdf`
    doc.save(fileName)

    return fileName
  }

  // Generate Excel Report for Investor
  generateInvestmentReportExcel(investorData, investments, distributions, summary) {
    const wb = XLSX.utils.book_new()

    // Summary Sheet
    const summarySheet = this.createSummarySheet(investorData, summary)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen')

    // Investments Sheet
    if (investments && investments.length > 0) {
      const investmentsSheet = this.createInvestmentsSheet(investments)
      XLSX.utils.book_append_sheet(wb, investmentsSheet, 'Inversiones')
    }

    // Distributions Sheet
    if (distributions && distributions.length > 0) {
      const distributionsSheet = this.createDistributionsSheet(distributions)
      XLSX.utils.book_append_sheet(wb, distributionsSheet, 'Distribuciones')
    }

    // Financial Analysis Sheet
    const analysisSheet = this.createFinancialAnalysisSheet(investments, distributions, summary)
    XLSX.utils.book_append_sheet(wb, analysisSheet, 'Análisis Financiero')

    // Generate and download
    const fileName = `reporte_inversiones_${investorData.firstName}_${investorData.lastName}_${new Date().getTime()}.xlsx`
    XLSX.writeFile(wb, fileName)

    return fileName
  }

  // Helper: Create Summary Sheet for Excel
  createSummarySheet(investorData, summary) {
    const data = [
      ['REPORTE DE INVERSIONES'],
      [],
      ['Información del Inversor'],
      ['Nombre:', `${investorData.firstName} ${investorData.lastName}`],
      ['Email:', investorData.email],
      ['Fecha del Reporte:', new Date().toLocaleDateString('es-PE')],
      [],
      ['Resumen Financiero'],
      ['Total Invertido:', summary.totalInvested || 0],
      ['Retornos Totales:', summary.totalReturned || 0],
      ['Ganancia Neta:', summary.netProfit || 0],
      ['ROI Promedio:', `${(summary.averageROI || 0).toFixed(2)}%`],
      [],
      ['Estado de Inversiones'],
      ['Inversiones Activas:', summary.activeInvestments || 0],
      ['Inversiones Completadas:', summary.completedInvestments || 0],
      ['Total de Inversiones:', (summary.activeInvestments + summary.completedInvestments) || 0]
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  // Helper: Create Investments Sheet for Excel
  createInvestmentsSheet(investments) {
    const headers = [
      'Fecha Inversión',
      'Lote',
      'Sector',
      'Monto Invertido',
      'Porcentaje',
      'Retorno Esperado',
      'Retorno Actual',
      'ROI',
      'Estado',
      'Notas'
    ]

    const data = investments.map(inv => [
      new Date(inv.investmentDate).toLocaleDateString('es-PE'),
      inv.lotName || 'N/A',
      inv.sectorName || 'N/A',
      inv.amount,
      inv.percentage,
      inv.expectedReturn || 0,
      inv.totalDistributed || 0,
      ((inv.totalDistributed || 0) - inv.amount) / inv.amount * 100,
      this.getStatusText(inv.status),
      inv.notes || ''
    ])

    return XLSX.utils.aoa_to_sheet([headers, ...data])
  }

  // Helper: Create Distributions Sheet for Excel
  createDistributionsSheet(distributions) {
    const headers = [
      'Fecha Distribución',
      'Cosecha ID',
      'Lote',
      'Ingresos Cosecha',
      'Gastos Cosecha',
      'Ganancia Neta',
      'Porcentaje Inversión',
      'Monto Distribuido',
      'Inversión Original',
      'ROI',
      'Estado Pago',
      'Método Pago',
      'Fecha Pago'
    ]

    const data = distributions.map(dist => [
      new Date(dist.distributionDate).toLocaleDateString('es-PE'),
      dist.harvestPlanId,
      dist.lotName || 'N/A',
      dist.harvestRevenue,
      dist.harvestExpenses,
      dist.netProfit,
      dist.investmentPercentage,
      dist.distributedAmount,
      dist.originalInvestment,
      dist.roi,
      this.getPaymentStatus(dist.status),
      dist.paymentMethod || 'N/A',
      dist.paymentDate ? new Date(dist.paymentDate).toLocaleDateString('es-PE') : 'N/A'
    ])

    return XLSX.utils.aoa_to_sheet([headers, ...data])
  }

  // Helper: Create Financial Analysis Sheet
  createFinancialAnalysisSheet(investments, distributions, summary) {
    const monthlyAnalysis = this.calculateMonthlyAnalysis(investments, distributions)
    
    const headers = ['Mes', 'Inversiones', 'Retornos', 'Ganancia Neta', 'ROI Acumulado']
    const data = monthlyAnalysis.map(month => [
      month.period,
      month.invested,
      month.returned,
      month.netProfit,
      month.cumulativeROI
    ])

    return XLSX.utils.aoa_to_sheet([
      ['ANÁLISIS FINANCIERO MENSUAL'],
      [],
      headers,
      ...data,
      [],
      ['RESUMEN'],
      ['Total Invertido:', summary.totalInvested || 0],
      ['Total Retornado:', summary.totalReturned || 0],
      ['Ganancia Total:', summary.netProfit || 0],
      ['ROI Final:', `${(summary.averageROI || 0).toFixed(2)}%`]
    ])
  }

  // Helper: Calculate Monthly Analysis
  calculateMonthlyAnalysis(investments, distributions) {
    const monthlyData = {}
    let cumulativeInvested = 0
    let cumulativeReturned = 0

    // Process investments
    investments.forEach(inv => {
      const month = new Date(inv.investmentDate).toLocaleDateString('es-PE', { year: 'numeric', month: 'short' })
      if (!monthlyData[month]) {
        monthlyData[month] = { invested: 0, returned: 0 }
      }
      monthlyData[month].invested += inv.amount
    })

    // Process distributions
    distributions.forEach(dist => {
      const month = new Date(dist.distributionDate).toLocaleDateString('es-PE', { year: 'numeric', month: 'short' })
      if (!monthlyData[month]) {
        monthlyData[month] = { invested: 0, returned: 0 }
      }
      monthlyData[month].returned += dist.distributedAmount
    })

    // Convert to array and calculate cumulative values
    return Object.entries(monthlyData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([period, data]) => {
        cumulativeInvested += data.invested
        cumulativeReturned += data.returned
        const netProfit = cumulativeReturned - cumulativeInvested
        const cumulativeROI = cumulativeInvested > 0 
          ? ((cumulativeReturned - cumulativeInvested) / cumulativeInvested * 100).toFixed(2)
          : '0.00'

        return {
          period,
          invested: data.invested,
          returned: data.returned,
          netProfit,
          cumulativeROI
        }
      })
  }

  // Helper Methods
  addPDFHeader(doc, yPosition) {
    const pageWidth = doc.internal.pageSize.width

    // Logo and Company Name
    doc.setFontSize(24)
    doc.text(this.config.company.logo, 20, yPosition)
    
    doc.setFontSize(16)
    doc.setTextColor(this.config.colors.primary)
    doc.text(this.config.company.name, 35, yPosition)
    
    // Company Info
    doc.setFontSize(10)
    doc.setTextColor(this.config.colors.text)
    doc.text(this.config.company.address, pageWidth - 20, yPosition - 5, { align: 'right' })
    doc.text(this.config.company.phone, pageWidth - 20, yPosition, { align: 'right' })
    doc.text(this.config.company.email, pageWidth - 20, yPosition + 5, { align: 'right' })
    
    // Line separator
    doc.setDrawColor(this.config.colors.primary)
    doc.setLineWidth(0.5)
    doc.line(20, yPosition + 10, pageWidth - 20, yPosition + 10)
  }

  addPDFFooter(doc) {
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    
    doc.setFontSize(8)
    doc.setTextColor(this.config.colors.text)
    doc.text(
      `Generado el ${new Date().toLocaleString('es-PE')}`,
      20,
      pageHeight - 10
    )
    doc.text(
      `Página ${doc.internal.getNumberOfPages()}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  getStatusText(status) {
    const statusTexts = {
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }
    return statusTexts[status] || status
  }

  getPaymentStatus(status) {
    const statusTexts = {
      pending: 'Pendiente',
      paid: 'Pagado',
      cancelled: 'Cancelado'
    }
    return statusTexts[status] || status
  }
}

// Export singleton instance
export const reportService = new ReportService()