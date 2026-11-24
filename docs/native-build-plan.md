# Native build and release plan (Android + iOS)

**Status:** proposal, waiting for CEO approval. Nothing here has been built yet.

The app is already React Native (Expo SDK 58), so the same code runs on Android and iOS. "Building for iOS and Android" therefore means three things:

1. finish the features (web parity, plus the new language and Simple-mode work);
2. produce real installable apps instead of running inside Expo Go;
3. publish them on Google Play and the App Store under the company.

Related docs: [mobile-app-plan.md](mobile-app-plan.md) (architecture, M0–M3), [languages-and-easy-ui.md](languages-and-easy-ui.md) (languages and Simple mode), [auth-otp.md](auth-otp.md) (phone login).

## Revised roadmap

New priorities change the order of the original plan. Languages and Simple mode move from "stage 2" into every milestone, and two milestones are added for payments and launch.

| Milestone | Scope | Done when |
| --- | --- | --- |
| **M0 — Shell** (done, PR #1) | Tokens, components, login, session, permission-aware tabs | Logs in on web and phone |
| **M1 — Daily operations** | Dashboard, Today checklist, eggs, batches and events, vaccinations, feed, inventory, Quick add. Simple-mode versions of egg, mortality and feed entry. Hindi and Marathi strings. | A worker records a full day in Hindi or Marathi without help |
| **M2 — Money** | Revenue, expenses, outstanding, customers, suppliers. Simple-mode sale entry. | An owner records and reviews a day's sales and costs |
| **M3 — Reports and admin** | Reports with export and share, notifications, employees, users and roles, farms, settings, audit log | Full web parity on the phone |
| **M4 — Field-ready** | **Organisation (tenant) layer in the backend**: today farms have no owner and customers and suppliers are shared by everyone, so each signed-up farmer must get their own isolated data first. Offline outbox, phone OTP login (backend), push notifications, Telugu and Tamil, sunlight mode, hosted **staging** backend in Singapore, dev and preview builds | Two unrelated farmers sign up and never see each other's data; a pilot farm uses it daily for 2 weeks on real phones |
| **M5 — Plans and billing** | Plan and entitlement model in the backend (Free, Pro, Business, Integrator); free-plan limits (1 farm, 2 active batches, owner + 1 worker, 12 months visible); 30-day Pro trial; cost guardrails (90-day trusted-device login, WhatsApp-first OTP, audit-log and token pruning); web checkout with Razorpay or Cashfree (UPI); Google Play Billing and App Store subscriptions at the same prices, with no link to web checkout inside the apps | A test user upgrades on the web, on Android and on iPhone, renews, cancels and drops back to Free |
| **M6 — Launch** | Store listings in each language, privacy policy, account deletion, Data safety and privacy labels, production builds, staged rollout | App live on Play (staged rollout) and the App Store |

Build artefacts start in M1, not M4: from M1 on, every milestone ends with an installable Android build that testers can download from a link.

## How testers get the app

| Stage | Android | iOS | Needs money? |
| --- | --- | --- | --- |
| Today | Expo Go, same Wi-Fi as the laptop | Expo Go, same Wi-Fi | No |
| From M1 | **Preview APK** from Expo's build service. Open a link on the phone and install. | Run from the Mac with `npx expo run:ios --device` (free Apple ID), or the iOS Simulator | No (free plan: 15 Android + 15 iOS builds) |
| From M4 | Play Console **internal testing** track (up to 100 testers) | **TestFlight** (up to 10,000 testers) | Yes: Google Play account (US$25 once) and Apple Developer Program (about US$99 a year) |
| M6 | Play Store, staged rollout | App Store | Same accounts |

Notes:
- A free Apple ID can only install on an iPhone by building locally from the Mac. Apple expires those installs after about 7 days, so it suits the founder's own phone, not testers.
- Ad hoc iOS builds and TestFlight need the paid Apple Developer Program.
- **Buy both developer accounts in the company's name**, not personally. An organisation account needs the company's D-U-N-S number (see the company setup guide). Moving apps from a personal account to a company account later is possible but slow; starting in the company's name avoids it.

## Decisions needed before the first build

1. **App identifier.** Android `package` and iOS `bundleIdentifier`, e.g. `in.<companydomain>.poultry`. It **can never change** after the first Play Store upload. It should use the company's domain, so it waits for the company name. Test APKs can use a temporary id until then.
2. **App name on the stores**, checked against trademarks (company setup guide, brand section).
3. **Staging backend.** Phones outside the home Wi-Fi need a hosted backend. It must be a separate staging database, never the production one.

## Engineering steps (when approved)

1. Add `eas.json` with four profiles:

   ```json
   {
     "build": {
       "development": { "developmentClient": true, "distribution": "internal" },
       "development-simulator": { "extends": "development", "ios": { "simulator": true } },
       "preview": { "distribution": "internal", "channel": "preview", "android": { "buildType": "apk" } },
       "production": { "channel": "production" }
     }
   }
   ```

2. Add `expo-dev-client` and `expo-updates`; set `android.package`, `ios.bundleIdentifier`, `runtimeVersion` and the update URL in `app.json` (`npx eas-cli@latest update:configure`).
3. Build: `npx eas-cli@latest build -p android --profile preview`. Share the download link with testers.
4. Ship fixes without a rebuild through Expo Update: `npx eas-cli@latest update --channel preview --environment preview --message "..."`. Native changes (a new native library) still need a new build.
5. From M4: register the Play and Apple accounts, then `eas submit` to the Play internal track and TestFlight.
6. CI: keep lint, typecheck and tests on every PR; add a preview build on merges to `main` once builds are routine.

Expo Go keeps working for day-to-day development until a native-only library arrives (likely text-to-speech voices, push notifications or billing). After that, developers use the development build instead of Expo Go.

## Costs of building and releasing

| Item | Cost | When |
| --- | --- | --- |
| Expo build service, free plan | US$0: 15 Android + 15 iOS builds, low-priority queue, Expo Update for 1,000 monthly users | M1–M4 |
| Expo Starter plan (if the free queue is too slow or users pass 1,000) | US$19 a month + usage (about US$1 per Android build, US$2 per iOS build) | M5 onwards |
| Google Play developer account | US$25, once | M4 |
| Apple Developer Program | about US$99 a year | M4 |
| Staging backend | see the pricing and cost doc | M4 |

Sources: Expo docs on [development builds](https://docs.expo.dev/develop/development-builds/create-a-build/), [internal distribution](https://docs.expo.dev/build/internal-distribution/), [eas.json](https://docs.expo.dev/build/eas-json/), [submit](https://docs.expo.dev/submit/introduction/), and [Expo pricing](https://expo.dev/pricing), read 23 Nov 2026.
