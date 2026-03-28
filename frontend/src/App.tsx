import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { apiFetch, setOnUnauthorized } from '@/api/client'
import { LoginScreen } from '@/components/LoginScreen'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { DocView } from '@/components/DocView'
import { Toast } from '@/components/ui/Toast'
import { ReporteModal } from '@/components/modals/ReporteModal'
import { JsonUploadModal } from '@/components/modals/JsonUploadModal'
import { UsersModal } from '@/components/modals/UsersModal'
import { UserMenuModal } from '@/components/modals/UserMenuModal'
import type { ReporteList, AreaList, User } from '@/types'

export function App() {
  const store = useStore()
  const { user, token, login, logout, setReportes, setAreas, setActiveId, activeId, reportes, removeReporte, showToast } = store

  const [ready, setReady] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Modals
  const [reporteModalOpen, setReporteModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)
  const [usersModalOpen, setUsersModalOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Wire up unauthorized handler
  useEffect(() => {
    setOnUnauthorized(logout)
  }, [logout])

  // Boot: verify token and load data
  useEffect(() => {
    async function boot() {
      if (!token) { setReady(true); return }
      try {
        const me = await apiFetch<User>('/auth/me')
        login(token, me)
        await loadData()
      } catch {
        logout()
      }
      setReady(true)
    }
    boot()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    const [rData, aData] = await Promise.all([
      apiFetch<ReporteList>('/reportes'),
      apiFetch<AreaList>('/areas'),
    ])
    setReportes(rData.items)
    setAreas(aData.items)
  }

  // After login, load data
  useEffect(() => {
    if (user && token && ready) {
      loadData().catch(() => {})
    }
  }, [user, token, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = useCallback((id: string) => {
    setEditId(id)
    setReporteModalOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Eliminar esta documentacion? Esta accion no se puede deshacer.')) return
    try {
      await apiFetch(`/reportes/${id}`, { method: 'DELETE' })
      removeReporte(id)
      const remaining = reportes.filter(r => r.id !== id)
      setActiveId(remaining.length > 0 ? remaining[0].id : null)
      showToast('Documentacion eliminada', '🗑')
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }, [reportes, removeReporte, setActiveId, showToast])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="w-8 h-8 border-2 border-surface-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    )
  }

  // Logged in
  return (
    <>
      <div className="flex min-h-screen h-screen overflow-hidden w-full bg-surface-50">
        <Sidebar
          onOpenJsonUpload={() => setJsonModalOpen(true)}
          onOpenCreateModal={() => { setEditId(null); setReporteModalOpen(true) }}
          onOpenUserMenu={() => setUserMenuOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <TopBar onOpenUserMenu={() => setUserMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <DocView onEdit={handleEdit} onDelete={handleDelete} />
          </main>
        </div>
      </div>

      {/* Modals */}
      <ReporteModal
        open={reporteModalOpen}
        onClose={() => setReporteModalOpen(false)}
        editId={editId}
      />
      <JsonUploadModal
        open={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
      />
      <UsersModal
        open={usersModalOpen}
        onClose={() => setUsersModalOpen(false)}
      />
      <UserMenuModal
        open={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
        onOpenUsers={() => setUsersModalOpen(true)}
      />
      <Toast />
    </>
  )
}
