import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { useStore } from '@/store/useStore'
import { apiFetchBlob } from '@/api/client'
import { Download, Pencil, Trash2 } from 'lucide-react'
import { HomeDashboard } from '@/components/HomeDashboard'
import { TabResumen } from '@/components/tabs/TabResumen'
import { TabModelo } from '@/components/tabs/TabModelo'
import { TabColumnas } from '@/components/tabs/TabColumnas'
import { TabMedidas } from '@/components/tabs/TabMedidas'
import { TabFuente } from '@/components/tabs/TabFuente'
import { TabPdf } from '@/components/tabs/TabPdf'
import { TabNotificaciones } from '@/components/tabs/TabNotificaciones'
import { TabGuia } from '@/components/tabs/TabGuia'

interface DocViewProps {
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function DocView({ onEdit, onDelete }: DocViewProps) {
  const { reportes, activeId, activeTab, user, showToast } = useStore()
  const doc = reportes.find(r => r.id === activeId)
  const contentRef = useRef<HTMLDivElement>(null)

  // GSAP staggered slide-up
  useEffect(() => {
    if (!contentRef.current) return
    const children = contentRef.current.children
    gsap.fromTo(
      children,
      { y: 16, opacity: 0.5 },
      { y: 0, opacity: 1, stagger: 0.05, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' },
    )
  }, [activeId, activeTab])

  const exportPdf = useCallback(async () => {
    if (!doc) return
    showToast('Generando PDF...', '⏳')
    try {
      const blob = await apiFetchBlob(`/reportes/${doc.id}/export-pdf`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.id}-resumen-ejecutivo.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('PDF descargado', '✓')
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }, [doc, showToast])

  // Global tabs (no doc needed)
  if (activeTab === 'notificaciones') {
    return <TabNotificaciones />
  }
  if (activeTab === 'guia') {
    return <div className="p-4 lg:p-5"><TabGuia /></div>
  }

  if (!doc) {
    return <HomeDashboard />
  }

  return (
    <div className="p-4 lg:p-5">
      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button onClick={exportPdf} className="btn">
          <Download size={14} /> Exportar PDF
        </button>
        <button onClick={() => onEdit(doc.id)} className="btn">
          <Pencil size={14} /> Editar
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => onDelete(doc.id)}
            className="btn hover:!border-red-300 hover:!text-red-600 hover:!bg-red-50 dark:hover:!border-red-800 dark:hover:!bg-red-950/30"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        )}
      </div>

      {/* Content */}
      <div ref={contentRef}>
        {activeTab === 'resumen' && <TabResumen doc={doc} />}
        {activeTab === 'modelo' && <TabModelo doc={doc} />}
        {activeTab === 'columnas' && <TabColumnas doc={doc} />}
        {activeTab === 'medidas' && <TabMedidas doc={doc} />}
        {activeTab === 'fuente' && <TabFuente doc={doc} />}
        {activeTab === 'pdf' && <TabPdf doc={doc} />}
      </div>
    </div>
  )
}
