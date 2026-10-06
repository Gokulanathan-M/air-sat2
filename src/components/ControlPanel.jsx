import React from 'react';
import { motion } from 'framer-motion';

function InputField({ label, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-row">
        <input
          type="number"
          className="number-input"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
        />
        {unit && <span className="input-unit">{unit}</span>}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="toggle-group">
      <span className="input-label">{label}</span>
      <button
        className={`toggle-btn ${value ? 'active' : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className="toggle-knob" />
        <span className="toggle-text">{value ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );
}

export default function ControlPanel({
  config,
  onConfigChange,
  onPlan,
  onReset,
  onAnimate,
  isPlanning,
  hasPath,
  isAnimating,
  planningStatus,
}) {
  const update = (key, val) => onConfigChange({ ...config, [key]: val });
  const updateObs = (key, val) => onConfigChange({ ...config, obstacle: { ...config.obstacle, [key]: val } });
  const updateStart = (key, val) => onConfigChange({ ...config, start: { ...config.start, [key]: val } });
  const updateGoal = (key, val) => onConfigChange({ ...config, goal: { ...config.goal, [key]: val } });

  return (
    <motion.div
      className="control-panel"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="panel-section">
        <h3 className="section-title">
          <span className="section-icon">🎯</span> Start Configuration
        </h3>
        <InputField label="θ₁ (Start)" value={config.start.theta1} onChange={(v) => updateStart('theta1', v)} min={-180} max={180} unit="°" />
        <InputField label="θ₂ (Start)" value={config.start.theta2} onChange={(v) => updateStart('theta2', v)} min={-180} max={180} unit="°" />
      </div>

      <div className="panel-section">
        <h3 className="section-title">
          <span className="section-icon">🏁</span> Goal Configuration
        </h3>
        <InputField label="θ₁ (Goal)" value={config.goal.theta1} onChange={(v) => updateGoal('theta1', v)} min={-180} max={180} unit="°" />
        <InputField label="θ₂ (Goal)" value={config.goal.theta2} onChange={(v) => updateGoal('theta2', v)} min={-180} max={180} unit="°" />
      </div>

      <div className="panel-section">
        <h3 className="section-title">
          <span className="section-icon">🦾</span> Robot Parameters
        </h3>
        <InputField label="Link 1 Length" value={config.L1} onChange={(v) => update('L1', Math.max(10, v))} min={10} max={300} unit="u" />
        <InputField label="Link 2 Length" value={config.L2} onChange={(v) => update('L2', Math.max(10, v))} min={10} max={300} unit="u" />
        <InputField label="Grid Resolution" value={config.gridStep} onChange={(v) => update('gridStep', Math.max(2, Math.min(45, v)))} min={2} max={45} unit="°" />
      </div>

      <div className="panel-section">
        <h3 className="section-title">
          <span className="section-icon">⚠️</span> Obstacle
        </h3>
        <Toggle label="Obstacle Enabled" value={config.obstacle.enabled} onChange={(v) => updateObs('enabled', v)} />
        <InputField label="Obstacle X" value={config.obstacle.x} onChange={(v) => updateObs('x', v)} min={-300} max={300} unit="u" />
        <InputField label="Obstacle Y" value={config.obstacle.y} onChange={(v) => updateObs('y', v)} min={-300} max={300} unit="u" />
        <InputField label="Radius" value={config.obstacle.radius} onChange={(v) => updateObs('radius', Math.max(5, v))} min={5} max={300} unit="u" />
        <InputField label="Safety Margin" value={config.safetyMargin} onChange={(v) => update('safetyMargin', Math.max(0, v))} min={0} max={50} unit="u" />
      </div>

      <div className="panel-actions">
        <motion.button
          className={`btn btn-primary ${isPlanning ? 'btn-loading' : ''}`}
          onClick={onPlan}
          disabled={isPlanning || isAnimating}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isPlanning ? (
            <><span className="spinner" /> PLANNING...</>
          ) : (
            <><span>⚡</span> PLAN PATH</>
          )}
        </motion.button>

        <motion.button
          className={`btn btn-success ${!hasPath || isAnimating ? 'btn-disabled' : ''}`}
          onClick={onAnimate}
          disabled={!hasPath || isPlanning}
          whileHover={{ scale: hasPath && !isAnimating ? 1.03 : 1 }}
          whileTap={{ scale: 0.97 }}
        >
          {isAnimating ? <><span className="spinner" /> EXECUTING...</> : <><span>▶</span> RUN ANIMATION</>}
        </motion.button>

        <motion.button
          className="btn btn-outline"
          onClick={onReset}
          disabled={isPlanning}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span>↺</span> RESET
        </motion.button>
      </div>

      {planningStatus && (
        <motion.div
          className={`status-badge ${planningStatus.type}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {planningStatus.message}
        </motion.div>
      )}
    </motion.div>
  );
}
