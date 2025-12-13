// hvac-design-app/src/app/(main)/canvas/[projectId]/page.tsx
import { CanvasPageWrapper } from '@/features/canvas/CanvasPageWrapper';

type CanvasRouteParams = { projectId: string };

/**
 * Optional static params for builds that opt into NEXT_STATIC_EXPORT.
 * Returns empty array because project routes are determined at runtime.
 */
export async function generateStaticParams(): Promise<CanvasRouteParams[]> {
  const projectIds: string[] = [];
  return projectIds.map((id) => ({ projectId: id }));
}

/**
 * Canvas route page (Server Component).
 * Delegates to CanvasPageWrapper client component which handles
 * the projectId and renders the CanvasPage.
 */
export default async function CanvasRoute({ params }: { params?: Promise<CanvasRouteParams> }) {
  const resolvedParams = params ? await params : { projectId: 'untitled' };

  return <CanvasPageWrapper projectId={resolvedParams.projectId} />;
}
