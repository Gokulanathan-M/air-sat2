import React from 'react';
import { motion } from 'framer-motion';

function StatRow({ label, value, highlight = false }) {
  return (
    <div className={`stat-row ${highlight ? 'stat-highlight' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value ?? '—'}</span>
    </div>
  );
}

function Badge({ text, type }) {
  return <span className={`badge badge-${type}`}>{text}</span>;
}

export default function StatsPanel({ stats, config, isPlanning, exploredCount }) {
  const formatTime = (ms) => {
    if (ms == null) return '—';
    return ms < 1000 ? `${ms.toFixed(1)} ms` : `${(ms / 1000).toFixed(2)} s`;
  };

  const formatCost = (cost) => {
    if (cost == null || cost === 0) return '—';
    return cost.toFixed(2);
  };

  return (
    <motion.div
      className="stats-panel"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="stats-header">
        <h3 className="panel-title">📊 Planning Statistics</h3>
        <div className="badge-row">
          <Badge text="A★" type="algorithm" />
          {stats?.pathFound && <Badge text="✓ Path Found" type="success" />}
          {stats?.pathFound === false && stats?.errorMessage && <Badge text="✗ No Path" type="error" />}
          {stats?.pathFound && <Badge text="Collision-Free" type="safe" />}
        </div>
      </div>

      <div className="stats-body">
        <div className="stat-section">
          <div className="stat-section-title">Algorithm</div>
          <StatRow label="Method" value="A* (Joint Space)" />
          <StatRow label="Search Space" value="C-Space (θ₁, θ₂)" />
          <StatRow label="Grid Resolution" value={`${config.gridStep}°`} />
          <StatRow label="Heuristic" value="Euclidean Distance" />
        </div>

        <div className="stat-section">
          <div className="stat-section-title">Configuration</div>
          <StatRow label="Start (θ₁, θ₂)" value={`(${config.start.theta1}°, ${config.start.theta2}°)`} />
          <StatRow label="Goal (θ₁, θ₂)" value={`(${config.goal.theta1}°, ${config.goal.theta2}°)`} />
          <StatRow label="Link Lengths" value={`L₁=${config.L1}u, L₂=${config.L2}u`} />
        </div>

        <div className="stat-section">
          <div className="stat-section-title">Search Results</div>
          {isPlanning ? (
            <div className="planning-progress">
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  animate={{ width: ['0%', '100%', '0%'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <span className="planning-text">Exploring nodes... ({exploredCount ?? 0})</span>
            </div>
          ) : (
            <>
              <StatRow
                label="Status"
                value={
                  stats == null ? 'Not Run' :
                  stats.pathFound ? '✅ PATH FOUND' :
                  stats.errorMessage?.includes('Invalid Start') ? '🚫 INVALID START' :
                  stats.errorMessage?.includes('Goal') ? '🚫 INVALID GOAL' :
                  '❌ NO PATH'
                }
                highlight
              />
              <StatRow label="Nodes Explored" value={stats?.nodesExplored ?? '—'} />
              <StatRow label="Waypoints" value={stats?.waypoints ?? '—'} />
              <StatRow label="Path Cost" value={formatCost(stats?.pathCost)} />
              <StatRow label="Planning Time" value={formatTime(stats?.planningTime)} />
              <StatRow label="Collision Checks" value={stats?.collisionChecks ?? '—'} />
            </>
          )}
        </div>

        {stats?.errorMessage && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>⚠️ {stats.errorMessage}</span>
          </motion.div>
        )}

        <div className="stat-section">
          <div className="stat-section-title">Obstacle Config</div>
          <StatRow label="Enabled" value={config.obstacle.enabled ? 'Yes' : 'No'} />
          <StatRow label="Position" value={`(${config.obstacle.x}, ${config.obstacle.y})`} />
          <StatRow label="Radius" value={`${config.obstacle.radius}u`} />
          <StatRow label="Safety Margin" value={`${config.safetyMargin}u`} />
        </div>
      </div>
    </motion.div>
  );
}
