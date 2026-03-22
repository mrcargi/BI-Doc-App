import { useState, useEffect } from 'react'
import { Users, UserPlus, Pencil, Trash2, KeyRound, X, Check, Shield, Edit3 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { apiFetch } from '@/api/client'
import type { UserListItem } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

export function UsersModal({ open, onClose }: Props) {
  const { showToast, user: currentUser } = useStore()
  const [users, setUsers] = useState<UserListItem[]>([])

  // Create form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [role, setRole] = useState('editor')

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('editor')

  // Password reset state
  const [resetId, setResetId] = useState<number | null>(null)
  const [resetPass, setResetPass] = useState('')

  useEffect(() => {
    if (open) loadUsers()
  }, [open])

  async function loadUsers() {
    try {
      const data = await apiFetch<{ items: UserListItem[] }>('/users')
      setUsers(data.items)
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }

  async function createUser() {
    if (!name || !email || !pass) { showToast('Completa todos los campos', '⚠'); return }
    if (pass.length < 6) { showToast('Minimo 6 caracteres', '⚠'); return }
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: pass, role }),
      })
      showToast(`Usuario ${email} creado`, '✓')
      setName(''); setEmail(''); setPass('')
      loadUsers()
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }

  function startEdit(u: UserListItem) {
    setEditingId(u.id)
    setEditName(u.name)
    setEditEmail(u.email)
    setEditRole(u.role)
    setResetId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit() {
    if (!editingId) return
    if (!editName.trim()) { showToast('El nombre es obligatorio', '⚠'); return }
    try {
      await apiFetch(`/users/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim(), role: editRole }),
      })
      showToast('Usuario actualizado', '✓')
      setEditingId(null)
      loadUsers()
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }

  async function toggleActive(u: UserListItem) {
    try {
      await apiFetch(`/users/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !u.is_active }),
      })
      showToast(u.is_active ? 'Usuario desactivado' : 'Usuario activado', '✓')
      loadUsers()
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }

  async function deleteUser(u: UserListItem) {
    if (!confirm(`Eliminar al usuario "${u.name}" (${u.email})? Esta accion no se puede deshacer.`)) return
    try {
      await apiFetch(`/users/${u.id}`, { method: 'DELETE' })
      showToast(`Usuario ${u.email} eliminado`, '🗑')
      loadUsers()
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }

  async function saveResetPassword() {
    if (!resetId) return
    if (resetPass.length < 6) { showToast('Minimo 6 caracteres', '⚠'); return }
    try {
      await apiFetch(`/users/${resetId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: resetPass }),
      })
      showToast('Contrasena reseteada', '✓')
      setResetId(null)
      setResetPass('')
    } catch (e) {
      showToast((e as Error).message, '✗')
    }
  }

  const isSelf = (id: number) => currentUser?.id === id

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[700px]">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
          <Users size={18} className="text-brand-600" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-ink-900">Gestion de Usuarios</h2>
          <p className="text-2xs text-ink-400">{users.length} usuarios registrados</p>
        </div>
      </div>

      {/* Users list */}
      <div className="mb-5 space-y-0 max-h-[320px] overflow-y-auto">
        {users.map(u => (
          <div key={u.id} className="border-b border-surface-100/60 last:border-0">
            {/* Normal row */}
            {editingId !== u.id && resetId !== u.id && (
              <div className="flex items-center gap-3 py-3 px-1">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center shrink-0">
                  <span className="text-brand-900 text-[10px] font-bold">{(u.name || 'U').slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink-900">{u.name}</span>
                    {u.role === 'admin' && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-2xs font-semibold">
                        <Shield size={10} /> Admin
                      </span>
                    )}
                    {u.role === 'editor' && (
                      <span className="px-1.5 py-0.5 rounded bg-surface-100 text-ink-500 text-2xs font-medium">Editor</span>
                    )}
                  </div>
                  <div className="text-2xs text-ink-400">{u.email}</div>
                </div>
                <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'}`}>
                  {u.is_active ? 'Activo' : 'Inactivo'}
                </span>
                {/* Actions */}
                {!isSelf(u.id) && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(u)} className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-all" title="Editar">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => { setResetId(u.id); setResetPass(''); setEditingId(null) }} className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-ink-400 hover:text-amber-600 transition-all" title="Resetear contrasena">
                      <KeyRound size={13} />
                    </button>
                    <button onClick={() => toggleActive(u)} className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-ink-400 hover:text-blue-600 transition-all" title={u.is_active ? 'Desactivar' : 'Activar'}>
                      {u.is_active ? <X size={13} /> : <Check size={13} />}
                    </button>
                    <button onClick={() => deleteUser(u)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-ink-300 hover:text-red-600 transition-all" title="Eliminar">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
                {isSelf(u.id) && (
                  <span className="text-2xs text-ink-300 italic">Tu</span>
                )}
              </div>
            )}

            {/* Edit row */}
            {editingId === u.id && (
              <div className="py-3 px-1 bg-surface-50 rounded-lg my-1">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" className="form-input text-xs" />
                  <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" className="form-input text-xs" />
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} className="form-input text-xs">
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit} className="btn text-xs py-1.5 px-3">Cancelar</button>
                  <button onClick={saveEdit} className="btn-primary text-xs py-1.5 px-3">
                    <Check size={13} /> Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Password reset row */}
            {resetId === u.id && (
              <div className="py-3 px-1 bg-amber-50/50 rounded-lg my-1">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound size={14} className="text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-ink-700">Resetear contrasena de {u.name}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={resetPass}
                    onChange={e => setResetPass(e.target.value)}
                    placeholder="Nueva contrasena (min 6)"
                    className="form-input text-xs flex-1"
                    autoFocus
                  />
                  <button onClick={() => { setResetId(null); setResetPass('') }} className="btn text-xs py-1.5 px-3">Cancelar</button>
                  <button onClick={saveResetPassword} className="btn-primary text-xs py-1.5 px-3">
                    <Check size={13} /> Resetear
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create user form */}
      <div className="border-t border-surface-100 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={15} className="text-brand-600" />
          <h3 className="text-sm font-bold text-ink-900">Crear nuevo usuario</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" className="form-input" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@nadro.com" type="email" className="form-input" />
          <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Contrasena (min 6)" type="password" className="form-input" />
          <select value={role} onChange={e => setRole(e.target.value)} className="form-input">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end mt-3">
          <button onClick={onClose} className="btn">Cerrar</button>
          <button onClick={createUser} className="btn-primary">
            <UserPlus size={14} /> Crear usuario
          </button>
        </div>
      </div>
    </Modal>
  )
}
