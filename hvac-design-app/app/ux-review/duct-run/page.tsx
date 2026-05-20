'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { FabricationProfileSettingsPanel } from '@/components/dialogs/FabricationProfileSettingsPanel';
import { DuctRunInspector } from '@/features/canvas/components/Inspector/DuctRunInspector';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import type { DuctRun } from '@/core/schema';

function createRun(
  id: string,
  overrides?: Partial<Extract<DuctRun['props'], { shape: 'rectangular' }>>,
  segments?: Extract<DuctRun['props'], { shape: 'rectangular' }>['segments']
): DuctRun {
  return {
    id,
    type: 'duct_run',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 5,
    createdAt: '2026-05-01T00:00:00.000Z',
    modifiedAt: '2026-05-01T00:00:00.000Z',
    calculated: { area: 100, velocity: 800, frictionLoss: 0.1 },
    props: {
      name: 'Supply Run A',
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 24,
      height: 12,
      material: 'galvanized',
      airflow: 1200,
      staticPressure: 0.3,
      installLength: 13,
      segments: segments ?? [
        { index: 0, startStation: 0, endStation: 5, length: 5, isPartial: false },
        { index: 1, startStation: 5, endStation: 10, length: 5, isPartial: false },
        { index: 2, startStation: 10, endStation: 13, length: 3, isPartial: true },
      ],
      ...overrides,
    },
  };
}

const wholeRun = createRun('review-run-whole');
const singleSegmentRun = createRun('review-run-single', { sectionLengthOverride: 6 });
const multiSegmentRun = createRun('review-run-multi', { sectionLengthOverride: 8 }, [
  { index: 0, startStation: 0, endStation: 4, length: 4, isPartial: false },
  { index: 1, startStation: 4, endStation: 8, length: 4, isPartial: false },
  { index: 2, startStation: 8, endStation: 11, length: 3, isPartial: true },
  { index: 3, startStation: 11, endStation: 14, length: 3, isPartial: true },
]);

function ReviewStateBootstrap() {
  useEffect(() => {
    useFabricationProfileStore.persist?.clearStorage?.();
    useFabricationProfileStore.getState().resetProfiles();
    useSelectionStore.setState({
      selectedIds: [wholeRun.id, singleSegmentRun.id, multiSegmentRun.id],
      selectedSegments: [
        { runId: singleSegmentRun.id, segmentIndex: 2 },
        { runId: multiSegmentRun.id, segmentIndex: 1 },
        { runId: multiSegmentRun.id, segmentIndex: 3 },
      ],
      hoveredId: null,
    });

    return () => {
      useSelectionStore.setState({
        selectedIds: [],
        selectedSegments: [],
        hoveredId: null,
      });
    };
  }, []);

  return null;
}

function ReviewShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 px-8 py-6">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p>
      </div>
      <div className="px-8 py-8">{children}</div>
    </section>
  );
}

export default function DuctRunUxReviewPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10">
      <ReviewStateBootstrap />

      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">UX Review Harness</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Fabrication profile settings and duct-run inspector review
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Internal review surface for desktop QA of the fabrication settings IA and the whole-run,
            single-segment, and multi-segment inspector states.
          </p>
        </header>

        <ReviewShell
          title="Settings Dialog Surface"
          description="Desktop shell for reviewing the fabrication profile section within the widened settings treatment."
        >
          <div className="mx-auto max-w-5xl rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-950">Settings</h3>
              <p className="mt-1 text-sm text-slate-500">
                Appearance, canvas, and storage settings are automatically saved. Fabrication profile changes apply when you press Save.
              </p>
            </div>
            <div className="px-6 py-6">
              <FabricationProfileSettingsPanel />
            </div>
          </div>
        </ReviewShell>

        <ReviewShell
          title="Inspector States"
          description="Reference states for whole-run, single-segment, and multi-segment duct-run inspection."
        >
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">Whole Run</div>
              <DuctRunInspector entity={wholeRun} />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">Single Segment</div>
              <DuctRunInspector entity={singleSegmentRun} />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">Multi Segment</div>
              <DuctRunInspector entity={multiSegmentRun} />
            </div>
          </div>
        </ReviewShell>
      </div>
    </main>
  );
}
