# Game design

The approved [master specification](docs/MOMOVERSE_SPEC.md) is the source of truth. This document distinguishes implemented behavior from future requirements.

## Implemented guest loop

Explore → meet villagers → accept missions → gather → craft → befriend → use companion utilities → construct shelter → repair passage → resolve Guardian → claim finale reward.

- Single-player, desktop keyboard/mouse plus mobile joystick/touch controls, original procedural characters and environment. Mobile controls extend the original desktop-only brief at the user’s request.
- Bounded 256 × 256 world, with village and forest content concentrated around the spawn.
- Five named NPCs; ten data-driven missions; four original species; one active companion.
- 24 inventory slots, 99-unit material stacks, six hotbar references (not extra inventory).
- Initial 50 coins; prices, recipes, XP thresholds, and mission rewards follow the specification.
- Levels 1–10; lifetime XP is retained, capped level progress displays MAX.
- Gathering counts resources collected after accepting a mission. Deliveries consume inventory. Discovery and collection objectives recognize existing accomplishments.
- Quest rewards and Guardian rewards can be claimed once. Optional missions remain after the finale.
- Combat has basic and elemental attacks, cooldowns, health, telegraphed retaliation, and free village healing. Defeat preserves inventory and quests.
- Construction is limited to a 16 × 16 plot and eight-block height. Only player blocks are removable. Full inventory prevents removal rather than destroying material.
- Local saves include node respawn times, construction, progression, creature health, claims, and player position. Menus and hidden tabs pause simulation.

## Resolved design gaps

- Missions 06 and 10 unlock after Mission 03.
- Mission 02 unlocks basic tools, blocks, treats, and refined stone recipes. Mission 03 unlocks Emberfox-assisted processed wood. Mission 08 unlocks lamps, Mission 09 stools, and Mission 04 statues.
- Ordinary ore, crystals, and charged fragments require a pickaxe, never the companion they help befriend.
- First befriended companion follows immediately. Complete Mission 03 to access the command menu.
- Hotbar selection assigns an inventory item reference; it does not duplicate items.
- Lamp lights toggle through nearby interaction and persist their state.
- In build mode middle-mouse dragging controls the camera because right click removes blocks.
- Q is an additional elemental-attack shortcut.
- Shelter validation currently recognizes a minimal one-cell interior with headroom, three solid neighboring walls, a roof, an open doorway, and a clear approach. Larger arbitrary floorplans require expanded validation.

## Required work still outstanding

Supabase accounts; PostgreSQL/Drizzle cloud persistence and server transaction validation; guest import and cloud revision conflicts; richer topography/chunk meshing; more expressive action animation and companion navigation; more distinct environmental audio; final celebration staging; cosmetic customization; cross-browser and measured performance targets.

No multiplayer, unrestricted excavation, additional regions, evolution, real-money purchases, or cryptocurrency is included in the MVP.
