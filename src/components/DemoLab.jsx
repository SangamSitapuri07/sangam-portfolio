import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { demos } from '@/config/demos'
import { hostedDemo } from '@/lib/demoManifest'
import { startScroll, stopScroll } from '@/lib/scrollEngine'

/**
 * DemoLab — run a project from inside the portfolio.
 *
 * Three things this deliberately does NOT do:
 *
 *   1. It does not pretend a native Android app can run in a browser. When the
 *      source is a recording, the badge says so and the limitation is stated.
 *   2. It does not assume an embed will work. External frames can refuse to load
 *      (that is what `X-Frame-Options` is for), so a timeout drops the stage into
 *      an honest fallback with a way out rather than a blank rectangle.
 *   3. It does not touch the scroll timeline. Scrolling is paused while the lab is
 *      open and resumed on close, so the film cannot run on behind the overlay.
 */

const EMBED_TIMEOUT_MS = 11000

/** Browser chrome, for the things that are websites. */
function BrowserFrame({ url, children }) {
  let host = url
  try {
    host = new URL(url).host
  } catch {
    /* a relative path (a hosted build) already reads fine as-is */
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md border border-line bg-void/70 px-3 py-1 text-center font-mono text-[0.6875rem] text-ink-faint">
          {host}
        </div>
        <div className="w-10" aria-hidden="true" />
      </div>
      <div className="relative min-h-0 flex-1 bg-void">{children}</div>
    </div>
  )
}

/** A phone, for the things you hold. */
function PhoneFrame({ children }) {
  return (
    <div className="relative mx-auto h-full max-h-[86vh] w-full max-w-[420px] rounded-[2.6rem] border border-line bg-surface-2 p-2.5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
      {/* side buttons */}
      <span aria-hidden="true" className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-r bg-line" />
      <span aria-hidden="true" className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-line" />
      <span aria-hidden="true" className="absolute -left-[3px] top-36 h-10 w-[3px] rounded-l bg-line" />
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-void">
        {/* notch */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/90"
        />
        {children}
      </div>
    </div>
  )
}

function Stage({ src, title, onFail }) {
  /* Starts as loading because the component is remounted (via `key`) whenever the
     source changes — so there is no reset to perform, and no state written
     straight out of an effect. */
  const [state, setState] = useState('loading')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState((current) => {
        if (current === 'loading') onFail?.()
        return current === 'loading' ? 'slow' : current
      })
    }, EMBED_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [onFail])

  return (
    <div className="relative h-full w-full">
      {state !== 'ready' ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-void/80 px-6 text-center">
          <span
            className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent"
            aria-hidden="true"
          />
          <p className="text-xs text-ink-soft">
            {state === 'loading' ? 'Loading the demo…' : 'Still loading…'}
          </p>
          {state === 'slow' ? (
            <p className="max-w-sm text-[0.6875rem] leading-relaxed text-ink-faint">
              Some sites refuse to be embedded. If this stays empty, use “Open in a new tab”.
            </p>
          ) : null}
        </div>
      ) : null}

      <iframe
        src={src}
        title={title}
        onLoad={() => setState('ready')}
        referrerPolicy="no-referrer"
        allow="fullscreen; clipboard-write; gamepad"
        className="h-full w-full border-0 bg-void"
      />
    </div>
  )
}

export default function DemoLab({ projectId, onClose }) {
  if (!projectId) return null
  /* Keyed on the project: opening a different demo remounts this, so every piece
     of state below starts clean instead of being reset by an effect. */
  return <DemoLabBody key={projectId} projectId={projectId} onClose={onClose} />
}

function DemoLabBody({ projectId, onClose }) {
  const demo = demos[projectId]
  const [hosted, setHosted] = useState(null)
  const [checked, setChecked] = useState(false)
  const [failed, setFailed] = useState(false)
  const panelRef = useRef(null)
  const restoreFocusTo = useRef(null)

  /* A hosted build wins over the recorded demo, when one has been dropped in. */
  useEffect(() => {
    let cancelled = false
    hostedDemo(projectId).then((entry) => {
      if (!cancelled) {
        setHosted(entry)
        setChecked(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [projectId])

  /* Pause the film while the lab is open. */
  useEffect(() => {
    stopScroll()
    return () => startScroll()
  }, [])

  /* Escape closes; focus stays inside while it is open. */
  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose]
  )

  useEffect(() => {
    restoreFocusTo.current = document.activeElement
    const closeButton = panelRef.current?.querySelector('button[data-autofocus]')
    closeButton?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      const target = restoreFocusTo.current
      if (target instanceof HTMLElement) target.focus()
    }
  }, [])

  const source = useMemo(() => {
    if (!demo) return null
    if (hosted) {
      return {
        src: hosted.path,
        kind: 'drop-in',
        badge: 'Running here',
        external: hosted.path,
      }
    }
    return { src: demo.src, kind: demo.kind, badge: demo.badge, external: demo.external }
  }, [demo, hosted])

  if (!demo) return null

  const isPhone = demo.frame === 'phone'
  const Frame = isPhone ? PhoneFrame : BrowserFrame

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${demo.title} — demo`}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[60] flex flex-col bg-void/85 backdrop-blur-md"
    >
      <div
        ref={panelRef}
        className="mx-auto flex h-full w-full max-w-[1400px] flex-col px-4 py-4 sm:px-6 sm:py-6"
      >
        {/* ---- header ---- */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 pb-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.6875rem] font-medium tracking-wide ${
              source.kind === 'video'
                ? 'border-line bg-surface-2 text-ink-soft'
                : 'border-accent/40 bg-accent/10 text-accent-bright'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                source.kind === 'video' ? 'bg-ink-faint' : 'bg-accent'
              }`}
              aria-hidden="true"
            />
            {source.kind === 'video' ? 'Recorded demo' : source.badge}
          </span>

          <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{demo.title}</h2>

          {source.external ? (
            <a
              href={source.external}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-[0.8125rem] text-ink-soft transition-colors hover:border-accent/60 hover:text-ink"
            >
              Open in a new tab ↗
            </a>
          ) : null}

          <button
            type="button"
            data-autofocus
            onClick={onClose}
            className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-[0.8125rem] text-ink-soft transition-colors hover:border-accent/60 hover:text-ink"
          >
            Close
          </button>
        </div>

        {/* ---- stage ---- */}
        <div className="min-h-0 flex-1">
          <Frame url={source.src}>
            {failed ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="max-w-md text-sm leading-relaxed text-ink-soft">
                  This demo refused to load inside the page. That is usually the site blocking
                  embedding, not a fault here.
                </p>
                {source.external ? (
                  <a
                    href={source.external}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-accent px-4 py-2 text-[0.8125rem] font-medium text-[#04101f] transition-colors hover:bg-accent-bright"
                  >
                    Open in a new tab ↗
                  </a>
                ) : null}
              </div>
            ) : (
              <Stage
                key={source.src}
                src={source.src}
                title={demo.title}
                onFail={() => setFailed(true)}
              />
            )}
          </Frame>
        </div>

        {/* ---- the honest footnote ---- */}
        {checked || demo.limitation ? (
          <div className="shrink-0 pt-4">
            {demo.limitation ? (
              <p className="mx-auto max-w-3xl text-center text-[0.6875rem] leading-relaxed text-ink-faint">
                {demo.limitation}
              </p>
            ) : null}
            {demo.howToRun && !hosted ? (
              <p className="mx-auto max-w-3xl pt-1 text-center text-[0.6875rem] leading-relaxed text-ink-faint">
                {demo.howToRun}
              </p>
            ) : null}
            {!demo.runnable ? (
              <p className="pt-1 text-center text-[0.6875rem] text-ink-faint">
                A hosted web build of this project would run here —
                <span className="text-ink-soft"> see docs/DEMO-LAB.md</span>.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
