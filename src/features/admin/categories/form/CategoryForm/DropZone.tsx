"use client"

import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface DropZoneProps {
  id: string
  parentId?: string
  index: number
  position: 'before' | 'after'
  isActive?: boolean
}

export function DropZone({ 
  id, 
  parentId, 
  index, 
  position, 
  isActive = false 
}: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'dropzone',
      parentId,
      index,
      position
    }
  })

  const height = isOver ? 'h-8' : 'h-2'
  const bgColor = isOver ? 'bg-blue-200' : 'bg-transparent'
  const borderColor = isOver ? 'border-blue-400' : 'border-transparent'

  return (
    <div
      ref={setNodeRef}
      className={`
        w-full transition-all duration-200
        ${height} ${bgColor} ${borderColor}
        border-y-2 border-dashed
        flex items-center justify-center
        ${position === 'before' ? 'mb-1' : 'mt-1'}
        ${isActive ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
      `}
    >
      {isOver && (
        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
      )}
    </div>
  )
}