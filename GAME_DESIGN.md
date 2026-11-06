# Game design

The approved [master specification](docs/MOMOVERSE_SPEC.md) is the source of truth. This document distinguishes implemented behavior from future requirements.

## Implemented guest loop

Explore → meet villagers → accept missions → gather → craft → befriend → use companion utilities → construct shelter → repair passage → resolve Guardian → claim finale reward.

- Single-player, desktop keyboard/mouse plus mobile joystick/touch controls, original procedural characters and environment. Mobile controls extend the original desktop-only brief at the user’s request.
- Bounded 256 × 256 world, with village and forest content concentrated around the spawn.
- Five named NPCs; ten data-driven missions; four original species; up to three equipped companions with one directly commanded.
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
- Q uses the first creature ability; Shift+E preserves interaction while adding the second ability; R uses the ultimate.
- Shelter validation currently recognizes a minimal one-cell interior with headroom, three solid neighboring walls, a roof, an open doorway, and a clear approach. Larger arbitrary floorplans require expanded validation.

## Required work still outstanding

Supabase accounts; PostgreSQL/Drizzle cloud persistence and server transaction validation; guest import and cloud revision conflicts; richer topography/chunk meshing; more expressive action animation and companion navigation; more distinct environmental audio; final celebration staging; broader cosmetic customization; cross-browser and measured performance targets.

No multiplayer, unrestricted excavation, additional regions, evolution, real-money purchases, or cryptocurrency is included in the MVP.

## Creature Squad and Abilities

Equip up to three collected creatures using Squad management (Tab by default, or the HUD shortcut / collection menu). One creature is commanded; others follow and assist. Z/X cycles healthy equipped companions, with a two-second switch cooldown. Collection Summon remains available; a full squad replaces an AI member to make room. Workers are excluded by a reserved assignment guard; settlement jobs do not exist in this phase.

| Creature | Role / passive | Q (level 1) | E (level 5) | R (level 10) |
| --- | --- | --- | --- | --- |
| Emberfox | Mage; Warmth adds 10% damage near a fire area | Fireball | Flame Trail, three-second area | Meteor Burst after 0.8s warning |
| Aquabub | Support; Refresh adds 10% healing nearby | Water Bolt | Healing Bubble, lowest relative HP living ally | Directional Tidal Wave, damage and push |
| Mosshell | Tank; Stone Skin reduces received damage by 20% | Rock Smash, attention control | Stone Shield, six-second squad/player shields | Earthquake, area damage and two-second stun |
| Zaplet | Fighter; attacks build up to three temporary bonus damage | Spark Dash, movement toward target | Chain Lightning to nearby hostiles | Thunderstorm, four-second area |

Definitions, power, range, radius, animation/status, charge cost and timing live in `src/game/squad.ts`. Existing elemental advantages still apply. Basic attacks have a 1.5-second cooldown; Q 5s, E 10s, R 45s. Successful basics give 5 charge; Q/E give 10; defeats give 15, clamped at 100. R requires 100 and resets charge to zero. Cooldowns and charge belong to the creature and survive switching, unequipping and reload. Healing does not revive defeated companions; the existing village station still heals everyone for free.

The second ability defaults to Shift+E to preserve E/F interaction. Q, Shift+E, R, squad and cycle keys are configurable through Settings; choices are unique and reserve movement and interaction bindings. All abilities have clickable HUD buttons, including mobile. Menus/dialogue, inactive play and hidden tabs stop combat and timers.

AI uses defensive (respond within 8 units), aggressive (engage within 12) or passive stances; follow, stay, focus and retreat orders. Critical HP triggers retreat. Support heals, tanks shield and draw attacks, and offensive companions use unlocked area attacks. AI never uses ultimates. It only attacks the Guardian or explicitly focused practice targets. Existing neutral collectible creatures and NPCs cannot be combat targets. Followers use the existing collision controller, formation positions, grounded gait, a 20-unit leash and 30-unit/stuck recovery.

Three stationary practice targets south of the fountain grant creature training XP (5 per basic, 10 per ability), regenerate after defeat, and grant no coins or original quest rewards. This supplies repeatable training and multiple targets without introducing a later-phase encounter system. Guardian rewards and the original mission event are awarded once.

Adaptation to this repository: area effects use bounded patches at the target point; the world has a single real hostile, so chains and area coverage can also be tested against the practice targets. The existing level curve/cap (10) is retained for Phase 1; the specification's broader level-25 progression remains future work. No settlement, jobs, invasions, territory, new regions or expansion questlines are implemented here.
