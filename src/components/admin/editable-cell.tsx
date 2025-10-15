"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EditableCellProps {
  value: string
  onSave: (newValue: string) => void
  type?: 'text' | 'textarea'
  placeholder?: string
}

export function EditableCell({ 
  value, 
  onSave, 
  type = 'text',
  placeholder = "" 
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedValue, setEditedValue] = useState(value)

  const handleSave = () => {
    onSave(editedValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedValue(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        {type === 'textarea' ? (
          <textarea
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            className="w-full p-2 border rounded-md text-sm resize-none"
            rows={3}
            autoFocus
          />
        ) : (
          <Input
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            className="text-sm"
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="h-7 text-xs">
            ✓
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 text-xs">
            ✕
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
      onDoubleClick={() => setIsEditing(true)}
    >
      {value || placeholder}
    </div>
  )
}