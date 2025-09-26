// Constantes de conversión para conchas de abanico
// NOTA: Los valores ahora se cargan desde la API

// Valores por defecto (se actualizarán desde la API)
export let CONVERSIONS = {
  CONCHITAS_POR_KG: 111,
  CONCHITAS_POR_MANOJO: 96,
  MANOJOS_POR_MALLA: 3,
  CONCHITAS_POR_MALLA: 288,
  KG_POR_MALLA: 2.6,
}

// Función para actualizar las conversiones desde la API
export const loadConversionsFromAPI = async () => {
  try {
    const response = await fetch('http://localhost:4077/conversionRates')
    if (response.ok) {
      const data = await response.json()
      if (data && data[0]) {
        const rates = data[0]
        CONVERSIONS = {
          CONCHITAS_POR_KG: rates.conchitasPorKg,
          CONCHITAS_POR_MANOJO: rates.conchitasPorManojo,
          MANOJOS_POR_MALLA: rates.manojosPorMalla,
          CONCHITAS_POR_MALLA: rates.conchitasPorMalla,
          KG_POR_MALLA: rates.kgPorMalla,
        }
      }
    }
  } catch (error) {
    console.error('Error cargando conversiones desde API:', error)
  }
}

// Cargar al iniciar
loadConversionsFromAPI()

// Función para convertir Kg a unidades de conchitas
export const kgToConchitas = (kg) => {
  return Math.round(kg * CONVERSIONS.CONCHITAS_POR_KG)
}

// Función para convertir conchitas a Kg
export const conchitasToKg = (conchitas) => {
  return (conchitas / CONVERSIONS.CONCHITAS_POR_KG).toFixed(2)
}

// Función para convertir Kg a manojos
export const kgToManojos = (kg) => {
  const conchitas = kgToConchitas(kg)
  return Math.round(conchitas / CONVERSIONS.CONCHITAS_POR_MANOJO)
}

// Función para convertir Kg a mallas
export const kgToMallas = (kg) => {
  return (kg / CONVERSIONS.KG_POR_MALLA).toFixed(2)
}

// Función para convertir manojos a mallas
export const manojosToMallas = (manojos) => {
  return (manojos / CONVERSIONS.MANOJOS_POR_MALLA).toFixed(2)
}

// Función para convertir conchas individuales a mallas
export const conchitasToMallas = (conchitas) => {
  return (conchitas / CONVERSIONS.CONCHITAS_POR_MALLA).toFixed(2)
}

// Función para obtener todas las conversiones de un peso en Kg
export const getAllConversions = (kg) => {
  return {
    kg: parseFloat(kg),
    conchitas: kgToConchitas(kg),
    manojos: kgToManojos(kg),
    mallas: kgToMallas(kg)
  }
}

// Función para obtener todas las conversiones desde conchitas individuales
export const getAllConversionsFromConchitas = (conchitas) => {
  return {
    conchitas: parseInt(conchitas),
    manojos: Math.floor(conchitas / CONVERSIONS.CONCHITAS_POR_MANOJO),
    mallas: conchitasToMallas(conchitas),
    kg: conchitasToKg(conchitas)
  }
}

// Función para convertir manojos a conchitas
export const manojosToConchitas = (manojos) => {
  return Math.round(manojos * CONVERSIONS.CONCHITAS_POR_MANOJO)
}

// Función para convertir manojos a Kg
export const manojosToKg = (manojos) => {
  const conchitas = manojosToConchitas(manojos)
  return conchitasToKg(conchitas)
}

// Función para convertir mallas a manojos
export const mallasToManojos = (mallas) => {
  return Math.round(mallas * CONVERSIONS.MANOJOS_POR_MALLA)
}

// Función para convertir mallas a conchitas
export const mallasToConchitas = (mallas) => {
  return Math.round(mallas * CONVERSIONS.CONCHITAS_POR_MALLA)
}

// Función para obtener todas las conversiones desde manojos
export const getAllConversionsFromManojos = (manojos) => {
  const conchitas = manojosToConchitas(manojos)
  return {
    manojos: parseInt(manojos),
    conchitas: conchitas,
    mallas: manojosToMallas(manojos),
    kg: parseFloat(manojosToKg(manojos))
  }
}

// Función para obtener todas las conversiones desde mallas
export const getAllConversionsFromMallas = (mallas) => {
  const conchitas = mallasToConchitas(mallas)
  const manojos = mallasToManojos(mallas)
  return {
    mallas: parseFloat(mallas),
    manojos: manojos,
    conchitas: conchitas,
    kg: parseFloat(conchitasToKg(conchitas))
  }
}

// Presentaciones y medidas se cargarán desde la API
export let DEFAULT_PRESENTATIONS = []
export let DEFAULT_MEASURES = {}

// Función para cargar presentaciones desde la API
export const loadPresentationsFromAPI = async () => {
  try {
    const [presentationsRes, measuresRes] = await Promise.all([
      fetch('http://localhost:4077/presentations'),
      fetch('http://localhost:4077/presentationMeasures')
    ])

    if (presentationsRes.ok) {
      const data = await presentationsRes.json()
      DEFAULT_PRESENTATIONS = data.map(p => ({
        id: p.code,
        name: p.name,
        editable: p.editable
      }))
    }

    if (measuresRes.ok) {
      const measures = await measuresRes.json()
      DEFAULT_MEASURES = {}

      measures.forEach(measure => {
        if (!DEFAULT_MEASURES[measure.presentationCode]) {
          DEFAULT_MEASURES[measure.presentationCode] = []
        }
        DEFAULT_MEASURES[measure.presentationCode].push({
          id: measure.code,
          name: measure.name,
          pricePerKg: measure.pricePerKg
        })
      })
    }
  } catch (error) {
    console.error('Error cargando presentaciones desde API:', error)
    // Valores por defecto si falla la API
    DEFAULT_PRESENTATIONS = [
      { id: 'fresh', name: 'Fresco', editable: true },
      { id: 'frozen', name: 'Congelado', editable: true },
      { id: 'halfShell', name: 'Media Valva', editable: true },
      { id: 'processed', name: 'Procesado', editable: true }
    ]
    DEFAULT_MEASURES = {
      fresh: [],
      frozen: [],
      halfShell: [],
      processed: []
    }
  }
}

// Cargar presentaciones al iniciar
loadPresentationsFromAPI()