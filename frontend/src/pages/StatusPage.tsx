// Phase 1 check page: proves the whole path works
// (React -> preload -> IPC -> controller -> service -> back).
// The real Library, Game, History and Settings pages replace it in phase 3.
import { useEffect, useState } from 'react'
import { respawn } from '../api/respawn'
import type { AppInfo } from '../../../shared/ipc'

export function StatusPage() {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('hello from React')
  const [reply, setReply] = useState<string | null>(null)

  useEffect(() => {
    respawn.app.info().then(setInfo).catch((e: Error) => setError(e.message))
  }, [])

  async function sendPing() {
    setError(null)
    try {
      setReply(await respawn.app.ping(message))
    } catch (e) {
      setReply(null)
      setError((e as Error).message)
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Phase 1 · new structure</p>
        <h1 className="font-headline text-4xl font-bold">Respawn</h1>
        <p className="text-on-surface-variant">
          This screen is built with React and talks to the backend through the safe preload menu.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold">Backend</h2>
        {info ? (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-on-surface-variant">App version</dt><dd>{info.version}</dd>
            <dt className="text-on-surface-variant">Platform</dt><dd>{info.platform}</dd>
            <dt className="text-on-surface-variant">Electron</dt><dd>{info.electronVersion}</dd>
            <dt className="text-on-surface-variant">Node</dt><dd>{info.nodeVersion}</dd>
            <dt className="text-on-surface-variant">Data folder</dt><dd className="break-all">{info.dataFolder}</dd>
          </dl>
        ) : (
          <p className="text-sm text-on-surface-variant">Asking the backend…</p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-6">
        <h2 className="font-headline text-lg font-bold">Round trip</h2>
        <div className="flex gap-2">
          <input
            id="ping-message"
            className="flex-1 rounded-lg bg-surface-container-highest px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-secondary"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={sendPing}
            className="rounded-lg bg-primary px-5 py-2 font-headline text-sm font-bold text-on-primary hover:brightness-110 focus-visible:ring-2 focus-visible:ring-secondary"
          >
            Send
          </button>
        </div>
        {reply && <p className="text-sm text-secondary">{reply}</p>}
        <p className="text-xs text-on-surface-variant">Messages over 200 characters are refused by the backend, to show errors reaching the screen.</p>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</p>
      )}
    </main>
  )
}
