import { ReactNode } from 'react'

export default function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">CBT Mock Creator</h1>
        <p className="mb-5 text-sm text-ink-soft">{title}</p>
        {children}
      </div>
    </div>
  )
}
