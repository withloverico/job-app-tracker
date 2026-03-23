import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  Sparkles,
  ClipboardList,
  Brain,
  BarChart3,
  Bell,
  Shield,
  ArrowRight,
  ExternalLink,
  ChevronsDown,
} from 'lucide-react'

function TypeWriter({ text, className, delay = 0, onDone, active }: { text: string; className?: string; delay?: number; onDone?: () => void; active: boolean }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!active) return
    if (delay === 0) { setStarted(true); return }
    const timer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timer)
  }, [active, delay])

  useEffect(() => {
    if (!started || !active) return
    if (displayed.length >= text.length) {
      onDone?.()
      return
    }
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, 25)
    return () => clearTimeout(timer)
  }, [started, active, displayed, text, onDone])

  return (
    <span className={className}>
      {displayed}
      {started && displayed.length < text.length && <span className="animate-pulse">|</span>}
    </span>
  )
}

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [splashed, setSplashed] = useState(false)
  const [scrollOpacity, setScrollOpacity] = useState(1)
  const [line1Done, setLine1Done] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.2 }
    )

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  function popClass(section: string) {
    return visibleSections.has(section) ? 'pop-up' : 'opacity-0'
  }

  useEffect(() => {
    const timer = setTimeout(() => setSplashed(true), 400)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    function handleScroll() {
      const fade = 1 - Math.min(window.scrollY / 300, 1)
      setScrollOpacity(fade)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: <ClipboardList className="w-6 h-6" />,
      title: 'one-click tracking',
      desc: 'paste a job url and we auto-fill everything: title, company, salary, skills, and more.',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'llm-powered parsing',
      desc: 'we send job postings to an llm that extracts structured data instantly. no manual entry needed.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'status pipeline',
      desc: 'track every application from bookmarked to applied to interview to offer with full history.',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'deadline awareness',
      desc: 'never miss an application deadline. see dates, follow-ups, and timelines at a glance.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'beautiful & fast',
      desc: 'glassmorphism ui that looks stunning on desktop and mobile. instant interactions, zero lag.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'private & secure',
      desc: 'your data is yours. authenticated access only, with row-level security on every query.',
    },
  ]

  const steps = [
    { num: '1', title: 'paste a job url', desc: 'drop in a link from any job board: linkedin, indeed, greenhouse, you name it.' },
    { num: '2', title: 'llm does the work', desc: 'our backend sends the posting to an llm that parses out every detail automatically.' },
    { num: '3', title: 'review & save', desc: 'check the auto-filled fields, add notes, and save. your pipeline stays organized.' },
    { num: '4', title: 'track your progress', desc: 'update statuses, leave notes, and see your full application timeline.' },
  ]

  const techStack = ['react', 'typescript', 'tailwind css', 'vite', 'supabase']

  return (
    <div className="min-h-dvh overflow-x-hidden">
      {/* Hero Section */}
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* White circle splash behind the card */}
        <div
          className={`absolute left-1/2 top-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] rounded-full pointer-events-none ${
            splashed ? 'circle-splash' : 'opacity-0'
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0) 70%)',
            transform: 'translate(-50%, -50%) scale(0)',
            zIndex: 0,
          }}
        />
        {/* Ripple ring */}
        {splashed && (
          <div
            className="absolute left-1/2 top-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] rounded-full pointer-events-none circle-ripple"
            style={{
              border: '2px solid rgba(255,255,255,0.5)',
              transform: 'translate(-50%, -50%) scale(0)',
              zIndex: 0,
            }}
          />
        )}

        {/* Login card */}
        <div className="relative z-10 w-full max-w-sm text-center frost-strong rounded-2xl p-8 shadow-lg pop-up">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="job tracker" className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
          </div>

          <h1 className="text-3xl font-bold text-stone-800 mb-2">job tracker</h1>
          <p className="text-stone-500 mb-8">
            track your job applications, auto-fill from postings, and stay organized.
          </p>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white/80 hover:bg-white text-stone-800 font-medium py-3 px-4 rounded-xl transition-colors shadow-sm border border-stone-200/50 pulse-glow"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            sign in with google
          </button>

          <p className="mt-6 text-xs text-stone-400">
            your data is private and only accessible to you.
          </p>
        </div>

        {/* Scroll hint pill - fixed to bottom, fades on scroll */}
        <div
          style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 20, opacity: scrollOpacity, pointerEvents: scrollOpacity < 0.1 ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}
        >
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="frost-strong rounded-full px-6 py-3 shadow-lg flex items-center gap-2.5 cursor-pointer hover:bg-white/80 transition-colors animate-bounce"
          >
            <ChevronsDown className="w-5 h-5 text-amber-700" />
            <span className="text-sm font-medium text-stone-700">see how it works</span>
            <ChevronsDown className="w-5 h-5 text-amber-700" />
          </button>
        </div>
      </div>

      {/* Content sections */}
      <main className="px-4 pb-20">
        {/* Why Section */}
        <section
          id="why"
          ref={(el) => { sectionRefs.current['why'] = el }}
          aria-label="Why use job tracker"
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <div className={`frost-strong rounded-2xl p-8 sm:p-10 shadow-sm ${popClass('why')}`} style={{ animationDelay: '0.15s' }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4">
              <TypeWriter text="job hunting is chaos." active={visibleSections.has('why')} onDone={() => setLine1Done(true)} />
              <br />
              <TypeWriter text="this brings order." className="text-amber-700" delay={100} active={visibleSections.has('why') && line1Done} />
            </h2>
            <p className="text-stone-500 text-base sm:text-lg leading-relaxed">
              spreadsheets break down. bookmarks get lost. emails pile up.
              job tracker gives you a single, beautiful place to manage every application
              from discovery to offer.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section
          id="features"
          ref={(el) => { sectionRefs.current['features'] = el }}
          aria-label="Features"
          className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-24"
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`frost-strong rounded-2xl p-6 shadow-sm ${
                popClass('features')
              }`}
              style={{ animationDelay: `${0.15 + i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-700 mb-4">
                {f.icon}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-stone-800 mb-2">{f.title}</h3>
              <p className="text-sm sm:text-base text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* How It Works */}
        <section
          id="how"
          ref={(el) => { sectionRefs.current['how'] = el }}
          aria-label="How it works"
          className="max-w-3xl mx-auto mb-24"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 text-glow text-center mb-10">
            how it works
          </h2>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`frost-strong rounded-2xl p-6 flex gap-5 items-start shadow-sm ${
                  popClass('how')
                }`}
                style={{ animationDelay: `${0.15 + i * 0.12}s` }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-stone-800 mb-1 flex items-center gap-2">
                    {step.title}
                    {step.num === '2' && <ArrowRight className="w-4 h-4 text-amber-600" />}
                  </h3>
                  <p className="text-sm sm:text-base text-stone-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          id="cta"
          ref={(el) => { sectionRefs.current['cta'] = el }}
          aria-label="Get started"
          className="max-w-2xl mx-auto text-center mb-24"
        >
          <div className={`frost-strong rounded-2xl p-8 sm:p-12 shadow-lg ${popClass('cta')}`} style={{ animationDelay: '0.15s' }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-3">
              ready to get organized?
            </h2>
            <p className="text-stone-500 mb-8 text-sm sm:text-base">
              stop losing track of applications. start landing interviews.
            </p>
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-3 bg-amber-700 hover:bg-amber-600 text-white font-medium py-3 px-8 rounded-xl transition-colors shadow-sm text-base"
            >
              get started free
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Built With */}
        <section
          id="tech"
          ref={(el) => { sectionRefs.current['tech'] = el }}
          aria-label="Tech stack"
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 text-glow text-center mb-8">
            built with
          </h2>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10">
            {techStack.map((tech, i) => (
              <div
                key={tech}
                className={`frost-strong rounded-xl px-4 py-3 shadow-sm text-center ${
                  popClass('tech')
                }`}
                style={{ animationDelay: `${0.15 + i * 0.08}s` }}
              >
                <p className="text-sm sm:text-base font-semibold text-stone-800">{tech}</p>
              </div>
            ))}
          </div>

          <div className={`frost-strong rounded-full px-6 py-3 inline-flex items-center gap-2 shadow-sm ${popClass('tech')}`} style={{ animationDelay: '0.4s' }}>
            <span className="text-sm text-stone-500">built with love by</span>
            <a
              href="https://linkedin.com/in/ricobolos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-amber-700 hover:text-amber-600 transition-colors flex items-center gap-1"
            >
              rico bolos
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
