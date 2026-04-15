import { products } from "@/lib/fixtures"

export async function listProducts() {
  return products
}

export async function getProduct(id: string) {
  return products.find((product) => product.id === id) ?? null
}
