# Testing

## Commands

- `npm run typecheck`: TypeScript checking.
- `npm test`: Vitest gameplay rules, campaign integration, resource lifecycle, economy, befriending, and fake-IndexedDB persistence.
- `npm run build`: production compile, TypeScript, and static generation.
- `npm run test:e2e`: Playwright Chromium checks against a separately running development server on port 3000.

The browser configuration uses `/usr/bin/chromium` with SwiftShader for this cloud machine. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override it on another machine. Software-renderer flags are a test-runner choice, not a product graphics setting. Run tests in an execution context permitting browser subprocesses and local server access.

## What is covered

31 logic/integration tests cover stacking and capacity, atomic crafting transactions, invalid quantities, player leveling, elemental multipliers, quest prerequisites/objectives, unique campaign IDs and dependency cycles, duplicate reward prevention, actual shelter geometry, placement bounds, save schema validation, queued writes, stale local revisions, new-game replacement, resource pause/respawn, collection costs, healing, and shop balances.

The campaign integration test completes all ten missions from an initially empty inventory using game actions. It directly positions the player and advances attack cooldown state for deterministic execution. It validates system connectivity; it is not a manual or browser playthrough and does not prove encounter timing, navigation, visual quality, or performance.

All four browser tests passed against the production build using low graphics at 1440 × 900. They check a fresh guest launch, actual movement through saved coordinates, pause/inventory, saved-position restoration, physical NPC interaction/quest acceptance, resource gathering without duplicate yields, and block placement persisted through reload. Set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001` when validating a production server on port 3001. The NPC test begins from a seeded nearby save; it does not skip mission acceptance.

## Not yet qualified

- Full 30–45-minute campaign played entirely through browser controls.
- Chrome, Edge, and Firefox on representative physical desktop GPUs.
- 60 FPS medium / 30 FPS low targets; no reference hardware has been agreed.
- Cloud authentication, server reward validation, import, or remote save conflicts.
- Historic save migrations (only initial version 1 and unsupported-version rejection exist).
- Exhaustive camera obstruction, arbitrary shelter shapes, and companion obstacle navigation.

Do not interpret a logic test pass as completion of these requirements.
