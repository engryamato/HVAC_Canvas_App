import { feetToPixels } from '@/core/constants/coordinates';
import type { Duct, DuctRun } from '@/core/schema';
import { DuctRunGeometryService } from './DuctRunGeometryService';

export type DuctLike = Duct | DuctRun;

export function getDuctStartAndEnd(duct: DuctLike): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  if (duct.type === 'duct_run') {
    const geometry = DuctRunGeometryService.getGeometry(duct);
    return { start: geometry.start, end: geometry.end };
  }

  const { x, y, rotation } = duct.transform;
  const lengthPixels = feetToPixels(duct.props.length);
  const radians = (rotation * Math.PI) / 180;

  return {
    start: { x, y },
    end: {
      x: x + lengthPixels * Math.cos(radians),
      y: y + lengthPixels * Math.sin(radians),
    },
  };
}
