'use client';

import { useCallback, useState } from 'react';
import type { PrintMargins, PrintOptions } from '@/features/export/types';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ActionEventName } from '@/utils/analytics/events';

const MARGIN_VALUES: Record<PrintMargins, string> = {
  normal: '1in',
  narrow: '0.5in',
  wide: '1.5in',
};

export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackAction } = useAnalytics();

  const print = useCallback(async (options: PrintOptions) => {
    if (typeof window === 'undefined') {
      setError('Print is not available');
      return;
    }

    const canvasArea = document.querySelector('[data-testid="canvas-area"]');
    if (!canvasArea) {
      setError('Canvas not available for print');
      return;
    }

    setIsPrinting(true);
    setError(null);

    trackAction(ActionEventName.PRINT_INITIATED, {
      format: 'print',
      elementType: options.orientation,
    });

    const scaleValue = options.scale === 'custom'
      ? Math.max(0.1, (options.customScale ?? 100) / 100)
      : 1;

    const style = document.createElement('style');
    style.setAttribute('data-print-style', 'true');
    style.textContent = `
      @page { size: ${options.orientation}; margin: ${MARGIN_VALUES[options.margins]}; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body * { visibility: hidden !important; }
        [data-testid="canvas-area"], [data-testid="canvas-area"] * { visibility: visible !important; }
        [data-testid="canvas-area"] {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          transform: scale(${scaleValue});
          transform-origin: top left;
        }
      }
    `;

    document.head.appendChild(style);

    const cleanup = () => {
      style.remove();
      setIsPrinting(false);
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();
  }, [trackAction]);

  return { print, isPrinting, error };
}
