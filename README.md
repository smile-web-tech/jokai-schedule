# Jokai Schedule

Chore schedule for our flat: weekly and monthly view, rotation between flatmates, ticks and notes.

Built with SvelteKit + Svelte 5, plain CSS, and Postgres. Tables are created automatically on first request.

## Deploy on Vercel

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com): **Add New → Project** → import the repo. SvelteKit is detected automatically.
3. In the project: **Storage → Create Database → Neon (Postgres)**. Pick the region closest to you and connect it to the project. This adds `DATABASE_URL`.
4. **Settings → Environment Variables**: add `FLAT_PASSCODE` (shared passcode for the flat). Leave it out to keep the site open.
5. **Settings → Functions → Function Region**: choose the same region as the database.
6. **Deployments → Redeploy** so the new variables are picked up.

## Run locally

```sh
npm install
cp .env.example .env   # fill in DATABASE_URL (a Neon branch or any Postgres)
npm run dev
```

## How it works

- **Flatmates**: their order in Settings drives the rotation.
- **Chores** are on **set days** (unticked days turn into ✗ once the day is over) or **anytime** (never counted as missed).
- **Who**: everyone, or N people per turn. With 4 people and 2 per turn, the 1st & 2nd do week one, the 3rd & 4th week two, and so on. **Next turn** moves the rotation along by one.
- Tap any cell to mark it done / not done and add a note. Automatic ✗ can be changed the same way.
