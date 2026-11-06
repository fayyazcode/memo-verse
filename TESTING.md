# Testing

## Commands

- `npm run typecheck`: TypeScript checking.
- `npm test`: Vitest gameplay rules, campaign integration, resource lifecycle, economy, befriending, and fake-IndexedDB persistence.
- `npm run build`: production compile, TypeScript, and static generation.
- `npm run test:e2e`: Playwright Chromium checks against a separately running development server on port 3000.

The browser configuration uses `/usr/bin/chromium` with SwiftShader for this cloud machine. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override it on another machine. Software-renderer flags are a test-runner choice, not a product graphics setting. Run tests in an execution context permitting browser subprocesses and local server access.

## What is covered

61 logic/integration tests cover stacking and capacity, atomic crafting transactions, invalid quantities, player leveling, elemental multipliers, quest prerequisites/objectives, unique campaign IDs and dependency cycles, duplicate reward prevention, actual shelter geometry, placement bounds, save schema validation, queued writes, stale local revisions, new-game replacement, resource pause/respawn, collection costs, healing, and shop balances.

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

Batch crafting adds eight logic tests for scaled costs/output, insufficient ingredients, inventory overflow, non-monotonic slot availability, invalid quantities, Max limits, quest output counting, and single-batch compatibility. The focused browser scenario uses the numeric field and range keyboard controls, crafts twelve wooden blocks from six wood, checks remaining materials, uses Max, and verifies the building quest counts all twelve outputs.

River checks validate arch endpoints/symmetry/center height, dry Aquabub placement, resource clearance, submersion bounds, drag/buoyancy and frame-delta limits. Browser traversal starts on the arch, walks to the bank, climbs back up and checks real saved player heights. A second scenario checks stable wading above the bed, shader errors and Aquabub befriending from the dry shore. Nearby moonflower watering and the batch-crafting UI were also rerun successfully against the river build.

Combined crafting/river release: build and TypeScript pass; all 55 logic tests pass. Focused browser checks passed for batch crafting, moonflower watering, bridge traversal and wading/Aquabub collection. The final cleaned river layout was rechecked for traversal and water/creature access; the traversal assertion compares actual player height with the reached plank to tolerate software-renderer input timing. Screenshots reviewed.

Appearance/animation logic tests cover rested and alternating diagonal gait poses, nonnegative foot lifts, attack wind-up/recovery, distinct skin palettes, mobile versus desktop zoom, practice-attack intent without rewards, and companion attack cooldowns. A browser flow observes actual following/resting status during movement, captures the pet walk and selected outfit, and verifies skin persistence after reload. Mobile touch tests are rerun to qualify the smaller view. These are functional software-rendered checks, not physical-device performance measurements.

Pet/outfit release validation: build and TypeScript pass; all 61 logic tests pass. Both mobile scenarios passed with the farther camera. The follower/outfit scenario initially caught a low-FPS movement cap, then passed after the controller timestep was corrected. Skin persistence, walking-to-rest transitions and attack intent were checked; screenshots reviewed.

Perspective tests preserve Classic parameters and check the orthographic projection, diagonal yaw, fixed elevation and world-view size. The mobile browser scenario toggles views, checks tap-to-move and joystick movement in Isometric, exercises Settings selection, confirms the stored preference after reload and captures both views. Existing mobile input tests run alongside it. Visual comparison uses the user-supplied reference screenshot.

Isometric release validation: production build and TypeScript pass; all 63 logic tests pass. Both existing mobile scenarios and the perspective scenario passed. The final production build passed the expanded perspective scenario, including orthographic tap-to-move, joystick movement, Settings selection, reload persistence and landscape resizing. Portrait and landscape screenshots reviewed. Physical-device performance remains unmeasured.

## Living World Phase 1 validation

Audit baseline: 63 logic tests and TypeScript passed at 3455c36. Phase 1 adds membership, cooldown/charge, targeting, all four species' abilities/passives, area timing, healing/shields, AI survival, original Guardian reward/event, binding and persistence coverage. The logic suite now has **106 passing tests across 10 files**. `npm run typecheck` and `npm run build` pass.

The campaign fixture still completes all ten original missions without debug inventory/rewards. It now waits through real switch/ability cooldowns instead of clearing a legacy cooldown field directly. The animation fixture enters active play. The appearance browser assertion accepts Fireball/target feedback because practice targets are now valid combat targets.

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3008 npm run test:e2e` passed **17/17 browser scenarios**. This includes the original save/movement/pause/NPC/gather/build/craft/equipment/guidance/river/camera/touch checks and both squad scenarios. After final Guardian targeting/checkpoint corrections, the mouse, perspective and squad files passed **4/4** again. The final survival behavior was checked by logic tests and a final rerun of the squad scenarios (result recorded below).

New browser coverage loads a literal legacy save, equips three friends, checks the fourth-slot restriction, changes the commanded companion, casts actual damage/shield effects, confirms cooldown freezing in menus, saves/reloads while preserving inventory/buildings/quests, cycles using keyboard controls and verifies rebinding. Native mobile touch casts an ultimate, checks consumed charge/cooldown, rotates to landscape, switches to Aquabub and verifies Tidal Wave displaces the Guardian. Screenshots reviewed for the squad screen, three followers/shields, and portrait/landscape HUD.

### Performance qualification

The reproducible profiler is `scripts/profile-squad.cjs` (`npm run profile:squad`). Start the current server; optionally provide an independently built baseline using `MOMO_BASELINE_URL`. Example: `MOMO_BASELINE_URL=http://127.0.0.1:3009 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3008 npm run profile:squad`. The helper closes each browser before the next scenario and cleans up browsers on error.

Measured configuration: Chromium with SwiftShader software WebGL, 1440×900, low quality, idle village at [0,1,10], identical camera, one browser at a time, ten-second warm-up, three five-second requestAnimationFrame samples. Original build was built in a separate checkout at 3455c36. Raw data is retained in docs/PHASE1_PERFORMANCE.json.

| Scenario | Mean observed frame cadence |
| --- | --- |
| Original game, one companion | 3.31 FPS |
| Phase 1, one companion | 2.70 FPS |
| Phase 1, three companions | 3.05 FPS |

These software-rendered measurements are variable and do not establish physical-device performance or absence of a performance regression. The specification's 30/60 FPS targets remain unvalidated. An earlier profiling attempt mistakenly kept previous browser instances open; those samples were discarded. A separate short frame sample is emitted by the squad browser test for repeatability, not as a hardware benchmark.

Functional Phase 1 tests pass on the available Chromium environment. Edge, Firefox and physical mobile devices have not been tested. Phase 2 has not been started.

Final release checks: after the survival-direction/healing fixes, both squad browser scenarios passed again (**2/2**). The final portrait spacing adjustment then passed the native mobile scenario (**1/1**), including an explicit assertion that the squad HUD clears the existing companion card, real ultimate/push resolution, and landscape access. Final logic suite: **106/106**. Final TypeScript check, production build and diff whitespace check pass. Functional Phase 1 validation is complete on the available environment; hardware performance qualification remains pending and Phase 2 is not started.

## Mobile-first HUD redesign validation

Logic baseline was 106 tests. The final suite passes **112/112 tests across 11 files**, including tracked-quest fallback, objective projection after shelter removal, notification classification, resource-message combining and bounded notification priority. Final TypeScript checks and production build pass.

The complete browser run executed **19 scenarios: 18 passed, one timed out during world preparation before the Begin button appeared** (the gathering test's existing 30-second initialization limit). It did not reach gathering. An unchanged-timeout rerun of that scenario passed, together with both UI scenarios (**3/3**). This validates all 19 scenarios across the full run and targeted reruns. After the final font-size adjustment, both UI scenarios passed again (**2/2**).

Responsive checks use native touch emulation at 320×640, 360×800, 390×844, 430×932, 768×1024 and 844×390, plus desktop at 1280×720 and 1920×1080. They verify viewport bounds and non-overlap of the menu/pause buttons, joystick, primary actions, companion summary and hotbar. Screenshots were inspected for compact exploration, the ability tray, side menu, desktop and increased text size.

Functional checks cover drawer navigation/input suppression, focus trapping and restoration, Space activation, Tab navigation inside the squad menu, camera selection, real touch ability casting, locked/cooldown states, building controls replacing combat controls, journal tabs, map marker filters, tracked-quest cycling, saved scale/tracking, and reduced motion. Font-size checks verify 90%, 100%, 115% and 130% produce strictly increasing body text sizes; 130% remains within the phone viewport. Original outfit, mission, crafting, inventory, equipment, building, companion, river, camera and save scenarios remain covered.

Artifacts: `/tmp/momo-ui-{width}x{height}.png`, `/tmp/momo-ui-ability-tray.png`, `/tmp/momo-ui-side-menu.png`, `/tmp/momo-ui-scale130.png`, and desktop screenshots generated by e2e/ui-redesign.spec.ts. The first UI reload test exposed an unconditional test-fixture settings reset; the fixture was corrected to preserve existing preferences. No adventure save schema change was required.

These are Chromium/software-rendered functional and layout checks. Physical phone/browser-chrome behavior and a live Netlify deployment were not verified. The host-supplied Netlify badge is outside the application source; no unimplemented gameplay menus were added.

## HUD minimization, crisp names and forest-secret recovery

Final logic suite: **116/116 tests in 11 files**. Added checks for a chest opened before mission acceptance, stale active progress repaired at load/checkpoint, untouched input and disk data during validation, no credit for unopened chests, completed-mission preservation and no duplicate chest/quest rewards. The original ten-mission campaign still passes. Final TypeScript and production build checks pass.

Focused browser run: **7/7 passed** (compact HUD/recovery, NPC reward collection, moonflower watering, mouse interactions, both cameras and mobile/desktop redesign). After the final player-clearance adjustment, both new scenarios passed again (**2/2**). The tests minimize/restore the full status HUD and the quest alone, reload their preferences, open companion abilities while minimized, verify native labels remain at least 14px with no transform scaling in Classic/Isometric, and collect the repaired quest from Bloop. A representative old save retains its two crystals and goes from 110 to 285 coins solely from the 175-coin mission reward.

Screenshots reviewed: `/tmp/momo-minimized-hud-sharp-labels.png`, `/tmp/momo-sharp-labels-isometric.png`, `/tmp/momo-compact-quest.png`. Native text rendering/collision placement was inspected in both camera views. These remain software-rendered Chromium checks rather than physical-device or live Netlify verification.

## Villager daily routines

`tests/villagers.test.ts` covers outdoor route clearance for all five villagers, rotated-door entry, errands/work/home/rest/return transitions, bounded commute speed, daily reconstruction from version-1 saves, nighttime quest reward guidance, and local/remote trade validation. The full logic suite passes: **121 tests in 12 files**. Production build (including TypeScript) passes.

`e2e/villagers.spec.ts` exercises moving map markers, visible activity labels, menu pause, resting-home interaction, a real quest reward and save/reload. Workplaces and routines do not generate inventory items, money, XP or quest credit. Routes cover static village scenery; player construction remains confined to the existing homestead outside these routes.

Chromium regression run: **8/8 passed** across `villagers`, `foundation` and `compact-hud`. This includes live marker movement, pause, home quest rewards and reload, ordinary mission acceptance, player movement, resource gathering, housing persistence, mobile HUD minimization, sharp labels and early forest treasure recovery. Work/rest screenshots were reviewed. Browser rendering uses software WebGL here; these checks do not establish physical-device frame rates.

After final turning/sleep alignment polish, the production build passed again and both routine browser scenarios passed again (**2/2**) against the updated port-3000 preview. The final logic suite remains **121/121 passing**.
