import { useCallback, useEffect, useRef } from 'react'
import { saveAnswers } from '../../api/endpoints'
import { backupKey, useExamStore } from '../../store/examStore'

/** Debounced autosave + retry + local backup so answers survive network drops and page refreshes. */
export function useAutosave(sessionId: number, enabled: boolean) {
  const inFlight = useRef(false)

  const backup = useCallback(() => {
    const s = useExamStore.getState()
    if (s.sessionId !== sessionId) return
    try {
      localStorage.setItem(backupKey(sessionId), JSON.stringify({ answers: s.answers, dirty: s.dirty, currentIndex: s.currentIndex }))
    } catch { /* storage full/blocked - server sync is still the primary path */ }
  }, [sessionId])

  const flush = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return false
    const s = useExamStore.getState()
    const ids = Object.keys(s.dirty).map(Number)
    if (!ids.length) return true
    const synced = Object.fromEntries(ids.map((id) => [id, s.answers[id]]))
    inFlight.current = true
    try {
      await saveAnswers(
        sessionId,
        ids.map((id) => ({
          mock_question: id, selected_option: s.answers[id].selected, marked: s.answers[id].marked,
          visited: s.answers[id].visited, time_spent_seconds: s.answers[id].timeSpent,
        })),
        s.currentIndex,
      )
      useExamStore.getState().markClean(synced)
      return true
    } catch {
      return false
    } finally {
      inFlight.current = false
    }
  }, [sessionId])

  const dirty = useExamStore((s) => s.dirty)

  useEffect(() => {
    if (!enabled) return
    backup()
    if (!Object.keys(dirty).length) return
    const t = setTimeout(flush, 700)
    return () => clearTimeout(t)
  }, [dirty, enabled, flush, backup])

  useEffect(() => {
    if (!enabled) return
    const interval = setInterval(() => { backup(); void flush() }, 5000)
    const onOnline = () => void flush()
    const onHide = () => backup()
    window.addEventListener('online', onOnline)
    window.addEventListener('beforeunload', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('beforeunload', onHide)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [enabled, flush, backup])

  return flush
}
