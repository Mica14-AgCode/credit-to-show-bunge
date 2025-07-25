"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  data: any
  selectedCUIT: string
}

export function MapasPropiedades({ data, selectedCUIT }: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReady(true)
    }
  }, [])

  if (!ready) {
    return <p className="text-sm text-gray-500">Cargando mapa…</p>
  }

  const productor = data?.general.find((p: any) => p.CUIT === selectedCUIT)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Propiedades</CardTitle>
      </CardHeader>
      <CardContent>
        {productor ? (
          <div className="h-96 flex items-center justify-center rounded-md border bg-gray-100 text-gray-500">
            {/* Aquí se integraría un mapa (Leaflet, Mapbox, etc.) con los GeoJSON:
                productor.GeoJSON_Propios y productor.GeoJSON_Alquilados */}
            Vista de mapa próximamente
          </div>
        ) : (
          <p className="text-sm text-gray-500">No se encontró el productor seleccionado.</p>
        )}
      </CardContent>
    </Card>
  )
}
