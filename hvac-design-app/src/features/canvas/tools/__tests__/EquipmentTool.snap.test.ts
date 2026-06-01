import { beforeEach, describe, expect, it } from 'vitest';
import { useEntityStore } from '@/core/store/entityStore';
import { useToolStore } from '@/core/store/canvas.store';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useViewportStore } from '../../store/viewportStore';
import { createDuctRun, resetDuctRunCounter } from '../../entities/ductRunDefaults';
import { resetEquipmentCounter } from '../../entities/equipmentDefaults';
import { EquipmentTool } from '../EquipmentTool';

describe('EquipmentTool magnetic placement snapping', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
    useToolStore.getState().resetEquipmentPlacementDraft('air_handler');
    useToolStore.getState().setEquipmentPlacementDialogOpen(false);
    useToolStore.getState().setEquipmentPlacementDraft({
      name: 'AHU-1',
      equipmentType: 'air_handler',
      width: 60,
      depth: 48,
      height: 96,
    });
    useViewportStore.setState({ snapToGrid: false, gridSize: 12 });
    resetDuctRunCounter();
    resetEquipmentCounter();
  });

  it('places equipment at the adjusted position when a port snaps to a duct endpoint', () => {
    const run = createDuctRun({ x: 200, y: 114.4, installLength: 10, sectionLengthOverride: 5 });
    run.id = 'target-run';
    run.props.startPoint = { x: 200, y: 114.4 };
    run.props.endPoint = { x: 320, y: 114.4 };
    useEntityStore.getState().addEntity(run);

    const tool = new EquipmentTool();

    tool.onMouseMove({ x: 139, y: 100, button: 0 });
    tool.onMouseDown({ x: 139, y: 100, button: 0 });

    const equipment = Object.values(useEntityStore.getState().byId).find(
      (entity) => entity.type === 'equipment'
    );
    const connectedRun = useEntityStore.getState().byId[run.id];

    expect(equipment?.type).toBe('equipment');
    if (equipment?.type !== 'equipment') {
      throw new Error('Expected equipment');
    }
    expect(equipment.transform.x).toBe(140);
    expect(equipment.transform.y).toBe(100);
    expect(equipment.props.connectionPorts?.find((port) => port.id === 'supply-1')?.connectedDuctId).toBe(run.id);
    expect(connectedRun?.type).toBe('duct_run');
    if (connectedRun?.type !== 'duct_run') {
      throw new Error('Expected duct_run');
    }
    expect(connectedRun.props.connectedFrom).toBe(equipment.id);
  });
});
