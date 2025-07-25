"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layers, Building } from "lucide-react"

interface MapaGeoJSONProps {
  coordenadasPropios: string
  coordenadasAlquilados: string
  centroidePropiosLat: number
  centroidePropiosLng: number
  centroideAlquiladosLat: number
  centroideAlquiladosLng: number
  razonSocial: string
  cuit: string
  polygonFilter: string
}

export default function MapaGeoJSON({
  coordenadasPropios,
  coordenadasAlquilados,
  centroidePropiosLat,
  centroidePropiosLng,
  centroideAlquiladosLat,
  centroideAlquiladosLng,
  razonSocial,
  cuit,
  polygonFilter,
}: MapaGeoJSONProps) {
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const [selectedLayer, setSelectedLayer] = useState<string>("standard")
  const [propiosLayer, setPropiosLayer] = useState<any>(null)
  const [alquiladosLayer, setAlquiladosLayer] = useState<any>(null)

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
    // (evita intentar parsear textos como rutas de archivo, etc.).
    const firstChar = trimmed[0]
    if (firstChar !== "{" && firstChar !== "[") {
      return []
    }

    // 1) Limpieza básica
    let cleaned = trimmed
      .replace(/\\"/g, '"') // \"  -> "
      .replace(/\\\n/g, "") // quita saltos escapados
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

  // Función para cambiar capa base
  const changeBaseLayer = (layerType: string) => {
    if (!mapInstanceRef.current) return

    // Remover capa actual
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer._url) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    // Agregar nueva capa
    let tileLayer
    switch (layerType) {
      case "satellite":
        tileLayer = (window as any).L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "© Esri",
            maxZoom: 18,
          },
        )
        break
      case "hybrid":
        tileLayer = (window as any).L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "© Esri",
            maxZoom: 18,
          },
        )
        break
      default:
        tileLayer = (window as any).L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        })
    }

    tileLayer.addTo(mapInstanceRef.current)
    setSelectedLayer(layerType)
  }

  // Función para aplicar filtros
  const applyPolygonFilter = (filter: string) => {
    if (!mapInstanceRef.current) return

    // Remover capas existentes
    if (propiosLayer) {
      mapInstanceRef.current.removeLayer(propiosLayer)
    }
    if (alquiladosLayer) {
      mapInstanceRef.current.removeLayer(alquiladosLayer)
    }

    // Agregar capas según filtro
    if (filter === "todos" || filter === "propios") {
      if (propiosLayer) {
        mapInstanceRef.current.addLayer(propiosLayer)
      }
    }
    if (filter === "todos" || filter === "alquilados") {
      if (alquiladosLayer) {
        mapInstanceRef.current.addLayer(alquiladosLayer)
      }
    }
  }

  useEffect(() => {
    // Cargar Leaflet dinámicamente
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      // Cargar CSS de Leaflet
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Cargar JS de Leaflet
      if (!(window as any).L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = initializeMap
        document.head.appendChild(script)
      } else {
        initializeMap()
      }
    }

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return

      const L = (window as any).L

      // Calcular centro del mapa basado en centroides
      const centerLat = (centroidePropiosLat + centroideAlquiladosLat) / 2
      const centerLng = (centroidePropiosLng + centroideAlquiladosLng) / 2

      // Crear mapa
      const map = L.map(mapRef.current, {
        center: [centerLat || -34.6037, centerLng || -58.3816],
        zoom: 10,
        zoomControl: true,
      })

      mapInstanceRef.current = map

      // Agregar capa base inicial
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map)

      // Procesar datos GeoJSON
      const propiosData = parseGeoJsonCell(coordenadasPropios)
      const alquiladosData = parseGeoJsonCell(coordenadasAlquilados)

      console.log("📊 Datos parseados:", {
        propios: propiosData.length,
        alquilados: alquiladosData.length,
        propiosData,
        alquiladosData,
      })

      // Crear polígonos propios
      const propiosLayersArray: any[] = []
      propiosData.forEach((poligono: any, index: number) => {
        if (poligono.coordenadas && poligono.coordenadas.length > 0) {
          const leafletCoords = poligono.coordenadas.map((coord: number[]) => [coord[1], coord[0]])

          const layer = L.polygon(leafletCoords, {
            fillColor: "#22c55e",
            weight: 2,
            opacity: 1,
            color: "#16a34a",
            dashArray: "3",
            fillOpacity: 0.4,
          }).bindPopup(`
            <strong>Propiedad Propia ${index + 1}</strong><br/>
            <strong>${razonSocial}</strong><br/>
            Tipo: Propia<br/>
            Polígono: ${index + 1}
          `)

          layer.addTo(map)
          propiosLayersArray.push(layer)
        }
      })

      // Crear polígonos alquilados
      const alquiladosLayersArray: any[] = []
      alquiladosData.forEach((poligono: any, index: number) => {
        if (poligono.coordenadas && poligono.coordenadas.length > 0) {
          const leafletCoords = poligono.coordenadas.map((coord: number[]) => [coord[1], coord[0]])

          const layer = L.polygon(leafletCoords, {
            fillColor: "#f97316",
            weight: 2,
            opacity: 1,
            color: "#ea580c",
            dashArray: "3",
            fillOpacity: 0.4,
          }).bindPopup(`
            <strong>Propiedad Alquilada ${index + 1}</strong><br/>
            <strong>${razonSocial}</strong><br/>
            Tipo: Alquilada<br/>
            Polígono: ${index + 1}
          `)

          layer.addTo(map)
          alquiladosLayersArray.push(layer)
        }
      })

      // Ajustar vista a todos los polígonos
      const allLayers = [...propiosLayersArray, ...alquiladosLayersArray]
      if (allLayers.length > 0) {
        const group = L.featureGroup(allLayers)
        map.fitBounds(group.getBounds().pad(0.1))
      }

      // Guardar referencias
      setPropiosLayer(L.layerGroup(propiosLayersArray))
      setAlquiladosLayer(L.layerGroup(alquiladosLayersArray))
    }

    loadLeaflet()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [
    coordenadasPropios,
    coordenadasAlquilados,
    centroidePropiosLat,
    centroidePropiosLng,
    centroideAlquiladosLat,
    centroideAlquiladosLng,
    razonSocial,
    cuit,
  ])

  // Aplicar filtros cuando cambie polygonFilter
  useEffect(() => {
    applyPolygonFilter(polygonFilter)
  }, [polygonFilter, propiosLayer, alquiladosLayer])

  return (
    <div className="w-full h-full relative">
      {/* Controles del mapa */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <Select value={selectedLayer} onValueChange={changeBaseLayer}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Estándar</SelectItem>
                <SelectItem value="satellite">Satélite</SelectItem>
                <SelectItem value="hybrid">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Leyenda */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Card className="p-3 bg-white/95 backdrop-blur">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building className="h-4 w-4" />
              {razonSocial}
            </CardTitle>
            <CardDescription className="text-xs">CUIT: {cuit}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-green-500 border border-green-600 rounded"></div>
              <span>Propios</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-orange-500 border border-orange-600 rounded"></div>
              <span>Alquilados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenedor del mapa */}
      <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-lg" />
    </div>
  )
}
