'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { formatRulerLabel, pickRulerStepWorldPx } from './rulers';

type UnitSystem = 'imperial' | 'metric';

const RULER_SIZE_PX = 24;
const TICK_HEIGHT_PX = 8;

interface RulersOverlayProps {
  containerRef: RefObject<HTMLElement>;
  panX: number;
  panY: number;
  zoom: number;
  unitSystem: UnitSystem;
}

function worldToScreen(world: number, pan: number, zoom: number): number {
  return world * zoom + pan;
}

function screenToWorld(screen: number, pan: number, zoom: number): number {
  return (screen - pan) / zoom;
}

export function RulersOverlay({
  containerRef,
  panX,
  panY,
  zoom,
  unitSystem,
}: RulersOverlayProps): React.ReactElement {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [containerRef]);

  const stepWorld = useMemo(() => pickRulerStepWorldPx(zoom, unitSystem), [zoom, unitSystem]);

  const ticks = useMemo(() => {
    const width = size.width;
    const height = size.height;
    if (width <= 0 || height <= 0 || zoom <= 0) {
      return { xTicks: [] as Array<{ left: number; label: string }>, yTicks: [] as Array<{ top: number; label: string }> };
    }

    const xStartWorld = screenToWorld(RULER_SIZE_PX, panX, zoom);
    const xEndWorld = screenToWorld(width, panX, zoom);
    const yStartWorld = screenToWorld(RULER_SIZE_PX, panY, zoom);
    const yEndWorld = screenToWorld(height, panY, zoom);

    const xFirst = Math.floor(xStartWorld / stepWorld) * stepWorld;
    const yFirst = Math.floor(yStartWorld / stepWorld) * stepWorld;

    const xTicks: Array<{ left: number; label: string }> = [];
    for (let value = xFirst; value <= xEndWorld; value += stepWorld) {
      const screen = worldToScreen(value, panX, zoom);
      if (screen >= RULER_SIZE_PX && screen <= width) {
        xTicks.push({ left: screen, label: formatRulerLabel(value, unitSystem) });
      }
    }

    const yTicks: Array<{ top: number; label: string }> = [];
    for (let value = yFirst; value <= yEndWorld; value += stepWorld) {
      const screen = worldToScreen(value, panY, zoom);
      if (screen >= RULER_SIZE_PX && screen <= height) {
        yTicks.push({ top: screen, label: formatRulerLabel(value, unitSystem) });
      }
    }

    return { xTicks, yTicks };
  }, [size.width, size.height, panX, panY, zoom, stepWorld, unitSystem]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className="absolute left-0 top-0 w-full border-b bg-background/85"
        style={{ height: RULER_SIZE_PX }}
      >
        {ticks.xTicks.map((tick) => (
          <div
            key={tick.left}
            className="absolute top-0"
            style={{ left: tick.left }}
          >
            <div
              className="border-l"
              style={{ height: TICK_HEIGHT_PX, marginTop: RULER_SIZE_PX - TICK_HEIGHT_PX }}
            />
            <div
              className="absolute top-1 text-[10px] text-foreground/70"
              style={{ transform: 'translateX(4px)' }}
            >
              {tick.label}
            </div>
          </div>
        ))}
      </div>

      <div
        className="absolute left-0 top-0 h-full border-r bg-background/85"
        style={{ width: RULER_SIZE_PX }}
      >
        {ticks.yTicks.map((tick) => (
          <div
            key={tick.top}
            className="absolute left-0"
            style={{ top: tick.top }}
          >
            <div
              className="border-t"
              style={{ width: TICK_HEIGHT_PX, marginLeft: RULER_SIZE_PX - TICK_HEIGHT_PX }}
            />
            <div
              className="absolute left-1 text-[10px] text-foreground/70"
              style={{ transform: 'translateY(2px)' }}
            >
              {tick.label}
            </div>
          </div>
        ))}
      </div>

      <div
        className="absolute left-0 top-0 border-b border-r bg-background/85"
        style={{ width: RULER_SIZE_PX, height: RULER_SIZE_PX }}
      />
    </div>
  );
}

export default RulersOverlay;

