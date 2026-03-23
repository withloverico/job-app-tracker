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
    <header className="fixed top-0 left-0 right-0 z-40 frost-strong" style={{ borderRadius: 0 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-stone-800 font-semibold text-lg">
          <Briefcase className="w-5 h-5 text-amber-700" />
          <span>Job Tracker</span>
        </a>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-amber-600/30 transition-all pr-1"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full border border-white/50 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center text-sm font-medium shadow-sm">
                {displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span className="hidden sm:inline text-sm font-medium text-stone-700 max-w-[120px] truncate">
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 frost-strong rounded-xl shadow-lg py-1">
              <div className="px-4 py-2 border-b border-stone-200/50">
                <p className="text-sm font-medium text-stone-800 truncate">{displayName}</p>
                <p className="text-xs text-stone-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="w-full px-4 py-2 text-sm text-stone-600 hover:bg-white/30 hover:text-stone-800 flex items-center gap-2 transition-colors"
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
