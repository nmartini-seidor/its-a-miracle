import { aggregators, schemas } from "../lib/fixtures.ts"
import { MOCK_DOMAIN_CONTRACT_VERSION } from "../lib/demo-contract.ts"
import { getStoredProduct, getStoredSettings, listStoredProducts } from "./store.ts"

export async function listProducts() {
  return listStoredProducts()
}

export async function getProduct(id: string) {
  return getStoredProduct(id)
}

export async function listSchemas() {
  return schemas
}

export async function listAggregators() {
  return aggregators
}

export async function getDemoSettings() {
  return getStoredSettings()
}

export async function getMockContractVersion() {
  return MOCK_DOMAIN_CONTRACT_VERSION
}

export async function getSchemaById(id: string) {
  return schemas.find((schema) => schema.id === id) ?? null
}
