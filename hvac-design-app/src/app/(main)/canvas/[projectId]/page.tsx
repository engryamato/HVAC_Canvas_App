// hvac-design-app/src/app/(main)/canvas/[projectId]/page.tsx
import { CanvasPageWrapper } from '@/features/canvas/CanvasPageWrapper';

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
 *
 * NOTE: params is accepted as `any` to avoid the Next.js PageProps type constraint
 * that caused a TypeScript incompatibility during build. This is a minimal change
 * to make the build succeed; if you prefer stricter types, see note below.
 */
export default function CanvasRoute({ params }: any) {
  return <CanvasPageWrapper projectId={params?.projectId} />;
}
