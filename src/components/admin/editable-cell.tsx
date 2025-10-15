"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface EditableCellProps {
  value: string
  onBlur: (newValue: string) => void
  type?: 'text' | 'textarea'
}

export function EditableCell({ 
  value, 
  onBlur,
  type = 'text'
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedValue, setEditedValue] = useState(value)

  useEffect(() => {
    setEditedValue(value)
  }, [value])

  const handleBlur = () => {
    setIsEditing(false)
    onBlur(editedValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditedValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        value={editedValue}
        onChange={(e) => setEditedValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 border-0 bg-transparent p-1 focus-visible:ring-1"
        autoFocus
      />
    )
  }

  return (
    <div 
      className="cursor-pointer p-2 min-h-[40px] flex items-center hover:bg-gray-50 rounded"
      onClick={() => setIsEditing(true)}
    >
      {value || "—"}
    </div>
  )
}