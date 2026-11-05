# MomoVerse

An original single-player browser creature adventure. Explore a procedural village and forest, help five villagers, collect four companions, gather, craft, build, and restore a forest passage.

## Run

Requires Node.js 24 (validated with 24.22.1) and npm 11.

```sh
npm ci
npm run dev
```

Open the development server in a browser with WebGL 2. Desktop keyboard/mouse and mobile touch controls are supported. No external credentials are required for guest play. `npm run build` creates the production build; `npm start` runs it. The cloud execution sandbox may require elevated execution for registry access, binding the server port, browser launch, and Next.js build subprocesses.

```sh
npm run typecheck
npm test
npm run test:e2e
```

Start the development server before running browser tests. See [TESTING.md](TESTING.md) for browser prerequisites and coverage.

## Play

Click the ground to move. Click a villager, creature, resource, or station to approach and interact automatically. WASD immediately overrides a click destination. Blocked routes stop with guidance rather than walking through obstacles. The default camera is raised and pulled back for a smaller character and a wider view.

WASD move; Shift sprint; Space jump; hold right mouse to rotate camera. E interacts, F gathers, I opens inventory, J journal, C creatures, M map, V companion commands, B building, Q elemental attack, and Esc pause. Left click attacks the nearby Guardian. In build mode left click places, right click removes, and holding middle mouse rotates the camera. Select hotbar slots with 1–6 or the wheel.

Start with Grandpa Moss, northwest of your spawn. Accept his mission, meet Foxy and Bruno, and return for your reward. The journal records all prerequisites and objectives. Craft at Bruno’s bench. Quest deliveries and reward claims are explicit dialogue actions.

To construct a starter shelter, leave an empty interior cell, build three surrounding walls two blocks high, cover the interior at height 2, and leave a two-block-high doorway with an unobstructed approach. At least 12 placed structural blocks are required. Extra roof/wall blocks can reach that minimum. Building blocks must attach to the ground or another block.

Guest progress autosaves to IndexedDB after transactions and every 15 seconds. Save and Quit confirms a successful checkpoint before returning to the title. Do not clear browser storage if you want to retain progress.

## Status and limits

This is an early, playable **guest-mode implementation**, not the completed production MVP. Cloud accounts, PostgreSQL/Drizzle persistence, import conflict UI, richer terrain, full animation polish, and comprehensive cross-browser/performance qualification remain unfinished. Character reference images were not attached; the current character is an original procedural approximation based on the written description.

See [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md), [GAME_DESIGN.md](GAME_DESIGN.md), and [ARCHITECTURE.md](ARCHITECTURE.md). The approved source specification is preserved in [docs/MOMOVERSE_SPEC.md](docs/MOMOVERSE_SPEC.md).

## Player help and equipment

Hover or keyboard-focus the active adventure card for step-by-step help. Gold numbered markers on the minimap and full map show unfinished mission destinations; select a marker on the full map for instructions. Completed objectives disappear and a ready-to-claim mission points back to its NPC.

In the creature collection (C), choose **View creature card** for an original collectible-style reference with a rotating 3D model, current stats, attacks, exploration utility, and befriending information.

Select an owned item on the hotbar (1–6) to hold its 3D model. Mining and gathering play different actions with target impacts and pickup particles. Unowned ghost slots leave the hand empty.

## Mobile controls

The left joystick moves the character; drag the world to rotate the camera, or tap the ground to move to it. Use Jump, Interact / Gather, Attack, and Ability on the right. Run toggles sprint; Pet opens companion commands; Build toggles construction. In building mode choose Place or Remove, then tap a block or the housing plot. Joystick release/cancellation, menus, backgrounding, and orientation changes clear held inputs.

Tasks and the minimap start minimized on small/touch screens. Use Tasks/Map to expand them and the minus buttons to minimize them again; this preference is remembered on the browser. The bottom menu opens inventory, journal, creatures, and full map. Touch devices default to low graphics unless a quality preference was already saved. Portrait and landscape layouts include safe-area spacing. Physical Android/iOS performance and Safari compatibility still need device qualification; current touch validation uses Chromium mobile emulation.

## Crafting batches

Each recipe has a batch slider, number input, and Max button. The recipe shows total ingredients and total output before you craft. Wooden blocks make two per batch: six batches consume six wood and produce twelve blocks. Max considers both materials and inventory space, up to 99 batches per transaction. A failed batch consumes no ingredients.

## River and bridge

The river has an actual shallow bed, sloping banks, animated surface ripples, shoreline highlights and a moving-player wake. Entering the water reduces movement speed and applies buoyancy/vertical drag; jump or walk up a bank to leave. The wooden bridge arches upward through individual planks with matching collision surfaces and curved railings. Aquabub waits on the dry eastern riverbank beyond the bridge. River fruit and stone deposits are on the banks, clear of the water and walkway.
