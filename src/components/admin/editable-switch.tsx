"use client"

import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react" // ← ADICIONE

interface EditableSwitchProps {
  value: boolean
  onSave: (newValue: boolean) => void
}

export function EditableSwitch({ value, onSave }: EditableSwitchProps) {
  const [isActive, setIsActive] = useState(value) // ← ESTADO LOCAL

  useEffect(() => {
    setIsActive(value) // ← ATUALIZA QUANDO O VALOR MUDA
  }, [value])

  const handleToggle = (newValue: boolean) => {
    setIsActive(newValue) // ← ATUALIZA VISUALMENTE
    onSave(newValue) // ← SALVA NO BANCO
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isActive} // ← USA ESTADO LOCAL
        onCheckedChange={handleToggle}
      />
      <span className="text-sm text-gray-600">
        {isActive ? "Ativo" : "Inativo"}
      </span>
    </div>
  )
}