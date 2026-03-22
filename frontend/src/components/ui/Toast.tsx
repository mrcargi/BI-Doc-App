import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useStore } from '@/store/useStore'

export function Toast() {
  const { toast } = useStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (toast) {
      gsap.to(ref.current, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' })
    } else {
      gsap.to(ref.current, { y: 14, opacity: 0, duration: 0.2, ease: 'power2.in' })
    }
  }, [toast])

  return (
    <div
      ref={ref}
      className="fixed bottom-5 right-5 z-[200] flex items-center gap-2.5 bg-ink-900 border border-white/10 rounded-2xl px-5 py-3 text-xs font-medium text-white shadow-float pointer-events-none opacity-0 translate-y-3.5"
    >
      <span>{toast?.icon}</span>
      <span>{toast?.msg}</span>
    </div>
  )
}
