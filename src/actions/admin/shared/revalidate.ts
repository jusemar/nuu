"use server"

import { revalidatePath } from "next/cache"

export async function revalidateCategories() {
  revalidatePath('/admin/categories')
}

// Futuramente pode adicionar:
export async function revalidateProducts() {
  revalidatePath('/admin/products')
}