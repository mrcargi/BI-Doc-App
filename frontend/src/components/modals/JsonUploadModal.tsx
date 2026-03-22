import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { apiFetch } from '@/api/client'
import type { Reporte, ValidationResult } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

export function JsonUploadModal({ open, onClose }: Props) {
  const { showToast, addReporte, updateReporte, setActiveId, setActiveTab, setColFilter, setReportes, reportes } = useStore()
  const [raw, setRaw] = useState('')
  const [validation, setValidation] = useState<{ type: 'ok' | 'warn' | 'error'; msg: string } | null>(null)
  const [preview, setPreview] = useState<ValidationResult['summary'] | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [canSubmit, setCanSubmit] = useState(false)

  function reset() {
    setRaw(''); setValidation(null); setPreview(null); setWarnings([]); setCanSubmit(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function validate() {
    if (!raw.trim()) {
      setValidation({ type: 'warn', msg: '⚠ Pega un JSON primero' })
      return
    }

    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch (e) {
      setValidation({ type: 'error', msg: `✗ JSON invalido: ${(e as Error).message}` })
      setCanSubmit(false); setPreview(null)
      return
    }

    try {
      const result = await apiFetch<ValidationResult>('/validate-json', {
        method: 'POST', body: JSON.stringify(parsed),
      })

      if (result.valid) {
        setValidation({
          type: 'ok',
          msg: '✓ JSON valido' + (result.warnings.length ? ` — ${result.warnings.length} aviso(s): ${result.warnings.join(', ')}` : ''),
        })
        setPreview(result.summary)
        setWarnings(result.warnings)
        setCanSubmit(true)
      } else {
        setValidation({ type: 'error', msg: `✗ ${result.errors.length} error(es):\n` + result.errors.map(e => `  · ${e}`).join('\n') })
        setCanSubmit(false); setPreview(null)
      }
    } catch (e) {
      setValidation({ type: 'error', msg: `✗ Error: ${(e as Error).message}` })
      setCanSubmit(false)
    }
  }

  async function submit() {
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(raw) } catch { showToast('JSON invalido', '✗'); return }

    try {
      const result = await apiFetch<{ ok: boolean; message: string; reporte: Reporte; action: string }>('/upload-json', {
        method: 'POST', body: JSON.stringify(parsed),
      })
      showToast(result.message, '✓')
      handleClose()

      const data = await apiFetch<{ items: Reporte[] }>('/reportes')
      setReportes(data.items)
      if (result.reporte?.id) {
        setActiveId(result.reporte.id)
        setActiveTab('resumen')
        setColFilter('')
      }
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }

  const valColors = { ok: 'bg-brand-50 text-brand-800 border-brand-200/60', warn: 'bg-amber-50 text-amber-700 border-amber-200/60', error: 'bg-red-50 text-red-600 border-red-200/60' }

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-[720px]">
      <h2 className="text-lg font-extrabold text-ink-900 mb-1">Subir documentacion (JSON)</h2>
      <p className="text-ink-400 text-xs mb-5">Pega aqui el JSON generado por Claude con la metadata del reporte.</p>

      <div className="mb-3">
        <label className="block text-2xs font-semibold text-ink-400 mb-1.5 uppercase tracking-wider">JSON del reporte</label>
        <textarea
          value={raw}
          onChange={e => { setRaw(e.target.value); setCanSubmit(false); setValidation(null) }}
          rows={14}
          placeholder="Pega aqui el JSON completo que Claude te genero..."
          className="form-input font-mono text-[11px] leading-relaxed resize-y"
        />
      </div>

      {validation && (
        <div className={`mb-3 p-3 rounded-xl text-xs whitespace-pre-wrap border ${valColors[validation.type]}`}>
          {validation.msg}
        </div>
      )}

      {preview && (
        <div className="mb-3 bg-surface-50 border border-surface-200/60 p-3 rounded-xl text-xs leading-[1.8]">
          <strong className="text-ink-900">{preview.name}</strong> <span className="text-ink-400 font-mono">({preview.id})</span><br />
          {preview.tables} tablas · {preview.columns} columnas · {preview.measures} medidas · {preview.relations} relaciones
          {warnings.length > 0 && <><br /><span className="text-amber-600">⚠ {warnings.join(' · ')}</span></>}
        </div>
      )}

      <div className="flex gap-2 justify-end mt-5">
        <button onClick={handleClose} className="btn">Cancelar</button>
        <button onClick={validate} className="btn">Validar</button>
        <button onClick={submit} disabled={!canSubmit} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
          Subir documentacion
        </button>
      </div>
    </Modal>
  )
}
