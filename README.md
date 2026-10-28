# ORIGIN — Full-Stack Website

Your original `index.html` is unchanged (visuals, animations, easter eggs). The only edit is one
`<script src="/api-client.js">` tag before `</body>`. That script connects the page to a real backend.

**Stack:** Node.js + Express + SQLite (better-sqlite3). No build step.

## Run
```bash
npm install
cp .env.example .env      # then set values, or export them in your shell
ADMIN_PASSWORD=your-password npm start
```
Site: http://localhost:3000 · Admin: http://localhost:3000/admin
(Needs Node 22.x. The database file is created at `data/origin.db` and seeded on first start.)

## What is now real
| Feature | Before | Now |
|---|---|---|
| Join / application forms (hero + modal) | fake success | saved to DB, validated, duplicate-email check, real transmission ID |
| Newsletter | fake | saved to DB |
| ORI assistant | hard-coded in browser | answered by `/api/ori`, every question logged (see unanswered ones in admin) |
| Stats, leaderboard, team, missions, gallery | hard-coded | loaded from DB (editable) |
| Admin dashboard `/admin` | — | review applications + set status, export CSV, subscribers, edit stats, award XP, post to feed, ORI log |

If the API is down, the page still renders exactly as the original static version.

## API
Public: `GET /api/stats|projects|team|leaderboard|gallery|timeline|missions|feed`,
`POST /api/applications`, `POST /api/newsletter`, `POST /api/ori`.
Admin (Bearer token from `POST /api/admin/login`): applications, subscribers, ori-log, stats, leaderboard, feed, CSV export.

## Files
- `server.js` routes, validation, rate limiting, admin auth
- `db.js` schema · `seed.js` initial content (`npm run seed` resets content tables; applications are kept)
- `public/index.html` your site · `public/api-client.js` front-end ↔ API · `public/admin.html` dashboard

## Deploy
Any Node host (Render, Railway, a VPS) or `docker build -t origin . && docker run -p 3000:3000 -e ADMIN_PASSWORD=... -v origin-data:/app/data origin`.
Set `ADMIN_PASSWORD` and `SESSION_SECRET`; keep `data/` on a persistent volume. Serve over HTTPS.

Vercel runs the API on Node.js 22.x (required by `better-sqlite3`). Its `/tmp` filesystem is temporary, so SQLite data does not persist across function instances or deployments. Use a hosted database if you need persistent applications, subscribers, or admin edits.
