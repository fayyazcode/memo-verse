# Mission flow audit

Scope: all ten existing missions, their prerequisites, permanent actions, deliveries, rewards, construction and save recovery. The full campaign integration test completes the ten missions from a fresh save using actual gather/craft/befriend/utility/build/combat store actions, without granting debug inventory or rewards. Browser checks exercise the corresponding input/UI paths selectively; they do not simulate every possible play sequence.

| Mission | Flow checked | Recovery / safeguards |
| --- | --- | --- |
| 1 · Welcome to MomoVerse | Accept, visit square, talk to Foxy/Bruno, claim and reload | Recorded discoveries recover; repeated talks/claims cannot pay twice. Nighttime residents come outside after a knock. |
| 2 · The Forest Supplies | Gather wood/stone/fiber and deliver to Bruno | Gathering counts after acceptance. Delivery requires the collection objectives and stock, consumes the exact quantities once, and pays only when claimed. |
| 3 · A New Friend | Gather berries, craft a treat and befriend Emberfox | Owned companions recover friendship objectives. Gathering/crafting remain explicit actions after acceptance. Food and inventory failures keep clear feedback. |
| 4 · The Broken Passage | Prerequisites 3/7/8/9, talk to Bloop, power, clear, repair and resolve Guardian | Existing utility, repair and defeat flags now repair stale active-save objectives. No processing materials, utility output or Guardian rewards replay. The finale is intentionally completed after the later prerequisite missions. |
| 5 · Foxy’s Delivery | Accept parcel mission, deliver to Bloop, return and claim | Parcel is represented by the active quest rather than an inventory stack. Delivery progress and completed status prevent duplicate delivery/reward. |
| 6 · The Missing Crystals | Discover clearing, gather five crystals, deliver | Recorded discovery recovers. A pickaxe is required and described in guidance. Delivering before gathering cannot consume stock or advance the mission. |
| 7 · Friends of the Forest | Befriend Aquabub/Mosshell, water moonflower, break tough node | Owned creatures and one-time utility flags recover on acceptance and on loading a stale active save. Fruit/ore/XP from past abilities are not replayed. |
| 8 · The Spark of Adventure | Gather fragments, craft treat, befriend Zaplet, power practice device | Early Zaplet ownership and the powered-device flag recover. Repeatable gathering/crafting remain explicit; the used device cannot award its output again. |
| 9 · Home Sweet Home | Visit plot, craft at least twelve blocks, construct a roofed shelter, claim | Added Wall/Roof/Gate controls and a 24-block starter-home preview. Larger rooms, raised floors and openable gates are recognised. Removing the roof before claiming blocks the reward. Legacy plain-block homes remain supported. |
| 10 · Hidden Forest Secrets | Discover three landmarks and open chest | Existing discoveries/chest flag recover; early treasure is credited without repeating its coins or crystals. Mission reward remains a separate, once-only claim. |

## Corrections

- Build mode previously offered selected-item cube placement without a roof/gate selector. It now exposes wall, roof-panel, gate and starter-home tools, roof height, gate floor and rotation.
- Shelter validation previously recognised only a one-cell interior. It now checks connected roofed headroom, floors, enclosing walls and a clear doorway/approach, supporting larger and raised layouts. Twelve scattered blocks, missing roofs and incomplete walls still fail.
- Starter-home construction validates the complete design before charging or placing anything. Its 24 pieces consume 24 existing wooden blocks; the crafting recipe makes these from 12 wood. A gate uses one block and remains optional for legacy open doorways.
- Gate opening has real animated collision, contextual Open/Close actions and saved state. Click navigation resolves player-built gates and lamps as interaction destinations.
- Removal refunds the actual stored piece, rather than trusting the caller's item. Obsolete gate/lamp flags are removed. The existing 2,048-piece save limit is enforced during placement.
- Active legacy saves now reconcile all provable permanent objectives, extending the existing chest repair. Reading a save does not mutate the supplied object, grant items/XP/coins, or claim rewards.
- Quest help explains repeatable gather/craft timing and the construction controls/costs. Action failures such as missing ingredients, required companions and unready deliveries remain important feedback; routine activity stays quiet.

## Compatibility and limits

Adventure/IndexedDB versions and item/quest IDs remain unchanged. New roofs and gates are existing `block` items with optional `part` and `rotation` metadata; absent metadata means the original cube. Malformed new metadata is rejected without resetting the save. Roofs/gates refund one wooden block each. Construction is still bounded to the original homestead, height and piece limits. The audit does not introduce settlement production, new quests or Phase 2 systems.

The journal now retains each mission's stable number when filtering, and active shelter checkboxes use current house validity instead of stale saved credit. Completed achievements remain completed after later demolition. Indoor camera queries ignore the player's housing ceiling/nearby walls while an interior cutaway keeps the avatar visible, preventing the close-up encountered during the physical entry walkthrough.
