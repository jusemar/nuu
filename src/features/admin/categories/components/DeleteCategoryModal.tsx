import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { FolderTree, AlertTriangle, Info, Trash2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  onConfirm: (type: 'soft' | 'hard') => void
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
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft')

  if (!isOpen || !category) return null

  // Modal para categoria BLOQUEADA (tem subcategorias)
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

  // Modal para categoria que PODE ser excluída
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header laranja */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
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
                  Eles também serão afetados pela exclusão.
                </p>
              </div>
            </div>
          )}

          {/* Opções de exclusão - RADIO GROUP */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              Escolha o tipo de exclusão:
            </h4>
            
            <RadioGroup 
              value={deleteType} 
              onValueChange={(value) => setDeleteType(value as 'soft' | 'hard')}
              className="space-y-3"
            >
              {/* Opção Soft Delete */}
              <div className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors',
                deleteType === 'soft' 
                  ? 'border-orange-300 bg-orange-50' 
                  : 'border-slate-200 hover:border-slate-300'
              )}>
                <RadioGroupItem value="soft" id="soft" className="mt-1" />
                <Label htmlFor="soft" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-slate-800">Exclusão Reversível</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Soft Delete
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    A categoria ficará <strong>inativa</strong> e poderá ser restaurada 
                    posteriormente na aba "Inativas/Excluídas". Os produtos vinculados 
                    também ficarão inativos.
                  </p>
                </Label>
              </div>

              {/* Opção Hard Delete */}
              <div className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors',
                deleteType === 'hard' 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 hover:border-slate-300'
              )}>
                <RadioGroupItem value="hard" id="hard" className="mt-1" />
                <Label htmlFor="hard" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-slate-800">Exclusão Definitiva</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Hard Delete
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    A categoria será <strong>removida permanentemente</strong> do banco de dados.
                    Esta ação <strong className="text-red-600">não pode ser desfeita</strong>. 
                    Produtos vinculados também serão excluídos definitivamente.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Aviso adicional para Hard Delete */}
          {deleteType === 'hard' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                <strong>Atenção!</strong> Esta é uma ação irreversível. 
                Todos os dados relacionados serão perdidos permanentemente.
              </p>
            </div>
          )}

          {/* Info sobre soft delete (só aparece se soft selecionado) */}
          {deleteType === 'soft' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                <strong>Exclusão reversível:</strong> A categoria ficará inativa, 
                mas todos os dados serão preservados para possível restauração futura.
              </p>
            </div>
          )}

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
                onConfirm(deleteType)
                onClose()
              }}
              className={cn(
                'flex-1 text-white',
                deleteType === 'soft' 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {deleteType === 'soft' ? (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmar Soft Delete
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmar Hard Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteCategoryModal