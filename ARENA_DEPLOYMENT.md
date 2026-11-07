# Versus Arena

The arena supports both **Quick Match** (public waiting queue) and **private 1-vs-1 rooms**. Open Menu → Versus Arena. Pick an arena name, find an opponent or share a seven-character room code, then both players press Ready. Matches last up to three minutes. Players have equal 100 HP and sword/bow loadouts; adventure levels, items and coins are not transferred. Both players can request a rematch after a round.

Move with WASD/arrows or the touch joystick, hold H/Space or Attack to fight, and use G/the weapon button to switch. Sword hits require close range; bow arrows travel in straight lines and can be dodged. Leaving a live match forfeits. A dropped connection pauses the duel for up to 15 seconds; reloading the same tab can resume the fighter using its private session token.

## Run locally

Requires Node 24 (or a compatible maintained Node release) and the repository dependencies:

```sh
npm ci
npm run arena:build
npm run arena:start
```

In a second terminal:

```sh
npm run dev
```

Open `http://localhost:3000` in two independent browser profiles/devices and enter the arena. On localhost/127.0.0.1, the frontend discovers `ws://<hostname>:3020/arena`. For LAN testing, bind the backend using `ARENA_HOST=0.0.0.0`, allow the exact frontend origin with `ARENA_ALLOWED_ORIGINS`, and build the frontend with the reachable `NEXT_PUBLIC_ARENA_URL`. Never use localhost as the server address for players on other devices.

## Enable the live Netlify site

Netlify serves the Next.js frontend. The arena also needs a **running WebSocket server**; a function or an in-memory Next.js route cannot host these rooms reliably.

1. Deploy the included `render.yaml` blueprint from this GitHub repository, or run `npm run arena:build` followed by `npm run arena:start` on another Node host supporting WebSocket upgrades. The blueprint requests Render's free plan. No hosting service has been provisioned automatically.
2. Configure `ARENA_ALLOWED_ORIGINS` to the exact frontend origins, separated by commas. The blueprint includes `https://momoversee.netlify.app`; add a custom domain or approved preview origin if needed. Set `ARENA_HOST=0.0.0.0`. The host supplies `PORT`.
3. Verify the public `https://<arena-host>/health` returns `{"ok":true}` and that the host forwards `/arena` WebSocket upgrades with TLS.
4. Set Netlify's build environment variable `NEXT_PUBLIC_ARENA_URL=wss://<arena-host>/arena` and rebuild/redeploy the frontend. This public URL is bundled at build time; it is not a secret.
5. Test Quick Match and a private room from two separate browsers/devices on the actual production origin.

Until that endpoint is configured, production pages explain that the online arena is unavailable. Local testing does not establish a live Netlify multiplayer connection.

## Hosting behavior

Run **one arena instance** for this version. Rooms, the public queue and guest sessions are kept in memory. A server restart expires them. Free hosts can sleep/restart and have service limits; they do not provide an always-on matchmaking guarantee. Scaling to several workers requires a shared room/queue coordinator and routing sessions to their owning simulation; independent instances must not be placed behind random load balancing.

The server accepts commands, not client HP, position snapshots, levels or rewards. It simulates bounded movement, collisions, damage, projectiles, cooldowns, timeouts, disconnects and results at 20 Hz, with snapshots at 10 Hz. Private reconnect tokens are returned only to their owning socket and stored in sessionStorage, never in public room snapshots or adventure saves. Origins, message sizes, connection counts, input rates and replayed movement sequence numbers are checked. Guest arena names are display names, not verified accounts. These are unranked duels; there is no currency payout, leaderboard, chat or account persistence.
