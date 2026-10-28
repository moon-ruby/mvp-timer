# MVP Timer

Ragnarok Online MVP / mini-boss respawn tracker with **shared timers** so a party can hunt together.

- 155 MVPs + 19 mini-bosses with per-map respawn windows (data from the SovereignRO MVP Tracker)
- Timer states: counting down → **Spawn possible** (min–max window) → **Spawned**
- Kill time: just now, N minutes ago, tomb time (HH:MM), or unknown
- Tomb marker on the map, notes, favorites, drag & drop ordering
- Sound alerts (8 synthesized sounds, volume, repeat, per-MVP override) + desktop notifications
- Backup / restore JSON, reset, installable PWA
- **Shared rooms** via Supabase: create a room, send the invite link, everyone sees the same timers live

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static files in dist/
```

Without Supabase keys the app runs in local mode (timers saved in this browser only).

## Supabase setup (shared rooms)

1. Create a project at https://supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Project Settings → API: copy the Project URL and the `anon` public key.
4. `cp .env.example .env.local` and fill in both values, then restart `npm run dev`.

Rooms have no login: anyone with the invite link can view and edit that room's timers.
The room code is sent as an `x-room-id` header and row-level security only returns rows for that
room, so the public anon key cannot list other rooms.

## Deploy

`npm run build` and host `dist/` on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's build environment.
Desktop notifications need https (or localhost).
