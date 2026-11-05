# Testing

## Commands

- `npm run typecheck`: TypeScript checking.
- `npm test`: Vitest gameplay rules, campaign integration, resource lifecycle, economy, befriending, and fake-IndexedDB persistence.
- `npm run build`: production compile, TypeScript, and static generation.
- `npm run test:e2e`: Playwright Chromium checks against a separately running development server on port 3000.

The browser configuration uses `/usr/bin/chromium` with SwiftShader for this cloud machine. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override it on another machine. Software-renderer flags are a test-runner choice, not a product graphics setting. Run tests in an execution context permitting browser subprocesses and local server access.

## What is covered

41 logic/integration tests cover stacking and capacity, atomic crafting transactions, invalid quantities, player leveling, elemental multipliers, quest prerequisites/objectives, unique campaign IDs and dependency cycles, duplicate reward prevention, actual shelter geometry, placement bounds, save schema validation, queued writes, stale local revisions, new-game replacement, resource pause/respawn, collection costs, healing, and shop balances.

The campaign integration test completes all ten missions from an initially empty inventory using game actions. It directly positions the player and advances attack cooldown state for deterministic execution. It validates system connectivity; it is not a manual or browser playthrough and does not prove encounter timing, navigation, visual quality, or performance.

All nine browser tests passed against the production build using low graphics at 1440 × 900. They check a fresh guest launch, actual movement through saved coordinates, pause/inventory, saved-position restoration, physical NPC interaction/quest acceptance, resource gathering without duplicate yields, and block placement persisted through reload. Set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001` when validating a production server on port 3001. The NPC test begins from a seeded nearby save; it does not skip mission acceptance.

## Not yet qualified

- Full 30–45-minute campaign played entirely through browser controls.
- Chrome, Edge, and Firefox on representative physical desktop GPUs.
- 60 FPS medium / 30 FPS low targets; no reference hardware has been agreed.
- Cloud authentication, server reward validation, import, or remote save conflicts.
- Historic save migrations (only initial version 1 and unsupported-version rejection exist).
- Exhaustive camera obstruction, arbitrary shelter shapes, and companion obstacle navigation.

Do not interpret a logic test pass as completion of these requirements.

The mouse-control browser test verifies clicking an NPC opens dialogue, clicking terrain moves the character, keyboard input still works, and clicking a tree collects its resources.

Additional guidance tests resolve every mission objective, omit inactive/completed goals, choose an available resource node, show remaining counts, and route completed missions back for rewards. A browser scenario exercises hovering the tracker, selecting a map destination, opening/closing a live creature card, and waiting for its 3D scene to report readiness. Equipment coverage selects a pickaxe and treat, captures the rendered hand visuals, and checks harvesting/duplicate-yield feedback. A logic test distinguishes mining from plant-picking actions and verifies failed repeated harvesting does not restart the animation.

Latest combined run: 37 logic tests and all seven browser tests passed. The full run previously exposed software-rendering timing limits and a startup camera drift; the camera now aligns immediately on load, and the two-scene creature-card flow has an explicit software-renderer time allowance.

Mobile tests use Chromium touch emulation at 390 × 844 and 844 × 390. Native CDP touch events drive the joystick while observing actual player position updates. Tests also check release/interrupt reset, task/minimap toggles, action availability, orientation bounds, save-and-quit, touch NPC dialogue, and that a camera drag does not start click-to-move. These checks do not establish performance or compatibility on physical iOS/Android devices. Pure tests cover joystick dead zone, analog strength, diagonal clamping, and interruption reset.

Mobile release validation: production build and TypeScript pass, all 40 logic tests pass, and the full nine-test browser suite passes. Both mobile tests were repeated successfully on the final input-reset build. Portrait/landscape screenshots were reviewed and touch controls were moved clear of the hotbar.

Moonflower regression: `e2e/moonflower.spec.ts` restores an active watering objective, finds the visible interaction target, reads its map directions, waters it with Aquabub, verifies the watered state and checks the reward destination replaces the watering marker. This test and the existing guidance/card browser test passed for the visibility fix; all 41 logic tests and the build also passed.
