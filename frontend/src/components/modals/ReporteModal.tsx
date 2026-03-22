import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { apiFetch } from '@/api/client'
import type { Reporte } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editId?: string | null
}

export function ReporteModal({ open, onClose, editId }: Props) {
  const { reportes, areas, addReporte, updateReporte, setActiveId, setActiveTab, setColFilter, showToast } = useStore()

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [direccion, setDireccion] = useState('')
  const [area, setArea] = useState('')
  const [responsable, setResponsable] = useState('')
  const [estado, setEstado] = useState('activo')
  const [compat, setCompat] = useState('1567')

  const dirs = [...new Set(areas.map(a => a.nombre))].sort()

  useEffect(() => {
    if (editId) {
      const doc = reportes.find(r => r.id === editId)
      if (doc) {
        setName(doc.name || '')
        setDesc(doc.desc || '')
        setDireccion(doc.direccion || '')
        setArea(doc.area || '')
        setResponsable(doc.responsable || '')
        setEstado(doc.estado || 'activo')
        setCompat(doc.compat || '1567')
      }
    } else {
      setName(''); setDesc(''); setDireccion(''); setArea('')
      setResponsable(''); setEstado('activo'); setCompat('1567')
    }
  }, [editId, reportes, open])

  async function handleSubmit() {
    if (!name.trim()) { showToast('El nombre es obligatorio', '⚠'); return }

    const payload = { name: name.trim(), desc: desc.trim(), area: area.trim(), responsable: responsable.trim(), direccion, estado, compat }

    try {
      let result: Reporte
      if (editId) {
        result = await apiFetch<Reporte>(`/reportes/${editId}`, {
          method: 'PUT', body: JSON.stringify(payload),
        })
        updateReporte(result)
        showToast('Cambios guardados', '✓')
      } else {
        result = await apiFetch<Reporte>('/reportes', {
          method: 'POST', body: JSON.stringify(payload),
        })
        addReporte(result)
        showToast('Documentacion creada', '✓')
      }
      onClose()
      setActiveId(result.id)
      setActiveTab('resumen')
      setColFilter('')
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-extrabold text-ink-900 mb-1">
        {editId ? 'Editar documentacion' : 'Nueva documentacion'}
      </h2>
      <p className="text-ink-400 text-xs mb-5">Completa los datos basicos del reporte.</p>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nombre del reporte *" span={2}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="ej. Reporte de Ventas Nacionales"
            className="form-input" autoFocus />
        </FormField>
        <FormField label="Descripcion" span={2}>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Que hace este reporte?"
            className="form-input resize-y" />
        </FormField>
        <FormField label="Direccion">
          <select value={direccion} onChange={e => setDireccion(e.target.value)} className="form-input">
            <option value="">— Sin direccion —</option>
            {dirs.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>
        <FormField label="Area especifica">
          <input value={area} onChange={e => setArea(e.target.value)} placeholder="ej. Canal Nlinea" className="form-input" />
        </FormField>
        <FormField label="Responsable">
          <input value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Nombre del dueno" className="form-input" />
        </FormField>
        <FormField label="Compatibilidad PBI">
          <select value={compat} onChange={e => setCompat(e.target.value)} className="form-input">
            <option value="1567">Nivel 1567</option>
            <option value="1550">Nivel 1550</option>
            <option value="1500">Nivel 1500</option>
          </select>
        </FormField>
        <FormField label="Estado">
          <select value={estado} onChange={e => setEstado(e.target.value)} className="form-input">
            <option value="activo">Activo</option>
            <option value="desarrollo">En desarrollo</option>
            <option value="deprecado">Deprecado</option>
          </select>
        </FormField>
      </div>

      <div className="flex gap-2 justify-end mt-5">
        <button onClick={onClose} className="btn">Cancelar</button>
        <button onClick={handleSubmit} className="btn-primary">{editId ? 'Guardar cambios' : 'Crear'}</button>
      </div>
    </Modal>
  )
}

function FormField({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-2xs font-semibold text-ink-400 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
