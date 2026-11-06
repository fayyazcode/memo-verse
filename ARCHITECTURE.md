# Architecture

## Runtime

Next.js App Router renders the application shell. A client-only dynamic import loads React Three Fiber and the Rapier scene, so WebGL and physics never run during server rendering. The application currently has no backend routes or authentication.

- `src/components/World.tsx`: scene, instanced terrain/scenery, static colliders, player capsule, camera obstruction raycasts, resource visuals, companion, and building interaction.
- `src/components/Character.tsx`: replaceable original procedural character and species models, locomotion and action poses.
- `src/components/Game.tsx`: title, HUD, accessible native menu controls, dialogue, inventory, journal, map, crafting, shop, settings, and input lifecycle.
- `src/game/data.ts`: stable content IDs, items, recipes, creatures, NPCs, missions, and world placements.
- `src/game/rules.ts`: pure inventory transactions, progression, elemental rules, placement and shelter validation.
- `src/game/store.ts`: gameplay state transitions, quest event projection, transaction actions, IndexedDB validation and checkpoint queue.
- `src/game/input.ts`: transient keys, camera orientation, and render-time player animation data.
- `src/game/audio.ts`: user-gesture-started procedural sounds and quiet ambient tone.

Rapier steps at 60 Hz. Controller velocity and camera updates run in the render loop. Observable player position and gameplay timers update at approximately 10 Hz. High-frequency input/camera data bypasses React state. Terrain and repeated distant forest meshes use instancing. The initial terrain is flat, bounded, and contains fixed village/forest content; it is not a streaming, editable terrain engine.

## Rules and events

Quest objectives consume typed-by-content event names (`talk`, `gather`, `craft`, `befriend`, `ability`, `discover`, `deliver`, `repair`, `defeat`, `shelter`). Counts clamp to the objective requirement. Reward claims validate readiness and current status. Transactions calculate a new inventory before committing, so missing ingredients or insufficient capacity cannot partially consume resources.

This is client-authoritative guest simulation. These checks provide gameplay consistency, **not online anti-cheat guarantees**. A future server must own authenticated transactions, reconstruct valid progression, enforce costs/prerequisites, and reject replayed commands. Accepting arbitrary client snapshots is insufficient.

## Persistence

IndexedDB database `momoverse`, object store `saves`, key `adventure`, schema version 1. Writes are queued and use an atomic read/write transaction with an expected revision. Another session's revision causes an explicit conflict instead of overwriting it. New-game replacement is an explicit title-screen confirmation. Save and Quit exits only after successful persistence.

Version 1 is the initial format. Unknown versions are rejected and preserved; historical migrations do not exist yet. Browser settings use localStorage. Processes do not survive cloud snapshots; restart the server for each new environment session.

## Asset strategy

All current meshes, materials, icons, and sounds are locally generated or supplied by installed packages. No external font, model, audio, or texture service is required at runtime. A future GLB model can replace Character/CreatureModel without changing game rules. The two referenced character images remain unavailable.

## Guidance and visual equipment

`src/game/guidance.ts` projects active mission state into objective hints and world destinations without mutating progression. `CreaturePortrait` supplies original species illustrations; the lazy `CreaturePreview` renders the same improved `CreatureModel` used in-world and reports first-frame readiness. `HeldItem` renders owned hotbar selections at the character’s hand. Mining/picking intent and pickup effects are transient `playerRuntime` data, while inventory transactions and node eligibility remain in the game store. Menus use demand-driven world rendering; the separate pet preview continues animating.

## Touch input

`src/game/touch.ts` holds transient analog movement, jump/sprint/build mode, and camera gesture state. `TouchControls` owns pointer capture and lifecycle cleanup. The physics controller consumes analog input through the same camera-relative movement path as WASD. Touch world actions occur on release, while drags rotate the camera and suppress navigation/building taps. HUD collapse preferences live separately in localStorage and do not change saved adventures.

## River simulation and crossing

`src/game/river.ts` defines shared river bounds, mean water level, bed elevation, arch height and shallow-water movement response. Terrain tiles split at river boundaries and render the depressed bed; compound colliders and bank ramps match it. `RiverWater` renders local shader waves and shimmer plus player ripples. `ArchedBridge` creates tilted planks and railings with matching colliders. `src/game/crafting.ts` plans bounded batch transactions and computes Max without assuming inventory capacity is monotonic after consuming ingredients.

## Companion locomotion and appearance

The active companion uses a kinematic Rapier character controller, gravity, snap-to-ground and autostep, with sensor geometry to avoid obstructing the player. Actual corrected travel drives `companionRuntime` speed/distance for articulated foot cycles in `CreatureModel`. `appearance.ts` defines gait/attack poses, outfit palettes and separate mobile zoom selection. Browser settings retain skin and mobile distance without changing the adventure save schema. `AttackEffects` renders transient swings/projectiles while the game store continues validating damage and cooldowns.
