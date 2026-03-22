import { useCallback } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { apiFetch } from '@/api/client'
import { useStore } from '@/store/useStore'
import type { Reporte } from '@/types'

export function TabPdf({ doc }: { doc: Reporte }) {
  const { showToast, updateReporte } = useStore()
  const hasPdf = !!doc.pdfFile

  const uploadPdf = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('Solo se aceptan PDFs', '⚠')
      return
    }
    showToast('Subiendo PDF...', '⏳')
    const form = new FormData()
    form.append('file', file)
    try {
      await apiFetch(`/reportes/${doc.id}/pdf`, { method: 'POST', body: form })
      updateReporte({ ...doc, pdfFile: `${doc.id}.pdf` })
      showToast('PDF subido correctamente', '✓')
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }, [doc, showToast, updateReporte])

  const removePdf = useCallback(async () => {
    if (!confirm('Quitar el PDF adjunto?')) return
    try {
      await apiFetch(`/reportes/${doc.id}/pdf`, { method: 'DELETE' })
      updateReporte({ ...doc, pdfFile: null })
      showToast('PDF eliminado', '🗑')
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }, [doc, showToast, updateReporte])

  if (hasPdf) {
    return (
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 bg-ink-900 rounded-t-2xl">
          <FileText size={15} className="text-red-400" />
          <span className="text-xs text-white/90 font-medium font-mono truncate max-w-[360px]">{doc.pdfFile}</span>
          <div className="flex-1" />
          <button
            onClick={removePdf}
            className="px-3 py-1.5 text-2xs font-semibold border border-white/20 rounded-xl text-white/60 hover:text-red-400 hover:border-red-400 transition-all flex items-center gap-1.5"
          >
            <Trash2 size={12} />
            Quitar
          </button>
        </div>
        <iframe className="w-full h-[78vh] border-none block" src={`/pdfs/${doc.pdfFile}`} title="Vista PDF" />
      </div>
    )
  }

  return (
    <div
      className="card border-2 border-dashed border-surface-300 p-12 text-center cursor-pointer transition-all hover:border-brand-400 hover:bg-brand-50/30 relative group"
      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('!border-brand-500', '!bg-brand-50/50') }}
      onDragLeave={e => { e.currentTarget.classList.remove('!border-brand-500', '!bg-brand-50/50') }}
      onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('!border-brand-500', '!bg-brand-50/50'); const f = e.dataTransfer.files[0]; if (f) uploadPdf(f) }}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f) }}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
        <Upload size={24} className="text-white" />
      </div>
      <h3 className="text-sm font-bold text-ink-900 mb-1">Sube el PDF del reporte</h3>
      <p className="text-xs text-ink-400 leading-relaxed">
        Arrastra aqui el PDF exportado desde Power BI Desktop<br />o haz clic para seleccionarlo
      </p>
      <p className="mt-3 text-2xs text-ink-300 font-mono">Archivo → Exportar → Exportar a PDF</p>
    </div>
  )
}
