// Client-side categoryService: thin wrapper that calls the server API
// This file runs in the browser and must not import server-only modules (db, drizzle, etc.).
// The server performs the DB transaction in the POST handler at `/api/admin/categories`.

export const categoryService = {
  /**
   * Cria categoria (e subcategorias) via API
   * @param data - objeto com estrutura compatível: { name, slug, description?, isActive?, metaTitle?, metaDescription?, orderIndex?, subcategories?: HierarchicalSubcategory[] }
   */
  async createCategory(data: any) {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Erro ao criar categoria')
    }

    const json = await res.json()
    // A API retorna { success: true, data } — devolvemos o `data` para o cliente
    if (json && json.success && json.data) return json.data
    return json
  }
}

