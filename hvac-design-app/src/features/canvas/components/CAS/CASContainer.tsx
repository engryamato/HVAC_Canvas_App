'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';

import { Popover } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  executeCasAction,
  getActionDisplayValue,
  getActionsForEntity,
  getSizeFields,
  type CasAction,
  type CasEntitySnapshot,
} from './actionRegistry';
import { useCasStore, type CasAnchorRect } from '../../store/casStore';

interface CASContainerProps {
  entity?: CasEntitySnapshot;
  selectionMode?: 'single' | 'multi' | 'segment';
  selectionCount?: number;
  anchorRect?: CasAnchorRect;
}

function clampPosition(anchorRect?: CasAnchorRect) {
  const width = 360;
  const height = 52;
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight;
  const x = anchorRect ? anchorRect.x + anchorRect.width + 8 : 24;
  const y = anchorRect ? anchorRect.y : 24;

  return {
    left: Math.max(8, Math.min(x, viewportWidth - width - 8)),
    top: Math.max(8, Math.min(y, viewportHeight - height - 8)),
  };
}

function fireInspector(entity?: CasEntitySnapshot) {
  window.dispatchEvent(new CustomEvent('sws:open-inspector', { detail: { entityId: entity?.id } }));
}

function ActionPopover({
  action,
  entity,
  anchorRect,
  onClose,
}: {
  action: CasAction;
  entity: CasEntitySnapshot;
  anchorRect?: CasAnchorRect;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState<Record<string, string>>(() => {
    if (action.id === 'duct-size') {
      return Object.fromEntries(getSizeFields(entity).map((field) => [field, String(entity.props[field] ?? '')]));
    }
    return { value: String(entity.props[action.field ?? ''] ?? '') };
  });

  if (action.behavior === 'popover-select') {
    return (
      <Popover open anchorRect={anchorRect} onOpenChange={(open) => !open && onClose()}>
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase text-slate-500">{action.label}</div>
          {action.options?.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              className="min-h-8 rounded border border-slate-200 px-2 text-left text-sm hover:bg-slate-50"
              onClick={() => {
                executeCasAction(action, entity, option.value);
                onClose();
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Popover>
    );
  }

  return (
    <Popover open anchorRect={anchorRect} onOpenChange={(open) => !open && onClose()}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const payload =
            action.id === 'duct-size'
              ? Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, Number(value)]))
              : Number(draft.value);
          executeCasAction(action, entity, payload);
          onClose();
        }}
      >
        <div className="text-xs font-semibold uppercase text-slate-500">{action.label}</div>
        {action.id === 'duct-size' ? (
          getSizeFields(entity).map((field) => (
            <label key={field} className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              {field}
              <Input
                aria-label={field}
                type="number"
                step="0.25"
                value={draft[field] ?? ''}
                onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
              />
              <span className="text-[11px] text-slate-500">
                {entity.props.provenance?.[field] === 'specified' ? 'specified' : entity.props.provenance?.[field] ?? 'default'}
              </span>
            </label>
          ))
        ) : (
          <Input
            aria-label={action.label}
            type="number"
            value={draft.value ?? ''}
            onChange={(event) => setDraft({ value: event.target.value })}
          />
        )}
        <button type="submit" className="min-h-8 rounded bg-blue-600 px-3 text-sm font-medium text-white">
          Apply
        </button>
      </form>
    </Popover>
  );
}

export function CASContainer({
  entity,
  selectionMode = entity?.scope === 'segment' ? 'segment' : 'single',
  selectionCount = 1,
  anchorRect,
}: CASContainerProps) {
  const closeCas = useCasStore((state) => state.closeCas);
  const [popoverAction, setPopoverAction] = React.useState<CasAction | null>(null);
  const position = clampPosition(anchorRect);
  const actions = entity ? getActionsForEntity(entity) : [];

  const activateAction = React.useCallback(
    (action: CasAction) => {
      if (!entity) {
        return;
      }

      if (action.behavior === 'popover-edit' || action.behavior === 'popover-select') {
        setPopoverAction(action);
        return;
      }

      executeCasAction(action, entity);
      if (action.behavior === 'inspector-deeplink') {
        closeCas();
      }
    },
    [closeCas, entity]
  );

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCas();
        return;
      }

      if (/^[1-6]$/.test(event.key)) {
        const action = actions[Number(event.key) - 1];
        if (action) {
          event.preventDefault();
          activateAction(action);
        }
      }
    },
    [actions, activateAction, closeCas]
  );

  if (selectionMode === 'multi') {
    return (
      <div
        role="toolbar"
        aria-label="Quick edits"
        data-testid="cas-container"
        tabIndex={0}
        className="absolute z-30 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm shadow-lg outline-none focus:ring-2 focus:ring-blue-400"
        style={position}
        onKeyDown={onKeyDown}
      >
        <span className="px-2 text-slate-600">{selectionCount} selected</span>
        <button
          type="button"
          className="inline-flex min-h-8 items-center gap-1 rounded border border-slate-200 px-2 font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => fireInspector(entity)}
        >
          <ExternalLink size={14} /> Open Inspector
        </button>
      </div>
    );
  }

  return (
    <div
      role="toolbar"
      aria-label="Quick edits"
      data-testid="cas-container"
      tabIndex={0}
      className="absolute z-30 flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm shadow-lg outline-none focus:ring-2 focus:ring-blue-400"
      style={position}
      onKeyDown={onKeyDown}
    >
      {actions.map((action, index) => (
        <button
          key={action.id}
          type="button"
          className="inline-flex min-h-8 min-w-8 items-center justify-center rounded border border-transparent px-2 font-medium text-slate-700 hover:border-slate-200 hover:bg-slate-50"
          aria-label={action.label}
          onClick={() => activateAction(action)}
        >
          <span className="mr-1 text-[10px] text-slate-400">{index + 1}</span>
          {action.label}
          {entity ? <span className="ml-1 text-[11px] font-normal text-slate-500">{getActionDisplayValue(action, entity)}</span> : null}
        </button>
      ))}
      {popoverAction && entity ? (
        <ActionPopover
          action={popoverAction}
          entity={entity}
          anchorRect={anchorRect}
          onClose={() => setPopoverAction(null)}
        />
      ) : null}
    </div>
  );
}
