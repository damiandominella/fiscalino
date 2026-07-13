import { Analytics } from '@vercel/analytics/next'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'] })

export const metadata: Metadata = {
  title: 'CF Generator — Codice Fiscale Italiano',
  description: 'Genera codici fiscali italiani singoli o in blocco, oppure arricchisci un CSV con i codici fiscali calcolati.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f5f3',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it" className="bg-background">
      <body className={`${inter.className} antialiased`} style={{ '--font-mono': ibmPlexMono.style.fontFamily } as React.CSSProperties}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
