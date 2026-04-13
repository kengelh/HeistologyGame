# Development Roadmap

This document outlines the current feature set and the planned direction for the future development of Heistology.

---

## Version 1.0 (Current)

This version represents the core, playable beta of the game.

-   [x] **Core Gameplay Loop**: Two-phase system (Planning & Execution) is fully functional.
-   [x] **AI Systems**:
    -   [x] Guards with predictable patrol routes.
    -   [x] Guards react to evidence, suspicious changes, and noise.
    -   [x] Cameras with predictable panning patterns.
    -   [x] Alarms, Laser Grids, and Pressure Plates.
-   [x] **Map Editor**: Fully integrated tool to create and modify every aspect of a scenario (tiles, guards, cameras, treasures, etc.).
-   [x] **Campaign System**:
    -   [x] Persistent cash and reputation.
    -   [x] Unlocking new scenarios via reputation milestones.
    -   [x] Hiring crew from a tiered roster.
-   [x] **Content**:
    -   [x] An initial set of default scenarios across multiple tiers.
    -   [x] A roster of characters with unique skill combinations.
-   [x] **Persistence**: Custom scenarios and campaign progress are saved locally via IndexedDB.

---

## Version 1.1 (Short-Term: Polish & UX)

This phase focuses on improving the user experience and adding layers of polish to the existing mechanics.

-   [ ] **Improved Onboarding**: Create a more interactive tutorial scenario that actively guides the player through planning their first few moves.
-   [ ] **Sound Effects**: Add audio feedback for key actions (lockpicking, smashing), alarms, guard alerts, and UI interactions.
-   [ ] **Visual Polish**:
    -   Implement more distinct animations for different player/guard actions beyond simple icons.
    -   Enhance visual feedback for guard states (e.g., a clearer "Alerted" indicator).
    -   Add subtle environmental animations.
-   [ ] **Map Editor Quality of Life**:
    -   Implement Fill ("paint bucket") tool for faster terrain painting.
    -   Add Copy/Paste functionality for rooms or sections of a map.
    -   Allow users to name individual guards in the editor.

---

## Version 1.2 (Mid-Term: Gameplay Depth)

This phase aims to add new mechanics and systems to increase strategic variety.

-   [ ] **New Security Systems**:
    -   **Keycards**: Introduce doors that require a specific keycard. Keycards would need to be stolen from a guard's patrol route or from a specific office location.
    -   **Motion Sensors**: Add invisible traps that trigger if a player moves through them (as opposed to standing still).
    -   **Security Phones**: Guards who become alerted will first run to a phone to call for backup, introducing a delay before the main alarm triggers, creating a window of opportunity for players.
-   [ ] **New Player Skills & Items**:
    -   **Hacking Skill**: Expand the `electronics` skill into a full `hacking` skill. Allow skilled hackers to not just disable but also temporarily control cameras or create "ghost" noises on the security network.
    -   **Disguise Item**: A single-use item that allows a player to walk past a guard once without being spotted.
-   [ ] **Advanced Guard AI**:
    -   **Guard Communication**: Guards who spot something suspicious could alert other nearby guards, causing them to deviate from their patrols to assist.
    -   **Guard Memory**: Guards who find evidence or investigate a noise become permanently more wary, with a slightly larger vision cone for the rest of the heist.

---

## Version 2.0 (Long-Term: Major Features)

This phase involves significant feature additions that would expand the scope of the game.

-   [ ] **Multi-Level Maps**: Introduce scenarios that span multiple floors, requiring players to plan routes using stairs or elevators, adding a vertical dimension to heists.
-   [ ] **Civilians**: Add neutral NPC civilians who react to seeing players or hearing loud noises. They might flee, hide, or attempt to call security, adding a new layer of unpredictability.
-   [ ] **Online Scenario Sharing**: Create a backend system (or use a simple service) to allow players to upload their custom-made scenarios and download/rate maps created by other players.
-   [ ] **Expanded Campaign**: Develop a branching narrative for the campaign, where players can choose to work for different syndicates, creating rivalries and offering unique story-based heists.
-   [ ] **Crew Progression**: Allow crew members to gain experience points from successfully used skills during heists, enabling them to "level up" and improve their abilities over the course of a campaign.