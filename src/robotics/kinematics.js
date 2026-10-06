/**
 * Robotics Kinematics Module
 * Forward Kinematics and Collision Detection for 2R Planar Robot
 */

/**
 * Compute forward kinematics for 2R planar robot
 * @param {number} theta1 - Joint 1 angle in degrees
 * @param {number} theta2 - Joint 2 angle in degrees
 * @param {number} L1 - Link 1 length
 * @param {number} L2 - Link 2 length
 * @returns {Object} { base, joint1, joint2, endEffector }
 */
export function forwardKinematics(theta1, theta2, L1, L2) {
  const t1 = (theta1 * Math.PI) / 180;
  const t2 = (theta2 * Math.PI) / 180;

  const base = { x: 0, y: 0 };

  // Joint 2 position (end of Link 1)
  const joint2 = {
    x: L1 * Math.cos(t1),
    y: L1 * Math.sin(t1),
  };

  // End effector position (end of Link 2)
  const endEffector = {
    x: joint2.x + L2 * Math.cos(t1 + t2),
    y: joint2.y + L2 * Math.sin(t1 + t2),
  };

  return { base, joint2, endEffector };
}

/**
 * Compute the minimum distance from a point to a line segment
 * @param {Object} p - Point { x, y }
 * @param {Object} a - Segment start { x, y }
 * @param {Object} b - Segment end { x, y }
 * @returns {number} Minimum distance
 */
export function pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Segment is a point
    return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = a.x + t * dx;
  const closestY = a.y + t * dy;

  return Math.sqrt((p.x - closestX) ** 2 + (p.y - closestY) ** 2);
}

/**
 * Check if the robot in a given configuration collides with an obstacle
 * @param {Object} fk - Forward kinematics result
 * @param {number} L1 - Link 1 length
 * @param {number} L2 - Link 2 length
 * @param {number} theta1 - Joint 1 angle (degrees)
 * @param {number} theta2 - Joint 2 angle (degrees)
 * @param {Object} obstacle - { x, y, radius, enabled }
 * @param {number} safetyMargin - Extra safety buffer
 * @returns {boolean} True if collision detected
 */
export function checkCollision(fk, L1, L2, theta1, theta2, obstacle, safetyMargin = 0) {
  if (!obstacle || !obstacle.enabled) return false;

  const { base, joint2, endEffector } = fk;
  const obstacleCenter = { x: obstacle.x, y: obstacle.y };
  const effectiveRadius = obstacle.radius + safetyMargin;

  // Check Link 1: base → joint2
  const dist1 = pointToSegmentDistance(obstacleCenter, base, joint2);
  if (dist1 < effectiveRadius) return true;

  // Check Link 2: joint2 → endEffector
  const dist2 = pointToSegmentDistance(obstacleCenter, joint2, endEffector);
  if (dist2 < effectiveRadius) return true;

  return false;
}

/**
 * Check if a point (workspace) is inside the obstacle
 */
export function isPointInObstacle(point, obstacle, safetyMargin = 0) {
  if (!obstacle || !obstacle.enabled) return false;
  const dx = point.x - obstacle.x;
  const dy = point.y - obstacle.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < obstacle.radius + safetyMargin;
}

/**
 * Compute the workspace reachability bounds for a 2R robot
 */
export function getWorkspaceBounds(L1, L2) {
  return {
    maxReach: L1 + L2,
    minReach: Math.abs(L1 - L2),
  };
}
