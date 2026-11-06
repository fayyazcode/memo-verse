# MOMOVERSE: LIVING WORLD RPG
## Complete Codex Expansion Specification — Version 2.0

**Project:** MomoVerse  
**Task:** Extend an existing playable browser game  
**Genre:** 3D Voxel Sandbox / Creature RPG / Settlement Simulation / Tactical Adventure  
**Platform:** Desktop web browser  
**Development Agent:** OpenAI Codex  
**Priority:** Preserve existing functionality while adding integrated gameplay systems

---

# 0. CODEX OPERATING INSTRUCTIONS

You are acting as the lead gameplay engineer, systems designer, technical architect, UI engineer, and QA engineer for an existing MomoVerse project.

Your responsibility is to implement the Living World RPG expansion directly into the existing repository.

## Critical requirements

1. **Do not rebuild MomoVerse from scratch.**
2. Inspect the repository before proposing changes.
3. Identify the actual frameworks, dependencies, systems, database schemas, and gameplay conventions already in use.
4. Reuse existing systems wherever practical.
5. Preserve the original green playable character and its existing animations.
6. Preserve the Minecraft-inspired voxel environment, terrain, construction, and exploration mechanics.
7. Preserve existing NPCs, creatures, missions, rewards, inventory, crafting, combat, and save data.
8. Implement additions as compatible extensions.
9. Do not replace working systems simply because another architecture is preferred.
10. Do not invent repository paths, functions, database tables, or completed features.
11. Keep the project runnable after every implementation phase.
12. Create real gameplay interactions, not static demonstrations.
13. Run tests and repair failures before proceeding.
14. Never claim a feature is working without validating it.
15. Maintain backward compatibility with existing player saves.

The provided design is the target behavior. If repository implementation differs, adapt to the existing architecture and document the differences.

## Required first action

Before modifying code:

- Inspect package.json and project configuration.
- Locate the game entry point.
- Identify the 3D renderer and world structure.
- Find player movement and camera systems.
- Find existing NPC, dialogue, and quest systems.
- Find creature definitions, companion commands, and combat logic.
- Find inventory, crafting, construction, and economy systems.
- Find persistence, authentication, and database implementations.
- Identify automated tests and current project health.

Produce a short integration map identifying:

- Existing reusable modules
- Missing functionality
- Necessary schema changes
- Potential compatibility risks
- Proposed implementation sequence

Then begin implementation.

---

# 1. EXPANSION VISION

## 1.1 Core concept

MomoVerse becomes a living fantasy sandbox where players explore a voxel world, train creature squads, build productive settlements, defend against invasions, capture outposts, develop professions, and influence the world through their actions.

The world should respond to player progress.

Examples:

- Repairing a bridge unlocks a new trade route.
- Capturing an enemy outpost allows friendly NPCs to occupy it.
- Building a workshop unlocks creature-assisted production.
- Assigning creatures to jobs creates visible activity around the settlement.
- Defending a village increases its prosperity.
- Completing a regional event changes NPC dialogue and available resources.

## 1.2 Inspiration boundaries

Use the following references conceptually:

**Minecraft**
- Voxel world exploration
- Gathering and crafting
- Player construction
- Environmental freedom

**League of Legends**
- Distinct combat roles
- Ability-based tactical encounters
- Cooldowns and positioning
- Defensive structures
- Neutral objectives
- Team compositions

**Kintara**
- Persistent RPG progression
- Professions and skill development
- Region-based exploration
- NPC-driven activities
- Economy and world events

All artwork, creature designs, locations, lore, UI, names, maps, and combat abilities must be original.

Do not recreate Summoner's Rift, Minecraft assets, or another game's proprietary content.

## 1.3 Design pillars

1. Player freedom
2. Creature utility
3. Tactical combat
4. Meaningful construction
5. Persistent progression
6. Reactive world states
7. Long-term replayability

## 1.4 Expansion gameplay loop

Explore → Gather → Train Creatures → Build Settlement → Assign Jobs → Defend Territory → Capture Outposts → Unlock Resources → Upgrade Settlement → Explore Further.

Every major system must contribute to this loop.

---

# 2. EXISTING SYSTEM INTEGRATION

Treat the following as expected existing functionality, but verify it in the repository.

- Green player character
- Third-person movement
- Voxel terrain
- Starter village
- Greenwood Forest
- Five NPCs
- Ten original missions
- Four collectible creatures
- Companion following and commands
- Basic companion combat
- Inventory and hotbar
- Gathering
- Crafting
- Building
- Coins and XP
- Shops
- Save/load

Do not duplicate these systems.

## 2.1 Integration principles

Use existing item IDs, creature IDs, quest IDs, and save structures where possible.

Extend existing gameplay events instead of creating parallel systems.

Examples:

- `resource.collected` updates gathering quests and profession XP.
- `creature.ability.used` updates creature progression and world interactions.
- `building.placed` updates construction objectives and settlement validation.
- `enemy.defeated` updates combat quests and encounter rewards.
- `outpost.captured` updates world ownership and unlocks regional benefits.

Event names are proposed conventions, not assumed existing APIs.

Create adapters where needed.

---

# 3. NEW WORLD STRUCTURE

Extend the existing map without replacing the starter village or forest.

## 3.1 Expansion regions

### Region A — Momo Village

Existing starter settlement.

New features:
- Settlement management board
- Creature job stations
- Defensive structures
- Village prosperity
- Production storage
- Upgradeable workshop
- Village defense encounters

### Region B — Greenwood Frontier

An extension of the existing forest.

Features:
- Hostile patrols
- Resource-rich clearings
- First capturable outpost
- Creature training encounters
- Exploration landmarks
- Regional events

### Region C — Ember Highlands

New volcanic and rocky region.

Features:
- Fire-related resources
- Smelting opportunities
- Hostile elemental creatures
- Advanced mining nodes
- Defensive outpost

### Region D — Moonwater Marsh

New wetland region.

Features:
- Water-related creatures
- Environmental puzzles
- Rare plants
- Alchemy ingredients
- Flooded ruins

### Region E — Stormwatch Plateau

New elevated region.

Features:
- Electrical mechanisms
- Rare crystals
- Dangerous weather visuals
- Advanced combat encounters
- High-level outpost

## 3.2 Region implementation

Use the existing world coordinate system.

If the world uses chunks, extend chunk generation and streaming.

If it uses handcrafted geometry, add regions using compatible scene assets.

Do not rewrite the terrain engine without demonstrated necessity.

## 3.3 Region progression

Suggested levels:

| Region | Recommended level |
|---|---|
| Momo Village | 1–5 |
| Greenwood Frontier | 5–10 |
| Ember Highlands | 10–15 |
| Moonwater Marsh | 12–18 |
| Stormwatch Plateau | 18–25 |

Recommended levels are guidance, not hard restrictions.

Players can explore freely, but stronger encounters and environmental challenges make advanced regions more dangerous.

---

# 4. CREATURE SQUAD SYSTEM

## 4.1 Overview

Expand the existing one-companion system into a three-creature tactical squad.

Rules:

- Players can equip up to three collected creatures.
- One creature is directly commanded.
- Two creatures use AI-controlled support behavior.
- The player can switch the directly commanded creature.
- Only equipped creatures participate in combat.
- Non-equipped creatures remain in the collection or can be assigned to settlement jobs.
- A creature cannot simultaneously work at a settlement and join the active squad.

## 4.2 Squad roles

Implement four tactical roles.

**Tank**
- High durability
- Enemy attention control
- Defensive abilities

**Fighter**
- Balanced damage and survivability
- Close-range engagement

**Mage**
- Elemental damage
- Area attacks
- Crowd control

**Support**
- Healing
- Shields
- Buffs
- Utility

Each creature has one primary role.

## 4.3 Initial creature roles

| Creature | Role | Specialty |
|---|---|---|
| Emberfox | Mage | Area fire damage |
| Aquabub | Support | Healing and water utility |
| Mosshell | Tank | Defense and crowd control |
| Zaplet | Fighter | Fast electrical damage |

## 4.4 Ability system

Each creature supports:

- Basic attack
- Q ability
- E ability
- R ultimate
- Passive trait

Abilities must define:
- ID
- Element
- Target type
- Damage or healing
- Range
- Radius
- Cooldown
- Resource cost, if applicable
- Animation
- Visual effect
- Status effects

## 4.5 Initial abilities

### Emberfox

**Passive — Warmth**
Provides a small fire-damage bonus near active fire effects.

**Q — Fireball**
Launches a projectile at a target.

**E — Flame Trail**
Creates a short-lived damaging area.

**R — Meteor Burst**
Deals area damage with a clear warning indicator.

### Aquabub

**Passive — Refresh**
Slightly improves nearby allied healing.

**Q — Water Bolt**
Ranged water attack.

**E — Healing Bubble**
Heals the lowest-health nearby ally.

**R — Tidal Wave**
Damages and pushes enemies in a directional area.

### Mosshell

**Passive — Stone Skin**
Reduces incoming damage.

**Q — Rock Smash**
Close-range earth attack.

**E — Stone Shield**
Temporarily shields the active squad.

**R — Earthquake**
Area damage and brief stun.

### Zaplet

**Passive — Static Charge**
Repeated attacks build a temporary electrical charge.

**Q — Spark Dash**
Fast attack toward a target.

**E — Chain Lightning**
Hits multiple nearby enemies.

**R — Thunderstorm**
Creates a short-duration electrical damage zone.

## 4.6 Initial combat balancing

Use these as configurable starting values:

- Basic attack cooldown: 1.5 seconds
- Q cooldown: 5 seconds
- E cooldown: 10 seconds
- R cooldown: 45 seconds
- Ultimate charge requirement: 100
- Maximum squad size: 3
- Squad switch cooldown: 2 seconds
- Maximum companion follow distance: 20 units
- Companion teleport recovery distance: 30 units

Ultimate charge:
- Successful basic attack: +5
- Successful Q or E: +10
- Defeating an enemy: +15

Clamp charge at 100.

After an ultimate is used, charge returns to zero.

Do not allow abilities to bypass cooldowns or consume charge twice.

## 4.7 Companion AI

Support behaviors:

- Follow
- Stay
- Defensive
- Aggressive
- Focus Target
- Retreat
- Use Utility
- Recall

AI rules:
- Never attack friendly NPCs.
- Do not attack neutral creatures unless explicitly commanded and allowed.
- Avoid pulling enemies from excessive distances.
- Maintain valid navigation.
- Recover from stuck states.
- Respect combat cooldowns.
- Prioritize survival when critically injured.

Use a finite-state machine or behavior tree compatible with the existing implementation.

---

# 5. SETTLEMENT MANAGEMENT

## 5.1 Overview

Transform the existing housing and construction mechanics into a small settlement development system.

Do not remove existing player-built structures.

Add a separate designated settlement expansion zone around Momo Village.

## 5.2 Settlement statistics

Track:

- Settlement level
- Prosperity
- Defense rating
- Production capacity
- Storage capacity
- Assigned workers
- Unlocked buildings
- Active upgrades
- Regional benefits

## 5.3 Settlement levels

| Level | Unlock |
|---|---|
| 1 | Basic job stations |
| 2 | Expanded storage |
| 3 | Defensive towers |
| 4 | Advanced workshop |
| 5 | Settlement command center |

Maximum settlement level for this expansion: 5.

## 5.4 Prosperity

Prosperity ranges from 0 to 100.

Increase prosperity through:
- Completing settlement missions
- Upgrading buildings
- Defending invasions
- Capturing nearby outposts

Prosperity provides small production and shop benefits.

Do not make low prosperity permanently block progression.

## 5.5 New buildings

### Lumber Station
Produces wood through assigned creatures.

### Quarry
Produces stone and ore.

### Garden
Produces berries and plants.

### Smelter
Processes ore and refined materials.

### Storage Warehouse
Stores settlement production.

### Watchtower
Attacks hostile enemies during defense events.

### Healing Station
Recovers injured companions.

### Command Center
Displays settlement information and upgrades.

## 5.6 Building rules

- Use the existing block placement system where possible.
- Special buildings use validated blueprints.
- Require sufficient materials.
- Prevent placement on protected terrain.
- Prevent overlapping buildings.
- Require accessible placement.
- Persist building state.
- Deduct materials only on successful placement.

A building must be functional, not merely decorative.

---

# 6. CREATURE JOB SYSTEM

## 6.1 Overview

Allow collected creatures to work at settlement stations.

Each creature may be assigned to one job at a time.

## 6.2 Job types

- Lumbering
- Mining
- Farming
- Smelting
- Transport
- Defense

## 6.3 Initial job compatibility

| Creature | Preferred jobs |
|---|---|
| Emberfox | Smelting, Defense |
| Aquabub | Farming, Transport |
| Mosshell | Mining, Defense |
| Zaplet | Power, Defense |

Creatures can perform compatible nonpreferred jobs at reduced efficiency when appropriate.

## 6.4 Job rules

- One active assignment per creature.
- Assigned creatures are unavailable to the combat squad.
- Stations have worker limits.
- Jobs require valid stations.
- Production consumes or creates resources according to recipes.
- Production must respect storage capacity.
- Workers do not produce unlimited resources.
- Jobs pause when required inputs are unavailable.
- Jobs stop when storage is full.
- Players can recall workers.

## 6.5 Production timing

Suggested starting rates:

- Lumbering: 1 wood per 30 seconds
- Mining: 1 stone per 40 seconds
- Farming: 1 berry per 25 seconds
- Smelting: 1 processed item per 60 seconds

Rates are measured in active gameplay time.

For the first implementation, do not generate resources while the browser is closed.

## 6.6 Worker behavior

Workers should visibly:
- Move toward assigned stations
- Perform a looping work animation
- Display current activity
- Pause when blocked
- Return to idle when unassigned

Use simple navigation and animation states.

---

# 7. SETTLEMENT DEFENSE

## 7.1 Overview

Introduce PvE invasion events that attack a designated settlement defense area.

Do not allow invasions to permanently destroy the player's home or invalidate existing quests.

## 7.2 Defense preparation

Players can:
- Assign defensive creatures
- Build watchtowers
- Place barriers
- Repair defenses
- Prepare consumables
- Start an invasion from the defense board

The initial implementation uses manually started events.

Automatic invasion scheduling can be added later.

## 7.3 Invasion structure

Each invasion contains three waves.

**Wave 1:** Basic enemies  
**Wave 2:** Mixed enemies  
**Wave 3:** Elite enemy and support units

## 7.4 Enemy objectives

Enemies attempt to reach and damage the settlement defense core.

Victory:
- All waves defeated
- Defense core survives

Defeat:
- Defense core reaches zero health

## 7.5 Suggested starting values

- Defense core health: 500
- Basic enemy health: 60
- Elite enemy health: 180
- Watchtower damage: 12
- Watchtower cooldown: 2 seconds
- Preparation period: 30 seconds
- Maximum active enemies: 12

## 7.6 Rewards

Successful defense grants:
- Coins
- Combat XP
- Creature XP
- Settlement prosperity
- Upgrade materials

Failed defense grants reduced participation XP but no full completion reward.

Rewards must be granted once per event instance.

## 7.7 Difficulty scaling

Scale enemies according to:
- Selected difficulty
- Settlement level
- Player progression

Do not scale enemies directly from the player's strongest creature alone.

---

# 8. TERRITORY CONTROL

## 8.1 Overview

Create capturable regional outposts.

Capturing outposts changes the world and unlocks benefits.

## 8.2 Initial outposts

**Greenwood Watch**
- Beginner outpost
- Unlocks forest fast travel
- Improves wood gathering

**Ember Quarry**
- Mining outpost
- Unlocks rare ore access
- Improves smelting

**Moonwater Shrine**
- Exploration outpost
- Unlocks alchemy resources
- Improves creature recovery

**Stormwatch Beacon**
- Advanced outpost
- Unlocks electrical crafting
- Improves regional defense

## 8.3 Capture requirements

An outpost can be captured when the player:

1. Discovers its location.
2. Completes its prerequisite mission.
3. Defeats or resolves its defenders.
4. Activates the capture mechanism.
5. Completes a timed capture interaction.

## 8.4 Capture rules

- Capture duration: 20 seconds.
- Taking damage interrupts capture.
- Leaving the capture radius interrupts capture.
- Defenders must be cleared.
- Captured outposts remain controlled in the first expansion.
- No automatic recapture system initially.

## 8.5 World changes

After capture:
- Enemy patrols are reduced.
- Friendly NPCs appear.
- New crafting resources become available.
- A fast-travel point may unlock.
- NPC dialogue updates.
- Regional bonuses activate.

The world must visibly reflect ownership changes.

---

# 9. PROFESSIONS AND LIFE SKILLS

## 9.1 Professions

Implement six professions:

1. Woodcutting
2. Mining
3. Smithing
4. Cooking
5. Alchemy
6. Creature Training

## 9.2 Profession levels

Levels: 1–20.

XP threshold for next level:

75 × current profession level.

## 9.3 Profession progression

Professions gain XP through relevant successful actions.

Examples:
- Woodcutting XP from harvesting trees
- Mining XP from mining nodes
- Smithing XP from processing materials
- Cooking XP from crafting food
- Alchemy XP from brewing consumables
- Creature Training XP from training activities

## 9.4 Profession unlocks

Every five levels unlock one meaningful benefit.

Examples:
- Higher resource yield chance
- New recipes
- Faster processing
- Additional resource types
- Improved creature training

Use bounded bonuses to avoid infinite resource generation.

## 9.5 Anti-exploit rules

- No XP from failed actions.
- No XP from repeatedly opening menus.
- No XP from moving items between containers.
- No XP from zero-cost crafting loops.
- Production rewards are based on completed work.

---

# 10. WORLD EVENTS

## 10.1 Event system

Create a configurable event scheduler.

Initial event types:

### Creature Migration
Rare creatures temporarily appear in a region.

### Resource Surge
Special gathering nodes become available.

### Wandering Merchant
A temporary merchant offers rotating items.

### Forest Disturbance
Hostile creatures occupy a designated area.

### Lost Caravan
The player escorts an NPC through a dangerous route.

## 10.2 Event rules

- Only one major world event active at a time.
- Event duration: 10 minutes of active gameplay.
- Event cooldown: 20 minutes of active gameplay.
- Events must not permanently block story progression.
- Events must have clear objectives.
- Rewards must be claimable once per event instance.
- Event state persists across saves.

For the initial implementation, events advance only during active gameplay.

## 10.3 Event UI

Display:
- Event name
- Location
- Remaining time
- Objectives
- Rewards
- Participation status

Add event markers to the world map.

---

# 11. NEW NPC AND QUEST CONTENT

## 11.1 Preserve existing NPCs

Retain:
- Grandpa Moss
- Foxy
- Bloop
- Luna
- Bruno

Extend their dialogue and quest offerings.

## 11.2 New NPCs

### Captain Thorn
Settlement defense instructor.

### Mira
Profession trainer and crafting specialist.

### Rook
Outpost scout and regional exploration guide.

### Tessa
Creature squad trainer.

## 11.3 New questlines

Create four expansion questlines.

### Questline A — A Village Worth Defending

Five missions:
1. Inspect the settlement board.
2. Build the first job station.
3. Assign a creature worker.
4. Construct a defensive tower.
5. Successfully defend the village.

### Questline B — The Wild Frontier

Five missions:
1. Meet the outpost scout.
2. Discover Greenwood Watch.
3. Clear enemy patrols.
4. Capture the outpost.
5. Activate the fast-travel point.

### Questline C — Masters of the Elements

Five missions:
1. Assemble a three-creature squad.
2. Complete ability training.
3. Execute a support ability.
4. Defeat a tactical encounter.
5. Complete a squad challenge.

### Questline D — A Living Settlement

Five missions:
1. Unlock the warehouse.
2. Assign two compatible workers.
3. Produce settlement resources.
4. Upgrade the workshop.
5. Reach settlement level 3.

Total new missions: 20.

## 11.4 Quest implementation

Use the existing quest engine.

Extend objective types only when necessary.

Suggested new objective types:
- Assign worker
- Produce resource
- Build special structure
- Defend wave
- Capture outpost
- Use creature ability
- Reach settlement level
- Complete profession activity
- Participate in world event

All objectives must be validated from actual gameplay state.

---

# 12. ECONOMY AND REWARDS

## 12.1 Currency

Continue using existing coins.

Do not introduce blockchain tokens, NFTs, or real-money trading.

## 12.2 Resource categories

Maintain existing resources and add:

- Hardwood
- Refined ore
- Ember crystal
- Moonwater herb
- Storm crystal
- Defense components
- Settlement upgrade materials

## 12.3 Economy principles

- Gathering provides basic resources.
- Professions unlock improved processing.
- Creature jobs provide bounded passive production during active play.
- Outposts unlock regional resources.
- Invasions grant upgrade materials.
- Settlement upgrades consume resources and coins.

## 12.4 Balance rules

- No infinite free crafting loops.
- No negative inventory.
- No duplicate reward claims.
- No rewards for canceled jobs.
- No production beyond storage capacity.
- Essential progression must not depend on random rare drops.

Use configurable balance tables.

---

# 13. PLAYER AND CREATURE PROGRESSION

## 13.1 Player level cap

Extend the existing level cap to 25.

Preserve existing XP and level progression.

If the current XP formula differs, use the existing formula and extend it consistently unless a migration is explicitly justified.

## 13.2 Creature level cap

Extend to 25.

Creature XP sources:
- Combat participation
- Relevant utility actions
- Training missions
- Settlement work, at reduced rates

## 13.3 Ability progression

Unlock:
- Q at creature level 1
- E at creature level 5
- R at creature level 10

Later levels improve ability effectiveness through bounded upgrades.

## 13.4 Friendship

Preserve existing friendship values.

Friendship may provide:
- Small work efficiency bonuses
- Minor companion recovery improvements
- Cosmetic interactions

Do not make friendship mandatory for basic creature usability.

---

# 14. USER INTERFACE EXPANSION

## 14.1 Preserve existing UI

Do not replace the existing HUD or menus without necessity.

Extend the current interface consistently.

## 14.2 New HUD elements

Add:
- Three-creature squad panel
- Ability cooldown indicators
- Ultimate charge
- Settlement status shortcut
- Active world event notification
- Outpost capture progress

## 14.3 New screens

### Squad Management
- Equipped creatures
- Creature roles
- Ability descriptions
- Health
- Levels
- Friendship
- Assignment status

### Settlement Dashboard
- Settlement level
- Prosperity
- Defense
- Production
- Storage
- Buildings
- Worker assignments

### Profession Journal
- Profession levels
- XP
- Unlocks
- Available recipes

### Territory Map
- Outpost locations
- Ownership status
- Regional benefits
- Fast-travel points

### World Events
- Active event
- Objectives
- Timer
- Rewards

### Defense Preparation
- Wave difficulty
- Assigned defenders
- Defensive structures
- Start event button

## 14.4 Input controls

Preserve existing controls.

Suggested additions:
- Tab: Squad panel
- Q/E/R: Active companion abilities
- Z/X: Cycle directly commanded companion
- G: Settlement dashboard
- P: Profession journal

Make all bindings configurable to avoid conflicts with existing inputs.

Menus must suppress gameplay inputs.

---

# 15. TECHNICAL ARCHITECTURE

## 15.1 Primary rule

Extend the existing architecture rather than introducing a parallel game engine.

If the project already uses Next.js, React Three Fiber, Rapier, Zustand, and PostgreSQL, continue using them.

If it uses alternatives, prefer compatibility.

## 15.2 Proposed modules

These are conceptual modules, not mandatory file paths.

- SquadManager
- AbilitySystem
- CompanionAI
- SettlementManager
- JobScheduler
- ProductionSystem
- DefenseDirector
- OutpostManager
- ProfessionSystem
- WorldEventManager
- ExpansionQuestDefinitions
- ExpansionSaveAdapter

## 15.3 Gameplay event system

Prefer extending the existing event bus.

Suggested event types:

- `squad.changed`
- `ability.cast`
- `ability.resolved`
- `worker.assigned`
- `worker.unassigned`
- `production.completed`
- `settlement.upgraded`
- `defense.started`
- `defense.wave.completed`
- `defense.completed`
- `outpost.captured`
- `profession.xp.awarded`
- `world_event.started`
- `world_event.completed`

Event handlers must be idempotent where rewards or persistence are involved.

## 15.4 Simulation timing

Use a fixed-step simulation or the existing equivalent for combat, AI, and movement.

Do not tie gameplay logic directly to rendering FPS.

Use elapsed active-play time for:
- Production
- World events
- Resource regeneration
- Defense preparation

Pause these timers during game pause and inactive gameplay.

## 15.5 Performance

- Use instanced rendering for repeated objects.
- Avoid unnecessary physics bodies.
- Update distant NPC AI less frequently.
- Use bounded AI update budgets.
- Pool projectiles and visual effects.
- Dispose unused GPU resources.
- Avoid React state updates every animation frame.
- Profile expensive systems before optimizing them.

---

# 16. DATA MODELS

Adapt these conceptual models to existing database conventions.

## Creature Squad

```ts
interface CreatureSquad {
  playerId: string;
  equippedCreatureIds: string[];
  activeCreatureId: string | null;
  stance: "defensive" | "aggressive" | "passive";
}
```

Constraints:
- Maximum three equipped creatures.
- IDs must belong to the player.
- No duplicate IDs.
- Workers cannot be equipped.
- Active creature must be equipped.

## Creature Ability

```ts
interface CreatureAbility {
  id: string;
  creatureSpeciesId: string;
  slot: "Q" | "E" | "R";
  targetType: "self" | "ally" | "enemy" | "area";
  cooldownMs: number;
  range: number;
  basePower: number;
  element: string;
  requiredLevel: number;
}
```

## Settlement

```ts
interface Settlement {
  id: string;
  ownerId: string;
  level: number;
  prosperity: number;
  defenseRating: number;
  storageCapacity: number;
  unlockedBuildingIds: string[];
  revision: number;
}
```

## Settlement Building

```ts
interface SettlementBuilding {
  id: string;
  settlementId: string;
  blueprintId: string;
  position: [number, number, number];
  rotation: number;
  level: number;
  health: number;
  enabled: boolean;
}
```

## Worker Assignment

```ts
interface WorkerAssignment {
  id: string;
  creatureInstanceId: string;
  buildingId: string;
  jobType: string;
  status: "working" | "paused" | "idle";
  progressMs: number;
}
```

## Production Job

```ts
interface ProductionJob {
  id: string;
  stationId: string;
  recipeId: string;
  progressMs: number;
  durationMs: number;
  status: "queued" | "active" | "paused" | "completed";
}
```

## Outpost

```ts
interface OutpostState {
  id: string;
  regionId: string;
  owner: "neutral" | "hostile" | "player";
  capturedAt: number | null;
  unlockedBenefits: string[];
}
```

## Profession

```ts
interface ProfessionProgress {
  playerId: string;
  professionId: string;
  level: number;
  xp: number;
  unlockedPerks: string[];
}
```

## World Event

```ts
interface WorldEventState {
  instanceId: string;
  definitionId: string;
  regionId: string;
  status: "scheduled" | "active" | "completed" | "expired";
  remainingActiveMs: number;
  objectives: Record<string, number>;
  rewardClaimed: boolean;
}
```

## Defense Encounter

```ts
interface DefenseEncounter {
  id: string;
  settlementId: string;
  difficulty: number;
  currentWave: number;
  coreHealth: number;
  status: "preparing" | "active" | "victory" | "defeat";
  rewarded: boolean;
}
```

## Data integrity

Enforce:
- Unique assignment per creature
- Unique reward claim per event instance
- Valid outpost ownership transitions
- Nonnegative inventory
- Storage capacity
- Valid squad membership
- Valid building positions
- Atomic resource transactions
- Save revision checks

---

# 17. SAVE DATA AND MIGRATION

## 17.1 Preserve existing saves

Existing adventures must load without requiring a new game.

## 17.2 Migration strategy

1. Identify the existing save schema version.
2. Add new expansion fields with safe defaults.
3. Preserve original player progress.
4. Preserve quest completion.
5. Preserve inventory and structures.
6. Preserve creature ownership and levels.
7. Preserve currency and achievements.
8. Validate migrated data.
9. Create tests using representative old saves.

## 17.3 Default expansion state

For an existing player:
- Settlement level: 1
- Prosperity: 20
- Outposts: hostile or neutral
- Professions: level 1
- Worker assignments: empty
- Squad: existing active companion equipped
- Expansion quests: locked until prerequisites are met

## 17.4 Persistence rules

- Persist all world-changing actions.
- Use unique event IDs for rewards.
- Prevent duplicate processing.
- Preserve save revision conflict detection.
- Avoid destructive database migrations.
- Never silently reset progress.

---

# 18. EXPANSION DEVELOPMENT PHASES

## Phase 0 — Repository Audit

Deliver:
- Existing architecture map
- Integration plan
- Compatibility risks
- Current test baseline

Do not rewrite working modules.

## Phase 1 — Creature Squad and Abilities

Implement:
- Three-creature squad
- Squad management UI
- Tactical roles
- Q/E/R abilities
- Cooldowns
- Ultimate charge
- Companion AI
- Ability visual effects

Acceptance:
- Three creatures can be equipped.
- One creature can be directly commanded.
- AI companions assist appropriately.
- Abilities apply real effects.
- Cooldowns and charge are enforced.
- Existing one-companion saves still load.

## Phase 2 — Settlement and Creature Jobs

Implement:
- Settlement dashboard
- Job stations
- Worker assignment
- Production
- Storage
- Settlement upgrades
- Worker animations

Acceptance:
- Workers produce resources during active play.
- Production stops when storage is full.
- A creature cannot work and fight simultaneously.
- Upgrades consume actual resources.
- Progress persists.

## Phase 3 — Village Defense

Implement:
- Defense preparation
- Three-wave encounters
- Enemy pathing
- Defensive structures
- Defense core
- Victory and defeat
- Rewards

Acceptance:
- Players can start and finish an invasion.
- Towers and defenders attack enemies.
- The defense core can be damaged.
- Rewards cannot be duplicated.
- Existing buildings and quests remain safe.

## Phase 4 — Territory Control

Implement:
- Greenwood Watch
- Outpost defenders
- Capture interaction
- Ownership state
- World changes
- Fast travel
- Regional bonuses

Acceptance:
- Outpost capture is functional.
- Capture can be interrupted.
- Ownership persists.
- NPCs and regional benefits update.

## Phase 5 — Professions and World Events

Implement:
- Six professions
- XP and unlocks
- Event scheduler
- Five event types
- Event UI
- Rewards

Acceptance:
- Profession XP tracks real activities.
- Perks affect gameplay.
- Events start and expire correctly.
- Event rewards are granted once.
- Event state survives reload.

## Phase 6 — Additional Regions and Quests

Implement:
- Ember Highlands
- Moonwater Marsh
- Stormwatch Plateau
- Four expansion questlines
- Regional outposts
- Additional resources
- Environmental challenges

Acceptance:
- All new regions are explorable.
- All 20 expansion missions are completable.
- Regional progression works.
- Existing starter missions remain completable.

## Phase 7 — Integration and Polish

Implement:
- UI polish
- Audio
- Performance improvements
- Save migrations
- Regression tests
- Browser tests
- Balance adjustments

Acceptance:
- Existing and new gameplay loops work together.
- Existing saves migrate safely.
- No progression-blocking bugs remain in tested paths.

---

# 19. AUTOMATED TEST REQUIREMENTS

Add tests for:

## Creature squads
- Maximum squad size
- Ownership validation
- Worker/squad exclusivity
- Switching
- Cooldowns
- Ultimate charge
- Ability damage
- Healing and shields
- Target validation

## Settlement
- Building requirements
- Upgrade costs
- Worker assignment
- Production timing
- Storage limits
- Job cancellation
- Resource transactions

## Defense
- Wave spawning
- Core damage
- Victory conditions
- Defeat conditions
- Reward idempotency
- Difficulty scaling

## Territory
- Capture prerequisites
- Capture interruption
- Ownership persistence
- Regional benefit application
- Fast-travel unlocking

## Professions
- XP grants
- Level thresholds
- Perk unlocks
- Invalid action rejection
- Level caps

## World events
- Scheduling
- Active-time duration
- Objective completion
- Reward claiming
- Save restoration

## Persistence
- Old save migration
- New save serialization
- Duplicate event prevention
- Cloud revision conflicts
- Invalid data rejection

## Regression
- Original ten missions
- Existing crafting recipes
- Original inventory behavior
- Original creature collection
- Original building persistence
- Original NPC interactions
- Original combat
- Existing save/load

Use the repository's current test tools wherever possible.

---

# 20. PERFORMANCE TARGETS

The expansion must not significantly degrade the existing game.

Targets:
- Desktop Chrome, Edge, and Firefox
- 1280 × 720 minimum
- 60 FPS target on agreed reference hardware
- Low-quality mode targeting 30 FPS
- Bounded enemy counts
- Bounded worker counts
- Efficient world streaming
- No unbounded event listeners
- No unnecessary full-scene rerenders

Measure and report performance using reproducible test scenarios.

---

# 21. EXPANSION ACCEPTANCE CRITERIA

The expansion is complete when:

1. Existing MomoVerse gameplay remains functional.
2. The original green character is preserved.
3. Existing voxel terrain and buildings remain intact.
4. Players can equip three creatures.
5. Creature combat roles and abilities function.
6. Creatures can perform settlement jobs.
7. Settlement production and upgrades function.
8. Players can construct functional defenses.
9. Village invasion encounters function.
10. Players can capture regional outposts.
11. Captured outposts visibly change the world.
12. Professions gain XP and unlock benefits.
13. World events function.
14. All 20 new missions are completable.
15. New regions are explorable.
16. New progression persists.
17. Existing saves migrate correctly.
18. Rewards cannot be duplicated through normal gameplay.
19. All major controls perform real actions.
20. Automated and browser tests validate the critical gameplay loops.

---

# 22. DOCUMENTATION

Create or update:

- `GAME_DESIGN.md`
- `ARCHITECTURE.md`
- `EXPANSION_PLAN.md`
- `DEVELOPMENT_PROGRESS.md`
- `TESTING.md`
- `SAVE_MIGRATION.md`

Documentation must reflect the actual implementation.

Do not mark incomplete features as finished.

---

# 23. REQUIRED CODEX EXECUTION WORKFLOW

For each phase:

1. Inspect relevant existing modules.
2. Identify reusable code.
3. Implement the smallest complete functional increment.
4. Integrate it into existing gameplay.
5. Add automated tests.
6. Run type checks and builds.
7. Execute available gameplay tests.
8. Fix regressions.
9. Update progress documentation.
10. Continue to the next phase when practical.

If a phase cannot be completed, report the exact blocker and preserve the working repository.

Do not substitute mock interfaces for functional systems.

---

# 24. FINAL CODEX INSTRUCTION

You are expanding an existing browser-based 3D game called MomoVerse.

**Do not create a new game. Do not replace the existing world. Do not reset player progress.**

Your mission is to evolve MomoVerse into a Living World RPG that combines sandbox exploration, tactical creature combat, settlement construction, creature-assisted production, village defense, territory control, professions, and reactive world events.

Start by auditing the existing repository.

Then implement the expansion incrementally, beginning with the creature squad and ability system.

Preserve existing gameplay, follow established project conventions, test all integrations, and maintain compatibility with existing saves.

The final result must be a playable, persistent, interactive game expansion—not merely new menus, mockups, or documentation.

**Begin the repository audit and proceed with implementation.**