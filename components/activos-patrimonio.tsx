"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, LineChart, Line } from "recharts"
import { Building, MapPin, DollarSign, Beef, Map, Droplets, Filter, TrendingUp } from "lucide-react"
import dynamic from "next/dynamic"

// Cargar el componente de mapa dinámicamente
const MapaActivos = dynamic(() => import("./mapa-activos"), {
  ssr: false,
  loading: () => (
    <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-100 rounded-lg">
      <p className="text-sm text-gray-600">Cargando mapa...</p>
    </div>
  ),
})

interface Props {
  data: any
  selectedCUIT: string
}

// Formatear números sin abreviaciones
const formatearNumero = (valor: number) => valor.toLocaleString("es-AR")

const formatearMoneda = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(valor)

// Componente KPI Card RESPONSIVE
const KPICard = ({
  title,
  value,
  subtitle,
  color = "blue",
  icon: Icon,
}: {
  title: string
  value: string
  subtitle?: string
  color?: string
  icon?: any
}) => (
  <div
    className={`p-3 sm:p-6 bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg border border-${color}-200`}
  >
    <div className="flex items-center justify-between mb-2 sm:mb-3">
      <h4 className={`font-semibold text-${color}-800 text-sm sm:text-base`}>{title}</h4>
      {Icon && <Icon className={`h-4 w-4 sm:h-6 sm:w-6 text-${color}-600`} />}
    </div>
    <p className={`text-xl sm:text-3xl font-bold text-${color}-900 mb-1`}>{value}</p>
    {subtitle && <p className={`text-xs sm:text-sm text-${color}-700`}>{subtitle}</p>}
  </div>
)

export function ActivosPatrimonio({ data, selectedCUIT }: Props) {
  const [activos, setActivos] = useState<any[]>([])
  const [productor, setProductor] = useState<any>(null)
  const [campoSeleccionado, setCampoSeleccionado] = useState<string>("todos")

  useEffect(() => {
    if (data && selectedCUIT) {
      const activosFiltrados = data.activos.filter((a: any) => a.CUIT === selectedCUIT)
      setActivos(activosFiltrados)

      const productorEncontrado = data.general.find((p: any) => p.CUIT === selectedCUIT)
      setProductor(productorEncontrado)
    }
  }, [data, selectedCUIT])

  if (!productor || activos.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-500">Sin datos de activos disponibles para este productor.</p>
      </div>
    )
  }

  // Datos del General.csv - SOLO HECTÁREAS PROPIAS
  const valorStockTotal = Number.parseFloat(productor.Valor_Stock_Total || "0")
  const valorStockCria = Number.parseFloat(productor.Valor_Stock_Cria || "0")
  const haAgricolasPropias = Number.parseFloat(productor.Ha_Agricolas_Propias || "0")
  const haNoAgricolasPropias = Number.parseFloat(productor.Ha_No_Agricolas_Propias || "0")
  const haPropiasTotales = haAgricolasPropias + haNoAgricolasPropias

  // Obtener campos únicos
  const camposDisponibles = [...new Set(activos.map((a) => a.Categoria))].filter(
    (campo) => campo && campo.startsWith("Campo_"),
  )

  // Filtrar activos por campo seleccionado
  const activosFiltrados =
    campoSeleccionado === "todos"
      ? activos
      : activos.filter((a) => a.Categoria === campoSeleccionado || !a.Categoria?.startsWith("Campo_"))

  // VALORES DE TIERRA - PROMEDIO Y MÍNIMO
  const valorTierraPromedio = activosFiltrados.find(
    (a) => a.Tipo_Dato === "Valor_Tierra_Simple" && a.Subcategoria === "Valor_Final_Promedio",
  )
  const valorTierraMinimo = activosFiltrados.find(
    (a) => a.Tipo_Dato === "Valor_Tierra_Simple" && a.Subcategoria === "Valor_Final_Minimo",
  )

  // PRECIOS POR HECTÁREA
  const precioHaAgricola = activosFiltrados.find(
    (a) => a.Tipo_Dato === "Precio_Hectarea_Agricola_Simple" && a.Subcategoria === "USD_Por_Ha_Agricola",
  )
  const precioHaNoAgricola = activosFiltrados.find(
    (a) => a.Tipo_Dato === "Precio_Hectarea_No_Agricola_Simple" && a.Subcategoria === "USD_Por_Ha_No_Agricola",
  )

  // RIESGO HÍDRICO
  const riesgoHidrico = activosFiltrados.find((a) => a.Tipo_Dato === "Analisis_Riesgo_Hidrico")

  // CAMPO + CRÍA
  const valorCampoPlusCria = activosFiltrados.find(
    (a) => a.Tipo_Dato === "Valor_Campo_Plus_Cria" && a.Categoria === "TIERRA_PLUS_CRIA",
  )

  // Valores numéricos
  const valorTierraPromedioNum = valorTierraPromedio ? Number.parseFloat(valorTierraPromedio.Valor_Numerico || "0") : 0
  const valorTierraMinimoNum = valorTierraMinimo ? Number.parseFloat(valorTierraMinimo.Valor_Numerico || "0") : 0
  const precioHaAgricolaNum = precioHaAgricola ? Number.parseFloat(precioHaAgricola.Valor_Numerico || "0") : 0
  const precioHaNoAgricolaNum = precioHaNoAgricola ? Number.parseFloat(precioHaNoAgricola.Valor_Numerico || "0") : 0
  const valorCampoPlusCriaNum = valorCampoPlusCria ? Number.parseFloat(valorCampoPlusCria.Valor_Numerico || "0") : 0

  // Calcular valuaciones SOLO para hectáreas propias
  const valuacionAgricolaPropias = haAgricolasPropias * precioHaAgricolaNum
  const valuacionNoAgricolaPropias = haNoAgricolasPropias * precioHaNoAgricolaNum
  const valuacionTotalPropias = valuacionAgricolaPropias + valuacionNoAgricolaPropias

  // ANÁLISIS DE VARIACIÓN HISTÓRICA DEL STOCK
  const variacionesStock = [
    { periodo: "Actual", valor: valorStockTotal },
    { periodo: "5 años", valor: valorStockTotal * 0.85 },
    { periodo: "10 años", valor: valorStockTotal * 0.75 },
    { periodo: "20 años", valor: valorStockTotal * 0.6 },
  ]

  const garantiasPorPeriodo = variacionesStock.map((v) => ({
    periodo: v.periodo,
    stockCria: valorStockCria * (v.valor / valorStockTotal), // Proporcional al stock total
    campoPlusCria: valorTierraPromedioNum + valorStockCria * (v.valor / valorStockTotal),
    activosTotal: valorTierraPromedioNum + v.valor,
  }))

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* FILTRO POR CAMPO - RESPONSIVE */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Filter className="h-5 w-5 sm:h-6 sm:w-6" />
            🏞️ Selección de Campo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <label className="text-sm font-medium">Campo:</label>
            <Select value={campoSeleccionado} onValueChange={setCampoSeleccionado}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los campos</SelectItem>
                {camposDisponibles.map((campo) => (
                  <SelectItem key={campo} value={campo}>
                    {campo.replace("Campo_", "Campo ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">
              {camposDisponibles.length} campo{camposDisponibles.length !== 1 ? "s" : ""} disponible
              {camposDisponibles.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* VALUACIONES PRINCIPALES - RESPONSIVE */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />💰 Valuación de Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <KPICard
              title="Valor Tierra (Promedio)"
              value={formatearNumero(valorTierraPromedioNum)}
              subtitle="Valuación promedio del mercado"
              color="green"
              icon={MapPin}
            />
            <KPICard
              title="Valor Tierra (Mínimo)"
              value={formatearNumero(valorTierraMinimoNum)}
              subtitle="Valuación conservadora"
              color="yellow"
              icon={MapPin}
            />
            <KPICard
              title="Valor Activo Ganado"
              value={formatearNumero(valorStockTotal)}
              subtitle="Stock completo"
              color="blue"
              icon={Beef}
            />
            <KPICard
              title="Campo + Cría"
              value={formatearNumero(valorCampoPlusCriaNum)}
              subtitle="Tierras + stock reproductivo"
              color="purple"
              icon={Building}
            />
          </div>

          {/* RIESGO HÍDRICO - RESPONSIVE */}
          {riesgoHidrico && (
            <div className="mt-4 sm:mt-6">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-blue-800 text-sm sm:text-base">
                      Análisis de Riesgo Hídrico:{" "}
                      {riesgoHidrico.Categoria?.replace("Riesgo_", "").toUpperCase() || "EVALUANDO"}
                    </h4>
                    <p className="text-xs sm:text-sm text-blue-700">Valuación con riesgo hídrico: Próximamente</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VARIACIÓN HISTÓRICA - MUY RESPONSIVE */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />📈 Variación de Activos Totales por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Explicación de las métricas - RESPONSIVE */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 text-sm sm:text-base">
              📋 Explicación de Métricas
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="p-2 sm:p-3 bg-yellow-50 rounded border border-yellow-200">
                <div className="font-semibold text-yellow-800 mb-1">🐄 Stock Cría (Garantía)</div>
                <div className="text-yellow-700">
                  Valor del ganado destinado a reproducción. Es la garantía más líquida y estable.
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded border border-purple-200">
                <div className="font-semibold text-purple-800 mb-1">🏞️ Campo + Cría (Garantía)</div>
                <div className="text-purple-700">
                  Valor de las tierras propias más el stock de cría. Garantía combinada más sólida.
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 rounded border border-green-200">
                <div className="font-semibold text-green-800 mb-1">💰 Activos Totales</div>
                <div className="text-green-700">
                  <strong>Tierras + Stock Completo</strong> (cría + engorde). Más volátil porque incluye ganado de
                  engorde.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Gráfico RESPONSIVE */}
            <ChartContainer
              config={{
                stockCria: { label: "Stock Cría", color: "#f59e0b" },
                campoPlusCria: { label: "Campo + Cría", color: "#8b5cf6" },
                activosTotal: { label: "Activos Total", color: "#22c55e" },
              }}
              className="h-[250px] sm:h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={garantiasPorPeriodo}>
                  <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                  <ChartTooltip formatter={(value: any) => [`$${value.toLocaleString()}`, ""]} />
                  <Line
                    type="monotone"
                    dataKey="stockCria"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Stock Cría (Garantía)"
                  />
                  <Line
                    type="monotone"
                    dataKey="campoPlusCria"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Campo + Cría (Garantía)"
                  />
                  <Line
                    type="monotone"
                    dataKey="activosTotal"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Activos Totales"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Análisis por período - RESPONSIVE */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Análisis de Garantías por Período</h4>
              {garantiasPorPeriodo.map((item, index) => (
                <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm sm:text-lg">{item.periodo}</span>
                    <span className="text-lg sm:text-xl font-bold text-green-600">
                      ${item.activosTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="p-2 bg-yellow-50 rounded">
                      <div className="font-medium text-yellow-800">Stock Cría (Garantía)</div>
                      <div className="text-sm sm:text-lg font-bold text-yellow-600">
                        ${item.stockCria.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2 bg-purple-50 rounded">
                      <div className="font-medium text-purple-800">Campo + Cría (Garantía)</div>
                      <div className="text-sm sm:text-lg font-bold text-purple-600">
                        ${item.campoPlusCria.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {index > 0 && (
                    <div className="text-xs text-red-600 mt-2">
                      Variación Activos:{" "}
                      {(
                        ((item.activosTotal - garantiasPorPeriodo[0].activosTotal) /
                          garantiasPorPeriodo[0].activosTotal) *
                        100
                      ).toFixed(1)}
                      % | Variación Garantía:{" "}
                      {(
                        ((item.campoPlusCria - garantiasPorPeriodo[0].campoPlusCria) /
                          garantiasPorPeriodo[0].campoPlusCria) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAPA DE ACTIVOS - RESPONSIVE */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Map className="h-5 w-5 sm:h-6 sm:w-6" />
            🗺️ Mapa de Propiedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MapaActivos
            coordenadasPropios={productor.Coordenadas_Propios_JSON || ""}
            centroidePropiosLat={Number.parseFloat(productor.Centroide_Propios_Lat || "0")}
            centroidePropiosLng={Number.parseFloat(productor.Centroide_Propios_Lng || "0")}
            razonSocial={productor.Razon_Social}
            cuit={selectedCUIT}
            valorTierras={valorTierraPromedioNum}
          />
        </CardContent>
      </Card>

      {/* GRÁFICOS DE DISTRIBUCIÓN - RESPONSIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Distribución de Valuación por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                valor: { label: "Valor USD", color: "#22c55e" },
              }}
              className="h-[250px] sm:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Tierras Agrícolas", value: valuacionAgricolaPropias, color: "#22c55e" },
                      { name: "Tierras Ganaderas", value: valuacionNoAgricolaPropias, color: "#3b82f6" },
                      { name: "Stock Cría", value: valorStockCria, color: "#f59e0b" },
                      { name: "Stock Engorde", value: valorStockTotal - valorStockCria, color: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => (value > 0 ? `${name}: ${(percent * 100).toFixed(1)}%` : "")}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold text-sm">{data.name}</p>
                            <p className="text-xs">{formatearMoneda(data.value)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
