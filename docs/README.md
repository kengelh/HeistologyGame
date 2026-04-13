# Heistology - Project Documentation

Welcome to the official documentation for **Heistology**, a top-down, turn-based heist game inspired by classics like "They Stole a Million". This document serves as the central hub for understanding the project's architecture, game mechanics, and future plans.

## Project Overview

Heistology is a strategic single-page web application where players plan and execute intricate heists. The core experience is divided into two phases: a meticulous **Planning Phase** where every action is choreographed, and a tense **Execution Phase** where the plan unfolds in real-time.

### Core Features

-   **Two-Phase Gameplay**: A unique blend of turn-based strategy (Planning) and real-time consequences (Execution).
-   **Predictive Planning**: The UI provides detailed projections of guard movements, camera fields-of-view, and action outcomes, allowing for deep strategic planning.
-   **Dynamic Execution**: A real-time game loop simulates the heist, with AI guards reacting to noise, evidence, and visual contact.
-   **In-Game Map Editor**: A comprehensive, built-in tool for creating, editing, and saving custom scenarios directly in the browser.
-   **Campaign Progression**: A persistent career mode where players earn cash and reputation to unlock more challenging heists and skilled crew members.
-   **Specialized Crew**: A roster of characters with unique skills in disciplines like Lockpicking, Demolitions, and Electronics, adding a layer of team composition strategy.

### Technology Stack

-   **Frontend Framework**: React 19 (via CDN)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS (via CDN) with custom keyframe animations.
-   **Module System**: Native ES Modules with **Import Maps**. This is a key architectural choice that allows the project to run without a traditional build step (e.g., Webpack, Rollup).
-   **Data Persistence**: Browser **IndexedDB** is used to locally store user-created scenarios and campaign progress.