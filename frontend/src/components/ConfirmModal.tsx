import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  isDestructive = true,
  onConfirm, 
  onCancel 
}: Props) {
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm transition-opacity" onClick={onCancel}>
      <div 
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {isDestructive ? (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-200" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`flex-1 rounded-xl py-3 font-semibold text-white shadow-sm transition-all hover:shadow-md ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`} 
            onClick={() => { onConfirm(); onCancel() }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
