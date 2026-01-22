'use client'

import dynamic from 'next/dynamic'
import { isDevelopment } from '@/utils/platform'

const VibeKanbanWebCompanion = dynamic(
  () =>
    import('vibe-kanban-web-companion').then(
      (module) => module.VibeKanbanWebCompanion
    ),
  { ssr: false }
)

export const VibeKanbanWebCompanionClient = () => {
  if (!isDevelopment) {
    return null
  }

  return <VibeKanbanWebCompanion />
}
