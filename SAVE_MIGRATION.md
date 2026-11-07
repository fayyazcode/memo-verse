# Phase 1 save compatibility

Storage remains IndexedDB `momoverse` version 1, object store `saves`, key `adventure`. Adventure `version: 1`, revision checks and the serialized checkpoint queue remain unchanged. No destructive migration, reset or new-game requirement is introduced.

`Save.squad` is an additive optional field. Old saves without it are validated by the original rules. `squadOf(save)` derives an equipped singleton from `save.active`, retains its existing basic/Q cooldowns, and defaults to defensive/follow with empty charge, shields, areas and switch timer. Starting an adventure attaches those defaults and checkpoints through the existing revision transaction. Original position, HP, XP, creatures (HP, XP, friendship), quests, coins, inventory, hotbar, flags, nodes, discoveries and blocks are preserved. Reading/validating a legacy object does not mutate it.

New squad state stores membership (max three), stance/order/target, switch cooldown, per-creature basic/Q/E/R cooldowns, charge, shields, passive counters, bounded area effects, Guardian displacement/stun/taunt and practice-target HP/recovery. `active` remains the directly commanded equipped creature. Cooldowns use remaining active-play seconds; closing/reloading or pausing cannot clear them or produce offline training. Animation intent and projectile visuals remain transient.

Explicit squad fields are validated for ownership, duplicate membership, limits, valid targets/positions, worker reservations, finite bounded cooldowns/charge/shields, and area budgets. Malformed explicit expansion data throws an error and leaves the existing disk record untouched. Unsupported adventure versions are still rejected and preserved. Conflicting revisions still fail instead of overwriting another session. `saveData` remains the raw low-level test/seeding helper; normal gameplay uses `persist`.

No cloud accounts or cloud revision service exist. Conflict tests cover local IndexedDB sessions/tabs. Browser settings (including bindings and camera/outfits) remain separate localStorage preferences.

Automated coverage includes representative old saves, unchanged legacy progress, new serialization with shields/cooldowns/charge, invalid stored squads left untouched, rapid checkpoints, stale revisions, and browser save/reload after real squad actions.

## Early forest treasure repair

Version-1 saves may already contain the durable `chest` flag while the active Hidden Forest Secrets mission lacks its chest objective. Validation now returns a reconciled copy with that objective credited. The original input/disk record is untouched during reads; normal start/checkpoint persistence saves the repaired progress through the existing revision queue. Accepting the mission after opening the chest also credits it, and interacting with an already-open chest can reconcile stale runtime progress. This never replays treasure coins/items, never claims the mission reward automatically, and leaves completed missions alone. Unopened chests and resource-gathering objectives are not backfilled.

## Villager routines

Villager activity is derived from the existing active-play `playTime`. There are no new save fields or storage changes. Loading an old adventure immediately reconstructs each villager's work, commute or rest state; menus/dialogue and time spent away do not advance the routine. NPC identifiers, dialogue/quest state, rewards, inventory and trades retain their original save representation.

## Quiet HUD and doorstep visits

Browser settings use `hudStyleVersion: 2` to adopt a compact mission tracker once. Players can expand it again and retain their choice. Adventure saves stay at version 1. Knock visits and their brief routine delays are transient; loading reconstructs the normal saved-time routine. Conversations and quest rewards keep their existing IDs and persistence paths.

## Roofs, gates and mission recovery

`Save.blocks` retains existing item IDs. Optional `part: 'roof' | 'gate'` and `rotation: 0 | 1` metadata distinguish wooden roof panels and gates; absent metadata renders/validates the original cube. Gate opening uses `open:gate:x:y:z` in the existing flags list. Roof/gate pieces each cost and refund one wooden block. The validator checks metadata, plot/height limits and a gate's two-cell headroom; invalid data does not reset the save.

Loading now projects recorded discoveries, owned companions, utility flags, repair/Guardian flags, the chest flag and a valid existing shelter into active mission progress. This returns a reconciled copy without replaying materials, currency, creature XP or mission rewards. Repeatable gather/craft counters retain their after-acceptance semantics. Save/DB versions, quest IDs and once-only claims remain unchanged.

## Monster Meadow

Optional `Save.squad.hunting` stores three monsters' HP, bounded positions, attack cooldowns/warnings, remaining respawn timers and uncollected loot flags. `squadOf` supplies defaults for old squads without mutating the input. Explicit malformed hunting state is rejected through the existing validation path. New target IDs are `hunt0`–`hunt2`; adventure and IndexedDB versions, inventory items and story IDs remain unchanged.

Coins/XP are granted only on a living-to-defeated transition. Material pouches are collected by one inventory transaction; full bags leave them intact, and respawn waits for collection. Timers follow active simulation time, retaining existing menu/background pauses and checkpoint/revision behaviour. Reloading cannot replay a defeat or bypass a pending pouch. Guardian rewards and mission gather/defeat events remain separate.

Player equipment adds optional `weapon: 'sword' | 'bow'` to version-1 saves. Missing equipment defaults to sword without mutating validation input. Both weapons are part of the adventure kit and consume no inventory slots, so old full bags remain valid. Explicit invalid weapons are rejected. Weapon selection persists; cooldowns retain their existing saved field. In-flight arrows and drawn-item state are transient and are not serialized.
