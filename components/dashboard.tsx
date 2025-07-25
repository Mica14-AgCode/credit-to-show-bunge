"use client"

import { useState, useEffect } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw, X } from "lucide-react"
import { ResumenGeneral } from "./resumen-general"
import { AnalisisCrediticio } from "./analisis-crediticio"
import { DatosAgricolas } from "./datos-agricolas"
import { DatosGanaderos } from "./datos-ganaderos"
import { ActivosPatrimonio } from "./activos-patrimonio"

interface ProductorData {
  general: any[]
  crediticio: any[]
  agricultura: any[]
  ganaderia: any[]
  activos: any[]
  rotacion: any[]
}

// Actualizar las URLs de los CSV para usar los nuevos datos más completos
const CSV_URLS = {
  // CUIT 1: 27176350259 (mantener los existentes)
  general: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-XT1HMxRTL1mZAhwWZfArzWlHGG29BT.csv",
  crediticio: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-18kGYDs14uRa3bvbfmmjzKIwhhBIro.csv",
  agriculturaIngresos:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-bLXtAMrKv6UxgolVCoZIHcAXF5f5A0.csv",
  ganaderia: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-tSJf5YT0xsa8dkbCJL1EJGUlvOk9EB.csv",
  activos: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-Wz9EQ9oAhgfnfmhao51mC6TXXeIrrm.csv",
  rotacion:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-5hSPCr4l7M5xNbsh7ybS6xl7hnM93q.csv",

  // CUIT 2: 30556977980 - DATOS ACTUALIZADOS Y COMPLETOS
  general2: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-L9qv2JJTGn9Wv3fuAHqhWArhgP4hlX.csv",
  crediticio2: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-hQQvFmvw2E0yrf7BfaSAyg61v77pxJ.csv",
  agriculturaIngresos2:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-VcJT28uvSo3WeeLwYYPSPczT6sM6cs.csv",
  ganaderia2: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-sKZksZ23R6pCLgXtpD5bB3mJveoBVT.csv",
  activos2: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-nMDYGMXgR0F27qmGup4I1RuNcm0nJP.csv",
  rotacion2:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-fmb1tS7yeM4S6LDuFzlUrEVFb0qhyi.csv",

  // CUIT 3: 30685299050 - NUEVO PRODUCTOR CON LÓGICA COMPLETA
  general3: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-1K7NBuZQdIqQ3bMWma6rs7xeByKWIq.csv",
  crediticio3: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-u5N65T5ZAZx59lgFOqKcuNtyahNSgx.csv",
  agriculturaIngresos3:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-s8mzVRZInKMUiTmuVL6dtw1XaBOxw1.csv",
  ganaderia3: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-qLnTcbK5r8iORrYKx2z0yFqY0QECWz.csv",
  activos3: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-AYpUgahW93fdCfjdxj272jWX4mCMza.csv",
  rotacion3:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-ER8VgRHhJGmgZVOlfyPMN0x9wClZgZ.csv",

  // CUIT 4: 30547453200 - ESTABLECIMIENTOS LA NEGRA SA
  general4: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-A9UsxLwz9TgSrTKOqoQuAIxZNNvTUJ.csv",
  crediticio4: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-cLlrhbCUnCN3YpJwUqnbOeHlJbATea.csv",
  agriculturaIngresos4:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-g3GCb0MZTilynzz8F49EHcvDwfmxhD.csv",
  ganaderia4: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-qUYKUNX97gnMwzdCSabOCtBByH3AdM.csv",
  activos4: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-FBmiJwObdcIIuTLXQVoEdrUEKcmr8a.csv",
  rotacion4:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-xGFzHbMeVMvvPzoejBmja9gvJsgEw3.csv",

  // CUIT 5: 30513243207 - LA MARTA DE BARCIA SRL (PRIMER CASO CON CAPACIDAD POSITIVA)
  general5: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-mvIbFZtb6IuC2XufOwdZulbw5VfOqj.csv",
  crediticio5: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-oWthqReihueenKtzPBh549tAMVfDMz.csv",
  agriculturaIngresos5:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-hjSfDLaA5cXIIdcxodE509RaokCW6b.csv",
  ganaderia5: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-WpMxbWBlZtWLRPcsbwOjldzip2CJ9D.csv",
  activos5: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-Enbysw3EdxfomZamakFPJnuw17YRJz.csv",
  rotacion5:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-FxexCxJDG6OpDjUqPQ7t8Ovtok2zls.csv",

  // CUIT 6: 30708313358 - AGROPECUARIA LAS SEMILLAS SRL (100% ALQUILADO, SCORE 928)
  general6: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-3ZlXF65hh0ys3v2L10xDGtlaPRY4mT.csv",
  crediticio6: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-LdHJQgnr9JccMPK2COEpnbzuiTnkut.csv",
  agriculturaIngresos6:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-iOE7E8IiW5fXDepfrgxiAo82IO4w3G.csv",
  ganaderia6: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-UXpEHVPWSha6H0pqkv3wj6iG6FJBwt.csv",
  activos6: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-CeXWLjvXi4y5i9JYEG9HbSYPCFBXex.csv",
  rotacion6:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-BSE77cofZ0jLlSZdxcmXW8JGll4D9y.csv",

  // CUIT 7: 30555401910 - LA DORMIDA SAACI (SCORE BAJO PERO CAPACIDAD ALTA)
  general7: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-eOCdfuTc5Ai9iGAMZ9WusFDr4eiHUJ.csv",
  crediticio7: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-Qmnl9tRyGQM3d2EfTjC9lrYznHhoxA.csv",
  agriculturaIngresos7:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-kyGl6ZhBMS14FQCh9ArLqmltBOVRoy.csv",
  ganaderia7: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-TnkNJOnJktLuUAlKLRWU2uqC1Ed9mb.csv",
  activos7: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-zYqXevghhR5POmkJW37t57EqjvLVzO.csv",
  rotacion7:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-1MFAG52k6ZsqwlnxIx1BsDNnrypc2Y.csv",

  // CUIT 8: 30631888999 - TARASCA SA (SCORE ALTO, DEUDA ALTA, CASHFLOW EXCELENTE)
  general8: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-Lgrg3OZOdlCXwCQUnnKkZZpAQvb7Ks.csv",
  crediticio8: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-VyPzZ5Bx7V4TuVH9ne454Wpecxk0ZX.csv",
  agriculturaIngresos8:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-R5GwcydqcR4iWQ3SJF8GhiD37BMk0p.csv",
  ganaderia8: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-pitOj1G944irMd8ciovzLex1sip64s.csv",
  activos8: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-YCwvQt7kmJ5BWhAddIQGRquSIHZaIG.csv",
  rotacion8:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-YEZNHU5iBOrYbObGAhl7pdGXQAy4ac.csv",

  // CUIT 9: 30708268395 - AGROPECUARIA PATAGONICA DEL SUR SA (100% ALQUILADO, SOBREENDEUDADO)
  general9: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-DJaUVysqwKkARtH43C9XQo3xYob34C.csv",
  crediticio9: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-DtEKhFaRhe6eEUWHpUWcooRW7av1a9.csv",
  agriculturaIngresos9:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-UcLVkHSuvR4NslFGIcADlcg6JXORYS.csv",
  ganaderia9: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-a3ob8h7Us4XgVcu8UrhK6zi4mKSujq.csv",
  activos9: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-woq10CpD5TQ9TX8JuGWPoG0k0BGgLF.csv",
  rotacion9:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-PikIP2eOrbQFWRVK7kYTRvA9goRZV6.csv",

  // CUIT 10: 30709545767 - DELFINO LLOBET SRL (OPERACIÓN MASIVA, RATIO NEGATIVO)
  general10: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-kFyFGk6V4s86oeUHaEgsc40se6CqtG.csv",
  crediticio10: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-iD84VttveQvuJ3IN8papaGlRoZ7IvM.csv",
  agriculturaIngresos10:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-4sOKKSJ42LvZFEYvYUtFieMz8EC8uW.csv",
  ganaderia10: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-vJQpMdpTkdZ7VHJJEFztS9f2csKfRF.csv",
  activos10: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-8IBVnv5OeHsUhXszXiDAc8UM7q4i5a.csv",
  rotacion10:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-pdnlglyxZ0KfmMN7mtRCMSIrMfzkCs.csv",

  // CUIT 11: 30620752130 - PICABUEY SA (ESPECIALISTA EN CRÍA, CAPACIDAD CERO)
  general11: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-KdXKP7Kqgnu7DvzxeQgdzx9ZYiDvw0.csv",
  crediticio11: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-KbZ0e7UeaOEMjUQkImjz56jV9EFIQZ.csv",
  agriculturaIngresos11:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-CyvEWuVcnZucnc5upOoboOCEOrnRlA.csv",
  ganaderia11: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-tPp3L9OXQIeXxIbcoU0Ayjh4nrHQXC.csv",
  activos11: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-H9Gs3WbYTeoaiwxOltQGgTNChSOUC7.csv",
  rotacion11:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-CxZgNjyIxmGFF3nFv2fYQtZPTSp1T9.csv",

  // CUIT 12: 30605384753 - SAN ESTEBAN ACCIONES SCA (ARRENDATARIO PERFECTO, SCORE RÉCORD)
  general12: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/General-9rdVSvQTTvrYCppQUiDCWRrgpRrNrY.csv",
  crediticio12: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Crediticio-C6Ai2FuHrhgzGVHCMbfpJ8LFxT91R0.csv",
  agriculturaIngresos12:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Ingresos-ocO7w7o91qzhzYx2cYeGJbWyWkKN1c.csv",
  ganaderia12: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ganaderia-HenpGMYWMzSmnLUhMhmtUBcMvrweiT.csv",
  activos12: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Activos-LZz5FIp8W7bgRXKcoLPPBtGiepmtjr.csv",
  rotacion12:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Agricultura_Rotacion-xq1upRIGiNGa7EJoTLt9XB33zNh2Ar.csv",
}

function parseCSV(csvText: string): any[] {
  // 1. Split safely on any platform line-ending
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  // helper: remove quotes, carriage returns and BOM (﻿)
  const clean = (x: string) =>
    x
      .replace(/\uFEFF/g, "")
      .replace(/\r/g, "")
      .replace(/^"|"$/g, "")
      .trim()

  // robust CSV line parser that respects quoted commas
  const parseLine = (line: string): string[] => {
    const out: string[] = []
    let cur = ""
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"' && (i === 0 || line[i - 1] !== "\\")) {
        insideQuotes = !insideQuotes
      } else if (ch === "," && !insideQuotes) {
        out.push(clean(cur))
        cur = ""
      } else {
        cur += ch
      }
    }
    out.push(clean(cur))
    return out
  }

  const headers = parseLine(lines[0]).map(clean)
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseLine(lines[i])
    const row: any = {}
    headers.forEach((h, idx) => (row[h] = values[idx] ?? ""))
    rows.push(row)
  }

  return rows
}

export function Dashboard() {
  const [data, setData] = useState<ProductorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCUIT, setSelectedCUIT] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [productores, setProductores] = useState<any[]>([])
  const [dataSource, setDataSource] = useState<"csv" | "sample">("csv")
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // En la función loadData, actualizar para cargar ambos conjuntos de datos
  const loadData = async () => {
    try {
      setLoading(true)
      console.log("🔄 Iniciando carga de datos desde CSV ACTUALIZADOS (12 CUITs)...")

      // Cargar todos los archivos CSV de los 8 CUITs
      const [
        // CUIT 1
        generalText,
        crediticioText,
        agriculturaText,
        ganaderiaText,
        activosText,
        rotacionText,
        // CUIT 2
        generalText2,
        crediticioText2,
        agriculturaText2,
        ganaderiaText2,
        activosText2,
        rotacionText2,
        // CUIT 3
        generalText3,
        crediticioText3,
        agriculturaText3,
        ganaderiaText3,
        activosText3,
        rotacionText3,
        // CUIT 4
        generalText4,
        crediticioText4,
        agriculturaText4,
        ganaderiaText4,
        activosText4,
        rotacionText4,
        // CUIT 5
        generalText5,
        crediticioText5,
        agriculturaText5,
        ganaderiaText5,
        activosText5,
        rotacionText5,
        // CUIT 6
        generalText6,
        crediticioText6,
        agriculturaText6,
        ganaderiaText6,
        activosText6,
        rotacionText6,
        // CUIT 7
        generalText7,
        crediticioText7,
        agriculturaText7,
        ganaderiaText7,
        activosText7,
        rotacionText7,
        // CUIT 8
        generalText8,
        crediticioText8,
        agriculturaText8,
        ganaderiaText8,
        activosText8,
        rotacionText8,
        // CUIT 9
        generalText9,
        crediticioText9,
        agriculturaText9,
        ganaderiaText9,
        activosText9,
        rotacionText9,
        // CUIT 10
        generalText10,
        crediticioText10,
        agriculturaText10,
        ganaderiaText10,
        activosText10,
        rotacionText10,
        // CUIT 11
        generalText11,
        crediticioText11,
        agriculturaText11,
        ganaderiaText11,
        activosText11,
        rotacionText11,
        // CUIT 12
        generalText12,
        crediticioText12,
        agriculturaText12,
        ganaderiaText12,
        activosText12,
        rotacionText12,
      ] = await Promise.all([
        // CUIT 1
        fetch(CSV_URLS.general).then((r) => r.text()),
        fetch(CSV_URLS.crediticio).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia).then((r) => r.text()),
        fetch(CSV_URLS.activos).then((r) => r.text()),
        fetch(CSV_URLS.rotacion).then((r) => r.text()),
        // CUIT 2
        fetch(CSV_URLS.general2).then((r) => r.text()),
        fetch(CSV_URLS.crediticio2).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos2).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia2).then((r) => r.text()),
        fetch(CSV_URLS.activos2).then((r) => r.text()),
        fetch(CSV_URLS.rotacion2).then((r) => r.text()),
        // CUIT 3
        fetch(CSV_URLS.general3).then((r) => r.text()),
        fetch(CSV_URLS.crediticio3).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos3).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia3).then((r) => r.text()),
        fetch(CSV_URLS.activos3).then((r) => r.text()),
        fetch(CSV_URLS.rotacion3).then((r) => r.text()),
        // CUIT 4
        fetch(CSV_URLS.general4).then((r) => r.text()),
        fetch(CSV_URLS.crediticio4).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos4).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia4).then((r) => r.text()),
        fetch(CSV_URLS.activos4).then((r) => r.text()),
        fetch(CSV_URLS.rotacion4).then((r) => r.text()),
        // CUIT 5
        fetch(CSV_URLS.general5).then((r) => r.text()),
        fetch(CSV_URLS.crediticio5).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos5).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia5).then((r) => r.text()),
        fetch(CSV_URLS.activos5).then((r) => r.text()),
        fetch(CSV_URLS.rotacion5).then((r) => r.text()),
        // CUIT 6
        fetch(CSV_URLS.general6).then((r) => r.text()),
        fetch(CSV_URLS.crediticio6).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos6).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia6).then((r) => r.text()),
        fetch(CSV_URLS.activos6).then((r) => r.text()),
        fetch(CSV_URLS.rotacion6).then((r) => r.text()),
        // CUIT 7
        fetch(CSV_URLS.general7).then((r) => r.text()),
        fetch(CSV_URLS.crediticio7).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos7).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia7).then((r) => r.text()),
        fetch(CSV_URLS.activos7).then((r) => r.text()),
        fetch(CSV_URLS.rotacion7).then((r) => r.text()),
        // CUIT 8
        fetch(CSV_URLS.general8).then((r) => r.text()),
        fetch(CSV_URLS.crediticio8).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos8).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia8).then((r) => r.text()),
        fetch(CSV_URLS.activos8).then((r) => r.text()),
        fetch(CSV_URLS.rotacion8).then((r) => r.text()),
        // CUIT 9
        fetch(CSV_URLS.general9).then((r) => r.text()),
        fetch(CSV_URLS.crediticio9).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos9).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia9).then((r) => r.text()),
        fetch(CSV_URLS.activos9).then((r) => r.text()),
        fetch(CSV_URLS.rotacion9).then((r) => r.text()),
        // CUIT 10
        fetch(CSV_URLS.general10).then((r) => r.text()),
        fetch(CSV_URLS.crediticio10).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos10).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia10).then((r) => r.text()),
        fetch(CSV_URLS.activos10).then((r) => r.text()),
        fetch(CSV_URLS.rotacion10).then((r) => r.text()),
        // CUIT 11
        fetch(CSV_URLS.general11).then((r) => r.text()),
        fetch(CSV_URLS.crediticio11).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos11).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia11).then((r) => r.text()),
        fetch(CSV_URLS.activos11).then((r) => r.text()),
        fetch(CSV_URLS.rotacion11).then((r) => r.text()),
        // CUIT 12
        fetch(CSV_URLS.general12).then((r) => r.text()),
        fetch(CSV_URLS.crediticio12).then((r) => r.text()),
        fetch(CSV_URLS.agriculturaIngresos12).then((r) => r.text()),
        fetch(CSV_URLS.ganaderia12).then((r) => r.text()),
        fetch(CSV_URLS.activos12).then((r) => r.text()),
        fetch(CSV_URLS.rotacion12).then((r) => r.text()),
      ])

      console.log("📄 Textos CSV cargados para los 11 CUITs")

      // Parsear CSV y combinar datos de los 8 CUITs
      const generalData = [
        ...parseCSV(generalText),
        ...parseCSV(generalText2),
        ...parseCSV(generalText3),
        ...parseCSV(generalText4),
        ...parseCSV(generalText5),
        ...parseCSV(generalText6),
        ...parseCSV(generalText7),
        ...parseCSV(generalText8),
        ...parseCSV(generalText9),
        ...parseCSV(generalText10),
        ...parseCSV(generalText11),
        ...parseCSV(generalText12),
      ]
      const crediticioData = [
        ...parseCSV(crediticioText),
        ...parseCSV(crediticioText2),
        ...parseCSV(crediticioText3),
        ...parseCSV(crediticioText4),
        ...parseCSV(crediticioText5),
        ...parseCSV(crediticioText6),
        ...parseCSV(crediticioText7),
        ...parseCSV(crediticioText8),
        ...parseCSV(crediticioText9),
        ...parseCSV(crediticioText10),
        ...parseCSV(crediticioText11),
        ...parseCSV(crediticioText12),
      ]
      const agriculturaData = [
        ...parseCSV(agriculturaText),
        ...parseCSV(agriculturaText2),
        ...parseCSV(agriculturaText3),
        ...parseCSV(agriculturaText4),
        ...parseCSV(agriculturaText5),
        ...parseCSV(agriculturaText6),
        ...parseCSV(agriculturaText7),
        ...parseCSV(agriculturaText8),
        ...parseCSV(agriculturaText9),
        ...parseCSV(agriculturaText10),
        ...parseCSV(agriculturaText11),
        ...parseCSV(agriculturaText12),
      ]
      const ganaderiaData = [
        ...parseCSV(ganaderiaText),
        ...parseCSV(ganaderiaText2),
        ...parseCSV(ganaderiaText3),
        ...parseCSV(ganaderiaText4),
        ...parseCSV(ganaderiaText5),
        ...parseCSV(ganaderiaText6),
        ...parseCSV(ganaderiaText7),
        ...parseCSV(ganaderiaText8),
        ...parseCSV(ganaderiaText9),
        ...parseCSV(ganaderiaText10),
        ...parseCSV(ganaderiaText11),
        ...parseCSV(ganaderiaText12),
      ]
      const activosData = [
        ...parseCSV(activosText),
        ...parseCSV(activosText2),
        ...parseCSV(activosText3),
        ...parseCSV(activosText4),
        ...parseCSV(activosText5),
        ...parseCSV(activosText6),
        ...parseCSV(activosText7),
        ...parseCSV(activosText8),
        ...parseCSV(activosText9),
        ...parseCSV(activosText10),
        ...parseCSV(activosText11),
        ...parseCSV(activosText12),
      ]
      const rotacionData = [
        ...parseCSV(rotacionText),
        ...parseCSV(rotacionText2),
        ...parseCSV(rotacionText3),
        ...parseCSV(rotacionText4),
        ...parseCSV(rotacionText5),
        ...parseCSV(rotacionText6),
        ...parseCSV(rotacionText7),
        ...parseCSV(rotacionText8),
        ...parseCSV(rotacionText9),
        ...parseCSV(rotacionText10),
        ...parseCSV(rotacionText11),
        ...parseCSV(rotacionText12),
      ]

      console.log("✅ Datos combinados parseados:", {
        general: generalData.length,
        crediticio: crediticioData.length,
        agricultura: agriculturaData.length,
        ganaderia: ganaderiaData.length,
        activos: activosData.length,
        rotacion: rotacionData.length,
      })

      // Debug específico para los 3 CUITs
      console.log(
        "🏢 CUITs encontrados:",
        generalData.map((g) => `${g.CUIT} - ${g.Razon_Social}`),
      )

      const loadedData = {
        general: generalData,
        crediticio: crediticioData,
        agricultura: agriculturaData,
        ganaderia: ganaderiaData,
        activos: activosData,
        rotacion: rotacionData,
      }

      setData(loadedData)
      setDataSource("csv")

      // Extraer productores únicos de los 3 CUITs
      const uniqueProductores = generalData
        .map((item) => ({
          cuit: String(item.CUIT || ""),
          razonSocial: String(item.Razon_Social || ""),
        }))
        .filter((p) => p.cuit && p.razonSocial)

      console.log("👥 Productores encontrados:", uniqueProductores)
      setProductores(uniqueProductores)

      if (uniqueProductores.length > 0) {
        setSelectedCUIT(uniqueProductores[0].cuit)
        console.log("🎯 CUIT seleccionado:", uniqueProductores[0].cuit)
      } else {
        console.error("❌ No se encontraron productores válidos")
      }
    } catch (error) {
      console.error("💥 Error loading CSV data:", error)
      setDataSource("sample")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar productores con búsqueda mejorada
  const filteredProductores = productores.filter((p) => {
    if (!searchTerm) return true

    const nombre = (p.razonSocial || "").toLowerCase()
    const cuitStr = String(p.cuit || "")
    const term = searchTerm.toLowerCase()

    return nombre.includes(term) || cuitStr.includes(term)
  })

  // Sugerencias para autocompletado
  const suggestions = searchTerm.length > 0 ? filteredProductores.slice(0, 5) : []

  const currentProductor = data?.general.find((p) => String(p.CUIT) === selectedCUIT) ?? null

  const handleSelectSuggestion = (productor: any) => {
    setSelectedCUIT(productor.cuit)
    setSearchTerm("")
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setShowSuggestions(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando plataforma crediticia...</p>
          <p className="mt-2 text-sm text-gray-500">Descargando datos actualizados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              🏦 Plataforma de Evaluación Crediticia Agropecuaria
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Análisis integral de productores agropecuarios</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
              <span className="text-xs sm:text-sm text-gray-500">
                {productores.length} productor{productores.length !== 1 ? "es" : ""} cargado
                {productores.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {/* Búsqueda con sugerencias - RESPONSIVE */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o CUIT..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSuggestions(e.target.value.length > 0)
                }}
                onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                className="pl-10 pr-10 w-full text-sm sm:text-base"
              />
              {searchTerm && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0" onClick={clearSearch}>
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Sugerencias - RESPONSIVE */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((productor) => (
                    <button
                      key={productor.cuit}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 focus:bg-gray-50 focus:outline-none"
                      onClick={() => handleSelectSuggestion(productor)}
                    >
                      <div className="font-medium text-sm">{productor.razonSocial}</div>
                      <div className="text-xs text-gray-500">{productor.cuit}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedCUIT} onValueChange={setSelectedCUIT}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar productor" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProductores.map((productor) => (
                    <SelectItem key={productor.cuit} value={productor.cuit}>
                      <span className="text-sm">
                        {productor.razonSocial} - {productor.cuit}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del productor seleccionado */}
      {currentProductor && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">🏢 {currentProductor.Razon_Social}</CardTitle>
                <CardDescription className="text-base">
                  CUIT: {currentProductor.CUIT} |{" "}
                  {Number.parseFloat(currentProductor.Ha_Totales || "0").toLocaleString()} ha totales
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={Number.parseInt(currentProductor.Score_Nosis || "0") >= 700 ? "default" : "destructive"}
                  className="text-sm"
                >
                  📊 Score: {currentProductor.Score_Nosis}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  💳 Endeudamiento: ${Number.parseFloat(currentProductor.Endeudamiento || "0").toFixed(2)}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  🐄 {Number.parseInt(currentProductor.Cabezas_Totales || "0").toLocaleString()} cabezas
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Tabs principales - CORREGIDAS */}
      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="resumen" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            📋 <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="agricultura" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            🌾 <span className="hidden sm:inline">Agricultura</span>
          </TabsTrigger>
          <TabsTrigger value="ganaderia" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            🐄 <span className="hidden sm:inline">Ganadería</span>
          </TabsTrigger>
          <TabsTrigger value="activos" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            🏠 <span className="hidden sm:inline">Activos</span>
          </TabsTrigger>
          <TabsTrigger value="crediticio" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
            💰 <span className="hidden sm:inline">Crediticio</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <ResumenGeneral data={data} selectedCUIT={selectedCUIT} />
        </TabsContent>

        <TabsContent value="agricultura">
          <DatosAgricolas data={data} selectedCUIT={selectedCUIT} />
        </TabsContent>

        <TabsContent value="ganaderia">
          <DatosGanaderos data={data} selectedCUIT={selectedCUIT} />
        </TabsContent>

        <TabsContent value="activos">
          <ActivosPatrimonio data={data} selectedCUIT={selectedCUIT} />
        </TabsContent>

        <TabsContent value="crediticio">
          <AnalisisCrediticio data={data} selectedCUIT={selectedCUIT} />
        </TabsContent>
      </Tabs>

      {/* Overlay para cerrar sugerencias */}
      {showSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />}
    </div>
  )
}
