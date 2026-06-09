import type { Entity, Equipment } from '@/core/schema';
import type { ConnectionGraph } from './types';
import { isSourceEquipment, isTerminalEquipment } from './equipmentClassification';

/**
 * Flow Propagation Service
 * 
 * Calculates airflow through duct networks using the "Leaf Peeling" algorithm.
 * This approach accumulates flow from terminal equipment (diffusers) upstream
 * through the duct network, supporting both rooted systems (with AHU) and
 * headless fragments (partial designs).
 */

interface FlowNode {
  entityId: string;
  type: 'duct' | 'duct_run' | 'fitting' | 'equipment' | 'accessory';
  connections: Set<string>;
  unprocessedConnections: number;
  accumulatedFlow: number;
}

export class FlowPropagationService {
  /**
   * Calculate flow for all ducts in the graph using Leaf Peeling algorithm.
   * 
   * Algorithm:
   * 1. Initialize terminal equipment (diffusers) with their capacity as flow
   * 2. Start from "leaves" (nodes with only 1 connection)
   * 3. Propagate flow upstream, accumulating at each node
   * 4. Nodes become new "leaves" as their connections are processed
   * 5. Result: Flow accumulates from demand side (terminals) to source side (trunk/AHU)
   * 
   * @param graph Connection graph of all entities
   * @param entities Map of entity IDs to entity objects
   * @returns Map of duct IDs to calculated CFM values
   */
  static calculateFlows(
    graph: ConnectionGraph,
    entities: Record<string, Entity>
  ): Map<string, number> {
    const flowMap = new Map<string, number>();
    const nodeMap = new Map<string, FlowNode>();
    const queue: string[] = [];

    // Step 1: Initialize all nodes
    for (const [nodeId, graphNode] of graph.nodes.entries()) {
      const entity = entities[nodeId];
      if (!entity) {continue;}

      // Add node to graph if it's a flow-carrying entity
      if (entity.type !== 'duct' && entity.type !== 'duct_run' && entity.type !== 'equipment' && entity.type !== 'fitting') {
        continue; // Skip entities that are not flow-carrying
      }

      const flowNode: FlowNode = {
        entityId: nodeId,
        type: graphNode.type,
        connections: new Set(graphNode.connections),
        unprocessedConnections: graphNode.connections.length,
        accumulatedFlow: 0,
      };

      // Initialize terminal equipment with their capacity
      if (entity.type === 'equipment') {
        // Only diffusers, grilles, and similar terminals contribute flow
        if (isTerminalEquipment(entity)) {
          flowNode.accumulatedFlow = (entity as Equipment).props.capacity;
        }
      }

      nodeMap.set(nodeId, flowNode);
    }

    this.seedSourceEquipmentForUndemandedComponents(nodeMap, entities);

    for (const [nodeId, flowNode] of nodeMap.entries()) {
      // Add leaves (degree 1) and flow sources to initial queue
      // IMPORTANT: Do not treat Ducts as leaves to initiate propagation. 
      // Ducts are passive carriers and should only process when pushed by terminals or fittings.
      // IMPORTANT: Do not treat source equipment (AHU) with zero accumulated flow as a leaf.
      // Source equipment without demand should not seed trunk flow; terminal demand
      // should peel from diffusers upstream through the tee to the trunk.
      const isFlowSource = flowNode.accumulatedFlow > 0;
      const isLeafNonDuct =
        flowNode.unprocessedConnections <= 1 && flowNode.type !== 'duct' && flowNode.type !== 'duct_run';
      const isZeroFlowSourceEquipment =
        flowNode.type === 'equipment' && flowNode.accumulatedFlow <= 0;

      if ((isFlowSource || isLeafNonDuct) && !isZeroFlowSourceEquipment) {
        queue.push(nodeId);
      }
    }

    // Step 2: Process queue using Leaf Peeling
    const processed = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (processed.has(currentId)) {continue;}
      processed.add(currentId);

      const currentNode = nodeMap.get(currentId);
      if (!currentNode) {continue;}

      // Record flow for ducts
      const entity = entities[currentId];
      if (entity?.type === 'duct' || entity?.type === 'duct_run') {
        flowMap.set(currentId, currentNode.accumulatedFlow);
      }

      // Propagate flow to connected nodes
      for (const neighborId of currentNode.connections) {
        const neighbor = nodeMap.get(neighborId);
        if (!neighbor || processed.has(neighborId)) {continue;}

        // Accumulate flow at neighbor
        neighbor.accumulatedFlow += currentNode.accumulatedFlow;
        neighbor.unprocessedConnections--;

        // If neighbor becomes a leaf, add to queue
        if (neighbor.unprocessedConnections <= 1) {
          queue.push(neighborId);
        }
      }
    }

    // Step 3: Handle any remaining unprocessed nodes (cycles or islands)
    for (const [nodeId] of nodeMap.entries()) {
      if (!processed.has(nodeId)) {
        const entity = entities[nodeId];
        if (entity?.type === 'duct' || entity?.type === 'duct_run') {
          // Unprocessed ducts in cycles get 0 flow (ambiguous flow direction)
          flowMap.set(nodeId, 0);
        }
      }
    }

    return flowMap;
  }

  /**
   * Source-only designs have no terminal demand to peel from, but they still
   * need meaningful CFM for connected ducts. Use source capacity only when a
   * connected component has no terminal capacity, so terminal-driven systems
   * continue to calculate from downstream demand.
   */
  private static seedSourceEquipmentForUndemandedComponents(
    nodeMap: Map<string, FlowNode>,
    entities: Record<string, Entity>
  ): void {
    const visited = new Set<string>();

    for (const nodeId of nodeMap.keys()) {
      if (visited.has(nodeId)) {
        continue;
      }

      const componentIds: string[] = [];
      const stack = [nodeId];
      visited.add(nodeId);

      while (stack.length > 0) {
        const currentId = stack.pop()!;
        componentIds.push(currentId);
        const node = nodeMap.get(currentId);
        if (!node) {
          continue;
        }

        for (const neighborId of node.connections) {
          if (!visited.has(neighborId) && nodeMap.has(neighborId)) {
            visited.add(neighborId);
            stack.push(neighborId);
          }
        }
      }

      const hasTerminalDemand = componentIds.some((componentId) => {
        const entity = entities[componentId];
        return isTerminalEquipment(entity) && (entity as Equipment).props.capacity > 0;
      });

      if (hasTerminalDemand) {
        continue;
      }

      for (const componentId of componentIds) {
        const entity = entities[componentId];
        const node = nodeMap.get(componentId);
        if (node && isSourceEquipment(entity)) {
          node.accumulatedFlow = (entity as Equipment).props.capacity;
        }
      }
    }
  }

  /**
   * Validate that total system flow doesn't exceed equipment capacity
   * 
   * @param equipmentId ID of source equipment (AHU, RTU, etc.)
   * @param totalFlow Total calculated flow through the system
   * @param entities Entity map
   * @returns Validation warnings if capacity exceeded
   */
  static validateSystemCapacity(
    equipmentId: string,
    totalFlow: number,
    entities: Record<string, Entity>
  ): string[] {
    const equipment = entities[equipmentId];
    if (!equipment || equipment.type !== 'equipment') {
      return [];
    }

    const warnings: string[] = [];
    const eq = equipment as Equipment;

    // Check if this is source equipment (not a terminal)
    if (isTerminalEquipment(eq)) {
      return warnings;
    }

    // Compare total system load vs equipment capacity
    const capacity = eq.props.capacity;
    if (totalFlow > capacity) {
      const overload = ((totalFlow / capacity - 1) * 100).toFixed(1);
      warnings.push(
        `System load (${totalFlow} CFM) exceeds ${eq.props.equipmentType} capacity (${capacity} CFM) by ${overload}%`
      );
    }

    return warnings;
  }
}
