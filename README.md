# Heistology

![Heistology Banner](./heistology_handbook_header_1767648908788.png)

A top-down heist strategy game inspired by classics like *They Stole a Million*. Plan your heist, recruit your crew, and execute the perfect crime.

## Overview

**Heistology** is a tactical heist simulation where precision planning meets high-stakes execution. Players must navigate complex environments, bypass security systems, and escape with the loot.

### Version: 1.00 (Released Feb 12, 2026)

This is the official **Version 1.00** release of Heistology. It is a tactical heist simulator featuring core mechanics, planning systems, and AI behaviors. We hope you enjoy coordinating the perfect crime! Feedback and contributions are always welcome.

### Key Features

-   **Deep Planning Phase:** Plot your movements, time your actions, and coordinate your crew with frame-by-frame precision.
-   **Dynamic Execution:** Watch your plan unfold in real-time. Adapt to guards, cameras, lasers, and pressure plates.
-   **Campaign Mode:** Progress through a series of increasingly difficult scenarios, from small-town jobs to high-security penthouses.
-   **Team Management:** Recruit specialists with unique skills (Lockpicking, Hacking, Safecracking) and manage your crew's cuts.
-   **Map Editor:** Create, test, and share your own heist scenarios with a built-in level editor.
-   **Reputation System:** Build your name in the underworld to unlock more lucrative jobs.
-   **Procedural Reporting:** Receive dynamic newspaper reports summarizing your heist's outcome.

## Technology Stack

-   **Framework:** React 19
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **Build Tool:** Vite
-   **State Management:** React Context & Hooks
-   **Database:** IndexedDB (via local library) for save games and custom levels
-   **Monitoring:** Sentry (optional)

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/heistology.git
    cd heistology
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy `.env.example` to `.env` and fill in any required tokens (e.g., Sentry DSN, Analytics IDs).
    ```bash
    cp .env.example .env
    ```

4.  **Run in development mode:**
    ```bash
    npm run dev
    ```

5.  **Build for production:**
    ```bash
    npm run build
    ```

## How to Play

1.  **Select a Mission:** Choose a job from the Campaign Hub.
2.  **Briefing:** Review the primary and secondary objectives.
3.  **Recruit Crew:** Hire specialists based on the mission requirements and your available cash.
4.  **Plan:** Use the timeline to schedule actions (Move, Unlock, Smash, Hack, etc.).
5.  **Execute:** Start the execution and watch your plan come to life.
6.  **Escape:** Reach the getaway car before the time runs out or you get caught!

## Development & Testing

-   **Scenarios:** Defined in `scenarios.ts`.
-   **Roster:** Character data found in `roster.ts`.
-   **Mechanics:** Core logic resides in `lib/` (pathfinding, state management, etc.).
-   **Validation:** Use `npm run validate` (if configured) or run verification scripts like `verify_mechanics.ts`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

-   Inspired by *They Stole a Million*.
-   Special thanks to the open-source community for the amazing tools and libraries used in this project.
