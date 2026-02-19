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
  },

  /**
   * Deleta categoria via API
   * @param id - ID da categoria
   * @param type - 'soft' para soft delete ou 'hard' para delete permanente
   */
  async deleteCategory(id: string, type: 'soft' | 'hard' = 'soft') {
    console.log(`[categoryService.deleteCategory] Iniciando delete ID: ${id}, tipo: ${type}`)
    
    try {
      const url = `/api/admin/categories/${id}`
      console.log(`[categoryService.deleteCategory] Fazendo requisição para: ${url}`)
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      console.log(`[categoryService.deleteCategory] Status da resposta: ${res.status} ${res.statusText}`)

      if (!res.ok) {
        const text = await res.text()
        console.error(`[categoryService.deleteCategory] Erro na resposta:`, text)
        throw new Error(text || `Erro HTTP ${res.status} ao deletar categoria`)
      }

      const json = await res.json()
      console.log(`[categoryService.deleteCategory] Resposta JSON:`, json)
      
      if (json && json.success && json.data) {
        console.log(`[categoryService.deleteCategory] Delete bem-sucedido`)
        return json.data
      }
      
      console.log(`[categoryService.deleteCategory] Resposta sem sucesso:`, json)
      return json
    } catch (error) {
      console.error(`[categoryService.deleteCategory] Exceção:`, error)
      throw error
    }
  },

  /**
   * Restaura (ativa) uma categoria inativa via API
   * @param id - ID da categoria a restaurar
   */
  async restoreCategory(id: string) {
    console.log(`[categoryService.restoreCategory] Iniciando restore ID: ${id}`)
    
    try {
      const url = `/api/admin/categories/${id}`
      console.log(`[categoryService.restoreCategory] Fazendo requisição para: ${url}`)
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'restore' })
      })

      console.log(`[categoryService.restoreCategory] Status da resposta: ${res.status} ${res.statusText}`)

      if (!res.ok) {
        const text = await res.text()
        console.error(`[categoryService.restoreCategory] Erro na resposta:`, text)
        throw new Error(text || `Erro HTTP ${res.status} ao restaurar categoria`)
      }

      const json = await res.json()
      console.log(`[categoryService.restoreCategory] Resposta JSON:`, json)
      
      if (json && json.success && json.data) {
        console.log(`[categoryService.restoreCategory] Restore bem-sucedido`)
        return json.data
      }
      
      console.log(`[categoryService.restoreCategory] Resposta sem sucesso:`, json)
      return json
    } catch (error) {
      console.error(`[categoryService.restoreCategory] Exceção:`, error)
      throw error
    }
  },

  /**
   * Atualiza uma categoria existente via API
   * @param id - ID da categoria
   * @param data - Dados atualizados da categoria
   */
  async updateCategory(id: string, data: any) {
    console.log(`[categoryService.updateCategory] 📝 Atualizando categoria ID: ${id}`)
    
    try {
      const url = `/api/admin/categories/${id}`
      console.log(`[categoryService.updateCategory] 📤 Fazendo requisição PATCH para: ${url}`)
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      console.log(`[categoryService.updateCategory] 📥 Status da resposta: ${res.status} ${res.statusText}`)

      if (!res.ok) {
        const text = await res.text()
        console.error(`[categoryService.updateCategory] ❌ Erro na resposta:`, text)
        throw new Error(text || `Erro HTTP ${res.status} ao atualizar categoria`)
      }

      const json = await res.json()
      console.log(`[categoryService.updateCategory] ✅ Resposta JSON recebida:`, json)
      
      if (json && json.success && json.data) {
        console.log(`[categoryService.updateCategory] 🎉 Atualização bem-sucedida para:`, json.data.name)
        return json.data
      }
      
      console.log(`[categoryService.updateCategory] ⚠️ Resposta sem sucesso:`, json)
      return json
    } catch (error) {
      console.error(`[categoryService.updateCategory] ❌ Exceção:`, error)
      throw error
    }
  }
}