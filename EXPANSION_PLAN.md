# Living World expansion — audit and Phase 1 integration

Audited starting commit: 3455c36. Baseline: 63 Vitest tests pass and TypeScript passes. No uncommitted changes at audit start.

| Existing system | Actual implementation / reusable integration |
| --- | --- |
| App entry and rendering | App Router page → Game; client-only R3F World; Three.js procedural meshes, Rapier fixed-step physics |
| Movement and camera | Player capsule, WASD, click navigation, touch joystick; Classic and orthographic Isometric cameras |
| NPCs and missions | Five NPC definitions, ten quests, conversation UI; store event projection and idempotent claims |
| Creatures | Four stable species IDs, collection HP/XP/friendship, active companion, utility interactions |
| Combat | Existing Bramble Guardian, elemental rules, player/companion attack animation and effects |
| Economy and construction | Inventory transactions, six-slot hotbar, batch crafting, shop, bounded housing placement, shelter validation |
| World and presentation | Handcrafted bounded terrain, river shader/buoyancy, curved bridge, mission guidance, pet previews, outfits |
| Persistence | IndexedDB momoverse/saves/adventure, version 1; serialized checkpoints with revision conflicts; localStorage preferences |
| Auth / backend | None; local guest simulation, no PostgreSQL or cloud saves |
| Tests | Vitest rules/campaign/persistence tests, Playwright desktop and mobile scenarios |

Missing Phase 1 systems: equipped squad, independent creature cooldowns and charge, tactical roles/passives, combat abilities, support AI, squad management and ability HUD.

Sequence: add pure squad/ability rules and validation; extend existing store and save adapter; generalize existing companion controller/animations; add management/HUD/settings; test migration/combat/AI and run regressions/build/browser checks.

Compatibility: retain save version, DB/key, content IDs, active field and quest event paths. Missing squad state derives from the existing active companion; malformed explicit squad data must be rejected without resetting a save. Keep cooldowns per creature through switching/unequipping/reload. Share legacy basic/elemental actions with the new combat resolver. Preserve E/F interaction by defaulting the second ability to Shift+E. No settlement/job implementation, regions, invasions or Phase 2 work in this increment.

Scope adaptation: the only existing hostile is the Guardian. Three village practice targets provide multiple damage targets and repeatable creature training without coins or mission rewards. Their combat state uses the same resolver. Later world systems remain pending.

## Phase gate

Phase 0 audit complete. Phase 1 implementation complete; validation results are recorded in TESTING.md. Phase 2 is not started. No jobs, settlement production, defenses, invasions, outposts, professions, events, additional regions or expansion questlines have been implemented. These are described only in the retained source specification.

Save changes are additive `Save.squad` fields; see SAVE_MIGRATION.md. Existing creature level/XP progression is reused, including the current cap of 10, sufficient for Q/E/R unlocks. The specification's broader cap of 25 is explicitly deferred rather than silently changing original progression during Phase 1.
