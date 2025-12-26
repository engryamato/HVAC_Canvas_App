'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { shallow } from 'zustand/shallow';
import { useViewportStore } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../store/selectionStore';
import { useToolStore, type CanvasTool } from '@/core/store/canvas.store';
import type { Entity, Room, Duct, Equipment } from '@/core/schema';
import { useViewport } from '../hooks/useViewport';

// Tools
import {
  SelectTool,
  RoomTool,
  DuctTool,
  EquipmentTool,
  FittingTool,
  NoteTool,
  type ITool,
  type ToolMouseEvent,
  type ToolRenderContext,
} from '../tools';

// Renderers
import { renderRoom, renderDuct, renderEquipment, type RenderContext } from '../renderers';

interface CanvasContainerProps {
  className?: string;
  /** Callback when mouse moves over canvas, provides canvas coordinates */
  onMouseMove?: (canvasX: number, canvasY: number) => void;
  /** Callback when mouse leaves canvas */
  onMouseLeave?: () => void;
}

/**
 * Create tool instances (memoized to persist across renders)
 */
function createToolInstances(): Record<CanvasTool, ITool> {
  return {
    select: new SelectTool(),
    room: new RoomTool(),
    duct: new DuctTool(),
    equipment: new EquipmentTool(),
    fitting: new FittingTool(),
    note: new NoteTool(),
  };
}

/**
 * Main canvas component using pure Canvas 2D API (per DEC-001).
 * Handles rendering, viewport transforms, tool interactions, and resize.
 */
export function CanvasContainer({ className, onMouseMove, onMouseLeave }: CanvasContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const resizeFrameRef = useRef<number>();
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);
  const isResizingRef = useRef(false);

  // Store state
  const { panX, panY, zoom, gridVisible, gridSize } = useViewportStore();
  const currentTool = useToolStore((state) => state.currentTool);
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const hoveredId = useSelectionStore((state) => state.hoveredId);
  const entities = useEntityStore(
    (state) => state.allIds.map((id) => state.byId[id]).filter((e): e is Entity => e !== undefined),
    shallow
  );

  // Enable viewport pan/zoom interactions (space-drag, middle-mouse, wheel zoom)
  useViewport({ canvasRef });

  // Tool instances (created once, persisted in ref)
  const toolsRef = useRef<Record<CanvasTool, ITool> | null>(null);
  if (!toolsRef.current) {
    toolsRef.current = createToolInstances();
  }
  const tools = toolsRef.current;

  // Track previous tool for activation/deactivation
  const prevToolRef = useRef<CanvasTool>(currentTool);

  // Handle tool switching
  useEffect(() => {
    const prevTool = prevToolRef.current;
    if (prevTool !== currentTool) {
      tools[prevTool].onDeactivate();
      tools[currentTool].onActivate();
      prevToolRef.current = currentTool;
    }
  }, [currentTool, tools]);

  // Get active tool
  const activeTool = tools[currentTool];

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
   * Uses requestAnimationFrame and a flag to prevent ResizeObserver loops
   */
  const handleResize = useCallback(() => {
    // Prevent recursive calls
    if (isResizingRef.current) {
      return;
    }

    // Cancel any pending resize
    if (resizeFrameRef.current) {
      cancelAnimationFrame(resizeFrameRef.current);
    }

    // Defer resize to next frame to prevent ResizeObserver loop
    resizeFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        return;
      }

      // Set flag to prevent recursive calls
      isResizingRef.current = true;

      try {
        // Get device pixel ratio for sharp rendering (SSR-safe)
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

        // Get container size
        const rect = container.getBoundingClientRect();
        const newWidth = Math.max(1, rect.width);
        const newHeight = Math.max(1, rect.height);

        // Check if size actually changed to prevent unnecessary updates
        if (
          lastSizeRef.current &&
          Math.abs(lastSizeRef.current.width - newWidth) < 0.5 &&
          Math.abs(lastSizeRef.current.height - newHeight) < 0.5
        ) {
          isResizingRef.current = false;
          return;
        }

        // Update last size BEFORE making changes to prevent loop
        lastSizeRef.current = { width: newWidth, height: newHeight };

        // Set canvas size to container size
        canvas.width = newWidth * dpr;
        canvas.height = newHeight * dpr;
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;

        // Scale context for device pixel ratio
        const ctx = getContext();
        if (ctx) {
          // Reset transform before scaling to avoid accumulation
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);
        }

        // Clear flag after a short delay to allow any pending observers to settle
        requestAnimationFrame(() => {
          isResizingRef.current = false;
        });
      } catch (error) {
        isResizingRef.current = false;
        console.error('Error in handleResize:', error);
      }
    });
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
   * Render a fitting entity (inline - not yet in Phase 3 renderers)
   */
  const renderFittingInline = useCallback((ctx: CanvasRenderingContext2D, fitting: Entity) => {
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
   * Render a note entity (inline - not yet in Phase 3 renderers)
   */
  const renderNoteInline = useCallback((ctx: CanvasRenderingContext2D, note: Entity) => {
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
   * Render all entities using Phase 3 renderers
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

        // Create render context for this entity
        const renderContext: RenderContext = {
          ctx,
          zoom,
          isSelected: selectedIds.includes(entity.id),
          isHovered: hoveredId === entity.id,
        };

        // Render based on entity type using Phase 3 renderers
        switch (entity.type) {
          case 'room':
            renderRoom(entity as Room, renderContext);
            break;
          case 'duct':
            renderDuct(entity as Duct, renderContext);
            break;
          case 'equipment':
            renderEquipment(entity as Equipment, renderContext);
            break;
          case 'fitting':
            renderFittingInline(ctx, entity);
            break;
          case 'note':
            renderNoteInline(ctx, entity);
            break;
          case 'group':
            // Groups are rendered by their children
            break;
        }

        ctx.restore();
      }
    },
    [entities, zoom, selectedIds, hoveredId, renderFittingInline, renderNoteInline]
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

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
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

    // Render active tool preview (e.g., room placement preview)
    const toolRenderContext: ToolRenderContext = {
      ctx,
      zoom,
      panX,
      panY,
    };
    activeTool.render(toolRenderContext);

    // Restore context state
    ctx.restore();

    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(render);
  }, [getContext, panX, panY, zoom, gridVisible, renderGrid, renderEntities, activeTool]);

  // Set up resize detection using window resize + manual check instead of ResizeObserver
  // This avoids ResizeObserver loops that can cause infinite scrolling
  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    // Debounced resize handler
    const debouncedResize = () => {
      if (isResizingRef.current) {
        return;
      }

      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        if (!isResizingRef.current) {
          handleResize();
        }
      }, 100); // 100ms debounce
    };

    // Initial resize
    handleResize();

    // Use window resize event instead of ResizeObserver to avoid loops
    window.addEventListener('resize', debouncedResize);

    // Also check periodically for size changes (fallback for programmatic resizes)
    checkInterval = setInterval(() => {
      const container = containerRef.current;
      if (!container || isResizingRef.current) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const currentWidth = Math.max(1, rect.width);
      const currentHeight = Math.max(1, rect.height);

      if (
        !lastSizeRef.current ||
        Math.abs(lastSizeRef.current.width - currentWidth) >= 1 ||
        Math.abs(lastSizeRef.current.height - currentHeight) >= 1
      ) {
        debouncedResize();
      }
    }, 500); // Check every 500ms

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      // Cancel any pending resize frame
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
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
   * Create ToolMouseEvent from React mouse event
   */
  const createToolMouseEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): ToolMouseEvent => {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      return {
        x,
        y,
        screenX: e.clientX,
        screenY: e.clientY,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        altKey: e.altKey,
        button: e.button,
      };
    },
    [screenToCanvas]
  );

  /**
   * Handle mouse down on canvas - delegate to active tool
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const toolEvent = createToolMouseEvent(e);
      activeTool.onMouseDown(toolEvent);
    },
    [createToolMouseEvent, activeTool]
  );

  /**
   * Handle mouse move on canvas - delegate to active tool
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);

      // Notify parent component
      if (onMouseMove) {
        onMouseMove(x, y);
      }

      // Delegate to active tool
      const toolEvent = createToolMouseEvent(e);
      activeTool.onMouseMove(toolEvent);
    },
    [onMouseMove, screenToCanvas, createToolMouseEvent, activeTool]
  );

  /**
   * Handle mouse up on canvas - delegate to active tool
   */
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const toolEvent = createToolMouseEvent(e);
      activeTool.onMouseUp(toolEvent);
    },
    [createToolMouseEvent, activeTool]
  );

  /**
   * Handle mouse leave on canvas
   */
  const handleMouseLeave = useCallback(() => {
    if (onMouseLeave) {
      onMouseLeave();
    }
  }, [onMouseLeave]);

  /**
   * Handle keyboard events - delegate to active tool
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      activeTool.onKeyDown({
        key: e.key,
        code: e.code,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        altKey: e.altKey,
        repeat: e.repeat,
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      activeTool.onKeyUp({
        key: e.key,
        code: e.code,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        altKey: e.altKey,
        repeat: e.repeat,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool]);

  // Compute cursor based on active tool
  const cursor = activeTool.getCursor();

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default CanvasContainer;
