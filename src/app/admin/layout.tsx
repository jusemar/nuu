import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 flex">
      <div className="bg-white/10 backdrop-blur-lg border-r border-white/20">
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <AdminHeader />
        </div>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}