"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Wheat, MapPin, DollarSign, BarChart3, Filter, PieChartIcon } from "lucide-react"

interface Props {
  data: any
  selectedCUIT: string
}

export function DatosAgricolas({ data, selectedCUIT }: Props) {
  const [tenenciaFilter, setTenenciaFilter] = useState<string>("todos")
  const [cultivoFilter, setCultivoFilter] = useState<string>("todos")
  const [rotacionProvinciaFilter, setRotacionProvinciaFilter] = useState<string>("todos")
  const [rotacionTenenciaFilter, setRotacionTenenciaFilter] = useState<string>("todos")

  const cultivos = data.agricultura.filter((a: any) => a.CUIT === selectedCUIT)
  const rotacion = data.rotacion.filter((r: any) => r.CUIT === selectedCUIT)
  const productor = data.general.find((p: any) => p.CUIT === selectedCUIT)

  const haAgricolasPropias = Number.parseFloat(productor?.Ha_Agricolas_Propias || "0")
  const haAgricolasAlquiladas = Number.parseFloat(productor?.Ha_Agricolas_Alquiladas || "0")
  const haAgricolasTotales = haAgricolasPropias + haAgricolasAlquiladas

  const pctPropias = haAgricolasTotales > 0 ? (haAgricolasPropias / haAgricolasTotales) * 100 : 0
  const pctAlquiladas = haAgricolasTotales > 0 ? (haAgricolasAlquiladas / haAgricolasTotales) * 100 : 0

  const resumenTenencia = cultivos.filter((c: any) => c.Tipo_Analisis === "Resumen_Tenencia" && c.Cultivo === "TODOS")

  // Tomar solo UN registro por tenencia para evitar duplicaciones
  const ingresosPropiosData = resumenTenencia.find((c: any) => c.Tenencia === "Propios")
  const ingresosAlquiladosData = resumenTenencia.find((c: any) => c.Tenencia === "Alquilados")

  const ingresosPropios = ingresosPropiosData ? Number.parseFloat(ingresosPropiosData.Ingreso_Neto_Total || "0") : 0
  const ingresosAlquilados = ingresosAlquiladosData
    ? Number.parseFloat(ingresosAlquiladosData.Ingreso_Neto_Total || "0")
    : 0

  const ingresosTotal = ingresosPropios + ingresosAlquilados

  const cultivosDetalle = cultivos.filter(
    (c: any) => c.Tipo_Analisis === "Detalle_Cultivo_Tenencia" && c.Cultivo !== "TODOS" && c.Cultivo !== "todos",
  )

  const cultivosPorTipo = cultivosDetalle.reduce((acc: any, cultivo: any) => {
    const key = `${cultivo.Cultivo}_${cultivo.Tenencia}`
    const superficie = Number.parseFloat(cultivo.Ha_Superficie || "0")
    const rend5 = Number.parseFloat(cultivo.Rendimiento_5_Anos_Tn_Ha || "0")
    const rend10 = Number.parseFloat(cultivo.Rendimiento_10_Anos_Tn_Ha || "0")
    const rendPeor = Number.parseFloat(cultivo.Rendimiento_2_Peores_Anos_Tn_Ha || "0")

    if (superficie > 0 && (rend5 > 0 || rend10 > 0)) {
      if (!acc[key]) {
        acc[key] = {
          cultivo: cultivo.Cultivo,
          tenencia: cultivo.Tenencia,
          hectareas: 0,
          ingresoBruto: 0,
          ingresoNeto: 0,
          rendimiento5: 0,
          rendimiento10: 0,
          rendimientoPeor: 0,
          distanciaPromedio: 0,
          provincia: cultivo.Provincia,
          departamento: cultivo.Departamento,
          count: 0,
        }
      }
      acc[key].hectareas += superficie
      acc[key].ingresoBruto += Number.parseFloat(cultivo.Ingreso_Bruto_Total || "0")
      acc[key].ingresoNeto += Number.parseFloat(cultivo.Ingreso_Neto_Total || "0")
      acc[key].rendimiento5 += rend5
      acc[key].rendimiento10 += rend10
      acc[key].rendimientoPeor += rendPeor
      acc[key].distanciaPromedio += Number.parseFloat(cultivo.KM_Ponderados_Superficie || "0")
      acc[key].count += 1
    }
    return acc
  }, {})

  const cultivosResumen = Object.values(cultivosPorTipo).map((c: any) => ({
    ...c,
    rendimiento5: c.rendimiento5 / c.count,
    rendimiento10: c.rendimiento10 / c.count,
    rendimientoPeor: c.rendimientoPeor / c.count,
    distanciaPromedio: c.distanciaPromedio / c.count,
    margen: c.ingresoBruto > 0 ? (c.ingresoNeto / c.ingresoBruto) * 100 : 0,
  }))

  const cultivosUnicos = [...new Set(cultivosResumen.map((c: any) => c.cultivo))].filter(
    (cultivo) => cultivo !== "TODOS" && cultivo !== "todos",
  )

  const getChartDataRendimientos = (cultivosResumen: any[], tenenciaFilter: string, cultivoFilter: string) => {
    let filteredData = [...cultivosResumen]

    if (tenenciaFilter !== "todos") {
      filteredData = filteredData.filter((item) => item.tenencia === tenenciaFilter)
    }

    if (cultivoFilter !== "todos") {
      filteredData = filteredData.filter((item) => item.cultivo === cultivoFilter)
    }

    const result = filteredData.map((c: any) => ({
      id: `${c.cultivo}_${c.tenencia}`,
      cultivoCompleto: `${c.cultivo} (${c.tenencia})`,
      tenencia: c.tenencia,
      cultivoNombre: c.cultivo,
      "5 años": c.rendimiento5,
      "10 años": c.rendimiento10,
      Peor: c.rendimientoPeor,
      hectareas: c.hectareas,
    }))

    return result
  }

  const chartDataRendimientos = useMemo(() => {
    return getChartDataRendimientos(cultivosResumen, tenenciaFilter, cultivoFilter)
  }, [cultivosResumen, tenenciaFilter, cultivoFilter])

  const totalHectareas = cultivosResumen.reduce((sum, c) => sum + c.hectareas, 0)
  const totalIngresoBruto = cultivosResumen.reduce((sum, c) => sum + c.ingresoBruto, 0)
  const totalIngresoNeto = cultivosResumen.reduce((sum, c) => sum + c.ingresoNeto, 0)

  const fletePropios = Number.parseFloat(productor?.Distancia_Puerto_Promedio_Propios || "0")
  const fleteAlquilados = Number.parseFloat(productor?.Distancia_Puerto_Promedio_Alquilados || "0")

  const rotacionLimpia = rotacion.filter(
    (r: any) =>
      r.Cultivo !== "TODOS" &&
      r.Cultivo !== "todos" &&
      r.Provincia !== "TODAS" &&
      r.Provincia !== "todas" &&
      r.Departamento !== "TODOS" &&
      r.Departamento !== "todos",
  )

  const provinciasRotacion = [...new Set(rotacionLimpia.map((r: any) => r.Provincia))].filter(Boolean)
  const tenenciasRotacion = [...new Set(rotacionLimpia.map((r: any) => r.Tenencia))].filter(Boolean)

  const rotacionFiltrada = useMemo(() => {
    let filtered = [...rotacionLimpia]

    if (rotacionProvinciaFilter !== "todos") {
      filtered = filtered.filter((r: any) => r.Provincia === rotacionProvinciaFilter)
    }

    if (rotacionTenenciaFilter !== "todos") {
      filtered = filtered.filter((r: any) => r.Tenencia === rotacionTenenciaFilter)
    }

    filtered = filtered.filter((r: any) => Number.parseFloat(r.Ha_Promedio_Anual || "0") > 1)

    return filtered
  }, [rotacionLimpia, rotacionProvinciaFilter, rotacionTenenciaFilter])

  const rotacionPorCultivo = rotacionFiltrada.reduce((acc: any, r: any) => {
    const cultivo = r.Cultivo
    if (!acc[cultivo]) {
      acc[cultivo] = 0
    }
    acc[cultivo] += Number.parseFloat(r.Ha_Promedio_Anual || "0")
    return acc
  }, {})

  const chartDataRotacion = Object.entries(rotacionPorCultivo)
    .map(([cultivo, hectareas]) => ({
      cultivo,
      hectareas: Number(hectareas),
    }))
    .filter((item) => item.hectareas > 0)
    .filter((item) => {
      const total = Object.values(rotacionPorCultivo).reduce((sum, h) => sum + Number(h), 0)
      return item.hectareas / total >= 0.01
    })

  const rotacionPorDepartamento = rotacionFiltrada.reduce((acc: any, r: any) => {
    const key = r.Departamento
    if (!acc[key]) {
      acc[key] = 0
    }
    acc[key] += Number.parseFloat(r.Ha_Promedio_Anual || "0")
    return acc
  }, {})

  const chartDataDepartamentos = Object.entries(rotacionPorDepartamento)
    .map(([departamento, hectareas]) => ({
      departamento: departamento.length > 10 ? departamento.substring(0, 10) + "..." : departamento,
      departamentoCompleto: departamento,
      hectareas: Number(hectareas),
    }))
    .filter((item) => item.hectareas > 0)
    .sort((a, b) => b.hectareas - a.hectareas)

  const COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

  if (!data || cultivos.length === 0) {
    return (
      <div className="text-center py-12">
        <Wheat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-500">Sin datos agrícolas disponibles para este productor.</p>
        <p className="text-sm text-gray-400 mt-2">Este productor puede estar enfocado principalmente en ganadería.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ha Agrícolas Propias</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{haAgricolasPropias.toLocaleString()} ha</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={pctPropias} className="flex-1" />
              <span className="text-sm font-medium">{pctPropias.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ha Agrícolas Alquiladas</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{haAgricolasAlquiladas.toLocaleString()} ha</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={pctAlquiladas} className="flex-1" />
              <span className="text-sm font-medium">{pctAlquiladas.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${ingresosTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {haAgricolasTotales > 0 ? `$${(ingresosTotal / haAgricolasTotales).toFixed(0)}/ha promedio` : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rendimientos por Cultivo ({chartDataRendimientos.length} registros)
          </CardTitle>
          <CardDescription>Comparación: 5 años, 10 años y peores años</CardDescription>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <label className="text-sm font-medium">Tenencia:</label>
              <Select value={tenenciaFilter} onValueChange={setTenenciaFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Propios">Propios</SelectItem>
                  <SelectItem value="Alquilados">Alquilados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Cultivo:</label>
              <Select value={cultivoFilter} onValueChange={setCultivoFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {cultivosUnicos.map((cultivo) => (
                    <SelectItem key={cultivo} value={cultivo}>
                      {cultivo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartDataRendimientos.length > 0 ? (
            <ChartContainer
              config={{
                "5 años": { label: "5 años", color: "#22c55e" },
                "10 años": { label: "10 años", color: "#3b82f6" },
                Peor: { label: "Peor", color: "#ef4444" },
              }}
              className="h-[500px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataRendimientos} margin={{ bottom: 150, left: 40, right: 40, top: 20 }}>
                  <XAxis
                    dataKey="cultivoCompleto"
                    angle={-45}
                    textAnchor="end"
                    height={150}
                    interval={0}
                    fontSize={11}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      return value.length > 20 ? value.substring(0, 20) + "..." : value
                    }}
                  />
                  <YAxis tickFormatter={(value) => `${value} tn/ha`} width={60} />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{data.cultivoCompleto}</p>
                            <p className="text-sm text-gray-600">{data.hectareas.toFixed(1)} hectáreas</p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {Number(entry.value).toFixed(1)} tn/ha
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="5 años" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="10 años" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Peor" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-500">No hay datos para los filtros seleccionados</p>
                <p className="text-sm text-gray-400">Prueba cambiando los filtros</p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>Datos disponibles: {cultivosResumen.length} cultivos</p>
                  <p>Tenencias: {[...new Set(cultivosResumen.map((c: any) => c.tenencia))].join(", ")}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Análisis de Rotación de Cultivos
          </CardTitle>
          <CardDescription>Distribución de hectáreas por cultivo y región (sin totales agregados)</CardDescription>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <label className="text-sm font-medium">Provincia:</label>
              <Select value={rotacionProvinciaFilter} onValueChange={setRotacionProvinciaFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {provinciasRotacion.map((provincia) => (
                    <SelectItem key={provincia} value={provincia}>
                      {provincia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tenencia:</label>
              <Select value={rotacionTenenciaFilter} onValueChange={setRotacionTenenciaFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {tenenciasRotacion.map((tenencia) => (
                    <SelectItem key={tenencia} value={tenencia}>
                      {tenencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full">
              <h4 className="font-semibold mb-4 text-center">Distribución por Cultivo</h4>
              {chartDataRotacion.length > 0 ? (
                <ChartContainer
                  config={{
                    hectareas: { label: "Hectáreas", color: "#22c55e" },
                  }}
                  className="h-[350px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartDataRotacion}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ cultivo, percent }) =>
                          percent > 0.05 ? `${cultivo} ${(percent * 100).toFixed(0)}%` : ""
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="hectareas"
                      >
                        {chartDataRotacion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="font-semibold">{data.cultivo}</p>
                                <p className="text-sm">{data.hectareas.toFixed(1)} hectáreas</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Sin datos de rotación</p>
                </div>
              )}
            </div>

            <div className="w-full">
              <h4 className="font-semibold mb-4 text-center">Distribución por Departamento</h4>
              {chartDataDepartamentos.length > 0 ? (
                <ChartContainer
                  config={{
                    hectareas: { label: "Hectáreas", color: "#3b82f6" },
                  }}
                  className="h-[350px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataDepartamentos} margin={{ bottom: 80, left: 20, right: 20, top: 20 }}>
                      <XAxis
                        dataKey="departamento"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        fontSize={10}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tickFormatter={(value) => `${value} ha`} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="font-semibold">{data.departamentoCompleto}</p>
                                <p className="text-sm">{data.hectareas.toFixed(1)} hectáreas</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="hectareas" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Sin datos por departamento</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ingresos Agrícolas por Tenencia
            </CardTitle>
            <CardDescription>Distribución de ingresos netos entre campos propios y alquilados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Ingresos Agrícolas Propios</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Ingresos Netos:</span>
                  <span className="text-xl font-bold text-green-600">${ingresosPropios.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Superficie:</span>
                  <span className="font-medium">{haAgricolasPropias.toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Promedio por hectárea:</span>
                  <span className="font-medium">
                    ${haAgricolasPropias > 0 ? (ingresosPropios / haAgricolasPropias).toFixed(0) : "0"}/ha
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">Ingresos Agrícolas Alquilados</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Ingresos Netos:</span>
                  <span className="text-xl font-bold text-orange-600">${ingresosAlquilados.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Superficie:</span>
                  <span className="font-medium">{haAgricolasAlquiladas.toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Promedio por hectárea:</span>
                  <span className="font-medium">
                    ${haAgricolasAlquiladas > 0 ? (ingresosAlquilados / haAgricolasAlquiladas).toFixed(0) : "0"}/ha
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Rotación por Región</CardTitle>
          <CardDescription>
            Datos filtrados: {rotacionFiltrada.length} registros &gt;1 ha de {rotacionLimpia.length} totales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provincia</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Tenencia</TableHead>
                  <TableHead>Cultivo</TableHead>
                  <TableHead className="text-right">Ha Promedio Anual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotacionFiltrada.map((r: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{r.Provincia}</TableCell>
                    <TableCell>{r.Departamento}</TableCell>
                    <TableCell>
                      <Badge variant={r.Tenencia === "PROPIAS" ? "default" : "secondary"}>{r.Tenencia}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.Cultivo}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number.parseFloat(r.Ha_Promedio_Anual || "0").toFixed(1)} ha
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle Completo por Cultivo</CardTitle>
          <CardDescription>
            Información detallada de rendimientos, ingresos y ubicación (Fuente: Detalle_Cultivo_Tenencia)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cultivo</TableHead>
                  <TableHead>Tenencia</TableHead>
                  <TableHead className="hidden md:table-cell">Provincia</TableHead>
                  <TableHead className="hidden lg:table-cell">Departamento</TableHead>
                  <TableHead className="text-right">Superficie (ha)</TableHead>
                  <TableHead className="text-right">Rend. 5a</TableHead>
                  <TableHead className="text-right">Rend. 10a</TableHead>
                  <TableHead className="text-right">Rend. Peor</TableHead>
                  <TableHead className="text-right">Ingreso Bruto</TableHead>
                  <TableHead className="text-right">Ingreso Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cultivosResumen.map((c: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Wheat className="h-4 w-4 text-green-600" />
                        {c.cultivo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.tenencia === "Propios" ? "default" : "secondary"}>{c.tenencia}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{c.provincia}</TableCell>
                    <TableCell className="hidden lg:table-cell">{c.departamento}</TableCell>
                    <TableCell className="text-right font-medium">{c.hectareas.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {c.rendimiento5 > 0 ? `${c.rendimiento5.toFixed(1)} tn/ha` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.rendimiento10 > 0 ? `${c.rendimiento10.toFixed(1)} tn/ha` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.rendimientoPeor > 0
                        ? `${c.rendimientoPeor.toFixed(1)} tn/ha`
                        : c.cultivo.toLowerCase().includes("maiz") || c.cultivo.toLowerCase().includes("maíz")
                          ? "0.0 tn/ha"
                          : ""}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      ${c.ingresoBruto.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${c.ingresoNeto.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="hidden md:table-cell">-</TableCell>
                  <TableCell className="hidden lg:table-cell">-</TableCell>
                  <TableCell className="text-right font-bold">{totalHectareas.toLocaleString()}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    ${totalIngresoBruto.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    ${totalIngresoNeto.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Ejecutivo Agrícola</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">Tenencia</p>
              <p className="text-2xl font-bold">{pctPropias.toFixed(0)}% Propia</p>
              <p className="text-sm text-gray-600">{pctAlquiladas.toFixed(0)}% Alquilada</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">Eficiencia</p>
              <p className="text-2xl font-bold">
                ${haAgricolasTotales > 0 ? (ingresosTotal / haAgricolasTotales).toFixed(0) : "0"}/ha
              </p>
              <p className="text-sm text-gray-600">Ingreso promedio</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">Diversificación</p>
              <p className="text-2xl font-bold">{cultivosResumen.length}</p>
              <p className="text-sm text-gray-600">Cultivos activos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DatosAgricolas
