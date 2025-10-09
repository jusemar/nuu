"use client"

import * as React from "react"

interface DropdownMenuCheckboxItemProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  children: React.ReactNode
  className?: string
}

export const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, onCheckedChange, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
      checked ? "bg-accent text-accent-foreground" : ""
    } ${className}`}
    onClick={() => onCheckedChange?.(!checked)}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && (
        <span className="h-2 w-2 rounded-full bg-current" />
      )}
    </span>
    {children}
  </div>
))

DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"