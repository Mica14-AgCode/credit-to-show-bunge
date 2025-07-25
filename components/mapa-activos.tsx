"use client"

import { useEffect, useRef, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Eye } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapaActivosProps {
  coordenadasPropios: string
  centroidePropiosLat: number
  centroidePropiosLng: number
  razonSocial: string
  cuit: string
  valorTierras: number
  hectareasValuadas?: number
}

// ──────────────────────────────────────────────────────────
// Convierte una celda CSV en un array de objetos válidos
function parseGeoJsonCell(cell: string): any[] {
  // Normalizar y descartar valores vacíos o de tipo "N/D"
  const trimmed = (cell ?? "").trim()
  if (
    !trimmed || // cadena vacía
    trimmed.toUpperCase() === "N/D" || // marcador "No Disponible"
    trimmed.toUpperCase() === "ND" // variación corta
  ) {
    return []
  }

  // Si la celda no empieza con "{" o "[" asumimos que NO es JSON
  const firstChar = trimmed[0]
  if (firstChar !== "{" && firstChar !== "[") {
    return []
  }

  // 1) Limpieza básica
  let cleaned = trimmed
    .replace(/\\"/g, '"') // \"  -> "
    .replace(/\\n/g, "") // quita saltos escapados
    .replace(/\uFEFF/g, "") // quita BOM
    .trim()

  // 2) Primer intento: JSON válido
  try {
    return JSON.parse(cleaned)
  } catch (_) {
    /* vazio – intentaremos reparar */
  }

  // 3) Intento de reparación:
  //    a) comillas simples → dobles
  //    b) agrega comillas a las claves sin comillas  {tipo: ...} -> {"tipo": ...}
  cleaned = cleaned.replace(/'/g, '"').replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')

  // c) agrega comillas a los valores string sin comillas  : Polygon → : "Polygon"
  cleaned = cleaned.replace(/:\s*([A-Za-z_][A-Za-z0-9_]*)\s*([,}])/g, (_m, val, tail) => {
    const lower = val.toLowerCase()
    // deja pasar true, false, null y números
    if (["true", "false", "null"].includes(lower) || /^\d+(\.\d+)?$/.test(val)) {
      return `: ${val}${tail}`
    }
    return `: "${val}"${tail}`
  })

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    console.error("GeoJSON malformado irreparable:", err, cleaned.slice(0, 120) + "…")
    return []
  }
}

export default function MapaActivos({
  coordenadasPropios,
  centroidePropiosLat,
  centroidePropiosLng,
  razonSocial,
  cuit,
  valorTierras,
  hectareasValuadas = 0,
}: MapaActivosProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [leaflet, setLeaflet] = useState<any>(null)
  const [map, setMap] = useState<any>(null)
  const [propiosLayers, setPropiosLayers] = useState<any[]>([])
  const [opacidad, setOpacidad] = useState([0.6])
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Datos parseados
  const propiosData = parseGeoJsonCell(coordenadasPropios)

  console.log("📊 Datos parseados ACTIVOS:", {
    propios: propiosData.length,
    centroide: { lat: centroidePropiosLat, lng: centroidePropiosLng },
    coordenadasRaw: coordenadasPropios?.slice(0, 100) + "...",
  })

  useEffect(() => {
    // Cargar Leaflet dinámicamente solo en el cliente
    const loadLeaflet = async () => {
      try {
        await import("leaflet/dist/leaflet.css")

        // Fix para los iconos de Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        setLeaflet(L)
        setMapLoaded(true)
      } catch (error) {
        console.error("Error cargando Leaflet:", error)
      }
    }

    if (typeof window !== "undefined") {
      loadLeaflet()
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !leaflet || !mapContainerRef.current) return

    // Limpiar mapa existente
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    // Crear nuevo mapa
    const map = leaflet
      .map(mapContainerRef.current, {
        zoomControl: true,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      })
      .setView([centroidePropiosLat, centroidePropiosLng], 13)
    mapRef.current = map

    // Agregar capa base
    const osmLayer = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    })

    const satelliteLayer = leaflet.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "© Esri, Maxar, Earthstar Geographics",
      },
    )

    // Agregar capa base inicial
    osmLayer.addTo(map)

    // Crear polígonos propios
    const propiosLayersArray: any[] = []
    propiosData.forEach((poligono: any, index: number) => {
      if (poligono.coordenadas && poligono.coordenadas.length > 0) {
        try {
          const leafletCoords = poligono.coordenadas.map((coord: number[]) => [coord[1], coord[0]])

          const layer = leaflet
            .polygon(leafletCoords, {
              fillColor: "#22c55e",
              weight: 3,
              opacity: 1,
              color: "#16a34a",
              fillOpacity: opacidad[0],
            })
            .bindPopup(`
                <strong>Campo Propio ${index + 1}</strong><br/>
                <strong>${razonSocial}</strong><br/>
                Tipo: Propiedad Propia<br/>
                Valor Tierras: $${valorTierras.toLocaleString()}<br/>
                Ha Valuadas: ${(hectareasValuadas ?? 0).toFixed(1)} ha
              `)

          layer.addTo(map)
          propiosLayersArray.push(layer)
          console.log(`✅ Polígono ${index + 1} agregado con ${leafletCoords.length} coordenadas`)
        } catch (error) {
          console.error(`❌ Error agregando polígono ${index + 1}:`, error)
        }
      }
    })

    // Ajustar vista a los polígonos cuando el mapa esté listo
    map.whenReady(() => {
      try {
        // Asegura que el contenedor haya calculado su tamaño real
        map.invalidateSize()

        if (propiosLayersArray.length > 0) {
          const group = leaflet.featureGroup(propiosLayersArray)
          const bounds = group.getBounds()
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20], animate: false })
            console.log("🎯 Vista ajustada a los polígonos (whenReady)")
          }
        }
      } catch (error) {
        console.error("Error ajustando vista (whenReady):", error)
      }
    })

    // Control de capas
    const baseLayers = {
      "🗺️ Estándar": osmLayer,
      "🛰️ Satelital": satelliteLayer,
    }

    leaflet.control.layers(baseLayers, {}, { position: "topright" }).addTo(map)

    // Leyenda
    const legend = leaflet.control({ position: "bottomright" })
    legend.onAdd = () => {
      const div = leaflet.DomUtil.create("div", "info legend")
      div.style.backgroundColor = "rgba(255, 255, 255, 0.95)"
      div.style.padding = "12px"
      div.style.border = "2px solid #ccc"
      div.style.borderRadius = "8px"
      div.style.fontSize = "14px"
      div.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)"
      div.innerHTML = `
        <h4 style="margin: 0 0 10px 0; font-weight: 600; color: #374151;">Activos - ${razonSocial}</h4>
        <div style="margin-bottom: 6px;"><span style="color: #22c55e; font-size: 16px;">■</span> <span style="margin-left: 8px;">Campos Propios (${propiosData.length})</span></div>
        <hr style="margin: 8px 0;">
        <div style="font-size: 12px; color: #6b7280;">
          <div>Valor Tierras: $${valorTierras.toLocaleString()}</div>
        </div>
      `
      return div
    }
    legend.addTo(map)

    // Guardar referencias
    setMap(map)
    setPropiosLayers(propiosLayersArray)

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [
    mapLoaded,
    leaflet,
    coordenadasPropios,
    centroidePropiosLat,
    centroidePropiosLng,
    razonSocial,
    valorTierras,
    hectareasValuadas,
  ])

  // Actualizar opacidad cuando cambia el slider
  useEffect(() => {
    if (propiosLayers.length > 0) {
      propiosLayers.forEach((layer) => {
        layer.setStyle({ fillOpacity: opacidad[0] })
      })
    }
  }, [opacidad, propiosLayers])

  if (!mapLoaded) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Cargando mapa de activos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles del mapa */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium">Opacidad:</label>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">0%</span>
            <Slider value={opacidad} onValueChange={setOpacidad} max={1} min={0} step={0.1} className="w-32" />
            <span className="text-sm text-gray-500">100%</span>
          </div>
          <span className="text-sm font-medium">{Math.round(opacidad[0] * 100)}%</span>
        </div>
      </div>

      {/* Mapa */}
      <div ref={mapContainerRef} id="mapa-activos" className="h-96 w-full rounded-lg border-2 border-gray-200"></div>
    </div>
  )
}
