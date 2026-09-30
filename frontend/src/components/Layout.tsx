import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const { username, logout } = useAuthStore()
  const nav = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex h-16 items-center border-b border-slate-100 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <span className="text-lg font-bold tracking-tight text-slate-800">MockMaster</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavLink to="/" end className={navLinkClass} title="Dashboard">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/tests" className={navLinkClass} title="Mock Tests">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            {!collapsed && <span>Mock Tests</span>}
          </NavLink>
          <NavLink to="/history" className={navLinkClass} title="Test History">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {!collapsed && <span>Test History</span>}
          </NavLink>
          <NavLink to="/create" className={navLinkClass} title="Create Mock">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {!collapsed && <span>Create mock</span>}
          </NavLink>
          <NavLink to="/analytics" className={navLinkClass} title="Analytics">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            {!collapsed && <span>Analytics</span>}
          </NavLink>
        </nav>
        
        <div className="border-t border-slate-100">
          <div className="p-2">
            <NavLink to="/mcp" className={navLinkClass} title="MCP Guide">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              {!collapsed && <span>MCP Guide</span>}
            </NavLink>
          </div>
          
          <div className="border-t border-slate-100 p-3">
            <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {username?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium text-slate-900">{username}</p>
                <button onClick={() => { logout(); nav('/login') }} className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-red-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Log out
                </button>
              </div>
            )}
          </div>
          {collapsed && (
            <button title="Log out" onClick={() => { logout(); nav('/login') }} className="mt-2 flex w-full justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          )}
        </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
          <span className="text-lg font-bold text-slate-800">MockMaster</span>
          <button onClick={() => setCollapsed(!collapsed)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </header>
        
        {/* Mobile menu dropdown */}
        {collapsed && (
          <div className="absolute top-16 left-0 right-0 z-50 border-b border-slate-200 bg-white p-4 shadow-lg md:hidden">
            <nav className="flex flex-col gap-2">
              <NavLink to="/" end className={navLinkClass} onClick={() => setCollapsed(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/tests" className={navLinkClass} onClick={() => setCollapsed(false)}>
                Mock Tests
              </NavLink>
              <NavLink to="/history" className={navLinkClass} onClick={() => setCollapsed(false)}>
                Test History
              </NavLink>
              <NavLink to="/create" className={navLinkClass} onClick={() => setCollapsed(false)}>
                Create mock
              </NavLink>
              <NavLink to="/analytics" className={navLinkClass} onClick={() => setCollapsed(false)}>
                Analytics
              </NavLink>
              <NavLink to="/mcp" className={navLinkClass} onClick={() => setCollapsed(false)}>
                MCP Guide
              </NavLink>
              <button onClick={() => { logout(); nav('/login') }} className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                Log out
              </button>
            </nav>
          </div>
        )}

        <div className="mx-auto max-w-6xl p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
