/**
 * A* Path Planning Algorithm in Joint Space
 * For 2R Planar Articulated Robot
 *
 * Configuration space: q = [θ1, θ2] in degrees
 * f(n) = g(n) + h(n)
 */

import { forwardKinematics, checkCollision } from '../robotics/kinematics';

/**
 * Heuristic: Euclidean distance in joint space
 */
function heuristic(node, goal) {
  const dTheta1 = node.theta1 - goal.theta1;
  const dTheta2 = node.theta2 - goal.theta2;
  return Math.sqrt(dTheta1 * dTheta1 + dTheta2 * dTheta2);
}

/**
 * Normalize angle to [-180, 180]
 */
function normalizeAngle(angle) {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

/**
 * Create a string key for a node
 */
function nodeKey(theta1, theta2, step) {
  const t1 = Math.round(theta1 / step) * step;
  const t2 = Math.round(theta2 / step) * step;
  return `${t1},${t2}`;
}

/**
 * Snap angle to grid
 */
function snapToGrid(angle, step) {
  return Math.round(angle / step) * step;
}

/**
 * A* Search in Joint Space
 * @param {Object} start - { theta1, theta2 }
 * @param {Object} goal  - { theta1, theta2 }
 * @param {Object} config - { step, L1, L2, obstacle, safetyMargin }
 * @param {Function} onProgress - callback(exploredNodes)
 * @returns {Object} { path, explored, stats }
 */
export async function astarSearch(start, goal, config, onProgress) {
  const { step, L1, L2, obstacle, safetyMargin } = config;

  const startTime = performance.now();

  // Snap start/goal to grid
  const startNode = {
    theta1: snapToGrid(start.theta1, step),
    theta2: snapToGrid(start.theta2, step),
    g: 0,
    h: 0,
    f: 0,
    parent: null,
  };

  const goalSnapped = {
    theta1: snapToGrid(goal.theta1, step),
    theta2: snapToGrid(goal.theta2, step),
  };

  startNode.h = heuristic(startNode, goalSnapped);
  startNode.f = startNode.g + startNode.h;

  // Validate start
  const startFK = forwardKinematics(startNode.theta1, startNode.theta2, L1, L2);
  if (obstacle.enabled && checkCollision(startFK, L1, L2, startNode.theta1, startNode.theta2, obstacle, safetyMargin)) {
    return {
      path: [],
      explored: [],
      stats: {
        nodesExplored: 0,
        pathFound: false,
        pathCost: 0,
        waypoints: 0,
        planningTime: performance.now() - startTime,
        collisionChecks: 0,
        errorMessage: 'Start configuration is inside obstacle or violates safety margin!',
      },
    };
  }

  // Validate goal
  const goalFK = forwardKinematics(goalSnapped.theta1, goalSnapped.theta2, L1, L2);
  if (obstacle.enabled && checkCollision(goalFK, L1, L2, goalSnapped.theta1, goalSnapped.theta2, obstacle, safetyMargin)) {
    return {
      path: [],
      explored: [],
      stats: {
        nodesExplored: 0,
        pathFound: false,
        pathCost: 0,
        waypoints: 0,
        planningTime: performance.now() - startTime,
        collisionChecks: 0,
        errorMessage: 'Goal configuration is inside obstacle or violates safety margin!',
      },
    };
  }

  // Priority queue (min-heap via sorted array for simplicity)
  // For large grids, a proper heap would be more efficient
  let openList = [startNode];
  const openSet = new Map();
  openSet.set(nodeKey(startNode.theta1, startNode.theta2, step), startNode);

  const closedSet = new Set();
  const exploredNodes = [];
  let collisionChecks = 0;
  let nodesExplored = 0;

  // Neighbour offsets: cardinal + diagonal in joint space
  const directions = [];
  for (let d1 = -1; d1 <= 1; d1++) {
    for (let d2 = -1; d2 <= 1; d2++) {
      if (d1 === 0 && d2 === 0) continue;
      directions.push([d1, d2]);
    }
  }

  const MAX_ITERATIONS = 50000;
  let iterations = 0;
  let progressCounter = 0;

  while (openList.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    progressCounter++;

    // Sort by f value (simple priority queue)
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift();
    const currentKey = nodeKey(current.theta1, current.theta2, step);

    if (closedSet.has(currentKey)) continue;
    closedSet.add(currentKey);
    openSet.delete(currentKey);

    nodesExplored++;
    exploredNodes.push({ theta1: current.theta1, theta2: current.theta2, type: 'explored' });

    // Goal check
    if (
      Math.abs(current.theta1 - goalSnapped.theta1) < step * 0.5 &&
      Math.abs(current.theta2 - goalSnapped.theta2) < step * 0.5
    ) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node !== null) {
        path.unshift({ theta1: node.theta1, theta2: node.theta2 });
        node = node.parent;
      }

      const planningTime = performance.now() - startTime;

      return {
        path,
        explored: exploredNodes,
        stats: {
          nodesExplored,
          pathFound: true,
          pathCost: current.g,
          waypoints: path.length,
          planningTime,
          collisionChecks,
          errorMessage: null,
        },
      };
    }

    // Expand neighbours
    for (const [d1, d2] of directions) {
      const newTheta1 = normalizeAngle(current.theta1 + d1 * step);
      const newTheta2 = normalizeAngle(current.theta2 + d2 * step);
      const key = nodeKey(newTheta1, newTheta2, step);

      if (closedSet.has(key)) continue;

      // Collision check
      collisionChecks++;
      const fk = forwardKinematics(newTheta1, newTheta2, L1, L2);
      if (obstacle.enabled && checkCollision(fk, L1, L2, newTheta1, newTheta2, obstacle, safetyMargin)) {
        continue;
      }

      // Movement cost (diagonal costs more)
      const moveCost = Math.abs(d1) + Math.abs(d2) === 2 ? Math.SQRT2 * step : step;
      const newG = current.g + moveCost;
      const newH = heuristic({ theta1: newTheta1, theta2: newTheta2 }, goalSnapped);
      const newF = newG + newH;

      const existing = openSet.get(key);
      if (existing && existing.g <= newG) continue;

      const neighbour = {
        theta1: newTheta1,
        theta2: newTheta2,
        g: newG,
        h: newH,
        f: newF,
        parent: current,
      };

      openSet.set(key, neighbour);
      openList.push(neighbour);
    }

    // Async yield every 500 iterations to avoid UI freeze
    if (progressCounter >= 500) {
      progressCounter = 0;
      if (onProgress) onProgress([...exploredNodes]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const planningTime = performance.now() - startTime;

  return {
    path: [],
    explored: exploredNodes,
    stats: {
      nodesExplored,
      pathFound: false,
      pathCost: 0,
      waypoints: 0,
      planningTime,
      collisionChecks,
      errorMessage: iterations >= MAX_ITERATIONS ? 'Search limit reached. No path found.' : 'No valid path exists.',
    },
  };
}
