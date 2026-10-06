import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RobotCanvas from './components/RobotCanvas';
import ControlPanel from './components/ControlPanel';
import StatsPanel from './components/StatsPanel';
import TestMatrix from './components/TestMatrix';
import DeploymentValidator from './components/DeploymentValidator';
import { astarSearch } from './algorithms/astar';
import { DEFAULT_CONFIG } from './data/testCases';
import './App.css';

const TABS = ['Simulator', 'Test Matrix', 'Deployment Validation'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Simulator');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [path, setPath] = useState([]);
  const [exploredNodes, setExploredNodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [exploredCount, setExploredCount] = useState(0);
  const [planningStatus, setPlanningStatus] = useState(null);
  const animRef = useRef(null);
  const planAbortRef = useRef(false);

  // Current display angles (from animation or manual)
  const animTheta1 = isAnimating && path.length > 0 ? path[Math.min(animStep, path.length - 1)].theta1 : config.start.theta1;
  const animTheta2 = isAnimating && path.length > 0 ? path[Math.min(animStep, path.length - 1)].theta2 : config.start.theta2;

  const handlePlan = useCallback(async () => {
    if (isPlanning) return;
    setIsPlanning(true);
    setPath([]);
    setExploredNodes([]);
    setStats(null);
    setAnimStep(0);
    setPlanningStatus(null);
    planAbortRef.current = false;

    // Grid resolution sanity check
    if (config.gridStep < 2) {
      setStats({ pathFound: false, errorMessage: 'Grid resolution too fine (< 2°). Increase step size.' });
      setPlanningStatus({ type: 'error', message: 'Grid resolution too fine!' });
      setIsPlanning(false);
      return;
    }

    try {
      const result = await astarSearch(
        config.start,
        config.goal,
        {
          step: config.gridStep,
          L1: config.L1,
          L2: config.L2,
          obstacle: config.obstacle,
          safetyMargin: config.safetyMargin,
        },
        (explored) => {
          setExploredCount(explored.length);
          setExploredNodes([...explored]);
        }
      );

      setStats(result.stats);
      setExploredNodes(result.explored);

      if (result.stats.pathFound) {
        setPath(result.path);
        setPlanningStatus({ type: 'success', message: `✅ Path Found! ${result.stats.waypoints} waypoints in ${result.stats.planningTime.toFixed(1)}ms` });
      } else {
        setPlanningStatus({ type: 'error', message: `❌ ${result.stats.errorMessage ?? 'No path found'}` });
      }
    } catch (err) {
      setPlanningStatus({ type: 'error', message: `Error: ${err.message}` });
    } finally {
      setIsPlanning(false);
    }
  }, [config, isPlanning]);

  const handleAnimate = useCallback(() => {
    if (!path.length || isAnimating) return;
    setIsAnimating(true);
    setAnimStep(0);

    let step = 0;
    function tick() {
      step++;
      if (step >= path.length) {
        setIsAnimating(false);
        setAnimStep(path.length - 1);
        return;
      }
      setAnimStep(step);
      // Smooth animation: 80ms per waypoint
      animRef.current = setTimeout(tick, 80);
    }
    animRef.current = setTimeout(tick, 80);
  }, [path, isAnimating]);

  const handleReset = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current);
    setIsAnimating(false);
    setAnimStep(0);
    setPath([]);
    setExploredNodes([]);
    setStats(null);
    setPlanningStatus(null);
    setExploredCount(0);
    setConfig(DEFAULT_CONFIG);
  }, []);

  const handleStopAnimation = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current);
    setIsAnimating(false);
  }, []);

  // Load a test case into config
  const handleLoadTest = useCallback((tc) => {
    if (animRef.current) clearTimeout(animRef.current);
    setIsAnimating(false);
    setPath([]);
    setExploredNodes([]);
    setStats(null);
    setPlanningStatus(null);
    setAnimStep(0);
    setConfig({
      start: tc.start,
      goal: tc.goal,
      L1: tc.L1,
      L2: tc.L2,
      gridStep: tc.gridStep,
      obstacle: tc.obstacle,
      safetyMargin: tc.safetyMargin,
    });
    setActiveTab('Simulator');
  }, []);

  useEffect(() => {
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-icon">🤖</div>
          <div>
            <h1 className="header-title">ARTICULATED ROBOT PATH PLANNER</h1>
            <p className="header-subtitle">AI &amp; Robotics Laboratory · Set 59 · CO4 · K6 · 2R Planar Robot · A* Joint Space Search</p>
          </div>
        </div>
        <div className="header-right">
          <span className="header-badge badge-astar">A★ Algorithm</span>
          <span className="header-badge badge-realtime">LIVE SIM</span>
          {isPlanning && <span className="header-badge badge-planning"><span className="spinner-sm" /> PLANNING</span>}
          {isAnimating && <span className="header-badge badge-animating">▶ EXECUTING</span>}
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Simulator' && '🤖 '}
            {tab === 'Test Matrix' && '🧪 '}
            {tab === 'Deployment Validation' && '🚀 '}
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="app-main">
        <AnimatePresence mode="wait">
          {activeTab === 'Simulator' && (
            <motion.div
              key="simulator"
              className="simulator-layout"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Left: Control Panel */}
              <ControlPanel
                config={config}
                onConfigChange={setConfig}
                onPlan={handlePlan}
                onReset={handleReset}
                onAnimate={isAnimating ? handleStopAnimation : handleAnimate}
                isPlanning={isPlanning}
                hasPath={path.length > 0}
                isAnimating={isAnimating}
                planningStatus={planningStatus}
              />

              {/* Center: Canvas */}
              <div className="canvas-wrapper">
                <div className="canvas-header">
                  <span className="canvas-title">Workspace Visualization</span>
                  <div className="canvas-legend">
                    <span className="legend-dot" style={{ background: '#00cfff' }} /> Link 1
                    <span className="legend-dot" style={{ background: '#7c3aed' }} /> Link 2
                    <span className="legend-dot" style={{ background: '#34d399' }} /> End-Effector
                    <span className="legend-dot" style={{ background: '#ff4444' }} /> Obstacle
                    <span className="legend-dot" style={{ background: '#00ffb4' }} /> Path
                  </div>
                </div>

                <RobotCanvas
                  theta1={config.start.theta1}
                  theta2={config.start.theta2}
                  L1={config.L1}
                  L2={config.L2}
                  obstacle={config.obstacle}
                  safetyMargin={config.safetyMargin}
                  path={path}
                  exploredNodes={exploredNodes}
                  startConfig={config.start}
                  goalConfig={config.goal}
                  animTheta1={animTheta1}
                  animTheta2={animTheta2}
                  isAnimating={isAnimating}
                />

                {isAnimating && (
                  <motion.div
                    className="animation-status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="anim-dot" />
                    Executing Planned Trajectory — Step {animStep + 1} / {path.length}
                    <div className="anim-progress">
                      <div
                        className="anim-progress-fill"
                        style={{ width: `${((animStep + 1) / path.length) * 100}%` }}
                      />
                    </div>
                    <button className="btn-sm btn-stop" onClick={handleStopAnimation}>⏸ Pause</button>
                  </motion.div>
                )}

                <div className="canvas-info-bar">
                  <span>L₁={config.L1}u · L₂={config.L2}u · Step={config.gridStep}°</span>
                  <span>Max Reach: {config.L1 + config.L2}u</span>
                  {stats && <span>Explored: {stats.nodesExplored} nodes</span>}
                </div>
              </div>

              {/* Right: Stats Panel */}
              <StatsPanel
                stats={stats}
                config={config}
                isPlanning={isPlanning}
                exploredCount={exploredCount}
              />
            </motion.div>
          )}

          {activeTab === 'Test Matrix' && (
            <motion.div
              key="testmatrix"
              className="full-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <TestMatrix onLoadTest={handleLoadTest} />
            </motion.div>
          )}

          {activeTab === 'Deployment Validation' && (
            <motion.div
              key="deploy"
              className="full-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <DeploymentValidator currentStats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>Articulated Robot Path Planner · Set 59 · CO4-K6 · A* Algorithm · 2R Planar Robot</span>
        <span>Forward Kinematics | Collision Detection | Joint Space Search</span>
      </footer>
    </div>
  );
}
