// src/components/admin/editable-switch.tsx
"use client"

import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"

interface EditableSwitchProps {
  value: boolean
  onSave: (newValue: boolean) => void
}

export function EditableSwitch({ value, onSave }: EditableSwitchProps) {
  const [isActive, setIsActive] = useState(value)

  useEffect(() => {
    setIsActive(value)
  }, [value])

  const handleToggle = (newValue: boolean) => {
    setIsActive(newValue)
    onSave(newValue)
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
      />
      <span className="text-sm text-gray-600">
        {isActive ? "Ativo" : "Inativo"}
      </span>
    </div>
  )
}