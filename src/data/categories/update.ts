// src/data/categories/update.ts
export const updateCategory = async (id: string, data: Partial<any>) => {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) throw new Error('Erro ao atualizar categoria')
  return response.json()
}