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

WASD move; Shift sprint; Space jump; hold right mouse to rotate camera. E interacts, F gathers, I opens inventory, J journal, C creatures, M map, V companion commands, B building, Q first ability, Shift+E second ability, R ultimate, Tab squad management, Z/X companion switching, and Esc pause. Left click attacks the nearby Guardian. In build mode left click places, right click removes, and holding middle mouse rotates the camera. Select hotbar slots with 1–6 or the wheel.

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

## Outfits, companion movement and attacks

Settings → Your outfit offers five free hoodie/accessory looks, remembered on this browser. Mobile has its own camera-distance slider (default 17 versus desktop 13) for a smaller on-screen player.

Companions now use collision-aware ground following, smooth acceleration/turning, articulated distance-driven walk cycles and an idle/rest pose. Stay stops locomotion; stuck or distant companions retain a safe catch-up teleport. Attacking plays the player's swing and a healthy companion's lunge/effect; practice swings outside an encounter grant no damage, loot or quest credit. Combat range, health and cooldown validation still apply.

## Camera perspectives

The mobile Classic / Isometric button switches between the existing raised follow camera and a high diagonal orthographic camera based on the supplied reference screenshot. Isometric keeps parallel lines, a fixed elevated angle and a smaller player with more surroundings visible. Drag sideways to rotate; joystick movement follows the camera direction and tapping the world still moves or interacts.

Settings → Camera perspective provides the same choice on desktop and mobile. Isometric world view size controls zoom (larger values show more world). The view and zoom are remembered in this browser.

## Living World — Phase 1

Equip up to three collected creatures, command one and let the others assist. The squad menu shows roles, ability unlocks, health, friendship and membership. The HUD shows cooldowns and ultimate charge, with clickable ability controls on mobile. Train against the three practice targets south of the village fountain; they grant creature XP but no coins or original mission rewards. Original utility interactions still use E/F or a click.

The Living World reference is in [docs/LIVING_WORLD_SPEC.md](docs/LIVING_WORLD_SPEC.md). The [integration audit](EXPANSION_PLAN.md), [ability rules](GAME_DESIGN.md) and [save compatibility notes](SAVE_MIGRATION.md) describe this phase. Phase 2 and later expansion systems remain unimplemented.

## Compact HUD and side menu

Use **Menu** for backpack, journal, collection, squad, commands, camera selection, building, map and settings. Mobile pet details are collapsed by default: tap the pet summary or blue **Ability** button for cooldowns, spells and squad switching. Combat controls remain beside the joystick; building mode replaces them with placement controls. Settings → Interface size offers 90%, 100%, 115% and 130% text scaling. Track a mission in the journal or cycle active missions from the gold tracker. See [UI_REDESIGN.md](UI_REDESIGN.md).

## Building your mission 9 home

Accept **Home Sweet Home** from Bruno before crafting its required blocks. At Bruno’s bench, craft 24 wooden blocks from 12 wood for the starter design. Go to your homestead, open **Menu → Build at your homestead**, choose **Starter home**, review the outline and cost, then build. It includes walls, a roof and an openable gate.

For your own design, select **Wall**, **Roof** or **Gate**. Roof height defaults to 2; stack walls two blocks high first. Gate floor defaults to ground level and can be changed for raised floors. Gates open with E, a click, or the mobile Open button. A clear open doorway also counts, so older homes do not need a gate retrofit. Larger roofed rooms and raised floors are supported. Return to Bruno when the tracker shows a reward. See [the ten-mission audit](MISSION_AUDIT.md) for flow checks and recovery behaviour.
