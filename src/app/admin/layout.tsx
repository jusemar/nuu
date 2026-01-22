import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar para desktop */}
      <AdminSidebar />
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
       <main className="flex-1 p-4 md:p-6 lg:pl-0">
          {children}
        </main>
      </div>
    </div>
  )
}