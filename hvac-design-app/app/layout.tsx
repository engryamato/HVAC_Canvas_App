import type { Metadata } from 'next'
import './globals.css'
import { DeviceWarning } from '@components/common/DeviceWarning'
import { VibeKanbanWebCompanionClient } from '@components/common/VibeKanbanWebCompanionClient'
import { ToastHost } from '@components/ui/ToastHost'
import { ToastProvider } from '@/components/ui/ToastContext'

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          <DeviceWarning />
          <VibeKanbanWebCompanionClient />
          <ToastHost />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

