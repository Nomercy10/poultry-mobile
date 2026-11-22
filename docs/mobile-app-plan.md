# Poultry Farm Manager — Mobile App Plan (Android + iOS)

v2 · Nov 22, 2026 · Rushikesh Mhetre

This version is grounded in the real web app (`Nomercy10/poultry-farm-management`): its Prisma schema, its `/api/v1` routes, its permission model and its screens. It replaces v1, which was written before the web repo could be read and assumed features the web app does not have (phone OTP, sheds, egg grading, sync endpoints). The v1 artifact (https://claude.ai/artifact/7S15kW1mCKEPXHW5WPQbfm) is now out of date.

## Summary

One Expo (React Native, TypeScript) app for Android and iOS that does everything the web app does, designed for a phone in a shed rather than a desk.

It is built in two stages:

1. **Test build (now):** the app talks straight to the existing REST API. It runs on your laptop (web browser or simulator) and on your phone through **Expo Go**, with no store accounts, no native builds and no backend changes beyond one local CORS setting.
2. **Field build (later):** offline entry, push notifications, Marathi / Hindi, and store releases. These need a development build (EAS) and a few backend additions.

Every milestone in stage 1 ends with something you can open and use on your phone.

## What the web app has today (the parity list)

Read from the web repo: 13 permission modules, 18 tables, about 60 endpoints.

| Web module | What it does | Main endpoints | Mobile priority |
| --- | --- | --- | --- |
| Auth | Email + password login, refresh-token rotation, forgot / reset / change password, `/me` with effective permissions | `/auth/*` | M0 |
| Dashboard | 9 stat cards (today's eggs, total / healthy / sick chickens, today's sales and expenses, egg stock, monthly profit / loss) and 4 thirty-day trends; farm filter | `/dashboard/summary`, `/trends`, `/feed-trend` | M1 |
| Chickens | Batches (batch no., breed, purchase date, supplier, counts, age, status, avg weight); events (vaccination, medicine, mortality, weight check, status change, note); vaccination schedule; upcoming vaccinations; export | `/chickens/*` | M1 |
| Egg inventory | One entry per farm per day: morning and evening collection, broken, damaged, sold; running stock ledger; export | `/eggs/*`, `/eggs/stock/:farmId` | M1 |
| Feed inventory | Purchases (type, supplier, qty, unit, cost, low-stock threshold); consumption against a purchase; low-stock list | `/feed/*` | M1 |
| Inventory | Combined egg + feed stock with low / out-of-stock alerts | `/inventory/summary` | M1 |
| Revenue | Egg / chicken / manure / other sales, customer, qty × rate, paid / partial / unpaid, invoice no.; by type; outstanding | `/revenue/*` | M2 |
| Expenses | 12 categories, GST, vendor, payment mode, invoice no., attachment URL; by category | `/expenses/*` | M2 |
| Customers, Suppliers | Contact book with GST numbers | `/customers`, `/suppliers` | M2 |
| Reports | 7 reports (egg production, sales, expenses, profit, mortality, feed consumption, inventory) by farm and date range; CSV / Excel / PDF | `/reports/:type` | M3 |
| Notifications | Low feed, low egg stock, vaccination due, high mortality, outstanding payment; read / read-all | `/notifications/*` | M3 |
| Employees | Staff linked to user accounts, assigned modules | `/employees/*` | M3 |
| Users, Roles | Users CRUD; roles (Admin / Manager / Worker + custom) with a module × action permission matrix; per-user grant / revoke overrides | `/users/*`, `/roles/*` | M3 |
| Settings | Farms CRUD, change password, key-value app settings | `/farms/*`, `/settings/*` | M3 |
| Audit logs | Every create / update / delete with actor and diff | `/audit-logs` | M3 |

**The data model is farm-level, not shed-level.** Eggs are counted per farm per day, and mortality is logged as an event on a batch. The mobile UI follows that model exactly. Sheds, egg grading and breed-standard curves from v1 are listed later as possible additions; they are not parity work.

## Architecture

### Stage 1 — test build (online, Expo Go)

```
 PHONE (Expo Go) / LAPTOP (web, simulator)          EXISTING BACKEND (unchanged)
 ┌───────────────────────────────────┐   HTTPS /   ┌──────────────────────────────┐
 │ Screens (Expo Router)             │   HTTP LAN  │ Express /api/v1              │
 │ Feature hooks (TanStack Query)    │────────────▶│ JWT auth + RBAC middleware   │
 │ API client (fetch + auto refresh) │◀────────────│ Prisma → Postgres (Neon)     │
 │ Auth store (Zustand) + SecureStore│             │ Exports: CSV / XLSX / PDF    │
 │ Query cache persisted to storage  │             └──────────────────────────────┘
 └───────────────────────────────────┘                        ▲ same API
                                                         Web app (Vite)
```

- **No new backend endpoints are needed to start.** The app calls the same `/api/v1` routes as the web app, with the same response shape (`{ success, data, meta }`) and error shape (`{ success: false, message, details }`).
- **Permissions:** `/auth/me` returns the user's effective permissions. The app hides tabs, list actions and buttons with the same `can(module, action)` rule the web uses (`ADMIN` sees everything). The server still enforces everything; the app only hides things.
- **Tokens:** the access token stays in memory. The refresh token goes in `expo-secure-store` on phones and in `localStorage` on web, for testing only. The API client copies the web's behaviour (`frontend/src/lib/api.ts`): on a 401 it refreshes once, shares that one refresh between parallel requests, and retries.
- **Read offline:** the TanStack Query cache is saved to device storage, so the last-loaded dashboard and lists still show without a signal. Saving still needs a connection in stage 1; the app says so clearly instead of failing silently.
- **Only Expo Go-compatible libraries in stage 1**, so nothing needs a native build. That rules out WatermelonDB and SQLCipher for now and settles the earlier database question: stage 1 has no local database.

### Stage 2 — field build (offline-first, dev build)

- **Offline writes through an outbox.** Each save goes into a persisted queue with a client-generated idempotency key, shows instantly as "pending" in the UI, and replays in order when the phone is back online. This fits the backend well: the egg ledger already replays stock from the edited date forward, so late or out-of-order entries stay correct.
- **Local database only if the outbox is not enough** (for example, a week offline with full list browsing). The choice would then be `expo-sqlite` + Drizzle, maintained with each Expo SDK, plus `updatedSince` pull endpoints. WatermelonDB is not recommended: no commits since Aug 2025, and this app runs React Native 0.88 with the New Architecture.
- **Push notifications** through Expo Notifications, fed by the existing notification generator.
- **EAS Build** with dev / preview / production profiles, TestFlight and the Play internal track, then the stores.

### Backend changes, by stage

| Stage | Change | Why |
| --- | --- | --- |
| 1 | Add `http://localhost:8081` to `CORS_ORIGIN` in your **local** `backend/.env` | Only the Expo **web** preview needs it; phones do not send an Origin header |
| 1 (optional) | Raise the auth limiter (10 logins / 15 min) in development only | Repeated test logins hit it quickly |
| 2 | `Idempotency-Key` header support on POST / PUT | Safe outbox replays, no duplicate entries |
| 2 | `POST /devices` (push token) and Expo push sending in `notification.service` | Alerts on the phone |
| 2 | File upload (presigned URL) for expense receipts and batch photos | `Expense.attachmentUrl` exists, but nothing uploads to it yet |
| 2 | Longer refresh token for the mobile client (e.g. 30 days) | Workers shouldn't need to log in every week |
| 2, if needed | `updatedSince` filter and soft delete on list endpoints | Only if a local database is added |

### Tech choices

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Expo SDK 58, React Native 0.88, TypeScript strict | Already scaffolded |
| Navigation | Expo Router, JavaScript `Tabs` + Stack | JS tabs allow the large centre ＋ button; native tabs do not |
| Server state | TanStack Query + persisted cache | Same library as the web app |
| App state | Zustand (session, selected farm, preferences) | Same as the web app's auth store |
| Forms | React Hook Form + Zod, schemas copied from the web forms | Later moved into a shared package |
| UI | Our own small component set on `StyleSheet` + design tokens | Mirrors the web's hand-written shadcn components; no heavy UI kit, all Expo Go-safe |
| Charts | `victory-native` (Skia) | Skia, Reanimated and Gesture Handler ship in Expo Go; if it misbehaves, fall back to `react-native-gifted-charts` |
| Files | `expo-file-system` + `expo-sharing` | Download report exports and share them to WhatsApp / email |
| Secure storage | `expo-secure-store` | Refresh token |
| i18n | `i18next` with English strings from day one | Marathi / Hindi added in stage 2 without rewriting screens |
| Tests | Jest (`jest-expo`) + React Native Testing Library | Pure logic and forms first |
| CI | GitHub Actions: lint, type check, tests | EAS builds come in stage 2 |

### Project structure (mirrors the web's feature folders)

```
src/
  app/                          # routes only (Expo Router)
    _layout.tsx                 # providers, theme, auth gate
    (auth)/login.tsx, forgot-password.tsx
    (app)/_layout.tsx           # Stack for the signed-in app
    (app)/(tabs)/_layout.tsx    # Home · Flock · ＋ · Stock · More
    (app)/(tabs)/index.tsx, flock.tsx, stock.tsx, more.tsx
    (app)/quick-add.tsx         # bottom sheet (formSheet)
    (app)/batches/[id].tsx, batches/new.tsx, batches/[id]/event.tsx
    (app)/eggs/index.tsx, eggs/entry.tsx
    (app)/feed/index.tsx, feed/[id].tsx, feed/new.tsx, feed/[id]/use.tsx
    (app)/sales/…, expenses/…, customers/…, suppliers/…
    (app)/reports/index.tsx, reports/[type].tsx
    (app)/notifications.tsx, employees/…, users/…, roles/…, settings/…, audit-logs.tsx
  features/<domain>/            # api.ts, hooks.ts, schema.ts, components/
  components/ui/                # Button, Card, Stepper, NumberField, Sheet, ListRow, Chip, Badge, …
  lib/api/                      # client, refresh logic, error mapping
  store/                        # auth + selected farm (Zustand)
  theme/                        # tokens, light / dark
  i18n/                         # en.json (mr, hi later)
```

## UX principles

The main daily user is a worker or supervisor in a shed: gloves, bright sun or a dim bulb, patchy signal, often in a hurry. The owner checks numbers and money, often in the evening.

1. **Two taps to any daily entry.** The centre ＋ is on every tab; each form opens with today's date and the current farm already set.
2. **Numbers first.** Large − / + steppers and a numeric keypad; no free-text typing for counts.
3. **Thumb zone.** Primary actions sit in a sticky bar at the bottom. Touch targets are at least 56 dp.
4. **Show what's missing.** Home shows a "Today" checklist (eggs logged, feed used logged, vaccinations due) so gaps are obvious.
5. **Readable outdoors.** High contrast, 16 sp minimum text, follows system font scaling. Colour is never the only signal.
6. **Same words as the web.** Labels match the web app ("Batch", "Egg entry", "Revenue"), so owners and workers talk about the same things.
7. **Your role shapes the app.** A worker with only Egg and Chicken access sees just those. There are no locked buttons to tap and fail on.
8. **Honest saving.** Every save shows Saving → Saved ✓ or a clear error with a Retry button. In stage 2, "Saved on phone, will sync" replaces errors when offline.

## Navigation

Four tabs plus a centre ＋. Tabs and rows appear only when the user has `READ` on that module.

```
┌ Home ───────── Dashboard: farm switcher, Today checklist, KPI cards, trends, alerts
├ Flock ──────── Batches list → Batch detail (Overview · Events · Vaccinations)
├ ＋ Quick add ─ Egg entry · Mortality · Feed used · Vaccination done · Medicine ·
│                Weight check · Sale · Expense · Feed purchase · New batch
├ Stock ──────── Eggs (daily entries + stock) · Feed (purchases, consumption, low stock)
│                · Inventory summary
└ More ──────── Money: Revenue · Expenses · Outstanding · Customers · Suppliers
                 Reports · Notifications (also a bell on Home)
                 Team: Employees · Users · Roles & permissions
                 Settings: Farms · App settings · Audit logs · Change password
                 Profile · Theme · Language · Log out
```

- **Farm switcher** in the Home header ("All farms" or one farm), stored in Zustand and used by every list and form, like the web's farm filter.
- **Lists:** search bar, filter chips (status, type, date range), pull to refresh, infinite scroll on `page` / `limit`, and an empty state with the matching "Add" action.
- **Forms** open as full-screen modals with a sticky Save bar. Quick actions open as bottom sheets.
- **Delete** sits behind a confirm dialog and only shows with `DELETE` permission. Edit opens the same form, pre-filled.
- **Deep links** (`poultry://batches/<id>`) are ready for stage 2 push notifications.

## Design system

Reuse the web brand so the two products feel like one. The values below are converted from the web's `globals.css` HSL tokens.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| primary | `#DB7706` (amber) | `#F39120` | Main buttons, active tab, ＋ |
| background | `#FCFAF8` | `#171312` | Screens |
| card | `#FFFFFF` | `#201B18` | Cards, sheets |
| text | `#231D1A` | `#F7F5F3` | Body |
| text-muted | `#7A726C` | `#A49D98` | Labels, hints |
| border | `#E3DED9` | `#38312E` | Dividers, inputs |
| success | `#1A9948` | `#2EB860` | Healthy, paid, profit |
| warning | `#F59F0A` | `#EEA62B` | Low stock, partial, due soon |
| danger | `#DC2828` | `#CF3030` | Mortality, sick, unpaid, loss |

- **Type:** system font (it covers Devanagari for later Marathi / Hindi). Sizes 28 / 22 / 18 / 16 / 14; numbers in KPI cards are 28 bold with tabular figures.
- **Spacing:** 4 dp grid (4, 8, 12, 16, 24, 32). **Radius:** 10 for cards and inputs (web uses 0.6 rem), 28 for the ＋ button.
- **Themes:** light, dark and system. A high-contrast "sunlight" mode comes in stage 2.
- **Core components:** KPI card, stepper, number field, date strip, farm chip, filter chip, list row with status badge, sticky action bar, bottom sheet, confirm dialog, empty state, error banner with Retry, skeleton loaders, simple line / bar chart.

## Key screens

The first eight screens cover nearly all daily use.

**1. Login.** Logo, email, password (show / hide), "Log in", "Forgot password?". Remembers the last email. The error message comes from the server's `message`.

**2. Home (Dashboard).**

```
┌──────────────────────────────┐
│ Green Valley Farm ▾     🔔 3 │  farm switcher, notifications bell
├──────────────────────────────┤
│ TODAY                        │
│ ✓ Eggs logged      2,340     │  tap → egg entry for today
│ ○ Feed used        not yet   │  tap → feed used
│ ! Vaccination due  Batch B-07│  tap → batch vaccinations
├──────────────┬───────────────┤
│ Eggs today   │ Egg stock     │  KPI cards, 2 per row
│ 2,340        │ 11,520        │  (money cards only with
├──────────────┼───────────────┤   REVENUE / EXPENSE read)
│ Chickens     │ Sick          │
│ 4,812        │ 37            │
├──────────────┼───────────────┤
│ Sales today  │ Expenses today│
│ ₹18,400      │ ₹6,250        │
├──────────────┴───────────────┤
│ Monthly profit  ₹1,42,300 ▲  │
│ [Eggs][Profit][Expenses][Feed]  30-day chart, segmented
│ ▁▂▃▅▆▅▇▆▇█▇▆▇█               │
└──────────────────────────────┘
 Home   Flock   (＋)   Stock   More
```

**3. Egg entry** (the most-used form). Date strip (today selected), then large steppers for Morning, Evening, Broken, Damaged and Sold. A live line underneath shows "Good eggs today = M + E − broken − damaged" and the resulting stock. If an entry already exists for that farm and date, the screen loads it and saves as an edit, because the server allows one entry per farm per day.

**4. Flock — batches list.** Search and status chips (Healthy, Sick, Sold, Transferred). Each row shows batch no., breed, current / initial count, age in days and a status badge. The ＋ in the header creates a new batch.

**5. Batch detail.** Header card (batch no., breed, age, current count, mortality, average weight). Segmented tabs: **Overview** (key numbers, supplier, notes), **Events** (timeline with icons by type), **Vaccinations** (scheduled / administered / missed, with "Mark done"). A sticky bar has "Log event" and "Add vaccination".

**6. Log event sheet.** Type chips (Mortality, Medicine, Weight check, Status change, Vaccination, Note). Fields change with the type, as on the web: count for mortality, medicine name, weight in kg, new status. Date defaults to today.

**7. Stock.** Segmented Eggs / Feed. **Eggs:** current stock card, then daily entries newest first. **Feed:** one row per purchase with remaining quantity and a low-stock badge, and "Use feed" on each row.

**8. New sale.** Type chips (Eggs, Chickens, Manure, Other), customer picker (search, or add a new one inline), quantity × rate with the total computed live, payment status chips (Paid / Partial / Unpaid), invoice no., date. Expense entry follows the same pattern: category grid with icons, amount, GST, vendor, payment mode, invoice no.

**Also covered (lighter mobile versions of the web screens):** feed purchase form, batch create / edit, revenue and expense lists with by-type / by-category charts, outstanding payments, customers and suppliers, reports (pick a type, farm and date range → preview chart and table → export CSV / Excel / PDF and share), notifications list, employees, users (with per-user permission overrides as a module × action checklist), roles (the same checklist), farms, settings, audit log (read-only with filters), change password.

## Running it for testing

Two ways to point the app at an API, chosen with `EXPO_PUBLIC_API_URL`:

| Target | API URL | Good for |
| --- | --- | --- |
| Local backend on your laptop | `http://<laptop-LAN-IP>:4000/api/v1` (phone) or `http://localhost:4000/api/v1` (web / simulator) | Free experimenting with seeded demo data; nothing touches real data |
| Deployed backend (Railway) | `https://<railway-url>/api/v1` | Testing from anywhere, against the same data as poultry.rushikeshmhetre.com |

Steps:

1. Start the web repo's backend: `npm run dev:backend` (port 4000). Log in with the seeded demo accounts listed in the web repo README.
2. In this repo: `npx expo start`.
   - **Laptop:** press `w` for the browser. The iOS simulator also works if Xcode is updated; Xcode 15.4 is too old for SDK 58.
   - **Phone:** install **Expo Go** (the version for SDK 58), connect to the same Wi-Fi as the laptop, and scan the QR code. If the Wi-Fi blocks device-to-device traffic, use `npx expo start --tunnel` and the deployed API.
3. Optionally, share a test build with others later through EAS (stage 2).

## Roadmap

Each milestone ends with something running on your phone.

| Milestone | Scope | Done when |
| --- | --- | --- |
| **M0 — Shell** | Clean out the template; tokens and themes; UI primitives; API client with refresh; login / logout / forgot password; `/me` and permission-aware tabs; farm switcher; CI (lint, types, tests) | You log in on your phone with the demo admin and the worker account, and each sees the right tabs |
| **M1 — Daily operations** | Dashboard; Today checklist; egg entry and list; batches, detail, events, vaccinations; feed purchases, consumption, low stock; inventory summary; Quick add sheet | A full day's entries made on the phone show up on the website |
| **M2 — Money** | Revenue, expenses, outstanding, customers, suppliers, by-type / by-category charts | An owner can record and review a day's sales and costs on the phone |
| **M3 — Reports and admin** | Reports with export and share; notifications; employees; users and roles; farms and settings; audit log; change password | Every web feature is reachable on the phone (full parity) |
| **Stage 2 — Field build** | Offline outbox; push notifications; Marathi / Hindi; sunlight mode; receipt photos; EAS dev / preview / production builds; TestFlight and Play internal track; store listing | A pilot farm uses it daily for 2 weeks |

**Possible additions after parity**, mobile-only ideas that need new backend work: sheds within a farm, egg grading and trays, laying % and FCR against breed standards, barcode scanning for feed bags, voice entry in Marathi / Hindi, daily market egg rates.

## Testing

| Level | Tool | Covers |
| --- | --- | --- |
| Unit | Jest | API client refresh / retry, permission checks, number formatting (₹, Indian digit grouping), egg totals |
| Component | React Native Testing Library | Steppers, forms and validation messages, permission-hidden actions |
| Manual on phone | Expo Go | Each milestone's "done when" check, with the admin and worker demo accounts |
| End-to-end (stage 2) | Maestro | Login → egg entry → visible on web; offline save → reconnect → synced |

## Risks and open questions

| Risk | Mitigation |
| --- | --- |
| Workers don't enter data daily | Today checklist, 2-tap entry, push reminders in stage 2 |
| No signal in the shed during stage 1 | Cached reads; clear "needs connection" messages; the outbox is the first stage 2 item |
| Expo Go can't run a library we need | Stick to Expo Go-bundled modules in stage 1; anything else waits for the dev build |
| Login rate limit slows testing | Raise the limit in development only |
| Web and mobile validation drift | Copy the Zod schemas now; move them into a shared package before stage 2 |

**Open questions**

- [ ] Test against the **local** backend with demo data, or the **deployed** one with real data?
- [ ] Which of the 4th tab and More should hold Money? (Plan: Stock is the 4th tab, Money is first in More. Swap if owners are the main users.)
- [ ] Keep the web's amber brand and the current app icon, or make a new icon for the app stores?
- [ ] Are Marathi and Hindi needed for the first farm pilot, or can English go first?
