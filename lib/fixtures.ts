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
    baseUrl: "https://consumer.huawei.com",
    authorityScore: 95,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["branding", "core-specs", "descriptions"],
    sampleDomains: [
      "apple.com",
      "support.apple.com",
      "samsung.com",
      "consumer.huawei.com",
      "sony.com",
      "lg.com",
      "mi.com",
      "lenovo.com",
      "psref.lenovo.com",
      "dell.com",
      "hp.com",
      "asus.com",
      "acer.com",
      "garmin.com",
      "bose.com",
      "sennheiser-hearing.com",
    ],
    description: "Highest-confidence source for branding, core specifications, and canonical product messaging.",
    confidencePolicy: "Use as the primary source for branding and technical facts published by the vendor.",
  },
  {
    id: "trusted-retailer",
    name: "Trusted retailer",
    type: "retailer",
    baseUrl: "https://www.bestbuy.com",
    authorityScore: 70,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["commercial-copy", "visible-specs", "availability"],
    sampleDomains: [
      "bestbuy.com",
      "bhphotovideo.com",
      "currys.co.uk",
      "mediamarkt.es",
      "mediamarkt.de",
      "fnac.com",
      "elcorteingles.es",
      "pccomponentes.com",
      "coolblue.nl",
      "saturn.de",
      "boulanger.com",
      "adorama.com",
      "abt.com",
      "microcenter.com",
      "crutchfield.com",
    ],
    description: "Supporting source for visible specs, merchandising language, and package details.",
    confidencePolicy: "Use as corroborating evidence for visible specifications and merchandising details.",
  },
  {
    id: "spec-database",
    name: "Specification database",
    type: "spec_database",
    baseUrl: "https://www.rtings.com",
    authorityScore: 85,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["technical-fields", "dimensions", "battery"],
    sampleDomains: [
      "gsmarena.com",
      "displayspecifications.com",
      "notebookcheck.net",
      "rtings.com",
      "kimovil.com",
      "dxomark.com",
      "techpowerup.com",
      "soundguys.com",
      "displayninja.com",
      "cameradecision.com",
      "versus.com",
      "nanoreview.net",
    ],
    description: "Structured technical source for dimensions, battery, and connectivity fields.",
    confidencePolicy: "Use for structured technical fields when corroborated by manufacturer or retailer evidence.",
  },
  {
    id: "marketplace-listing",
    name: "Marketplace listing",
    type: "marketplace",
    baseUrl: "https://www.amazon.com",
    authorityScore: 45,
    defaultConfidence: "low",
    enabled: true,
    coverageTags: ["corroboration", "title-variants"],
    sampleDomains: [
      "amazon.com",
      "amazon.es",
      "ebay.com",
      "aliexpress.com",
      "newegg.com",
      "backmarket.com",
      "rakuten.com",
      "walmart.com",
      "cdiscount.com",
      "bol.com",
      "mercadolibre.com",
      "onbuy.com",
    ],
    description: "Low-authority corroborating source for title variants and merchandising claims.",
    confidencePolicy: "Use only as supporting evidence, never as sole proof for canonical fields.",
  },
  {
    id: "internal-reference",
    name: "Internal reference library",
    type: "internal_reference",
    baseUrl: "https://www.atlassian.net",
    authorityScore: 80,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["operator-notes", "internal-rules"],
    sampleDomains: [
      "atlassian.net",
      "confluence.atlassian.com",
      "sharepoint.com",
      "docs.google.com",
      "notion.site",
      "box.com",
      "dropbox.com",
      "monday.com",
      "airtable.com",
      "miro.com",
    ],
    description: "Internal operator guidance for policy-based review and export policies.",
    confidencePolicy: "Use for internal review notes and policy-aligned guidance only.",
  },
  {
    id: "source-catalog",
    name: "Imported source catalog",
    type: "partner_feed",
    baseUrl: "https://www.mediamarkt.es",
    authorityScore: 88,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["source-import", "mirakl-source", "device-catalog"],
    sampleDomains: [
      "mediamarkt.es",
      "bestbuy.com",
      "bhphotovideo.com",
      "currys.co.uk",
      "fnac.com",
      "pccomponentes.com",
      "coolblue.nl",
      "boulanger.com",
      "elcorteingles.es",
      "saturn.de",
    ],
    description: "Imported electronics catalog artifacts used as source rows for enrichment examples.",
    confidencePolicy: "Use as the imported catalog baseline for device titles, identifiers, and visible product specs.",
  },
  {
    id: "apple-official",
    name: "Apple official",
    type: "manufacturer",
    baseUrl: "https://www.apple.com",
    authorityScore: 96,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["manufacturer-specs", "support-docs", "device-identifiers"],
    sampleDomains: ["apple.com", "support.apple.com", "developer.apple.com", "manuals.info.apple.com", "locate.apple.com", "checkcoverage.apple.com", "getsupport.apple.com", "discussions.apple.com", "apps.apple.com", "icloud.com"],
    description: "Official Apple product, support, and technical reference surfaces.",
    confidencePolicy: "Use as canonical evidence for Apple device names, compatibility, software support, and published product specifications.",
  },
  {
    id: "samsung-official",
    name: "Samsung official",
    type: "manufacturer",
    baseUrl: "https://www.samsung.com",
    authorityScore: 94,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["manufacturer-specs", "manuals", "support"],
    sampleDomains: ["samsung.com", "samsung.com/us", "samsung.com/uk", "samsung.com/es", "samsung.com/de", "samsung.com/fr", "samsung.com/support", "news.samsung.com", "semiconductor.samsung.com", "samsungparts.com"],
    description: "Official Samsung product, support, and manual surfaces.",
    confidencePolicy: "Use as canonical evidence for Samsung model naming, specifications, manuals, and product support facts.",
  },
  {
    id: "lenovo-psref",
    name: "Lenovo PSREF",
    type: "manufacturer",
    baseUrl: "https://psref.lenovo.com",
    authorityScore: 92,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["manufacturer-specs", "laptops", "configuration-matrix"],
    sampleDomains: ["psref.lenovo.com", "lenovo.com", "support.lenovo.com", "pcsupport.lenovo.com", "download.lenovo.com", "forums.lenovo.com", "lenovo.com/us", "lenovo.com/es", "lenovo.com/de", "lenovo.com/fr"],
    description: "Lenovo official product specification reference for laptops, tablets, and workstation configurations.",
    confidencePolicy: "Use as canonical evidence for Lenovo model configuration, CPU, memory, display, storage, and regional option facts.",
  },
  {
    id: "bestbuy-retail",
    name: "Best Buy retail",
    type: "retailer",
    baseUrl: "https://www.bestbuy.com",
    authorityScore: 72,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["retail-specs", "availability", "commercial-copy"],
    sampleDomains: ["bestbuy.com", "bestbuy.ca", "bestbuybusiness.com", "bestbuy.com/site", "bestbuy.com/support", "bestbuy.com/services", "bestbuy.com/trade-in", "bestbuy.com/deals", "bestbuy.com/marketplace", "bestbuy.com/identity"],
    description: "Major electronics retailer used for visible product facts and merchandising context.",
    confidencePolicy: "Use to corroborate visible retail specifications and availability; do not use as sole proof for canonical manufacturer fields.",
  },
  {
    id: "bh-photo-retail",
    name: "B&H Photo Video",
    type: "retailer",
    baseUrl: "https://www.bhphotovideo.com",
    authorityScore: 74,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["pro-equipment", "retail-specs", "camera-audio-computing"],
    sampleDomains: ["bhphotovideo.com", "static.bhphotovideo.com", "bhphoto.com", "bhphotovideo.com/c", "bhphotovideo.com/find", "bhphotovideo.com/explora", "bhphotovideo.com/business", "bhphotovideo.com/help", "bhphotovideo.com/used", "bhphotovideo.com/deals"],
    description: "Specialist electronics retailer for camera, audio, computing, and pro-video products.",
    confidencePolicy: "Use to corroborate published retail specs and accessory bundles, especially for camera and professional equipment categories.",
  },
  {
    id: "mediamarkt-retail",
    name: "MediaMarkt retail",
    type: "retailer",
    baseUrl: "https://www.mediamarkt.es",
    authorityScore: 68,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["european-retail", "availability", "consumer-electronics"],
    sampleDomains: ["mediamarkt.es", "mediamarkt.de", "mediamarkt.at", "mediamarkt.be", "mediamarkt.nl", "mediamarkt.ch", "mediamarkt.hu", "mediamarkt.pl", "mediamarkt.pt", "mediamarkt.com.tr"],
    description: "European consumer-electronics retailer family used for market-visible product details.",
    confidencePolicy: "Use as corroborating retail evidence for visible specifications, category placement, and commercial availability.",
  },
  {
    id: "gsmarena-specs",
    name: "GSMArena",
    type: "spec_database",
    baseUrl: "https://www.gsmarena.com",
    authorityScore: 86,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["phones", "tablets", "spec-database"],
    sampleDomains: ["gsmarena.com", "m.gsmarena.com", "fdn.gsmarena.com", "gsmarena.com.bd", "gsmarena.com/compare.php3", "gsmarena.com/makers.php3", "gsmarena.com/search.php3", "gsmarena.com/reviews.php3", "gsmarena.com/news.php3", "gsmarena.com/glossary.php3"],
    description: "Structured mobile-device specification database for phones, tablets, and related devices.",
    confidencePolicy: "Use for structured mobile specifications when direct manufacturer material is missing or needs normalization.",
  },
  {
    id: "notebookcheck-reviews",
    name: "Notebookcheck",
    type: "review_site",
    baseUrl: "https://www.notebookcheck.net",
    authorityScore: 82,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["laptops", "benchmarks", "technical-reviews"],
    sampleDomains: ["notebookcheck.net", "notebookcheck.com", "notebookcheck.org", "notebookcheck-cn.com", "notebookcheck-ru.com", "notebookcheck-tr.com", "notebookcheck.it", "notebookcheck.nl", "notebookcheck.se", "notebookcheck.pl"],
    description: "Technical review source for laptops, tablets, smartphones, displays, thermals, and performance.",
    confidencePolicy: "Use for measured performance, display, battery, and configuration evidence; corroborate canonical product identity elsewhere.",
  },
  {
    id: "rtings-lab",
    name: "RTINGS lab reviews",
    type: "review_site",
    baseUrl: "https://www.rtings.com",
    authorityScore: 84,
    defaultConfidence: "high",
    enabled: true,
    coverageTags: ["lab-measurements", "tvs", "monitors", "headphones"],
    sampleDomains: ["rtings.com", "rtings.com/tv", "rtings.com/monitor", "rtings.com/headphones", "rtings.com/soundbar", "rtings.com/mouse", "rtings.com/keyboard", "rtings.com/vacuum", "rtings.com/camera", "rtings.com/research"],
    description: "Lab-tested review source for TVs, monitors, headphones, and adjacent electronics.",
    confidencePolicy: "Use for measured attributes and comparison data, not for sole canonical naming or SKU identity.",
  },
  {
    id: "dxomark-lab",
    name: "DXOMARK",
    type: "review_site",
    baseUrl: "https://www.dxomark.com",
    authorityScore: 78,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["camera", "audio", "display", "battery"],
    sampleDomains: ["dxomark.com", "dxomark.com/smartphones", "dxomark.com/cameras", "dxomark.com/lenses", "dxomark.com/audio", "dxomark.com/display", "dxomark.com/battery", "dxomark.com/selfie", "dxomark.com/scores", "dxomark.com/reviews"],
    description: "Independent lab scoring source for smartphone cameras, audio, display, and battery behavior.",
    confidencePolicy: "Use for measured quality signals and lab comparisons; treat as supporting evidence for product data fields.",
  },
  {
    id: "techpowerup-specs",
    name: "TechPowerUp",
    type: "spec_database",
    baseUrl: "https://www.techpowerup.com",
    authorityScore: 80,
    defaultConfidence: "medium",
    enabled: true,
    coverageTags: ["pc-components", "gpu-database", "technical-specs"],
    sampleDomains: ["techpowerup.com", "database.techpowerup.com", "tpucdn.com", "techpowerup.com/gpu-specs", "techpowerup.com/cpu-specs", "techpowerup.com/review", "techpowerup.com/download", "techpowerup.com/forums", "techpowerup.com/vgabios", "techpowerup.com/news"],
    description: "Technical PC hardware source for GPUs, CPUs, BIOS entries, and component specifications.",
    confidencePolicy: "Use for PC component technical corroboration; prefer manufacturer references for final canonical identity.",
  },
  {
    id: "amazon-marketplace",
    name: "Amazon marketplace",
    type: "marketplace",
    baseUrl: "https://www.amazon.com",
    authorityScore: 45,
    defaultConfidence: "low",
    enabled: true,
    coverageTags: ["marketplace", "title-variants", "seller-listings"],
    sampleDomains: ["amazon.com", "amazon.es", "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.it", "amazon.nl", "amazon.se", "amazon.com.be", "amazon.pl"],
    description: "High-volume marketplace listings useful for weak corroboration and variant discovery.",
    confidencePolicy: "Use only as supporting context. Marketplace copy must never become sole proof for export-ready product data.",
  },
  {
    id: "ebay-marketplace",
    name: "eBay marketplace",
    type: "marketplace",
    baseUrl: "https://www.ebay.com",
    authorityScore: 40,
    defaultConfidence: "low",
    enabled: true,
    coverageTags: ["marketplace", "used-devices", "variant-hints"],
    sampleDomains: ["ebay.com", "ebay.es", "ebay.co.uk", "ebay.de", "ebay.fr", "ebay.it", "ebay.ca", "ebay.com.au", "ebay.nl", "ebay.pl"],
    description: "Marketplace source for listing variants, used-device signals, and weak corroboration.",
    confidencePolicy: "Use as low-authority supporting evidence only; never accept marketplace values without stronger corroboration.",
  },
  {
    id: "newegg-marketplace",
    name: "Newegg marketplace",
    type: "marketplace",
    baseUrl: "https://www.newegg.com",
    authorityScore: 55,
    defaultConfidence: "low",
    enabled: true,
    coverageTags: ["pc-components", "marketplace", "retail-specs"],
    sampleDomains: ["newegg.com", "newegg.ca", "neweggbusiness.com", "promotions.newegg.com", "kb.newegg.com", "sellerportal.newegg.com", "newegg.com/global", "newegg.com/tools", "newegg.com/p/pl", "newegg.com/d"],
    description: "Electronics-focused marketplace and retailer for PC components, gaming hardware, and consumer electronics.",
    confidencePolicy: "Use as supporting retail/marketplace context, with stronger sources required for canonical attributes.",
  },
  {
    id: "backmarket-refurbished",
    name: "Back Market refurbished",
    type: "marketplace",
    baseUrl: "https://www.backmarket.com",
    authorityScore: 42,
    defaultConfidence: "low",
    enabled: true,
    coverageTags: ["refurbished", "marketplace", "condition-signals"],
    sampleDomains: ["backmarket.com", "backmarket.es", "backmarket.fr", "backmarket.de", "backmarket.co.uk", "backmarket.it", "backmarket.nl", "backmarket.be", "backmarket.pt", "backmarket.at"],
    description: "Refurbished electronics marketplace useful for condition and variant hints.",
    confidencePolicy: "Use as low-authority supporting evidence only; refurbished marketplace claims do not decide canonical product data.",
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
    linkedCategories: ["Gaming", "Consoles", "Console bundles"],
    requiredAttributes: ["brand", "productName", "ean", "description", "storage", "connectivity"],
    recommendedAttributes: ["usbC", "weight", "dimensions", "compatibility"],
    warningRules: ["Product pending operator review", "Missing hardware identifiers", "Storefront copy requires cleanup"],
    scoringRules: ["Missing identifier = -20", "Missing required field = -10 each"],
    exampleProductIds: [],
  },
  {
    id: "schema-video-games",
    slug: "video-games",
    name: "Video games",
    linkedCategories: ["Gaming", "Video games"],
    requiredAttributes: ["brand", "productName", "ean", "description", "compatibility"],
    recommendedAttributes: [],
    warningRules: ["Storefront copy requires cleanup", "Packaging dimensions should not be treated as device specs"],
    scoringRules: ["Missing platform compatibility blocks review", "Noisy storefront copy caps score below green"],
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
  miraklBaseUrl: "https://seidor-dev.mirakl.net",
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
    sourceUrl: "https://consumer.huawei.com/uk/headphones/freeclip2/specs",
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
    sourceUrl: "https://www.boulanger.com/ref/1233204",
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

type SourceCatalogImportedRow = {
  id: string
  sku: string
  title: string
  brand: string
  categoryPath: readonly string[]
  schemaId: string
  sourceUrl: string
  description: string
  attributes: ProductRecord["baselineAttributes"]
  warnings: readonly string[]
}

const sourceCatalogImportedRows = [
  {
    "id": "source-catalog-mkp000919395167",
    "sku": "SRC_MKP000919395167",
    "title": "Nintendo Videojuego Luigi's Mansion 3 Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-video-games",
    "sourceUrl": "https://www.mediamarkt.es/videojuegos/nintendo/luigis-mansion-3-nintendo-switch/MKP000919395167.html",
    "description": "LUIGI’S MANSION – NINTENDO SWITCH | VERSIÓN ESPAÑOLA Idiomas: Textos y voces: Español, Inglés, Francés, Alemán, Italiano. ¡Luigi se enfrenta a una pesadilla espeluznante! Luigi se prepara para unas vacaciones de ensueño con Mario y sus amigos, pero lo que parecía un descanso se convierte en una aterradora aventura. Recorre los pisos de un misterioso hotel, cada uno distinto, enfrentándote a fantasmas y desafíos inesp…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Luigi's Mansion 3 Switch",
      "ean": "1239193951670",
      "description": "LUIGI’S MANSION – NINTENDO SWITCH | VERSIÓN ESPAÑOLA Idiomas: Textos y voces: Español, Inglés, Francés, Alemán, Italiano. ¡Luigi se enfrenta a una pesadilla espeluznante! Luigi se prepara para unas vacaciones de ensueño con Mario y sus amigos, pero lo que parecía un descanso se convierte en una aterradora aventura. Recorre los pisos de un misterioso hotel, cada uno distinto, enfrentándote a fantasmas y desafíos inesp…",
      "compatibility": "JUEGOS SWITCH"
    },
    "warnings": [
      "Description contains storefront or promotional copy",
      "Packaging dimensions should not be treated as console hardware specs"
    ]
  },
  {
    "id": "source-catalog-mkp000919369436",
    "sku": "SRC_MKP000919369436",
    "title": "Nintendo Videojuego Mario vs Donkey Kong Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-video-games",
    "sourceUrl": "https://www.mediamarkt.es/videojuegos/nintendo/mario-vs-donkey-kong-nintendo-switch/MKP000919369436.html",
    "description": "MARIO VS DONKEY KONG NINTENDO SWITCH VERSIÓN ESPAÑOLA ¡Estos juguetes tienen cuerda para rato! La chispa de rivalidad que prendió en Game Boy Advance se reaviva en Mario vs. Donkey Kong para Nintendo Switch, que cuenta con gráficos totalmente nuevos. Resuelve todo tipo de puzles y pon a prueba tus dotes para las plataformas en tu afán por recuperar los Minimarios robados. ¡Arrebátale los Minimarios a Donkey Kong! Don…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Mario vs Donkey Kong Switch",
      "ean": "1239193694362",
      "description": "MARIO VS DONKEY KONG NINTENDO SWITCH VERSIÓN ESPAÑOLA ¡Estos juguetes tienen cuerda para rato! La chispa de rivalidad que prendió en Game Boy Advance se reaviva en Mario vs. Donkey Kong para Nintendo Switch, que cuenta con gráficos totalmente nuevos. Resuelve todo tipo de puzles y pon a prueba tus dotes para las plataformas en tu afán por recuperar los Minimarios robados. ¡Arrebátale los Minimarios a Donkey Kong! Don…",
      "compatibility": "CONSOLAS SWITCH"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000919026648",
    "sku": "SRC_MKP000919026648",
    "title": "Nintendo Videojuego Monster Hunter Rise Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-video-games",
    "sourceUrl": "https://www.mediamarkt.es/videojuegos/nintendo/monster-hunter-rise-para-nintendo-switch/MKP000919026648.html",
    "description": "Nintendo Videojuego Monster Hunter Rise Switch Dimensiones Peso del dispositivo (gr) 0.10 gr Altura (cm) 17 cm Anchura (cm) 10.5 cm Profundidad (cm) 8 cm Otros detalles Componentes Incluidos MONSTER HUNTER RISE PARA NINTENDO SWITCH VERSIÓN ESPAÑOLA Contenido MONSTER HUNTER RISE PARA NINTENDO SWITCH VERSIÓN ESPAÑOLA Más características Compatible Nintendo Switch Y Nintendo Switch 2 Gaming MPN (Manufacturer Part Number…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Monster Hunter Rise Switch",
      "ean": "1239190266487",
      "description": "Nintendo Videojuego Monster Hunter Rise Switch Dimensiones Peso del dispositivo (gr) 0.10 gr Altura (cm) 17 cm Anchura (cm) 10.5 cm Profundidad (cm) 8 cm Otros detalles Componentes Incluidos MONSTER HUNTER RISE PARA NINTENDO SWITCH VERSIÓN ESPAÑOLA Contenido MONSTER HUNTER RISE PARA NINTENDO SWITCH VERSIÓN ESPAÑOLA Más características Compatible Nintendo Switch Y Nintendo Switch 2 Gaming MPN (Manufacturer Part Number…",
      "compatibility": "Nintendo Switch Y Nintendo Switch 2"
    },
    "warnings": [
      "Packaging dimensions should not be treated as console hardware specs"
    ]
  },
  {
    "id": "source-catalog-mkp000911904588",
    "sku": "SRC_MKP000911904588",
    "title": "Nintendo NBA 2K26 Nintendo Switch Caja Código Descarga Dig.",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-video-games",
    "sourceUrl": "https://www.mediamarkt.es/videojuegos/nintendo/nba-2k26-nintendo-switch-caja-codigo-descarga-dig/MKP000911904588.html",
    "description": "NBA 2K26 SWITCH CAJA CON CÓDIGO DESCARGA DIGITAL VERSIÓN ESPAÑOLA Nintendo NBA 2K26 Nintendo Switch Caja Código Descarga Dig. Otros detalles Componentes Incluidos NBA 2K26 SWITCH CAJA CON CÓDIGO DESCARGA DIGITAL VERSIÓN ESPAÑOLA Contenido NBA 2K26 SWITCH CAJA CON CÓDIGO DESCARGA DIGITAL VERSIÓN ESPAÑOLA Más características Compatible Nintendo Switch Gaming MPN (Manufacturer Part Number) 5072854 Usos Nintendo Switch",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo NBA 2K26 Nintendo Switch Caja Código Descarga Dig.",
      "ean": "1239119045889",
      "description": "NBA 2K26 SWITCH CAJA CON CÓDIGO DESCARGA DIGITAL VERSIÓN ESPAÑOLA Nintendo NBA 2K26 Nintendo Switch Caja Código Descarga Dig. Otros detalles Componentes Incluidos NBA 2K26 SWITCH CAJA CON CÓDIGO DESCARGA DIGITAL VERSIÓN ESPAÑOLA Contenido NBA 2K26 SWITCH CAJA CON CÓDIGO DESCARGA DIGITAL VERSIÓN ESPAÑOLA Más características Compatible Nintendo Switch Gaming MPN (Manufacturer Part Number) 5072854 Usos Nintendo Switch",
      "compatibility": "Nintendo Switch"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000917601064",
    "sku": "SRC_MKP000917601064",
    "title": "Nintendo Videojuego Shin Megami Tensei V Vengeance Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-video-games",
    "sourceUrl": "https://www.mediamarkt.es/videojuegos/nintendo/shin-megami-tensei-v-vengeance-standard-ed-switch/MKP000917601064.html",
    "description": "Shin Megami Tensei V: Vengeance – Nintendo Switch Embárcate en esta versión definitiva de Shin Megami Tensei V , ampliada con una historia nueva que incluye nuevos escenarios, demonios y decisiones que dictarán el destino de toda la existencia. Shin Megami Tensei V: Vengeance consta de dos rutas argumentales completas: • Canon de la Venganza: una dramática historia centrada en los caídos, nuevos personajes y la enigm…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Shin Megami Tensei V Vengeance Switch",
      "ean": "1239176010646",
      "description": "Shin Megami Tensei V: Vengeance – Nintendo Switch Embárcate en esta versión definitiva de Shin Megami Tensei V , ampliada con una historia nueva que incluye nuevos escenarios, demonios y decisiones que dictarán el destino de toda la existencia. Shin Megami Tensei V: Vengeance consta de dos rutas argumentales completas: • Canon de la Venganza: una dramática historia centrada en los caídos, nuevos personajes y la enigm…"
    },
    "warnings": [
      "Description contains storefront or promotional copy",
      "Packaging dimensions should not be treated as console hardware specs"
    ]
  },
  {
    "id": "source-catalog-mkp000914595450",
    "sku": "SRC_MKP000914595450",
    "title": "Nintendo SMBros.Wonder Switch 2 Ed+Encuentro Parque Belabel",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-video-games",
    "sourceUrl": "https://www.mediamarkt.es/videojuegos/nintendo/smbroswonder-switch-2-edmasencuentro-parque-belabel/MKP000914595450.html",
    "description": "SUPER MARIO BROS. WONDER NINTENDO SWITCH 2 EDITION + ENCUENTRO EN EL PARQUE BELABEL VERSIÓN ESPAÑOLA Nintendo SMBros.Wonder Switch 2 Ed+Encuentro Parque Belabel Otros detalles Componentes Incluidos SUPER MARIO BROS. WONDER NINTENDO SWITCH 2 EDITION + ENCUENTRO EN EL PARQUE BELABEL VERSIÓN ESPAÑOLA Contenido SUPER MARIO BROS. WONDER NINTENDO SWITCH 2 EDITION + ENCUENTRO EN EL PARQUE BELABEL VERSIÓN ESPAÑOLA Más caract…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo SMBros.Wonder Switch 2 Ed+Encuentro Parque Belabel",
      "ean": "1239145954506",
      "description": "SUPER MARIO BROS. WONDER NINTENDO SWITCH 2 EDITION + ENCUENTRO EN EL PARQUE BELABEL VERSIÓN ESPAÑOLA Nintendo SMBros.Wonder Switch 2 Ed+Encuentro Parque Belabel Otros detalles Componentes Incluidos SUPER MARIO BROS. WONDER NINTENDO SWITCH 2 EDITION + ENCUENTRO EN EL PARQUE BELABEL VERSIÓN ESPAÑOLA Contenido SUPER MARIO BROS. WONDER NINTENDO SWITCH 2 EDITION + ENCUENTRO EN EL PARQUE BELABEL VERSIÓN ESPAÑOLA Más caract…",
      "compatibility": "Nintendo Switch"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000916055291",
    "sku": "SRC_MKP000916055291",
    "title": "Nintendo Videojuego Totally Spies Cyber Mission Switch",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Video games"
    ],
    "schemaId": "schema-video-games",
    "sourceUrl": "https://www.mediamarkt.es/videojuegos/nintendo/totally-spies-cyber-mission-nintendo-switch/MKP000916055291.html",
    "description": "TOTALLY SPIES CYBER MISSION – Nintendo Switch PREPÁRATE, ¡ES HORA DE LA MISIÓN! El deslumbrante trío de Beverly Hills -Sam, Clover y Alex- ha vuelto y está listo para iluminar las vibrantes calles de Singapur con sus habilidades de espía. Desde las bulliciosas calles de Singapur hasta la Universidad de Ayia, embárcate en una aventura llena de acción mientras exploras todos los rincones futuristas de la ciudad. Pero,…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Videojuego Totally Spies Cyber Mission Switch",
      "ean": "1239160552916",
      "description": "TOTALLY SPIES CYBER MISSION – Nintendo Switch PREPÁRATE, ¡ES HORA DE LA MISIÓN! El deslumbrante trío de Beverly Hills -Sam, Clover y Alex- ha vuelto y está listo para iluminar las vibrantes calles de Singapur con sus habilidades de espía. Desde las bulliciosas calles de Singapur hasta la Universidad de Ayia, embárcate en una aventura llena de acción mientras exploras todos los rincones futuristas de la ciudad. Pero,…",
      "compatibility": "JUEGOS SWITCH"
    },
    "warnings": []
  },
  {
    "id": "source-catalog-mkp000905189074",
    "sku": "SRC_MKP000905189074",
    "title": "Nintendo Consola Nintendo Switch 2 + Super Mario Galaxy 1y2",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Consoles & bundles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/consolas-y-videojuegos/nintendo/consola-nintendo-switch-2-mas-super-mario-galaxy-1y2/MKP000905189074.html",
    "description": "NUEVA CONSOLA NINTENDO SWITCH 2 + SUPER MARIO GALAXY 1 Y SUPER MARIO GALAXY 2 SWITCH VERSIÓN ESPAÑOLA GARANTÍA EUROPEA EU WARRANTY Nintendo Switch 2 incluye: • Una consola Nintendo Switch 2 • Mandos Joy-Con 2 (izquierdo y derecho) • Un soporte para mandos Joy-Con 2 • Correas de los mandos Joy-Con 2 • Una base de Nintendo Switch 2 • Un cable HDMI de ultra alta velocidad • Un adaptador de corriente de Nintendo Switch 2…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Consola Nintendo Switch 2 + Super Mario Galaxy 1y2",
      "ean": "1239051890745",
      "description": "NUEVA CONSOLA NINTENDO SWITCH 2 + SUPER MARIO GALAXY 1 Y SUPER MARIO GALAXY 2 SWITCH VERSIÓN ESPAÑOLA GARANTÍA EUROPEA EU WARRANTY Nintendo Switch 2 incluye: • Una consola Nintendo Switch 2 • Mandos Joy-Con 2 (izquierdo y derecho) • Un soporte para mandos Joy-Con 2 • Correas de los mandos Joy-Con 2 • Una base de Nintendo Switch 2 • Un cable HDMI de ultra alta velocidad • Un adaptador de corriente de Nintendo Switch 2…",
      "compatibility": "Nintendo Switch y Nintendo Switch 2"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000904208354",
    "sku": "SRC_MKP000904208354",
    "title": "Nintendo Switch (Versión OLED) Mandos -Blanca",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Consoles & bundles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/consolas-y-videojuegos/nintendo/nintendo-switch-version-oled-mandos-color-blanca/MKP000904208354.html",
    "description": "MANDOS COLOR BLANCO VERSIÓN ESPAÑOLA SWITCH MODELO OLED Una nueva consola se incorpora a la familia Nintendo Switch: con Nintendo Switch (modelo OLED), a la venta el 8 de octubre, y con ella crece el abanico de opciones para disfrutar del amplio catálogo de juegos para Nintendo Switch. Aquí se puede ver el vídeo de presentación de la nueva consola, Nintendo Switch (modelo OLED). Nintendo Switch (modelo OLED) tiene el…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch (Versión OLED) Mandos -Blanca",
      "ean": "1239042083545",
      "description": "MANDOS COLOR BLANCO VERSIÓN ESPAÑOLA SWITCH MODELO OLED Una nueva consola se incorpora a la familia Nintendo Switch: con Nintendo Switch (modelo OLED), a la venta el 8 de octubre, y con ella crece el abanico de opciones para disfrutar del amplio catálogo de juegos para Nintendo Switch. Aquí se puede ver el vídeo de presentación de la nueva consola, Nintendo Switch (modelo OLED). Nintendo Switch (modelo OLED) tiene el…",
      "weight": "1.5 gr",
      "compatibility": "CONSOLAS SWITCH"
    },
    "warnings": []
  },
  {
    "id": "source-catalog-mkp000904580307",
    "sku": "SRC_MKP000904580307",
    "title": "Nintendo Switch2 + Super Mario Galaxy 1y2 + Joycon",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Consoles & bundles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/consolas-y-videojuegos/nintendo/nintendo-switch2-mas-super-mario-galaxy-1y2-mas-joycon/MKP000904580307.html",
    "description": "Nintendo Nintendo Switch2 + Super Mario Galaxy 1y2 + Joycon 5 - 9 W USB PD Este producto se vende con cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 9 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. Ver Opiniones Desde /mes Vendido por Source catalog Enviado por RALIGHT SHOPPING SL Entrega desde mié, 22 al mar, 28 Sobre garantías y devoluciones Item No.…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch2 + Super Mario Galaxy 1y2 + Joycon",
      "ean": "1239045803072",
      "description": "Nintendo Nintendo Switch2 + Super Mario Galaxy 1y2 + Joycon 5 - 9 W USB PD Este producto se vende con cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 9 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. Ver Opiniones Desde /mes Vendido por Source catalog Enviado por RALIGHT SHOPPING SL Entrega desde mié, 22 al mar, 28 Sobre garantías y devoluciones Item No.…",
      "compatibility": "Nintendo Switch 2"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000907953660",
    "sku": "SRC_MKP000907953660",
    "title": "Nintendo Switch 2 + Animal Crossing + SuperMario Galaxy 1y2",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Consoles & bundles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/consolas-y-videojuegos/nintendo/switch-2-mas-animal-crossing-mas-supermario-galaxy-1y2/MKP000907953660.html",
    "description": "CONSOLA NINTENDO SWITCH 2 + ANIMAL CROSSING SWITCH 2 + SUPER MARIO GALAXY 1 Y 2 – VERSIÓN ESPAÑOLA Pack de Nintendo Switch 2 que incluye los juegos físicos completos Animal Crossing Switch 2 y Super Mario Galaxy 1 y 2. Disfruta de la nueva generación de Nintendo con mayor potencia, nuevas funciones online, gráficos mejorados y una experiencia de juego más fluida y envolvente, en versión española y con garantía europe…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch 2 + Animal Crossing + SuperMario Galaxy 1y2",
      "ean": "1239079536601",
      "description": "CONSOLA NINTENDO SWITCH 2 + ANIMAL CROSSING SWITCH 2 + SUPER MARIO GALAXY 1 Y 2 – VERSIÓN ESPAÑOLA Pack de Nintendo Switch 2 que incluye los juegos físicos completos Animal Crossing Switch 2 y Super Mario Galaxy 1 y 2. Disfruta de la nueva generación de Nintendo con mayor potencia, nuevas funciones online, gráficos mejorados y una experiencia de juego más fluida y envolvente, en versión española y con garantía europe…",
      "compatibility": "Nintendo Switch 2"
    },
    "warnings": []
  },
  {
    "id": "source-catalog-mkp000906664010",
    "sku": "SRC_MKP000906664010",
    "title": "Nintendo Switch 2 + AnimalCrossing + SM Galaxy 1y2 + Joycon",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Consoles & bundles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/consolas-y-videojuegos/nintendo/switch-2-mas-animalcrossing-mas-sm-galaxy-1y2-mas-joycon/MKP000906664010.html",
    "description": "Nintendo Switch 2 + AnimalCrossing + SM Galaxy 1y2 + Joycon 5 - 9 W USB PD Este producto se vende con cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 9 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. Ver Opiniones Desde /mes Vendido por Source catalog Enviado por RALIGHT SHOPPING SL Entrega desde mié, 22 al mar, 28 Sobre garantías y devoluciones Item No.…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch 2 + AnimalCrossing + SM Galaxy 1y2 + Joycon",
      "ean": "1239066640106",
      "description": "Nintendo Switch 2 + AnimalCrossing + SM Galaxy 1y2 + Joycon 5 - 9 W USB PD Este producto se vende con cargador incluido. La potencia del cargador debe ser entre un mínimo de 2.5 vatios y un máximo de 9 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. Ver Opiniones Desde /mes Vendido por Source catalog Enviado por RALIGHT SHOPPING SL Entrega desde mié, 22 al mar, 28 Sobre garantías y devoluciones Item No.…",
      "compatibility": "Nintendo Switch 2"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711228",
    "sku": "SRC_3711228",
    "title": "Nintendo Switch 2",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Consoles & bundles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/consolas-y-videojuegos/nintendo/switch-2-negro/3711228.html",
    "description": "Nintendo Switch 2 es una consola híbrida que permite jugar tanto en modo portátil como conectada al televisor, diseñada para ofrecer una experiencia fluida y versátil. Mantiene el concepto original, pero incorpora mejoras importantes en ergonomía, conectividad y funciones de uso diario. Está equipada con una pantalla táctil de 7,9 pulgadas con resolución de 1920 x 1080, amplia gama de color y compatibilidad con HDR10…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch 2",
      "ean": "1233711228817",
      "description": "Nintendo Switch 2 es una consola híbrida que permite jugar tanto en modo portátil como conectada al televisor, diseñada para ofrecer una experiencia fluida y versátil. Mantiene el concepto original, pero incorpora mejoras importantes en ergonomía, conectividad y funciones de uso diario. Está equipada con una pantalla táctil de 7,9 pulgadas con resolución de 1920 x 1080, amplia gama de color y compatibilidad con HDR10…",
      "connectivity": "Wifi / Bluetooth",
      "usbC": "Yes",
      "weight": "401gr",
      "dimensions": "272 x 116 x 13.9mm",
      "storage": "256GB"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3240446",
    "sku": "SRC_3240446",
    "title": "Nintendo Switch + Super Mario Odyssey",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Consoles & bundles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/consolas-y-videojuegos/nintendo/switch-gris-super-mario-odyssey/3240446.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Nintendo Switch + Super Mario Odyssey [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Total en 48 plazos: 360€ Ahorra 50€ vs PVPr Vendido y enviado por Source catalog Entrega desde lun, 20 al jue, 23 Item No.; 3240446 Hay 1 persona viendo este dispositivo Wi-Fi Bluetooth Este producto no está disponi…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch + Super Mario Odyssey",
      "ean": "1233240446713",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Nintendo Switch + Super Mario Odyssey [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Total en 48 plazos: 360€ Ahorra 50€ vs PVPr Vendido y enviado por Source catalog Entrega desde lun, 20 al jue, 23 Item No.; 3240446 Hay 1 persona viendo este dispositivo Wi-Fi Bluetooth Este producto no está disponi…",
      "connectivity": "Wifi / Bluetooth",
      "usbC": "Yes",
      "weight": "399gr",
      "dimensions": "101.6 x 238.8 x 14mm",
      "storage": "32GB"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3240684",
    "sku": "SRC_3240684",
    "title": "Nintendo Switch OLED + Super Mario Bros Wonder",
    "brand": "Nintendo",
    "categoryPath": [
      "Gaming",
      "Consoles & bundles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/consolas-y-videojuegos/nintendo/switch-oled-super-mario-bros-wonder/3240684.html",
    "description": "IMPORTANTE : El color de Nintendo Switch OLED así como el de los Joy-Con incluidos, puede variar en función de la disponibilidad de stock. Nintendo Switch (modelo OLED) Nintendo Switch (modelo OLED) tiene el mismo tamaño que la consola Nintendo Switch original, pero incluye una pantalla OLED de 7 pulgadas con un marco más fino. Los colores intensos y el alto contraste de la pantalla OLED, te proporcionarán una experi…",
    "attributes": {
      "brand": "Nintendo",
      "productName": "Nintendo Switch OLED + Super Mario Bros Wonder",
      "ean": "1233240684108",
      "description": "IMPORTANTE : El color de Nintendo Switch OLED así como el de los Joy-Con incluidos, puede variar en función de la disponibilidad de stock. Nintendo Switch (modelo OLED) Nintendo Switch (modelo OLED) tiene el mismo tamaño que la consola Nintendo Switch original, pero incluye una pantalla OLED de 7 pulgadas con un marco más fino. Los colores intensos y el alto contraste de la pantalla OLED, te proporcionarán una experi…",
      "connectivity": "Wifi / Bluetooth",
      "usbC": "Yes",
      "weight": "320gr",
      "dimensions": "102 x 242 x 13.9mm",
      "storage": "64GB"
    },
    "warnings": []
  },
  {
    "id": "source-catalog-3711234",
    "sku": "SRC_3711234",
    "title": "Microsoft Xbox Series X",
    "brand": "Microsoft",
    "categoryPath": [
      "Gaming",
      "Xbox consoles"
    ],
    "schemaId": "schema-gaming-devices",
    "sourceUrl": "https://www.mediamarkt.es/gaming/microsoft/xbox-series-x-1tb-negro/3711234.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Microsoft Xbox Series X [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Vendido y enviado por Source catalog Entrega desde lun, 20 al jue, 23 Item No.; 3711234 Hay 5 personas viendo este dispositivo Wi-Fi Bluetooth Este producto no está disponible actualmente. Avísame Gracias por tu interés. Te avisa…",
    "attributes": {
      "brand": "Microsoft",
      "productName": "Microsoft Xbox Series X",
      "ean": "1233711234610",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Microsoft Xbox Series X [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Vendido y enviado por Source catalog Entrega desde lun, 20 al jue, 23 Item No.; 3711234 Hay 5 personas viendo este dispositivo Wi-Fi Bluetooth Este producto no está disponible actualmente. Avísame Gracias por tu interés. Te avisa…",
      "connectivity": "Wifi / Bluetooth",
      "weight": "4445gr",
      "dimensions": "301 × 151 × 151mm",
      "storage": "1000GB"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000432796356",
    "sku": "SRC_MKP000432796356",
    "title": "HP Monitor OMEN 25 FHD 360HZ BG1M4E9",
    "brand": "HP",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.mediamarkt.es/monitores/hp/monitor-omen-25-fhd-360hz-bg1m4e9/MKP000432796356.html",
    "description": "el Monitor HP OMEN 25 24,5\" FullHD 360Hz IPS, diseñado para ofrecer máxima fluidez, precisión y velocidad en gaming profesional. Características Monitor HP OMEN 25 24,5\" FHD 360Hz 1ms IPS DisplayHDR400 G?Sync RGB Altura Ajustable Gamer Pro Lleva tu experiencia de juego a un nuevo nivel gracias a su panel IPS de 24,5 pulgadas FullHD, que entrega colores vibrantes, ángulos de visión de 178° y una claridad inigualable,…",
    "attributes": {
      "brand": "HP",
      "productName": "HP Monitor OMEN 25 FHD 360HZ BG1M4E9",
      "ean": "1234327963567",
      "description": "el Monitor HP OMEN 25 24,5\" FullHD 360Hz IPS, diseñado para ofrecer máxima fluidez, precisión y velocidad en gaming profesional. Características Monitor HP OMEN 25 24,5\" FHD 360Hz 1ms IPS DisplayHDR400 G?Sync RGB Altura Ajustable Gamer Pro Lleva tu experiencia de juego a un nuevo nivel gracias a su panel IPS de 24,5 pulgadas FullHD, que entrega colores vibrantes, ángulos de visión de 178° y una claridad inigualable,…",
      "connectivity": "HDMI",
      "weight": "6700 gr",
      "displaySize": "25 pulgadas",
      "resolution": "Full HD (1920 x 1080)"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000430187951",
    "sku": "SRC_MKP000430187951",
    "title": "HP Monitor OMEN 27 G2 FHD 180HZ AV4K1E9",
    "brand": "HP",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.mediamarkt.es/monitores/hp/monitor-omen-27-g2-fhd-180hz-av4k1e9/MKP000430187951.html",
    "description": "Llega más lejos con el monitor gaming FHD OMEN a 180 Hz y de 27 pulgadas. Su excelente rendimiento y la definición de sus colores permiten que puedas perderte en los juegos que más te gustan. Además, su diseño elegante y sus funciones hacen que se vea estupendamente sobre el escritorio. SIN RETARDO. SOLO VELOCIDAD. CONTEMPLE LOS MUNDOS QUE LE ESPERAN SIN RETARDO. SOLO VELOCIDAD. Disfruta de toda la acción fotograma a…",
    "attributes": {
      "brand": "HP",
      "productName": "HP Monitor OMEN 27 G2 FHD 180HZ AV4K1E9",
      "ean": "1234301879518",
      "description": "Llega más lejos con el monitor gaming FHD OMEN a 180 Hz y de 27 pulgadas. Su excelente rendimiento y la definición de sus colores permiten que puedas perderte en los juegos que más te gustan. Además, su diseño elegante y sus funciones hacen que se vea estupendamente sobre el escritorio. SIN RETARDO. SOLO VELOCIDAD. CONTEMPLE LOS MUNDOS QUE LE ESPERAN SIN RETARDO. SOLO VELOCIDAD. Disfruta de toda la acción fotograma a…",
      "connectivity": "Otro",
      "weight": "8050 gr",
      "displaySize": "27 pulgadas",
      "resolution": "Full HD (1920 x 1080)"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000432953376",
    "sku": "SRC_MKP000432953376",
    "title": "HP Monitor OMEN 27Q G2 QHD 180HZ AV4H6E9",
    "brand": "HP",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.mediamarkt.es/monitores/hp/monitor-omen-27q-g2-qhd-180hz-av4h6e9/MKP000432953376.html",
    "description": "HP Monitor OMEN 27Q G2 QHD 180HZ AV4H6E9 Dimensiones Peso del dispositivo (gr) 7330 gr Altura (cm) 52.37 cm Anchura (cm) 61.36 cm Profundidad (cm) 22.33 cm Otros detalles Componentes Incluidos Dispositivo, cable y enchufe, manual de instrucciones Contenido Dispositivo, cable y enchufe, manual de instrucciones Más características Conexión Otro Gaming MPN (Manufacturer Part Number) AV4H6E9 Resolución Monitor QHD (2560…",
    "attributes": {
      "brand": "HP",
      "productName": "HP Monitor OMEN 27Q G2 QHD 180HZ AV4H6E9",
      "ean": "1234329533768",
      "description": "HP Monitor OMEN 27Q G2 QHD 180HZ AV4H6E9 Dimensiones Peso del dispositivo (gr) 7330 gr Altura (cm) 52.37 cm Anchura (cm) 61.36 cm Profundidad (cm) 22.33 cm Otros detalles Componentes Incluidos Dispositivo, cable y enchufe, manual de instrucciones Contenido Dispositivo, cable y enchufe, manual de instrucciones Más características Conexión Otro Gaming MPN (Manufacturer Part Number) AV4H6E9 Resolución Monitor QHD (2560…",
      "connectivity": "Otro",
      "weight": "7330 gr",
      "displaySize": "27 pulgadas",
      "resolution": "QHD (2560 x 1440)"
    },
    "warnings": []
  },
  {
    "id": "source-catalog-mkp000439042469",
    "sku": "SRC_MKP000439042469",
    "title": "LG Monitor 27\" Panel IPS FHD",
    "brand": "LG",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.mediamarkt.es/monitores/lg/monitor-27-panel-ips-resolucion-fhd/MKP000439042469.html",
    "description": "MONITOR DE TRABAJO VERSÁTIL PARA VARIOS ESPACIOS: Este monitor es versátil y permite cubrir varias funciones en diversos espacios, tales como oficinas, instituciones públicas y servicio al cliente. Cuenta con una pantalla IPS y un diseño prácticamente sin bordes en tres lados. APROVECHA TODO EL POTENCIAL DE TU ESCRITORIO: Con el módulo de alimentación integrada, es posible diseñar espacios de trabajo con una distribu…",
    "attributes": {
      "brand": "LG",
      "productName": "LG Monitor 27\" Panel IPS FHD",
      "ean": "1234390424699",
      "description": "MONITOR DE TRABAJO VERSÁTIL PARA VARIOS ESPACIOS: Este monitor es versátil y permite cubrir varias funciones en diversos espacios, tales como oficinas, instituciones públicas y servicio al cliente. Cuenta con una pantalla IPS y un diseño prácticamente sin bordes en tres lados. APROVECHA TODO EL POTENCIAL DE TU ESCRITORIO: Con el módulo de alimentación integrada, es posible diseñar espacios de trabajo con una distribu…",
      "connectivity": "HDMI",
      "weight": "5.05 K gr",
      "displaySize": "27 pulgadas",
      "resolution": "Full HD (1920 x 1080)"
    },
    "warnings": []
  },
  {
    "id": "source-catalog-mkp000435784934",
    "sku": "SRC_MKP000435784934",
    "title": "LG Monitor UltraGear G4 27\" FHD IPS con 144Hz (O/C)",
    "brand": "LG",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.mediamarkt.es/monitores/lg/monitor-ultragear-g4-27-fhd-ips-con-144hz-oc/MKP000435784934.html",
    "description": "Pantalla IPS Full HD de 27” con colores intensos y amplio ángulo de visión Tasa de refresco de 120Hz (O/C 144Hz) para fluidez total al jugar Compatible con NVIDIA G-SYNC y AMD FreeSync™ Premium Pro LG Monitor UltraGear G4 27\" FHD IPS con 144Hz (O/C) Dimensiones Peso del dispositivo (gr) 2900 gr Altura (cm) 35.8 cm Anchura (cm) 61.15 cm Profundidad (cm) 3.85 cm Otros detalles Componentes Incluidos Pantalla Cable de al…",
    "attributes": {
      "brand": "LG",
      "productName": "LG Monitor UltraGear G4 27\" FHD IPS con 144Hz (O/C)",
      "ean": "1234357849343",
      "description": "Pantalla IPS Full HD de 27” con colores intensos y amplio ángulo de visión Tasa de refresco de 120Hz (O/C 144Hz) para fluidez total al jugar Compatible con NVIDIA G-SYNC y AMD FreeSync™ Premium Pro LG Monitor UltraGear G4 27\" FHD IPS con 144Hz (O/C) Dimensiones Peso del dispositivo (gr) 2900 gr Altura (cm) 35.8 cm Anchura (cm) 61.15 cm Profundidad (cm) 3.85 cm Otros detalles Componentes Incluidos Pantalla Cable de al…",
      "connectivity": "HDMI",
      "weight": "2900 gr",
      "displaySize": "27 pulgadas",
      "resolution": "Full HD (1920 x 1080)"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000439101545",
    "sku": "SRC_MKP000439101545",
    "title": "MSI Monitor PRO MP275Q 27\"",
    "brand": "MSI",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.mediamarkt.es/monitores/msi/monitor-pro-mp275q/MKP000439101545.html",
    "description": "Tamaño de pantalla perfecto de 27 Pulgadas con resolución WQHD (1440p) para el espacio de trabajo de programación, codificación y diseño de sitios web. La pantalla con certificación TUV garantiza la protección y la salud de la vista. La tecnología MSI EyesErgo con tecnología Anti-Flicker ayuda a prevenir la fatiga visual. La frecuencia de actualización de 100 Hz proporciona una mejor experiencia de visualización con…",
    "attributes": {
      "brand": "MSI",
      "productName": "MSI Monitor PRO MP275Q 27\"",
      "ean": "1234391015452",
      "description": "Tamaño de pantalla perfecto de 27 Pulgadas con resolución WQHD (1440p) para el espacio de trabajo de programación, codificación y diseño de sitios web. La pantalla con certificación TUV garantiza la protección y la salud de la vista. La tecnología MSI EyesErgo con tecnología Anti-Flicker ayuda a prevenir la fatiga visual. La frecuencia de actualización de 100 Hz proporciona una mejor experiencia de visualización con…",
      "connectivity": "HDMI",
      "weight": "5.500 gr",
      "displaySize": "27 pulgadas",
      "resolution": "QHD (2560 x 1440)"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000433358152",
    "sku": "SRC_MKP000433358152",
    "title": "Samsung Monitor Curvo 34\" Viefinity S65UC",
    "brand": "Samsung",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.mediamarkt.es/monitores/samsung/monitor-curvo-34-viefinity-s65uc/MKP000433358152.html",
    "description": "Resolución Ultra WQHD Pantalla curva 1000R Mayor precisión y detalle de color HDR10 Conectividad USB-C Samsung Monitor Curvo 34\" Viefinity S65UC Dimensiones Peso del dispositivo (gr) 8000 gr Altura (cm) 56.15 cm Anchura (cm) 80.66 cm Profundidad (cm) 24.1 cm Otros detalles Componentes Incluidos Cables incluidos: HDMI, USB Type-A , Micro USB Type-B, USB Tipo CV Contenido 1 Monitor 34\" CURVO VIEFINITY S65UC Más caracte…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Monitor Curvo 34\" Viefinity S65UC",
      "ean": "1234333581526",
      "description": "Resolución Ultra WQHD Pantalla curva 1000R Mayor precisión y detalle de color HDR10 Conectividad USB-C Samsung Monitor Curvo 34\" Viefinity S65UC Dimensiones Peso del dispositivo (gr) 8000 gr Altura (cm) 56.15 cm Anchura (cm) 80.66 cm Profundidad (cm) 24.1 cm Otros detalles Componentes Incluidos Cables incluidos: HDMI, USB Type-A , Micro USB Type-B, USB Tipo CV Contenido 1 Monitor 34\" CURVO VIEFINITY S65UC Más caracte…",
      "connectivity": "HDMI",
      "weight": "8000 gr",
      "displaySize": "34 pulgadas",
      "resolution": "QHD (2560 x 1440)"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-mkp000435586633",
    "sku": "SRC_MKP000435586633",
    "title": "Samsung Monitor ViewFinity S6 S60UD QHD",
    "brand": "Samsung",
    "categoryPath": [
      "Computing",
      "Monitors"
    ],
    "schemaId": "schema-monitors",
    "sourceUrl": "https://www.mediamarkt.es/monitores/samsung/monitor-viewfinity-s6-s60ud-qhd/MKP000435586633.html",
    "description": "Explora el futuro con el Samsung ViewFinity S6 S60UD, una pantalla diseñada para redefinir tu experiencia visual. Este monitor no es solo un dispositivo, es una puerta de acceso a mundos llenos de color, detalle y precisión. Perfecto para profesionales creativos que buscan la excelencia en resolución y calidad de imagen, este modelo equilibra las funciones técnicas avanzadas con un diseño elegante y moderno. Caracter…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Monitor ViewFinity S6 S60UD QHD",
      "ean": "1234355866335",
      "description": "Explora el futuro con el Samsung ViewFinity S6 S60UD, una pantalla diseñada para redefinir tu experiencia visual. Este monitor no es solo un dispositivo, es una puerta de acceso a mundos llenos de color, detalle y precisión. Perfecto para profesionales creativos que buscan la excelencia en resolución y calidad de imagen, este modelo equilibra las funciones técnicas avanzadas con un diseño elegante y moderno. Caracter…",
      "connectivity": "HDMI",
      "weight": "6.100 gr",
      "displaySize": "27 pulgadas",
      "resolution": "QHD (2560 x 1440)"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004070",
    "sku": "SRC_3004070",
    "title": "Apple iPhone 17 con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/apple/iphone-17-256gb-morado/3004070.html",
    "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 con 5G",
      "ean": "1233004070710",
      "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
      "model": "iPhone 17 con 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004067",
    "sku": "SRC_3004067",
    "title": "Apple iPhone 17 con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/apple/iphone-17-256gb-negro/3004067.html",
    "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 con 5G",
      "ean": "1233004067109",
      "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
      "model": "iPhone 17 con 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004083",
    "sku": "SRC_3004083",
    "title": "Apple iPhone 17 Pro con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/apple/iphone-17-pro-256gb-azul/3004083.html",
    "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 Pro con 5G",
      "ean": "1233004083109",
      "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
      "model": "iPhone 17 Pro con 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004084",
    "sku": "SRC_3004084",
    "title": "Apple iPhone 17 Pro con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/apple/iphone-17-pro-256gb-naranja/3004084.html",
    "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 Pro con 5G",
      "ean": "1233004084359",
      "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
      "model": "iPhone 17 Pro con 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004090",
    "sku": "SRC_3004090",
    "title": "Apple iPhone 17 Pro Max con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/apple/iphone-17-pro-max-256gb-azul/3004090.html",
    "description": "Compramos tu móvil El iPhone 17 Pro Max redefine la experiencia Pro con un diseño renovado de la isla de cámaras y una pantalla aún más grande que ofrece la máxima inmersión. Su panel Super Retina XDR Pro de 6,9 pulgadas, con tecnología ProMotion hasta 120 Hz y un brillo máximo de 3.000 nits, garantiza una calidad de imagen espectacular en cualquier entorno. En su interior, el chip A19 Pro marca un salto de potencia…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 Pro Max con 5G",
      "ean": "1233004090213",
      "description": "Compramos tu móvil El iPhone 17 Pro Max redefine la experiencia Pro con un diseño renovado de la isla de cámaras y una pantalla aún más grande que ofrece la máxima inmersión. Su panel Super Retina XDR Pro de 6,9 pulgadas, con tecnología ProMotion hasta 120 Hz y un brillo máximo de 3.000 nits, garantiza una calidad de imagen espectacular en cualquier entorno. En su interior, el chip A19 Pro marca un salto de potencia…",
      "model": "iPhone 17 Pro Max con 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004091",
    "sku": "SRC_3004091",
    "title": "Apple iPhone 17 Pro Max con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/apple/iphone-17-pro-max-256gb-naranja/3004091.html",
    "description": "Compramos tu móvil El iPhone 17 Pro Max redefine la experiencia Pro con un diseño renovado de la isla de cámaras y una pantalla aún más grande que ofrece la máxima inmersión. Su panel Super Retina XDR Pro de 6,9 pulgadas, con tecnología ProMotion hasta 120 Hz y un brillo máximo de 3.000 nits, garantiza una calidad de imagen espectacular en cualquier entorno. En su interior, el chip A19 Pro marca un salto de potencia…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17 Pro Max con 5G",
      "ean": "1233004091159",
      "description": "Compramos tu móvil El iPhone 17 Pro Max redefine la experiencia Pro con un diseño renovado de la isla de cámaras y una pantalla aún más grande que ofrece la máxima inmersión. Su panel Super Retina XDR Pro de 6,9 pulgadas, con tecnología ProMotion hasta 120 Hz y un brillo máximo de 3.000 nits, garantiza una calidad de imagen espectacular en cualquier entorno. En su interior, el chip A19 Pro marca un salto de potencia…",
      "model": "iPhone 17 Pro Max con 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004277",
    "sku": "SRC_3004277",
    "title": "Apple iPhone 17e con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/apple/iphone-17e-256gb-negro/3004277.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPhone 17e 256 GB con 5G Ficha técnica 5 - 26 W USB PD Este producto se vende sin cargador incluido. La potencia del cargador debe ser entre un mínimo de 4.5 vatios y un máximo de 26 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 €…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17e con 5G",
      "ean": "1233004277317",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPhone 17e 256 GB con 5G Ficha técnica 5 - 26 W USB PD Este producto se vende sin cargador incluido. La potencia del cargador debe ser entre un mínimo de 4.5 vatios y un máximo de 26 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 €…",
      "model": "iPhone 17e con 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004279",
    "sku": "SRC_3004279",
    "title": "Apple iPhone 17e con 5G",
    "brand": "Apple",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/apple/iphone-17e-256gb-rosa/3004279.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPhone 17e 256 GB con 5G Ficha técnica 5 - 26 W USB PD Este producto se vende sin cargador incluido. La potencia del cargador debe ser entre un mínimo de 4.5 vatios y un máximo de 26 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 €…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPhone 17e con 5G",
      "ean": "1233004279236",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPhone 17e 256 GB con 5G Ficha técnica 5 - 26 W USB PD Este producto se vende sin cargador incluido. La potencia del cargador debe ser entre un mínimo de 4.5 vatios y un máximo de 26 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 €…",
      "model": "iPhone 17e con 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711297",
    "sku": "SRC_3711297",
    "title": "Apple iPad Air M4 Wifi 11",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.mediamarkt.es/tablets/apple/ipad-air-m4-wifi-11-128gb-azul/3711297.html",
    "description": "El iPad Air de 11 pulgadas ha sido diseñado para sacar el máximo partido a Apple Intelligence y ahora incorpora la potencia del chip M4 de Apple, ofreciendo un rendimiento aún más avanzado para todo tipo de tareas. Su espectacular pantalla Liquid Retina proporciona una calidad visual excepcional, con colores vivos, gran nivel de detalle y una experiencia envolvente tanto para trabajar como para disfrutar de contenido…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Air M4 Wifi 11",
      "ean": "1233711297783",
      "description": "El iPad Air de 11 pulgadas ha sido diseñado para sacar el máximo partido a Apple Intelligence y ahora incorpora la potencia del chip M4 de Apple, ofreciendo un rendimiento aún más avanzado para todo tipo de tareas. Su espectacular pantalla Liquid Retina proporciona una calidad visual excepcional, con colores vivos, gran nivel de detalle y una experiencia envolvente tanto para trabajar como para disfrutar de contenido…",
      "model": "iPad Air M4 Wifi 11",
      "connectivity": "Wifi / Bluetooth",
      "bluetooth": "Yes",
      "weight": "464gr",
      "dimensions": "247.6 x 178.5 x 6.1mm",
      "storage": "128GB",
      "ram": "12GB",
      "displaySize": "11p",
      "resolution": "1640 x 2360",
      "panelTechnology": "Liquid Retina IPS LCD",
      "batteryTechnology": "Li-Ion"
    },
    "warnings": []
  },
  {
    "id": "source-catalog-3711299",
    "sku": "SRC_3711299",
    "title": "Apple iPad Air M4 Wifi 13",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.mediamarkt.es/tablets/apple/ipad-air-m4-wifi-13-128gb-gris/3711299.html",
    "description": "El iPad Air de 13 pulgadas ha sido diseñado para sacar el máximo partido a Apple Intelligence y ahora incorpora la potencia del chip M4 de Apple, ofreciendo un rendimiento aún más avanzado para todo tipo de tareas. Su espectacular pantalla Liquid Retina proporciona una calidad visual excepcional, con colores vivos, gran nivel de detalle y una experiencia envolvente tanto para trabajar como para disfrutar de contenido…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Air M4 Wifi 13",
      "ean": "1233711299329",
      "description": "El iPad Air de 13 pulgadas ha sido diseñado para sacar el máximo partido a Apple Intelligence y ahora incorpora la potencia del chip M4 de Apple, ofreciendo un rendimiento aún más avanzado para todo tipo de tareas. Su espectacular pantalla Liquid Retina proporciona una calidad visual excepcional, con colores vivos, gran nivel de detalle y una experiencia envolvente tanto para trabajar como para disfrutar de contenido…",
      "model": "iPad Air M4 Wifi 13",
      "connectivity": "Wifi / Bluetooth",
      "bluetooth": "Yes",
      "weight": "616gr",
      "dimensions": "280.6 x 214.9 x 6.1mm",
      "storage": "128GB",
      "ram": "12GB",
      "displaySize": "13p",
      "resolution": "2048 x 2732",
      "panelTechnology": "Liquid Retina IPS LCD",
      "batteryTechnology": "Li-Ion"
    },
    "warnings": []
  },
  {
    "id": "source-catalog-3711223",
    "sku": "SRC_3711223",
    "title": "Apple iPad Pro M5",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.mediamarkt.es/tablets/apple/ipad-pro-m5-11-256gb-wifi-negro/3711223.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Pro M5 11 256 GB Wifi La potencia del cargador debe ser entre un mínimo de 15 vatios y un máximo de 45 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Total en 48 plazos: 984€ Ahorra 115€ vs PVPr Vendido y enviad…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Pro M5",
      "ean": "1233711223010",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Pro M5 11 256 GB Wifi La potencia del cargador debe ser entre un mínimo de 15 vatios y un máximo de 45 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Total en 48 plazos: 984€ Ahorra 115€ vs PVPr Vendido y enviad…",
      "model": "iPad Pro M5",
      "connectivity": "Wifi / Bluetooth",
      "bluetooth": "Yes",
      "weight": "444gr",
      "dimensions": "249.7 x 177.5 x 5.3mm",
      "storage": "256GB",
      "ram": "8GB",
      "displaySize": "11p",
      "resolution": "1668 x 2420",
      "panelTechnology": "Ultra Retina Tandem OLED",
      "batteryTechnology": "Li-Po"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711018",
    "sku": "SRC_3711018",
    "title": "Apple iPad Wifi 11 2025",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.mediamarkt.es/tablets/apple/ipad-wifi-11-2025-128gb-plata/3711018.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Wifi 11 2025 128 GB Ficha técnica La potencia del cargador debe ser entre un mínimo de 15 vatios y un máximo de 45 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Vendido y enviado por Source catalog Entrega desde lun, 2…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Wifi 11 2025",
      "ean": "1233711018135",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Wifi 11 2025 128 GB Ficha técnica La potencia del cargador debe ser entre un mínimo de 15 vatios y un máximo de 45 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Vendido y enviado por Source catalog Entrega desde lun, 2…",
      "model": "iPad Wifi 11 2025",
      "connectivity": "Wifi / Bluetooth",
      "bluetooth": "Yes",
      "weight": "477gr",
      "dimensions": "248.6 x 179.5 x 7 mmmm",
      "storage": "128GB",
      "displaySize": "11p",
      "resolution": "1640 x 2360",
      "panelTechnology": "Liquid Retina IPS LCD",
      "batteryTechnology": "Li-Ion"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3003898",
    "sku": "SRC_3003898",
    "title": "Apple iPad Wifi + Cellular 11 2025",
    "brand": "Apple",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.mediamarkt.es/tablets/apple/ipad-wifi-cellular-11-2025-128gb-plata/3003898.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Wifi+Cellular 11 2025 128 GB La potencia del cargador debe ser entre un mínimo de 15 vatios y un máximo de 45 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Total en 48 plazos: 504€ Ahorra 65€ vs PVPr Vendido y…",
    "attributes": {
      "brand": "Apple",
      "productName": "Apple iPad Wifi + Cellular 11 2025",
      "ean": "1233003898131",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Apple iPad Wifi+Cellular 11 2025 128 GB La potencia del cargador debe ser entre un mínimo de 15 vatios y un máximo de 45 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Total en 48 plazos: 504€ Ahorra 65€ vs PVPr Vendido y…",
      "model": "iPad Wifi + Cellular 11 2025",
      "connectivity": "Wifi / Bluetooth",
      "bluetooth": "Yes",
      "weight": "481gr",
      "dimensions": "248.6 x 179.5 x 7 mmmm",
      "storage": "128GB",
      "displaySize": "11p",
      "resolution": "1640 x 2360",
      "panelTechnology": "Liquid Retina IPS LCD",
      "batteryTechnology": "Li-Ion"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711229",
    "sku": "SRC_3711229",
    "title": "Lenovo Idea Tab 11 256 GB",
    "brand": "Lenovo",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.mediamarkt.es/tablets/lenovo/idea-tab-11-wifi-256gb-gris/3711229.html",
    "description": "Lenovo Idea Tab 11 Wifi es una tablet versátil y ligera diseñada para ofrecer un rendimiento equilibrado tanto en entretenimiento como en productividad. Incorpora un procesador MediaTek Dimensity 6300 de ocho núcleos y una GPU Arm Mali-G57 MC2, que garantizan un funcionamiento fluido en aplicaciones, navegación y contenidos multimedia. Esta versión incluye 8 GB de memoria RAM LPDDR4x y 256 GB de almacenamiento UFS 2.…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Idea Tab 11 256 GB",
      "ean": "1233711229340",
      "description": "Lenovo Idea Tab 11 Wifi es una tablet versátil y ligera diseñada para ofrecer un rendimiento equilibrado tanto en entretenimiento como en productividad. Incorpora un procesador MediaTek Dimensity 6300 de ocho núcleos y una GPU Arm Mali-G57 MC2, que garantizan un funcionamiento fluido en aplicaciones, navegación y contenidos multimedia. Esta versión incluye 8 GB de memoria RAM LPDDR4x y 256 GB de almacenamiento UFS 2.…",
      "model": "Idea Tab 11 256 GB",
      "connectivity": "Wifi / Bluetooth",
      "bluetooth": "Yes",
      "usbC": "Yes",
      "weight": "480gr",
      "dimensions": "254.59 x 166.15 x 6.99mm",
      "storage": "256GB",
      "ram": "8GB",
      "displaySize": "11p",
      "panelTechnology": "IPS LCD",
      "batteryTechnology": "Li-Ion"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711198",
    "sku": "SRC_3711198",
    "title": "Samsung Galaxy Tab A11+ Wifi",
    "brand": "Samsung",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.mediamarkt.es/tablets/samsung/galaxy-tab-a11-plus-wifi-128gb-gris/3711198.html",
    "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Samsung Samsung Galaxy Tab A11 Plus Wifi La potencia del cargador debe ser entre un mínimo de 15 vatios y un máximo de 25 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Total en 48 plazos: 192€ Ahorra 87€ vs PVPr Vendido y…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy Tab A11+ Wifi",
      "ean": "1233711198141",
      "description": "Disponibles otras opciones de compra que te permiten personalizar tus cuotas: pago flexible. Samsung Samsung Galaxy Tab A11 Plus Wifi La potencia del cargador debe ser entre un mínimo de 15 vatios y un máximo de 25 vatios para alcanzar la máxima velocidad de carga. Compatible USB-PD. [98546fe31bef9e932db752e05f]]) Ver Opiniones En 48 plazos Desde +0 € pago inicial Total en 48 plazos: 192€ Ahorra 87€ vs PVPr Vendido y…",
      "model": "Galaxy Tab A11+ Wifi",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711109",
    "sku": "SRC_3711109",
    "title": "Samsung Galaxy Tab S11 Ultra",
    "brand": "Samsung",
    "categoryPath": [
      "Tablets",
      "Mobile tablets"
    ],
    "schemaId": "schema-tablets",
    "sourceUrl": "https://www.mediamarkt.es/tablets/samsung/galaxy-tab-s11-ultra-wifi-256gb/3711109.html",
    "description": "Samsung Galaxy Tab S11 Ultra se presenta como una de las tablets más potentes y sofisticadas del mercado. Con un diseño extremadamente fino de tan solo 5,1 mm y un peso de 695 gramos, combina ligereza y resistencia en un cuerpo elegante. Su pantalla Dynamic AMOLED 2X de 14,6 pulgadas ofrece una resolución de 2960 x 1848 y una tasa de refresco de 120 Hz, garantizando una experiencia visual vibrante y fluida, ideal tan…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy Tab S11 Ultra",
      "ean": "1233711109147",
      "description": "Samsung Galaxy Tab S11 Ultra se presenta como una de las tablets más potentes y sofisticadas del mercado. Con un diseño extremadamente fino de tan solo 5,1 mm y un peso de 695 gramos, combina ligereza y resistencia en un cuerpo elegante. Su pantalla Dynamic AMOLED 2X de 14,6 pulgadas ofrece una resolución de 2960 x 1848 y una tasa de refresco de 120 Hz, garantizando una experiencia visual vibrante y fluida, ideal tan…",
      "model": "Galaxy Tab S11 Ultra",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711230",
    "sku": "SRC_3711230",
    "title": "HP Laptop AMD Ryzen 5",
    "brand": "HP",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.mediamarkt.es/portatiles/hp/laptop-15-amd-ryzen5-16gb-1tb-gris/3711230.html",
    "description": "El HP Laptop AMD Ryzen 5 16 GB + 1 TB es un ordenador portátil de 15,6 pulgadas diseñado para trabajar y estudiar con comodidad, combinando un rendimiento fiable con un diseño ligero y elegante. Equipado con un procesador AMD Ryzen 5 de cuatro núcleos, ofrece la potencia necesaria para tareas diarias, ofimática, navegación y uso multitarea. Dispone de 16 GB de memoria y 1 TB de espacio, que garantiza tiempos de carga…",
    "attributes": {
      "brand": "HP",
      "productName": "HP Laptop AMD Ryzen 5",
      "ean": "1233711230100",
      "description": "El HP Laptop AMD Ryzen 5 16 GB + 1 TB es un ordenador portátil de 15,6 pulgadas diseñado para trabajar y estudiar con comodidad, combinando un rendimiento fiable con un diseño ligero y elegante. Equipado con un procesador AMD Ryzen 5 de cuatro núcleos, ofrece la potencia necesaria para tareas diarias, ofimática, navegación y uso multitarea. Dispone de 16 GB de memoria y 1 TB de espacio, que garantiza tiempos de carga…",
      "model": "Laptop AMD Ryzen 5",
      "connectivity": "Wifi / Bluetooth",
      "weight": "1670gr",
      "dimensions": "358.5 x 242 x 17.9mm",
      "storage": "1000GB",
      "ram": "16GB",
      "displaySize": "15.6p"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711104",
    "sku": "SRC_3711104",
    "title": "Lenovo Ideapad 3 13420H",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.mediamarkt.es/portatiles/lenovo/ideapad-3-13420h-gris/3711104.html",
    "description": "Lenovo IdeaPad 3 13ª Gen i5 13420H es un portátil equilibrado y eficiente, ideal para productividad, estudios y entretenimiento. Equipado con un procesador Intel Core i5-13420H de 8 núcleos, alcanza frecuencias de hasta 4,6 GHz, garantizando un rendimiento fluido en tareas multitarea y aplicaciones exigentes. Dispone de 16 GB de memoria RAM y 512 GB de almacenamiento SSD, lo que asegura arranques rápidos y espacio am…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Ideapad 3 13420H",
      "ean": "1233711104951",
      "description": "Lenovo IdeaPad 3 13ª Gen i5 13420H es un portátil equilibrado y eficiente, ideal para productividad, estudios y entretenimiento. Equipado con un procesador Intel Core i5-13420H de 8 núcleos, alcanza frecuencias de hasta 4,6 GHz, garantizando un rendimiento fluido en tareas multitarea y aplicaciones exigentes. Dispone de 16 GB de memoria RAM y 512 GB de almacenamiento SSD, lo que asegura arranques rápidos y espacio am…",
      "model": "Ideapad 3 13420H",
      "connectivity": "Wifi / Bluetooth",
      "weight": "1620gr",
      "dimensions": "359.3 x 235 x 17.9mm",
      "storage": "512GB",
      "ram": "16GB",
      "displaySize": "15.6p"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711237",
    "sku": "SRC_3711237",
    "title": "Lenovo Ideapad 3 i3",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.mediamarkt.es/portatiles/lenovo/ideapad-3-i3-gris/3711237.html",
    "description": "Lenovo IdeaPad 3 i3 es un portátil diseñado para ofrecer un rendimiento equilibrado y fiable en el día a día, combinando agilidad en las tareas habituales con un diseño ligero y práctico. Incorpora un procesador Intel Core i3-N305 de ocho núcleos y gráficos Intel UHD, capaces de responder con fluidez en actividades como navegación web, documentos, videollamadas o reproducción multimedia. Esta configuración incluye 8…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Ideapad 3 i3",
      "ean": "1233711237215",
      "description": "Lenovo IdeaPad 3 i3 es un portátil diseñado para ofrecer un rendimiento equilibrado y fiable en el día a día, combinando agilidad en las tareas habituales con un diseño ligero y práctico. Incorpora un procesador Intel Core i3-N305 de ocho núcleos y gráficos Intel UHD, capaces de responder con fluidez en actividades como navegación web, documentos, videollamadas o reproducción multimedia. Esta configuración incluye 8…",
      "model": "Ideapad 3 i3",
      "connectivity": "Wifi / Bluetooth",
      "weight": "1550gr",
      "dimensions": "362.2 x 253.4 x 19.9mm",
      "storage": "256GB",
      "ram": "8GB",
      "displaySize": "15.6p"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711105",
    "sku": "SRC_3711105",
    "title": "Lenovo IdeaPad 5 13620H",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.mediamarkt.es/portatiles/lenovo/ideapad-5-i7-13620h-16gb-1tb-gris/3711105.html",
    "description": "El portátil Lenovo IdeaPad 5 13620H 13Gen incorpora el potente procesador Intel Core i7-13620H de 10 núcleos (6 de alto rendimiento y 4 de eficiencia), capaz de alcanzar hasta 4,9 GHz, acompañado de gráficos integrados Intel UHD, ofreciendo un alto rendimiento tanto en multitarea como en tareas exigentes. Cuenta con 16 GB de memoria DDR5 a 5600 MHz en configuración de doble canal y un veloz almacenamiento SSD de 1 TB…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo IdeaPad 5 13620H",
      "ean": "1233711105453",
      "description": "El portátil Lenovo IdeaPad 5 13620H 13Gen incorpora el potente procesador Intel Core i7-13620H de 10 núcleos (6 de alto rendimiento y 4 de eficiencia), capaz de alcanzar hasta 4,9 GHz, acompañado de gráficos integrados Intel UHD, ofreciendo un alto rendimiento tanto en multitarea como en tareas exigentes. Cuenta con 16 GB de memoria DDR5 a 5600 MHz en configuración de doble canal y un veloz almacenamiento SSD de 1 TB…",
      "model": "IdeaPad 5 13620H",
      "connectivity": "Wifi / Bluetooth",
      "weight": "1810gr",
      "dimensions": "356.5 x 250.6 x 16.9mm",
      "storage": "1000GB",
      "ram": "16GB",
      "displaySize": "16p"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711261",
    "sku": "SRC_3711261",
    "title": "Lenovo Portátil ThinkBook 14 iULTRA5",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.mediamarkt.es/portatiles/lenovo/portatil-thinkbook-iultra5-512gb-gris/3711261.html",
    "description": "El Lenovo ThinkBook 14 iULTRA5 es un portátil profesional diseñado para ofrecer un equilibrio perfecto entre rendimiento, portabilidad y seguridad, ideal para entornos de trabajo exigentes. Incorpora un procesador Intel Core Ultra 5 con arquitectura híbrida de 12 núcleos y hasta 4,8 GHz, junto con aceleración de inteligencia artificial mediante Intel AI Boost, lo que permite un funcionamiento fluido en tareas multita…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Portátil ThinkBook 14 iULTRA5",
      "ean": "1233711261876",
      "description": "El Lenovo ThinkBook 14 iULTRA5 es un portátil profesional diseñado para ofrecer un equilibrio perfecto entre rendimiento, portabilidad y seguridad, ideal para entornos de trabajo exigentes. Incorpora un procesador Intel Core Ultra 5 con arquitectura híbrida de 12 núcleos y hasta 4,8 GHz, junto con aceleración de inteligencia artificial mediante Intel AI Boost, lo que permite un funcionamiento fluido en tareas multita…",
      "model": "Portátil ThinkBook 14 iULTRA5",
      "connectivity": "Wifi",
      "weight": "1360gr",
      "dimensions": "313.5 x 224 x 17.5mm",
      "storage": "512GB",
      "displaySize": "14p"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3711262",
    "sku": "SRC_3711262",
    "title": "Lenovo Portátil ThinkPad X1 iULTRA7",
    "brand": "Lenovo",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.mediamarkt.es/portatiles/lenovo/portatil-thinkpad-x1-iultra7-1tb-gris/3711262.html",
    "description": "El Lenovo ThinkPad X1 2-in-1 iUltra 7 es un portátil convertible de alto rendimiento diseñado para profesionales que buscan máxima movilidad, potencia y versatilidad en un solo dispositivo. Su formato 2-en-1 permite utilizarlo tanto como portátil tradicional como en modo tablet, facilitando el trabajo colaborativo. Integra un procesador Intel Core Ultra 7 255U de última generación, acompañado por 32 GB de memoria y u…",
    "attributes": {
      "brand": "Lenovo",
      "productName": "Lenovo Portátil ThinkPad X1 iULTRA7",
      "ean": "1233711262125",
      "description": "El Lenovo ThinkPad X1 2-in-1 iUltra 7 es un portátil convertible de alto rendimiento diseñado para profesionales que buscan máxima movilidad, potencia y versatilidad en un solo dispositivo. Su formato 2-en-1 permite utilizarlo tanto como portátil tradicional como en modo tablet, facilitando el trabajo colaborativo. Integra un procesador Intel Core Ultra 7 255U de última generación, acompañado por 32 GB de memoria y u…",
      "model": "Portátil ThinkPad X1 iULTRA7",
      "connectivity": "Wifi",
      "weight": "1220gr",
      "dimensions": "312.80 x 217.65 x 16.19mm",
      "storage": "1000GB",
      "displaySize": "14p"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3710960",
    "sku": "SRC_3710960",
    "title": "LG gram Book 15U50T",
    "brand": "LG",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.mediamarkt.es/portatiles/lg/gram-book-15u50t-i5-16gb-512gb-gris/3710960.html",
    "description": "El LG gram Book 15U50T es un portátil diseñado para ofrecer portabilidad, rendimiento y versatilidad. Su estructura ligera y resistente está fabricada con un chasis de composite de alta resistencia, presentando un diseño elegante en color gris con bordes redondeados. Este equipo incluye un procesador Intel Core i5 de 10 núcleos (2 de alto rendimiento y 8 de eficiencia), con frecuencias de hasta 4.6 GHz, acompañado po…",
    "attributes": {
      "brand": "LG",
      "productName": "LG gram Book 15U50T",
      "ean": "1233710960657",
      "description": "El LG gram Book 15U50T es un portátil diseñado para ofrecer portabilidad, rendimiento y versatilidad. Su estructura ligera y resistente está fabricada con un chasis de composite de alta resistencia, presentando un diseño elegante en color gris con bordes redondeados. Este equipo incluye un procesador Intel Core i5 de 10 núcleos (2 de alto rendimiento y 8 de eficiencia), con frecuencias de hasta 4.6 GHz, acompañado po…",
      "model": "gram Book 15U50T",
      "connectivity": "Wifi / Bluetooth",
      "weight": "1690gr",
      "dimensions": "359.8 x 237.8 x 18.9mm",
      "storage": "512GB",
      "ram": "16GB",
      "displaySize": "15.6p"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3240734",
    "sku": "SRC_3240734",
    "title": "Samsung Galaxy Book4 Edge 15 Office 365",
    "brand": "Samsung",
    "categoryPath": [
      "Computing",
      "Laptops"
    ],
    "schemaId": "schema-laptops",
    "sourceUrl": "https://www.mediamarkt.es/portatiles/samsung/galaxy-book4-edge-15-qc-512gb-office365-gris/3240734.html",
    "description": "El Samsung Galaxy Book4 Edge 15 QC 8CORE 512 GB con Office 365 es un portátil de última generación que combina potencia, ligereza y herramientas de productividad avanzadas. Integra el procesador Snapdragon X Plus de 8 núcleos, con frecuencias de hasta 3,8 GHz en modo Boost, acompañado por la GPU Qualcomm Adreno y una NPU Hexagon para funciones de inteligencia artificial. Incorpora 16 GB de memoria RAM LPDDR5X y 512 G…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy Book4 Edge 15 Office 365",
      "ean": "1233240734612",
      "description": "El Samsung Galaxy Book4 Edge 15 QC 8CORE 512 GB con Office 365 es un portátil de última generación que combina potencia, ligereza y herramientas de productividad avanzadas. Integra el procesador Snapdragon X Plus de 8 núcleos, con frecuencias de hasta 3,8 GHz en modo Boost, acompañado por la GPU Qualcomm Adreno y una NPU Hexagon para funciones de inteligencia artificial. Incorpora 16 GB de memoria RAM LPDDR5X y 512 G…",
      "model": "Galaxy Book4 Edge 15 Office 365",
      "connectivity": "Wifi / Bluetooth",
      "weight": "1500gr",
      "dimensions": "356,6 × 229,7 × 15,0mm",
      "storage": "512GB",
      "displaySize": "15.6p"
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004222",
    "sku": "SRC_3004222",
    "title": "Samsung Galaxy S26 5G",
    "brand": "Samsung",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/samsung/galaxy-s26-5g-256gb-morado/3004222.html",
    "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy S26 5G",
      "ean": "1233004222140",
      "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
      "model": "Galaxy S26 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  },
  {
    "id": "source-catalog-3004223",
    "sku": "SRC_3004223",
    "title": "Samsung Galaxy S26 5G",
    "brand": "Samsung",
    "categoryPath": [
      "Phones",
      "Smartphones"
    ],
    "schemaId": "schema-smartphones",
    "sourceUrl": "https://www.mediamarkt.es/moviles/samsung/galaxy-s26-5g-256gb-negro/3004223.html",
    "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
    "attributes": {
      "brand": "Samsung",
      "productName": "Samsung Galaxy S26 5G",
      "ean": "1233004223109",
      "description": "Vende tu móvil usado con Source catalog ¿Tienes un móvil que no utilizas? ¡Te lo compramos! ¿Cuánto vale tu móvil? Entra en https://www.backmarket.com/en-us/buyback elige la marca, modelo y capacidad, y te daremos una valoración según su estado. ¿Cómo funciona? 1. Compra tu nuevo móvil en Source catalog Solo necesitas haber comprado tu nuevo dispositivo con nosotros. 2. Solicita tu oferta Una vez lo tengas, entra en la web y completa el f…",
      "model": "Galaxy S26 5G",
      "connectivity": "Wifi / Bluetooth",
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
    },
    "warnings": [
      "Description contains storefront or promotional copy"
    ]
  }
] satisfies SourceCatalogImportedRow[]

function hasAttributeValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function getSchemaForProduct(schemaId: string) {
  return schemas.find((schema) => schema.id === schemaId) ?? null
}

function getMissingRequiredWarnings(row: SourceCatalogImportedRow) {
  const schema = getSchemaForProduct(row.schemaId)
  if (!schema) return ["Schema assignment missing"]

  return schema.requiredAttributes
    .filter((field) => !hasAttributeValue(row.attributes[field]))
    .map((field) => `${field} missing for ${schema.name}`)
}

function getInitialStatus(score: number, warnings: readonly string[]) {
  return score >= 90 && warnings.length === 0 ? "READY_FOR_REVIEW" : "NEEDS_ENRICHMENT"
}

function buildSourceCatalogImportedProducts(rows: readonly SourceCatalogImportedRow[]): ProductRecord[] {
  return rows.map((row): ProductRecord => {
    const extractedFields = Object.fromEntries(
      Object.entries(row.attributes).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0),
    ) as EvidenceRecord["extractedFields"]
    const schema = getSchemaForProduct(row.schemaId)
    const warnings = [...row.warnings, ...getMissingRequiredWarnings(row)]

    const product: ProductRecord = {
      id: row.id,
      miraklProductId: row.sku,
      title: row.title,
      brand: row.brand,
      categoryPath: [...row.categoryPath],
      schemaId: row.schemaId,
      listingStatus: "NEEDS_ENRICHMENT",
      qualityScore: 0,
      scoreBand: "red",
      baselineDescription: row.description,
      warnings,
      baselineAttributes: row.attributes,
      bestEvidenceByField: extractedFields,
      evidence: [
        {
          id: `ev-${row.id}-source-catalog`,
          productId: row.id,
          aggregatorId: "source-catalog",
          sourceName: "Imported source catalog",
          sourceType: "partner_feed",
          sourceUrl: row.sourceUrl,
          title: `${row.title} imported source catalog record`,
          summary: "Imported electronics catalog record used as the electronics source catalog baseline.",
          extractedFields,
          capturedAt,
          confidence: "high",
        },
      ],
      candidates: [],
    }

    const scored = qualityScore(product, schema)
    product.qualityScore = scored.score
    product.scoreBand = scored.band
    product.listingStatus = getInitialStatus(scored.score, warnings)
    return product
  })
}

const sourceCatalogImportedProducts = buildSourceCatalogImportedProducts(sourceCatalogImportedRows)

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

baseProducts.push(...sourceCatalogImportedProducts)

for (const product of baseProducts) {
  const schema = getSchemaForProduct(product.schemaId)
  const scored = qualityScore(product, schema)
  product.qualityScore = scored.score
  product.scoreBand = scored.band
  if (product.listingStatus !== "EXPORT_READY" && product.listingStatus !== "RESEARCH_IN_PROGRESS") {
    product.listingStatus = getInitialStatus(scored.score, product.warnings)
  }
}

export const products: ProductRecord[] = structuredClone(baseProducts)
export const mockContractMetadata = {
  version: MOCK_DOMAIN_CONTRACT_VERSION,
  stateOwnership: MOCK_STATE_OWNERSHIP,
}

export const heroProductId = "freeclip-2"
export const heroProduct = products.find((product) => product.id === heroProductId)!
