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
