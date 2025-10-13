"use client"

import { Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface ToolbarProps {
  placeholder?: string
  columns?: {
    id: string
    label: string
    visible: boolean
    toggleVisibility: (visible: boolean) => void
  }[]
}

export function Toolbar({ placeholder = "Filtrar...", columns = [] }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between py-4">
     
     <div className="flex items-center gap-4">
    <div className="relative w-80">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder={placeholder}
      className="pl-10 bg-background border-input"
    />
  </div>
</div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Colunas <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.visible}
              onCheckedChange={column.toggleVisibility}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}