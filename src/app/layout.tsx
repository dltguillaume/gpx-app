import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MapsGPS',
  description: 'Visualisation et édition de traces GPS',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
