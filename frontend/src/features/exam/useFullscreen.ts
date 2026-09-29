import { useEffect, useState } from 'react'

export function useFullscreen() {
  const [on, setOn] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const h = () => setOn(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => undefined)
  }
  return { on, toggle }
}
