# Poultry Mobile

Android + iOS app for the Poultry Farm Management System (web: poultry.rushikeshmhetre.com, repo: `poultry-farm-management`).

Built with Expo (React Native, TypeScript). It talks to the web app's existing `/api/v1` backend. Offline entry comes in stage 2.

- **Plan, UI spec and architecture:** [docs/mobile-app-plan.md](docs/mobile-app-plan.md)
- **Mobile OTP login (planned):** [docs/auth-otp.md](docs/auth-otp.md)

## Run it locally with demo data

You need Node 20+ and the web repo checked out next to this one (`../claude`, or set `WEB_REPO=/path/to/poultry-farm-management`).

**1. Start the backend on a local demo database** (leave it running in its own terminal):

```bash
npm run backend:demo
```

This starts a throwaway Postgres on port 5433 (via the `embedded-postgres` npm package; nothing is installed system-wide), creates and seeds it on the first run, then runs the web backend on port 4000 against it. It never touches the web repo's `.env` or the real database: it refuses to migrate or seed unless Prisma confirms it's pointed at the local demo database. `npm run backend:demo:reset` wipes the demo data and re-seeds it.

Log in with the seeded demo accounts listed in the web repo's README (admin and worker), or with the two **plan demo accounts** the script creates:

| Account | Plan | What it shows |
| --- | --- | --- |
| `free@demo.test` | Free | 1 farm, 2 active batches, 12 months of history, paid features locked |
| `pro@demo.test` | Pro | No batch limit, batch performance unlocked |

Their passwords are generated on first run and saved to `tools/demo-backend/.demo-logins.txt` (git-ignored). The admin and worker accounts behave as Business. Plans are applied by the app until the backend stores them (M5); see [docs/native-build-plan.md](docs/native-build-plan.md).

**2. Start the app:**

```bash
npm install
npx expo start
```

- **Laptop:** press `w` to open it in the browser.
- **Phone:** install **Expo Go**, join the same Wi-Fi as the laptop, and scan the QR code. The app finds the backend at your laptop's IP automatically; the login screen shows which server it's using. If macOS asks whether Node may accept incoming connections, allow it, or the phone can't reach port 4000.
- **Other backends:** set `EXPO_PUBLIC_API_URL` in `.env`, e.g. `EXPO_PUBLIC_API_URL=https://<railway-url>/api/v1`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

CI runs all three on every pull request (`.github/workflows/ci.yml`).

## Status

**M0 (Shell) is done:** design tokens (the web's amber brand, light and dark), UI components, an API client with token refresh, email login, forgot password, session restore and logout, and tabs and menus that follow each user's permissions. The Home screen shows the dashboard and has a farm switcher. Phone OTP login is built but switched off until the backend supports it.

**M1, part 1 (Daily operations) is done:**
- Home: a Today checklist (eggs, feed used, vaccinations due, low feed).
- Eggs: daily entry with tray steppers and the stock ledger.
- Batches: list, detail, deaths, weight, medicine, vaccines, notes, status changes and the vaccination schedule.
- Feed: purchases, daily use and low-stock warnings; inventory summary.
- Quick add now opens each of these forms.
- Plans: Free, Pro and Business limits and locked features, plus a read-only plans screen with no payment.

**Next is M1, part 2:** Simple mode (picture tiles and voice prompts for workers), Hindi and Marathi, and 30-day trends. Sales and expenses come in M2.

Moving the code and accounts to the company later is planned in [docs/moving-to-company-accounts.md](docs/moving-to-company-accounts.md).
