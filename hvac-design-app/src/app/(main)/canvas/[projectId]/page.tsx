import { CanvasPageWrapper } from '@/features/canvas/CanvasPageWrapper';

interface CanvasRouteProps {
  params: { projectId: string };
}

/**
 * Generate static params for static export.
 * Returns empty array - all project routes are dynamically generated at runtime.
 * This is required for Next.js static export with dynamic routes.
 */
export function generateStaticParams(): { projectId: string }[] {
  return [];
}

/**
 * Canvas route page (Server Component).
 * Delegates to CanvasPageWrapper client component which handles
 * the projectId and renders the CanvasPage.
 */
export default function CanvasRoute({ params }: CanvasRouteProps) {
  return <CanvasPageWrapper projectId={params.projectId} />;
}
