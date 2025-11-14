"use client"

import { useState } from 'react'
import { Trash2, Eye, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProductImages } from '@/hooks/admin/queries/produtcs/product-images/use-product-images'
import { useProductImageMutations } from '@/hooks/admin/mutations/products/product-images/use-product-image-mutations'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ProductImageGalleryProps {
  productVariantId: string
}

function SortableImage({ image, onDelete }: { 
  image: any, 
  onDelete: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden"
    >
      {/* Imagem */}
      <img
        src={image.imageUrl}
        alt={image.altText || 'Imagem do produto'}
        className="w-full h-32 object-cover"
      />
      
      {/* Overlay com ações */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-white hover:bg-gray-100"
            onClick={() => window.open(image.imageUrl, '_blank')}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 w-8 p-0 bg-white hover:bg-gray-100 text-red-600 hover:text-white"
            onClick={() => onDelete(image.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Handle para arrastar */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 bg-white rounded shadow-sm cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </div>

      {/* Ordem no canto inferior */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
        #{image.sortOrder + 1}
      </div>
    </div>
  )
}

export function ProductImageGallery({ productVariantId }: ProductImageGalleryProps) {
  const { data: images = [], refetch } = useProductImages(productVariantId)
  const { deleteImage, updateOrder } = useProductImageMutations()
  const [items, setItems] = useState(images)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Atualizar ordem no banco
      try {
        for (let i = 0; i < newItems.length; i++) {
          await updateOrder.mutateAsync({
            id: newItems[i].id,
            sortOrder: i
          })
        }
        refetch()
      } catch (error) {
        console.error('Erro ao atualizar ordem:', error)
        setItems(images) // Revert em caso de erro
      }
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (confirm('Tem certeza que deseja excluir esta imagem?')) {
      try {
        await deleteImage.mutateAsync(imageId)
        refetch()
      } catch (error) {
        console.error('Erro ao excluir imagem:', error)
      }
    }
  }

  if (!productVariantId) {
    return (
      <div className="text-center py-8 text-gray-500">
        Selecione uma variante para gerenciar imagens
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Imagens da Variante</h3>
        <span className="text-sm text-gray-500">
          {images.length} imagem(ns)
        </span>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">Nenhuma imagem adicionada</p>
          <p className="text-sm text-gray-400">
            Use o upload acima para adicionar imagens
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onDelete={handleDeleteImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}