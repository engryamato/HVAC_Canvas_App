'use client'

import dynamic from 'next/dynamic'
const isDevelopmentBuild = process.env.NODE_ENV === 'development'

const VibeKanbanWebCompanion = isDevelopmentBuild
  ? dynamic(
      () =>
        import('vibe-kanban-web-companion').then(
          (module) => module.VibeKanbanWebCompanion
        ),
      { ssr: false }
    )
  : () => null

export const VibeKanbanWebCompanionClient = () => {
  if (!isDevelopmentBuild) {
    return null
  }

  return <VibeKanbanWebCompanion />
}
