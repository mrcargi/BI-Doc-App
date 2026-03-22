import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-[480px]' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.2, ease: 'power2.out' })
      gsap.to(panelRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' })
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.15, ease: 'power2.in' })
      gsap.to(panelRef.current, { y: 8, opacity: 0, scale: 0.98, duration: 0.15, ease: 'power2.in' })
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm opacity-0 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        ref={panelRef}
        className={`bg-surface-0 border border-surface-200/60 rounded-2xl p-6 w-full ${maxWidth} shadow-float translate-y-2 opacity-0 scale-[0.98]`}
      >
        {children}
      </div>
    </div>
  )
}
