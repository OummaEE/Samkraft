import { useEffect, useRef, useState } from 'react'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string || '0x4AAAAAACge0fuB2pVDLuUY'

interface Props {
  onVerify: (token: string) => void
  onExpire?: () => void
}

export default function TurnstileWidget({ onVerify, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Если скрипт уже загружен — не грузим повторно
    const existing = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
    )

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return
      // Удалим предыдущий виджет если есть
      if (widgetIdRef.current) {
        // eslint-disable-next-line no-empty
        try { window.turnstile.remove(widgetIdRef.current) } catch {}
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => {
          onVerify(token)
        },
        'expired-callback': () => {
          onExpire?.()
        },
        theme: 'light',
      })
      setLoaded(true)
    }

    if (existing && window.turnstile) {
      renderWidget()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.onload = () => renderWidget()
    document.head.appendChild(script)

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        // eslint-disable-next-line no-empty
        try { window.turnstile.remove(widgetIdRef.current) } catch {}
      }
    }
  }, [])

  return (
    <div style={{ margin: '1rem 0' }}>
      <div ref={containerRef} />
      {!loaded && (
        <p style={{ fontSize: '0.85rem', color: '#999' }}>
          Laddar säkerhetskontroll...
        </p>
      )}
    </div>
  )
}
