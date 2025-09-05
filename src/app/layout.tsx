import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cat Runner - Endless Running Game',
  description: 'Chrome Dino inspired endless running game featuring a cute cat character',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}