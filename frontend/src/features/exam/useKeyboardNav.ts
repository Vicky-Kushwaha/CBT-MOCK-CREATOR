import { useEffect } from 'react'
import { useExamStore } from '../../store/examStore'

/** ←/→ navigate, A–D or 1–4 choose an option, M marks, Backspace clears, Enter = Save & Next. */
export function useKeyboardNav(enabled: boolean, onSaveNext: () => void) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || e.ctrlKey || e.metaKey || e.altKey) return
      const s = useExamStore.getState()
      const q = s.questions[s.currentIndex]
      if (!q) return
      const key = e.key.toLowerCase()
      if (key === 'arrowright') s.next()
      else if (key === 'arrowleft') s.prev()
      else if (key === 'enter') onSaveNext()
      else if (key === 'm') s.toggleMark()
      else if (key === 'backspace' || key === 'delete') s.clear()
      else {
        const idx = 'abcd'.indexOf(key) >= 0 && key.length === 1 ? 'abcd'.indexOf(key) : ['1', '2', '3', '4'].indexOf(key)
        if (idx >= 0 && q.options[idx]) s.select(q.options[idx].id)
        else return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, onSaveNext])
}
