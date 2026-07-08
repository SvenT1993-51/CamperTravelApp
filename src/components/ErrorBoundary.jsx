import React from 'react'

// Catches any render/runtime error so the whole app never white-screens on a
// shared tablet used by little ones with no grown-up to debug. Fully offline:
// the fallback just offers a friendly "start over" reload.
export default class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-5 bg-brand-cream px-8 text-center">
        <div className="text-7xl animate-bounce select-none">🚐</div>
        <h1 className="text-3xl font-black text-orange-700">Oeps! Er ging iets mis</h1>
        <p className="text-lg font-bold text-amber-800/70">
          Geen zorgen — tik op de knop om opnieuw te starten.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-tap rounded-full bg-brand-green text-white text-2xl font-black shadow-lg px-10 py-4 active:scale-95 transition-transform"
        >
          Opnieuw starten 🔄
        </button>
      </div>
    )
  }
}
