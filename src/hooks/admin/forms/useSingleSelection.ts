import { useState, useCallback } from 'react'

interface UseSingleSelectionProps<T> {
  initialValue?: T | null
}

export function useSingleSelection<T>({
  initialValue = null
}: UseSingleSelectionProps<T> = {}) {
  const [selectedValue, setSelectedValue] = useState<T | null>(initialValue)

  const selectValue = useCallback((value: T) => {
    setSelectedValue(value)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedValue(null)
  }, [])

  const isSelected = useCallback((value: T) => {
    return selectedValue === value
  }, [selectedValue])

  return {
    selectedValue,
    selectValue,
    clearSelection,
    isSelected,
    setSelectedValue
  }
}