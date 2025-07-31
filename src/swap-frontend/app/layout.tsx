import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cross-Chain Swap - Ethereum ↔ ICP',
  description: 'Swap tokens between Ethereum and Internet Computer using 1inch Fusion+',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
