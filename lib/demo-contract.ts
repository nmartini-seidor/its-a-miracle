import type { AggregatorDefinition, AttributeFieldId, ContractFieldId, SchemaDefinition } from "./types.ts"

export const MOCK_DOMAIN_CONTRACT_VERSION = "2026-04-task1"

export const ATTRIBUTE_FIELD_LABELS: Record<ContractFieldId, string> = {
  brand: "Brand",
  productName: "Product name",
  ean: "EAN",
  connectivity: "Connectivity",
  bluetooth: "Bluetooth",
  bluetoothVersion: "Bluetooth version",
  usbC: "USB-C",
  weight: "Weight",
  batteryLife: "Battery life",
  batteryTechnology: "Battery technology",
  dimensions: "Dimensions",
  compatibility: "Compatibility",
  noiseReduction: "Noise reduction",
  microphone: "Microphone",
  model: "Model",
  storage: "Storage",
  ram: "RAM",
  displaySize: "Display size",
  resolution: "Resolution",
  panelTechnology: "Panel technology",
  refreshRate: "Refresh rate",
  hdmiPorts: "HDMI ports",
  stylusSupport: "Stylus support",
  batteryCapacity: "Battery capacity",
  cameraResolution: "Camera resolution",
  description: "Description",
  researchSummary: "Research summary",
}

export const EXPORTABLE_ATTRIBUTE_FIELDS: AttributeFieldId[] = [
  "brand",
  "ean",
  "connectivity",
  "bluetooth",
  "bluetoothVersion",
  "usbC",
  "weight",
  "batteryLife",
  "batteryTechnology",
  "dimensions",
  "compatibility",
  "noiseReduction",
  "microphone",
  "model",
  "storage",
  "ram",
  "displaySize",
  "resolution",
  "panelTechnology",
  "refreshRate",
  "hdmiPorts",
  "stylusSupport",
  "batteryCapacity",
  "cameraResolution",
  "description",
]

export const MOCK_STATE_OWNERSHIP = {
  serverFetchedMockApiData: [
    "products",
    "schemas",
    "aggregators",
    "settingsSnapshot",
    "researchJobs",
    "exportPreview",
  ],
  clientLocalUiState: [
    "activeCompareTab",
    "reviewActionToast",
    "exportPreviewVisibility",
    "requestInFlightFlags",
  ],
  derivedSelectors: [
    "productsNeedingReview",
    "heroProductRecord",
    "bestEvidenceBadgeLabels",
    "exportEligibleCandidates",
  ],
} as const

export const MOCK_CONTRACT_COMPATIBILITY_CHECKS = [
  "Bump MOCK_DOMAIN_CONTRACT_VERSION whenever canonical entity shapes change.",
  "Update all touched route handlers, selectors, and fixture builders to the new contract.",
  "Re-run lint, typecheck, tests, and task-specific Playwright QA after a contract shape change.",
  "Confirm no touched files retain Orange-specific terminology, selectors, or user-facing copy.",
] as const

export const DEMO_AGGREGATOR_BLUEPRINTS: ReadonlyArray<Pick<AggregatorDefinition, "id" | "name" | "type">> = [
  { id: "official-manufacturer", name: "Official manufacturer", type: "manufacturer" },
  { id: "trusted-retailer", name: "Trusted retailer", type: "retailer" },
  { id: "spec-database", name: "Specification database", type: "spec_database" },
  { id: "marketplace-listing", name: "Marketplace listing", type: "marketplace" },
  { id: "internal-reference", name: "Internal reference library", type: "internal_reference" },
] as const

export const DEMO_SCHEMA_BLUEPRINTS: ReadonlyArray<Pick<SchemaDefinition, "id" | "slug" | "name">> = [
  { id: "schema-headphones-earbuds", slug: "headphones-earbuds", name: "Headphones & Earbuds" },
  { id: "schema-smartphones", slug: "smartphones", name: "Smartphones" },
  { id: "schema-televisions", slug: "televisions", name: "Televisions" },
  { id: "schema-tablets", slug: "tablets", name: "Tablets" },
  { id: "schema-laptops", slug: "laptops", name: "Laptops" },
] as const

export function isSupportedMockContractVersion(version: string) {
  return version === MOCK_DOMAIN_CONTRACT_VERSION
}

export function isAttributeFieldId(field: string): field is AttributeFieldId {
  return field in ATTRIBUTE_FIELD_LABELS && field !== "researchSummary"
}

export function isExportableAttributeField(field: ContractFieldId): field is AttributeFieldId {
  return EXPORTABLE_ATTRIBUTE_FIELDS.includes(field as AttributeFieldId)
}

export function getFieldLabel(field: ContractFieldId) {
  return ATTRIBUTE_FIELD_LABELS[field]
}
