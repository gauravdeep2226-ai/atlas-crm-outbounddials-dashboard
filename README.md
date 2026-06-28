# The Atlas HQ — Call Engine Dashboard

A single-page outbound-dialing cockpit for cold-calling home-services trades in
St. John's, NL. Reads a live prospect list from a Google Apps Script backend,
logs call outcomes straight back to the Google Sheet, and shows a funnel +
90-day projection.

Built with **Vite + React + TypeScript**, plain CSS (no UI framework). Deploys
cleanly to Vercel as a static SPA.

## Run locally

```bash
npm install
cp .env.example .env   # then fill in the real API URL + token
npm run dev
```

Open the printed `localhost` URL. The list loads live from the Sheet; status /
notes / callback-date changes write straight back.

## Environment variables

| Var              | What                                              |
| ---------------- | ------------------------------------------------- |
| `VITE_API_URL`   | Apps Script Web App `/exec` URL                   |
| `VITE_API_TOKEN` | Shared token sent on every request                |

Set these in **`.env`** for local dev and in **Vercel → Project → Settings →
Environment Variables** for production. They are never hardcoded; `.env` is
gitignored.

## How writes work

The Apps Script Web App doesn't answer CORS preflight, so writes are sent as
`POST` with `Content-Type: text/plain` (Apps Script still parses the JSON body
from `e.postData.contents`). See [`src/api.ts`](src/api.ts).

Writable fields only: `status, last_contact, next_action, next_date, notes,
call_log`. The backend auto-stamps `last_contact` when status leaves
"Not called".

## Data is dynamic

`count` and `rows` change every request (a weekly bot appends prospects; new
cities/verticals arrive later). Nothing is hardcoded — counts, filters, and
headers all derive from the live response.

## Deploy to Vercel

1. New Vercel project from this repo (separate from the marketing site).
2. Framework preset: **Vite**. Build `vite build`, output `dist` (auto-detected).
3. Add `VITE_API_URL` and `VITE_API_TOKEN` env vars.
4. Deploy. Confirm: list loads, a status change updates the Sheet cell, a refresh
   shows it persisted.

## The funnel is local

Today's Dials / Conversations / Demos counters and the saved-day history live in
the browser (`localStorage`), **not** the Sheet. The Sheet is only the prospect
pipeline.
