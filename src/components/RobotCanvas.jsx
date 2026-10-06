import React, { useRef, useEffect, useCallback } from 'react';
import { forwardKinematics } from '../robotics/kinematics';

const CANVAS_SIZE = 600;
const ORIGIN_X = CANVAS_SIZE / 2;
const ORIGIN_Y = CANVAS_SIZE / 2;
const SCALE = 1.3; // pixels per unit

function toCanvas(x, y) {
  return {
    cx: ORIGIN_X + x * SCALE,
    cy: ORIGIN_Y - y * SCALE,
  };
}

function drawGrid(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,200,255,0.07)';
  ctx.lineWidth = 1;
  const step = 50 * SCALE;

  for (let x = ORIGIN_X % step; x < CANVAS_SIZE; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_SIZE);
    ctx.stroke();
  }
  for (let y = ORIGIN_Y % step; y < CANVAS_SIZE; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_SIZE, y);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = 'rgba(0,220,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, ORIGIN_Y);
  ctx.lineTo(CANVAS_SIZE, ORIGIN_Y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ORIGIN_X, 0);
  ctx.lineTo(ORIGIN_X, CANVAS_SIZE);
  ctx.stroke();
  ctx.setLineDash([]);

  // Axis labels
  ctx.fillStyle = 'rgba(0,220,255,0.5)';
  ctx.font = '11px monospace';
  ctx.fillText('+X', CANVAS_SIZE - 22, ORIGIN_Y - 6);
  ctx.fillText('+Y', ORIGIN_X + 6, 14);
  ctx.fillText('O', ORIGIN_X + 4, ORIGIN_Y - 4);

  // Tick labels
  ctx.fillStyle = 'rgba(0,180,255,0.3)';
  ctx.font = '9px monospace';
  for (let u = -200; u <= 200; u += 50) {
    if (u === 0) continue;
    const { cx } = toCanvas(u, 0);
    const { cy } = toCanvas(0, u);
    if (cx > 10 && cx < CANVAS_SIZE - 10) ctx.fillText(u, cx - 8, ORIGIN_Y + 14);
    if (cy > 10 && cy < CANVAS_SIZE - 10) ctx.fillText(u, ORIGIN_X + 4, cy + 4);
  }

  ctx.restore();
}

function drawObstacle(ctx, obstacle, safetyMargin) {
  if (!obstacle.enabled) return;
  const { cx, cy } = toCanvas(obstacle.x, obstacle.y);
  const r = obstacle.radius * SCALE;
  const sr = (obstacle.radius + safetyMargin) * SCALE;

  // Safety margin ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, sr, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,180,0,0.3)';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Obstacle fill
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(255,60,60,0.6)');
  grad.addColorStop(1, 'rgba(180,20,20,0.4)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Label
  ctx.save();
  ctx.fillStyle = 'rgba(255,120,120,0.9)';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('⚠ OBS', cx - 18, cy - r - 6);
  ctx.restore();
}

function drawRobotArm(ctx, theta1, theta2, L1, L2, color1 = '#00cfff', color2 = '#7c3aed', glowing = true) {
  const fk = forwardKinematics(theta1, theta2, L1, L2);
  const base = toCanvas(0, 0);
  const joint2 = toCanvas(fk.joint2.x, fk.joint2.y);
  const ee = toCanvas(fk.endEffector.x, fk.endEffector.y);

  ctx.save();

  if (glowing) {
    ctx.shadowColor = color1;
    ctx.shadowBlur = 14;
  }

  // Link 1
  ctx.beginPath();
  ctx.moveTo(base.cx, base.cy);
  ctx.lineTo(joint2.cx, joint2.cy);
  ctx.strokeStyle = color1;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Link 2
  ctx.shadowColor = color2;
  ctx.beginPath();
  ctx.moveTo(joint2.cx, joint2.cy);
  ctx.lineTo(ee.cx, ee.cy);
  ctx.strokeStyle = color2;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Base circle
  ctx.beginPath();
  ctx.arc(base.cx, base.cy, 10, 0, 2 * Math.PI);
  const baseGrad = ctx.createRadialGradient(base.cx, base.cy, 2, base.cx, base.cy, 10);
  baseGrad.addColorStop(0, '#ffffff');
  baseGrad.addColorStop(1, '#00cfff');
  ctx.fillStyle = baseGrad;
  ctx.fill();
  ctx.strokeStyle = '#00cfff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Joint 2 circle
  ctx.beginPath();
  ctx.arc(joint2.cx, joint2.cy, 7, 0, 2 * Math.PI);
  ctx.fillStyle = '#a78bfa';
  ctx.fill();
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2;
  ctx.stroke();

  // End effector
  ctx.beginPath();
  ctx.arc(ee.cx, ee.cy, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#34d399';
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawPathInWorkspace(ctx, path, L1, L2, color = 'rgba(0,255,180,0.5)') {
  if (!path || path.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  ctx.beginPath();
  let first = true;
  for (const wp of path) {
    const fk = forwardKinematics(wp.theta1, wp.theta2, L1, L2);
    const { cx, cy } = toCanvas(fk.endEffector.x, fk.endEffector.y);
    if (first) { ctx.moveTo(cx, cy); first = false; }
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Waypoint dots
  for (const wp of path) {
    const fk = forwardKinematics(wp.theta1, wp.theta2, L1, L2);
    const { cx, cy } = toCanvas(fk.endEffector.x, fk.endEffector.y);
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#00ffb4';
    ctx.fill();
  }
  ctx.restore();
}

function drawStartGoalMarkers(ctx, startFK, goalFK) {
  // Start marker
  const sc = toCanvas(startFK.endEffector.x, startFK.endEffector.y);
  ctx.save();
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(sc.cx, sc.cy, 8, 0, 2 * Math.PI);
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,255,255,0.2)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('S', sc.cx - 4, sc.cy + 4);
  ctx.restore();

  // Goal marker
  const gc = toCanvas(goalFK.endEffector.x, goalFK.endEffector.y);
  ctx.save();
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  // Star/diamond for goal
  ctx.save();
  ctx.translate(gc.cx, gc.cy);
  ctx.rotate(Math.PI / 4);
  ctx.rect(-7, -7, 14, 14);
  ctx.restore();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(251,191,36,0.2)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('G', gc.cx - 4, gc.cy + 4);
  ctx.restore();
}

export default function RobotCanvas({
  theta1,
  theta2,
  L1,
  L2,
  obstacle,
  safetyMargin,
  path,
  exploredNodes,
  startConfig,
  goalConfig,
  animTheta1,
  animTheta2,
  isAnimating,
}) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawGrid(ctx);
    drawObstacle(ctx, obstacle, safetyMargin);

    // Draw start config ghost
    if (startConfig) {
      drawRobotArm(ctx, startConfig.theta1, startConfig.theta2, L1, L2, 'rgba(0,255,255,0.25)', 'rgba(0,180,200,0.2)', false);
    }

    // Draw goal config ghost
    if (goalConfig) {
      drawRobotArm(ctx, goalConfig.theta1, goalConfig.theta2, L1, L2, 'rgba(251,191,36,0.25)', 'rgba(200,150,0,0.2)', false);
    }

    // Draw path trajectory
    drawPathInWorkspace(ctx, path, L1, L2);

    // Start/Goal markers
    if (startConfig && goalConfig) {
      const startFK = forwardKinematics(startConfig.theta1, startConfig.theta2, L1, L2);
      const goalFK = forwardKinematics(goalConfig.theta1, goalConfig.theta2, L1, L2);
      drawStartGoalMarkers(ctx, startFK, goalFK);
    }

    // Main robot
    const t1 = isAnimating ? animTheta1 : theta1;
    const t2 = isAnimating ? animTheta2 : theta2;
    drawRobotArm(ctx, t1, t2, L1, L2);

    // Labels
    ctx.save();
    ctx.fillStyle = 'rgba(0,200,255,0.7)';
    ctx.font = '11px monospace';
    ctx.fillText(`θ₁ = ${t1.toFixed(1)}°  θ₂ = ${t2.toFixed(1)}°`, 12, 20);
    ctx.restore();
  }, [theta1, theta2, L1, L2, obstacle, safetyMargin, path, exploredNodes, startConfig, goalConfig, animTheta1, animTheta2, isAnimating]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '8px' }}
    />
  );
}
