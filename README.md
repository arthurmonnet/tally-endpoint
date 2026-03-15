# Tally Endpoint

Receives daily developer stats from the [Tally](https://github.com/arthurmonnet/Tally) macOS app and serves them as JSON via [Vercel KV](https://vercel.com/docs/storage/vercel-kv).

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/arthurmonnet/tally-endpoint&env=TALLY_API_TOKEN&envDescription=Secret+token+for+Tally+app.+Pick+any+random+string.&envLink=https://github.com/arthurmonnet/tally-endpoint%23setup&project-name=tally-endpoint&repository-name=tally-endpoint)

## Setup

1. Deploy to Vercel (button above) or clone and `vercel deploy`
2. Add a **Vercel KV** store in your project dashboard (Storage → Create → KV)
3. Set `TALLY_API_TOKEN` in your Vercel env vars — any random string works
4. In the Tally app, paste your deployed URL and the same token

## API

All endpoints require `Authorization: Bearer <token>`.

### `POST /api/tally`

Push daily stats.

```bash
curl -X POST https://your-app.vercel.app/api/tally \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 2,
    "date": "2026-03-15",
    "keystrokes": 12450,
    "clicks": 3200,
    "copy_paste": 85,
    "screenshots": 3,
    "cmd_z": 42,
    "launcher_opens": 15,
    "app_switches": 230,
    "scroll_distance_m": 120.5,
    "mouse_distance_m": 45.2,
    "dark_mode_minutes": 360,
    "light_mode_minutes": 120,
    "top_apps": [{"name": "VS Code", "minutes": 180}],
    "files_created": {"ts": 5, "json": 2},
    "files_deleted": 1,
    "git_commits": 8,
    "git_stashes": 1,
    "peak_ram_gb": 12.4,
    "active_hours": 6.5,
    "achievements_unlocked": ["keystroke_10k"],
    "fun_line": "You mass-deleted 3 files today.",
    "peak_windows": 12,
    "avg_windows": 6
  }'
```

**Responses:**

| Status | Body |
|--------|------|
| `200` | `{"ok": true}` |
| `400` | `{"ok": false, "error": "Invalid JSON"}` |
| `401` | `{"ok": false, "error": "Unauthorized"}` |
| `422` | `{"ok": false, "error": "Validation failed", "details": {...}}` |
| `500` | `{"ok": false, "error": "Storage error."}` |

### `GET /api/tally`

Retrieve stats.

```bash
# Latest day
curl https://your-app.vercel.app/api/tally \
  -H "Authorization: Bearer your-token"

# Specific date
curl "https://your-app.vercel.app/api/tally?date=2026-03-15" \
  -H "Authorization: Bearer your-token"
```

| Param | Description |
|-------|-------------|
| `?date=YYYY-MM-DD` | Specific day |

**Responses:**

| Status | Body |
|--------|------|
| `200` | The stats object |
| `400` | `{"ok": false, "error": "Invalid date format. Use YYYY-MM-DD."}` |
| `401` | `{"ok": false, "error": "Unauthorized"}` |
| `404` | `{"ok": false, "error": "No data yet"}` |

## Self-hosting

```bash
git clone https://github.com/arthurmonnet/tally-endpoint
cd tally-endpoint
npm install
cp .env.example .env.local  # fill in your values
npm run dev
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `TALLY_API_TOKEN` | Secret token (must match Tally app setting) |
| `KV_REST_API_URL` | Auto-set by Vercel KV |
| `KV_REST_API_TOKEN` | Auto-set by Vercel KV |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
