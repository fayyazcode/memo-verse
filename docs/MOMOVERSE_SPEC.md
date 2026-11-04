# MOMOVERSE — COMPLETE CODEX DEVELOPMENT MASTER PROMPT
**Version:** 1.0
**Project Type:** Browser-Based 3D Sandbox Creature Adventure
**Development Agent:** OpenAI Codex
**Implementation Language:** TypeScript
**Target:** Complete playable single-player MVP

---

# 0. YOUR ROLE AND EXECUTION RULES

You are the lead game developer, technical architect, gameplay designer, 3D environment developer, UI engineer, and QA engineer for MomoVerse.

Your assignment is to **build the actual playable game**, not simply describe it.

You are responsible for:
- Architecture and project setup
- 3D world implementation
- Character controller and animations
- NPC interactions and dialogue
- Quest progression
- Creature collection and behavior
- Combat
- Gathering and crafting
- Building
- Inventory and economy
- Persistence
- Game UI
- Testing and performance optimization

## Mandatory execution rules

1. Inspect the repository before changing anything.
2. Preserve useful existing code when applicable.
3. Create a runnable Next.js and TypeScript application if the repository is empty.
4. Implement gameplay in logical, testable phases.
5. Keep the application runnable after every completed phase.
6. Do not create fake functionality or decorative buttons.
7. Do not replace required gameplay with written explanations.
8. Do not claim tests passed unless they were executed.
9. Use original assets and creature designs.
10. Make reasonable implementation decisions without repeatedly requesting approval.
11. Document any unavoidable limitations.
12. Do not silently remove required MVP features.
13. When an external dependency is unavailable, provide a functional local alternative where feasible.
14. Treat this specification as the source of truth.

**Definition of complete:** A player can open the browser game, explore a 3D world, interact with NPCs, complete ten missions, collect four creatures, fight basic encounters, gather resources, craft items, build a shelter, earn rewards, and save progress.

---

# 1. GAME IDENTITY

## Game name
MomoVerse

## Genre
3D Open-World Sandbox + Creature Collection + Adventure RPG

## Inspirations

**Minecraft**
- Voxel landscapes
- Resource gathering
- Crafting
- Block-based construction
- Exploration

**Pokémon**
- Creature discovery
- Creature companionship
- Leveling
- Elemental abilities
- Creature-based combat

**Adventure RPG**
- NPC conversations
- Story missions
- Exploration challenges
- Character progression
- Unlockable rewards

These are references for gameplay mechanics only. Do not reproduce copyrighted characters, textures, music, maps, or distinctive branded assets.

## Visual identity

Use a hybrid style:
- Block-based voxel terrain
- Smooth cartoon 3D characters
- Colorful fantasy environments
- Soft lighting
- Expressive creatures
- Cozy village atmosphere
- Slightly mysterious forests and caves

## Camera
Third-person with smooth follow and mouse rotation.

## Platform
Desktop web browser.

## Game mode
Single-player.

## Target session
30–45 minutes for the introductory adventure.

After the main adventure, players can continue gathering, crafting, building, and exploring.

---

# 2. MAIN CHARACTER

The user has provided two images showing the main green creature.

Use these images as the primary visual reference.

## Character appearance

- Bright green rounded body
- Long pointed ears
- Large glossy black eyes
- Small visible fangs
- Short arms and legs
- Cute, mischievous personality
- Oversized hoodie or similar clothing

The character must remain recognizable.

## 3D asset strategy

If a production-quality model cannot be generated automatically:

1. Create an original stylized 3D approximation using Three.js geometry.
2. Preserve the distinctive silhouette.
3. Use separate meshes for ears, eyes, body, limbs, and clothing.
4. Implement procedural animation.
5. Structure the asset system so the procedural character can later be replaced with a GLB model.

Do not block development waiting for an external 3D asset.

## Animation states

Required:
- Idle
- Walk
- Run
- Jump
- Fall
- Land
- Interact
- Gather
- Celebrate

Animations should transition smoothly.

---

# 3. WORLD DESIGN

## World size

Create a bounded, handcrafted starter world measuring approximately 256 × 256 world units.

Use a consistent coordinate system:
- X/Z: horizontal world coordinates
- Y: elevation
- Ground-level blocks: 1 × 1 × 1 world units

The world must contain two connected playable regions.

## Region A — Momo Village

Approximate center: X=0, Z=0.

Include:
- Central village square
- Five NPC locations
- Merchant shop
- Crafting workshop
- Creature research station
- Companion healing station
- Player housing plot
- Quest board
- Village exit
- Forest path

## Region B — Greenwood Forest

Approximate center: X=70, Z=30.

Include:
- Gatherable trees
- Stone deposits
- Berry bushes
- Plant fiber
- Ore deposits
- Crystal deposits
- Four creature habitats
- Small river
- Marked plants
- Electrical puzzle device
- Tough resource nodes
- Hostile encounters
- Hidden exploration landmark
- Broken forest passage

## Housing plot

Place the housing plot near the village.

Rules:
- 16 × 16 horizontal blocks
- Maximum building height: 8 blocks
- Grid-snapped placement
- Protected village structures cannot be edited
- Only player-placed blocks can be removed

## World boundaries

Prevent players from leaving the playable area.

If the player falls outside the world or becomes stuck, return them to the most recent safe position.

## Environment

Implement:
- Day/night visual cycle
- Trees and vegetation
- Paths
- Water surfaces
- Ambient audio
- Basic shadows
- Distance fog
- Resource interaction indicators
- Simple environmental animations

The day/night cycle must not prevent quest completion.

---

# 4. PLAYER CONTROLS

| Input | Action |
|---|---|
| W/A/S/D | Movement |
| Shift | Sprint |
| Space | Jump |
| Hold right mouse | Rotate camera |
| E | Interact |
| F | Gather / use object |
| I | Inventory |
| J | Quest journal |
| C | Creature collection |
| M | Map |
| B | Toggle building mode |
| V | Companion commands |
| 1–6 | Select hotbar slot |
| Mouse wheel | Cycle hotbar |
| Left click | Use tool / target / attack command |
| Right click in build mode | Remove player block |
| Esc | Pause |

## Movement rules

- Walking speed: 4 world units/second
- Sprinting speed: 7 world units/second
- Jump height: approximately 1.5 blocks
- No sprint stamina
- No hunger system
- No equipment durability
- No item loss on defeat

Movement must use physics-based collision.

The player cannot walk through buildings, NPCs, or large terrain objects.

## Camera

- Smooth third-person follow
- Adjustable mouse sensitivity
- Camera collision/obstruction handling
- Adjustable camera distance
- Reduced-motion setting

Menus and dialogue must suppress gameplay inputs.

---

# 5. NPC DESIGN

Create exactly five primary NPCs.

## NPC 1 — Grandpa Moss

**Role:** Village elder
**Location:** Village square
**Personality:** Wise, gentle, humorous
**Purpose:** Tutorial and main story

Interactions:
- Welcome the player
- Explain the village
- Introduce the forest
- Assign main missions
- Deliver final story dialogue

## NPC 2 — Foxy

**Role:** Merchant
**Location:** Village shop
**Personality:** Clever, energetic, playful
**Purpose:** Buying and selling

Interactions:
- Open shop
- Buy common resources
- Sell basic supplies
- Assign delivery side quest

## NPC 3 — Bloop

**Role:** Forest wizard
**Location:** Village forest entrance
**Personality:** Strange, enthusiastic, mysterious
**Purpose:** Elemental puzzles and exploration

Interactions:
- Explain creature abilities
- Assign exploration quest
- Help unlock forest passage

## NPC 4 — Luna

**Role:** Creature researcher
**Location:** Research station
**Personality:** Curious, friendly, intelligent
**Purpose:** Creature collection

Interactions:
- Teach befriending
- Assign creature missions
- Explain creature leveling
- Provide creature-related rewards

## NPC 5 — Bruno

**Role:** Builder and craftsman
**Location:** Workshop
**Personality:** Practical, cheerful, hardworking
**Purpose:** Crafting and construction

Interactions:
- Explain crafting
- Assign building mission
- Unlock building recipes
- Help repair the forest passage

## NPC implementation rules

Every NPC must:
- Exist physically in the world
- Have an interaction radius of approximately 2.5 units
- Display an interaction prompt
- Support dialogue
- Have branching responses where appropriate
- Respond differently based on quest progress
- Remain accessible when needed for progression

Use data-driven dialogue trees.

---

# 6. TEN-MISSION CAMPAIGN

Implement exactly ten primary MVP missions.

The missions form a connected introductory adventure.

## Mission 01 — Welcome to MomoVerse

**NPC:** Grandpa Moss
**Category:** Main story

Objectives:
1. Talk to Grandpa Moss.
2. Visit the village square.
3. Speak with Foxy and Bruno.
4. Return to Grandpa Moss.

Reward:
- 50 coins
- 40 XP

Unlock:
- Mission 02
- Basic gathering

## Mission 02 — The Forest Supplies

**NPC:** Grandpa Moss
**Category:** Main story

Objectives:
1. Gather 8 wood.
2. Gather 6 stone.
3. Gather 4 plant fiber.
4. Deliver resources to Bruno.

Reward:
- 100 coins
- 80 XP
- Basic tool recipe

Unlock:
- Crafting tutorial
- Mission 03
- Missions 05 and 09

## Mission 03 — A New Friend

**NPC:** Luna
**Category:** Main story

Objectives:
1. Gather 3 berries.
2. Craft 1 warm berry treat.
3. Find Emberfox.
4. Befriend Emberfox.
5. Return to Luna.

Reward:
- 120 coins
- 100 XP
- Companion whistle

Unlock:
- Companion commands
- Mission 04
- Missions 07 and 08

## Mission 04 — The Broken Passage

**NPC:** Grandpa Moss
**Category:** Main story / Finale

Prerequisites:
- Missions 01, 02, 03, 07, 08, and 09 completed.
- Missions 05, 06, and 10 remain optional.

Objectives:
1. Speak with Bloop.
2. Gather 6 processed wood and 4 refined stone.
3. Activate the forest electrical switch using Zaplet.
4. Use Mosshell to clear the blocked passage.
5. Repair the passage at the marked construction point.
6. Resolve the final hostile creature encounter.
7. Return to Grandpa Moss.

Reward:
- 500 coins
- 250 XP
- Forest Guardian badge
- Decorative village statue recipe

Finale:
- Play a short celebration animation.
- Show the village thanking the player.
- Display an adventure-complete message.
- Keep free exploration available.

## Mission 05 — Foxy's Delivery

**NPC:** Foxy
**Category:** Side quest

Objectives:
1. Collect a delivery parcel from Foxy.
2. Deliver it to Bloop.
3. Return to Foxy.

Reward:
- 90 coins
- 50 XP

## Mission 06 — The Missing Crystals

**NPC:** Bloop
**Category:** Side quest

Objectives:
1. Find the marked crystal clearing.
2. Collect 5 crystals.
3. Deliver crystals to Bloop.

Reward:
- 130 coins
- 75 XP

## Mission 07 — Friends of the Forest

**NPC:** Luna
**Category:** Creature quest

Objectives:
1. Befriend Aquabub using river fruit.
2. Befriend Mosshell using a mineral snack.
3. Use Aquabub to water a marked plant.
4. Use Mosshell to break a tough node.

Reward:
- 180 coins
- 120 XP
- Companion friendship bonus

## Mission 08 — The Spark of Adventure

**NPC:** Luna
**Category:** Creature quest

Objectives:
1. Gather charged crystal fragments.
2. Craft a charged treat.
3. Befriend Zaplet.
4. Activate the practice power device.

Reward:
- 200 coins
- 130 XP
- Electrical crafting recipe

## Mission 09 — Home Sweet Home

**NPC:** Bruno
**Category:** Building quest

Objectives:
1. Enter the housing plot.
2. Craft 12 wooden building blocks.
3. Place at least 12 blocks.
4. Create a simple shelter with a valid roof and doorway.
5. Return to Bruno.

Reward:
- 150 coins
- 100 XP
- Decorative furniture recipe

Shelter validation must use actual placed blocks, not just a manually incremented counter.

## Mission 10 — Hidden Forest Secrets

**NPC:** Bloop
**Category:** Exploration quest

Objectives:
1. Discover three marked forest landmarks.
2. Open the hidden treasure chest.
3. Return to Bloop.

Reward:
- 175 coins
- 90 XP
- Explorer badge

## Quest rules

- Missions must have unique IDs.
- Quest progression must be event-driven.
- Objectives must update automatically.
- Reward claims must be idempotent.
- Deliveries consume required items.
- Gathering objectives count newly collected items.
- Required quest items must remain obtainable.
- Mission prerequisites must be enforced.
- No quest should become permanently impossible.
- The journal must display active objectives and progress.

---

# 7. CREATURE SYSTEM

Create four original collectible species.

## Emberfox

Element: Fire
Habitat: Warm forest clearing
Befriending item: Warm berry treat

Abilities:
- Basic fire attack
- Smelting assistance

## Aquabub

Element: Water
Habitat: Riverbank
Befriending item: River fruit

Abilities:
- Basic water attack
- Water marked plants

## Mosshell

Element: Earth
Habitat: Rocky forest area
Befriending item: Mineral snack

Abilities:
- Basic earth attack
- Break tough resource nodes

## Zaplet

Element: Electric
Habitat: Crystal grove
Befriending item: Charged treat

Abilities:
- Basic electric attack
- Activate marked power devices

## Collection rules

- One of each species can be collected.
- Befriending succeeds when requirements are met.
- Required food is consumed on success.
- Only one companion is active.
- Companions follow the player.
- Companions can be commanded to stay.
- Companions can use abilities on valid targets.
- Companions can be recalled.
- Stuck companions teleport safely near the player.

## Levels

Creature levels: 1–10.

XP required to reach the next level:

100 × current level.

## Friendship

Friendship range: 0–100.

- Feeding: +5
- Completing a relevant activity: +3
- Completing a creature mission: +10

Clamp values at 100.

Friendship does not decrease in the MVP.

---

# 8. COMBAT

Use simple real-time companion combat.

## Player health

Base health: 100.

Each player level above 1 adds 5 maximum health.

## Companion combat

Each companion has:
- Basic attack
- Elemental ability
- Health
- Cooldowns
- Attack range
- Target selection

Suggested initial values:
- Basic attack: 10 damage
- Elemental ability: 18 damage
- Basic attack cooldown: 1.5 seconds
- Ability cooldown: 6 seconds
- Basic attack range: 5 units

## Elemental rules

- Fire beats Earth
- Earth beats Electric
- Electric beats Water
- Water beats Fire

Advantage multiplier: 1.25.

Disadvantage multiplier: 0.8.

Neutral multiplier: 1.0.

## Enemy behavior

Hostile creatures:
- Patrol a limited area
- Detect nearby players
- Telegraph attacks
- Attack within range
- Return to their spawn area when disengaged
- Drop loot on defeat

## Defeat rules

Player defeat:
- Respawn at village
- Restore health
- Preserve inventory
- Preserve quest progress

Companion defeat:
- Companion becomes unavailable
- Recover at village healing station
- Recovery is free

Combat rewards must not be granted multiple times for the same encounter.

---

# 9. INVENTORY SYSTEM

## Inventory capacity

24 inventory slots.

## Hotbar

6 slots.

## Stack limits

- Materials: 99
- Food: 99
- Building blocks: 99
- Tools: 1 per slot

## Quest pouch

Quest-critical items are stored separately and do not occupy normal inventory slots.

## Inventory behavior

- Reject collection when inventory is full.
- Display clear feedback.
- Never silently discard items.
- Validate item quantities before transactions.
- Prevent negative quantities.
- Support moving items between inventory and hotbar.

---

# 10. RESOURCES

Initial resources:

| Resource | Typical source | Respawn |
|---|---|---|
| Wood | Trees | 3 active-play minutes |
| Stone | Rock nodes | 3 minutes |
| Berries | Bushes | 2 minutes |
| Plant fiber | Plants | 2 minutes |
| Ore | Mineral nodes | 5 minutes |
| Crystals | Crystal nodes | 5 minutes |

Additional special items:
- River fruit
- Charged crystal fragments
- Quest parcels

Resource respawn timers advance only during active gameplay.

Nodes required for progression must regenerate reliably.

---

# 11. CRAFTING

Implement fixed recipes at crafting stations.

## Initial recipes

| Item | Ingredients | Output |
|---|---|---|
| Warm berry treat | 3 berries + 1 fiber | 1 |
| Mineral snack | 2 stone + 1 berry | 1 |
| Charged treat | 2 charged fragments + 1 berry | 1 |
| Basic pickaxe | 3 wood + 2 stone | 1 |
| Wooden block | 1 wood | 2 |
| Processed wood | 2 wood | 1 |
| Refined stone | 2 stone + 1 ore | 1 |
| Decorative lamp | 1 crystal + 2 wood | 1 |

Processed wood requires Emberfox's smelting assistance.

Define recipe unlock conditions.

Crafting must:
- Check ingredients
- Check output capacity
- Consume ingredients atomically
- Grant output
- Update quests
- Save progression

---

# 12. BUILDING SYSTEM

Building is allowed only within the designated housing plot.

## Rules

- 16 × 16 horizontal grid
- Maximum height: 8 blocks
- Grid-aligned placement
- Protected structures cannot be modified
- No collision with player or NPCs
- Materials consumed when placed
- Player blocks removable
- Materials returned on removal when space exists

## Shelter validation

A valid starter shelter requires:
- At least 12 player-placed blocks
- An enclosed usable interior
- A roof covering the interior
- An accessible doorway
- No overlapping invalid placements

Create a deterministic validation function with automated tests.

Building state must persist.

---

# 13. ECONOMY

Currency: Coins.

## Starting balance

50 coins.

## Shop prices

| Item | Buy price | Sell price |
|---|---:|---:|
| Wood | 10 | 4 |
| Stone | 10 | 4 |
| Berries | 8 | 3 |
| Plant fiber | 8 | 3 |
| Ore | 25 | 10 |
| Crystals | 35 | 14 |
| Basic pickaxe | 80 | 30 |
| Warm berry treat | 30 | 12 |

Selling is available only for defined sellable items.

Quest-critical items cannot be sold.

Shop transactions must be validated.

Do not implement real-money purchases or cryptocurrency.

---

# 14. PLAYER PROGRESSION

Player levels: 1–10.

XP required for next level:

100 × current level.

Player progression unlocks:
- Recipes
- Minor health increases
- Cosmetic rewards
- Quest access where specified

Leveling must:
- Handle multiple level-ups from one reward
- Respect level cap
- Preserve excess XP appropriately
- Update maximum health
- Trigger feedback

---

# 15. SAVE SYSTEM

## Guest mode

Guest players can start without registration.

Use IndexedDB for persistent browser saves.

## Account mode

Use:
- Supabase Auth
- PostgreSQL
- Drizzle ORM

Account saves are stored remotely.

## Required saved state

- Player position
- Health
- Level
- XP
- Coins
- Inventory
- Hotbar
- Quest state
- Reward claims
- Collected creatures
- Creature levels
- Creature friendship
- Active companion
- Resource node states
- Building placements
- Unlocked recipes
- World progression

## Save behavior

Save after:
- Quest completion
- Reward claiming
- Purchases
- Crafting
- Befriending
- Building changes
- Periodic checkpoints

Provide Save and Quit.

Use versioned save schemas.

## Guest-to-account import

- Never overwrite cloud data silently.
- Show explicit import confirmation.
- Detect existing account progress.
- Offer a clear conflict choice.
- Validate imported data before saving.

## Concurrent sessions

Use save revision numbers.

Reject conflicting writes and show a clear message.

Server operations must validate reward claims, inventory costs, and quest prerequisites.

---

# 16. USER INTERFACE

Create a polished fantasy adventure game interface.

## HUD

Include:
- Player health
- Player level
- XP bar
- Coins
- Active quest
- Companion status
- Minimap
- Hotbar
- Interaction prompts

## Menus

Include:
- Main menu
- New game / Continue
- Inventory
- Quest journal
- Creature collection
- Crafting
- Shop
- Map
- Settings
- Pause
- Save and Quit

## UI requirements

- Clear readable typography
- Consistent visual language
- Responsive layout
- Real button functionality
- Smooth transitions
- Clear error feedback
- Keyboard navigation where practical

Audio must begin only after user interaction.

Settings:
- Music volume
- Effects volume
- Mouse sensitivity
- Graphics quality
- Reduced camera motion

---

# 17. AUDIO

Implement:
- Ambient forest audio
- Village ambience
- Footsteps
- Jump/landing
- Gathering
- Crafting
- Quest completion
- Creature interaction
- Combat feedback
- Menu interactions

Use original or appropriately licensed audio.

If audio assets are unavailable, use simple procedural sounds where practical.

Do not block gameplay because an audio file is missing.

---

# 18. TECHNICAL ARCHITECTURE

Use:

- Next.js
- React
- TypeScript
- Three.js
- React Three Fiber
- Rapier
- Zustand
- PostgreSQL
- Drizzle ORM
- Supabase Auth
- IndexedDB

## Suggested directory structure

src/
  app/
    page.tsx
    game/
      page.tsx
    api/
  components/
    game/
    hud/
    menus/
  game/
    core/
    world/
    player/
    camera/
    physics/
    npc/
    dialogue/
    quests/
    creatures/
    combat/
    inventory/
    crafting/
    building/
    economy/
    progression/
    audio/
    persistence/
  data/
    quests/
    creatures/
    recipes/
    npcs/
    items/
  lib/
    db/
    auth/
  types/
  tests/

## Architecture rules

- Use a deterministic gameplay event system.
- Separate simulation state from rendering state.
- Avoid unnecessary React rerenders.
- Use fixed-step simulation where appropriate.
- Use instanced meshes for repeated objects.
- Dispose unused GPU resources.
- Validate state transitions.
- Use unique stable IDs.
- Keep gameplay data configurable.
- Avoid introducing unnecessary dependencies.

---

# 19. PERFORMANCE REQUIREMENTS

Target browsers:
- Chrome
- Edge
- Firefox

Minimum supported resolution:
1280 × 720.

Performance goals:
- Target 60 FPS at medium settings on the agreed reference machine.
- Target at least 30 FPS in low-quality mode.
- Avoid long blocking operations on the main thread.
- Use efficient rendering and collision queries.
- Provide graphics settings.

Do not claim performance targets are achieved without measurements.

---

# 20. AUTOMATED TESTING

Implement tests for:

1. Quest prerequisite validation
2. Quest objective tracking
3. Duplicate reward prevention
4. Inventory capacity
5. Item stacking
6. Crafting ingredient validation
7. Crafting output capacity
8. Shop transactions
9. Creature befriending
10. Creature XP and leveling
11. Player XP and leveling
12. Companion command state
13. Building placement validation
14. Shelter completion validation
15. Save/load serialization
16. Save schema migration
17. Cloud revision conflicts
18. Combat cooldowns
19. Elemental damage multipliers
20. Resource respawn timers

Use Vitest for gameplay logic and Playwright for browser interaction tests.

---

# 21. DEVELOPMENT PHASES

## Phase 1 — Project Foundation

Implement:
- Next.js project
- Three.js rendering
- World scene
- Player character
- Movement
- Camera
- Physics
- Basic terrain

Exit condition:
Player can explore a functional 3D environment.

## Phase 2 — Village and NPCs

Implement:
- Village buildings
- Five NPCs
- Interaction prompts
- Dialogue system
- Forest region
- Resource nodes

Exit condition:
Player can navigate the village and interact with NPCs and resources.

## Phase 3 — Inventory and Quests

Implement:
- Inventory
- Hotbar
- Quest engine
- Quest journal
- Rewards
- Leveling
- Shop

Exit condition:
Player can complete early quests and receive persistent rewards.

## Phase 4 — Creatures

Implement:
- Four creature species
- Creature spawning
- Befriending
- Companion following
- Companion commands
- Creature utilities
- Creature progression

Exit condition:
Player can collect and use all four creatures.

## Phase 5 — Crafting and Building

Implement:
- Crafting stations
- Recipes
- Building mode
- Housing plot
- Shelter validation
- Building persistence

Exit condition:
Player can gather, craft, and construct a valid shelter.

## Phase 6 — Combat and Finale

Implement:
- Hostile encounters
- Companion combat
- Elemental abilities
- Forest passage repair
- Final encounter
- Ending celebration

Exit condition:
The entire ten-mission adventure is completable.

## Phase 7 — Persistence and Polish

Implement:
- IndexedDB saves
- Account-based cloud saves
- Save import
- Audio
- Settings
- Graphics optimization
- Automated testing
- Browser testing

Exit condition:
All MVP acceptance criteria pass.

---

# 22. ACCEPTANCE CRITERIA

The game is complete only when:

- It runs in a desktop browser.
- The main character is controllable.
- The camera works smoothly.
- The village and forest are explorable.
- All five NPCs are interactive.
- All ten missions are completable.
- All four creatures are collectible.
- Creature abilities function.
- Combat functions.
- Gathering functions.
- Inventory functions.
- Crafting functions.
- Building functions.
- Rewards and leveling function.
- Save/load functions.
- Quest progress survives reload.
- Buildings survive reload.
- No mission is permanently blocked.
- No visible control is fake.
- The complete opening adventure can be played from start to finish.

---

# 23. REQUIRED CODEX WORKFLOW

Follow this workflow:

**Step A — Inspect**
Inspect the repository and determine what already exists.

**Step B — Plan**
Create a short implementation plan with dependencies, risks, and acceptance criteria.

**Step C — Implement**
Write actual code and assets for the current phase.

**Step D — Validate**
Run available type checks, linting, tests, and browser checks.

**Step E — Repair**
Fix discovered errors before advancing.

**Step F — Report**
Provide a concise implementation summary:
- Completed features
- Files changed
- Tests executed
- Test results
- Known limitations
- Next phase

Continue through the phases while execution time and environment permit.

If the environment or context limit interrupts development, leave the repository in a runnable state and create a progress document containing the next exact steps.

---

# 24. REQUIRED PROJECT DOCUMENTATION

Maintain:

- README.md
- GAME_DESIGN.md
- ARCHITECTURE.md
- DEVELOPMENT_PROGRESS.md
- TESTING.md

The documentation must reflect the actual implementation.

---

# 25. FINAL EXECUTION COMMAND

**Begin building MomoVerse now.**

Inspect the repository, establish the architecture, and implement Phase 1.

Do not stop after producing a plan.

Build a working 3D browser game foundation with a controllable green character, explorable voxel environment, third-person camera, collisions, and functional controls.

Run the application and validate the implementation wherever the environment supports it.

After Phase 1 passes its acceptance criteria, proceed through subsequent phases in dependency order.

The ultimate objective is a complete, playable MomoVerse MVP—not a website concept, static demonstration, or collection of unfinished systems.
