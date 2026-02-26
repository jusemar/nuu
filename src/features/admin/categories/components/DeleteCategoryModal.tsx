import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FolderTree, AlertTriangle, Info, Trash2 } from 'lucide-react'

type CategoryToDelete = {
  id: string
  name: string
  level: number
  hasChildren: boolean
  hasProducts: boolean
  productsCount?: number
  childrenCount?: number
  subcategories?: string[]
}

interface DeleteCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (type: 'hard') => void  // Agora só aceita 'hard'
  category: CategoryToDelete | null
  type: 'ok' | 'blocked' // 'ok' = pode excluir, 'blocked' = tem subcategorias
}

export function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  category,
  type
}: DeleteCategoryModalProps) {
  if (!isOpen || !category) return null

  // ================================================================
  // MODAL PARA CATEGORIA BLOQUEADA (tem subcategorias)
  // ================================================================
  if (type === 'blocked') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          {/* Header vermelho */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                Exclusão Bloqueada
              </DialogTitle>
            </div>
          </div>

          <div className="p-6">
            {/* Dados da categoria */}
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-slate-800">{category.name}</p>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                  Nível {category.level}
                </span>
              </div>
            </div>

            {/* Aviso de bloqueio - vermelho */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 flex gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm mb-2">
                  Não é possível excluir esta categoria
                </p>
                <p className="text-sm text-red-800 mb-3">
                  Esta categoria possui <strong>{category.childrenCount} subcategorias</strong> vinculadas:
                </p>
                <ul className="space-y-1">
                  {category.subcategories?.map((sub, index) => (
                    <li key={index} className="text-sm text-red-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Info sobre o que fazer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-medium mb-1">O que fazer?</p>
                <p className="text-sm text-blue-800">
                  Primeiro exclua ou mova todas as subcategorias, depois você poderá excluir esta categoria.
                </p>
              </div>
            </div>

            {/* Botão único */}
            <Button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ================================================================
  // MODAL PARA CATEGORIA QUE PODE SER EXCLUÍDA
  // ================================================================
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header vermelho (era laranja, mudei para vermelho para combinar com exclusão definitiva) */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Excluir Categoria
            </DialogTitle>
          </div>
        </div>

        <div className="p-6">
          {/* Dados da categoria */}
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-slate-800">{category.name}</p>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                Nível {category.level}
              </span>
            </div>
          </div>

          {/* Aviso se tiver produtos */}
          {category.hasProducts && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 text-sm mb-1">Impacto nos Produtos</p>
                <p className="text-sm text-amber-800">
                  Esta categoria possui <strong>{category.productsCount} produtos</strong> vinculados. 
                  Eles também serão excluídos permanentemente.
                </p>
              </div>
            </div>
          )}

          {/* Aviso de exclusão definitiva */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              <strong>Atenção!</strong> Esta ação <strong className="text-red-600">não pode ser desfeita</strong>. 
              A categoria e todos os dados relacionados serão removidos permanentemente.
            </p>
          </div>

          {/* Botões */}
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                onConfirm('hard')  // Sempre 'hard' (exclusão definitiva)
                onClose()
              }}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteCategoryModal