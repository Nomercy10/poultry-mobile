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
npm start
```

- **Laptop:** press `w` to open it in the browser.
- **Phone:** install **Expo Go**, join the same Wi-Fi as the laptop, and scan the QR code. The app finds the backend at your laptop's IP automatically; the login screen shows which server it's using. If macOS asks whether Node may accept incoming connections, allow it, or the phone can't reach port 4000.
- **Development build (Android):** install it from the link on the Expo build page, then run `npm run start:dev` instead of `npm start`. It works like Expo Go but is our own app, so it can use native libraries Expo Go lacks. Build a new one with `npx eas-cli@latest build -p android --profile development`.
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

**M1, part 2 (Simple mode and languages) is done:**
- **Languages:** English, Hindi and Marathi.
  - A first-launch language picker: tap a language to hear it, before login.
  - The language can be changed any time and applies instantly.
  - Hindi and Marathi are drafts that need a native speaker's review.
- **Simple mode:**
  - It is the default for workers, for example `worker@poultryfarm.com`.
  - Big picture tiles, one question per screen, voice prompts (text-to-speech for now), counting in trays and bags, a picture review, then save with a 10-second Undo.
  - Flows: eggs, dead birds, feed used, vaccine given.
- **Settings:** owners and workers can switch between Simple and Detailed (More → Account, or Me in Simple mode). The choice is saved per user on the phone.

**M2, part 1 (Money basics) is done:**
- **Money screen** (More → Money, or Quick add): sales, expenses and profit or loss for each month, with the biggest costs shown first.
- **Sales:** eggs, birds, manure or other. You choose the unit (tray or egg, kg or bird, bag or trolley), and the price of the last sale is filled in for you. A sale can be paid, part paid or not paid.
- **Dues:** what each customer owes, grouped by age (up to 30 days, 31–60 days, over 60 days). You can record a payment, or send a reminder on WhatsApp that you then send yourself. Automatic reminders are shown as a Pro feature.
- **Expenses:** 12 categories, payment mode, who was paid (with supplier suggestions), GST and bill number.
- **Customers and suppliers:** a list, plus add and edit.
- **Simple mode:** a Sale tile (what, how many, price for one, paid or later, then save with Undo). It shows only for people allowed to record sales.
- The backend has no columns yet for the amount paid on part-paid sales or for the unit. The app keeps both as plain first lines in the sale's notes (`Paid so far: ₹500`, `Unit: TRAY`) until the backend change in M4.

**M2, part 2 (smart finance) is built** (Money → Plan ahead):
- **Cash forecast** (Pro): cash for the next 30, 60 and 90 days, from the last 60 days of money in and out plus dues up to 60 days old. Warns when cash may go below zero.
- **Feed plan**: days of feed left for each feed (Free). Pro adds when to order, how much and the likely cost.
- **Late payers** (Pro): customers with two sales unpaid for over 30 days, or one for over 60, are flagged.
- **Credit limits** (Pro): an optional limit per customer, shown on the customer screen, with a warning on a sale that goes over it.
- **Renewals** (Free up to 3, Pro unlimited): licences, pollution-board consent, insurance, loan EMIs and vehicle papers, with reminders shown in the app.
- **Tax pack** (Pro): a financial year's totals and a CSV for the CA.

Renewals and credit limits need the web repo's `renewals-credit-limits` backend change. Until it is deployed, the Renewals screen says a server update is needed and credit limits aren't saved. Reminders show inside the app only; phone notifications come with push in M4.

**Next:** 30-day trends.

Moving the code and accounts to the company later is planned in [docs/moving-to-company-accounts.md](docs/moving-to-company-accounts.md).
