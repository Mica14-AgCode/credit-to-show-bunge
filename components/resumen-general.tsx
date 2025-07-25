"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layers } from "lucide-react"
import { useState } from "react"

// Agregar el import de dynamic para cargar el mapa
import dynamic from "next/dynamic"

// Cargar el componente de mapa dinámicamente (solo en el cliente)
const MapaGeoJSON = dynamic(() => import("./mapa-geojson"), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">Cargando mapa...</div>,
})

interface ResumenGeneralProps {
  data: any
  selectedCUIT: string
}

export function ResumenGeneral({ data, selectedCUIT }: ResumenGeneralProps) {
  const [polygonFilter, setPolygonFilter] = useState<string>("todos")

  if (!data || !selectedCUIT) return null

  const productor = data.general.find((p: any) => p.CUIT === selectedCUIT)

  if (!productor) return <div>No se encontraron datos para este productor</div>

  // Extraer TODOS los datos de General.csv
  const cuit = productor.CUIT
  const razonSocial = productor.Razon_Social
  const haTotales = Number.parseFloat(productor.Ha_Totales)
  const haAgricolasTotales = Number.parseFloat(productor.Ha_Agricolas_Totales)
  const haAgricolasPropias = Number.parseFloat(productor.Ha_Agricolas_Propias)
  const haAgricolasAlquiladas = Number.parseFloat(productor.Ha_Agricolas_Alquiladas)
  const haNoAgricolasTotales = Number.parseFloat(productor.Ha_No_Agricolas_Totales)
  const haNoAgricolasPropias = Number.parseFloat(productor.Ha_No_Agricolas_Propias)
  const haNoAgricolasAlquiladas = Number.parseFloat(productor.Ha_No_Agricolas_Alquiladas)

  // Porcentajes
  const pctAgricolas = Number.parseFloat(productor.Pct_Agricolas)
  const pctNoAgricolas = Number.parseFloat(productor.Pct_No_Agricolas)
  const pctAgricolasPropias = Number.parseFloat(productor.Pct_Agricolas_Propias)
  const pctAgricolasAlquiladas = Number.parseFloat(productor.Pct_Agricolas_Alquiladas)
  const pctNoAgricolasPropias = Number.parseFloat(productor.Pct_No_Agricolas_Propias)
  const pctNoAgricolasAlquiladas = Number.parseFloat(productor.Pct_No_Agricolas_Alquiladas)

  // Ganadería
  const cabezasTotales = Number.parseInt(productor.Cabezas_Totales)
  const stockCriaCabezas = Number.parseInt(productor.Stock_Cria_Cabezas)
  const valorStockTotal = Number.parseFloat(productor.Valor_Stock_Total)
  const valorStockCria = Number.parseFloat(productor.Valor_Stock_Cria)

  // Financiero
  const scoreNosis = Number.parseInt(productor.Score_Nosis)
  const endeudamiento = Number.parseFloat(productor.Endeudamiento)

  // GeoJSON
  const geoJsonPropios = productor.GeoJSON_Propios
  const geoJsonAlquilados = productor.GeoJSON_Alquilados
  const geoJsonTotal = productor.GeoJSON_Total

  // Calcular hectáreas propias totales y arrendadas totales
  const haPropiasTotales = haAgricolasPropias + haNoAgricolasPropias
  const haArrendadasTotales = haAgricolasAlquiladas + haNoAgricolasAlquiladas

  return (
    <div className="space-y-6">
      {/* Información Principal */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">🏢 Información General del Productor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">CUIT</label>
                <p className="text-lg font-semibold">{cuit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Razón Social</label>
                <p className="text-lg font-semibold">{razonSocial}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Score Nosis</label>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-blue-600">{scoreNosis}</p>
                  <Badge variant={scoreNosis >= 800 ? "default" : scoreNosis >= 700 ? "secondary" : "destructive"}>
                    {scoreNosis >= 800 ? "Excelente" : scoreNosis >= 700 ? "Bueno" : "Regular"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Endeudamiento</label>
                <p className="text-lg font-semibold text-red-600">${endeudamiento.toFixed(2)} USD</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Superficie y Tenencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hectáreas Trabajadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🌾 Superficie Trabajada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{haTotales.toLocaleString()} ha</p>
              <p className="text-sm text-gray-500">Total trabajadas</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Hectáreas Agrícolas</span>
                <div className="text-right">
                  <p className="font-semibold">{haAgricolasTotales.toLocaleString()} ha</p>
                  <p className="text-xs text-gray-500">{pctAgricolas.toFixed(1)}%</p>
                </div>
              </div>
              <Progress value={pctAgricolas} className="h-2" />

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Hectáreas Ganaderas</span>
                <div className="text-right">
                  <p className="font-semibold">{haNoAgricolasTotales.toLocaleString()} ha</p>
                  <p className="text-xs text-gray-500">{pctNoAgricolas.toFixed(1)}%</p>
                </div>
              </div>
              <Progress value={pctNoAgricolas} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Estructura de Tenencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🏠 Estructura de Tenencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hectáreas Propias */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Hectáreas Propias</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Propias:</span>
                  <span className="font-semibold">{haPropiasTotales.toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">• Agrícolas Propias:</span>
                  <span className="font-semibold">{haAgricolasPropias.toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">• Ganaderas Propias:</span>
                  <span className="font-semibold">{haNoAgricolasPropias.toLocaleString()} ha</span>
                </div>
              </div>
            </div>

            {/* Hectáreas Arrendadas */}
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">Hectáreas Arrendadas</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Arrendadas:</span>
                  <span className="font-semibold">{haArrendadasTotales.toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">• Agrícolas Arrendadas:</span>
                  <span className="font-semibold">{haAgricolasAlquiladas.toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">• Ganaderas Arrendadas:</span>
                  <span className="font-semibold">{haNoAgricolasAlquiladas.toLocaleString()} ha</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Ganadero - RESPONSIVE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">🐄 Stock Ganadero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{cabezasTotales.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-600">Cabezas Totales</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <p className="text-lg sm:text-2xl font-bold text-green-600">{stockCriaCabezas.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-600">Stock de Cría</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
              <p className="text-lg sm:text-2xl font-bold text-purple-600">${valorStockTotal.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-600">Valor Stock Total</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-indigo-50 rounded-lg">
              <p className="text-lg sm:text-2xl font-bold text-indigo-600">${valorStockCria.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-600">Valor Stock Cría</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Porcentajes Detallados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">📊 Distribución Porcentual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Distribución por Actividad</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Superficie Agrícola</span>
                    <span className="font-semibold">{pctAgricolas.toFixed(1)}%</span>
                  </div>
                  <Progress value={pctAgricolas} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Superficie Ganadera</span>
                    <span className="font-semibold">{pctNoAgricolas.toFixed(1)}%</span>
                  </div>
                  <Progress value={pctNoAgricolas} className="h-2" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Distribución por Tenencia</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Agrícolas Propias</span>
                    <span className="font-semibold">{pctAgricolasPropias.toFixed(1)}%</span>
                  </div>
                  <Progress value={pctAgricolasPropias} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Agrícolas Arrendadas</span>
                    <span className="font-semibold">{pctAgricolasAlquiladas.toFixed(1)}%</span>
                  </div>
                  <Progress value={pctAgricolasAlquiladas} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ganaderas Propias</span>
                    <span className="font-semibold">{pctNoAgricolasPropias.toFixed(1)}%</span>
                  </div>
                  <Progress value={pctNoAgricolasPropias} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ganaderas Arrendadas</span>
                    <span className="font-semibold">{pctNoAgricolasAlquiladas.toFixed(1)}%</span>
                  </div>
                  <Progress value={pctNoAgricolasAlquiladas} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles del Mapa - RESPONSIVE Y Z-INDEX CORREGIDO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">🗺️ Mapa de Propiedades</CardTitle>
          {/* Controles FUERA del contenedor del mapa con z-index máximo */}
          <div className="flex flex-col gap-4 pt-4 relative" style={{ zIndex: 99999 }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-600">Mostrar:</label>
                </div>
                <div className="relative w-full sm:w-48" style={{ zIndex: 99999 }}>
                  <Select value={polygonFilter} onValueChange={setPolygonFilter}>
                    <SelectTrigger className="w-full" style={{ zIndex: 99999 }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-white border-2 shadow-2xl"
                      style={{
                        zIndex: 100000,
                        position: "fixed",
                        backgroundColor: "white !important",
                      }}
                    >
                      <SelectItem value="todos">Todos los polígonos</SelectItem>
                      <SelectItem value="propios">Solo propios</SelectItem>
                      <SelectItem value="alquilados">Solo alquilados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mapa interactivo - Z-INDEX BAJO Y RESPONSIVE */}
          <div className="h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden border relative" style={{ zIndex: 1 }}>
            <MapaGeoJSON
              coordenadasPropios={productor.Coordenadas_Propios_JSON || ""}
              coordenadasAlquilados={productor.Coordenadas_Alquilados_JSON || ""}
              centroidePropiosLat={Number.parseFloat(productor.Centroide_Propios_Lat || "0")}
              centroidePropiosLng={Number.parseFloat(productor.Centroide_Propios_Lng || "0")}
              centroideAlquiladosLat={Number.parseFloat(productor.Centroide_Alquilados_Lat || "0")}
              centroideAlquiladosLng={Number.parseFloat(productor.Centroide_Alquilados_Lng || "0")}
              razonSocial={razonSocial}
              cuit={cuit}
              polygonFilter={polygonFilter}
            />
          </div>

          {/* Resumen Ejecutivo - RESPONSIVE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">📋 Resumen Ejecutivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-base sm:text-lg font-bold text-blue-600">Escala</p>
                  <p className="text-xl sm:text-2xl font-bold">{haTotales.toLocaleString()} ha</p>
                  <Badge variant={haTotales >= 10000 ? "default" : haTotales >= 5000 ? "secondary" : "outline"}>
                    {haTotales >= 10000 ? "Grande" : haTotales >= 5000 ? "Mediana" : "Chica"}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-base sm:text-lg font-bold text-green-600">Diversificación</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {haAgricolasTotales > 0 && haNoAgricolasTotales > 0
                      ? "Mixta"
                      : haAgricolasTotales > 0
                        ? "Agrícola"
                        : "Ganadera"}
                  </p>
                  <Badge variant={haAgricolasTotales > 0 && haNoAgricolasTotales > 0 ? "default" : "secondary"}>
                    {haAgricolasTotales > 0 && haNoAgricolasTotales > 0 ? "Diversificada" : "Especializada"}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-base sm:text-lg font-bold text-purple-600">Tenencia</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {((haPropiasTotales / haTotales) * 100).toFixed(0)}% Propia
                  </p>
                  <Badge variant={haPropiasTotales > haArrendadasTotales ? "default" : "secondary"}>
                    {haPropiasTotales > haArrendadasTotales ? "Mayormente Propia" : "Mayormente Arrendada"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
