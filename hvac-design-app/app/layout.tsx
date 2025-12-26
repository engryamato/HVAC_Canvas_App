import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SizeWise HVAC Canvas',
  description: 'Professional HVAC design and estimation desktop application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

