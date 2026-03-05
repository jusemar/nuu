// =====================================================================
// COMPONENTE: CategoryTreeSelector
// =====================================================================
// Este componente é um seletor de categorias em formato de árvore.
// Ele permite que o usuário navegue por categorias e subcategorias
// de forma hierárquica, expandindo e recolhendo os níveis.
//
// ARQUITETURA: Feature-based (modular por domínio)
// TECNOLOGIAS: Next.js, TanStack Query, Tailwind, TypeScript
//
// COMO FUNCIONA:
// 1. O usuário clica no campo para abrir o modal
// 2. As categorias são carregadas do banco via hook useCategoryList (lista plana)
// 3. A função buildTreeFromFlat converte a lista plana em árvore
// 4. O usuário navega clicando nos chevrons para expandir/recolher
// 5. Ao clicar em uma categoria, ela é selecionada e o modal fecha
// 6. O caminho completo é exibido no campo e no badge de confirmação
// 7. A busca filtra as categorias em tempo real enquanto o usuário digita
// =====================================================================

"use client"

import React, { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Tag, X, Check, Search, FolderTree, Folder } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCategoryList } from '@/features/admin/categories/hooks/useCategoryList'

// =====================================================================
// TIPO: CategoryTreeSelectorProps
// =====================================================================
// Define as props que o componente recebe:
// - value: ID da categoria selecionada (opcional)
// - onChange: Função chamada quando uma categoria é selecionada
// =====================================================================
interface CategoryTreeSelectorProps {
  value?: string | null
  onChange?: (categoryId: string, categoryPath: any[]) => void
}

export function CategoryTreeSelector({ value, onChange }: CategoryTreeSelectorProps) {
  // =====================================================================
  // ESTADOS DO COMPONENTE
  // =====================================================================
  // isOpen: Controla se o modal está aberto ou fechado
  // selected: Categoria atualmente selecionada
  // expandedItems: Conjunto de IDs das categorias que estão expandidas
  // path: Caminho completo da categoria selecionada (para exibir no breadcrumb)
  // searchTerm: Termo digitado na busca
  // =====================================================================
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [path, setPath] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // =====================================================================
  // HOOK: useCategoryList
  // =====================================================================
  // Busca todas as categorias do banco (retorna LISTA PLANA)
  // O hook retorna:
  // - data: Array de categorias (sem hierarquia)
  // - isLoading: Estado de carregamento
  // - error: Erro, se houver
  // =====================================================================
  const { data: categories, isLoading } = useCategoryList()

  // =====================================================================
  // FILTRO DE BUSCA
  // =====================================================================
  // Filtra as categorias que contêm o termo de busca no nome.
  // Usa useMemo para evitar recálculos desnecessários a cada renderização.
  // O filtro é case-insensitive (ignora maiúsculas/minúsculas).
  // =====================================================================
  const filteredCategories = useMemo(() => {
    if (!categories) return []
    if (!searchTerm.trim()) return categories
    
    const term = searchTerm.toLowerCase()
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(term)
    )
  }, [categories, searchTerm])

  // =====================================================================
  // FUNÇÃO: buildTreeFromFlat (COPIADA DO CategoryTreeTable)
  // =====================================================================
  // Converte uma lista plana de categorias em uma árvore hierárquica.
  // 
  // COMO FUNCIONA:
  // 1. Cria um mapa com todos os itens, indexados por ID
  // 2. Cada item recebe um array vazio 'children'
  // 3. Percorre o mapa novamente:
  //    - Se o item tem parentId, coloca ele no array children do pai
  //    - Se não tem parentId, é raiz (vai para o array roots)
  // 4. Retorna apenas as raízes (que já contêm todos os filhos aninhados)
  // =====================================================================
  const buildTreeFromFlat = (items: any[]): any[] => {
    const map = new Map<string, any>()

    // Passo 1: Cria um mapa com todos os itens
    items.forEach((item) => {
      map.set(item.id, {
        ...item,
        children: [], // Inicia com array vazio para os filhos
      })
    })

    const roots: any[] = []

    // Passo 2: Organiza em árvore
    map.forEach((node) => {
      if (node.parentId) {
        // Se tem pai, coloca no children do pai
        const parent = map.get(node.parentId)
        if (parent) {
          parent.children.push(node)
        } else {
          // Se não encontrar o pai (fallback), considera como raiz
          roots.push(node)
        }
      } else {
        // Se não tem pai, é raiz
        roots.push(node)
      }
    })

    return roots
  }

  // =====================================================================
  // CONVERSÃO DOS DADOS
  // =====================================================================
  // Converte a lista filtrada em árvore usando a função acima
  // =====================================================================
  const treeData = useMemo(() => {
    return buildTreeFromFlat(filteredCategories)
  }, [filteredCategories])

  // =====================================================================
  // FUNÇÃO: toggleExpand
  // =====================================================================
  // Alterna o estado de expansão de uma categoria.
  // Funciona igual ao CategoryTreeTable:
  // - Se o ID já está no Set, remove (recolhe)
  // - Se não está, adiciona (expande)
  // =====================================================================
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id) // Recolhe
      } else {
        next.add(id)    // Expande
      }
      return next
    })
  }

  // =====================================================================
  // FUNÇÃO: findPath
  // =====================================================================
  // Função recursiva que encontra o caminho completo até uma categoria.
  // Retorna um array com todas as categorias no caminho (da raiz até a selecionada).
  // Exemplo: [Eletrônicos, Informática, Notebooks]
  // =====================================================================
  const findPath = (cats: any[], id: string, currentPath: any[] = []): any[] | null => {
    for (const cat of cats) {
      const newPath = [...currentPath, cat]
      if (cat.id === id) return newPath
      if (cat.children) {
        const found = findPath(cat.children, id, newPath)
        if (found) return found
      }
    }
    return null
  }

  // =====================================================================
  // FUNÇÃO: handleSelect
  // =====================================================================
  // Chamada quando o usuário clica em uma categoria.
  // 1. Atualiza o estado 'selected' com a categoria escolhida
  // 2. Encontra o caminho completo e salva no estado 'path'
  // 3. Fecha o modal
  // 4. Chama a função onChange (se existir) passando o ID e o caminho
  // =====================================================================
  const handleSelect = (category: any) => {
    setSelected(category)
    if (treeData) {
      const fullPath = findPath(treeData, category.id) || []
      setPath(fullPath)
    }
    setIsOpen(false)
    
    if (onChange) {
      onChange(category.id, path)
    }
  }

  // =====================================================================
  // FUNÇÃO: handleClear
  // =====================================================================
  // Limpa a seleção atual:
  // - Remove a categoria selecionada
  // - Limpa o caminho
  // - Chama onChange com valores vazios
  // =====================================================================
  const handleClear = () => {
    setSelected(null)
    setPath([])
    if (onChange) {
      onChange('', [])
    }
  }

  // =====================================================================
  // COMPONENTE: Tree (recursivo)
  // =====================================================================
  // Este componente renderiza a árvore de categorias de forma recursiva.
  // 
  // COMO FUNCIONA:
  // 1. Recebe um array de categorias (items) e a profundidade atual (depth)
  // 2. Para cada categoria, verifica se tem filhos (hasChildren)
  // 3. Se tem filhos, mostra o botão de expandir/recolher
  // 4. A indentação é controlada pela profundidade (depth * 20px)
  // 5. Se a categoria está expandida, renderiza os filhos chamando a si mesmo
  // 
  // IGUAL ao TreeRow do CategoryTreeTable, mas adaptado para o seletor
  // =====================================================================
  const Tree = ({ items, depth = 0 }: { items: any[], depth?: number }) => {
    return (
      <>
        {items.map(item => {
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.has(item.id)
          const isSelected = selected?.id === item.id

          return (
            <div key={item.id}>
              {/* Linha da categoria atual */}
              <div
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                  ${isSelected 
                    ? 'bg-blue-100 border-2 border-blue-500' 
                    : 'hover:bg-slate-50 border-2 border-transparent'
                  }
                `}
                // Indentação baseada no nível (igual ao CategoryTreeTable)
                style={{ marginLeft: `${depth * 20}px` }}
              >
                {/* Botão de expandir - só aparece se tiver filhos */}
                {hasChildren ? (
                  <button 
                    onClick={() => toggleExpand(item.id)} 
                    className="p-0.5 hover:bg-slate-200 rounded"
                  >
                    {isExpanded 
                      ? <ChevronDown className="w-4 h-4 text-slate-600" /> 
                      : <ChevronRight className="w-4 h-4 text-slate-600" />
                    }
                  </button>
                ) : (
                  // Espaço vazio para alinhar itens sem filhos
                  <div className="w-5" />
                )}
                
                {/* Conteúdo da categoria - clicável para selecionar */}
                <button 
                  onClick={() => handleSelect(item)} 
                  className="flex-1 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    {/* Ícone: pasta para categorias com filhos, tag para sem filhos */}
                    {hasChildren ? (
                      <Folder className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-amber-500'}`} />
                    ) : (
                      <Tag className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    )}
                    {/* Nome da categoria */}
                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                    {/* Badge de nível */}
                    <span className="text-xs text-slate-400">Nível {item.level}</span>
                  </div>
                  {/* Check visível quando a categoria está selecionada */}
                  {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                </button>
              </div>

              {/* Renderiza os filhos recursivamente (se expandido) */}
              {hasChildren && isExpanded && (
                <div className="mt-1">
                  <Tree items={item.children} depth={depth + 1} />
                </div>
              )}
            </div>
          )
        })}
      </>
    )
  }

  // =====================================================================
  // ESTADO DE CARREGAMENTO
  // =====================================================================
  // Enquanto as categorias estão sendo carregadas, mostra um placeholder
  // =====================================================================
  if (isLoading) {
    return (
      <div className="border-2 border-slate-300 rounded-lg p-4 text-center text-slate-500">
        Carregando categorias...
      </div>
    )
  }

  // =====================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =====================================================================
  return (
    <div>
      {/* =================================================================
          CAMPO DE SELEÇÃO (VISÍVEL FORA DO MODAL)
          ================================================================= */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Categoria *
        </label>
        
        {/* Botão que abre o modal - mostra a categoria selecionada ou placeholder */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50/50 transition-all group bg-white"
        >
          {selected ? (
            // Se há categoria selecionada, mostra o nome e o caminho
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-slate-800">{selected.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {path.map(c => c.name).join(' > ')}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </div>
          ) : (
            // Placeholder quando nenhuma categoria está selecionada
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <FolderTree className="w-5 h-5" />
                <span>Selecione a categoria</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </div>
          )}
        </button>

        {/* Badge de confirmação - mostra a categoria selecionada em destaque */}
        {selected && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    Categoria Selecionada
                  </span>
                </div>
                {/* Breadcrumb com o caminho completo */}
                <div className="text-xs text-blue-700 space-y-0.5">
                  {path.map((cat, idx) => (
                    <div key={cat.id} className="flex items-center gap-1">
                      <span>{cat.name}</span>
                      {idx < path.length - 1 && <ChevronRight className="w-3 h-3" />}
                    </div>
                  ))}
                </div>
              </div>
              {/* Botão para limpar a seleção */}
              <button
                onClick={handleClear}
                className="p-1 hover:bg-blue-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-blue-700" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================
          MODAL: SELETOR DE CATEGORIA HIERÁRQUICO
          ================================================================= */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            
            {/* HEADER DO MODAL */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FolderTree className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Selecionar Categoria</h2>
                  <p className="text-sm text-blue-100">Navegue pela árvore de categorias</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* CAMPO DE BUSCA - AGORA FUNCIONAL */}
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3"
                  autoFocus
                />
                {/* Botão para limpar a busca */}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ÁRVORE DE CATEGORIAS (scrollável) */}
            <div className="flex-1 overflow-y-auto p-4">
              {treeData.length === 0 ? (
                // Mensagem quando nenhuma categoria corresponde à busca
                <div className="text-center py-8 text-slate-500">
                  Nenhuma categoria encontrada para "{searchTerm}"
                </div>
              ) : (
                <div className="space-y-1">
                  <Tree items={treeData} />
                </div>
              )}
            </div>

            {/* FOOTER DO MODAL */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {selected ? (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Categoria selecionada: <strong>{selected.name}</strong>
                    </span>
                  ) : (
                    <span>Nenhuma categoria selecionada</span>
                  )}
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}