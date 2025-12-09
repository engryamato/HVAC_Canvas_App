'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useViewportStore } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import type { Entity } from '@/core/schema';

interface CanvasContainerProps {
  className?: string;
  /** Callback when mouse moves over canvas, provides canvas coordinates */
  onMouseMove?: (canvasX: number, canvasY: number) => void;
  /** Callback when mouse leaves canvas */
  onMouseLeave?: () => void;
}

/**
 * Main canvas component using pure Canvas 2D API (per DEC-001).
 * Handles rendering, viewport transforms, and resize.
 */
export function CanvasContainer({ className, onMouseMove, onMouseLeave }: CanvasContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const { panX, panY, zoom, gridVisible, gridSize } = useViewportStore();
  const entities = useEntityStore((state) =>
    state.allIds.map((id) => state.byId[id]).filter((e): e is Entity => e !== undefined)
  );

  /**
   * Get canvas 2D context with proper scaling for device pixel ratio
   */
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    return ctx;
  }, []);

  /**
   * Handle canvas resize
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    // Get device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size to container size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Scale context for device pixel ratio
    const ctx = getContext();
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [getContext]);

  /**
   * Render grid lines
   */
  const renderGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const scaledGridSize = gridSize;

      // Calculate visible area in world coordinates
      const startX = Math.floor(-panX / zoom / scaledGridSize) * scaledGridSize;
      const startY = Math.floor(-panY / zoom / scaledGridSize) * scaledGridSize;
      const endX = startX + width / zoom + scaledGridSize * 2;
      const endY = startY + height / zoom + scaledGridSize * 2;

      ctx.strokeStyle = '#E5E5E5';
      ctx.lineWidth = 1 / zoom; // Keep line width constant regardless of zoom

      ctx.beginPath();

      // Vertical lines
      for (let x = startX; x <= endX; x += scaledGridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }

      // Horizontal lines
      for (let y = startY; y <= endY; y += scaledGridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }

      ctx.stroke();
    },
    [panX, panY, zoom, gridSize]
  );

  /**
   * Render a room entity
   */
  const renderRoom = useCallback((ctx: CanvasRenderingContext2D, room: Entity) => {
    if (room.type !== 'room') {
      return;
    }
    const { width, length } = room.props;
    ctx.fillStyle = '#E3F2FD';
    ctx.strokeStyle = '#1976D2';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, width, length);
    ctx.strokeRect(0, 0, width, length);
  }, []);

  /**
   * Render a duct entity
   */
  const renderDuct = useCallback((ctx: CanvasRenderingContext2D, duct: Entity) => {
    if (duct.type !== 'duct') {
      return;
    }
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(duct.props.length * 12, 0); // Convert feet to pixels
    ctx.stroke();
  }, []);

  /**
   * Render an equipment entity
   */
  const renderEquipment = useCallback((ctx: CanvasRenderingContext2D, equipment: Entity) => {
    if (equipment.type !== 'equipment') {
      return;
    }
    const { width, depth } = equipment.props;
    ctx.fillStyle = '#FFF3E0';
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, width, depth);
    ctx.strokeRect(0, 0, width, depth);
  }, []);

  /**
   * Render a fitting entity
   */
  const renderFitting = useCallback((ctx: CanvasRenderingContext2D, fitting: Entity) => {
    if (fitting.type !== 'fitting') {
      return;
    }
    ctx.fillStyle = '#E8F5E9';
    ctx.strokeStyle = '#388E3C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, []);

  /**
   * Render a note entity
   */
  const renderNote = useCallback((ctx: CanvasRenderingContext2D, note: Entity) => {
    if (note.type !== 'note') {
      return;
    }
    ctx.fillStyle = '#FFF9C4';
    ctx.strokeStyle = '#F9A825';
    ctx.lineWidth = 1;
    ctx.fillRect(0, 0, 100, 50);
    ctx.strokeRect(0, 0, 100, 50);
  }, []);

  /**
   * Render all entities
   */
  const renderEntities = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Sort by zIndex
      const sortedEntities = [...entities].sort((a, b) => a.zIndex - b.zIndex);

      for (const entity of sortedEntities) {
        ctx.save();

        // Apply entity transform
        ctx.translate(entity.transform.x, entity.transform.y);
        ctx.rotate((entity.transform.rotation * Math.PI) / 180);
        ctx.scale(entity.transform.scaleX, entity.transform.scaleY);

        // Render based on entity type
        switch (entity.type) {
          case 'room':
            renderRoom(ctx, entity);
            break;
          case 'duct':
            renderDuct(ctx, entity);
            break;
          case 'equipment':
            renderEquipment(ctx, entity);
            break;
          case 'fitting':
            renderFitting(ctx, entity);
            break;
          case 'note':
            renderNote(ctx, entity);
            break;
          case 'group':
            // Groups are rendered by their children
            break;
        }

        ctx.restore();
      }
    },
    [entities, renderRoom, renderDuct, renderEquipment, renderFitting, renderNote]
  );

  /**
   * Main render loop
   */
  const render = useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save context state
    ctx.save();

    // Apply viewport transform
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Render grid (if visible)
    if (gridVisible) {
      renderGrid(ctx, width, height);
    }

    // Render entities
    renderEntities(ctx);

    // Restore context state
    ctx.restore();

    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(render);
  }, [getContext, panX, panY, zoom, gridVisible, renderGrid, renderEntities]);

  // Set up resize observer
  useEffect(() => {
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  // Start render loop
  useEffect(() => {
    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  /**
   * Convert screen coordinates to canvas coordinates
   */
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - panX) / zoom;
      const y = (screenY - rect.top - panY) / zoom;
      return { x, y };
    },
    [panX, panY, zoom]
  );

  /**
   * Handle mouse move on canvas
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (onMouseMove) {
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        onMouseMove(x, y);
      }
    },
    [onMouseMove, screenToCanvas]
  );

  /**
   * Handle mouse leave on canvas
   */
  const handleMouseLeave = useCallback(() => {
    if (onMouseLeave) {
      onMouseLeave();
    }
  }, [onMouseLeave]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-default"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default CanvasContainer;
