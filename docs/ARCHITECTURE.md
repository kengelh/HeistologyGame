# Application Architecture

This document outlines the architectural principles and structure of the Heistology application.

## 1. Overall Philosophy

The architecture is designed for **simplicity and rapid prototyping**. The primary goal is to create a self-contained application that can run directly in a modern browser with zero build configuration. This makes it ideal for environments like AI Studio and allows developers to focus purely on game logic and UI.

## 2. Frontend Framework & Module System

-   **React 19**: The UI is built using React for its declarative, component-based paradigm. All components are functional components utilizing React Hooks.

-   **Vite Build Setup**: The project uses Vite for a modern, fast development experience and optimized production builds.
    -   **Dev Server**: `npm run dev` starts a local development server with Hot Module Replacement (HMR).
    -   **Production Build**: `npm run build` creates a minified, optimized distribution in the `dist/` folder.
    -   **TypeScript**: The project is written in TypeScript, ensuring type safety and better developer tooling.

## 3. State Management

-   **Centralized State**: The root `<App>` component acts as the "single source of truth," holding the master `gameState` object in its state. This object contains all dynamic information required to render a game session.

-   **React Context (`GameContext`)**: To prevent "prop drilling" (passing props through many layers of components), a React Context is used. The `App` component provides the `gameState` and all action dispatcher functions (e.g., `handleMove`, `handleInteract`) to the context. Components like `GameBoard` and `ControlPanel` consume this context to get the data and callbacks they need.

-   **Immutability**: All state updates are handled immutably. When a change is needed, a deep clone of the current `gameState` is created using a custom `deepClone` utility. Modifications are made to this clone, which is then set as the new state. This is fundamental to React's change detection and prevents a wide class of bugs related to state mutation.

## 4. Code Organization

The codebase is structured to separate concerns, making it more modular and maintainable.

-   **`index.tsx`**: The application entry point, responsible for rendering the root `<App>` component.
-   **`App.tsx`**: The main application controller. It manages screen transitions (main menu, game, editor), holds the primary game state, and contains all the core action handlers that modify that state.
-   **`components/`**: This directory contains all React UI components.
    -   `GameBoard.tsx`: Renders the game world, including tiles, characters, and visual overlays.
    -   `ControlPanel.tsx`: The primary user interface for planning actions and viewing game status.
    -   `MapEditor.tsx`: A large, self-contained component for creating and editing scenarios.
    -   `Icons.tsx`: A centralized library of reusable SVG icon components.
-   **`lib/`**: This directory contains all pure, non-UI game logic.
    -   `gameLoop.ts`: Contains the `tick` function, the core engine of the real-time execution phase.
    -   `state.ts`: Includes functions for creating the initial game state and, crucially, for **projecting** the state into the future based on a plan.
    -   `pathfinding.ts`: Houses the Breadth-First Search (BFS) pathfinding algorithm and line-of-sight calculations.
    -   `actions.ts`, `guards.ts`, `tiles.ts`, etc.: Small modules dedicated to the logic for a specific game concept.
-   **`types.ts`**: A central file defining all TypeScript interfaces and type aliases, ensuring type safety throughout the project.
-   **`constants.ts`**: Centralizes all "magic numbers" for game balance, such as action timings, penalties, and ranges.

## 5. Data Persistence

-   **IndexedDB**: To store user-created content and campaign progress persistently in the browser, IndexedDB is used. It's a robust, client-side database suitable for structured data.
-   **`lib/database.ts`**: This file provides a simple, promise-based API that abstracts away the complexities of IndexedDB transactions, making it easy to save, load, and delete scenarios and campaign data.