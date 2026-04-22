import { aggregators, demoSettings, schemas } from "../lib/fixtures.ts"
import { MOCK_DOMAIN_CONTRACT_VERSION } from "../lib/demo-contract.ts"
import { getStoredProduct, listStoredProducts } from "./store.ts"

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
  return demoSettings
}

export async function getMockContractVersion() {
  return MOCK_DOMAIN_CONTRACT_VERSION
}
