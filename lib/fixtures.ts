import type { ProductBaseline } from "@/lib/types"
import { qualityScore } from "@/lib/scoring"

const freeClipAttributes = {
  "Brand": null,
  "Bluetooth": "true",
  "MP3": "true",
  "Peso del dispositivo (gr)": "37.8gr",
  "Duración de la batería en conversación": "9 horas después de una carga completa y 38 horas cuando se utiliza con el estuche de carga.",
  "Unidad de Potencia Cargador": "W",
  "Tamaño (largo x ancho x fondo) (mm)": "25.4 x 26.7 x 18.8mm",
  "USB tipo C": null
}

const orangeFreeClipAttributes = {
  "Versión del sistema operativo": "Compatibles con iOS y Android",
  "Bluetooth": "true",
  "MP3": "true",
  "Peso del dispositivo (gr)": "37.8 gr",
  "Tamaño (largo x ancho x fondo) (mm)": "25.4 x 26.7 x 18.8 mm",
  "Duración de la batería en conversación": "9 horas después de una carga completa y 38 horas cuando se utiliza con el estuche de carga.",
  "Tecnología": "Li-Ion",
  "Unidad de Potencia Cargador": "W"
}

const noisyDescription = "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Huawei Huawei FreeClip 2 Abrir ventana modal: Información sobre el cargador 2.5 - 7.5 W Este producto se vende sin cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 7.5 vatios para alcanzar la máxima velocidad de carga. No Compatible USB-PD. Ver Opiniones En 24 plazos Desde +0 € pago inicial Total en 24 plazos: 126€ Ahorra 73€ vs PVPr Vendido y enviado por Orange..."

const freeClipEvidence = [
  {
    id: "ev-orange-freeclip",
    sourceType: "orange_page" as const,
    title: "Orange Huawei FreeClip 2",
    url: "https://www.orange.es/dispositivos/auriculares/huawei/freeclip-2-negro/3711247.html",
    accessedAt: "2026-04-15T00:00:00Z",
    excerpt: "Bluetooth, MP3, peso 37.8 gr, dimensiones 25.4 x 26.7 x 18.8 mm, batería 9 horas y 38 horas con estuche.",
    confidence: "high" as const
  },
  {
    id: "ev-maxmovil-freeclip",
    sourceType: "retailer_reference" as const,
    title: "MaxMovil Huawei FreeClip 2",
    url: "https://www.maxmovil.com/es/huawei-freeclip-2-auriculares-inalambricos-negro-black.html",
    accessedAt: "2026-04-15T00:00:00Z",
    excerpt: "EAN 6942103169434, Bluetooth 6.0, USB-C, micrófono integrado, reducción de ruido, batería 537 mAh.",
    confidence: "medium" as const
  }
]

const product: ProductBaseline = {
  id: "freeclip-2",
  sourceSku: "ORANGE_3711247",
  title: "Huawei FreeClip 2",
  brand: null,
  categoryPath: ["Orange Audio y Hi-Fi", "Orange Auriculares"],
  ean: "1233711247139",
  status: "NOT_SYNCHRONIZED",
  score: 0,
  scoreBand: "red",
  miraklDescription: noisyDescription,
  orangeDescription: "Huawei FreeClip 2 con diseño C-bridge ligero, Bluetooth, batería de larga duración y compatibilidad con iOS y Android.",
  orangeUrl: "https://www.orange.es/dispositivos/auriculares/huawei/freeclip-2-negro/3711247.html",
  warnings: ["Brand is required", "Description contains storefront noise", "Candidate EAN differs from Mirakl baseline"],
  attributes: freeClipAttributes,
  orangeAttributes: orangeFreeClipAttributes,
  evidence: freeClipEvidence,
  candidates: [
    { id: "cand-brand", fieldPath: "Brand", currentValue: null, candidateValue: "Huawei", confidence: "high", status: "proposed", evidenceIds: ["ev-orange-freeclip"] },
    { id: "cand-ean", fieldPath: "EAN", currentValue: "1233711247139", candidateValue: "6942103169434", confidence: "medium", status: "proposed", evidenceIds: ["ev-maxmovil-freeclip"] },
    { id: "cand-description", fieldPath: "Description", currentValue: noisyDescription, candidateValue: "Huawei FreeClip 2 are lightweight open-ear wireless earbuds with a C-bridge design, Bluetooth connectivity, long battery life with charging case, and USB-C charging.", confidence: "medium", status: "proposed", evidenceIds: ["ev-orange-freeclip", "ev-maxmovil-freeclip"] },
    { id: "cand-bt-version", fieldPath: "Bluetooth version", currentValue: null, candidateValue: "6.0", confidence: "medium", status: "proposed", evidenceIds: ["ev-maxmovil-freeclip"] },
    { id: "cand-noise", fieldPath: "Noise reduction", currentValue: null, candidateValue: "Integrated noise reduction for calls", confidence: "medium", status: "proposed", evidenceIds: ["ev-maxmovil-freeclip"] }
  ]
}

const scored = qualityScore(product)
product.score = scored.score
product.scoreBand = scored.band

export const products: ProductBaseline[] = [product]
