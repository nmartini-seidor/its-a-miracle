import {
  DEMO_SCHEMA_BLUEPRINTS,
  MOCK_DOMAIN_CONTRACT_VERSION,
  MOCK_STATE_OWNERSHIP,
} from "./demo-contract.ts"
import { qualityScore } from "./scoring.ts"
import type {
  AggregatorDefinition,
  CandidateRecord,
  EvidenceRecord,
  ProductRecord,
  SchemaDefinition,
  SettingsSnapshot,
} from "./types.ts"

const capturedAt = "2026-04-15T00:00:00Z"

export const aggregators: AggregatorDefinition[] = [
  {
    id: "official-manufacturer",
    name: "Official manufacturer",
    type: "manufacturer",
    baseUrl: "https://manufacturer.example",
    authorityScore: 95,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["branding", "core-specs", "descriptions"],
    sampleDomains: ["manufacturer.example"],
    description: "Highest-confidence source for branding, core specifications, and canonical product messaging.",
    confidencePolicy: "Use as the primary source for branding and technical facts published by the vendor.",
  },
  {
    id: "trusted-retailer",
    name: "Trusted retailer",
    type: "retailer",
    baseUrl: "https://retailer.example",
    authorityScore: 70,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["commercial-copy", "visible-specs", "availability"],
    sampleDomains: ["retailer.example"],
    description: "Supporting source for visible specs, merchandising language, and package details.",
    confidencePolicy: "Use as corroborating evidence for visible specifications and merchandising details.",
  },
  {
    id: "spec-database",
    name: "Specification database",
    type: "spec_database",
    baseUrl: "https://specs.example",
    authorityScore: 85,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["technical-fields", "dimensions", "battery"],
    sampleDomains: ["specs.example"],
    description: "Structured technical source for dimensions, battery, and connectivity fields.",
    confidencePolicy: "Use for structured technical fields when corroborated by manufacturer or retailer evidence.",
  },
  {
    id: "marketplace-listing",
    name: "Marketplace listing",
    type: "marketplace",
    baseUrl: "https://market.example",
    authorityScore: 45,
    defaultConfidence: "low",
    enabled: true,
    coverageTags: ["corroboration", "title-variants"],
    sampleDomains: ["market.example"],
    description: "Low-authority corroborating source for title variants and merchandising claims.",
    confidencePolicy: "Use only as supporting evidence, never as sole proof for canonical fields.",
  },
  {
    id: "internal-reference",
    name: "Internal reference library",
    type: "internal_reference",
    baseUrl: "https://reference.example",
    authorityScore: 80,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["operator-notes", "internal-rules"],
    sampleDomains: ["reference.example"],
    description: "Internal operator guidance for policy-based review and export policies.",
    confidencePolicy: "Use for internal review notes and policy-aligned guidance only.",
  },
  {
    id: "orange-source-catalog",
    name: "Orange source catalog",
    type: "partner_feed",
    baseUrl: "https://www.orange.es/dispositivos",
    authorityScore: 88,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["orange-import", "mirakl-source", "device-catalog"],
    sampleDomains: ["orange.es"],
    description: "Orange device catalog artifacts imported into Mirakl for electronics enrichment examples.",
    confidencePolicy: "Use as the imported catalog baseline for device titles, identifiers, and visible product specs.",
  },
]

export const schemas: SchemaDefinition[] = [
  {
    id: DEMO_SCHEMA_BLUEPRINTS[0].id,
    slug: DEMO_SCHEMA_BLUEPRINTS[0].slug,
    name: DEMO_SCHEMA_BLUEPRINTS[0].name,
    linkedCategories: ["Audio", "Wearable audio"],
    requiredAttributes: ["brand", "productName", "ean", "connectivity", "weight", "batteryLife", "description"],
    recommendedAttributes: ["bluetoothVersion", "usbC", "microphone", "noiseReduction", "compatibility"],
    warningRules: ["Brand missing", "Description contains storefront noise", "Required schema field missing"],
    scoringRules: ["Missing brand = -15", "Missing EAN = -20", "Weak description = -10"],
    exampleProductIds: ["freeclip-2"],
  },
  {
    id: DEMO_SCHEMA_BLUEPRINTS[1].id,
    slug: DEMO_SCHEMA_BLUEPRINTS[1].slug,
    name: DEMO_SCHEMA_BLUEPRINTS[1].name,
    linkedCategories: ["Phones"],
    requiredAttributes: ["brand", "model", "ean", "displaySize", "storage", "ram", "description"],
    recommendedAttributes: ["cameraResolution", "batteryCapacity", "connectivity"],
    warningRules: ["Required schema field missing", "Inconsistent attribute units"],
    scoringRules: ["Missing required field = -10 each"],
    exampleProductIds: ["galaxy-a55"],
  },
  {
    id: DEMO_SCHEMA_BLUEPRINTS[2].id,
    slug: DEMO_SCHEMA_BLUEPRINTS[2].slug,
    name: DEMO_SCHEMA_BLUEPRINTS[2].name,
    linkedCategories: ["TV & Home cinema"],
    requiredAttributes: ["brand", "model", "ean", "displaySize", "resolution", "panelTechnology", "description"],
    recommendedAttributes: ["refreshRate", "hdmiPorts"],
    warningRules: ["Required schema field missing", "Description is too weak"],
    scoringRules: ["Low image count = -5", "Weak attribute completeness = -10"],
    exampleProductIds: ["lg-oled-c4-55"],
  },
  {
    id: DEMO_SCHEMA_BLUEPRINTS[3].id,
    slug: DEMO_SCHEMA_BLUEPRINTS[3].slug,
    name: DEMO_SCHEMA_BLUEPRINTS[3].name,
    linkedCategories: ["Tablets"],
    requiredAttributes: ["brand", "model", "ean", "displaySize", "storage", "description"],
    recommendedAttributes: ["stylusSupport", "batteryCapacity", "connectivity"],
    warningRules: ["Missing required field", "Noisy storefront copy"],
    scoringRules: ["Weak description = -10"],
    exampleProductIds: ["redmi-pad-pro"],
  },
  {
    id: DEMO_SCHEMA_BLUEPRINTS[4].id,
    slug: DEMO_SCHEMA_BLUEPRINTS[4].slug,
    name: DEMO_SCHEMA_BLUEPRINTS[4].name,
    linkedCategories: ["Computing"],
    requiredAttributes: ["brand", "model", "ean", "storage", "ram", "description"],
    recommendedAttributes: ["displaySize", "batteryLife"],
    warningRules: ["Missing required field", "Inconsistent units"],
    scoringRules: ["Missing required field = -10 each"],
    exampleProductIds: [],
  },

  {
    id: "schema-gaming-devices",
    slug: "gaming-devices",
    name: "Gaming devices",
    linkedCategories: ["Gaming", "Consoles", "Video games"],
    requiredAttributes: ["brand", "productName", "ean", "description"],
    recommendedAttributes: ["connectivity", "storage", "ram", "usbC", "weight", "dimensions"],
    warningRules: ["Product pending operator review", "Missing catalog identifiers"],
    scoringRules: ["Missing identifier = -20", "Missing required field = -10 each"],
    exampleProductIds: [],
  },
  {
    id: "schema-monitors",
    slug: "monitors",
    name: "Monitors",
    linkedCategories: ["Computing", "Monitors"],
    requiredAttributes: ["brand", "productName", "ean", "displaySize", "resolution", "description"],
    recommendedAttributes: ["connectivity", "weight", "dimensions"],
    warningRules: ["Required schema field missing", "Inconsistent display units"],
    scoringRules: ["Missing required field = -10 each"],
    exampleProductIds: [],
  },
]

export const demoSettings: SettingsSnapshot = {
  miraklBaseUrl: "https://mirakl.example",
  environment: "demo",
  fakeResearchMode: true,
  defaultResearchDelaySeconds: 30,
  maxEvidencePerProduct: 4,
  defaultCandidateConfidence: "medium",
  autoAssignSchemaByCategory: true,
  enabledAggregatorIds: aggregators.map((aggregator) => aggregator.id),
}

const heroBaselineAttributes = {
  brand: null,
  connectivity: "Bluetooth",
  bluetooth: "Yes",
  weight: "37.8 g",
  batteryLife: "9 hours standalone / 38 hours with case",
  usbC: null,
  dimensions: "25.4 x 26.7 x 18.8 mm",
  compatibility: null,
  description: "Flexible payment text, charging disclaimers, and storefront promotional copy are mixed into the baseline product description.",
} satisfies ProductRecord["baselineAttributes"]

const heroEvidenceFields = {
  brand: "Huawei",
  ean: "6942103169434",
  connectivity: "Bluetooth",
  bluetoothVersion: "6.0",
  usbC: "USB-C",
  dimensions: "25.4 x 26.7 x 18.8 mm",
  batteryLife: "9 hours standalone / 38 hours with case",
  compatibility: "iOS and Android",
  batteryTechnology: "Li-Ion",
  description: "Huawei FreeClip 2 are lightweight open-ear wireless earbuds with Bluetooth connectivity, long battery life, a charging case, and USB-C charging.",
} satisfies ProductRecord["bestEvidenceByField"]

const heroEvidence: EvidenceRecord[] = [
  {
    id: "ev-freeclip-manufacturer",
    productId: "freeclip-2",
    aggregatorId: "official-manufacturer",
    sourceName: "Official manufacturer",
    sourceType: "manufacturer",
    sourceUrl: "https://manufacturer.example/freeclip-2",
    title: "Huawei FreeClip 2 official product page",
    summary: "Open-ear wireless earbuds with long battery life, lightweight construction, and broad device compatibility.",
    extractedFields: {
      brand: "Huawei",
      compatibility: "iOS and Android",
      batteryLife: "9 hours standalone / 38 hours with case",
      description: "Huawei FreeClip 2 are lightweight open-ear wireless earbuds with Bluetooth connectivity, long battery life, a charging case, and USB-C charging.",
    },
    capturedAt,
    confidence: "high",
  },
  {
    id: "ev-freeclip-retailer",
    productId: "freeclip-2",
    aggregatorId: "trusted-retailer",
    sourceName: "Trusted retailer",
    sourceType: "retailer",
    sourceUrl: "https://retailer.example/huawei-freeclip-2",
    title: "Trusted retailer listing for Huawei FreeClip 2",
    summary: "Retail listing highlights Bluetooth 6.0, USB-C charging, integrated microphone, and charging case support.",
    extractedFields: {
      ean: "6942103169434",
      bluetoothVersion: "6.0",
      usbC: "USB-C",
      noiseReduction: "Integrated noise reduction for calls",
    },
    capturedAt,
    confidence: "medium",
  },
]

const heroCandidates: CandidateRecord[] = [
  {
    id: "cand-brand",
    productId: "freeclip-2",
    fieldName: "brand",
    currentValue: null,
    candidateValue: "Huawei",
    confidence: "high",
    status: "proposed",
    sourceEvidenceIds: ["ev-freeclip-manufacturer"],
  },
  {
    id: "cand-ean",
    productId: "freeclip-2",
    fieldName: "ean",
    currentValue: "1233711247139",
    candidateValue: "6942103169434",
    confidence: "medium",
    status: "proposed",
    sourceEvidenceIds: ["ev-freeclip-retailer"],
  },
  {
    id: "cand-description",
    productId: "freeclip-2",
    fieldName: "description",
    currentValue: heroBaselineAttributes.description,
    candidateValue: "Huawei FreeClip 2 are lightweight open-ear wireless earbuds with Bluetooth connectivity, long battery life, a charging case, and USB-C charging.",
    confidence: "high",
    status: "proposed",
    sourceEvidenceIds: ["ev-freeclip-manufacturer", "ev-freeclip-retailer"],
  },
  {
    id: "cand-bt-version",
    productId: "freeclip-2",
    fieldName: "bluetoothVersion",
    currentValue: null,
    candidateValue: "6.0",
    confidence: "medium",
    status: "proposed",
    sourceEvidenceIds: ["ev-freeclip-retailer"],
  },
]

type OrangeImportedRow = {
  id: string
  sku: string
  title: string
  brand: string
  categoryPath: readonly string[]
  schemaId: string
  sourceUrl: string
  description: string
  attributes: ProductRecord["baselineAttributes"]
}

const orangeImportedRows = [
  {
    "id": "orange-orange-mkp000919395167",
    "sku": "ORANGE_MKP000919395167",
    "title": "Nintendo Videojuego Luigi's Mansion 3 Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/videojuegos/nintendo/luigis-mansion-3-nintendo-switch/MKP000919395167.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor LUIGI’S MANSION – NINTENDO SWITCH | VERSIÓN ESPAÑOLA Idiomas: Textos y voces: Español, Inglés, Francés, Alemán, Italiano. ¡Luigi se enfrenta a una pesadilla espeluznante! Luigi se prepar…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Luigi's Mansion 3 Switch",
      "ean": "1239193951670",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor LUIGI’S MANSION – NINTENDO SWITCH | VERSIÓN ESPAÑOLA Idiomas: Textos y voces: Español, Inglés, Francés, Alemán, Italiano. ¡Luigi se enfrenta a una pesadilla espeluznante! Luigi se prepar…",
      "weight": "0.10 gr",
      "compatibility": "JUEGOS SWITCH"
    }
  },
  {
    "id": "orange-orange-mkp000919369436",
    "sku": "ORANGE_MKP000919369436",
    "title": "Nintendo Videojuego Mario vs Donkey Kong Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/videojuegos/nintendo/mario-vs-donkey-kong-nintendo-switch/MKP000919369436.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor MARIO VS DONKEY KONG NINTENDO SWITCH VERSIÓN ESPAÑOLA ¡Estos juguetes tienen cuerda para rato! La chispa de rivalidad que prendió en Game Boy Advance se reaviva en Mario vs. Donkey Kong…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Mario vs Donkey Kong Switch",
      "ean": "1239193694362",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor MARIO VS DONKEY KONG NINTENDO SWITCH VERSIÓN ESPAÑOLA ¡Estos juguetes tienen cuerda para rato! La chispa de rivalidad que prendió en Game Boy Advance se reaviva en Mario vs. Donkey Kong…",
      "compatibility": "CONSOLAS SWITCH"
    }
  },
  {
    "id": "orange-orange-mkp000919026648",
    "sku": "ORANGE_MKP000919026648",
    "title": "Nintendo Videojuego Monster Hunter Rise Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/videojuegos/nintendo/monster-hunter-rise-para-nintendo-switch/MKP000919026648.html",
    "description": "Nintendo Videojuego Monster Hunter Rise Switch Dimensiones Peso del dispositivo (gr) 0.10 gr Altura (cm) 17 cm Anchura (cm) 10.5 cm Profundidad (cm) 8 cm Otros detalles Componentes Incluidos MONSTER HUNTER RISE PARA NINTENDO SWITCH VERSIÓN ESPAÑOLA Contenido M…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Monster Hunter Rise Switch",
      "ean": "1239190266487",
      "description": "Nintendo Videojuego Monster Hunter Rise Switch Dimensiones Peso del dispositivo (gr) 0.10 gr Altura (cm) 17 cm Anchura (cm) 10.5 cm Profundidad (cm) 8 cm Otros detalles Componentes Incluidos MONSTER HUNTER RISE PARA NINTENDO SWITCH VERSIÓN ESPAÑOLA Contenido M…",
      "weight": "0.10 gr",
      "compatibility": "Nintendo Switch Y Nintendo Switch 2"
    }
  },
  {
    "id": "orange-orange-mkp000911904588",
    "sku": "ORANGE_MKP000911904588",
    "title": "Nintendo NBA 2K26 Nintendo Switch Caja Código Descarga Dig.",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/videojuegos/nintendo/nba-2k26-nintendo-switch-caja-codigo-descarga-dig/MKP000911904588.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor NBA 2K26 SWITCH CAJA CON CÓDIGO DESCARGA DIGITAL VERSIÓN ESPAÑOLA Nintendo NBA 2K26 Nintendo Switch Caja Código Descarga Dig. Otros detalles Componentes Incluidos NBA 2K26 SWITCH CAJA CO…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo NBA 2K26 Nintendo Switch Caja Código Descarga Dig.",
      "ean": "1239119045889",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor NBA 2K26 SWITCH CAJA CON CÓDIGO DESCARGA DIGITAL VERSIÓN ESPAÑOLA Nintendo NBA 2K26 Nintendo Switch Caja Código Descarga Dig. Otros detalles Componentes Incluidos NBA 2K26 SWITCH CAJA CO…",
      "compatibility": "Nintendo Switch"
    }
  },
  {
    "id": "orange-orange-mkp000917601064",
    "sku": "ORANGE_MKP000917601064",
    "title": "Nintendo Videojuego Shin Megami Tensei V Vengeance Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/videojuegos/nintendo/shin-megami-tensei-v-vengeance-standard-ed-switch/MKP000917601064.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Shin Megami Tensei V: Vengeance – Nintendo Switch Embárcate en esta versión definitiva de Shin Megami Tensei V , ampliada con una historia nueva que incluye nuevos escenarios, demonios y…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Shin Megami Tensei V Vengeance Switch",
      "ean": "1239176010646",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Shin Megami Tensei V: Vengeance – Nintendo Switch Embárcate en esta versión definitiva de Shin Megami Tensei V , ampliada con una historia nueva que incluye nuevos escenarios, demonios y…",
      "weight": "100 gr"
    }
  },
  {
    "id": "orange-orange-mkp000914595450",
    "sku": "ORANGE_MKP000914595450",
    "title": "Nintendo SMBros.Wonder Switch 2 Ed+Encuentro Parque Belabel",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/videojuegos/nintendo/smbroswonder-switch-2-edmasencuentro-parque-belabel/MKP000914595450.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor SUPER MARIO BROS. WONDER NINTENDO SWITCH 2 EDITION + ENCUENTRO EN EL PARQUE BELABEL VERSIÓN ESPAÑOLA Nintendo SMBros.Wonder Switch 2 Ed+Encuentro Parque Belabel Otros detalles Componente…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo SMBros.Wonder Switch 2 Ed+Encuentro Parque Belabel",
      "ean": "1239145954506",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor SUPER MARIO BROS. WONDER NINTENDO SWITCH 2 EDITION + ENCUENTRO EN EL PARQUE BELABEL VERSIÓN ESPAÑOLA Nintendo SMBros.Wonder Switch 2 Ed+Encuentro Parque Belabel Otros detalles Componente…",
      "compatibility": "Nintendo Switch"
    }
  },
  {
    "id": "orange-orange-mkp000916055291",
    "sku": "ORANGE_MKP000916055291",
    "title": "Nintendo Videojuego Totally Spies Cyber Mission Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/videojuegos/nintendo/totally-spies-cyber-mission-nintendo-switch/MKP000916055291.html",
    "description": "TOTALLY SPIES CYBER MISSION – Nintendo Switch PREPÁRATE, ¡ES HORA DE LA MISIÓN! El deslumbrante trío de Beverly Hills -Sam, Clover y Alex- ha vuelto y está listo para iluminar las vibrantes calles de Singapur con sus habilidades de espía. Desde las bulliciosas…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Totally Spies Cyber Mission Switch",
      "ean": "1239160552916",
      "description": "TOTALLY SPIES CYBER MISSION – Nintendo Switch PREPÁRATE, ¡ES HORA DE LA MISIÓN! El deslumbrante trío de Beverly Hills -Sam, Clover y Alex- ha vuelto y está listo para iluminar las vibrantes calles de Singapur con sus habilidades de espía. Desde las bulliciosas…",
      "weight": "0.10 gr",
      "compatibility": "JUEGOS SWITCH"
    }
  },
  {
    "id": "orange-orange-mkp000905189074",
    "sku": "ORANGE_MKP000905189074",
    "title": "Nintendo Consola Nintendo Switch 2 + Super Mario Galaxy 1y2",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/consolas-y-videojuegos/nintendo/consola-nintendo-switch-2-mas-super-mario-galaxy-1y2/MKP000905189074.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor NUEVA CONSOLA NINTENDO SWITCH 2 + SUPER MARIO GALAXY 1 Y SUPER MARIO GALAXY 2 SWITCH VERSIÓN ESPAÑOLA GARANTÍA EUROPEA EU WARRANTY Nintendo Switch 2 incluye: • Una consola Nintendo Switc…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Consola Nintendo Switch 2 + Super Mario Galaxy 1y2",
      "ean": "1239051890745",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor NUEVA CONSOLA NINTENDO SWITCH 2 + SUPER MARIO GALAXY 1 Y SUPER MARIO GALAXY 2 SWITCH VERSIÓN ESPAÑOLA GARANTÍA EUROPEA EU WARRANTY Nintendo Switch 2 incluye: • Una consola Nintendo Switc…",
      "compatibility": "Nintendo Switch y Nintendo Switch 2"
    }
  },
  {
    "id": "orange-orange-mkp000904208354",
    "sku": "ORANGE_MKP000904208354",
    "title": "Nintendo Switch (Versión OLED) Mandos -Blanca",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/consolas-y-videojuegos/nintendo/nintendo-switch-version-oled-mandos-color-blanca/MKP000904208354.html",
    "description": "MANDOS COLOR BLANCO VERSIÓN ESPAÑOLA SWITCH MODELO OLED Una nueva consola se incorpora a la familia Nintendo Switch: con Nintendo Switch (modelo OLED), a la venta el 8 de octubre, y con ella crece el abanico de opciones para disfrutar del amplio catálogo de ju…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch (Versión OLED) Mandos -Blanca",
      "ean": "1239042083545",
      "description": "MANDOS COLOR BLANCO VERSIÓN ESPAÑOLA SWITCH MODELO OLED Una nueva consola se incorpora a la familia Nintendo Switch: con Nintendo Switch (modelo OLED), a la venta el 8 de octubre, y con ella crece el abanico de opciones para disfrutar del amplio catálogo de ju…",
      "weight": "1.5 gr",
      "compatibility": "CONSOLAS SWITCH"
    }
  },
  {
    "id": "orange-orange-mkp000904580307",
    "sku": "ORANGE_MKP000904580307",
    "title": "Nintendo Switch2 + Super Mario Galaxy 1y2 + Joycon",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/consolas-y-videojuegos/nintendo/nintendo-switch2-mas-super-mario-galaxy-1y2-mas-joycon/MKP000904580307.html",
    "description": "Nintendo Nintendo Switch2 + Super Mario Galaxy 1y2 + Joycon Abrir ventana modal: Información sobre el cargador 2.5 - 9 W USB PD Este producto se vende con cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 9 vatio…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch2 + Super Mario Galaxy 1y2 + Joycon",
      "ean": "1239045803072",
      "description": "Nintendo Nintendo Switch2 + Super Mario Galaxy 1y2 + Joycon Abrir ventana modal: Información sobre el cargador 2.5 - 9 W USB PD Este producto se vende con cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 9 vatio…",
      "compatibility": "Nintendo Switch 2"
    }
  },
  {
    "id": "orange-orange-mkp000907953660",
    "sku": "ORANGE_MKP000907953660",
    "title": "Nintendo Switch 2 + Animal Crossing + SuperMario Galaxy 1y2",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/consolas-y-videojuegos/nintendo/switch-2-mas-animal-crossing-mas-supermario-galaxy-1y2/MKP000907953660.html",
    "description": "CONSOLA NINTENDO SWITCH 2 + ANIMAL CROSSING SWITCH 2 + SUPER MARIO GALAXY 1 Y 2 – VERSIÓN ESPAÑOLA Pack de Nintendo Switch 2 que incluye los juegos físicos completos Animal Crossing Switch 2 y Super Mario Galaxy 1 y 2. Disfruta de la nueva generación de Ninten…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch 2 + Animal Crossing + SuperMario Galaxy 1y2",
      "ean": "1239079536601",
      "description": "CONSOLA NINTENDO SWITCH 2 + ANIMAL CROSSING SWITCH 2 + SUPER MARIO GALAXY 1 Y 2 – VERSIÓN ESPAÑOLA Pack de Nintendo Switch 2 que incluye los juegos físicos completos Animal Crossing Switch 2 y Super Mario Galaxy 1 y 2. Disfruta de la nueva generación de Ninten…",
      "compatibility": "Nintendo Switch 2"
    }
  },
  {
    "id": "orange-orange-mkp000906664010",
    "sku": "ORANGE_MKP000906664010",
    "title": "Nintendo Switch 2 + AnimalCrossing + SM Galaxy 1y2 + Joycon",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/consolas-y-videojuegos/nintendo/switch-2-mas-animalcrossing-mas-sm-galaxy-1y2-mas-joycon/MKP000906664010.html",
    "description": "Nintendo Switch 2 + AnimalCrossing + SM Galaxy 1y2 + Joycon Abrir ventana modal: Información sobre el cargador 2.5 - 9 W USB PD Este producto se vende con cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 9 vatio…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch 2 + AnimalCrossing + SM Galaxy 1y2 + Joycon",
      "ean": "1239066640106",
      "description": "Nintendo Switch 2 + AnimalCrossing + SM Galaxy 1y2 + Joycon Abrir ventana modal: Información sobre el cargador 2.5 - 9 W USB PD Este producto se vende con cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 9 vatio…",
      "compatibility": "Nintendo Switch 2"
    }
  },
  {
    "id": "orange-orange-3711228",
    "sku": "ORANGE_3711228",
    "title": "Nintendo Switch 2",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/consolas-y-videojuegos/nintendo/switch-2-negro/3711228.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Nintendo Switch 2 es una consola híbrida que permite jugar tanto en modo portátil como conectada al televisor, diseñada para ofrecer una experiencia fluida y versátil. Mantiene el concep…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch 2",
      "ean": "1233711228817",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Nintendo Switch 2 es una consola híbrida que permite jugar tanto en modo portátil como conectada al televisor, diseñada para ofrecer una experiencia fluida y versátil. Mantiene el concep…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "401gr",
      "dimensions": "272 x 116 x 13.9mm",
      "storage": "256GB",
      "displaySize": "7.9p",
      "resolution": "1920 x 1080"
    }
  },
  {
    "id": "orange-orange-3240446",
    "sku": "ORANGE_3240446",
    "title": "Nintendo Switch + Super Mario Odyssey",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/consolas-y-videojuegos/nintendo/switch-gris-super-mario-odyssey/3240446.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Nintendo Switch + Super Mario Odyssey com.demandware.beehive.xcs.internal.library.ContentPO@c51ba6d(com.demandware.beehive.orm.internal.state2.RelationalObjectInstance…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch + Super Mario Odyssey",
      "ean": "1233240446713",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Nintendo Switch + Super Mario Odyssey com.demandware.beehive.xcs.internal.library.ContentPO@c51ba6d(com.demandware.beehive.orm.internal.state2.RelationalObjectInstance…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "399gr",
      "dimensions": "101.6 x 238.8 x 14mm",
      "storage": "32GB",
      "displaySize": "6.2p",
      "resolution": "1280 x 720"
    }
  },
  {
    "id": "orange-orange-3240684",
    "sku": "ORANGE_3240684",
    "title": "Nintendo Switch OLED + Super Mario Bros Wonder",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/consolas-y-videojuegos/nintendo/switch-oled-super-mario-bros-wonder/3240684.html",
    "description": "IMPORTANTE : El color de Nintendo Switch OLED así como el de los Joy-Con incluidos, puede variar en función de la disponibilidad de stock. Nintendo Switch (modelo OLED) Nintendo Switch (modelo OLED) tiene el mismo tamaño que la consola Nintendo Switch original…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch OLED + Super Mario Bros Wonder",
      "ean": "1233240684108",
      "description": "IMPORTANTE : El color de Nintendo Switch OLED así como el de los Joy-Con incluidos, puede variar en función de la disponibilidad de stock. Nintendo Switch (modelo OLED) Nintendo Switch (modelo OLED) tiene el mismo tamaño que la consola Nintendo Switch original…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "320gr",
      "dimensions": "102 x 242 x 13.9mm",
      "storage": "64GB",
      "displaySize": "7p",
      "resolution": "1280 x 720"
    }
  },
  {
    "id": "orange-orange-3711234",
    "sku": "ORANGE_3711234",
    "title": "Microsoft Xbox Series X",
    "brand": "Microsoft",
    "categoryPath": [
      "Gaming",
      "Xbox consoles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.orange.es/dispositivos/gaming/microsoft/xbox-series-x-1tb-negro/3711234.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Microsoft Xbox Series X com.demandware.beehive.xcs.internal.library.ContentPO@c51ba6d(com.demandware.beehive.orm.internal.state2.RelationalObjectInstanceState@6c770be1…",
    "attributes": {
      "brand": "Microsoft",
      "productName": "Microsoft Xbox Series X",
      "ean": "1233711234610",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Microsoft Xbox Series X com.demandware.beehive.xcs.internal.library.ContentPO@c51ba6d(com.demandware.beehive.orm.internal.state2.RelationalObjectInstanceState@6c770be1…",
      "bluetooth": "Yes",
      "weight": "4445gr",
      "dimensions": "301 × 151 × 151mm",
      "storage": "1000GB"
    }
  },
  {
    "id": "orange-orange-mkp000432796356",
    "sku": "ORANGE_MKP000432796356",
    "title": "HP Monitor OMEN 25 FHD 360HZ BG1M4E9",
    "brand": "HP",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.orange.es/dispositivos/monitores/hp/monitor-omen-25-fhd-360hz-bg1m4e9/MKP000432796356.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor el Monitor HP OMEN 25 24,5\" FullHD 360Hz IPS, diseñado para ofrecer máxima fluidez, precisión y velocidad en gaming profesional. Características Monitor HP OMEN 25 24,5\" FHD 360Hz 1ms IP…",
    "attributes": {
      "brand": "HP",
      "productName": "HP Monitor OMEN 25 FHD 360HZ BG1M4E9",
      "ean": "1234327963567",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor el Monitor HP OMEN 25 24,5\" FullHD 360Hz IPS, diseñado para ofrecer máxima fluidez, precisión y velocidad en gaming profesional. Características Monitor HP OMEN 25 24,5\" FHD 360Hz 1ms IP…",
      "connectivity": "HDMI",
      "weight": "6700 gr",
      "displaySize": "25 pulgadas",
      "resolution": "Full HD (1920 x 1080)"
    }
  },
  {
    "id": "orange-orange-mkp000430187951",
    "sku": "ORANGE_MKP000430187951",
    "title": "HP Monitor OMEN 27 G2 FHD 180HZ AV4K1E9",
    "brand": "HP",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.orange.es/dispositivos/monitores/hp/monitor-omen-27-g2-fhd-180hz-av4k1e9/MKP000430187951.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Llega más lejos con el monitor gaming FHD OMEN a 180 Hz y de 27 pulgadas. Su excelente rendimiento y la definición de sus colores permiten que puedas perderte en los juegos que más te gu…",
    "attributes": {
      "brand": "HP",
      "productName": "HP Monitor OMEN 27 G2 FHD 180HZ AV4K1E9",
      "ean": "1234301879518",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Llega más lejos con el monitor gaming FHD OMEN a 180 Hz y de 27 pulgadas. Su excelente rendimiento y la definición de sus colores permiten que puedas perderte en los juegos que más te gu…",
      "connectivity": "Otro",
      "weight": "8050 gr",
      "displaySize": "27 pulgadas",
      "resolution": "Full HD (1920 x 1080)"
    }
  },
  {
    "id": "orange-orange-mkp000432953376",
    "sku": "ORANGE_MKP000432953376",
    "title": "HP Monitor OMEN 27Q G2 QHD 180HZ AV4H6E9",
    "brand": "HP",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.orange.es/dispositivos/monitores/hp/monitor-omen-27q-g2-qhd-180hz-av4h6e9/MKP000432953376.html",
    "description": "HP Monitor OMEN 27Q G2 QHD 180HZ AV4H6E9 Dimensiones Peso del dispositivo (gr) 7330 gr Altura (cm) 52.37 cm Anchura (cm) 61.36 cm Profundidad (cm) 22.33 cm Otros detalles Componentes Incluidos Dispositivo, cable y enchufe, manual de instrucciones Contenido Dis…",
    "attributes": {
      "brand": "HP",
      "productName": "HP Monitor OMEN 27Q G2 QHD 180HZ AV4H6E9",
      "ean": "1234329533768",
      "description": "HP Monitor OMEN 27Q G2 QHD 180HZ AV4H6E9 Dimensiones Peso del dispositivo (gr) 7330 gr Altura (cm) 52.37 cm Anchura (cm) 61.36 cm Profundidad (cm) 22.33 cm Otros detalles Componentes Incluidos Dispositivo, cable y enchufe, manual de instrucciones Contenido Dis…",
      "connectivity": "Otro",
      "weight": "7330 gr",
      "displaySize": "27 pulgadas",
      "resolution": "QHD (2560 x 1440)"
    }
  },
  {
    "id": "orange-orange-mkp000439042469",
    "sku": "ORANGE_MKP000439042469",
    "title": "LG Monitor 27\" Panel IPS FHD",
    "brand": "LG",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.orange.es/dispositivos/monitores/lg/monitor-27-panel-ips-resolucion-fhd/MKP000439042469.html",
    "description": "MONITOR DE TRABAJO VERSÁTIL PARA VARIOS ESPACIOS: Este monitor es versátil y permite cubrir varias funciones en diversos espacios, tales como oficinas, instituciones públicas y servicio al cliente. Cuenta con una pantalla IPS y un diseño prácticamente sin bord…",
    "attributes": {
      "brand": "LG",
      "productName": "LG Monitor 27\" Panel IPS FHD",
      "ean": "1234390424699",
      "description": "MONITOR DE TRABAJO VERSÁTIL PARA VARIOS ESPACIOS: Este monitor es versátil y permite cubrir varias funciones en diversos espacios, tales como oficinas, instituciones públicas y servicio al cliente. Cuenta con una pantalla IPS y un diseño prácticamente sin bord…",
      "connectivity": "HDMI",
      "weight": "5.05 K gr",
      "displaySize": "27 pulgadas",
      "resolution": "Full HD (1920 x 1080)"
    }
  },
  {
    "id": "orange-orange-mkp000435784934",
    "sku": "ORANGE_MKP000435784934",
    "title": "LG Monitor UltraGear G4 27\" FHD IPS con 144Hz (O/C)",
    "brand": "LG",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.orange.es/dispositivos/monitores/lg/monitor-ultragear-g4-27-fhd-ips-con-144hz-oc/MKP000435784934.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Pantalla IPS Full HD de 27” con colores intensos y amplio ángulo de visión Tasa de refresco de 120Hz (O/C 144Hz) para fluidez total al jugar Compatible con NVIDIA G-SYNC y AMD FreeSync™…",
    "attributes": {
      "brand": "LG",
      "productName": "LG Monitor UltraGear G4 27\" FHD IPS con 144Hz (O/C)",
      "ean": "1234357849343",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Pantalla IPS Full HD de 27” con colores intensos y amplio ángulo de visión Tasa de refresco de 120Hz (O/C 144Hz) para fluidez total al jugar Compatible con NVIDIA G-SYNC y AMD FreeSync™…",
      "connectivity": "HDMI",
      "weight": "2900 gr",
      "displaySize": "27 pulgadas",
      "resolution": "Full HD (1920 x 1080)"
    }
  },
  {
    "id": "orange-orange-mkp000439101545",
    "sku": "ORANGE_MKP000439101545",
    "title": "MSI Monitor PRO MP275Q 27\"",
    "brand": "MSI",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.orange.es/dispositivos/monitores/msi/monitor-pro-mp275q/MKP000439101545.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Tamaño de pantalla perfecto de 27 Pulgadas con resolución WQHD (1440p) para el espacio de trabajo de programación, codificación y diseño de sitios web. La pantalla con certificación TUV…",
    "attributes": {
      "brand": "MSI",
      "productName": "MSI Monitor PRO MP275Q 27\"",
      "ean": "1234391015452",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Tamaño de pantalla perfecto de 27 Pulgadas con resolución WQHD (1440p) para el espacio de trabajo de programación, codificación y diseño de sitios web. La pantalla con certificación TUV…",
      "connectivity": "HDMI",
      "weight": "5.500 gr",
      "displaySize": "27 pulgadas",
      "resolution": "QHD (2560 x 1440)",
      "compatibility": "PC, Mac, PS5, PS4, Xbox, Móvil, Portátil"
    }
  },
  {
    "id": "orange-orange-mkp000433358152",
    "sku": "ORANGE_MKP000433358152",
    "title": "Samsung Monitor Curvo 34\" Viefinity S65UC",
    "brand": "Samsung",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.orange.es/dispositivos/monitores/samsung/monitor-curvo-34-viefinity-s65uc/MKP000433358152.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Resolución Ultra WQHD Pantalla curva 1000R Mayor precisión y detalle de color HDR10 Conectividad USB-C Samsung Monitor Curvo 34\" Viefinity S65UC Dimensiones Peso del dispositivo (gr) 800…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Monitor Curvo 34\" Viefinity S65UC",
      "ean": "1234333581526",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Resolución Ultra WQHD Pantalla curva 1000R Mayor precisión y detalle de color HDR10 Conectividad USB-C Samsung Monitor Curvo 34\" Viefinity S65UC Dimensiones Peso del dispositivo (gr) 800…",
      "connectivity": "HDMI",
      "weight": "8000 gr",
      "displaySize": "34 pulgadas",
      "resolution": "QHD (2560 x 1440)"
    }
  },
  {
    "id": "orange-orange-mkp000435586633",
    "sku": "ORANGE_MKP000435586633",
    "title": "Samsung Monitor ViewFinity S6 S60UD QHD",
    "brand": "Samsung",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.orange.es/dispositivos/monitores/samsung/monitor-viewfinity-s6-s60ud-qhd/MKP000435586633.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Explora el futuro con el Samsung ViewFinity S6 S60UD, una pantalla diseñada para redefinir tu experiencia visual. Este monitor no es solo un dispositivo, es una puerta de acceso a mundos…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Monitor ViewFinity S6 S60UD QHD",
      "ean": "1234355866335",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Explora el futuro con el Samsung ViewFinity S6 S60UD, una pantalla diseñada para redefinir tu experiencia visual. Este monitor no es solo un dispositivo, es una puerta de acceso a mundos…",
      "connectivity": "HDMI",
      "weight": "6.100 gr",
      "displaySize": "27 pulgadas",
      "resolution": "QHD (2560 x 1440)"
    }
  },
  {
    "id": "orange-orange-3004070",
    "sku": "ORANGE_3004070",
    "title": "Apple iPhone 17 con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/apple/iphone-17-256gb-morado/3004070.html",
    "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 con 5G",
      "ean": "1233004070710",
      "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "177gr",
      "dimensions": "149.6 x 71.5 x 8mm",
      "storage": "256GB",
      "displaySize": "6.3p",
      "resolution": "2622 x 1206",
      "panelTechnology": "Super Retina XDR OLED",
      "cameraResolution": "48Mpx",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3004067",
    "sku": "ORANGE_3004067",
    "title": "Apple iPhone 17 con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/apple/iphone-17-256gb-negro/3004067.html",
    "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 con 5G",
      "ean": "1233004067109",
      "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "177gr",
      "dimensions": "149.6 x 71.5 x 8mm",
      "storage": "256GB",
      "displaySize": "6.3p",
      "resolution": "2622 x 1206",
      "panelTechnology": "Super Retina XDR OLED",
      "cameraResolution": "48Mpx",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3004083",
    "sku": "ORANGE_3004083",
    "title": "Apple iPhone 17 Pro con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/apple/iphone-17-pro-256gb-azul/3004083.html",
    "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 Pro con 5G",
      "ean": "1233004083109",
      "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "204gr",
      "dimensions": "150 x 71.9 x 8.3mm",
      "storage": "256GB",
      "displaySize": "6.3p",
      "resolution": "2.622 x 1.206",
      "panelTechnology": "Super Retina XDR OLED",
      "cameraResolution": "48Mpx",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3004084",
    "sku": "ORANGE_3004084",
    "title": "Apple iPhone 17 Pro con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/apple/iphone-17-pro-256gb-naranja/3004084.html",
    "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 Pro con 5G",
      "ean": "1233004084359",
      "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "204gr",
      "dimensions": "150 x 71.9 x 8.3mm",
      "storage": "256GB",
      "displaySize": "6.3p",
      "resolution": "2.622 x 1.206",
      "panelTechnology": "Super Retina XDR OLED",
      "cameraResolution": "48Mpx",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3004090",
    "sku": "ORANGE_3004090",
    "title": "Apple iPhone 17 Pro Max con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/apple/iphone-17-pro-max-256gb-azul/3004090.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Compramos tu móvil El iPhone 17 Pro Max redefine la experiencia Pro con un diseño renovado de la isla de cámaras y una pantalla aún más grande que ofrece la máxima inmersión. Su panel Su…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 Pro Max con 5G",
      "ean": "1233004090213",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Compramos tu móvil El iPhone 17 Pro Max redefine la experiencia Pro con un diseño renovado de la isla de cámaras y una pantalla aún más grande que ofrece la máxima inmersión. Su panel Su…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "231gr",
      "dimensions": "163.4 x 78 x 8.8mm",
      "storage": "256GB",
      "displaySize": "6.9p",
      "resolution": "2.868 x 1.320",
      "panelTechnology": "Super Retina XDR OLED",
      "cameraResolution": "48Mpx",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3004091",
    "sku": "ORANGE_3004091",
    "title": "Apple iPhone 17 Pro Max con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/apple/iphone-17-pro-max-256gb-naranja/3004091.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Compramos tu móvil El iPhone 17 Pro Max redefine la experiencia Pro con un diseño renovado de la isla de cámaras y una pantalla aún más grande que ofrece la máxima inmersión. Su panel Su…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 Pro Max con 5G",
      "ean": "1233004091159",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Compramos tu móvil El iPhone 17 Pro Max redefine la experiencia Pro con un diseño renovado de la isla de cámaras y una pantalla aún más grande que ofrece la máxima inmersión. Su panel Su…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "231gr",
      "dimensions": "163.4 x 78 x 8.8mm",
      "storage": "256GB",
      "displaySize": "6.9p",
      "resolution": "2.868 x 1.320",
      "panelTechnology": "Super Retina XDR OLED",
      "cameraResolution": "48Mpx",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3004277",
    "sku": "ORANGE_3004277",
    "title": "Apple iPhone 17e con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/apple/iphone-17e-256gb-negro/3004277.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPhone 17e 256 GB con 5G Ficha técnica Abrir ventana modal: Información sobre el cargador 4.5 - 26 W USB PD Este producto se vende sin cargador incluido. La pote…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17e con 5G",
      "ean": "1233004277317",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPhone 17e 256 GB con 5G Ficha técnica Abrir ventana modal: Información sobre el cargador 4.5 - 26 W USB PD Este producto se vende sin cargador incluido. La pote…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "169gr",
      "dimensions": "146.7 x 71.5 x 7.8mm",
      "storage": "256GB",
      "displaySize": "6.1p",
      "resolution": "2532 x 1170",
      "panelTechnology": "Super Retina XDR OLED",
      "cameraResolution": "48Mpx",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3004279",
    "sku": "ORANGE_3004279",
    "title": "Apple iPhone 17e con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/apple/iphone-17e-256gb-rosa/3004279.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPhone 17e 256 GB con 5G Ficha técnica Abrir ventana modal: Información sobre el cargador 4.5 - 26 W USB PD Este producto se vende sin cargador incluido. La pote…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17e con 5G",
      "ean": "1233004279236",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPhone 17e 256 GB con 5G Ficha técnica Abrir ventana modal: Información sobre el cargador 4.5 - 26 W USB PD Este producto se vende sin cargador incluido. La pote…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "169gr",
      "dimensions": "146.7 x 71.5 x 7.8mm",
      "storage": "256GB",
      "displaySize": "6.1p",
      "resolution": "2532 x 1170",
      "panelTechnology": "Super Retina XDR OLED",
      "cameraResolution": "48Mpx",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3711297",
    "sku": "ORANGE_3711297",
    "title": "Apple iPad Air M4 Wifi 11",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.orange.es/dispositivos/tablets/apple/ipad-air-m4-wifi-11-128gb-azul/3711297.html",
    "description": "El iPad Air de 11 pulgadas ha sido diseñado para sacar el máximo partido a Apple Intelligence y ahora incorpora la potencia del chip M4 de Apple, ofreciendo un rendimiento aún más avanzado para todo tipo de tareas. Su espectacular pantalla Liquid Retina propor…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Air M4 Wifi 11",
      "ean": "1233711297783",
      "description": "El iPad Air de 11 pulgadas ha sido diseñado para sacar el máximo partido a Apple Intelligence y ahora incorpora la potencia del chip M4 de Apple, ofreciendo un rendimiento aún más avanzado para todo tipo de tareas. Su espectacular pantalla Liquid Retina propor…",
      "bluetooth": "Yes",
      "weight": "464gr",
      "dimensions": "247.6 x 178.5 x 6.1mm",
      "storage": "128GB",
      "ram": "12GB",
      "displaySize": "11p",
      "resolution": "1640 x 2360",
      "panelTechnology": "Liquid Retina IPS LCD",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3711299",
    "sku": "ORANGE_3711299",
    "title": "Apple iPad Air M4 Wifi 13",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.orange.es/dispositivos/tablets/apple/ipad-air-m4-wifi-13-128gb-gris/3711299.html",
    "description": "El iPad Air de 13 pulgadas ha sido diseñado para sacar el máximo partido a Apple Intelligence y ahora incorpora la potencia del chip M4 de Apple, ofreciendo un rendimiento aún más avanzado para todo tipo de tareas. Su espectacular pantalla Liquid Retina propor…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Air M4 Wifi 13",
      "ean": "1233711299329",
      "description": "El iPad Air de 13 pulgadas ha sido diseñado para sacar el máximo partido a Apple Intelligence y ahora incorpora la potencia del chip M4 de Apple, ofreciendo un rendimiento aún más avanzado para todo tipo de tareas. Su espectacular pantalla Liquid Retina propor…",
      "bluetooth": "Yes",
      "weight": "616gr",
      "dimensions": "280.6 x 214.9 x 6.1mm",
      "storage": "128GB",
      "ram": "12GB",
      "displaySize": "13p",
      "resolution": "2048 x 2732",
      "panelTechnology": "Liquid Retina IPS LCD",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3711223",
    "sku": "ORANGE_3711223",
    "title": "Apple iPad Pro M5",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.orange.es/dispositivos/tablets/apple/ipad-pro-m5-11-256gb-wifi-negro/3711223.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Pro M5 11 256 GB Wifi Abrir ventana modal: Información sobre el cargador 15 -45 W USB PD Este producto se vende sin cargador incluido. La potencia del carga…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Pro M5",
      "ean": "1233711223010",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Pro M5 11 256 GB Wifi Abrir ventana modal: Información sobre el cargador 15 -45 W USB PD Este producto se vende sin cargador incluido. La potencia del carga…",
      "bluetooth": "Yes",
      "weight": "444gr",
      "dimensions": "249.7 x 177.5 x 5.3mm",
      "storage": "256GB",
      "ram": "8GB",
      "displaySize": "11p",
      "resolution": "1668 x 2420",
      "panelTechnology": "Ultra Retina Tandem OLED",
      "batteryTechnology": "Li-Po"
    }
  },
  {
    "id": "orange-orange-3711018",
    "sku": "ORANGE_3711018",
    "title": "Apple iPad Wifi 11 2025",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.orange.es/dispositivos/tablets/apple/ipad-wifi-11-2025-128gb-plata/3711018.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Wifi 11 2025 128 GB Ficha técnica Abrir ventana modal: Información sobre el cargador 15 -45 W USB PD Este producto se vende sin cargador incluido. La potenc…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Wifi 11 2025",
      "ean": "1233711018135",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Wifi 11 2025 128 GB Ficha técnica Abrir ventana modal: Información sobre el cargador 15 -45 W USB PD Este producto se vende sin cargador incluido. La potenc…",
      "bluetooth": "Yes",
      "weight": "477gr",
      "dimensions": "248.6 x 179.5 x 7 mmmm",
      "storage": "128GB",
      "displaySize": "11p",
      "resolution": "1640 x 2360",
      "panelTechnology": "Liquid Retina IPS LCD",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3003898",
    "sku": "ORANGE_3003898",
    "title": "Apple iPad Wifi + Cellular 11 2025",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.orange.es/dispositivos/tablets/apple/ipad-wifi-cellular-11-2025-128gb-plata/3003898.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Wifi+Cellular 11 2025 128 GB Abrir ventana modal: Información sobre el cargador 15 -45 W USB PD Este producto se vende sin cargador incluido. La potencia de…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Wifi + Cellular 11 2025",
      "ean": "1233003898131",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Wifi+Cellular 11 2025 128 GB Abrir ventana modal: Información sobre el cargador 15 -45 W USB PD Este producto se vende sin cargador incluido. La potencia de…",
      "bluetooth": "Yes",
      "weight": "481gr",
      "dimensions": "248.6 x 179.5 x 7 mmmm",
      "storage": "128GB",
      "displaySize": "11p",
      "resolution": "1640 x 2360",
      "panelTechnology": "Liquid Retina IPS LCD",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3711229",
    "sku": "ORANGE_3711229",
    "title": "Lenovo Idea Tab 11 256 GB",
    "brand": "Lenovo",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.orange.es/dispositivos/tablets/lenovo/idea-tab-11-wifi-256gb-gris/3711229.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Lenovo Idea Tab 11 Wifi es una tablet versátil y ligera diseñada para ofrecer un rendimiento equilibrado tanto en entretenimiento como en productividad. Incorpora un procesador MediaTek…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Idea Tab 11 256 GB",
      "ean": "1233711229340",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Lenovo Idea Tab 11 Wifi es una tablet versátil y ligera diseñada para ofrecer un rendimiento equilibrado tanto en entretenimiento como en productividad. Incorpora un procesador MediaTek…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "480gr",
      "dimensions": "254.59 x 166.15 x 6.99mm",
      "storage": "256GB",
      "ram": "8GB",
      "displaySize": "11p",
      "panelTechnology": "IPS LCD",
      "batteryTechnology": "Li-Ion"
    }
  },
  {
    "id": "orange-orange-3711198",
    "sku": "ORANGE_3711198",
    "title": "Samsung Galaxy Tab A11+ Wifi",
    "brand": "Samsung",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.orange.es/dispositivos/tablets/samsung/galaxy-tab-a11-plus-wifi-128gb-gris/3711198.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Samsung Samsung Galaxy Tab A11 Plus Wifi Abrir ventana modal: Información sobre el cargador 15 - 25 W USB PD Este producto se vende sin cargador incluido. La potencia…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy Tab A11+ Wifi",
      "ean": "1233711198141",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Samsung Samsung Galaxy Tab A11 Plus Wifi Abrir ventana modal: Información sobre el cargador 15 - 25 W USB PD Este producto se vende sin cargador incluido. La potencia…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "480gr",
      "dimensions": "255,3 × 168,7 × 6,9mm",
      "storage": "128GB",
      "ram": "6GB",
      "displaySize": "11p",
      "resolution": "1920 x 1200",
      "panelTechnology": "TFT LCD",
      "batteryTechnology": "Li-Po"
    }
  },
  {
    "id": "orange-orange-3711109",
    "sku": "ORANGE_3711109",
    "title": "Samsung Galaxy Tab S11 Ultra",
    "brand": "Samsung",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.orange.es/dispositivos/tablets/samsung/galaxy-tab-s11-ultra-wifi-256gb/3711109.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Samsung Galaxy Tab S11 Ultra se presenta como una de las tablets más potentes y sofisticadas del mercado. Con un diseño extremadamente fino de tan solo 5,1 mm y un peso de 695 gramos, co…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy Tab S11 Ultra",
      "ean": "1233711109147",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Samsung Galaxy Tab S11 Ultra se presenta como una de las tablets más potentes y sofisticadas del mercado. Con un diseño extremadamente fino de tan solo 5,1 mm y un peso de 695 gramos, co…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "695gr",
      "dimensions": "208.5 x 326.3 x 5.1mm",
      "storage": "256GB",
      "ram": "12GB",
      "displaySize": "14.6p",
      "resolution": "2960 x 1848",
      "panelTechnology": "Dynamic AMOLED 2X",
      "batteryTechnology": "Li-Po"
    }
  },
  {
    "id": "orange-orange-3711230",
    "sku": "ORANGE_3711230",
    "title": "HP Laptop AMD Ryzen 5",
    "brand": "HP",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.orange.es/dispositivos/portatiles/hp/laptop-15-amd-ryzen5-16gb-1tb-gris/3711230.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El HP Laptop AMD Ryzen 5 16 GB + 1 TB es un ordenador portátil de 15,6 pulgadas diseñado para trabajar y estudiar con comodidad, combinando un rendimiento fiable con un diseño ligero y e…",
    "attributes": {
      "brand": "HP",
      "productName": "HP Laptop AMD Ryzen 5",
      "ean": "1233711230100",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El HP Laptop AMD Ryzen 5 16 GB + 1 TB es un ordenador portátil de 15,6 pulgadas diseñado para trabajar y estudiar con comodidad, combinando un rendimiento fiable con un diseño ligero y e…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "1670gr",
      "dimensions": "358.5 x 242 x 17.9mm",
      "storage": "1000GB",
      "ram": "16GB",
      "displaySize": "15.6p",
      "resolution": "1920 x 1080",
      "panelTechnology": "FHD",
      "batteryTechnology": "Li-ion"
    }
  },
  {
    "id": "orange-orange-3711104",
    "sku": "ORANGE_3711104",
    "title": "Lenovo Ideapad 3 13420H",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.orange.es/dispositivos/portatiles/lenovo/ideapad-3-13420h-gris/3711104.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Lenovo IdeaPad 3 13ª Gen i5 13420H es un portátil equilibrado y eficiente, ideal para productividad, estudios y entretenimiento. Equipado con un procesador Intel Core i5-13420H de 8 núcl…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Ideapad 3 13420H",
      "ean": "1233711104951",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Lenovo IdeaPad 3 13ª Gen i5 13420H es un portátil equilibrado y eficiente, ideal para productividad, estudios y entretenimiento. Equipado con un procesador Intel Core i5-13420H de 8 núcl…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "1620gr",
      "dimensions": "359.3 x 235 x 17.9mm",
      "storage": "512GB",
      "ram": "16GB",
      "displaySize": "15.6p",
      "resolution": "1920 x 1080",
      "panelTechnology": "IPS",
      "batteryTechnology": "Li-Po"
    }
  },
  {
    "id": "orange-orange-3711237",
    "sku": "ORANGE_3711237",
    "title": "Lenovo Ideapad 3 i3",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.orange.es/dispositivos/portatiles/lenovo/ideapad-3-i3-gris/3711237.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Lenovo IdeaPad 3 i3 es un portátil diseñado para ofrecer un rendimiento equilibrado y fiable en el día a día, combinando agilidad en las tareas habituales con un diseño ligero y práctico…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Ideapad 3 i3",
      "ean": "1233711237215",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor Lenovo IdeaPad 3 i3 es un portátil diseñado para ofrecer un rendimiento equilibrado y fiable en el día a día, combinando agilidad en las tareas habituales con un diseño ligero y práctico…",
      "bluetooth": "Yes",
      "weight": "1550gr",
      "dimensions": "362.2 x 253.4 x 19.9mm",
      "storage": "256GB",
      "ram": "8GB",
      "displaySize": "15.6p",
      "resolution": "1920 x 1080",
      "panelTechnology": "LED",
      "batteryTechnology": "Li-Po"
    }
  },
  {
    "id": "orange-orange-3711105",
    "sku": "ORANGE_3711105",
    "title": "Lenovo IdeaPad 5 13620H",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.orange.es/dispositivos/portatiles/lenovo/ideapad-5-i7-13620h-16gb-1tb-gris/3711105.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El portátil Lenovo IdeaPad 5 13620H 13Gen incorpora el potente procesador Intel Core i7-13620H de 10 núcleos (6 de alto rendimiento y 4 de eficiencia), capaz de alcanzar hasta 4,9 GHz, a…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo IdeaPad 5 13620H",
      "ean": "1233711105453",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El portátil Lenovo IdeaPad 5 13620H 13Gen incorpora el potente procesador Intel Core i7-13620H de 10 núcleos (6 de alto rendimiento y 4 de eficiencia), capaz de alcanzar hasta 4,9 GHz, a…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "1810gr",
      "dimensions": "356.5 x 250.6 x 16.9mm",
      "storage": "1000GB",
      "ram": "16GB",
      "displaySize": "16p",
      "resolution": "1920 x 1200",
      "panelTechnology": "IPS",
      "batteryTechnology": "Li-Po"
    }
  },
  {
    "id": "orange-orange-3711261",
    "sku": "ORANGE_3711261",
    "title": "Lenovo Portátil ThinkBook 14 iULTRA5",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.orange.es/dispositivos/portatiles/lenovo/portatil-thinkbook-iultra5-512gb-gris/3711261.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El Lenovo ThinkBook 14 iULTRA5 es un portátil profesional diseñado para ofrecer un equilibrio perfecto entre rendimiento, portabilidad y seguridad, ideal para entornos de trabajo exigent…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Portátil ThinkBook 14 iULTRA5",
      "ean": "1233711261876",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El Lenovo ThinkBook 14 iULTRA5 es un portátil profesional diseñado para ofrecer un equilibrio perfecto entre rendimiento, portabilidad y seguridad, ideal para entornos de trabajo exigent…",
      "usbC": "Yes",
      "weight": "1360gr",
      "dimensions": "313.5 x 224 x 17.5mm",
      "storage": "512GB",
      "displaySize": "14p",
      "resolution": "1920 x 1200",
      "panelTechnology": "IPS"
    }
  },
  {
    "id": "orange-orange-3711262",
    "sku": "ORANGE_3711262",
    "title": "Lenovo Portátil ThinkPad X1 iULTRA7",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.orange.es/dispositivos/portatiles/lenovo/portatil-thinkpad-x1-iultra7-1tb-gris/3711262.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El Lenovo ThinkPad X1 2-in-1 iUltra 7 es un portátil convertible de alto rendimiento diseñado para profesionales que buscan máxima movilidad, potencia y versatilidad en un solo dispositi…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Portátil ThinkPad X1 iULTRA7",
      "ean": "1233711262125",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El Lenovo ThinkPad X1 2-in-1 iUltra 7 es un portátil convertible de alto rendimiento diseñado para profesionales que buscan máxima movilidad, potencia y versatilidad en un solo dispositi…",
      "usbC": "Yes",
      "weight": "1220gr",
      "dimensions": "312.80 x 217.65 x 16.19mm",
      "storage": "1000GB",
      "displaySize": "14p",
      "resolution": "1920 x 1200",
      "panelTechnology": "IPS"
    }
  },
  {
    "id": "orange-orange-3710960",
    "sku": "ORANGE_3710960",
    "title": "LG gram Book 15U50T",
    "brand": "LG",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.orange.es/dispositivos/portatiles/lg/gram-book-15u50t-i5-16gb-512gb-gris/3710960.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El LG gram Book 15U50T es un portátil diseñado para ofrecer portabilidad, rendimiento y versatilidad. Su estructura ligera y resistente está fabricada con un chasis de composite de alta…",
    "attributes": {
      "brand": "LG",
      "productName": "LG gram Book 15U50T",
      "ean": "1233710960657",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El LG gram Book 15U50T es un portátil diseñado para ofrecer portabilidad, rendimiento y versatilidad. Su estructura ligera y resistente está fabricada con un chasis de composite de alta…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "1690gr",
      "dimensions": "359.8 x 237.8 x 18.9mm",
      "storage": "512GB",
      "ram": "16GB",
      "displaySize": "15.6p",
      "resolution": "1920 x 1080",
      "panelTechnology": "IPS LCD",
      "batteryTechnology": "Li-Po"
    }
  },
  {
    "id": "orange-orange-3240734",
    "sku": "ORANGE_3240734",
    "title": "Samsung Galaxy Book4 Edge 15 Office 365",
    "brand": "Samsung",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.orange.es/dispositivos/portatiles/samsung/galaxy-book4-edge-15-qc-512gb-office365-gris/3240734.html",
    "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El Samsung Galaxy Book4 Edge 15 QC 8CORE 512 GB con Office 365 es un portátil de última generación que combina potencia, ligereza y herramientas de productividad avanzadas. Integra el pr…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy Book4 Edge 15 Office 365",
      "ean": "1233240734612",
      "description": "Información detallada Descripción Sobre el dispositivo Opiniones Vendedor El Samsung Galaxy Book4 Edge 15 QC 8CORE 512 GB con Office 365 es un portátil de última generación que combina potencia, ligereza y herramientas de productividad avanzadas. Integra el pr…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "1500gr",
      "dimensions": "356,6 × 229,7 × 15,0mm",
      "storage": "512GB",
      "displaySize": "15.6p",
      "resolution": "1920 x 1080",
      "panelTechnology": "FHD LED Display"
    }
  },
  {
    "id": "orange-orange-3004222",
    "sku": "ORANGE_3004222",
    "title": "Samsung Galaxy S26 5G",
    "brand": "Samsung",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/samsung/galaxy-s26-5g-256gb-morado/3004222.html",
    "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy S26 5G",
      "ean": "1233004222140",
      "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "167gr",
      "dimensions": "149,6 x 71,7 x 7,2mm",
      "storage": "256GB",
      "ram": "12GB",
      "displaySize": "6.3p",
      "resolution": "2340 x 1080",
      "panelTechnology": "Dynamic AMOLED",
      "cameraResolution": "50Mpx",
      "batteryCapacity": "4300mAh"
    }
  },
  {
    "id": "orange-orange-3004223",
    "sku": "ORANGE_3004223",
    "title": "Samsung Galaxy S26 5G",
    "brand": "Samsung",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.orange.es/dispositivos/moviles/samsung/galaxy-s26-5g-256gb-negro/3004223.html",
    "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy S26 5G",
      "ean": "1233004223109",
      "description": "Vende tu móvil usado con Orange ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://compramostumovil.orange.es elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu…",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "167gr",
      "dimensions": "149,6 x 71,7 x 7,2mm",
      "storage": "256GB",
      "ram": "12GB",
      "displaySize": "6.3p",
      "resolution": "2340 x 1080",
      "panelTechnology": "Dynamic AMOLED",
      "cameraResolution": "50Mpx",
      "batteryCapacity": "4300mAh"
    }
  }
] satisfies OrangeImportedRow[]

function buildOrangeImportedProducts(rows: readonly OrangeImportedRow[]): ProductRecord[] {
  return rows.map((row): ProductRecord => {
    const extractedFields = Object.fromEntries(
      Object.entries(row.attributes).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0),
    ) as EvidenceRecord["extractedFields"]

    const warnings = [
      row.attributes.ean ? null : "EAN missing from Orange import",
      row.description ? null : "Description missing from Orange import",
    ].filter((warning): warning is string => Boolean(warning))

    return {
      id: row.id,
      miraklProductId: row.sku,
      title: row.title,
      brand: row.brand,
      categoryPath: [...row.categoryPath],
      schemaId: row.schemaId,
      listingStatus: warnings.length > 0 ? "NEEDS_ENRICHMENT" : "READY_FOR_REVIEW",
      qualityScore: 0,
      scoreBand: "red",
      baselineDescription: row.description,
      warnings,
      baselineAttributes: row.attributes,
      bestEvidenceByField: extractedFields,
      evidence: [
        {
          id: `ev-${row.id}-orange-source`,
          productId: row.id,
          aggregatorId: "orange-source-catalog",
          sourceName: "Orange source catalog",
          sourceType: "partner_feed",
          sourceUrl: row.sourceUrl,
          title: `${row.title} imported Orange catalog record`,
          summary: "Imported Orange device catalog record used as the electronics source catalog baseline.",
          extractedFields,
          capturedAt,
          confidence: "high",
        },
      ],
      candidates: [],
    }
  })
}

const orangeImportedProducts = buildOrangeImportedProducts(orangeImportedRows)

const baseProducts: ProductRecord[] = [
  {
    id: "freeclip-2",
    miraklProductId: "MIRAKL_3711247",
    title: "Huawei FreeClip 2",
    brand: null,
    categoryPath: ["Audio", "Headphones & Earbuds"],
    schemaId: "schema-headphones-earbuds",
    listingStatus: "NEEDS_ENRICHMENT",
    qualityScore: 0,
    scoreBand: "red",
    baselineDescription: heroBaselineAttributes.description ?? "",
    warnings: ["Brand is required", "Description contains storefront noise", "EAN requires review"],
    baselineAttributes: heroBaselineAttributes,
    bestEvidenceByField: heroEvidenceFields,
    evidence: heroEvidence,
    candidates: heroCandidates,
  },
  {
    id: "galaxy-a55",
    miraklProductId: "MIRAKL_1002451",
    title: "Samsung Galaxy A55",
    brand: "Samsung",
    categoryPath: ["Phones", "Smartphones"],
    schemaId: "schema-smartphones",
    listingStatus: "READY_FOR_REVIEW",
    qualityScore: 0,
    scoreBand: "yellow",
    baselineDescription: "Solid baseline phone description with missing camera detail and inconsistent storage formatting.",
    warnings: ["Camera resolution missing", "Storage field formatting is inconsistent"],
    baselineAttributes: {
      brand: "Samsung",
      model: "Galaxy A55",
      storage: "128GB",
      ram: "8 GB",
      displaySize: "6.6 in",
      description: "Balanced mid-range smartphone with AMOLED display and all-day battery life.",
    },
    bestEvidenceByField: {
      cameraResolution: "50 MP",
      storage: "128 GB",
      ram: "8 GB",
    },
    evidence: [],
    candidates: [],
  },
  {
    id: "lg-oled-c4-55",
    miraklProductId: "MIRAKL_2045780",
    title: "LG OLED C4 55",
    brand: "LG",
    categoryPath: ["TV & Home cinema", "Televisions"],
    schemaId: "schema-televisions",
    listingStatus: "READY_FOR_REVIEW",
    qualityScore: 0,
    scoreBand: "yellow",
    baselineDescription: "Strong baseline TV description missing refresh-rate detail.",
    warnings: ["Refresh rate missing"],
    baselineAttributes: {
      brand: "LG",
      model: "OLED C4 55",
      displaySize: "55 in",
      resolution: "4K",
      panelTechnology: "OLED",
      description: "Premium OLED television with cinematic contrast and smart TV features.",
    },
    bestEvidenceByField: {
      refreshRate: "120 Hz",
      hdmiPorts: "4 ports",
    },
    evidence: [],
    candidates: [],
  },
  {
    id: "sony-wh1000xm5",
    miraklProductId: "MIRAKL_3801122",
    title: "Sony WH-1000XM5",
    brand: "Sony",
    categoryPath: ["Audio", "Headphones & Earbuds"],
    schemaId: "schema-headphones-earbuds",
    listingStatus: "READY_FOR_REVIEW",
    qualityScore: 0,
    scoreBand: "blue",
    baselineDescription: "Baseline description is usable but missing microphone details.",
    warnings: ["Microphone detail missing"],
    baselineAttributes: {
      brand: "Sony",
      productName: "WH-1000XM5",
      connectivity: "Bluetooth",
      weight: "250 g",
      description: "Over-ear wireless headphones with active noise cancellation.",
    },
    bestEvidenceByField: {
      noiseReduction: "Active noise cancellation",
      microphone: "Integrated beamforming microphone array",
    },
    evidence: [],
    candidates: [],
  },
  {
    id: "redmi-pad-pro",
    miraklProductId: "MIRAKL_5003407",
    title: "Xiaomi Redmi Pad Pro",
    brand: "Xiaomi",
    categoryPath: ["Tablets", "Android tablets"],
    schemaId: "schema-tablets",
    listingStatus: "NEEDS_ENRICHMENT",
    qualityScore: 0,
    scoreBand: "yellow",
    baselineDescription: "Tablet record is serviceable but missing stylus compatibility and battery detail.",
    warnings: ["Stylus support missing", "Battery capacity missing"],
    baselineAttributes: {
      brand: "Xiaomi",
      model: "Redmi Pad Pro",
      displaySize: "12.1 in",
      storage: "256 GB",
      description: "Large Android tablet for media and productivity.",
    },
    bestEvidenceByField: {
      stylusSupport: "Yes",
      batteryCapacity: "10000 mAh",
    },
    evidence: [],
    candidates: [],
  },
]

baseProducts.push(...orangeImportedProducts)

for (const product of baseProducts) {
  const scored = qualityScore(product)
  product.qualityScore = scored.score
  product.scoreBand = scored.band
}

export const products: ProductRecord[] = structuredClone(baseProducts)
export const mockContractMetadata = {
  version: MOCK_DOMAIN_CONTRACT_VERSION,
  stateOwnership: MOCK_STATE_OWNERSHIP,
}

export const heroProductId = "freeclip-2"
export const heroProduct = products.find((product) => product.id === heroProductId)!
