# Development progress

## Implemented

Playable client foundation and connected guest-mode systems: Next.js/TypeScript, R3F, Rapier controller, camera, bounded village/forest, original green character, five NPCs, data-driven dialogue and ten quests, gathering, inventory/hotbar, crafting, shop, four companions and utilities, basic combat, construction and shelter validation, journal/map/minimap, XP/rewards, procedural audio, settings, and versioned IndexedDB saves.

## Validation

Production build and TypeScript pass. All 31 rule/integration/persistence tests pass. All four Chromium production-browser tests pass: measured movement and saved-position restoration, physical NPC interaction and persistent quest acceptance, single-yield gathering, and actual block placement preserved through reload. Browser checks used low graphics at 1440 × 900 with SwiftShader; these are functional checks, not performance qualification. A startup race found by browser testing was repaired by gating entry on physics readiness.

## Remaining required work (not silently removed)

1. Expand browser coverage to the entire campaign, including crafting, combat, companion utilities, and shelter completion.
2. Implement Supabase account UI and PostgreSQL/Drizzle cloud persistence. No Supabase or database environment bindings were available during this session. Never place secret values in documentation or source.
3. Implement server-validated gameplay transactions, authenticated ownership, guest import confirmation, cloud conflict resolution, and integration tests using real configured services.
4. Improve terrain topography and chunk organization beyond the flat instanced foundation.
5. Expand animation fidelity (especially landing and celebration), make following/navigation obstacle-aware, and add enemy patrol/chase behavior beyond the current stationary guarded encounter.
6. Expand shelter validation to larger arbitrary interiors, refine furniture visuals and building guidance.
7. Broaden audio (distinct village/forest ambience, footsteps, richer music), cosmetics, and finale staging.
8. Run an entire campaign through browser controls, then qualify browsers and measure performance on agreed hardware.
9. Review the procedural player against the two character reference images when supplied.

## Next exact work

Run the checks in TESTING.md. After the guest build passes, prioritize a full browser campaign traversal and collision/navigation fixes before adding presentation content. Build the authenticated persistence path with explicit server command validation once service configuration is available. Preserve the runnable guest workflow throughout.

## Camera and mouse-control update

Raised the default follow angle and increased default distance from 9 to 13. Existing saves and custom zoom settings remain supported; the previous default zoom upgrades automatically. Ground clicks move the player; object clicks approach and interact once in range. WASD overrides navigation. Building mode retains placement/removal clicks. Direct movement respects physics and stops on a blocked route; automatic pathfinding around obstacles is not implemented.

Validation for the camera/mouse update: production build, TypeScript, 31 logic tests, and all five Chromium browser tests passed.

## Mission guidance, creature cards, and harvesting update

Active quest objectives now resolve to destinations on the minimap and full map. Full-map markers reveal contextual instructions; hovering or keyboard-focusing the adventure tracker reveals a helping-hand guide. Destinations update with objective completion, node availability, and reward readiness.

The four original species have more distinct 3D features and illustrated collection portraits. View creature card opens a collectible-style reference card with a rotating version of the in-world model, live owned HP/level/XP/friendship, befriending food/habitat, attack cooldowns, utility, and elemental advantage. A portrait remains visible while the 3D scene prepares. Background-world rendering becomes demand-driven while a menu is open.

Owned hotbar items appear in the character’s hand: pickaxe, treats, food, materials, and construction items. Mining uses a swinging tool/punch pose; harvesting plants uses a bent reaching pose. The character faces the target and briefly stops moving during the action. Nodes shake on impact and resource fragments travel toward the player. Reward eligibility and single-yield node rules remain unchanged. An owned pickaxe is automatically used visually during mining, then the selected item returns to the hand.

Latest combined validation: frozen dependencies unchanged; production build and TypeScript pass; all 37 logic tests and all seven production-browser tests pass. The pickaxe, cookie and live 3D creature-card screenshots were visually reviewed. Saved-game camera alignment now happens immediately to keep mouse targets stable at startup.

## Mobile input and compact HUD

Added an analog virtual joystick, camera drag/tap distinction, jump/interact/combat controls, sprint toggle, companion menu, and touch building placement/removal. Desktop controls remain available. Task and minimap collapse controls work on all layouts and remember browser preferences; small/touch layouts start collapsed. Mobile panels scroll, action controls avoid the hotbar, viewport/safe-area handling supports orientation changes, and coarse-pointer devices default to low graphics unless overridden. Movement and held buttons reset on release/cancel, menu changes, blur, visibility changes, and resize. Physical phone performance remains unqualified.

Mobile release checks: production build/TypeScript pass; 40 logic tests and all nine browser scenarios pass. Both touch scenarios pass again after the final input-reset adjustment. Portrait and landscape screenshots were visually reviewed. These are Chromium-emulated touch checks; physical-device FPS and Safari remain unqualified.

## Moonflower discoverability fix

The watering target is now a large white/lavender flower on a distinct bed at the dry riverbank east of the wooden bridge (45, -14), clear of the bridge rail. A persistent nameplate identifies it; the active watering mission adds a gold ring, arrow and beacon. Watering changes its appearance and interaction name to watered and removes the objective marker. Helping-hand directions name the bridge, riverbank, map destination and desktop/mobile companion menu. Save IDs and progression flags are unchanged. Validation: production build, 41 logic tests and two focused browser checks pass, including actual Aquabub watering, quest readiness and map reward routing. Before/after screenshots reviewed.

## Batch crafting

Added per-recipe quantity sliders, numeric batch counts, and Max controls with live total cost/output previews. Wooden-block batches produce two blocks each. Batches are bounded to 1–99 and processed as one atomic inventory transaction with one checkpoint; quest progress counts produced items. Max checks actual capacity after ingredient consumption, including cases where consuming a whole stack frees the output slot. Existing single-batch calls remain compatible. Build/TypeScript and all 49 logic tests pass; focused UI validation covers controls, costs, output and quest progress.

## River, bridge and Aquabub

Replaced the flat water boxes with a locally animated water shader, waves, shallow/deeper color, shoreline highlights and player ripples. Terrain now has a lowered riverbed and matching compound colliders, with sloping banks. Submersion applies movement drag and buoyant vertical damping; bridge travelers stay above the water response. The bridge has 24 individually sloped planks forming a 1.45-unit-high center arch, matching deck colliders, curved railings and posts. Wild Aquabub moved onto dry eastern riverbank ground at (46, -22), outside the bridge footprint. Ground resources and procedural tree trunks are kept out of the channel and crossing; stable item/species/node IDs preserve collected progress. This is a shallow-water gameplay model with animated surface effects. Batch crafting is included in the same release.

Final combined validation: production build and TypeScript pass; 55 logic tests pass. Browser checks passed for crafting quantities/materials/quest progress, moonflower watering, arch support and uphill traversal, shallow-bed wading, and befriending Aquabub on the dry bank. Final screenshots show a clear plank crossing and no Aquabub under the bridge. Existing save IDs and schema remain compatible.

## Grounded pets, outfits and attack animation

Replaced command-driven hover/bob locomotion with articulated two/four-foot gaits driven by actual travelled distance and speed. Pet roots stay grounded, settle into rest, and use a Rapier character controller with gravity, snap-to-ground and small-step support. Collision-aware following smooths acceleration/deceleration and turning, retaining safety catch-up for blocked/distant pets. Water following floats at the river level. The follower accounts for slower render frames rather than falling behind due to a 50ms movement cap.

Five original hoodie/accessory skins are selectable in Settings and saved as browser preferences. A separate mobile zoom default of 17 reduces apparent player size without changing movement/collisions or desktop zoom. Player swings, companion lunges and colored elemental effects now follow attack intent; practice swings award nothing, and existing combat validation/cooldowns remain. Build/TypeScript and 61 logic tests pass; both mobile checks passed and the follower/outfit browser scenario passed after the timestep correction. Walking and outfit/attack screenshots were reviewed.

## Two camera perspectives

Added saved Classic/Isometric preferences, a mobile quick toggle and Settings selection. Classic retains its existing distance, pitch, focus and FOV. The supplied reference screenshot guided a true orthographic second camera with a 45° diagonal orientation and approximately 35° elevation. Its world-view size is adjustable independently. Camera-relative movement includes the diagonal offset, raycasting uses the active camera, and vertical touch drags preserve the Classic pitch while Isometric is selected.

The reference website was blocked by the environment proxy; the user supplied the screenshot and selected high overhead/isometric. The implementation follows that visual reference without depending on website access.

## Living World — Phase 0 audit and Phase 1

Audited the existing application and captured the integration map in EXPANSION_PLAN.md. Continued the current Next.js/R3F/Rapier/Zustand/IndexedDB implementation, without a replacement engine or backend. Preserved the original world, NPCs, ten missions, collection, inventory, crafting, construction, camera views and touch controls.

Implemented a three-creature equipped squad, one commanded member, tactical roles/passives, per-creature basic/Q/E/R abilities, level gates, cooldowns, charge, damage/healing/shields, timed areas and a bounded effect queue. Support AI follows stances/orders, defends/heals/shields/uses offensive abilities, retreats at critical HP and reserves ultimates for the player. Extended the existing grounded companion controller to three independent species runtimes, formation following and dash movement. Squad UI and HUD show actual health, roles, cooldowns, charge and collection status. Configurable bindings preserve E/F interaction. Repeatable practice targets enable training and multiple-target ability checks without coins or original mission rewards.

Version-1 saves without squad state derive defaults from the existing active companion, retaining progression and existing cooldowns. Explicit new state is validated; invalid disk records are preserved. Combat uses the existing checkpoint revision queue and quest defeat projection. See SAVE_MIGRATION.md. Broader level-25 progression and every Phase 2+ system remain pending.

Validation is recorded in TESTING.md, including the final browser results and measured software-renderer limitations. Phase 2 has not been started.

## Mobile-first UI redesign

Replaced the persistent bottom navigation and mobile utility row with a side drawer. Mobile companion information is collapsed and its ability tray opens beside the joystick. Added semantic action/ability states, a tracked mission summary with cycling and journal tracking, map marker filters, UI scaling, readable dialogue/menus, prioritized/coalesced notifications and focus trapping. Building controls replace combat actions while using the existing placement path. World geometry, gameplay transactions and adventure Save version 1 remain unchanged. No later Living World gameplay phase was started. See UI_REDESIGN.md and TESTING.md for actual behavior and validation.

## HUD minimization, world-name clarity and early treasure recovery

Added remembered whole-status-HUD and individual quest-tracker minimization. Replaced low-resolution/scaled world-label textures with native fixed-size text and bounded collision-aware placement. Reconciled previously opened treasure into the forest-secret mission, including already-stuck saves, without replaying loot. All 116 logic tests pass; seven focused browser checks pass, and both new recovery/minimization scenarios passed again after final label placement. Build and TypeScript pass. Existing saves need no new game.

## Villager movement, work and rest

Replaced the five fixed villagers with daily work/errand/home/rest routines. Grandpa Moss tends plants, Foxy sorts supplies, Bruno hammers timber, Luna studies creatures, and Bloop brews remedies. Added visible workplaces, independent held tools and work poses, walking gaits, door-opening home entry, beds and warm occupied-home windows. Evening departures and morning returns are staggered within the existing twelve-minute active-play day.

Shared positions now drive NPC bodies, click-to-talk navigation, nearby interaction, map markers, mission destinations and trading. Resting villagers can be reached by knocking at their home; dialogue and rewards remain available. Routines resume from the existing saved clock and pause with menus/dialogue. Existing save version, NPC IDs, quests, inventory and companion systems are retained. No settlement production or economy expansion was added.

## Quiet HUD and doorstep conversations

Reworked the phone HUD around the supplied reference: cream status cards/hotbar, forest menu/map controls, and four rounded action petals. Detailed quests, pause and HUD visibility controls are available through on-demand controls and the side menu. The play view shows one mission arrow and only the current nearby object's sharp name. Routine notifications are suppressed; important progression, blocked actions and save failures remain visible. Injected Netlify badge handling is tested locally.

Added an explicit Knock action shared by desktop/mobile interaction and the doorway button. Residents stand, open their door and walk outside before dialogue starts. Repeated knocks cannot restart the approach. Temporary visits return to the original routine and require no save migration.

## Mission 9 construction and mission-flow audit

Added Wall/Roof/Gate tools with roof height, gate floor/orientation and a 24-block starter-home outline/commit flow. Gate opening has real animated collision and saved state; roof/wall cutaways preserve the normal camera distance inside. Shelter checks now recognise larger rooms and raised floors while retaining old cube houses and rejecting incomplete enclosures. Starter placement validates and charges atomically; removal refunds the saved item and clears obsolete interaction flags.

Audited all ten missions and expanded permanent-objective recovery, delivery/reward safeguards, stable journal numbering and live shelter checklists. Repeatable gather/craft objectives keep their original timing and now explain it in guidance. MISSION_AUDIT.md records each flow, changes and compatibility limits. Existing item IDs, version-1 saves and quest rewards are retained.

## Reference name plates and repeatable monster meadow

Replaced dark world tags with cream, moss-bordered reference plates. The player has a compact name/status dot; the active companion has a portrait, level, live HP bar and pointer. Added projected-body and tag-spacing rules to keep names near their models in Classic and Isometric. Distant NPC/object labels remain hidden.

Added Monster Meadow east of the homestead: a fenced entrance, readable guide sign/map marker/menu guide, three original roaming monster variants, visible attack warnings, combat rewards, collectible material pouches and active-time respawns. Reused squad abilities/roles, shields, healing, actual-ground movement and persistence. Loot collection is atomic and once-only, full bags retain their pouch, and village/story encounters are preserved.

### Mobile construction action dock

Added a direct Build action beside the primary combat controls, reduced circular buttons, and a construction-only dock at the same lower-right location. Reuses the existing building logic and starter-home preview without changing save data, building unlocks, material costs or mission requirements.
