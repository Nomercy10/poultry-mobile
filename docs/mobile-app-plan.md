# Poultry Farm Manager — Mobile App Plan (Android + iOS)

Nov 22, 2026 · Rushikesh Mhetre

Live, editable version with diagrams: https://claude.ai/artifact/7S15kW1mCKEPXHW5WPQbfm

## Summary

Build one cross-platform app (React Native + Expo, TypeScript) that brings every feature of poultry.rushikeshmhetre.com to Android and iOS, works fully offline in the shed, and syncs to the existing backend when a signal returns. MVP in about 10 weeks, full parity in about 16.

**Why mobile matters for this product:** the website suits the owner at a desk, but most data is created by supervisors and workers standing in a shed — mortality counts, egg collection, feed issued. If entry is not fast on a phone, the data never arrives and the reports are wrong.

**Goals**

1. Full feature parity with the website, one codebase for both platforms.
2. Daily entry for a shed in under 60 seconds, usable with one hand and gloves.
3. Works with zero connectivity for at least 7 days, no data loss.
4. Usable by low-literacy workers: Marathi, Hindi and English, icon-first, numbers-first.
5. Becomes the main sales tool for the SaaS — a farmer sees value on their phone in the first session.

**Success metrics (first 90 days after launch)**

| Metric | Target |
| --- | --- |
| Daily entries made on mobile vs web | ≥ 80% |
| Days with a complete daily log per active flock | ≥ 90% |
| Median time to record a daily shed log | < 60 s |
| Sync failures needing manual fix | < 0.5% of records |
| Crash-free sessions | ≥ 99.5% |
| Paying farms (first customer + pilots) | 5 |

## Website parity: assumptions to confirm

The website is a client-rendered app behind a login, so its screens could not be read from outside. The feature list below is the standard scope of a layer and broiler farm management system. **Tick off what the website already has, and add anything missing** — that list becomes the parity backlog.

- [ ] Multi-farm, multi-shed (house) setup
- [ ] Flock / batch lifecycle: placement, transfer, depletion, closure
- [ ] Daily shed log: mortality, culls, feed, water, egg collection, body weight
- [ ] Egg production: grading (A/B/cracked/double-yolk), trays, HDEP %
- [ ] Broiler performance: weight, FCR, EPEF, age
- [ ] Feed management: stock, purchases, formulation, issue to shed
- [ ] Health: vaccination schedule, medicine log, vet visits, withdrawal periods
- [ ] Inventory: feed, medicine, vaccines, litter, packaging (trays)
- [ ] Sales: eggs, birds, manure; customers; invoices; payments due
- [ ] Purchases and expenses; suppliers
- [ ] Staff: attendance, tasks, payroll basics
- [ ] Reports and dashboard: production vs breed standard, cost per egg / kg, P&L
- [ ] Users, roles, permissions; subscription / billing

Anything the website does that is desktop-only by nature (bulk import, complex report builders, admin billing) stays on web; the app links out to it.

## Users, roles and permissions

Five roles cover a family farm up to a multi-site operation. Permissions are enforced on the server; the app only hides what a role cannot do.

| Role | Who | Main jobs in the app | Sees money? |
| --- | --- | --- | --- |
| Owner | Farm owner / investor | Dashboard, P&L, approvals, all farms | Yes |
| Manager | Farm manager | Flocks, stock, sales, staff, reports | Yes |
| Supervisor | Shed in-charge | Daily logs, health, stock issue, tasks | No |
| Worker | Shed labour | Daily log for assigned sheds only, tasks | No |
| Vet / consultant | External | Health records, flock performance (read), notes | No |

Access is scoped two ways: by **role** (what actions) and by **assignment** (which farms and sheds). A worker opening the app sees only their sheds, already selected.

## Feature modules

Thirteen modules, in build priority. P0 = MVP, P1 = parity release, P2 = after parity.

| # | Module | Key features on mobile | Offline | Priority |
| --- | --- | --- | --- | --- |
| 1 | Auth & onboarding | Phone + OTP login, PIN / biometric unlock, farm invite links, language pick | Unlock yes | P0 |
| 2 | Farms & sheds | Create farm, sheds with capacity, type (layer/broiler/breeder), housing | Read | P0 |
| 3 | Flocks | Place batch (breed, count, hatch date, source), transfer, split, depletion, close | Yes | P0 |
| 4 | Daily shed log | One screen: mortality + cause, culls, feed kg, water L, eggs by grade, temp, notes, photo | Yes | P0 |
| 5 | Dashboard | Today's tasks, alerts, live birds, HDEP % / FCR, mortality trend, missing logs | Cached | P0 |
| 6 | Health | Vaccination schedule auto-built from breed + age, medicine log, withdrawal lock, vet notes, symptom photos | Yes | P0 |
| 7 | Inventory | Feed, medicine, vaccine, trays, litter; receive, issue to shed, low-stock alert, barcode scan | Yes | P1 |
| 8 | Sales | Egg / bird / manure sales, customer ledger, invoice PDF, share on WhatsApp, payment status | Yes | P1 |
| 9 | Purchases & expenses | Supplier bills, expense categories, receipt photo, due payments | Yes | P1 |
| 10 | Staff & tasks | Attendance (geo-tagged), task assignment, recurring chores, advances | Yes | P1 |
| 11 | Reports | Production vs breed standard, cost per egg / kg, flock P&L, monthly P&L; PDF / Excel export | Cached | P1 |
| 12 | Market prices | Daily NECC egg rate + broiler rate by zone, price alerts | Cached | P2 |
| 13 | AI assistant | Voice entry in Marathi / Hindi ("aaj 3 kombdya mela"), anomaly alerts, symptom photo triage | No | P2 |

**Daily shed log is the heart of the product.** It pre-fills yesterday's feed, shows the breed standard beside each number, and warns when a value is outside the normal range (e.g. mortality > 0.1% a day, feed down > 10%).

## Information architecture and navigation

Five bottom tabs plus one big centre "+" button. Every daily action is at most two taps from launch.

1. **Home** — farm switcher, today's tasks, alerts, KPI cards, missing logs
2. **Flocks** — list by shed → flock detail
   - Overview (age, live count, HDEP % or weight vs standard)
   - Daily logs (calendar strip)
   - Health (schedule, records)
   - Performance charts
   - Flock P&L (owner / manager only)
3. **＋ Quick add** (bottom sheet) — Daily log · Mortality · Eggs · Feed issue · Vaccination done · Sale · Expense · Photo note
4. **Stock & sales** — Inventory · Sales · Purchases · Customers · Suppliers
5. **More** — Reports · Staff & tasks · Market prices · Farms & sheds · Users · Settings (language, units, sync status) · Help

Workers get a reduced shell: **My sheds** and **Tasks** only, with the ＋ button. Deep links (`poultry://flock/123/log`) let push notifications open the exact screen.

## Design system

The look is calm, high-contrast and outdoor-readable: a shed in bright sun or under a dim bulb. Reuse the website's brand colour as the primary if it has one; the tokens below are a default.

**Field-use principles**

- Touch targets ≥ 56 dp (gloves, wet hands); primary actions in the bottom third of the screen.
- Numbers first: large numeric steppers (− / +) and a custom numeric keypad, not the system keyboard.
- Icons always paired with a word in the chosen language; never colour alone for meaning.
- Every list item shows its sync state (synced / pending / conflict).
- Body text 16 sp minimum; supports system font scaling to 200%.
- Light and dark themes; a high-contrast "sunlight" mode.

**Tokens**

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| primary | #2E7D32 (farm green) | #66BB6A | Main buttons, active tab |
| accent | #F9A825 (yolk) | #FFD54F | Egg data, highlights |
| danger | #C62828 | #EF5350 | Mortality spikes, overdue |
| warning | #EF6C00 | #FFA726 | Low stock, due soon |
| surface | #FFFFFF | #121212 | Cards |
| background | #F5F5F0 | #000000 | Screens |
| text | #1B1B1B | #F2F2F2 | Body |

Type: Noto Sans + Noto Sans Devanagari (covers Marathi and Hindi), sizes 32 / 24 / 20 / 16 / 14. Spacing on a 4 dp grid (8, 12, 16, 24, 32). Radius 12 for cards, 28 for the big ＋ button.

**Core components:** KPI card, numeric stepper, number keypad sheet, shed picker chip, date strip, standard-range bar (value vs breed standard), alert banner, sync badge, empty state with illustration, photo attach tile, signature pad (deliveries).

## Key screens

Eight screens carry 90% of daily use. Each spec lists the layout top to bottom.

**1. Login** — logo · language chips (मराठी / हिंदी / English) · phone field · "Send OTP" · 6-box OTP · then set 4-digit PIN and offer fingerprint.

**2. Home (owner / manager)** — farm switcher + sync badge · alert banner ("Shed 2: mortality 0.4% today") · 4 KPI cards in a 2×2 grid (live birds, eggs today, HDEP %, feed stock days) · "Logs pending" list with shed chips · today's tasks with checkboxes · 7-day egg trend sparkline.

**3. Daily shed log** (the most important screen) — header: shed chip, flock age ("Week 32, Day 4"), date strip · sections as cards, each with a big stepper:

- Mortality (count + cause dropdown) and culls
- Feed consumed kg (pre-filled from yesterday) with breed standard beside it
- Water L (optional)
- Eggs: trays + loose for Grade A, B, cracked, double-yolk; total and HDEP % computed live
- Body weight sample (broilers / growers)
- Temperature min / max, notes, photo
- Sticky bottom bar: "Save" (works offline) · values outside range show an orange bar and ask to confirm.

**4. Flock detail** — hero card (breed, age, live count, placement date) · segmented tabs Overview / Logs / Health / Charts / P&L · production curve vs breed standard.

**5. Vaccination schedule** — timeline by age; each item: vaccine, route (eye drop / water / injection), due date, status; "Mark done" asks batch number and photo of the vial.

**6. Inventory list** — search + scan button · category chips · item rows with stock, unit, days of cover, low-stock badge · ＋ Receive / Issue.

**7. New sale** — customer picker (with dues shown) · product (eggs by grade / birds / manure) · qty in trays or kg · rate pre-filled from today's market price · total · payment received / credit · "Save & share invoice" (PDF to WhatsApp).

**8. Reports** — report cards (Production, Feed & FCR, Mortality, Cost per egg, P&L) · date range · chart + table · export PDF / Excel.

## Technical architecture

React Native with Expo, talking to the website's existing backend through a versioned mobile API and a sync endpoint. One TypeScript codebase for Android and iOS; shared types and validation with the web app.

**Why React Native + Expo over Flutter or native:** it reuses your TypeScript / React skills and the web app's validation and types, EAS handles builds and over-the-air updates, and you have already shipped an Expo app. Flutter would mean a second language with no code sharing.

| Layer | Choice | Notes |
| --- | --- | --- |
| App framework | Expo SDK (latest stable), React Native New Architecture, TypeScript strict | Pin SDK; use dev builds, not Expo Go |
| Navigation | Expo Router (file-based) | Deep links free |
| UI kit | Tamagui or React Native Paper + custom tokens | Theming, dark mode |
| Local database | WatermelonDB on SQLite | Lazy loading, built-in sync protocol, fast with 100k+ rows |
| Server state | TanStack Query (for non-synced, online-only data like reports) | Cache + retry |
| App state | Zustand | Session, selected farm, UI |
| Forms & validation | React Hook Form + Zod (schemas shared with web) | One source of truth for rules |
| Charts | Victory Native (Skia) | Smooth on low-end Android |
| i18n | i18next + ICU, Indian number format (1,00,000) | mr, hi, en at launch |
| Media | expo-image-picker, expo-image-manipulator (compress to ~200 KB), upload queue to S3 / GCS via signed URLs | Works offline, uploads later |
| Scanning | expo-camera barcode | Feed / medicine bags |
| Push | Expo Notifications → FCM / APNs | Topics per farm |
| PDF & share | expo-print, expo-sharing | Invoices to WhatsApp |
| Auth | OTP via MSG91 / Firebase Auth; JWT access (15 min) + refresh (30 days) in SecureStore | Biometric via expo-local-authentication |
| Monitoring | Sentry, PostHog (product analytics) | Crash-free and funnel tracking |
| Build & release | EAS Build, EAS Submit, EAS Update (OTA) | Channels: dev / preview / production |

**Backend additions** (in the website repo, `poultry-farm-management`):

- `/api/v1/mobile/*` REST endpoints, or reuse existing ones if they are clean and versioned.
- `/sync/pull` and `/sync/push` endpoints implementing the WatermelonDB protocol.
- `updated_at`, `deleted_at` (soft delete) and `server_version` on every synced table.
- Background jobs: alerts (missed logs, mortality spikes, low stock, vaccine due), push dispatch, daily market price fetch, report pre-aggregation.
- Object storage for photos and invoice PDFs.

**Architecture at a glance**

```
 MOBILE APP (Android + iOS)                 EXISTING BACKEND
 ┌──────────────────────────┐   online    ┌───────────────────────────┐
 │ UI screens               │────────────▶│ Mobile API /api/v1        │
 │ Domain logic (Zod, KPIs) │             │ Sync endpoints pull/push  │
 │ WatermelonDB (SQLite)    │◀── sync ───▶│ Database (source of truth)│
 │ Sync engine + upload q.  │             │ Background jobs           │
 └────────────┬─────────────┘             └──────┬────────────▲───────┘
              ▼                                  ▼            │ same API
       Object storage                       FCM / APNs     Web app
       (photos, PDFs)                       (push)         (owner at desk)
```

Screens never call the network to save; they write to the local database, and the sync engine reconciles with the server. Only reports and other read-only views go online directly.

## Offline-first sync

Every write goes to the phone's database first and appears instantly; a sync engine pushes and pulls changes whenever a connection exists. The user never waits on the network to record data.

**How it works**

1. Writes land in WatermelonDB with a client-generated UUID and status `created` / `updated` / `deleted`.
2. Sync runs on app open, on regaining network, after each save (debounced 10 s), and every 15 min in background (expo-background-task).
3. **Pull:** app sends `last_pulled_at`; server returns all rows changed since, scoped to the user's farms and sheds.
4. **Push:** app sends its local changes; server validates (Zod schema + permission + business rules) in one transaction and returns accepted / rejected per record.
5. Photos upload separately through a queue after their record is synced.

**Conflict rules**

| Data | Rule | Why |
| --- | --- | --- |
| Daily log fields | Per-field last-write-wins by device timestamp, and the overwritten value kept in an audit log | Two people rarely edit the same field; audit keeps it safe |
| Stock movements, sales, payments | Append-only events, never edited in place; corrections are new reversing entries | Stock and money must add up exactly |
| Stock balance | Computed on server from events, never synced as a number | Avoids two phones each "setting" stock |
| Master data (flocks, sheds, customers) | Last-write-wins; deletes are soft | Low edit frequency |
| Rejected records | Shown in a "Needs attention" list with the reason; user fixes or discards | No silent data loss |

**Scope limits:** only the user's assigned farms sync, plus the last 18 months of logs (older data is fetched online on demand). Expected local size for a 3-shed farm: under 50 MB.

## Data model

Every synced table carries `id` (UUID), `org_id`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `device_id`. Align names with the website's existing schema rather than renaming it.

| Table | Key fields | Relations |
| --- | --- | --- |
| organizations | name, plan, billing status | has farms, users |
| users | phone, name, language | many memberships |
| memberships | role, farm_ids[], shed_ids[] | user ↔ org |
| farms | name, location (lat/lng), address | has sheds |
| sheds | name, type, capacity, housing (cage / deep litter) | belongs to farm |
| breeds | name, type, standard curve (JSON by week) | reference data |
| flocks | shed_id, breed_id, placed_count, hatch_date, placed_on, status, source, cost_per_chick | has daily logs |
| flock_movements | flock_id, type (transfer / split / sale / depletion), count, to_shed_id | event |
| daily_logs | flock_id, date, mortality, culls, feed_kg, water_l, temp_min, temp_max, avg_weight_g, notes | unique (flock_id, date) |
| mortality_entries | daily_log_id, count, cause | detail |
| egg_collections | daily_log_id, grade, trays, loose, total | detail |
| vaccine_schedules | breed_id, age_days, vaccine, route | template |
| health_events | flock_id, type (vaccine / medicine / vet visit), product_id, dose, batch_no, withdrawal_until | event |
| products | name, category (feed / medicine / vaccine / tray / other), unit, barcode, reorder_level | catalogue |
| stock_movements | product_id, farm_id, shed_id?, type (receive / issue / adjust), qty, unit_cost, ref | append-only |
| parties | type (customer / supplier), name, phone, GSTIN | ledger |
| sales / sale_items | party_id, date, total, paid / product, grade, qty, rate | append-only |
| purchases / expenses | party_id, category, amount, receipt_photo | append-only |
| payments | party_id, direction, amount, mode (cash / UPI / bank), ref | append-only |
| staff / attendance / tasks | name, wage / date, status, geo / title, assignee, due, recurrence | operations |
| attachments | entity, entity_id, url, local_uri, upload_state | media |
| audit_log | entity, entity_id, field, old, new, by, at | server only |

**Computed on the server, cached on the phone:** live bird count, HDEP %, FCR, EPEF, cost per egg, cost per kg, stock on hand, party balances.

## API design

REST + JSON under `/api/v1`, with the sync endpoints carrying most mobile traffic. Requests send `Authorization: Bearer <jwt>`, `X-Org-Id`, `X-Device-Id`, `X-App-Version` (the server can force an upgrade below a minimum version).

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /auth/otp/request, /auth/otp/verify | Phone login |
| POST | /auth/refresh, /auth/logout | Token lifecycle |
| GET | /me | User, memberships, permissions, feature flags |
| GET | /sync/pull?last_pulled_at=&schema_version= | Changes since timestamp, per table |
| POST | /sync/push | Batch of local creates / updates / deletes |
| POST | /attachments/presign | Signed upload URL for a photo |
| GET | /dashboard?farm_id= | Pre-aggregated KPIs and alerts |
| GET | /reports/{type}?from=&to=&flock_id= | Production, FCR, mortality, cost, P&L |
| GET | /reports/{type}/export?format=pdf or xlsx | File download |
| GET | /market-prices?zone= | Daily egg and broiler rates |
| POST | /devices | Register push token |
| POST | /invoices/{id}/pdf | Generate shareable invoice |

Errors use one shape: `{ code, message, field?, details? }`, with messages translated on the client from `code`. Lists paginate by cursor. Rate limit: 120 requests / min per device.

## Security, notifications and localization

**Security**

- Tokens in SecureStore (Keychain / Keystore); app lock with PIN or biometrics after 5 min in background.
- Local SQLite encrypted with SQLCipher (phones are shared and get lost).
- Server re-checks role and farm assignment on every push record; the client is never trusted.
- TLS only, certificate pinning for the API domain; no secrets in the app bundle.
- Remote logout and device wipe from the web admin; audit log of every edit.
- Comply with India's DPDP Act 2023: consent at signup, data export and deletion on request, privacy policy in all three languages.

**Notifications**

| Trigger | Who | Channel |
| --- | --- | --- |
| Daily log not entered by 7 pm | Supervisor, then manager at 9 pm | Push |
| Mortality above threshold or feed / water drop | Owner, manager, vet | Push (high priority) |
| Vaccination due tomorrow / overdue | Supervisor, manager | Push + task |
| Stock below reorder level or < 5 days of feed | Manager | Push |
| Customer payment overdue | Owner, manager | Push, weekly digest |
| Sync failed for > 24 h | That user | In-app banner |
| Daily summary | Owner | Push at 8 pm, optional WhatsApp |

**Localization and accessibility**

- Marathi, Hindi, English at launch; Kannada, Telugu, Gujarati next (major poultry states).
- All strings in translation files; translators review in context with screenshots.
- Units: kg / g, litres, trays of 30 eggs; Indian digit grouping; dates as DD MMM.
- Voice-over / TalkBack labels on every control; font scaling; no colour-only status.

## Testing, CI/CD and release

Automate the checks that protect data integrity (sync and calculations) most heavily; UI tests cover only the critical paths.

| Level | Tool | What it covers |
| --- | --- | --- |
| Unit | Jest | Calculations (HDEP %, FCR, cost per egg), Zod schemas, reducers |
| Component | React Native Testing Library | Forms, steppers, validation messages |
| Sync | Jest + a test server | Offline edits on 2 devices, conflicts, rejected records, schema migration |
| End-to-end | Maestro | Login → daily log offline → reconnect → appears on web; new sale → invoice share |
| Device lab | Real low-end Android (2–3 GB RAM, Android 10+) and an older iPhone | Performance, sunlight readability |
| Field pilot | First customer's farm, 2 weeks | Real workflows, language, gloves |

**Pipeline:** GitHub Actions runs lint, type-check and tests on every PR → EAS Build for preview → internal testers via TestFlight and Play internal track → production. JS-only fixes ship via EAS Update to the production channel; native changes go through store review.

**Targets:** the minimum Android and iOS versions supported by the pinned Expo SDK; cold start < 2.5 s on a low-end Android; APK / AAB < 40 MB.

## Roadmap and estimates

About 16 weeks to a public store launch with one senior full-time developer and a part-time designer; a second developer cuts it to about 10–11 weeks.

| Phase | Weeks | Scope |
| --- | --- | --- |
| Foundations | 1–2 | Repo, CI, design tokens; backend sync endpoints; screen mock-ups |
| MVP | 3–10 | Login, farms, flocks; daily shed log (offline); dashboard, health; push alerts |
| **Gate: Pilot on first farm** | end of 10 | 14 days of daily logs |
| Parity | 11–16 | Inventory, sales; purchases, staff; reports + export; store submission |
| **Gate: Store launch** | end of 16 | Parity done, 99.5% crash-free |
| Growth | 17 onward | Market prices; voice entry (AI); more languages; paid plans |

| Item | Estimate |
| --- | --- |
| Effort to launch | ~16 developer-weeks + ~4 designer-weeks |
| Apple Developer Program | US$99 / year |
| Google Play developer account | US$25 one-time |
| Expo EAS (Production plan, optional) | ~US$99 / month; free tier is enough during the MVP |
| SMS OTP (MSG91 or similar) | roughly ₹0.15–0.25 per SMS |
| Sentry, PostHog | Free tiers cover a pilot |

Third-party prices are approximate and should be checked before purchase.

## Risks and open questions

The biggest risk is not technical: workers not entering data daily. Design, alerts and the pilot all aim at that.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Low daily adoption by workers | Reports wrong, owner loses trust | 60-second log, voice entry (P2), reminders, owner sees who logged |
| Sync conflicts corrupt stock or money | Wrong balances | Append-only events, server-computed balances, audit log |
| Existing backend not sync-ready | Delay of 2–4 weeks | Add `updated_at` / soft delete early; build sync endpoints in week 1–3 |
| Low-end Android performance | Slow, crashes | WatermelonDB lazy queries, test on 2 GB devices from week 2 |
| Translation quality | Confusing for workers | Native-speaker review with farmers during pilot |
| Store review delays (iOS) | Late launch | Submit TestFlight build by week 8 |
| Expo SDK upgrades | Breaking changes | Pin SDK, upgrade once a quarter on a branch |

**Open questions**

- [ ] What is the website's stack (frontend, backend, database, hosting)? This decides how much backend work sync needs.
- [ ] Which features from the parity checklist does the website actually have, and which are missing?
- [ ] Is the first customer layer-only? If so, should broiler screens wait until after MVP?
- [ ] Brand: keep the website's colours and logo, or refresh for the app?
- [ ] Pricing: per farm, per bird capacity, or per user? Is the app free with a web subscription?
- [ ] Build it yourself, or with one more developer?
