# 🤖 Articulated Robot Path Planner

**AI & Robotics Laboratory | Set 59 | CO4 – K6**  
**Task: A* Path Planning in Joint Space for 2R Planar Articulated Robot**

---

## 📌 Objective

Design and deploy a browser-based, deployment-ready path planner for a university tele-laboratory. Remote students can access the planner at a public Vercel URL without any local installation, and run matrix tests comparing localhost vs. deployed behaviour.

---

## ✨ Features

- **A\* Path Planning in Joint Space** — grid-based search over (θ₁, θ₂) configuration space
- **2R Planar Robot Forward Kinematics** — live visualization on HTML5 Canvas
- **Collision Detection** — segment-to-circle intersection test with configurable safety margin
- **Animated Trajectory Execution** — smooth playback of planned path waypoints
- **Interactive Parameter Control** — all robot and obstacle parameters are adjustable
- **Test Matrix** — automated execution of P1–P4 predefined test cases
- **Deployment Validation** — compare localhost vs. Vercel planning results side-by-side
- **Professional Dark UI** — glass panels, cyan glow, Framer Motion transitions

---

## 🧠 Algorithm: A\* in Joint Space

### Configuration Space

The robot is represented as a vector in joint space:

```
q = [θ₁, θ₂]     (degrees)
```

### A\* Cost Function

```
f(n) = g(n) + h(n)
```

Where:
- `g(n)` = accumulated cost from start to node `n` (sum of angular steps)
- `h(n)` = heuristic: Euclidean distance in joint space to goal

```
h(n) = sqrt((θ₁ₙ - θ₁_goal)² + (θ₂ₙ - θ₂_goal)²)
```

### Grid Discretisation

Joint space is discretised into angular cells of size `gridStep` (default: 10°).

Neighbour states (8-connected):
```
(θ₁ ± step, θ₂)          ← cardinal
(θ₁, θ₂ ± step)          ← cardinal
(θ₁ ± step, θ₂ ± step)   ← diagonal (cost = √2 × step)
```

Joint limits:
```
θ₁ ∈ [-180°, +180°]
θ₂ ∈ [-180°, +180°]
```

---

## 📐 Forward Kinematics

For a 2R planar robot with link lengths L₁ and L₂:

```
x₁ = L₁ cos(θ₁)
y₁ = L₁ sin(θ₁)

x₂ = x₁ + L₂ cos(θ₁ + θ₂)
y₂ = y₁ + L₂ sin(θ₁ + θ₂)
```

Default parameters:
- L₁ = 120 units
- L₂ = 100 units
- Max reach = L₁ + L₂ = 220 units

---

## 🛡️ Collision Detection

For each candidate configuration in A\*:

1. Apply forward kinematics → get joint positions
2. Compute **minimum distance from obstacle centre to each link segment**
3. Use the `point-to-segment` distance formula
4. If `distance < obstacle.radius + safetyMargin` → **reject configuration**

The path is guaranteed collision-free by construction.

---

## 🧪 Test Matrix

| Test | Start (θ₁, θ₂) | Goal (θ₁, θ₂) | Obstacle | Expected |
|------|----------------|---------------|----------|----------|
| **P1** | (-80°, 70°) | (70°, -45°) | R=40 at (80,80) | Path Found |
| **P2** | (-80°, 70°) | (70°, -45°) | R=130 at (60,60) | No Path / Blocked |
| **P3** | (-60°, 30°) | (60°, 30°) | R=45 at (-50,100) | Path behaviour changes |
| **P4** | (0°, 0°) | (60°, 30°) | R=60 at (200,30) | Invalid Start (inside obs) |

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
cd articulated-path-planner
npm install
npm run dev
```

Open: http://localhost:5173

---

## 🔨 Build Command

```bash
npm run build
```

Output: `dist/` directory (ready for Vercel deployment)

---

## ☁️ Vercel Deployment

### Option 1: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: Vercel Dashboard

1. Push project to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import repository
4. Framework: **Vite** (auto-detected)
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click **Deploy**

---

## 📊 Localhost vs. Vercel Validation

After deployment, use the **Deployment Validation** tab in the application:

1. Run a path planning test locally and note the statistics
2. Open the Vercel deployed URL
3. Run the same test configuration
4. Enter localhost values in the comparison table
5. Export/copy results for your lab report

**Expected behaviour:**
- Path result, waypoints, path cost: **Identical** (deterministic A*)
- Planning time: **May differ** (CPU performance difference between environments)
- Collision checks: **Identical**

---

## 📁 Project Structure

```
articulated-path-planner/
├── src/
│   ├── algorithms/
│   │   └── astar.js          # A* path planning algorithm
│   ├── robotics/
│   │   └── kinematics.js     # Forward kinematics + collision detection
│   ├── components/
│   │   ├── RobotCanvas.jsx   # HTML5 Canvas visualization
│   │   ├── ControlPanel.jsx  # Left sidebar controls
│   │   ├── StatsPanel.jsx    # Right statistics panel
│   │   ├── TestMatrix.jsx    # Automated test matrix
│   │   └── DeploymentValidator.jsx  # Localhost vs Vercel comparison
│   ├── data/
│   │   └── testCases.js      # Predefined test configurations
│   ├── App.jsx               # Main application component
│   └── App.css               # Dark robotics theme
├── public/
│   └── robot-icon.svg        # Favicon
├── index.html                # Entry HTML with SEO meta tags
├── package.json              # Project manifest
├── vite.config.js            # Vite + React plugin config
├── vercel.json               # Vercel deployment config
└── README.md                 # This file
```

---

## 🏫 Laboratory Details

- **Subject**: Artificial Intelligence and Robotics
- **Set**: 59
- **CO**: CO4 — K6 (Create)
- **Task**: Tele-lab path planner, Vercel deployment, matrix tests, environment comparison

---

## ⚠️ Limitations

- A* search is limited to 50,000 node expansions to prevent browser freeze
- Very fine grid resolution (< 5°) may cause slow search; use with caution
- Planning runs on the browser's main thread; no backend required
- Joint limits are clamped to [-180°, +180°] with angle wrapping
- Obstacle is modeled as a single circle in the workspace

---

*Built with React + Vite · Framer Motion · HTML5 Canvas · A\* Algorithm*
