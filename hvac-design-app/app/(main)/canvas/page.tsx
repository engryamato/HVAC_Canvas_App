// hvac-design-app/app/(main)/canvas/page.tsx
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';

/**
 * Canvas Index Route Handler
 * 
 * This page handles navigation to `/canvas` without a projectId.
 * It creates a new "Tutorial Project" ID and redirects to `/canvas/[projectId]`.
 * This supports the onboarding tutorial flow where a project context is needed.
 */
export default function CanvasIndexRoute() {
    // Generate a temporary project ID for the tutorial session
    const tutorialProjectId = `tutorial-${nanoid(8)}`;

    // Redirect to the canvas with the generated project ID
    redirect(`/canvas/${tutorialProjectId}`);
}
