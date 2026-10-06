import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { astarSearch } from '../algorithms/astar';
import { TEST_CASES } from '../data/testCases';

function getStatusClass(result) {
  if (!result) return 'pending';
  if (result.status === 'PASS') return 'pass';
  if (result.status === 'FAIL') return 'fail';
  return 'pending';
}

function determineActualStatus(testCase, stats) {
  if (!stats) return null;
  const expected = testCase.expectedStatus;

  if (expected === 'invalid_start') {
    return stats.errorMessage?.toLowerCase().includes('start') ? 'PASS' : 'FAIL';
  }
  if (expected === 'no_path') {
    return !stats.pathFound ? 'PASS' : 'FAIL';
  }
  if (expected === 'path_found') {
    return stats.pathFound ? 'PASS' : 'FAIL';
  }
  return 'FAIL';
}

export default function TestMatrix({ onLoadTest }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

  async function runTest(tc) {
    setRunning(tc.id);
    setResults((prev) => ({ ...prev, [tc.id]: { running: true } }));

    try {
      const result = await astarSearch(
        tc.start,
        tc.goal,
        {
          step: tc.gridStep,
          L1: tc.L1,
          L2: tc.L2,
          obstacle: tc.obstacle,
          safetyMargin: tc.safetyMargin,
        },
        null
      );

      const status = determineActualStatus(tc, result.stats);
      const actualResult = result.stats.pathFound
        ? 'Path Found'
        : result.stats.errorMessage?.includes('Start') || result.stats.errorMessage?.includes('start')
          ? 'Invalid Start'
          : 'No Path';

      setResults((prev) => ({
        ...prev,
        [tc.id]: {
          running: false,
          status,
          actual: actualResult,
          nodesExplored: result.stats.nodesExplored,
          pathCost: result.stats.pathCost?.toFixed(1) ?? 'N/A',
          waypoints: result.stats.waypoints,
          planningTime: result.stats.planningTime?.toFixed(1) + ' ms',
          errorMessage: result.stats.errorMessage,
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [tc.id]: { running: false, status: 'FAIL', actual: 'Error: ' + err.message },
      }));
    }

    setRunning(null);
  }

  async function runAllTests() {
    setRunningAll(true);
    for (const tc of TEST_CASES) {
      await runTest(tc);
    }
    setRunningAll(false);
  }

  return (
    <motion.div
      className="test-matrix"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <h2 className="section-title-lg">
          <span>🧪</span> Test Matrix
        </h2>
        <div className="test-matrix-actions">
          <motion.button
            className="btn btn-primary"
            onClick={runAllTests}
            disabled={running !== null || runningAll}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {runningAll ? <><span className="spinner" /> RUNNING ALL...</> : '▶ RUN ALL TESTS'}
          </motion.button>
        </div>
      </div>

      <div className="test-table-wrapper">
        <table className="test-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Name</th>
              <th>Start (θ₁,θ₂)</th>
              <th>Goal (θ₁,θ₂)</th>
              <th>Obstacle</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Nodes</th>
              <th>Waypoints</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {TEST_CASES.map((tc) => {
              const res = results[tc.id];
              const isRunning = running === tc.id || (runningAll && res?.running);

              return (
                <motion.tr
                  key={tc.id}
                  className={`test-row ${getStatusClass(res)}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td><span className="test-id">{tc.id}</span></td>
                  <td className="test-name-cell">{tc.name}</td>
                  <td className="mono">({tc.start.theta1}°, {tc.start.theta2}°)</td>
                  <td className="mono">({tc.goal.theta1}°, {tc.goal.theta2}°)</td>
                  <td>
                    <span className={`obs-badge ${tc.id === 'P2' ? 'large' : tc.id === 'P4' ? 'inside' : 'normal'}`}>
                      {tc.id === 'P2' ? 'Large R=130' : tc.id === 'P3' ? 'Shifted' : tc.id === 'P4' ? 'Inside Start' : `R=${tc.obstacle.radius}`}
                    </span>
                  </td>
                  <td><span className="expected-badge">{tc.expected}</span></td>
                  <td>
                    {isRunning ? (
                      <span className="running-indicator"><span className="spinner-sm" /> Running...</span>
                    ) : res ? (
                      <span className={`actual-result ${res.status === 'PASS' ? 'result-pass' : 'result-fail'}`}>
                        {res.actual ?? '—'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="mono">{res && !isRunning ? (res.nodesExplored ?? '—') : '—'}</td>
                  <td className="mono">{res && !isRunning ? (res.waypoints ?? '—') : '—'}</td>
                  <td className="mono">{res && !isRunning ? (res.planningTime ?? '—') : '—'}</td>
                  <td>
                    <AnimatePresence>
                      {isRunning ? (
                        <motion.span key="running" className="status-pill pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          ⏳ Running
                        </motion.span>
                      ) : res ? (
                        <motion.span
                          key="done"
                          className={`status-pill ${res.status === 'PASS' ? 'pass' : 'fail'}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          {res.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
                        </motion.span>
                      ) : (
                        <span className="status-pill pending">⬜ PENDING</span>
                      )}
                    </AnimatePresence>
                  </td>
                  <td>
                    <div className="test-actions-cell">
                      <button
                        className="btn-sm btn-run"
                        onClick={() => runTest(tc)}
                        disabled={running !== null || runningAll}
                        title="Run this test"
                      >
                        ▶ Run
                      </button>
                      <button
                        className="btn-sm btn-load"
                        onClick={() => onLoadTest(tc)}
                        title="Load into simulator"
                      >
                        📥 Load
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="test-legend">
        <span className="legend-item"><span className="status-pill pass">✅ PASS</span> Expected result matched</span>
        <span className="legend-item"><span className="status-pill fail">❌ FAIL</span> Unexpected result</span>
        <span className="legend-item"><span className="status-pill pending">⬜ PENDING</span> Not yet executed</span>
      </div>
    </motion.div>
  );
}
