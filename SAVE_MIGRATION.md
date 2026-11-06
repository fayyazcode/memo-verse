# Phase 1 save compatibility

Storage remains IndexedDB `momoverse` version 1, object store `saves`, key `adventure`. Adventure `version: 1`, revision checks and the serialized checkpoint queue remain unchanged. No destructive migration, reset or new-game requirement is introduced.

`Save.squad` is an additive optional field. Old saves without it are validated by the original rules. `squadOf(save)` derives an equipped singleton from `save.active`, retains its existing basic/Q cooldowns, and defaults to defensive/follow with empty charge, shields, areas and switch timer. Starting an adventure attaches those defaults and checkpoints through the existing revision transaction. Original position, HP, XP, creatures (HP, XP, friendship), quests, coins, inventory, hotbar, flags, nodes, discoveries and blocks are preserved. Reading/validating a legacy object does not mutate it.

New squad state stores membership (max three), stance/order/target, switch cooldown, per-creature basic/Q/E/R cooldowns, charge, shields, passive counters, bounded area effects, Guardian displacement/stun/taunt and practice-target HP/recovery. `active` remains the directly commanded equipped creature. Cooldowns use remaining active-play seconds; closing/reloading or pausing cannot clear them or produce offline training. Animation intent and projectile visuals remain transient.

Explicit squad fields are validated for ownership, duplicate membership, limits, valid targets/positions, worker reservations, finite bounded cooldowns/charge/shields, and area budgets. Malformed explicit expansion data throws an error and leaves the existing disk record untouched. Unsupported adventure versions are still rejected and preserved. Conflicting revisions still fail instead of overwriting another session. `saveData` remains the raw low-level test/seeding helper; normal gameplay uses `persist`.

No cloud accounts or cloud revision service exist. Conflict tests cover local IndexedDB sessions/tabs. Browser settings (including bindings and camera/outfits) remain separate localStorage preferences.

Automated coverage includes representative old saves, unchanged legacy progress, new serialization with shields/cooldowns/charge, invalid stored squads left untouched, rapid checkpoints, stale revisions, and browser save/reload after real squad actions.
