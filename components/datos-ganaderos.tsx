"use client"

import type React from "react"
import { useEffect, useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Beef } from "lucide-react"

interface Props {
  data: any
  selectedCUIT: string
}

// Funciones helper
const filterByTipo = (data: any[], tipoDato: string) => data.filter((row) => row.Tipo_Dato === tipoDato)

const filterByPattern = (data: any[], pattern: string) =>
  data.filter((row) => row.Tipo_Dato && row.Tipo_Dato.startsWith(pattern))

const calcularPorcentaje = (valor: number, total: number) => (total > 0 ? ((valor / total) * 100).toFixed(1) : "0")

const formatearMoneda = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(valor)

// Formatear números sin abreviaciones
const formatearNumero = (valor: number) => valor.toLocaleString("es-AR")

// Componente KPI grande
const BigKPI = ({
  value,
  title,
  subtitle,
  color = "blue",
}: {
  value: string
  title: string
  subtitle: string
  color?: string
}) => (
  <div
    className={`text-center p-6 bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg border border-${color}-200`}
  >
    <div className={`text-4xl font-bold text-${color}-900`}>{value}</div>
    <div className={`text-lg font-medium text-${color}-700`}>{title}</div>
    <div className={`text-sm text-${color}-600`}>{subtitle}</div>
  </div>
)

// Componente KPI Card
const KPICard = ({
  title,
  value,
  unit,
  trend,
  color = "blue",
}: {
  title: string
  value: string
  unit?: string
  trend?: string
  color?: string
}) => (
  <div className={`p-4 bg-${color}-50 rounded-lg border border-${color}-200`}>
    <h4 className={`font-semibold text-${color}-800 mb-2`}>{title}</h4>
    <p className={`text-2xl font-bold text-${color}-600`}>
      {value} {unit && <span className="text-sm">{unit}</span>}
    </p>
    {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
  </div>
)

// Componente Section
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="border-l-4 border-l-blue-500">
    <CardHeader>
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

export function DatosGanaderos({ data, selectedCUIT }: Props) {
  if (!data) return null

  const ganaderia = data.ganaderia.filter((g: any) => g.CUIT === selectedCUIT)
  const productor = data.general.find((p: any) => p.CUIT === selectedCUIT)

  if (!productor) {
    return (
      <div className="text-center py-12">
        <Beef className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-500">No se encontraron datos para este productor.</p>
      </div>
    )
  }

  // Datos del General.csv
  const haNoAgricolasTotales = Number.parseFloat(productor.Ha_No_Agricolas_Totales || "0")
  const haNoAgricolasPropias = Number.parseFloat(productor.Ha_No_Agricolas_Propias || "0")
  const haNoAgricolasAlquiladas = Number.parseFloat(productor.Ha_No_Agricolas_Alquiladas || "0")
  const cabezasTotales = Number.parseInt(productor.Cabezas_Totales || "0")
  const stockCria = Number.parseInt(productor.Stock_Cria_Cabezas || "0")
  const valorStockTotal = Number.parseFloat(productor.Valor_Stock_Total || "0")
  const valorStockCria = Number.parseFloat(productor.Valor_Stock_Cria || "0")

  // BUSCAR DATOS GEOGRÁFICOS DE MANERA MÁS AMPLIA
  const datosGeograficos = useMemo(() => {
    // Buscar TODOS los registros que tengan información geográfica
    const conDepartamento = ganaderia.filter(
      (g: any) =>
        g.Departamento &&
        g.Departamento !== "TODOS" &&
        g.Departamento !== "todos" &&
        g.Provincia &&
        g.Provincia !== "TODAS" &&
        g.Provincia !== "todas",
    )

    // Buscar específicamente datos de hectáreas NO AGRÍCOLAS por departamento - MENOS RESTRICTIVO
    const hectareasGeograficas = ganaderia.filter((g: any) => g.Tipo_Dato === "Ha_No_Agricolas_Departamento")

    console.log("🗺️ Hectáreas geográficas filtradas:", hectareasGeograficas)

    return {
      todos: conDepartamento,
      hectareas: hectareasGeograficas,
    }
  }, [ganaderia])

  // Filtros específicos del CSV Ganaderia
  const hectareasData = {
    total: filterByTipo(ganaderia, "Ha_No_Agricolas_Tenencia"),
    porDepartamento: datosGeograficos.hectareas, // Usar los datos encontrados
    cargaAnimal: filterByTipo(ganaderia, "Carga_Animal"),
  }

  const stockTotal = filterByPattern(ganaderia, "Inventario_Total_")
  const stockTotalGeneral = filterByTipo(ganaderia, "Stock_Total_General")
  const stockCriaData = filterByTipo(ganaderia, "Stock_Modelo_Cria")
  const criaDetalle = filterByPattern(ganaderia, "Destinadas_Cria_")
  const stockEngorde = filterByTipo(ganaderia, "Stock_Total_Engorde")
  const engordeDetalle = filterByPattern(ganaderia, "Disponibles_Engorde_")
  const valuacionTotal = filterByTipo(ganaderia, "Valuacion_Stock_Total")
  const valuacionCria = filterByTipo(ganaderia, "Valuacion_Stock_Cria")
  const historicos = filterByTipo(ganaderia, "Valuacion_Stock_Total_Historica")
  const precios = filterByPattern(ganaderia, "Precio_Categoria_")
  const ingresos = filterByTipo(ganaderia, "Ingresos_Totales")
  const costos = filterByTipo(ganaderia, "Costos_Totales")
  const margen = filterByTipo(ganaderia, "Margen_Bruto")
  const costosPorTipo = filterByTipo(ganaderia, "Costos_Por_Tipo")

  const cargaAnimalValor = hectareasData.cargaAnimal[0]?.Valor_Numerico || "0"
  const stockEngordeTotal = cabezasTotales - stockCria

  const COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

  // Series históricas sin estado – evita re-renders infinitos
  const valuacionesHistoricas = useMemo(
    () =>
      ganaderia.filter(
        (g: any) =>
          g.Tipo_Dato === "Valuacion_Stock_Total_Historica" ||
          g.Tipo_Dato === "Valuacion_Stock_Cria_Historica" ||
          g.Categoria?.includes("Historica") ||
          g.Subcategoria?.includes("Anos") ||
          g.Detalle?.includes("Anos"),
      ),
    [ganaderia],
  )

  useEffect(() => {
    console.log("🐄 === DEBUG DATOS GANADERÍA ===")
    console.log("📊 Total registros ganadería:", ganaderia.length)

    // Mostrar tipos de datos únicos
    const tiposDatos = [...new Set(ganaderia.map((g) => g.Tipo_Dato))].filter(Boolean)
    console.log("📋 Tipos de datos disponibles:", tiposDatos)

    // Buscar datos geográficos específicos
    console.log("🗺️ Registros con datos geográficos:", datosGeograficos.todos.length)
    console.log("🗺️ Sample geográficos:", datosGeograficos.todos.slice(0, 5))

    // Buscar específicamente Ha_No_Agricolas_Tenencia
    const tenenciaData = ganaderia.filter((g) => g.Tipo_Dato === "Ha_No_Agricolas_Tenencia")
    console.log("🏠 Datos Ha_No_Agricolas_Tenencia:", tenenciaData)

    // Buscar datos de hectáreas
    console.log("🌾 Datos de hectáreas geográficas:", datosGeograficos.hectareas.length)
    console.log("🌾 Sample hectáreas:", datosGeograficos.hectareas.slice(0, 3))

    // DEBUG ESPECÍFICO para Ha_No_Agricolas_Departamento
    const hectareasDepto = ganaderia.filter((g) => g.Tipo_Dato === "Ha_No_Agricolas_Departamento")
    console.log("🔍 === DEBUG Ha_No_Agricolas_Departamento ===")
    console.log("🔍 Total registros encontrados:", hectareasDepto.length)
    console.log("🔍 Registros completos:", hectareasDepto)

    // Mostrar TODOS los campos de cada registro
    hectareasDepto.forEach((item, index) => {
      console.log(`🔍 Registro ${index}:`, {
        CUIT: item.CUIT,
        Tipo_Dato: item.Tipo_Dato,
        Categoria: item.Categoria,
        Subcategoria: item.Subcategoria,
        Detalle: item.Detalle,
        Departamento: item.Departamento,
        Provincia: item.Provincia,
        Valor_Numerico: item.Valor_Numerico,
        Valor_Texto: item.Valor_Texto,
        Unidad: item.Unidad,
        // Mostrar TODOS los campos
        allFields: Object.keys(item),
      })
    })

    // Verificar si los datos tienen departamento/provincia
    const conDepartamento = hectareasDepto.filter((item) => item.Departamento && item.Departamento !== "TODOS")
    const conProvincia = hectareasDepto.filter((item) => item.Provincia && item.Provincia !== "TODAS")
    console.log("🔍 Con Departamento válido:", conDepartamento.length)
    console.log("🔍 Con Provincia válida:", conProvincia.length)

    // Buscar valuaciones históricas
    console.log("📈 Valuaciones históricas encontradas:", valuacionesHistoricas.length)
    console.log("📈 Sample valuaciones:", valuacionesHistoricas.slice(0, 3))

    console.log(
      "🔍 Datos propios filtrados:",
      hectareasData.porDepartamento.filter((item: any) => item.Categoria === "Propios"),
    )
    console.log(
      "🔍 Datos alquilados filtrados:",
      hectareasData.porDepartamento.filter((item: any) => item.Categoria === "Alquilados"),
    )
  }, [])

  if (haNoAgricolasTotales === 0 && cabezasTotales === 0) {
    return (
      <div className="text-center py-12">
        <Beef className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-500">Este productor no tiene actividad ganadera registrada.</p>
        <p className="text-sm text-gray-400 mt-2">Enfocado principalmente en agricultura.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 1. 🏞️ HECTÁREAS NO AGRÍCOLAS */}
      <Section title="🏞️ Hectáreas No Agrícolas">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <KPICard title="Ha Propias" value={haNoAgricolasPropias.toLocaleString()} unit="ha" color="green" />
          <KPICard title="Ha Alquiladas" value={haNoAgricolasAlquiladas.toLocaleString()} unit="ha" color="orange" />
          <KPICard
            title="Carga Animal"
            value={Number.parseFloat(cargaAnimalValor).toFixed(2)}
            unit="cab/ha"
            color="blue"
          />
        </div>

        {/* Gráfico de distribución geográfica */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico por tenencia */}
          <div>
            <h4 className="font-semibold mb-4">Distribución por Tenencia</h4>
            <ChartContainer
              config={{
                hectareas: { label: "Hectáreas", color: "#22c55e" },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Propias", value: haNoAgricolasPropias, color: "#22c55e" },
                      { name: "Alquiladas", value: haNoAgricolasAlquiladas, color: "#f97316" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value.toLocaleString()} ha (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f97316" />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Gráfico por departamento */}
          {hectareasData.porDepartamento.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Distribución por Departamento</h4>
              <ChartContainer
                config={{
                  hectareas: { label: "Hectáreas", color: "#3b82f6" },
                }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hectareasData.porDepartamento.map((item) => ({
                      departamento: item.Departamento,
                      hectareas: Number.parseFloat(item.Valor_Numerico || "0"),
                      tenencia: item.Detalle || item.Categoria,
                    }))}
                  >
                    <XAxis dataKey="departamento" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="hectareas" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
        </div>

        {/* Mejorar la tabla para mostrar ubicación por tenencia */}
        {hectareasData.porDepartamento.length > 0 ? (
          <div className="space-y-6">
            <h4 className="font-semibold">Distribución Geográfica por Tenencia</h4>

            {/* Hectáreas Propias */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-800 mb-3">📍 Ubicación de Hectáreas Propias</h5>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Provincia</TableHead>
                      <TableHead className="text-right">Hectáreas</TableHead>
                      <TableHead className="text-right">% de Propias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hectareasData.porDepartamento
                      .filter((item: any) => item.Categoria === "Propios")
                      .map((item: any, idx: number) => {
                        const hectareas = Number.parseFloat(item.Valor_Numerico || "0")
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.Departamento}</TableCell>
                            <TableCell>{item.Provincia}</TableCell>
                            <TableCell className="text-right">{hectareas.toLocaleString()} ha</TableCell>
                            <TableCell className="text-right">
                              {calcularPorcentaje(hectareas, haNoAgricolasPropias)}%
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Hectáreas Alquiladas */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h5 className="font-semibold text-orange-800 mb-3">📍 Ubicación de Hectáreas Alquiladas</h5>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Provincia</TableHead>
                      <TableHead className="text-right">Hectáreas</TableHead>
                      <TableHead className="text-right">% de Alquiladas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hectareasData.porDepartamento
                      .filter((item: any) => item.Categoria === "Alquilados")
                      .map((item: any, idx: number) => {
                        const hectareas = Number.parseFloat(item.Valor_Numerico || "0")
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.Departamento}</TableCell>
                            <TableCell>{item.Provincia}</TableCell>
                            <TableCell className="text-right">{hectareas.toLocaleString()} ha</TableCell>
                            <TableCell className="text-right">
                              {calcularPorcentaje(hectareas, haNoAgricolasAlquiladas)}%
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Datos Geográficos No Disponibles</h5>
            <p className="text-sm text-yellow-700">
              No se encontraron datos detallados de ubicación por departamento/provincia en el CSV de ganadería.
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Datos disponibles: {datosGeograficos.todos.length} registros con información geográfica
            </p>
          </div>
        )}
      </Section>

      {/* 2. 🐄 STOCK TOTAL (Inventario Completo) */}
      <Section title="🐄 Inventario Stock Total">
        <div className="mb-6">
          <BigKPI value={cabezasTotales.toLocaleString()} title="STOCK TOTAL" subtitle="cabezas" color="purple" />
        </div>

        {/* Resumen de distribución Cría vs Engorde */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Stock de Cría</h4>
            <p className="text-3xl font-bold text-green-600">{stockCria.toLocaleString()}</p>
            <p className="text-sm text-gray-600">{calcularPorcentaje(stockCria, cabezasTotales)}% del total</p>
            <p className="text-xs text-green-700 mt-1">Destinadas a reproducción</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Stock de Engorde</h4>
            <p className="text-3xl font-bold text-blue-600">{stockEngordeTotal.toLocaleString()}</p>
            <p className="text-sm text-gray-600">{calcularPorcentaje(stockEngordeTotal, cabezasTotales)}% del total</p>
            <p className="text-xs text-blue-700 mt-1">Disponibles para comercialización</p>
          </div>
        </div>

        {/* Gráfico simple y claro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            config={{
              value: { label: "Cabezas", color: "#3b82f6" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Stock de Cría", value: stockCria, color: "#22c55e" },
                    { name: "Stock de Engorde", value: stockEngordeTotal, color: "#3b82f6" },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="space-y-4">
            <h4 className="font-semibold">Composición del Rodeo</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="font-medium">Stock de Cría</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{stockCria.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{calcularPorcentaje(stockCria, cabezasTotales)}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="font-medium">Stock de Engorde</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{stockEngordeTotal.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{calcularPorcentaje(stockEngordeTotal, cabezasTotales)}%</div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border-t-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total del Rodeo</span>
                  <span className="font-bold text-lg">{cabezasTotales.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Carga: {Number.parseFloat(cargaAnimalValor).toFixed(2)} cab/ha
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. 🔄 MODELO DE CRÍA (Plan Reproductivo) */}
      <Section title="🔄 Modelo de Cría">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <BigKPI value={stockCria.toLocaleString()} title="TOTAL CRÍA" subtitle="cabezas destinadas" color="green" />

            {criaDetalle.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Cabezas</TableHead>
                      <TableHead className="text-right">% del Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criaDetalle.map((item: any, idx: number) => {
                      const cabezas = Number.parseFloat(item.Valor_Numerico || "0")
                      return (
                        <TableRow key={idx}>
                          <TableCell>{item.Categoria || item.Subcategoria}</TableCell>
                          <TableCell className="text-right font-medium">{cabezas.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{calcularPorcentaje(cabezas, stockCria)}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {criaDetalle.length > 0 && (
            <ChartContainer
              config={{
                value: { label: "Cabezas", color: "#22c55e" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={criaDetalle.map((item) => ({
                      name: item.Categoria || item.Subcategoria,
                      value: Number.parseFloat(item.Valor_Numerico || "0"),
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {criaDetalle.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </Section>

      {/* 4. 💰 POTENCIAL ENGORDE (Comercializable) */}
      <Section title="💰 Potencial Engorde">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <BigKPI
              value={stockEngordeTotal.toLocaleString()}
              title="DISPONIBLE ENGORDE"
              subtitle="cabezas comercializables"
              color="blue"
            />

            {engordeDetalle.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Cabezas</TableHead>
                      <TableHead className="text-right">% del Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engordeDetalle.map((item: any, idx: number) => {
                      const cabezas = Number.parseFloat(item.Valor_Numerico || "0")
                      return (
                        <TableRow key={idx}>
                          <TableCell>{item.Categoria || item.Subcategoria}</TableCell>
                          <TableCell className="text-right font-medium">{cabezas.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {calcularPorcentaje(cabezas, stockEngordeTotal)}%
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {engordeDetalle.length > 0 && (
            <ChartContainer
              config={{
                cabezas: { label: "Cabezas", color: "#3b82f6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={engordeDetalle.map((item) => ({
                    categoria: item.Categoria || item.Subcategoria,
                    cabezas: Number.parseFloat(item.Valor_Numerico || "0"),
                  }))}
                >
                  <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cabezas" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </Section>

      {/* 5. 💎 VALUACIONES (Valor Activos) */}
      <Section title="💎 Valuaciones del Stock">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KPICard title="Valuación Total" value={formatearNumero(valorStockTotal)} color="indigo" />
          <KPICard title="Valuación Cría" value={formatearNumero(valorStockCria)} color="green" />
          <KPICard
            title="Valor por Cabeza"
            value={formatearNumero(Math.round(valorStockTotal / cabezasTotales))}
            unit="promedio"
            color="yellow"
          />
        </div>

        {/* Agregar comparación histórica MEJORADA */}
        <div className="mb-6">
          <h4 className="font-semibold mb-4">Comparación de Valuaciones Históricas</h4>

          {/* Valuación Total */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-700 mb-3">💰 Valuación Stock Total</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h6 className="font-semibold text-blue-800 mb-2">Actual</h6>
                <p className="text-2xl font-bold text-blue-600">{formatearNumero(valorStockTotal)}</p>
                <p className="text-sm text-gray-600">Valuación presente</p>
              </div>

              {/* Buscar datos históricos reales o usar estimaciones */}
              {valuacionesHistoricas.length > 0 ? (
                valuacionesHistoricas
                  .filter((val) => val.Tipo_Dato?.includes("Stock_Total"))
                  .slice(0, 3)
                  .map((val: any, idx: number) => {
                    const titulo = val.Detalle?.includes("5")
                      ? "5 años"
                      : val.Detalle?.includes("10")
                        ? "10 años"
                        : val.Detalle?.includes("20")
                          ? "20 años"
                          : val.Subcategoria || val.Detalle
                    return (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h6 className="font-semibold text-gray-800 mb-2">{titulo}</h6>
                        <p className="text-2xl font-bold text-gray-600">
                          {formatearNumero(Number.parseFloat(val.Valor_Numerico || "0"))}
                        </p>
                        <p className="text-sm text-gray-600">Histórico</p>
                      </div>
                    )
                  })
              ) : (
                // Estimaciones si no hay datos históricos
                <>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h6 className="font-semibold text-green-800 mb-2">5 años</h6>
                    <p className="text-2xl font-bold text-green-600">
                      {formatearNumero(Math.round(valorStockTotal * 0.85))}
                    </p>
                    <p className="text-sm text-gray-600">Estimado</p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h6 className="font-semibold text-yellow-800 mb-2">10 años</h6>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatearNumero(Math.round(valorStockTotal * 0.75))}
                    </p>
                    <p className="text-sm text-gray-600">Estimado</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h6 className="font-semibold text-purple-800 mb-2">20 años</h6>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatearNumero(Math.round(valorStockTotal * 0.6))}
                    </p>
                    <p className="text-sm text-gray-600">Estimado</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Valuación Cría */}
          <div>
            <h5 className="font-medium text-gray-700 mb-3">🐄 Valuación Stock Cría</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h6 className="font-semibold text-green-800 mb-2">Actual</h6>
                <p className="text-2xl font-bold text-green-600">{formatearNumero(valorStockCria)}</p>
                <p className="text-sm text-gray-600">Valuación presente</p>
              </div>

              <div className="p-4 bg-green-100 rounded-lg border border-green-300">
                <h6 className="font-semibold text-green-800 mb-2">5 años</h6>
                <p className="text-2xl font-bold text-green-700">
                  {formatearNumero(Math.round(valorStockCria * 0.88))}
                </p>
                <p className="text-sm text-gray-600">Estimado</p>
              </div>

              <div className="p-4 bg-green-200 rounded-lg border border-green-400">
                <h6 className="font-semibold text-green-800 mb-2">10 años</h6>
                <p className="text-2xl font-bold text-green-800">
                  {formatearNumero(Math.round(valorStockCria * 0.78))}
                </p>
                <p className="text-sm text-gray-600">Estimado</p>
              </div>

              <div className="p-4 bg-green-300 rounded-lg border border-green-500">
                <h6 className="font-semibold text-green-800 mb-2">20 años</h6>
                <p className="text-2xl font-bold text-green-900">
                  {formatearNumero(Math.round(valorStockCria * 0.65))}
                </p>
                <p className="text-sm text-gray-600">Estimado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distribución de valuación */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold mb-4">Distribución de Valuación</h4>
            <ChartContainer
              config={{
                valor: { label: "Valor USD", color: "#8b5cf6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Stock Cría", value: valorStockCria, color: "#22c55e" },
                      { name: "Stock Engorde", value: valorStockTotal - valorStockCria, color: "#3b82f6" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${formatearNumero(value)} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">{formatearMoneda(data.value)}</p>
                            <p className="text-sm">{formatearNumero(data.value)} USD</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Valor por Categoría</h4>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Valor Cría</span>
                  <span className="text-lg font-bold text-green-600">{formatearMoneda(valorStockCria)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">{stockCria.toLocaleString()} cabezas</span>
                  <span className="text-xs text-green-600">
                    {formatearNumero(Math.round(valorStockCria / stockCria))}/cabeza
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">Valor Engorde</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatearMoneda(valorStockTotal - valorStockCria)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">{stockEngordeTotal.toLocaleString()} cabezas</span>
                  <span className="text-xs text-blue-600">
                    {formatearNumero(Math.round((valorStockTotal - valorStockCria) / stockEngordeTotal))}/cabeza
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-800">Promedio General</span>
                  <span className="text-lg font-bold text-gray-600">
                    {formatearNumero(Math.round(valorStockTotal / cabezasTotales))}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">Por cabeza</span>
                  <span className="text-xs text-gray-600">Valor promedio del rodeo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de precios únicos SIMPLIFICADA */}
        {precios.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">Precios por Categoría</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio/Cabeza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...new Map(precios.map((item) => [item.Categoria || item.Subcategoria, item])).values()].map(
                    (item: any, idx: number) => {
                      const precio = Number.parseFloat(item.Valor_Numerico || "0")
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.Categoria || item.Subcategoria}</TableCell>
                          <TableCell className="text-right">{formatearMoneda(precio)}</TableCell>
                        </TableRow>
                      )
                    },
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Section>

      {/* 6. 💸 ANÁLISIS ECONÓMICO (P&L Ganadero) */}
      <Section title="💸 Análisis Económico">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <KPICard
            title="Ingresos"
            value={ingresos[0] ? formatearMoneda(Number.parseFloat(ingresos[0].Valor_Numerico || "0")) : "$0"}
            color="green"
          />
          <KPICard
            title="Costos"
            value={costos[0] ? formatearMoneda(Number.parseFloat(costos[0].Valor_Numerico || "0")) : "$0"}
            color="red"
          />
          <KPICard
            title="Margen"
            value={margen[0] ? formatearMoneda(Number.parseFloat(margen[0].Valor_Numerico || "0")) : "$0"}
            color="blue"
          />
        </div>

        {costosPorTipo.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              config={{
                value: { label: "Monto", color: "#ef4444" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costosPorTipo.map((item) => ({
                      name: item.Categoria || item.Subcategoria,
                      value: Number.parseFloat(item.Valor_Numerico || "0"),
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costosPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => [formatearMoneda(value), "Monto"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo Costo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">% del Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costosPorTipo.map((item: any, idx: number) => {
                    const monto = Number.parseFloat(item.Valor_Numerico || "0")
                    const totalCostos = costosPorTipo.reduce(
                      (sum, c) => sum + Number.parseFloat(c.Valor_Numerico || "0"),
                      0,
                    )
                    return (
                      <TableRow key={idx}>
                        <TableCell>{item.Categoria || item.Subcategoria}</TableCell>
                        <TableCell className="text-right font-medium">{formatearMoneda(monto)}</TableCell>
                        <TableCell className="text-right">{calcularPorcentaje(monto, totalCostos)}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
