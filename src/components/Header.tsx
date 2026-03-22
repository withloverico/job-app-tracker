import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Briefcase } from 'lucide-react'

export default function Header() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = user?.user_metadata?.full_name as string | undefined || user?.email

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-white font-semibold text-lg">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          <span>Job Tracker</span>
        </a>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-indigo-500/50 transition-all"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full border border-slate-600"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium">
                {displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1">
              <div className="px-4 py-2 border-b border-slate-700">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
