# MomoVerse

An original single-player browser creature adventure. Explore a procedural village and forest, help five villagers, collect four companions, gather, craft, build, and restore a forest passage.

## Run

Requires Node.js 24 (validated with 24.22.1) and npm 11.

```sh
npm ci
npm run dev
```

Open the development server in a desktop browser with WebGL 2. No external credentials are required for guest play. `npm run build` creates the production build; `npm start` runs it. The cloud execution sandbox may require elevated execution for registry access, binding the server port, browser launch, and Next.js build subprocesses.

```sh
npm run typecheck
npm test
npm run test:e2e
```

Start the development server before running browser tests. See [TESTING.md](TESTING.md) for browser prerequisites and coverage.

## Play

Click the ground to move. Click a villager, creature, resource, or station to approach and interact automatically. WASD immediately overrides a click destination. Blocked routes stop with guidance rather than walking through obstacles. The default camera is raised and pulled back for a smaller character and a wider view.

WASD move; Shift sprint; Space jump; hold right mouse to rotate camera. E interacts, F gathers, I opens inventory, J journal, C creatures, M map, V companion commands, B building, Q elemental attack, and Esc pause. Left click attacks the nearby Guardian. In build mode left click places, right click removes, and holding middle mouse rotates the camera. Select hotbar slots with 1–6 or the wheel.

Start with Grandpa Moss, northwest of your spawn. Accept his mission, meet Foxy and Bruno, and return for your reward. The journal records all prerequisites and objectives. Craft at Bruno’s bench. Quest deliveries and reward claims are explicit dialogue actions.

To construct a starter shelter, leave an empty interior cell, build three surrounding walls two blocks high, cover the interior at height 2, and leave a two-block-high doorway with an unobstructed approach. At least 12 placed structural blocks are required. Extra roof/wall blocks can reach that minimum. Building blocks must attach to the ground or another block.

Guest progress autosaves to IndexedDB after transactions and every 15 seconds. Save and Quit confirms a successful checkpoint before returning to the title. Do not clear browser storage if you want to retain progress.

## Status and limits

This is an early, playable **guest-mode implementation**, not the completed production MVP. Cloud accounts, PostgreSQL/Drizzle persistence, import conflict UI, richer terrain, full animation polish, and comprehensive cross-browser/performance qualification remain unfinished. Character reference images were not attached; the current character is an original procedural approximation based on the written description.

See [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md), [GAME_DESIGN.md](GAME_DESIGN.md), and [ARCHITECTURE.md](ARCHITECTURE.md). The approved source specification is preserved in [docs/MOMOVERSE_SPEC.md](docs/MOMOVERSE_SPEC.md).
