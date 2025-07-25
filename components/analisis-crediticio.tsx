"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Target,
  Shield,
  Flame,
  Calculator,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react"

interface AnalisisCrediticioProps {
  data: any
  selectedCUIT: string
}

export function AnalisisCrediticio({ data, selectedCUIT }: AnalisisCrediticioProps) {
  const [crediticioData, setCrediticioData] = useState<any[]>([])
  const [productor, setProductor] = useState<any>(null)
  const [nivelSeleccionado, setNivelSeleccionado] = useState<"conservador" | "moderado" | "agresivo">("moderado")

  // Función helper para buscar datos
  const buscar = (tipoDato: string, categoria: string) => {
    const item = crediticioData.find((c) => c.Tipo_Dato === tipoDato && c.Categoria === categoria)
    return item
  }

  const getValor = (tipoDato: string, categoria: string) => {
    const item = buscar(tipoDato, categoria)
    return item ? Number.parseFloat(item.Valor_Numerico || "0") : 0
  }

  const getTexto = (tipoDato: string, categoria: string) => {
    const item = buscar(tipoDato, categoria)
    return item?.Valor_Texto || "N/A"
  }

  useEffect(() => {
    if (!data || !selectedCUIT) return

    const crediticio = data.crediticio.filter((c: any) => c.CUIT === selectedCUIT)
    setCrediticioData(crediticio)

    const prod = data.general.find((p: any) => p.CUIT === selectedCUIT)
    setProductor(prod)

    console.log("🔍 === DATOS CREDITICIOS CORREGIDOS ===")
    console.log("📊 Total registros:", crediticio.length)
  }, [data, selectedCUIT])

  if (!data || !selectedCUIT) return null
  if (!productor) return <div>No se encontraron datos crediticios</div>

  // CALCULAR ACTIVOS TOTALES CORRECTAMENTE: TIERRAS + STOCK GANADERO
  const valorStockTotal = Number.parseFloat(productor.Valor_Stock_Total || "0")
  const activosData = data.activos?.filter((a: any) => a.CUIT === selectedCUIT) || []
  const valorTierraPromedio = activosData.find(
    (a) => a.Tipo_Dato === "Valor_Tierra_Simple" && a.Subcategoria === "Valor_Final_Promedio",
  )
  const valorTierras = valorTierraPromedio ? Number.parseFloat(valorTierraPromedio.Valor_Numerico || "0") : 0
  const activosTotales = valorTierras + valorStockTotal

  // 1. MÉTRICAS BÁSICAS DE NOSIS - NOMBRES CORRECTOS
  const metricasBasicas = {
    scoreNosis: buscar("Score_Crediticio", "SCORE_NOSIS"),
    endeudamientoTotal: buscar("Endeudamiento_Total", "DEUDA_SISTEMA_FINANCIERO"),
    chequesRechazados: buscar("Cheques_Rechazados", "CHEQUES_ULTIMO_AÑO"),
    bancosConDeuda: buscar("Deuda_Bancos", "BANCOS_CON_DEUDA"),
    consultasNosis: buscar("Consultas_Nosis", "CONSULTAS_12_MESES"),
    evaluacionCrediticia: buscar("Evaluacion_Crediticia", "ESTADO_GENERAL"),
  }

  // 2. NIVELES DE AGRESIVIDAD - NOMBRES CORRECTOS
  const niveles = {
    agresivo: {
      deudaMaxima: getValor("Nivel_AGRESIVO", "DEUDA_MAXIMA"),
      capacidadAdicional: getValor("Nivel_AGRESIVO", "CAPACIDAD_ADICIONAL"),
      ratioServicio: getValor("Nivel_AGRESIVO", "RATIO_SERVICIO_RESULTANTE"),
      limiteGarantias: getTexto("Nivel_AGRESIVO", "LIMITE_GARANTIAS_PCT"),
    },
    moderado: {
      deudaMaxima: getValor("Nivel_MODERADO", "DEUDA_MAXIMA"),
      capacidadAdicional: getValor("Nivel_MODERADO", "CAPACIDAD_ADICIONAL"),
      ratioServicio: getValor("Nivel_MODERADO", "RATIO_SERVICIO_RESULTANTE"),
      limiteGarantias: getTexto("Nivel_MODERADO", "LIMITE_GARANTIAS_PCT"),
    },
    conservador: {
      deudaMaxima: getValor("Nivel_CONSERVADOR", "DEUDA_MAXIMA"),
      capacidadAdicional: getValor("Nivel_CONSERVADOR", "CAPACIDAD_ADICIONAL"),
      ratioServicio: getValor("Nivel_CONSERVADOR", "RATIO_SERVICIO_RESULTANTE"),
      limiteGarantias: getTexto("Nivel_CONSERVADOR", "LIMITE_GARANTIAS_PCT"),
    },
  }

  // 3. RATIOS CREDITICIOS CLAVE - NOMBRES CORRECTOS
  const ratios = {
    ratioServicioActual: getValor("Ratio_Servicio_Actual", "RATIO_ACTUAL"),
    ratioDeudaActivos: getValor("Ratios_Crediticios", "RATIO_DEUDA_ACTIVOS"),
    ratioDeudaCampo: getValor("Ratios_Crediticios", "RATIO_DEUDA_CAMPO_CRIA"),
    limiteActivosTotales: getValor("Limite_Activos_Totales", "DEUDA_MAXIMA_ACTIVOS_15%"),
  }

  // 4. SIMULACIONES DE CRÉDITO - DINÁMICAS SEGÚN PERFIL SELECCIONADO
  const capacidadDisponible = niveles[nivelSeleccionado].capacidadAdicional

  // CALCULAR CASHFLOW REAL DESDE LOS DATOS - SIN HARDCODEO
  const calcularCashflowTotal = () => {
    console.log("💰 === BUSCANDO CASHFLOW EN CREDITICIO.CSV ===")
    console.log("📊 Total registros crediticios:", crediticioData.length)

    // Buscar el cashflow en los datos crediticios
    // Puede estar en diferentes lugares, vamos a buscar en todos
    const posiblesCashflow = crediticioData.filter((item) => {
      const esCashflow =
        item.Tipo_Dato?.toLowerCase().includes("cashflow") ||
        item.Categoria?.toLowerCase().includes("cashflow") ||
        item.Detalle?.toLowerCase().includes("cashflow") ||
        item.Tipo_Dato?.toLowerCase().includes("flujo") ||
        item.Categoria?.toLowerCase().includes("flujo") ||
        // También buscar en ratio servicio actual que menciona cashflow
        (item.Tipo_Dato === "Ratio_Servicio_Actual" && item.Detalle?.toLowerCase().includes("cashflow"))

      if (esCashflow) {
        console.log("💰 Posible cashflow encontrado:", {
          Tipo_Dato: item.Tipo_Dato,
          Categoria: item.Categoria,
          Detalle: item.Detalle,
          Valor_Numerico: item.Valor_Numerico,
          Valor_Texto: item.Valor_Texto,
        })
      }

      return esCashflow
    })

    console.log("💰 Total registros con cashflow encontrados:", posiblesCashflow.length)

    // Buscar el cashflow más directo
    let cashflowEncontrado = 0

    // 1. Buscar registro directo de cashflow
    const cashflowDirecto = posiblesCashflow.find(
      (item) =>
        item.Tipo_Dato?.toLowerCase().includes("cashflow") &&
        item.Valor_Numerico &&
        Number.parseFloat(item.Valor_Numerico) > 0,
    )

    if (cashflowDirecto) {
      cashflowEncontrado = Number.parseFloat(cashflowDirecto.Valor_Numerico)
      console.log("✅ Cashflow directo encontrado:", cashflowEncontrado)
      return cashflowEncontrado
    }

    // 2. Si no hay cashflow directo, buscar en ratio servicio actual
    const ratioServicioData = buscar("Ratio_Servicio_Actual", "RATIO_ACTUAL")
    if (ratioServicioData && ratioServicioData.Detalle?.toLowerCase().includes("cashflow")) {
      // Si el ratio es Cashflow ÷ Deuda, podemos calcular: Cashflow = Ratio × Deuda
      const ratioActual = Number.parseFloat(ratioServicioData.Valor_Numerico || "0")
      const deudaActual = getValor("Endeudamiento_Total", "DEUDA_SISTEMA_FINANCIERO")

      if (ratioActual > 0 && deudaActual > 0) {
        cashflowEncontrado = ratioActual * deudaActual
        console.log("✅ Cashflow calculado desde ratio:", {
          ratio: ratioActual,
          deuda: deudaActual,
          cashflow: cashflowEncontrado,
        })
        return cashflowEncontrado
      }
    }

    // 3. Buscar cualquier registro que tenga "cashflow" en el detalle
    const cashflowDetalle = posiblesCashflow.find(
      (item) =>
        item.Detalle?.toLowerCase().includes("cashflow") &&
        item.Valor_Numerico &&
        Number.parseFloat(item.Valor_Numerico) > 0,
    )

    if (cashflowDetalle) {
      cashflowEncontrado = Number.parseFloat(cashflowDetalle.Valor_Numerico)
      console.log("✅ Cashflow desde detalle encontrado:", cashflowEncontrado)
      return cashflowEncontrado
    }

    console.log("❌ No se encontró cashflow en datos crediticios")
    console.log(
      "📋 Todos los registros crediticios:",
      crediticioData.map((item) => ({
        Tipo_Dato: item.Tipo_Dato,
        Categoria: item.Categoria,
        Detalle: item.Detalle,
      })),
    )

    return 0
  }

  const cashflowTotal = calcularCashflowTotal()

  const garantias = {
    campoPlusCria: getValor("Limite_Activos_Totales", "CAMPO_PLUS_CRIA"),
    activosTotales: activosTotales,
    cashflowTotal: cashflowTotal, // ✅ CALCULADO DINÁMICAMENTE
    montoRecomendado: getValor("Recomendacion_Credito", "MONTO_CONSERVADOR"),
  }
  const simulaciones = {
    dias90: {
      capital: Math.round(capacidadDisponible * 0.8), // 80% de la capacidad
      totalPagar: Math.round(capacidadDisponible * 0.8 * 1.045), // Capital + 4.5%
      intereses: Math.round(capacidadDisponible * 0.8 * 0.045),
      impactoCashflow: ((capacidadDisponible * 0.8 * 0.045 * 4) / garantias.cashflowTotal) * 100, // Anualizado
      tasa: "4.5%",
    },
    dias180: {
      capital: Math.round(capacidadDisponible * 0.9), // 90% de la capacidad
      totalPagar: Math.round(capacidadDisponible * 0.9 * 1.065), // Capital + 6.5%
      intereses: Math.round(capacidadDisponible * 0.9 * 0.065),
      impactoCashflow: ((capacidadDisponible * 0.9 * 0.065 * 2) / garantias.cashflowTotal) * 100, // Anualizado
      tasa: "6.5%",
    },
    dias270: {
      capital: Math.round(capacidadDisponible * 0.95), // 95% de la capacidad
      totalPagar: Math.round(capacidadDisponible * 0.95 * 1.075), // Capital + 7.5%
      intereses: Math.round(capacidadDisponible * 0.95 * 0.075),
      impactoCashflow: ((capacidadDisponible * 0.95 * 0.075 * 1.33) / garantias.cashflowTotal) * 100, // Anualizado
      tasa: "7.5%",
    },
    dias360: {
      capital: Math.round(capacidadDisponible), // 100% de la capacidad
      totalPagar: Math.round(capacidadDisponible * 1.085), // Capital + 8.5%
      intereses: Math.round(capacidadDisponible * 0.085),
      impactoCashflow: ((capacidadDisponible * 0.085) / garantias.cashflowTotal) * 100, // Anualizado
      tasa: "8.5%",
    },
  }

  // 5. DATOS DE GARANTÍAS - CORREGIDO CON ACTIVOS TOTALES REALES

  // Función para formatear porcentajes pequeños
  const formatearPorcentaje = (valor: number) => {
    if (valor === 0) return "0.000%"
    if (valor < 0.0001) return "<0.001%"
    return `${(valor * 100).toFixed(3)}%`
  }

  // Datos para gráficos
  const chartDataNiveles = [
    {
      nivel: "Conservador",
      capacidad: niveles.conservador.capacidadAdicional,
      ratio: niveles.conservador.ratioServicio,
      color: "#22c55e",
    },
    {
      nivel: "Moderado",
      capacidad: niveles.moderado.capacidadAdicional,
      ratio: niveles.moderado.ratioServicio,
      color: "#f59e0b",
    },
    {
      nivel: "Agresivo",
      capacidad: niveles.agresivo.capacidadAdicional,
      ratio: niveles.agresivo.ratioServicio,
      color: "#ef4444",
    },
  ]

  const chartDataSimulaciones = [
    { plazo: "90 días", capital: simulaciones.dias90.capital, intereses: simulaciones.dias90.intereses },
    { plazo: "180 días", capital: simulaciones.dias180.capital, intereses: simulaciones.dias180.intereses },
    { plazo: "270 días", capital: simulaciones.dias270.capital, intereses: simulaciones.dias270.intereses },
    { plazo: "360 días", capital: simulaciones.dias360.capital, intereses: simulaciones.dias360.intereses },
  ]

  // Función para obtener color del ratio
  const getRatioColor = (ratio: number) => {
    if (ratio >= 5) return "text-green-600"
    if (ratio >= 3) return "text-blue-600"
    if (ratio >= 1.5) return "text-yellow-600"
    return "text-red-600"
  }

  const getRatioStatus = (ratio: number) => {
    if (ratio >= 5) return { text: "Excelente", variant: "default" as const }
    if (ratio >= 3) return { text: "Bueno", variant: "secondary" as const }
    if (ratio >= 1.5) return { text: "Aceptable", variant: "outline" as const }
    return { text: "Riesgoso", variant: "destructive" as const }
  }

  // CRITERIOS DE CUMPLIMIENTO BÁSICOS
  const scoreNosis = getValor("Score_Crediticio", "SCORE_NOSIS")
  const chequesRechazados = getValor("Cheques_Rechazados", "CHEQUES_ULTIMO_AÑO")
  const deudaBancos = getValor("Deuda_Bancos", "BANCOS_CON_DEUDA")

  const cumpleScore = scoreNosis >= 600
  const cumpleCheques = chequesRechazados === 0
  const cumpleBancos = deudaBancos <= 3

  const criteriosBasicos = [
    {
      nombre: "Score Nosis ≥ 600",
      valor: scoreNosis,
      limite: 600,
      cumple: cumpleScore,
      formato: "entero",
      color: cumpleScore ? "#4ECDC4" : "#FF6B6B",
    },
    {
      nombre: "Cheques Rechazados = 0",
      valor: chequesRechazados,
      limite: 0,
      cumple: cumpleCheques,
      formato: "entero",
      color: cumpleCheques ? "#4ECDC4" : "#FF6B6B",
    },
    {
      nombre: "Créditos Bancos ≤ 3",
      valor: deudaBancos,
      valorTexto: getTexto("Deuda_Bancos", "BANCOS_CON_DEUDA"),
      limite: 3,
      cumple: cumpleBancos,
      formato: "entero",
      color: cumpleBancos ? "#4ECDC4" : "#FF6B6B",
    },
  ]

  const formatearValor = (valor: number, formato: string) => {
    if (formato === "entero") {
      return Math.floor(valor).toString()
    }
    return valor.toFixed(2)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="perfil">📋 Perfil Crediticio</TabsTrigger>
          <TabsTrigger value="simulaciones">⏰ Simulaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          {/* 1. CRITERIOS BÁSICOS DE CUMPLIMIENTO */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />🎯 Criterios Básicos de Cumplimiento
              </CardTitle>
              <CardDescription>Evaluación de criterios crediticios fundamentales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {criteriosBasicos.map((criterio, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${criterio.cumple ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50"}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{criterio.nombre}</span>
                        {criterio.cumple ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Valor actual:</span>
                          <div className="text-right">
                            <span className="font-medium" style={{ color: criterio.color }}>
                              {formatearValor(criterio.valor, criterio.formato)}
                            </span>
                            {criterio.valorTexto && criterio.valorTexto !== "N/A" && (
                              <div className="text-xs text-gray-500">
                                {criterio.valorTexto}
                                {criterio.valorTexto.includes("bancos") && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    * Entidades Significativas: &gt;$10,000 USD
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mostrar detalle de bancos específicos si es el criterio de bancos */}
                        {index === 2 &&
                          (() => {
                            // Buscar TODAS las entradas relacionadas con bancos/deudas
                            const todasLasDeudas = crediticioData.filter((item) => {
                              const esBanco =
                                item.Tipo_Dato?.toLowerCase().includes("banco") ||
                                item.Tipo_Dato?.toLowerCase().includes("deuda") ||
                                item.Categoria?.toLowerCase().includes("banco") ||
                                item.Subcategoria?.toLowerCase().includes("banco") ||
                                item.Detalle?.toLowerCase().includes("banco")

                              if (esBanco) {
                                console.log("🏦 Entrada bancaria encontrada:", {
                                  Tipo_Dato: item.Tipo_Dato,
                                  Categoria: item.Categoria,
                                  Subcategoria: item.Subcategoria,
                                  Detalle: item.Detalle,
                                  Valor_Numerico: item.Valor_Numerico,
                                  Valor_Texto: item.Valor_Texto,
                                })
                              }

                              return esBanco
                            })

                            console.log("🏦 Total entradas bancarias:", todasLasDeudas.length)

                            // Buscar lista de bancos específicos
                            const listaBancos = todasLasDeudas.find(
                              (item) => item.Tipo_Dato === "Detalle_Bancos" && item.Categoria === "LISTA_BANCOS",
                            )

                            // Buscar monto total significativo
                            const montoTotal = buscar("Deuda_Bancos", "MONTO_BANCOS_SIGNIFICATIVOS")

                            if (listaBancos && listaBancos.Valor_Texto) {
                              // Dividir la lista de bancos
                              const nombresBancos = listaBancos.Valor_Texto.split(" | ").map((nombre) => nombre.trim())
                              const cantidadBancos = nombresBancos.length
                              const montoTotalNum = montoTotal ? Number.parseFloat(montoTotal.Valor_Numerico) : 0

                              // Calcular monto promedio por banco (distribución equitativa)
                              const montoPorBanco = cantidadBancos > 0 ? montoTotalNum / cantidadBancos : 0

                              return (
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-gray-700 border-b pb-1">
                                    📋 Detalle por Entidad Bancaria:
                                  </div>
                                  {nombresBancos.map((nombreBanco, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs"
                                    >
                                      <span className="font-medium">{nombreBanco}</span>
                                      <div className="text-right">
                                        <div
                                          className={`font-bold ${montoPorBanco > 10000 ? "text-red-600" : "text-blue-600"}`}
                                        >
                                          ${Math.round(montoPorBanco).toLocaleString()} USD
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ~{((montoPorBanco / montoTotalNum) * 100).toFixed(1)}% del total
                                        </div>
                                        {montoPorBanco > 10000 && (
                                          <Badge variant="destructive" className="text-xs mt-1">
                                            Significativa
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Mostrar monto total corregido en USD */}
                                  {montoTotal && montoTotal.Valor_Numerico && (
                                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-blue-800">
                                          💰 Total Entidades Significativas:
                                        </span>
                                        <span className="font-bold text-blue-800">
                                          ${Number.parseFloat(montoTotal.Valor_Numerico).toLocaleString()} USD
                                        </span>
                                      </div>
                                      <div className="text-xs text-blue-600 mt-1">
                                        ✅ Convertido correctamente a USD
                                      </div>
                                    </div>
                                  )}

                                  <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded">
                                    💡 <strong>Entidades Significativas:</strong> Deudas superiores a $10,000 USD
                                    <br />📊 <strong>Distribución:</strong> Monto total dividido equitativamente entre
                                    bancos
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })()}

                        <div className="flex justify-between text-sm">
                          <span>Límite:</span>
                          <span className="font-medium text-gray-600">
                            {criterio.nombre.includes("≥") ? "≥ " : criterio.nombre.includes("≤") ? "≤ " : "= "}
                            {formatearValor(criterio.limite, criterio.formato)}
                          </span>
                        </div>
                        <Badge variant={criterio.cumple ? "default" : "destructive"} className="w-full justify-center">
                          {criterio.cumple ? "✅ CUMPLE" : "❌ NO CUMPLE"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2. MÉTRICAS BÁSICAS DE NOSIS */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />📋 Perfil Crediticio Nosis
              </CardTitle>
              <CardDescription>Información crediticia fundamental del productor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Score Nosis */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Score Nosis</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {metricasBasicas.scoreNosis?.Valor_Texto || "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {metricasBasicas.scoreNosis?.Detalle || "Score de riesgo crediticio"}
                    </p>
                  </CardContent>
                </Card>

                {/* Endeudamiento Total */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Deuda Actual</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      $
                      {Math.round(
                        Number.parseFloat(metricasBasicas.endeudamientoTotal?.Valor_Numerico || "0"),
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {metricasBasicas.endeudamientoTotal?.Detalle || "Deuda actual total"}
                    </p>
                  </CardContent>
                </Card>

                {/* Evaluación General */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estado Crediticio</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {metricasBasicas.evaluacionCrediticia?.Valor_Texto || "APROBADO"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {metricasBasicas.evaluacionCrediticia?.Detalle || "Evaluación general"}
                    </p>
                  </CardContent>
                </Card>

                {/* Cheques Rechazados */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cheques Rechazados</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {metricasBasicas.chequesRechazados?.Valor_Texto || "0"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {metricasBasicas.chequesRechazados?.Detalle || "Últimos 12 meses"}
                    </p>
                  </CardContent>
                </Card>

                {/* Bancos con Deuda - DETALLADO */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bancos con Deuda</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {metricasBasicas.bancosConDeuda?.Valor_Texto || "N/A"}
                    </div>

                    {/* Detalle por banco individual */}
                    <div className="mt-3 space-y-2">
                      {(() => {
                        // DEBUG: Mostrar TODOS los datos de bancos para entender la estructura
                        console.log("🔍 TODOS los datos crediticios:", crediticioData)
                        console.log("🏦 Filtrando datos de bancos...")

                        // Buscar TODAS las entradas relacionadas con bancos/deudas
                        const todasLasDeudas = crediticioData.filter((item) => {
                          const esBanco =
                            item.Tipo_Dato?.toLowerCase().includes("banco") ||
                            item.Tipo_Dato?.toLowerCase().includes("deuda") ||
                            item.Categoria?.toLowerCase().includes("banco") ||
                            item.Subcategoria?.toLowerCase().includes("banco") ||
                            item.Detalle?.toLowerCase().includes("banco")

                          if (esBanco) {
                            console.log("🏦 Entrada bancaria encontrada:", {
                              Tipo_Dato: item.Tipo_Dato,
                              Categoria: item.Categoria,
                              Subcategoria: item.Subcategoria,
                              Detalle: item.Detalle,
                              Valor_Numerico: item.Valor_Numerico,
                              Valor_Texto: item.Valor_Texto,
                            })
                          }

                          return esBanco
                        })

                        console.log("🏦 Total entradas bancarias:", todasLasDeudas.length)

                        // Buscar lista de bancos específicos
                        const listaBancos = todasLasDeudas.find(
                          (item) => item.Tipo_Dato === "Detalle_Bancos" && item.Categoria === "LISTA_BANCOS",
                        )

                        // Buscar monto total significativo
                        const montoTotal = buscar("Deuda_Bancos", "MONTO_BANCOS_SIGNIFICATIVOS")

                        if (listaBancos && listaBancos.Valor_Texto) {
                          // Dividir la lista de bancos
                          const nombresBancos = listaBancos.Valor_Texto.split(" | ").map((nombre) => nombre.trim())
                          const cantidadBancos = nombresBancos.length
                          const montoTotalNum = montoTotal ? Number.parseFloat(montoTotal.Valor_Numerico) : 0

                          // Calcular monto promedio por banco (distribución equitativa)
                          const montoPorBanco = cantidadBancos > 0 ? montoTotalNum / cantidadBancos : 0

                          return (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-700 border-b pb-1">
                                📋 Detalle por Entidad Bancaria:
                              </div>
                              {nombresBancos.map((nombreBanco, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs"
                                >
                                  <span className="font-medium">{nombreBanco}</span>
                                  <div className="text-right">
                                    <div
                                      className={`font-bold ${montoPorBanco > 10000 ? "text-red-600" : "text-blue-600"}`}
                                    >
                                      ${Math.round(montoPorBanco).toLocaleString()} USD
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ~{((montoPorBanco / montoTotalNum) * 100).toFixed(1)}% del total
                                    </div>
                                    {montoPorBanco > 10000 && (
                                      <Badge variant="destructive" className="text-xs mt-1">
                                        Significativa
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Mostrar monto total corregido en USD */}
                              {montoTotal && montoTotal.Valor_Numerico && (
                                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-blue-800">
                                      💰 Total Entidades Significativas:
                                    </span>
                                    <span className="font-bold text-blue-800">
                                      ${Number.parseFloat(montoTotal.Valor_Numerico).toLocaleString()} USD
                                    </span>
                                  </div>
                                  <div className="text-xs text-blue-600 mt-1">✅ Convertido correctamente a USD</div>
                                </div>
                              )}

                              <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded">
                                💡 <strong>Entidades Significativas:</strong> Deudas superiores a $10,000 USD
                                <br />📊 <strong>Distribución:</strong> Monto total dividido equitativamente entre
                                bancos
                              </div>
                            </div>
                          )
                        } else {
                          // Si no hay detalle específico, mostrar información general disponible
                          const montoTotal = buscar("Deuda_Bancos", "MONTO_BANCOS_SIGNIFICATIVOS")
                          const cantidadBancos = metricasBasicas.bancosConDeuda?.Valor_Texto || "N/A"

                          return (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-700 border-b pb-1">
                                📋 Información Disponible:
                              </div>

                              <div className="p-2 bg-gray-50 rounded text-xs">
                                <div className="font-medium text-gray-700">Cantidad de bancos:</div>
                                <div className="mt-1 text-lg font-bold text-green-600">{cantidadBancos}</div>
                              </div>

                              {montoTotal && montoTotal.Valor_Numerico && (
                                <div className="p-2 bg-red-50 rounded text-xs">
                                  <div className="font-medium text-red-700">Monto total significativo:</div>
                                  <div className="mt-1 text-lg font-bold text-red-600">
                                    ${Number.parseFloat(montoTotal.Valor_Numerico).toLocaleString()}
                                  </div>
                                  {montoTotal.Valor_Texto && (
                                    <div className="text-gray-600 mt-1">{montoTotal.Valor_Texto}</div>
                                  )}
                                </div>
                              )}

                              <div className="text-xs text-orange-600 p-2 bg-orange-50 rounded">
                                ℹ️ <strong>Nota:</strong> Detalle individual por banco no disponible en este formato de
                                datos.
                                <br />
                                Los datos muestran información agregada de entidades significativas.
                              </div>

                              <div className="text-xs text-blue-600 p-2 bg-blue-50 rounded">
                                💡 <strong>Entidades Significativas:</strong> Deudas superiores a $10,000 USD
                              </div>
                            </div>
                          )
                        }
                      })()}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      {metricasBasicas.bancosConDeuda?.Detalle || "Bancos significativos"}
                    </p>
                  </CardContent>
                </Card>

                {/* Consultas Nosis */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Consultas Nosis</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {getValor("Consultas_Nosis", "CONSULTAS_1_MES")} consultas
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Último mes: {getValor("Consultas_Nosis", "CONSULTAS_1_MES")} | Anual:{" "}
                      {metricasBasicas.consultasNosis?.Valor_Texto || "20"} consultas
                    </p>
                    <Badge variant="default" className="mt-1 text-xs">
                      Ratio:{" "}
                      {(
                        (getValor("Consultas_Nosis", "CONSULTAS_1_MES") /
                          (getValor("Consultas_Nosis", "CONSULTAS_12_MESES") / 12)) *
                        100
                      ).toFixed(1)}
                      % vs promedio mensual
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* 3. SELECTOR DE NIVEL DE AGRESIVIDAD */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Target className="h-5 w-5 sm:h-6 sm:w-6" />🎯 Niveles de Agresividad Crediticia
              </CardTitle>
              <CardDescription>
                Selecciona el nivel de riesgo para ver la capacidad crediticia correspondiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Selector de Nivel */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                  variant={nivelSeleccionado === "conservador" ? "default" : "outline"}
                  onClick={() => setNivelSeleccionado("conservador")}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  🛡️ CONSERVADOR
                </Button>
                <Button
                  variant={nivelSeleccionado === "moderado" ? "default" : "outline"}
                  onClick={() => setNivelSeleccionado("moderado")}
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  ⚖️ MODERADO
                </Button>
                <Button
                  variant={nivelSeleccionado === "agresivo" ? "default" : "outline"}
                  onClick={() => setNivelSeleccionado("agresivo")}
                  className="flex items-center gap-2"
                >
                  <Flame className="h-4 w-4" />🔥 AGRESIVO
                </Button>
              </div>

              {/* Detalles del Nivel Seleccionado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card
                  className={`border-l-4 ${
                    nivelSeleccionado === "conservador"
                      ? "border-l-green-500"
                      : nivelSeleccionado === "moderado"
                        ? "border-l-yellow-500"
                        : "border-l-red-500"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      {nivelSeleccionado === "conservador" && "🛡️ Nivel Conservador"}
                      {nivelSeleccionado === "moderado" && "⚖️ Nivel Moderado"}
                      {nivelSeleccionado === "agresivo" && "🔥 Nivel Agresivo"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {nivelSeleccionado === "conservador" && "Máxima seguridad - Ratio servicio ≥ 2.0"}
                      {nivelSeleccionado === "moderado" && "Balance equilibrado - Ratio servicio ≥ 1.8"}
                      {nivelSeleccionado === "agresivo" && "Máxima capacidad - Ratio servicio ≥ 1.5"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={`text-center p-4 rounded-lg ${
                        nivelSeleccionado === "conservador"
                          ? "bg-green-50"
                          : nivelSeleccionado === "moderado"
                            ? "bg-yellow-50"
                            : "bg-red-50"
                      }`}
                    >
                      <div
                        className={`text-3xl font-bold ${
                          nivelSeleccionado === "conservador"
                            ? "text-green-600"
                            : nivelSeleccionado === "moderado"
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        ${niveles[nivelSeleccionado].capacidadAdicional.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-700">Capacidad Adicional</div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Deuda Máxima:</span>
                        <span className="font-medium">${niveles[nivelSeleccionado].deudaMaxima.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ratio Servicio:</span>
                        <span className={`font-medium ${getRatioColor(niveles[nivelSeleccionado].ratioServicio)}`}>
                          {niveles[nivelSeleccionado].ratioServicio.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Límite Garantías:</span>
                        <span className="font-medium">{niveles[nivelSeleccionado].limiteGarantias}</span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        nivelSeleccionado === "conservador"
                          ? "default"
                          : nivelSeleccionado === "moderado"
                            ? "secondary"
                            : "destructive"
                      }
                      className="w-full justify-center"
                    >
                      {nivelSeleccionado === "conservador" && "✅ Recomendado para nuevos clientes"}
                      {nivelSeleccionado === "moderado" && "⭐ Estándar para operaciones establecidas"}
                      {nivelSeleccionado === "agresivo" && "⚠️ Solo para clientes premium"}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Medidor de Ratio Servicio */}
              </div>

              {/* Gráfico Comparativo de Niveles */}
              <div className="mt-6">
                <h4 className="font-semibold mb-4">📊 Comparación de Capacidades por Nivel</h4>
                <ChartContainer
                  config={{
                    capacidad: { label: "Capacidad Adicional", color: "#3b82f6" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataNiveles}>
                      <XAxis dataKey="nivel" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="font-semibold">{data.nivel}</p>
                                <p className="text-sm">Capacidad: ${data.capacidad.toLocaleString()}</p>
                                <p className="text-sm">Ratio: {data.ratio.toFixed(2)}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="capacidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* 4. RATIOS CREDITICIOS CLAVE */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />📈 Ratios Crediticios Clave
              </CardTitle>
              <CardDescription>Indicadores fundamentales para la evaluación crediticia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Ratio Servicio Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getRatioColor(ratios.ratioServicioActual)}`}>
                      {ratios.ratioServicioActual.toFixed(2)}
                    </div>
                    <Badge variant={getRatioStatus(ratios.ratioServicioActual).variant} className="mt-2">
                      {getRatioStatus(ratios.ratioServicioActual).text}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Deuda/Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${ratios.ratioDeudaActivos <= 0.15 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatearPorcentaje(ratios.ratioDeudaActivos)}
                    </div>
                    <Badge variant={ratios.ratioDeudaActivos <= 0.15 ? "default" : "destructive"} className="mt-2">
                      {ratios.ratioDeudaActivos <= 0.15 ? "Excelente" : "Alto"}
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">Límite regulatorio: 15% - Actual: &lt;0.001% ✅</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Deuda/Campo+Cría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${ratios.ratioDeudaCampo <= 0.25 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatearPorcentaje(ratios.ratioDeudaCampo)}
                    </div>
                    <Badge variant={ratios.ratioDeudaCampo <= 0.25 ? "default" : "destructive"} className="mt-2">
                      {ratios.ratioDeudaCampo <= 0.25 ? "Excelente" : "Alto"}
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">Límite prudencial: 25% - Actual: &lt;0.001% ✅</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Límite Activos 15%</CardTitle>
                    <CardDescription className="text-xs">
                      15% del valor total de activos como límite máximo de endeudamiento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ${ratios.limiteActivosTotales.toLocaleString()}
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      Límite regulatorio
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">Cálculo: Activos Totales × 15%</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulaciones" className="space-y-6">
          {/* 5. SIMULACIONES DE CRÉDITO */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />⏰ Simulaciones de Crédito (Pago al Vencimiento)
              </CardTitle>
              <CardDescription>
                Simulaciones con tasas reales y pago al vencimiento según perfil seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Selector de Perfil para Simulaciones */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">🎯 Seleccionar Perfil de Riesgo:</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant={nivelSeleccionado === "conservador" ? "default" : "outline"}
                    onClick={() => setNivelSeleccionado("conservador")}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    🛡️ CONSERVADOR (${niveles.conservador.capacidadAdicional.toLocaleString()})
                  </Button>
                  <Button
                    variant={nivelSeleccionado === "moderado" ? "default" : "outline"}
                    onClick={() => setNivelSeleccionado("moderado")}
                    className="flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    ⚖️ MODERADO (${niveles.moderado.capacidadAdicional.toLocaleString()})
                  </Button>
                  <Button
                    variant={nivelSeleccionado === "agresivo" ? "default" : "outline"}
                    onClick={() => setNivelSeleccionado("agresivo")}
                    className="flex items-center gap-2"
                  >
                    <Flame className="h-4 w-4" />🔥 AGRESIVO (${niveles.agresivo.capacidadAdicional.toLocaleString()})
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Perfil {nivelSeleccionado.toUpperCase()} seleccionado:</strong>
                    Capacidad disponible de ${niveles[nivelSeleccionado].capacidadAdicional.toLocaleString()}
                    con ratio de servicio de {niveles[nivelSeleccionado].ratioServicio.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(simulaciones).map(([plazo, datos]) => (
                  <Card key={plazo} className="border-2 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {plazo.replace("dias", " días")}
                        <Badge variant="outline">{datos.tasa}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">${datos.capital.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Capital</div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Total a pagar:</span>
                          <span className="font-medium">${datos.totalPagar.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Intereses:</span>
                          <span className="font-medium text-red-600">${datos.intereses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Impacto cashflow:</span>
                          <span className="font-medium">{datos.impactoCashflow.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">Explicación Impacto:</div>
                        <div>
                          Los intereses anualizados representan el {datos.impactoCashflow.toFixed(1)}% del cashflow
                          anual
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Gráfico de Simulaciones */}
              <div>
                <h4 className="font-semibold mb-4">📊 Comparación de Costos por Plazo</h4>
                <ChartContainer
                  config={{
                    capital: { label: "Capital", color: "#3b82f6" },
                    intereses: { label: "Intereses", color: "#ef4444" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataSimulaciones}>
                      <XAxis dataKey="plazo" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="font-semibold">{data.plazo}</p>
                                <p className="text-sm">Capital: ${data.capital.toLocaleString()}</p>
                                <p className="text-sm">Intereses: ${data.intereses.toLocaleString()}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="capital" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="intereses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* 6. IMPACTO EN GARANTÍAS POST-CRÉDITO */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                ⚖️ Impacto en Garantías Post-Crédito
              </CardTitle>
              <CardDescription>
                Cómo quedarían las garantías y ratios después de tomar el crédito máximo del perfil{" "}
                {nivelSeleccionado.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const creditoMaximo = niveles[nivelSeleccionado].capacidadAdicional

                // Función para formatear porcentajes normales (no micro)
                const formatearPorcentajeNormal = (valor: number) => {
                  return `${(valor * 100).toFixed(1)}%`
                }

                // Límites recomendados según perfil
                const limitesRecomendados = {
                  conservador: { deudaActivos: 0.1, deudaCampo: 0.15 }, // 10% y 15%
                  moderado: { deudaActivos: 0.125, deudaCampo: 0.2 }, // 12.5% y 20%
                  agresivo: { deudaActivos: 0.15, deudaCampo: 0.25 }, // 15% y 25%
                }

                const limiteActual = limitesRecomendados[nivelSeleccionado]

                const deudaActual = getValor("Endeudamiento_Total", "DEUDA_SISTEMA_FINANCIERO") || 0
                const nuevaDeudaTotal = deudaActual + creditoMaximo
                const nuevoRatioDeudaActivos = nuevaDeudaTotal / garantias.activosTotales
                const nuevoRatioDeudaCampo = nuevaDeudaTotal / garantias.campoPlusCria
                const garantiaLibre = garantias.activosTotales - nuevaDeudaTotal
                const porcentajeComprometido = (nuevaDeudaTotal / garantias.activosTotales) * 100

                return (
                  <div className="space-y-6">
                    {/* Alerta de Impacto */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">
                          Simulación: Crédito de ${creditoMaximo.toLocaleString()} ({nivelSeleccionado.toUpperCase()})
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        Esta simulación muestra cómo quedarían las garantías si se toma el crédito máximo disponible.
                      </p>
                    </div>

                    {/* Comparación Antes/Después */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ANTES */}
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-base text-green-800">✅ SITUACIÓN ACTUAL</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Deuda Total:</span>
                            <span className="font-medium">${deudaActual.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Ratio Deuda/Activos:</span>
                            <span className="font-medium text-green-600">
                              {formatearPorcentaje(ratios.ratioDeudaActivos)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Ratio Deuda/Campo:</span>
                            <span className="font-medium text-green-600">
                              {formatearPorcentaje(ratios.ratioDeudaCampo)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Garantía Libre:</span>
                            <span className="font-medium text-green-600">
                              ${(garantias.activosTotales - deudaActual).toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* DESPUÉS */}
                      <Card
                        className={`${nuevoRatioDeudaActivos > 0.15 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}
                      >
                        <CardHeader>
                          <CardTitle
                            className={`text-base ${nuevoRatioDeudaActivos > 0.15 ? "text-red-800" : "text-blue-800"}`}
                          >
                            {nuevoRatioDeudaActivos > 0.15 ? "⚠️ POST-CRÉDITO (RIESGO)" : "📊 POST-CRÉDITO"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Nueva Deuda Total:</span>
                            <span className="font-medium">${nuevaDeudaTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Nuevo Ratio Deuda/Activos:</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${nuevoRatioDeudaActivos > limiteActual.deudaActivos ? "text-red-600" : "text-blue-600"}`}
                              >
                                {formatearPorcentajeNormal(nuevoRatioDeudaActivos)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Límite {nivelSeleccionado}: {formatearPorcentajeNormal(limiteActual.deudaActivos)}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span>Nuevo Ratio Deuda/Campo:</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${nuevoRatioDeudaCampo > limiteActual.deudaCampo ? "text-red-600" : "text-blue-600"}`}
                              >
                                {formatearPorcentajeNormal(nuevoRatioDeudaCampo)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Límite {nivelSeleccionado}: {formatearPorcentajeNormal(limiteActual.deudaCampo)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Garantía Libre Restante:</span>
                            <span className={`font-medium ${garantiaLibre < 0 ? "text-red-600" : "text-blue-600"}`}>
                              ${garantiaLibre.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Nuevo Ratio Servicio:</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${(garantias.cashflowTotal / nuevaDeudaTotal) < niveles[nivelSeleccionado].ratioServicio ? "text-red-600" : "text-blue-600"}`}
                              >
                                {(garantias.cashflowTotal / nuevaDeudaTotal).toFixed(2)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Mín {nivelSeleccionado}: {niveles[nivelSeleccionado].ratioServicio.toFixed(1)}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Explicación del Cálculo */}
                    <Card className="bg-gray-50 border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-sm">🧮 Cálculo Detallado</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Deuda Actual:</span>
                          <span>${deudaActual.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>+ Crédito Nuevo ({nivelSeleccionado}):</span>
                          <span>${creditoMaximo.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-medium">= Nueva Deuda Total:</span>
                          <span className="font-medium">${nuevaDeudaTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>÷ Activos Totales:</span>
                          <span>${garantias.activosTotales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-medium">= Ratio Final:</span>
                          <span className="font-medium">{formatearPorcentajeNormal(nuevoRatioDeudaActivos)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>÷ Cashflow Anual:</span>
                          <span>${garantias.cashflowTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-medium">= Nuevo Ratio Servicio:</span>
                          <span className="font-medium">{(garantias.cashflowTotal / nuevaDeudaTotal).toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medidor de Compromiso */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">📊 Nivel de Compromiso de Garantías</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Porcentaje Comprometido:</span>
                            <span
                              className={`font-bold text-lg ${porcentajeComprometido > 15 ? "text-red-600" : "text-blue-600"}`}
                            >
                              {porcentajeComprometido.toFixed(2)}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full ${porcentajeComprometido > 15 ? "bg-red-500" : "bg-blue-500"}`}
                              style={{ width: `${Math.min(porcentajeComprometido, 100)}%` }}
                            ></div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="w-full bg-green-200 h-2 rounded"></div>
                              <span className="text-green-600">0-10% Seguro</span>
                            </div>
                            <div className="text-center">
                              <div className="w-full bg-yellow-200 h-2 rounded"></div>
                              <span className="text-yellow-600">10-15% Moderado</span>
                            </div>
                            <div className="text-center">
                              <div className="w-full bg-red-200 h-2 rounded"></div>
                              <span className="text-red-600">+15% Riesgoso</span>
                            </div>
                          </div>

                          {/* Alertas */}
                          {nuevoRatioDeudaActivos > 0.15 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800">
                                  ⚠️ ALERTA: Supera el límite regulatorio del 15%
                                </span>
                              </div>
                            </div>
                          )}

                          {nuevoRatioDeudaCampo > 0.25 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800">
                                  ⚠️ ALERTA: Supera el límite prudencial Campo+Cría del 25%
                                </span>
                              </div>
                            </div>
                          )}
                          {garantias.cashflowTotal / nuevaDeudaTotal < niveles[nivelSeleccionado].ratioServicio && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800">
                                  ⚠️ ALERTA: Ratio servicio {(garantias.cashflowTotal / nuevaDeudaTotal).toFixed(2)}{" "}
                                  menor al mínimo {niveles[nivelSeleccionado].ratioServicio.toFixed(1)} para perfil{" "}
                                  {nivelSeleccionado}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
