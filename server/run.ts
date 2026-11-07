import { startArenaServer } from './arena-server';
const port = Number(process.env.PORT ?? 3020),
  host = process.env.ARENA_HOST ?? '127.0.0.1';
const origins = process.env.ARENA_ALLOWED_ORIGINS?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid PORT');
const app = startArenaServer({ port, host, ...(origins ? { origins } : {}) });
app.server.on('listening', () => console.log(`MomoVerse arena listening on ${host}:${port}`));
app.server.on('error', (e) => {
  console.error(e.message);
  process.exitCode = 1;
  void app.close();
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
