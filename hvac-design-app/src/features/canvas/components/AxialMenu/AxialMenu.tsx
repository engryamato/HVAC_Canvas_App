'use client';

import * as React from 'react';
import type { AxialFamily, AxialShape } from './fittingFamily';
import { AXIAL_FAMILY_MAPS, type AxialNode, type VariantPatch } from './axialFamilyMaps';
import styles from './AxialMenu.module.css';

interface AxialMenuProps {
  family: AxialFamily;
  shape: AxialShape;
  anchor: { x: number; y: number };
  nodes?: AxialNode[];
  onPick: (patch: VariantPatch) => void;
  onClose: () => void;
}

interface StackEntry {
  nodes: AxialNode[];
  inheritedPatch: VariantPatch;
}

function isShapeAllowed(node: AxialNode, shape: AxialShape): boolean {
  return !node.shapeGate || node.shapeGate.includes(shape);
}

function visibleNodes(nodes: AxialNode[], shape: AxialShape): AxialNode[] {
  return nodes.filter((node) => isShapeAllowed(node, shape));
}

function mergePatch(base: VariantPatch, next?: VariantPatch): VariantPatch {
  return { ...base, ...(next ?? {}) };
}

export function AxialMenu({ family, shape, anchor, nodes, onPick, onClose }: AxialMenuProps) {
  const rootNodes = nodes ?? AXIAL_FAMILY_MAPS[family];
  const [stack, setStack] = React.useState<StackEntry[]>([{ nodes: rootNodes, inheritedPatch: {} }]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const current = stack[stack.length - 1];
  const currentNodes = visibleNodes(current.nodes, shape);
  const hasBack = stack.length > 1;
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  React.useEffect(() => {
    menuRef.current?.focus();
  }, []);

  React.useEffect(() => {
    setActiveIndex(0);
    buttonRefs.current = [];
  }, [stack.length, shape]);

  React.useEffect(() => {
    buttonRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const goBack = React.useCallback(() => {
    if (stack.length > 1) {
      setStack((currentStack) => currentStack.slice(0, -1));
      return;
    }
    onClose();
  }, [onClose, stack.length]);

  const activateNode = React.useCallback(
    (node: AxialNode) => {
      const nextPatch = mergePatch(current.inheritedPatch, node.variantPatch);
      if (node.children?.length) {
        setStack((currentStack) => [
          ...currentStack,
          { nodes: node.children ?? [], inheritedPatch: nextPatch },
        ].slice(0, 3));
        return;
      }
      onPick(nextPatch);
    },
    [current.inheritedPatch, onPick]
  );

  const itemCount = currentNodes.length + (hasBack ? 1 : 0);
  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        goBack();
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (itemCount > 0 ? (index + 1) % itemCount : 0));
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (itemCount > 0 ? (index - 1 + itemCount) % itemCount : 0));
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        buttonRefs.current[activeIndex]?.click();
      }
    },
    [activeIndex, goBack, itemCount]
  );

  if (currentNodes.length === 0) {
    return (
      <div
        ref={menuRef}
        role="menu"
        aria-label="Axial fitting variants"
        tabIndex={-1}
        className={styles.menu}
        style={{ left: anchor.x, top: anchor.y }}
        onKeyDown={onKeyDown}
      >
        <button type="button" role="menuitem" className={styles.button} style={{ '--x': '0px', '--y': '0px' } as React.CSSProperties} disabled>
          No variants available
        </button>
      </div>
    );
  }

  const buttons = [
    ...(hasBack ? [{ id: 'back', label: 'Back' } as const] : []),
    ...currentNodes,
  ];

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Axial fitting variants"
      tabIndex={-1}
      className={styles.menu}
      style={{ left: anchor.x, top: anchor.y }}
      onKeyDown={onKeyDown}
    >
      <div aria-hidden className={styles.hub}>WS4</div>
      {buttons.map((node, index) => {
        const angle = (Math.PI * 2 * index) / buttons.length - Math.PI / 2;
        const x = Math.cos(angle) * 88;
        const y = Math.sin(angle) * 88;
        const isBackNode = node.id === 'back';
        return (
          <button
            key={node.id}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            type="button"
            role="menuitem"
            className={`${styles.button} ${isBackNode ? styles.back : ''}`}
            style={{ '--x': `${x}px`, '--y': `${y}px` } as React.CSSProperties}
            onClick={() => {
              if (isBackNode) {
                goBack();
                return;
              }
              activateNode(node);
            }}
          >
            {node.label}
          </button>
        );
      })}
    </div>
  );
}
