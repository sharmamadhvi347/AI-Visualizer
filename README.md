# AI Toy Problem Visualizer

An interactive web application that brings classic Artificial Intelligence problems to life through step-by-step animated visualizations.

[![Visit Now 🚀](https://img.shields.io/badge/Visit%20Now-%F0%9F%9A%80-D4622A?style=for-the-badge&logoColor=white)](https://sharmamadhvi347.github.io/AI-Visualizer/)

---

## Overview

**AI Toy Problem Visualizer** lets you explore and interact with two of the most well-known problems in Artificial Intelligence. Instead of reading about them in theory, you can watch algorithms solve them in real time — with every decision explained as it happens.

---

## Problems

### ⛵ Missionaries & Cannibals

A classic state-space search problem. Move 3 missionaries and 3 cannibals across a river using a boat, without ever letting cannibals outnumber missionaries on either side.

- Play manually or let the AI solve it automatically
- BFS algorithm finds the optimal solution in 11 moves
- Step through the solution one move at a time
- Live agent reasoning log narrates every decision
- Win/lose detection with animated feedback

### 🗺️ Travelling Salesman Problem

A combinatorial optimization problem where the goal is to find the shortest route that visits every city exactly once and returns to the start.

- Click on the canvas to place cities anywhere
- Generate a random set of cities instantly
- Nearest Neighbor Greedy algorithm animates the path as it builds
- 2-Opt optimization refines the greedy result
- Live distance counter updates with every step
- Compare the greedy path vs the optimized path on the same canvas

---

## Tech Stack

| | |
|---|---|
| Language | HTML, CSS, JavaScript |
| Algorithms | BFS, Nearest Neighbor Greedy, 2-Opt |
| Hosting | GitHub Pages |

No frameworks. No libraries. No build tools. Fully frontend.

---

## Algorithms

**BFS — Breadth First Search**
Used to solve the Missionaries & Cannibals problem. Explores every valid state layer by layer and guarantees the shortest possible solution. Each state tracks the number of people and the boat position on both banks.

**Nearest Neighbor Greedy**
Used for TSP. Starting from any city, the algorithm always moves to the closest unvisited city next. Fast and intuitive, though not always optimal.

**2-Opt**
An improvement step for TSP. After the greedy pass, it iteratively checks whether swapping two route segments reduces the total distance, and keeps going until no further improvement is possible.

---

## Author

**Madhvi Sharma**
[@sharmamadhvi347](https://github.com/sharmamadhvi347)