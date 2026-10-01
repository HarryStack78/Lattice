# Lattice Admin

A standalone admin panel for the Lattice website. It is a separate app: it shares no code with the
site itself, but both read and write the same Supabase project (Postgres + Storage + Auth).

## Run it

```bash
cd Lattice_CMS
npm install
npm start          # or: node server.mjs
```

Open http://localhost:4000 and sign in with a Supabase Auth account that's listed in the
`admin_users` table. Accounts are managed in Supabase directly (Authentication → Users to create
one, then add a matching row to `admin_users`); there's no self-serve signup in the admin UI.

## What it edits

| Admin section    | Website                                                       |
| ---------------- | ------------------------------------------------------------- |
| Site & SEO       | Browser title, search description, link-preview details       |
| Navigation       | Header menu links and button                                  |
| Hero             | Headline, intro, labels                                       |
| About & Services | Manifesto, scrolling banner, services list                    |
| Selected Work    | Case studies (add / reorder / delete, colours, full write-up) |
| Team             | Founder, co-founders & members: photo, bio, quote (founders), social links, enable/reorder |
| Contact          | Heading and email                                             |
| Footer & Social  | Copyright, social links                                       |
| Media library    | Uploaded images (Supabase Storage, `media` bucket)             |
| Backups          | Restore any of the last 50 saved versions                     |

Saving writes to the `site_content`, `projects` and `team_members` tables in Supabase. A snapshot of the previous
version is kept in `content_backups` on every save (pruned to the most recent 50 automatically).

## Going live

The website reads from Supabase on every request and revalidates its cache every 60 seconds
(`export const revalidate = 60` in `app/page.tsx`), so saved changes show up on their own — no
rebuild or redeploy needed.

## Settings (`.env`)

| Key                        | Meaning                                                |
| --------------------------- | ------------------------------------------------------ |
| `SESSION_SECRET`            | Signs login cookies (generated automatically)          |
| `SUPABASE_URL`               | The Supabase project's API URL                         |
| `SUPABASE_PUBLISHABLE_KEY`   | The Supabase project's publishable (anon) key           |
| `SITE_URL`                  | Address for the "View live site" link                  |
| `PORT`, `HOST`               | Default `4000` on `127.0.0.1` (local only)              |

## Security notes

- Listens on localhost only. To use it from elsewhere, put it behind HTTPS (e.g. a reverse proxy)
  and set `HOST` deliberately. Don't expose it over plain HTTP.
- Auth is Supabase Auth (email/password); only accounts listed in the `admin_users` table can sign
  in here, and every read/write runs as that signed-in user so Postgres row-level security is the
  real enforcement, not just this server's own session check.
- Sessions are signed, HTTP-only, SameSite=Strict cookies (12 h) holding the admin's Supabase
  session tokens; failed logins are rate limited.
- Uploads are limited to real PNG/JPG/WebP/GIF/AVIF images up to 8 MB (enforced here and again by
  the Storage bucket's own limits).
