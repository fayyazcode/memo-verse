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

## Quiet HUD and real doorstep interaction

Final production build and TypeScript pass; **124/124 logic tests** pass. Final Chromium run: **16/16 passed**, covering compact status/quest preferences, mission recovery, movement/saves, ordinary mission acceptance, resource gathering, housing persistence, mission hover/map guidance, touch joystick/context actions, both camera perspectives, quiet mobile layouts at 320×640/390×844/430×932/844×390, injected badge removal, nearby readable names, menus/abilities/scaling/building, desktop keyboard navigation, NPC work routines, and a real knock/walk-out/dialogue/reward/reload sequence.

The earlier validation run exposed tests still calling removed permanent journal/quest-cycle controls and an invalid test inventory stack of 279 berries. Tests now use the compact tracker and valid 99/99/81 stacks; the full final run passes. Screenshots of the quiet phone HUD and nearby name were reviewed. Badge handling is verified with locally injected branding; the live Netlify deployment and physical-device FPS are not verified.

## Mission 9 construction and full mission-flow audit

Logic suite: **137/137 tests in 13 files pass**, including the complete fresh campaign, all ten missions' permanent-objective recovery, delivery ordering/consumption, duplicate claims, roof/gate placement, larger/raised shelters, atomic starter-house costs, refunds, malformed metadata, legacy saves, and live shelter checklist status. Production build and TypeScript pass.

The new mobile housing walkthrough passed: craft 24 blocks through the real batch UI, resume that actual checkpoint on the plot, inspect mission number 09, preview/build the house, open the rotated gate, physically walk through it, save/reload, resume beside Bruno and claim Home Sweet Home once. It retains 24 placed pieces, nine roof panels, saved gate state, version 1 and exactly the 150-coin mission reward. Travel checkpoints are relocated through valid saves to focus on housing; construction, gate movement/collision, inventory use and reward actions are real browser inputs.

After reviewing screenshots, corrected the indoor camera close-up by applying a housing cutaway and excluding the relevant roof/interior colliders from camera obstruction queries. Repeated final browser run: **8/8 passed** across foundation, housing, moonflower and desktop/mobile UI tests. The previous moonflower assertion expected a now-suppressed routine toast; it now checks the watered name, ready tracker and updated map objectives. No quest implementation change was needed for that test failure.

Screenshots reviewed include `/tmp/momo-house-preview.png`, `/tmp/momo-house-built.png` and `/tmp/momo-house-gate-open.png`. These validate the visible outline, house, open gate and normal camera framing. They remain software-WebGL checks, not physical-device performance measurements.

After the final name/mission-arrow clearance adjustment, the production build passed again and **3/3 browser checks passed** against the updated port-3000 preview (housing plus both quiet-HUD scenarios). The reviewed indoor screenshot shows a normal-sized player, roof/wall cutaway, open gate and unobstructed nearby name. The logic suite remains **137/137 passing**.

## Reference name plates and Monster Meadow

Final logic suite: **144/144 tests in 14 files pass**. TypeScript and the production build pass. Seven new hunting tests cover legacy squad normalization, independent combat rewards, one-time loot collection, full-bag/distance safeguards, warning/dodge/leash behavior, paused timers, save validation, respawn and area attacks without duplicate payouts. The complete ten-mission campaign remains passing.

The initial focused Chromium run passed **8/8 scenarios** across compact HUD, Monster Meadow, quiet HUD and creature squad abilities. After the final name-plate placement and duplicate sign-label fixes, the rebuilt application passed **5/5 scenarios** across Monster Meadow and quiet HUD. These include both cameras, portrait/level/live-health labels, a real touch attack and defeat, pouch collection, save/reload, active-time respawn, one nearby guide-sign label, explicit map/guide navigation and unobstructed mobile controls. The combat browser fixture resumes a valid wounded-monster checkpoint; subsequent attacks, rewards, collection, persistence and respawn use real application interactions.

Reviewed screenshots: `/tmp/momo-reference-nameplates-isometric.png`, `/tmp/momo-reference-nameplates-classic.png` and `/tmp/momo-monster-meadow.png`. Labels use native DOM text with cream plates and minimal overlap adjustment. These checks use Chromium/software WebGL; they do not establish physical-phone frame rates or verify a live Netlify deployment.

## Compact circular actions and construction dock

The logic suite remains **144/144 passing in 14 files**. The final production build, including TypeScript, passes. All **five focused browser scenarios pass across the final run and targeted rerun**: the final run passed four scenarios; its circular-action scenario measured a still-running press animation, then passed unchanged application code after the test waited for the transform to settle.

The action-dock scenario checks 320×640, 390×844, 430×932 and 844×390 layouts, round 48–60px primary controls, viewport bounds and non-overlap with joystick/inventory. It enters Build directly, verifies combat controls disappear, selects all four construction tools, changes roof height, rotates gates, resets Remove by choosing a piece, and exits/re-enters with Place selected. A fresh-game check verifies Bruno’s existing unlock still applies. The full housing scenario constructs the starter home, opens and walks through its gate, saves/reloads and claims mission 9 once. Both quiet-HUD scenarios pass with the new controls.

Initial validation found an inherited legacy button-size override; this was fixed. Existing housing and quiet-HUD expectations were updated for the shorter material label and circular shape. Screenshot review exposed low contrast during background transitions; selection colours now change immediately while retaining press motion. Reviewed screenshots include `/tmp/momo-round-actions-320.png` and `/tmp/momo-build-dock-320.png`, with larger-phone and landscape variants produced by the same scenario. These are Chromium/software-WebGL checks, not physical-phone performance measurements.

## Player sword/bow combat and monster damage

Final logic suite: **155/155 tests in 15 files pass**. Final production build, including TypeScript, passes. Eleven new weapon tests cover solo sword damage, range and stale-target fallback, companion basics beyond sword range, independent cooldowns, straight-arrow travel/collision/dodging/lifetime, once-only rewards, real tick-driven bow kills and finale progress, closest-victim retaliation, safe village recovery, menu/build suppression, old saves and malformed equipment. The original ten-mission campaign remains passing.

The initial focused Chromium run passed **8/8 scenarios** across circular action controls, existing tools/harvesting, all Monster Meadow scenarios and both new weapon scenarios. After bow-grip/help-text changes, the weapon scenarios passed again (**2/2**). The final build then passed both weapon scenarios again (**2/2**), including the new H keyboard attack shortcut. These tests use a full-health monster and no companions: the player actually loses HP, lands sword hits, switches to bow, kills with arrows, collects its pouch, saves/reloads the selected bow and switches back with G. The ranged case fires with H from about 10m, verifies only the intended monster loses 14 HP, and checks the centre switch against all other action buttons at 320px, 390px and landscape widths. Existing monster respawn, one-time rewards, old pet squads, inventory selection, harvesting and build-mode switching remain covered by the focused run and logic suite.

Screenshot review: `/tmp/momo-player-sword.png` and `/tmp/momo-player-bow.png` show readable enemy health, player damage, held weapons and the compact central switch. Browser validation uses software WebGL; it does not establish physical-phone performance or verify a live Netlify deployment. Save version remains 1, with optional validated weapon selection and no new inventory requirements.
