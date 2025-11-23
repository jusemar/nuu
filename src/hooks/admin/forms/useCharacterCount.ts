import { useState, useMemo } from 'react'

interface UseCharacterCountProps {
  maxLength: number
  initialValue?: string
  warningThreshold?: number
}

export function useCharacterCount({ 
  maxLength, 
  initialValue = '',
  warningThreshold = 10 
}: UseCharacterCountProps) {
  const [value, setValue] = useState(initialValue)
  
  const characterCount = useMemo(() => value.length, [value])
  const remainingChars = useMemo(() => maxLength - characterCount, [maxLength, characterCount])
  const isNearLimit = useMemo(() => remainingChars <= warningThreshold, [remainingChars, warningThreshold])
  const isOverLimit = useMemo(() => characterCount > maxLength, [characterCount, maxLength])

  const handleChange = (newValue: string) => {
    if (newValue.length <= maxLength) {
      setValue(newValue)
    }
  }

  return {
    value,
    characterCount,
    remainingChars,
    isNearLimit,
    isOverLimit,
    handleChange,
    setValue
  }
}