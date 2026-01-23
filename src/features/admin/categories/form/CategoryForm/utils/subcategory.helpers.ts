/**
 * Utilitários para operações com subcategorias
 * Local: src/features/admin/categories/form/CategoryForm/utils/subcategory.helpers.ts
 */

/**
 * Valida se é possível criar uma subcategoria
 * @param categoryName Nome da categoria pai
 * @returns boolean - true se pode criar subcategoria
 */
export function canCreateSubcategory(categoryName: string): boolean {
  return categoryName.trim().length > 0;
}

/**
 * Valida o nível máximo de aninhamento (máximo 4 níveis)
 * @param currentLevel Nível atual da subcategoria
 * @returns boolean - true se pode adicionar mais níveis
 */
export function canAddMoreLevels(currentLevel: number): boolean {
  return currentLevel < 4;
}

/**
 * Gera um ID único para nova subcategoria
 * @returns string - ID no formato 'subcat-xxxx'
 */
export function generateSubcategoryId(): string {
  return `subcat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula o próximo nível baseado no pai selecionado
 * @param parentId ID da subcategoria pai (opcional)
 * @param subcategories Lista de todas as subcategorias
 * @returns number - Nível da nova subcategoria (1-4)
 */
export function calculateNextLevel(
  parentId: string | undefined,
  subcategories: Array<{ id: string; level: number }>
): number {
  if (!parentId) return 1; // Nível 1 se não tem pai
  
  const parent = subcategories.find(s => s.id === parentId);
  return parent ? parent.level + 1 : 1;
}

/**
 * Valida se um nome de subcategoria é válido
 * @param name Nome da subcategoria
 * @returns { isValid: boolean; error?: string }
 */
export function validateSubcategoryName(name: string): { isValid: boolean; error?: string } {
  if (name.trim().length === 0) {
    return { isValid: false, error: 'O nome da subcategoria é obrigatório' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'O nome deve ter pelo menos 2 caracteres' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: 'O nome deve ter no máximo 50 caracteres' };
  }
  
  return { isValid: true };
}