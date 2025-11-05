"use client"

import { useMemo } from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { SectionCards } from "@/components/ui/section-cards"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import { DataTable } from "@/components/ui/data-table"
import data from "./data.json"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, CheckCircle2, Clock } from "lucide-react"

export default function Page() {
  const columns = useMemo(() => [
    {
  accessorKey: "header",
  header: "Título",
  cell: ({ row }: { row: any }) => {
    const title = row.getValue("header")
    return (
      <a 
        href="#" 
        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        onClick={(e) => {
          e.preventDefault()
          // Aqui vai a ação quando clicar (editar, visualizar, etc)
          console.log("Clicou no título:", title)
        }}
      >
        {title}
      </a>
    )
  }
},

    {
      accessorKey: "type", 
      header: "Tipo",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.getValue("status")
        const isDone = status === "Done"
        return (
         <Badge className={`gap-1 ${
  isDone 
    ? "bg-green-500 text-white hover:bg-green-600" 
    : "bg-yellow-500 text-white hover:bg-yellow-600"
}`}>
            {isDone ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Concluído
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 animate-spin" />
                Em Processo
              </>
            )}
          </Badge>
        )
      }
    },
    {
      accessorKey: "target",
      header: "Meta",
    },
    {
      accessorKey: "limit", 
      header: "Limite",
    },
    {
      accessorKey: "reviewer",
      header: "Revisor",
      cell: ({ row }: { row: any }) => {
        const reviewer = row.getValue("reviewer")
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 p-0">
                {reviewer} <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Eddie Lake</DropdownMenuItem>
              <DropdownMenuItem>Jamik Tashpulatov</DropdownMenuItem>
              <DropdownMenuItem>Atribuir Revisor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [])

  return (
   // No return, adicione um container como no exemplo
<div className="space-y-6">
  <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-white/20 p-6">
  <SectionCards />
</div>
  <div className="admin-card p-6">
    <ChartAreaInteractive />
  </div>
  <div className="admin-card p-6">
    <DataTable columns={columns} data={data} />
  </div>
</div>
  )
}