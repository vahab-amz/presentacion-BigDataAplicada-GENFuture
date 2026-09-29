import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import { MotionProvider } from '@/deck/MotionProvider'
import './globals.css'

/**
 * Both faces are downloaded at build time and served from `out/`, so the deck
 * makes no network request at run time. `display: 'block'` rather than 'swap':
 * the files are local and instant, and a swap would show a flash of fallback
 * metrics on the projector.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'block',
  variable: '--font-inter',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'block',
  variable: '--font-source-serif',
  // Optical sizing genuinely helps a display serif at 80 px.
  axes: ['opsz'],
})

export const metadata: Metadata = {
  title: 'GENFuture · Equipo 2 · Terapias',
  description:
    'Propuesta de plataforma cloud para GENFuture: carrera, caja, servicios, presupuesto a 3 años y riesgos.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c1220',
}

/** Applies the stored theme before the first paint, so T never flashes. */
const themeScript = `
try {
  var t = localStorage.getItem('genfuture-deck-theme');
  document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
} catch (e) {
  document.documentElement.dataset.theme = 'dark';
}
`.trim()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-ES"
      data-theme="dark"
      className={`${inter.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
