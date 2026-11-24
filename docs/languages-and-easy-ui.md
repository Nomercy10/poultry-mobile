# Languages and Simple mode — product + engineering spec

v1 · Nov 23, 2026 · Draft for review

Companion to [mobile-app-plan.md](mobile-app-plan.md) and [native-build-plan.md](native-build-plan.md). Where this spec says "Stage 2", read **M4 (Field-ready)** in the revised roadmap of the build plan. The mobile app plan puts "Marathi / Hindi" and a "sunlight mode" in Stage 2. This spec widens it in three ways: more languages, a **Simple mode** for workers who read little or not at all, and the backend changes both need. It builds on what the app already has:

- i18next and react-i18next with typed keys ([src/i18n/index.ts](../src/i18n/index.ts), [src/i18n/i18next.d.ts](../src/i18n/i18next.d.ts), [src/i18n/en.json](../src/i18n/en.json)). The device language is read once with `expo-localization`, and English is the fallback.
- Design tokens ([src/theme/tokens.ts](../src/theme/tokens.ts)) with a 56 dp minimum touch target (`touch.min`).
- A small UI kit ([src/components/ui/](../src/components/ui/)) and permission-driven menus ([src/features/navigation/menu.ts](../src/features/navigation/menu.ts)).
- Tabs Home · Flock · ＋ · Stock · More, and a Quick add sheet ([src/app/(app)/quick-add.tsx](../src/app/(app)/quick-add.tsx)).
- Indian digit grouping and ₹ formatting ([src/lib/format.ts](../src/lib/format.ts)).

---

## 0. Summary

| Decision | Recommendation |
| --- | --- |
| Languages, phase 1 | **English, Hindi, Marathi, Telugu, Tamil** (`en`, `hi`, `mr`, `te`, `ta`) |
| Languages, phase 2 | **Bengali and Kannada first**, then Gujarati, Punjabi, Odia, Malayalam (`bn`, `kn`, `gu`, `pa`, `or`, `ml`) |
| Choosing a language | First screen, before login: each language written in its own script, with a play button for a short voice sample. Can be changed later in More (and in Simple mode's "Me" screen). Applies at once, with no restart. |
| Digits | Western digits 0–9 and Indian grouping (12,34,567) in every language. Never left to the locale default: Marathi and Bengali default to their own digits, and Kannada, Odia and Malayalam default to Western grouping. |
| UI approach | **One app, two modes.** Simple mode is a different presentation over the same data, permissions, schemas and API calls. It is the default for workers. Standard mode is the default for owners and managers. Either can be switched. |
| Simple mode, core idea | Big picture tiles, a voice prompt on every screen, one question per screen, trays/bags steppers plus a number pad, a picture review, then save with a 10-second **Undo** instead of "Are you sure?" dialogs |
| Voice | **Recorded prompts** (native speakers, bundled or downloaded per language) for fixed phrases. **On-device TTS** (`expo-speech`) only for dynamic numbers and names, when a voice exists for the language. Speech-to-text is a later experiment, not MVP. |
| Expo modules | `expo-speech`, `expo-audio` and `expo-localization` (runtime) work in Expo Go. **Need a development build:** `expo-localization`'s `supportedLocales` (per-app language in system settings), localized app name (`locales`), `expo-font` **config plugin** (embedded fonts), `expo-speech-recognition`. `expo-haptics`: check it runs in Expo Go (see §5.8). |
| Backend | `User.preferredLanguage`, `User.uiMode`, `Accept-Language` on every request, error **codes** instead of English messages, and notifications, PDFs and WhatsApp/SMS rendered in the user's language |

---

## 1. Language plan

### 1.1 Where the users are

India produced **149.11 billion eggs in 2024-25**, and poultry meat was **5.18 million tonnes**, about half of all meat (BAHS 2025).

| Rank | Eggs, share 2024-25 | Meat (all species), share 2024-25 |
| --- | --- | --- |
| 1 | Andhra Pradesh 18.37% | West Bengal 12.46% |
| 2 | Tamil Nadu 15.63% | Uttar Pradesh 12.20% |
| 3 | Telangana 12.98% | Maharashtra 11.57% |
| 4 | West Bengal 10.72% | Andhra Pradesh 10.84% |
| 5 | Karnataka 6.67% | Telangana 10.49% |
| | Top 5 = 64.37% | Top 5 = 57.55% |

Notes:

- The meat ranking above covers all species. A secondary source citing BAHS 2023 lists the top poultry-meat states for 2022-23 as West Bengal, Maharashtra, Tamil Nadu, Telangana and Uttar Pradesh, together about 50%. Maharashtra, Haryana and Punjab come after the top five for eggs. **Check their exact shares in the BAHS state tables** before deciding the order of phase 2.
- **Speakers** (Census 2011, first language, rounded): Hindi 52.8 cr, Bengali 9.7 cr, Marathi 8.3 cr, Telugu 8.1 cr, Tamil 6.9 cr, Gujarati 5.5 cr, Kannada 4.4 cr, Odia 3.8 cr, Malayalam 3.5 cr, Punjabi 3.3 cr. With second-language speakers, Hindi reaches 69.2 cr.
- **Workers move between states.** Many farm workers on southern and western farms come from Hindi-speaking states (worth checking in the pilot), so Hindi matters well outside the Hindi belt.

### 1.2 Phases

| Phase | Languages (code) | Script | Why |
| --- | --- | --- | --- |
| 0 (today) | English `en` | Latin | Exists. Owners and the web app. |
| **1** | Hindi `hi` | Devanagari | Largest group. UP (#2 meat), Haryana, Punjab and migrant workers everywhere. |
| **1** | Marathi `mr` | Devanagari | Maharashtra (#3 meat, a large broiler state). The first pilot farm's language (already in the plan's open questions). Shares a script with Hindi, which makes fallback cheap. |
| **1** | Telugu `te` | Telugu | Andhra Pradesh plus Telangana = **31.35% of India's eggs**, and #4 and #5 for meat. The single most important language for layers. |
| **1** | Tamil `ta` | Tamil | Tamil Nadu = 15.63% of eggs (the Namakkal layer belt) and a large broiler industry. |
| **2a** | Bengali `bn` | Bengali | West Bengal is #4 for eggs and #1 for meat. **Data supports putting it in phase 1.** It is phase 2a only because pilot farms are not planned there yet. Move it up if a Bengal pilot appears. |
| **2a** | Kannada `kn` | Kannada | Karnataka is #5 for eggs. |
| 2b | Gujarati `gu`, Punjabi `pa` (Gurmukhi), Odia `or`, Malayalam `ml` | Own scripts | Smaller producing states (Punjab and Haryana have layer clusters, Odisha is growing, Kerala mostly buys). Odia has **no Google TTS voice** on the Android list, so it depends entirely on recorded prompts. |
| Later | Assamese `as`, Urdu `ur` | Bengali-Assamese, Perso-Arabic (RTL) | Only on demand. Urdu needs RTL testing (RTL is on by default from SDK 58). |

Each language ships only when all of these are done: (a) glossary signed off, (b) 100% of Simple-mode strings and ≥ 95% of all strings translated and reviewed, (c) recorded prompts in hand, (d) one field-test round passed (§6).

### 1.3 Locale codes and formatting locale

- **UI language** uses plain language codes (`en`, `hi`, `mr`, `te`, `ta`, `bn`, `kn`, `gu`, `pa`, `or`, `ml`). These are the i18next resource keys and the `preferredLanguage` value stored on the server.
- **Formatting locale** is always `<lang>-IN` with the `-u-nu-latn` extension, for example `mr-IN-u-nu-latn`. Number grouping does not come from `Intl` at all (§1.6).
- **TTS locale** is `<lang>-IN`, picked at runtime from `Speech.getAvailableVoicesAsync()`.

### 1.4 First-launch language picker (before login)

Route: `src/app/(auth)/language.tsx`. It is shown when no language has been saved yet; afterwards the screen goes straight to `/login`.

```
┌──────────────────────────────┐
│        🐔 (app logo)          │   no English heading; a globe pictogram only
│                              │
│ ┌────────────┐ ┌────────────┐│
│ │  हिन्दी  🔊 │ │  मराठी  🔊  ││   each tile: language name in ITS OWN script
│ │  Hindi     │ │  Marathi   ││   (large, 24–28 sp), English name small below,
│ └────────────┘ └────────────┘│   speaker button plays a recorded sample
│ ┌────────────┐ ┌────────────┐│
│ │  తెలుగు 🔊  │ │  தமிழ்  🔊  ││
│ └────────────┘ └────────────┘│
│ ┌────────────┐ ┌────────────┐│
│ │  English 🔊 │ │  ...       ││
│ └────────────┘ └────────────┘│
│                              │
│ [        ✓  (big green)     ]│   "continue" = tick icon; label in chosen language
└──────────────────────────────┘
```

- **Order:** the language matching `getLocales()` comes first and is pre-selected. After it come the farm's region languages (if known from an invite link), then the rest. English is never first unless the device is set to English.
- **Tapping a tile** selects it (thick border, tick badge, `selectionAsync` haptic) **and plays its voice sample**, for example "मराठी निवडण्यासाठी येथे दाबा" ("Press here to choose Marathi"), recorded by a native speaker. The whole screen switches to that language right away, so the continue button and hint show in the chosen script.
- **No reading needed.** A person who reads only their own script, or no script at all, can tap each tile and listen until they hear their language.
- **Tile labels never come from the active translation.** Each language's name is hard-coded in its own script (an `endonym` field in the locale registry), so it always shows correctly.
- **The login screen** also keeps a small language chip (globe plus the current endonym) at top right.

### 1.5 Switching later, persistence and sync

- **Where:** More → Account → **Language** (a list row with the endonym as its value) opens the same tile grid as a sheet. In Simple mode it is the "Me" tile → Language.
- **How it applies:** `i18n.changeLanguage(lng)` re-renders every `useTranslation` consumer at once, so **no restart is needed**. Tab titles are set from `t()` in [(tabs)/_layout.tsx](../src/app/(app)/(tabs)/_layout.tsx), so they update too.
- **Saved** in a persisted preferences store (`src/store/preferences.ts`: `language`, `uiMode`, `sunlight`, `voiceAuto`), using the same storage as the persisted query cache.
- **Server sync:** after login, `GET /auth/me` returns `preferredLanguage`. The rules are:
  1. If the user chose a language on this device *before* logging in, that choice wins and is sent with `PATCH /auth/me/preferences`.
  2. Otherwise the server value wins. This means an owner can set a worker's language from the web or from Users in the app.
  3. On logout, the app goes back to the language chosen before login. This matters on **shared phones**: a Telugu-speaking worker and a Hindi-speaking supervisor each get their own language.
- **System per-app language** (Stage 2, needs a native build): declare `supportedLocales` in the `expo-localization` plugin, so the app is listed under Android 13+ and iOS per-app language settings. Per the Expo localization guide, **iOS restarts the app** when the language changes in Settings, and **Android does not**. On Android, use `useLocales()` (it re-renders on OS changes) and follow the system language **only if the user never picked one in the app**. An explicit in-app choice always wins.

### 1.6 Fallback, numerals, dates and units

**Missing keys.** i18next `fallbackLng` falls back per key along a chain that keeps the reader in a script they can read:

```ts
fallbackLng: {
  mr: ['hi', 'en'],   // same script (Devanagari)
  gu: ['hi', 'en'],   // Gujarati readers usually read Hindi
  pa: ['hi', 'en'],
  default: ['en'],    // te, ta, kn, ml, bn, or → English (Hindi is not a safe bet in the south or east)
}
```

A missing key is a bug. CI fails if any shipped locale is missing a Simple-mode key (§5.6).

**Numerals.** We checked `Intl` output in this project (Node/V8 ICU, Nov 2026). Defaults vary by locale:

| Locale | `Intl.NumberFormat(l).format(1234567.5)` | Problem |
| --- | --- | --- |
| `en-IN`, `hi-IN`, `te-IN`, `ta-IN`, `gu-IN`, `pa-IN` | 12,34,567.5 | none |
| `mr-IN` | १२,३४,५६७.५ | Devanagari digits by default |
| `bn-IN` | ১২,৩৪,৫৬৭.৫ | Bengali digits by default |
| `kn-IN` | 1,234,567.5 | Western grouping |
| `mr-IN-u-nu-latn` currency, `or-IN`, `ml-IN` currency | ₹1,234,567 | Western grouping |

Hermes on device may differ again, because it uses platform formatters. Rules:

- **Always use Western digits** 0–9. They match the phone keypad, the rupee notes, bill books and egg-rate boards. Low-literacy users often recognise digits even when they cannot read words (Medhi et al.), but many struggle with numbers of **4 or more digits** (MicroSave). That is why Simple mode adds pictures and voice to large counts (§3).
- **Indian grouping (12,34,567) everywhere**, produced by our own formatter in `src/lib/format.ts`, not by `Intl` grouping.
- **Lakh / crore words** only in compact displays (Standard-mode KPI cards: "₹1.42 लाख", "₹1.42 lakh"). The words come from our own translation keys (`units.lakh`, `units.crore`), not from `Intl` compact notation, which gave "1.5మి" (million) for Telugu.
- A setting for "native digits" (Marathi/Bengali) is **not in v1**. Add it only if field tests ask for it.

**Dates.**
- In Simple mode, show **"Today" or "Yesterday" with a pictogram** (sun over a tray, or a moon) instead of a date. Use the date strip only to correct a day.
- Otherwise use the day number, the month name in the user's language (from our own month keys) and the weekday. **Never all-numeric dates** (23/11 vs 11/23 is ambiguous).
- Use morning and evening **icons** (sunrise, sunset) for collection times, not clock times.

**Units.**

| Thing | Base unit (API) | Shown as | Notes |
| --- | --- | --- | --- |
| Eggs | count | **trays + loose eggs** (1 tray = 30) and the total | Tray size is a farm setting (default 30). An optional "case/peti" unit has a configurable size. Stored as a count, so no API change. |
| Feed | the purchase's `unit` (usually kg) | **bags + kg** (bag size from the purchase, e.g. 50 kg), with half-bag tiles | Uses the existing purchase `unit`. Add `bagSizeKg` to feed purchase (optional, backend). |
| Birds | count | count, with a hen pictogram | |
| Weight | kg | kg with 1 decimal in Standard mode; heavy/medium/light hen pictures are not used for data | |
| Money | ₹ integer | ₹ with Indian grouping; spoken in full in Simple mode | |

### 1.7 Writing rules for every language

- **Respectful, gender-neutral phrasing.** Hindi and Marathi verbs agree with the speaker's gender ("तुम्ही जतन केलेत" vs "केलीस"). Use impersonal forms ("जतन झाले", "saved") and the respectful *आप / तुम्ही* forms.
- **Use the farmer's word, even when it is English.** Many farmers say "feed", "batch", "vaccine", "tray". If they do, the glossary uses the transliterated loanword (फीड, बॅच), not a formal Sanskritised term.
- **Short sentences for voice.** Prompts should be ≤ 8 words, one idea each (Google NBU Voice Playbook: break long text into short sentences).
- **Budget for longer text.** Labels may run 30–60% longer than English and Indic scripts need more line height (§4.4). Tiles allow 2 lines, and nothing important is truncated.

---

## 2. Two modes, one app

### 2.1 Options considered

| Option | For | Against |
| --- | --- | --- |
| A. A separate "lite" app | Simplest screens | Two store listings, two release trains, and owners and workers no longer see the same app. Rejected. |
| B. One fully adaptive design that guesses from behaviour | No setting | It changes under the user. **Consistency is the most important property for low-literacy users** (Medhi 2007 found a consistent help feature was a key overlooked need, and hierarchy navigation is harder with less schooling: Medhi Thies 2013). Rejected. |
| **C. One app with two explicit modes** (chosen) | Predictable. Same data, rules and API. Owners keep dense screens. Workers get a guided path. | Two sets of screens for daily tasks. This is limited because Simple mode covers only daily tasks (about 6 flows). |

### 2.2 What differs

| | **Simple mode** (workers, low literacy) | **Standard mode** (owners, managers, educated workers) |
| --- | --- | --- |
| Home | 2-column grid of **4–6 big picture tiles** (Eggs, Dead birds, Feed, Medicine/Vaccine, Sale if allowed, Me), each with today's status (tick + number, or an empty circle) | Dashboard as in the plan: farm switcher, Today checklist, KPI cards, charts |
| Navigation | No tab bar. **Home is the only hub.** Every task is ≤ 2 levels from Home. A fixed **Home** button sits bottom-left on every screen, and a back arrow sits top-left. | Tabs Home · Flock · ＋ · Stock · More |
| Entry | **One question per screen.** Trays/bags steppers, a big number pad, picture choices. **No free text.** | One form per task (steppers, chips, number fields) in a sheet or modal |
| Voice | A recorded prompt plays automatically on each new screen (can be turned off). A 🔊 button replays it. Long-press any tile to hear its name. Numbers are read back. | Off by default. 🔊 available on Quick add tiles. |
| Confirmation | A **picture review** screen, then save with a **10-second Undo**. No modal confirm dialogs. | Sticky Save and "Saving → Saved ✓" as in the plan. Destructive actions still use a confirm. |
| Reading needed | None for daily tasks. Text is always shown with the picture (it helps semi-literate users and helpers). | Normal |
| Money, reports, admin | Hidden, even if permitted. A small "Open detailed app" link in Me offers Standard mode. | Full |

### 2.3 Who gets which

The default comes from the role and permissions in `/auth/me`. It is a pure function next to `visibleTabs` in [menu.ts](../src/features/navigation/menu.ts) so it can be unit-tested:

```ts
export function defaultUiMode(user: User): 'simple' | 'standard' {
  if (!user) return 'standard';
  if (isAdmin(user) || user.role === 'MANAGER') return 'standard';
  // Workers, or anyone who can't see the dashboard or money, get Simple.
  const seesOverview = can(user, 'DASHBOARD') || canAny(user, ['REVENUE', 'EXPENSE', 'REPORT']);
  return seesOverview ? 'standard' : 'simple';
}
```

The mode is picked in this order: the user's explicit choice (saved on the server as `uiMode`) → what the owner set for that user → `defaultUiMode(user)`.

### 2.4 How to switch

- **Standard → Simple:** More → Account → **App style** shows two picture cards, a Simple screenshot and a Detailed screenshot, each with 🔊.
- **Simple → Standard:** Me tile → "Detailed app" card. It is in a sub-screen so it can't be switched by accident on Home.
- **Owner control:** Users → (user) → Language and App style. This needs `USER:UPDATE`, and the backend stores both on the user.
- **Once after first login**, if the default is Simple, a single screen explains with voice: "This is the easy app. To see everything, go to Me." No choice is required.

### 2.5 How it is built

- Route group `src/app/(app)/(simple)/` with its own `_layout.tsx` (a Stack, no tabs), next to `(tabs)`. [(app)/_layout.tsx](../src/app/(app)/_layout.tsx) picks the group with `Stack.Protected guard={uiMode === 'simple'}`, the same pattern [src/app/_layout.tsx](../src/app/_layout.tsx) uses for auth.
- **Shared:** feature hooks (`features/<domain>/hooks.ts`), Zod schemas, API calls, permission checks and formatters. Simple screens are thin views over the same mutations, so an egg entry saved in either mode is the same request.
- **Simple-only components** go in `src/components/simple/`: `BigTile`, `SpeakButton`, `TrayCounter`, `BagCounter`, `NumberPad`, `PictureChoice`, `ReviewCard`, `SuccessScreen`, `UndoBar`, `StepScaffold` (prompt + picture + content + fixed bottom bar).

---

## 3. Daily flows in Simple mode

**Same layout on every step** (`StepScaffold`):

```
┌──────────────────────────────┐
│ ←          (picture)      🔊 │  back top-left · big task picture · replay prompt top-right
│                              │
│   Prompt text (2 lines max)  │  same words as the audio
│                              │
│      [ step content ]        │  counter / pad / picture choices
│                              │
├──────────────────────────────┤
│ [⌂]   [  0 / Skip ] [ ➜ Next ]│  Home always bottom-left; primary always bottom-right,
└──────────────────────────────┘  full height 64 dp; "Next" = arrow, "Save" = tick
```

The rules below apply to all flows:

- **Prompts:** each step's audio plays once when the step opens, 300 ms after the transition. Tapping 🔊 replays it. Leaving the step stops it (`Speech.stop()` / `player.pause()`).
- **Counters:** − / + buttons are 72 dp. Holding + repeats it, speeding up after 1 s. Every change gives a `selectionAsync` haptic. Tapping the big number opens the **number pad**: a full-screen 3×4 grid of 72 dp keys with digits 0–9, ⌫ and ✓, the entered number in 48 sp, and the voice reading the number when ✓ is pressed.
- **Big numbers get two backup channels:** a picture (rows of tray icons, or bag icons) and speech ("78 trays and 12 eggs, 2,352 eggs in all"). This handles users who struggle with 4+ digit numbers.
- **Delayed commit instead of confirm:** Save shows the success screen at once and **holds the network write for 10 seconds**, with an Undo bar and a countdown ring. Undo cancels it locally, so it does not need `DELETE` permission, which workers usually lack. After 10 s the write is sent (in Stage 1) or put in the outbox (in Stage 2). If the app is closed during those 10 s, the pending write is kept and sent on next launch.
- **Success screen:** a full-screen green tick (drawn as a shape, not only colour), the summary as pictures and numbers, a `notificationAsync(Success)` haptic, and the voice saying "Saved. 78 trays, 12 eggs." It goes back to Home after 3 s, and the tile now shows ✓ and the count.
- **Errors:** a red octagon with ✕, a recorded "Not saved. Try again." prompt, a big ↻ Retry, and the data kept. Offline in Stage 1: a cloud-with-slash pictogram and "No signal. We will keep it on the phone" once the outbox exists. Until then: "No signal. Try when you have signal", and the entered numbers stay on the screen.

### 3.1 Egg collection (`EGG:CREATE`, POST/PUT `/eggs`)

The data model is one record per farm per day with morning, evening, broken, damaged and sold. Simple mode fills the slot for the current time of day and loads the existing record if there is one, so the evening entry edits the morning record (as the plan requires).

| # | Screen | Picture | Audio (recorded, example in English) | Input | Maps to |
| --- | --- | --- | --- | --- | --- |
| 0 | Home tile **Eggs** | Photo-style egg tray. Status: ✓ 2,340 or ○ | Long-press: "Eggs" | tap | — |
| 1 | *Which farm?* (**skipped if the user has one farm**; the last farm is pre-selected) | Farm cards with a colour band, a big farm initial and the name | "Which farm?" | tap a card | `farmId` |
| 2 | *Morning or evening?* (**auto-selected by clock**: before 13:00 = morning; shown as a toggle, not a separate step) | Sunrise / sunset | "Morning eggs" / "Evening eggs" | tap to change | slot |
| 3 | **How many good eggs?** | Tray | "How many good eggs? Count trays." | **TrayCounter**: big *Trays* stepper (tray icon) + *Loose eggs* stepper (single egg, 0–29, rolls into a tray at 30). Total line below: "= 2,352 eggs" in 40 sp. Tap the total to type the full count on the number pad. | `morning` or `evening` |
| 4 | **Any broken?** | Cracked egg | "Any broken eggs?" | Big **"None" (0)** button on the left + a counter (eggs, not trays) | `broken` |
| 5 | **Any dirty or damaged?** (*optional*, behind a farm setting; by default it is asked together with broken as one question, see open questions) | Dirty egg | "Any dirty eggs?" | as #4 | `damaged` |
| 6 | **Check** | ReviewCard: tray pictures × count, cracked egg × count, and the date as "Today ☀" | Reads it back: "Morning: 78 trays, 12 eggs. Broken: 15. Save?" | Tap any row to go back to that step. Primary ✓ **Save**. | — |
| 7 | **Saved** | Green tick + summary | "Saved." | auto-return; Undo for 10 s | — |

`Sold` is **not asked** in Simple mode; it comes from sales. Soft guard: if today's count is more than 1.5× or less than 0.5× the 7-day average, the review screen shows an amber triangle and plays "That is much more than usual. Is it right?" It needs one extra tap on ✓. It is not a dialog.

### 3.2 Mortality (`CHICKEN:UPDATE`, POST `/chickens/:id/events` type `MORTALITY`)

| # | Screen | Picture | Audio | Input | Maps to |
| --- | --- | --- | --- | --- | --- |
| 0 | Home tile **Dead birds** | **A hen lying on its side** (respectful). Not the current `skull-outline` icon, which needs testing and is likely off-putting or read as "poison". | "Dead birds" | tap | — |
| 1 | **Which batch?** (skipped if only one active batch; the last batch is pre-selected) | Batch cards: big batch number (e.g. **B-07**), layer or broiler pictogram, age in weeks drawn as a small bar, a colour tag the owner can set | "Which batch?" + the batch number read aloud on tap | tap | `chickenId` |
| 2 | **How many died?** | Hen lying down | "How many birds died today?" | Counter (starts at 1), number pad | `count` |
| 3 | **Why?** (*optional*, a big "Don't know" is pre-selected) | 4 pictures: sick bird, heat (sun + thermometer), animal attack (dog/rat), don't know (?) | "Why? If you don't know, go next." | picture choice | `notes` (a fixed code, e.g. `cause:heat`, so it can be translated and reported) |
| 4 | **Check** | Batch card + hen × count + cause picture | "Batch B-07. 3 birds died. Save?" | ✓ Save | — |
| 5 | **Saved** | Tick | "Saved." | Undo 10 s | — |

Soft guard: if the count is above the farm's alert threshold (the server already raises "high mortality" notifications), show an amber triangle and play "That is a lot. The owner will be told." Photo of dead birds (an optional camera step) comes in Stage 2 once uploads exist.

### 3.3 Feed used (`FEED:UPDATE`, POST `/feed/:id/consumption`)

| # | Screen | Picture | Audio | Input | Maps to |
| --- | --- | --- | --- | --- | --- |
| 0 | Home tile **Feed** | Feed sack | "Feed" | tap | — |
| 1 | **Which feed?** (the last-used purchase is pre-selected; skipped if there is only one with stock) | Sack cards: feed-type pictogram (layer mash, chick starter, grower, broiler finisher) with a **colour label matching the colour printed on the bag** if the owner set it, the type name, and a remaining-stock bar (bars, not percentages) | "Which feed?" | tap | `purchaseId` |
| 2 | **How much?** | Sack | "How many bags?" | **BagCounter**: quick tiles **½ · 1 · 2 · 3 bags** + a bags stepper + an optional kg stepper. Total "= 100 kg" in 40 sp. | `quantity` (converted to the purchase unit) |
| 3 | **Check** | Sack × bags, kg | "Layer mash. 2 bags, 100 kilo. Save?" | ✓ Save | — |
| 4 | **Saved** | Tick + new remaining bar. If it is now below the low-stock threshold: an amber sack with "!" | "Saved. Feed is running low." | Undo 10 s | — |

If the quantity is more than the remaining stock, show an amber "Only 1½ bags left in stock" and block saving (the server rejects it too).

### 3.4 Sale (`REVENUE:CREATE`, POST `/revenue`). Only shown when the user has the permission.

| # | Screen | Picture | Audio | Input | Maps to |
| --- | --- | --- | --- | --- | --- |
| 0 | Home tile **Sale** | Hand with rupee notes + egg tray | "Sale" | tap | — |
| 1 | **What did you sell?** | 4 pictures: eggs (tray), birds (hen), manure (sack with a leaf), other (box) | "What did you sell?" | picture choice | `type` |
| 2 | **To whom?** | Up to 6 **frequent customers** as big avatar circles (initials + colour, or a photo later) with names. The name is read aloud on tap. "Other" opens a searchable list. **"New customer" is owner-only.** For a worker, "Someone new" records the sale without a customer, and the owner fixes it later. | "Who bought it?" | tap | `customerId` |
| 3 | **How many?** | Tray / hen | "How many trays?" | TrayCounter (eggs) or counter (birds) | `quantity` |
| 4 | **Rate** | ₹ coin | "Price per tray?" + the rate read aloud | **Pre-filled with this customer's last rate**, otherwise the farm's last rate. Big number with ✎. Tap to open the number pad. | `rate` |
| 5 | **Paid?** | 3 pictures: a full hand of notes (paid), a half hand (part), an empty hand (not paid) | "Did they pay?" | picture choice; "part" opens the number pad for the amount received | `paymentStatus`, `amountPaid` |
| 6 | **Check** | Item × qty × rate = **total in 40 sp**, payment picture | "Eggs. 20 trays at 150 rupees. Total 3,000 rupees. Paid. Save?" | ✓ Save | — |
| 7 | **Saved** | Tick | "Saved." | Undo 10 s; **Share receipt** to WhatsApp comes in M2/M3 when receipt rendering exists | — |

### 3.5 Other Simple tiles

- **Medicine / Vaccine:** batch → pick from the batch's *due* vaccinations (pictogram + name read aloud) → ✓ "Done". This marks the scheduled vaccination administered.
- **Me:** language, voice on/off, Detailed app, log out (a tick button plus Undo-style "Logging out in 5…", not a dialog).
- Weight checks, new batches and feed purchases stay **Standard-only** in v1.

---

## 4. Pictograms, colour and accessibility

### 4.1 Pictogram set

Research supports **lifelike, culturally local pictures** over abstract line icons for low-literacy users (Medhi 2007: semi-abstract graphics plus voice; GSMA: farmers read icons literally). MaterialCommunityIcons ([icon.tsx](../src/components/ui/icon.tsx)) stays for Standard mode. Simple mode gets a commissioned set of flat, full-colour illustrations, exported as SVG and rendered with `expo-image` (already a dependency). Each pictogram has an `id`, a translated `accessibilityLabel` key and a recorded audio key.

| id | Meaning | Current MDI (Standard) | Simple-mode pictogram (brief for the illustrator) |
| --- | --- | --- | --- |
| `eggs` | Egg collection | `egg-outline` | Moulded tray of 30 brown/white eggs, 3/4 view |
| `egg-broken` | Broken | — | Single egg with a crack and a small yolk drip |
| `egg-dirty` | Dirty/damaged | — | Egg with brown smudges |
| `tray` | Unit: tray | — | Empty tray, top view (used in counters) |
| `morning` / `evening` | Collection slot | — | Sun at the horizon, rising / setting, with a hen-house outline |
| `dead-bird` | Mortality | `skull-outline` | Hen lying on its side, eyes closed, muted colours |
| `cause-sick`, `cause-heat`, `cause-predator`, `cause-unknown` | Cause | — | Droopy hen; sun + thermometer; dog/rat; large "?" in a circle |
| `feed` | Feed used | `grain` | Woven feed sack, open top with pellets |
| `feed-layer`, `feed-starter`, `feed-grower`, `feed-finisher` | Feed type | — | Sack with a hen / chick / young bird / broiler symbol on the label |
| `vaccine`, `medicine` | Health | `needle`, `pill` | Vial and dropper (most poultry vaccines go in drinking water or drops); tablets with a water bowl |
| `sale` | Sale | `cash-plus` | Hand holding rupee notes beside a tray |
| `sale-eggs`, `sale-birds`, `sale-manure`, `sale-other` | Sale type | — | Tray; standing hen; sack with leaf; cardboard box |
| `paid-full`, `paid-part`, `paid-none` | Payment | — | Hand full of notes; hand with one note; open empty hand |
| `farm` | Farm | `barn` | Long open-sided poultry shed (local style), not a red Western barn |
| `batch-layer`, `batch-broiler` | Batch type | `bird` | Upright laying hen; heavier broiler |
| `me` | Profile/settings | — | Head-and-shoulders silhouette with a small gear |
| `home` | Home | `home-variant-outline` | House (keep the familiar convention) |
| `speak` | Replay audio | — | Speaker with waves (a standard icon; the NBU playbook advises against old-style microphone art) |
| `ok`, `warn`, `error`, `pending`, `offline` | Status | — | Tick in a circle; triangle with "!"; octagon with "✕"; clock; cloud with an up arrow |

Validate every pictogram with a comprehension test (§6) **before** final art. Draw in a consistent style, use real local objects, and avoid text inside pictures.

### 4.2 Colour semantics (never colour alone)

| Meaning | Colour token | Required second channel |
| --- | --- | --- |
| Done / saved / healthy / paid | success | ✓ in a circle, plus a sound and haptic on save |
| Needs attention / low stock / unusual number | warning | Triangle with "!", plus a voice line |
| Error / mortality alert / unpaid | danger | Octagon with "✕", plus a voice line |
| Not done yet | textMuted outline | Empty circle ○ |
| Waiting to send | neutral | Clock or cloud-up icon + "Waiting" |
| Selected | primary border 3 dp | Tick badge in the corner |

### 4.3 Contrast in sunlight: fixes to the current tokens

WCAG contrast of current light-theme pairs, computed from [tokens.ts](../src/theme/tokens.ts):

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `onPrimary` #FFF on `primary` #DB7706 (every primary button) | **3.16:1** | Fails 4.5:1 for 16 sp labels |
| `primary` text on `background` | **3.03:1** | Fails |
| `warning` #F59F0A on white | **2.13:1** | Fails; never use it for text |
| `success` #1A9948 on white / white on success | 3.69:1 | Fails for text |
| `textMuted` on `background` | 4.53:1 | Passes barely; too weak in sunlight |
| `text` on `background` | 15.98:1 | Passes |

Proposed changes. These are token-level, so they apply to Standard mode too:

- Add `primaryStrong` **#A85800** (white on it is 5.17:1) for primary **button fills and text**. Keep #DB7706 as `primaryBrand` for the logo, illustrations and large ＋.
- Fill success buttons with **#15803D** (5.02:1 with white), and danger fills with **#B91C1C** (6.47:1).
- Warning surfaces use **dark text on amber** (#231D1A on #F59F0A = 7.80:1). Never amber text.
- **Sunlight mode** (Stage 2 in the plan; pull it into M2 for Simple mode): pure white background, #000-ish text, every text pair ≥ 7:1, 2 dp borders on all controls, no muted grey text, no shadows (shadows disappear in glare). Simple mode uses sunlight tokens by default in light theme.

### 4.4 Type and layout

- **Indic scripts need more line height.** Google Fonts' guidance lists Tamil and Telugu among "tall" scripts, and fixed `lineHeight`s in `type` (for example body 16/24) will clip ascenders and conjuncts. Add a per-script multiplier in the theme (`lineHeightScale`: Latin 1.0, Devanagari 1.15, Bengali/Gujarati/Gurmukhi/Odia 1.15, Telugu/Kannada/Tamil/Malayalam 1.25) applied by [text.tsx](../src/components/ui/text.tsx) based on `i18n.language`.
- Simple mode sizes: prompt 22 sp, tile label 20 sp, numbers 40–48 sp bold with tabular figures (existing `numeric` prop).
- **Keep `allowFontScaling` on** (the RN default) and cap it with `maxFontSizeMultiplier` (1.6 on tiles and numbers, 2.0 on body text) so a phone at 130% font size does not break the grid. Test at 1.0, 1.3 and the maximum (§5.6).
- **Fonts:** phase 1 uses **system fonts**. Android uses Noto for scripts Roboto doesn't cover, and iOS ships system fonts for the major Indic scripts. This costs no download and works in Expo Go. Test on 2–3 cheap Android phones (Android Go, Android 11–13) for missing glyphs ("tofu") and wrong conjuncts. Only if a script renders badly, bundle that script's **Noto Sans** (`@expo-google-fonts/noto-sans-<script>`, about 0.1–0.3 MB per weight) through the **`expo-font` config plugin**. This needs a dev build; runtime `useFonts` delays first paint on slow phones.
- **Layout:** use `start` / `end` instead of `left` / `right` everywhere so future RTL (Urdu) works.

### 4.5 Touch, haptics and screen readers

- **Targets:** Standard ≥ 56 dp (`touch.min`, already in place). Simple: tiles ≥ 120 dp tall, counter buttons 72 dp, bottom bar buttons 64 dp, **≥ 12 dp gaps** between targets. Replace `touch.compact` (44 dp, used by the Quick add close button) with 56 dp in Simple mode.
- **Haptics** (`expo-haptics`): `selectionAsync` on counter step, tile select and number key; `notificationAsync(Success)` on save; `Warning` on soft guards; `Error` on failure. On Android, prefer `performAndroidHapticsAsync` (`Confirm`, `Reject`, `Segment_Tick`), which doesn't need `VIBRATE`. iOS haptics do nothing in Low Power Mode, so haptics are never the only feedback.
- **TalkBack / VoiceOver:**
  - Every pictogram button has a translated `accessibilityLabel` via `t()`. [icon.tsx](../src/components/ui/icon.tsx) already hides raw icons from VoiceOver. Also add `importantForAccessibility="no"` for Android.
  - Counters use `accessibilityRole="adjustable"` with `accessibilityActions` `increment` / `decrement` and `accessibilityValue={{ text: t('units.traysAndEggs', {...}) }}` ("78 trays and 12 eggs").
  - Set `accessibilityLanguage={i18n.language}` (iOS) on the root text components so VoiceOver uses the right voice.
  - Success and error messages use `accessibilityLiveRegion="polite"` (Android) or `AccessibilityInfo.announceForAccessibility`.
  - **When a screen reader is on, turn off auto-play prompts** (`AccessibilityInfo.isScreenReaderEnabled()`) so they don't talk over each other.
- **Audio etiquette:** prompts respect a Voice on/off setting in Me. With voice off, the 🔊 buttons remain. `expo-audio` plays in silent mode by default (`playsInSilentMode: true`), but **`expo-speech` is silent on iPhones in silent mode**. That is another reason to use recorded prompts for anything essential.

---

## 5. Engineering changes

### 5.1 i18n folder structure

```
src/i18n/
  index.ts                 # createInstance, init, changeLanguage wrapper, fallback chain
  i18next.d.ts             # typed keys: resources typed from locales/en/*.json
  languages.ts             # registry: code, endonym, englishName, script, ttsLocale,
                           #   fallback, lineHeightScale, status ('ga' | 'beta' | 'hidden')
  locales/
    en/ common.json auth.json home.json flock.json stock.json quickAdd.json
        more.json simple.json units.json errors.json notifications.json glossary.json
    hi/ …same files…
    mr/ …
    te/ …
    ta/ …
    en-XA/                 # generated pseudo-locale, dev builds only
  audio/                   # manifest only; clips live in assets/audio/<lng>/
    manifest.ts            # promptKey → require('…/<lng>/<key>.m4a') per bundled language
```

- **Namespaces** match the existing top-level groups in `en.json` (`common`, `auth`, `tabs`→`common`, `home`, `flock`, `stock`, `quickAdd`, `more`, `farm`→`common`). New ones: `simple` (prompts and labels), `units` (tray, bag, kg, lakh, crore, months, weekdays, today, yesterday), `errors` (error codes from the server), `notifications`.
- **Typed keys:** `i18next.d.ts` types `resources` from the English files, so `t('simple.eggs.howMany')` is checked at compile time, as today. Add a **key-parity test** (Jest) that loads every locale and checks: same key set as `en` (no missing, no extra); same `{{placeholders}}` per key; plural keys use `_one` / `_other` (every phase-1/2 language has only `one` / `other` cardinal categories in CLDR); no empty strings.
- **Plurals:** `t('units.eggs', { count })` with `eggs_one` / `eggs_other`. i18next relies on `Intl.PluralRules`. Add a unit test that runs `new Intl.PluralRules(lng).select(n)` for each shipped language **on Hermes** (run it in the app's debug screen and in Jest). If it throws or is wrong, import `@formatjs/intl-pluralrules/polyfill-force` with only the shipped locales' data before i18next init.
- **Lazy loading: strings no, audio yes.** All translation JSON for every shipped language is small (estimate 10–25 KB each), so **bundle it all**. That keeps language switching instant and offline. Lazy-load **audio packs** instead: bundle the device language plus Hindi and English (about 2–3 MB per language for about 80 short mono AAC/Opus clips), and download others on selection with `expo-file-system` to the document directory, with a progress ring on the language tile. While downloading, use TTS, or silence.
- **OTA fixes:** translation and pictogram-label fixes are JS/asset changes, so they ship through **EAS Update** without a store release once Stage 2 builds exist.

### 5.2 Runtime code

| File | Change |
| --- | --- |
| [src/i18n/index.ts](../src/i18n/index.ts) | Read the saved language first, then `getLocales()` matched against `languages.ts`, then `en`. Fallback chain from §1.6. Export `setLanguage(lng)`: it calls `changeLanguage`, saves the language, PATCHes the server when signed in, and updates `lineHeightScale`. |
| `src/store/preferences.ts` (new) | Zustand persist: `language`, `languageChosenAt`, `uiMode`, `sunlight`, `voiceAuto` |
| [src/lib/format.ts](../src/lib/format.ts) | Own Indian grouping (no locale grouping). `formatCount`, `formatMoney`, `formatCompactMoney(lng)` (lakh/crore from `units`), `formatTraysAndEggs(n, traySize)`, `formatBagsAndKg`, `formatDay(date, lng)` (today/yesterday/day + month key), `speakableNumber(n, lng)` (digits plus unit words for TTS). Unit tests per language. |
| `src/features/voice/` (new) | `usePrompt(key)` plays the recorded clip via `expo-audio`, falling back to `expo-speech` with the translated text when the voice exists, otherwise silence. `useSpeakNumber()` uses TTS for dynamic numbers. `voiceAvailability(lng)` caches `getAvailableVoicesAsync()` filtered by `language.startsWith(lng)`. |
| [src/features/navigation/menu.ts](../src/features/navigation/menu.ts) | `defaultUiMode(user)`, `simpleTiles(user)` (the same `Requirement` checks as `QUICK_ADD`, at most 6, fixed order) |
| [src/app/(app)/_layout.tsx](../src/app/(app)/_layout.tsx) | `Stack.Protected` for `(simple)` vs `(tabs)` by `uiMode` |
| `src/app/(auth)/language.tsx` (new) | The first-launch picker (§1.4). The `(auth)/index.tsx` redirect goes to `/language` when no language is saved. |
| `src/lib/api/` | Send `Accept-Language: <lng>-IN, <lng>;q=0.9, en;q=0.5` on every request. Map error `code` to `t('errors.<code>', params)`, and use the server `message` only as a last resort. |
| [src/components/ui/text.tsx](../src/components/ui/text.tsx) | Apply `lineHeightScale`. Default `maxFontSizeMultiplier`. `accessibilityLanguage`. |
| [src/theme/tokens.ts](../src/theme/tokens.ts) | `primaryStrong`, stronger success/danger fills, a `sunlight` palette, Simple-mode sizes (`touch.tile`, `touch.counter`) |

### 5.3 Backend changes (web repo)

| Change | Detail | Needed by |
| --- | --- | --- |
| `User.preferredLanguage` | `String?`, BCP-47 language code from the supported list. Returned by `/auth/me`. | M1 |
| `User.uiMode` | `'SIMPLE' \| 'STANDARD' \| null` (null = role default) | M2 |
| `PATCH /auth/me/preferences` | `{ preferredLanguage?, uiMode? }` for self. Owners set others via `PUT /users/:id` (`USER:UPDATE`). | M1 |
| `Accept-Language` | Parse it as a fallback when the user has no `preferredLanguage` (e.g. before login: forgot-password email, OTP SMS) | M1 |
| Error codes | Add `code` (e.g. `EGG_ENTRY_EXISTS`, `FEED_STOCK_EXCEEDED`, `AUTH_INVALID`) and `params` to the error envelope `{ success: false, code, message, params, details }`. Zod validation errors carry the issue `code` and `path`. The app translates; `message` stays English for the web and logs. | M1 (new endpoints), M2 (backfill) |
| Notifications | Store `type` + `params` (not rendered text). Render title and body in the **recipient's** language when sending push (Expo) and in the list endpoint (`Accept-Language` or user preference). Keep server-side string files (`backend/locales/<lng>/notifications.json`) with the same keys as the app's `notifications` namespace, so translators work on one source. | M3 |
| Reports (PDF/CSV/XLSX) | `?lang=` (default: user preference). Translated headers and labels. **PDF needs embedded Noto fonts for each script and a renderer that shapes complex scripts** (conjuncts, matras); check the current PDF library with a Telugu and a Marathi sample, because many basic PDF generators don't shape Indic text. CSV in UTF-8 **with BOM** so Excel shows Indic text. Numbers and dates use the same rules as §1.6. | M3 |
| SMS / WhatsApp | OTP SMS and payment reminders in the user's language. WhatsApp Business templates must be **submitted and approved per language**, so keep a per-language template registry. DLT-registered SMS templates in India are also per text. | Stage 2 |
| `FeedPurchase.bagSizeKg` (optional), `Farm.traySize` (default 30) | For bag and tray display | M1 (tray size can start as an app constant) |
| Mortality cause | Fixed codes in the event `notes` now, a `cause` enum later | M2 |

### 5.4 Analytics on language and mode

No analytics library is in the app yet. Define a thin `track(event, props)` interface (no-op in Stage 1, wired to the chosen provider later) and log these **without PII**:

| Event | Props |
| --- | --- |
| `language_selected` | `lng`, `previous`, `source` (`first_run` / `settings` / `system` / `server`), `played_sample` (bool), `samples_played` (count) |
| `ui_mode_changed` | `from`, `to`, `source` (`default` / `self` / `owner`) |
| `task_started` / `task_completed` / `task_abandoned` | `task` (`eggs` / `mortality` / `feed` / `sale` / …), `mode`, `lng`, `duration_ms`, `steps_back`, `used_number_pad`, `prompt_replays`, `guard_shown` |
| `task_undone` | `task`, `mode`, `seconds_after_save` |
| `voice_prompt` | `key`, `source` (`recorded` / `tts` / `none`), `lng` (shows where TTS voices are missing) |
| `missing_translation` | `lng`, `key` (dev / beta only, via i18next `missingKeyHandler`) |

Dashboards: active users by language and mode; median time to log eggs by mode and language; undo rate; abandon rate per step (finds confusing screens).

### 5.5 Expo modules: what to add and what needs a dev build

Verified against the SDK 58 docs (`docs.expo.dev/versions/v58.0.0/…`). Always add with `npx expo install` (AGENTS.md).

| Module | Use | Expo Go? | Notes |
| --- | --- | --- | --- |
| `expo-localization` (installed) | `getLocales()`, `useLocales()` | **Yes** | `useLocales` re-renders on OS change. Android doesn't restart on a language change, iOS does. |
| `expo-localization` plugin `supportedLocales`; app config `locales` (localized app name and iOS permission text) | Per-app language in system settings; app name in Hindi/Telugu/… | **No: native build** | Plugin properties "require a new native app build". Stage 2. |
| `expo-speech` (add, ~58.0.x) | TTS for numbers and names | **Yes** ("Included in Expo Go") | Voices depend on the device's TTS engine. Pick at runtime with `getAvailableVoicesAsync()`. Silent on iOS in silent mode. Google TTS (Android) lists hi, mr, te, ta, kn, bn, gu, ml, pa for India; **no Odia**. Offline voice data may need installing in Android settings. iOS Indic voice coverage is **not confirmed** (one report says Tamil/Telugu/Kannada are missing), so check `speechVoices()` on current iOS. |
| `expo-audio` (add) | Recorded prompts, voice samples | **Yes** | `useAudioPlayer`, `Audio.preload` for near-instant playback, `playsInSilentMode` defaults to true. No microphone permission needed for playback. |
| `expo-haptics` (add, ~58.0.8) | Feedback | **Check.** The SDK 58 page does not carry the "Included in Expo Go" badge that speech/audio/localization/font carry. It has historically shipped in Expo Go. Confirm on a phone before M1 depends on it. | `performAndroidHapticsAsync` doesn't need `VIBRATE`. No-op in iOS Low Power Mode. |
| `expo-file-system` (planned for exports) | Download audio packs | Yes | |
| `expo-image` (installed) | SVG/PNG pictograms | Yes | |
| `expo-font` **runtime** `useFonts` | Fallback fonts if needed | Yes | Delays first render. |
| `expo-font` **config plugin** | Embedded Noto fonts for a badly rendered script | **No: dev build** | Only if device tests show problems. |
| `expo-speech-recognition` (community, v58.0.1 on npm) | Voice entry experiment ("teen trays") | **No: dev build** | Android 13+ needs Google's speech services and a per-locale model download for offline use (`androidTriggerOfflineModelDownload`). `requiresOnDeviceRecognition` keeps audio on device. Not in MVP: noisy sheds, number misrecognition, speaking aloud on shared phones. Stage 2 experiment, Hindi first. |
| `@formatjs/intl-pluralrules` | Only if the Hermes plural test fails | JS only | |

**Stage 1 (Expo Go) can ship:** all languages, the picker, Simple mode, recorded prompts, TTS, and haptics (once checked). **Stage 2 (dev build) adds:** per-app language in system settings, localized app name and permission prompts, embedded fonts if needed, and the speech-recognition experiment.

### 5.6 Testing

| Test | How | When |
| --- | --- | --- |
| Key parity, placeholders, plural forms | Jest over `locales/*` | Every PR (CI) |
| Formatters | Jest: `formatCount`, `formatMoney`, `formatTraysAndEggs`, `formatDay` for every language, including the `mr`/`bn` digit and `kn`/`or`/`ml` grouping traps | Every PR |
| Plural rules on Hermes | Debug screen + Jest | Once per Hermes / RN upgrade |
| **Pseudo-localisation** | Generated `en-XA`: accented Latin, **+40% length**, `⟦…⟧` brackets to reveal clipping and hard-coded strings. Selectable in dev builds. | During development |
| **Longest-string locale** | Generated `xx-LONG`: for each key, the longest string across all shipped locales, with the tallest script's line height | Before each release |
| Screenshot matrix | Maestro flows (already planned for Stage 2; start with Simple flows) on a **360×640 dp** Android emulator at font scale **1.0 / 1.3 / max**, for each locale + `en-XA` + `xx-LONG`, light + sunlight. Review the screenshots for clipping. | Before each release |
| Device rendering | 2–3 real low-end Android phones (Android Go, Android 11–13) + one iPhone: check each script for tofu and broken conjuncts, TTS voice presence, prompt latency | Per new language |
| Screen readers | Manual TalkBack + VoiceOver pass of the 4 Simple flows in each phase-1 language | Per release |
| Translation in context | Translators get the screenshot matrix and must review every string *on screen* | Per new language |

### 5.7 Translation workflow

1. **Glossary first** (`locales/<lng>/glossary.json` plus a shared spreadsheet): about 80 domain terms (batch, flock, layer, broiler, mortality, culling, feed, layer mash, starter, grower, finisher, tray, case/peti, vaccination names such as Ranikhet/ND, Gumboro/IBD, Marek's, deworming, outstanding payment, …). For each term record the **word farmers actually say** (often an English loanword), the formal word, and a note. Interview 3 farmers per language to fill it.
2. **Professional translation** by a native-speaker translator with agriculture or veterinary-extension experience, working from the glossary and screenshots. Machine translation (IndicTrans2 is open source, MIT licence, all 22 scheduled languages) may be used **only as a draft for the translator**, never shipped unreviewed.
3. **Second-linguist review**, then a **farmer review**: 3 farmers per language read or listen to the Simple-mode strings and prompts on the phone.
4. **Voice recording** from the approved script by a native speaker whose accent suits the region (for example coastal Andhra and Telangana Telugu differ; pick one neutral voice, then test). Mono, 24–32 kbps, trimmed, loudness-normalised (−16 LUFS), with a file per prompt key.
5. **Tooling:**
   - *Now (1–3 languages):* JSON in the repo, PR review, a `scripts/i18n-export.ts` and `scripts/i18n-import.ts` to and from XLSX for translators, and the parity test in CI.
   - *From phase 1 complete (5+ languages):* move to a TMS with i18next JSON support, screenshots and glossary. **Tolgee** (open source, can be self-hosted, i18next JSON import/export) or **Crowdin** (cloud; a free tier and an open-source programme that requires applying). The TMS syncs to the repo by PR. The repo stays the source of truth.
6. **Server strings** (notifications, reports, SMS/WhatsApp templates) live in the same TMS project under their own namespaces, so terms stay consistent.
7. **Change control:** when an English string changes meaning, change its **key**, not just the text, so stale translations don't stay in place silently.

### 5.8 Risks

| Risk | Mitigation |
| --- | --- |
| TTS voice missing or poor for a language on a given phone | Recorded prompts for everything essential; TTS only adds to them; `voice_prompt.source` analytics shows the gaps |
| `expo-haptics` not in Expo Go for SDK 58 | Check on day 1 of M1. If missing, wrap it in a no-op until the dev build. |
| Translations wrong for farm terms | Glossary from farmer interviews; farmer review is a release gate |
| Simple mode diverges from Standard | Shared hooks, schemas and mutations; Simple screens are views only; component tests run the same mutation from both modes |
| Shared phones: wrong person's language or mode | Preferences are per user (server) with the pre-login device choice restored on logout. A quick user switch (PIN or photo) is an open question. |
| Login is a barrier for low-literacy users (email + password) | Phone + OTP ([auth-otp.md](auth-otp.md)) is a prerequisite for Simple-mode pilots. Later, a long-lived refresh token (already planned for Stage 2). |
| 10 s delayed commit loses data if the phone dies | Keep the pending write in persisted storage at once; send it on next launch |

---

## 6. Validation plan

### 6.1 Pictogram comprehension (before final art, M1)

- 15–20 participants per phase-1 language (workers, mixed literacy), shown each pictogram alone with "What does this mean?"
- Accept a pictogram at **≥ 66.7% correct** (the ISO 9186 comprehension criterion) and aim for 85% on the task tiles. Redraw any that fail and retest.
- Also test literal readings: the skull, a red barn, and a microphone are likely to be misread.

### 6.2 Field usability rounds (per language)

- **Who:** 5–8 participants per language. 3–4 farm workers (include at least 2 who can't read a short sentence in their language, using a simple reading screen), 2 supervisors, 1–2 owners (Standard mode). Mix ages and genders. Use their own phone where possible, otherwise a low-end Android test phone.
- **Where:** on the farm, in the shed, at real collection time (sunlight, gloves, noise).
- **How:** a short demo of the language picker only. **No training on the tasks.** Think-aloud where people are comfortable. A local-language facilitator who notes every help request. Audio and screen recording with consent.
- **Tasks (scenario cards with pictures, not text):**
  1. Choose your language (fresh install).
  2. Log this morning's eggs: a picture card shows 78 trays + 12 loose, 15 broken.
  3. Log 3 dead birds in batch B-07, cause "heat".
  4. Log 2 bags of layer mash used.
  5. Undo the last entry.
  6. (Owners or workers with permission) Record a sale: 20 trays to a regular customer at ₹150, paid.
  7. (Owners, Standard mode) Find today's egg total and this month's profit, then switch the app to Telugu and back.

### 6.3 Success metrics

| Metric | Target, round 1 | Target, round 2 (go/no-go for the language) |
| --- | --- | --- |
| Task completion **without any help**, Simple mode, tasks 1–5 | ≥ 70% | **≥ 85%** |
| Language picked correctly with no help | ≥ 90% | **100%** |
| Time to log eggs (task 2), median, first attempt | ≤ 90 s | **≤ 60 s** |
| Time to log eggs, median, third attempt (learnability) | ≤ 45 s | **≤ 30 s** |
| Wrong number saved (any task) | ≤ 10% | **≤ 3%** |
| Help requests per participant | ≤ 3 | **≤ 1** |
| Satisfaction: 3-face smiley after each task | ≥ 70% happy | ≥ 80% happy |
| Owner: sees the value of Simple mode for staff (interview) | qualitative | qualitative |

### 6.4 Pilot (2 weeks, one farm per phase-1 language where possible)

- Measure from analytics: % of days with eggs logged before 12:00, feed logged daily, abandon rate per step, undo rate, prompt replays per step (high replay = a confusing prompt), mode switches, language switches.
- Collect weekly 15-minute check-ins with the owner and 2 workers.
- **Exit criterion:** ≥ 90% of days have eggs, feed and mortality logged by workers in Simple mode without the owner re-entering them.

---

## 7. Rollout, aligned with M1–M3 and Stage 2

| Milestone (from the plan) | Language and Simple-mode scope | Done when |
| --- | --- | --- |
| **M0 (done)** | i18next, typed keys, `en.json`, device language detection | — |
| **M1 — Daily operations** | **Foundation:** split `en.json` into namespaces under `locales/en/`; `languages.ts` registry; preferences store; **first-launch language picker** (en + hi + mr text, voice samples recorded); language row in More; key-parity and formatter tests (`mr`/`bn` digit fix, own Indian grouping); pseudo-locale `en-XA`; `Accept-Language` header; contrast fixes (`primaryStrong` etc.). **Simple mode skeleton:** `(simple)` route group, `StepScaffold`, `TrayCounter`, `NumberPad`, `UndoBar`, delayed commit; **egg collection** flow end to end in Simple mode. Add `expo-audio`, `expo-speech`, `expo-haptics` (checked in Expo Go). Backend: `preferredLanguage`, `PATCH /auth/me/preferences`, error codes on new endpoints. Pictogram comprehension test (§6.1) for task tiles. | A worker account opens in Simple mode in Hindi or Marathi, logs eggs with voice prompts, and the entry shows on the website |
| **M2 — Money** | Simple flows for **mortality, feed used, sale, vaccine done**. **Hindi + Marathi complete** (all namespaces, recorded prompts). **Telugu + Tamil** translation + recording started. Sunlight tokens for Simple mode. `uiMode` on the server and owner control in Users. Field round 1 in **hi + mr** (§6.2). Lakh/crore compact money in Standard KPI cards. | Round-1 targets met for hi and mr. Owners record sales in their language. |
| **M3 — Reports and admin** | **Telugu + Tamil** shipped (gated on round 2). Localized **notifications** (server renders by recipient language). **Reports** with `?lang=` (PDF fonts and shaping verified, CSV with BOM). Round 2 in hi/mr; round 1 + 2 in te/ta. TMS (Tolgee or Crowdin) set up. Analytics dashboards for language and mode. | Phase 1 (en, hi, mr, te, ta) meets round-2 targets. Reports and alerts arrive in the user's language. |
| **Stage 2 — Field build** | Dev build: `supportedLocales` (per-app language in system settings), localized app name and permission strings (`locales`), embedded Noto fonts only where device tests need them. Offline outbox replaces the delayed-commit timer. Audio pack downloads. Localized SMS/WhatsApp templates. **Phase 2a: Bengali, Kannada**, then 2b (gu, pa, or, ml) as pilots appear. **Speech-recognition experiment** (`expo-speech-recognition`, Hindi, numbers only) behind a flag. 2-week pilots (§6.4). | A pilot farm per phase-1 language uses Simple mode daily for 2 weeks and meets the §6.4 exit criterion |

---

## 8. Open questions

- [ ] Is the first pilot farm Marathi-speaking (confirms phase 1 order), and are any Bengal or Karnataka farms likely in the next 6 months (which would bring Bengali or Kannada into phase 1)?
- [ ] Broken vs damaged: ask one combined question in Simple mode (store it all as `broken`), or two? Owners decide whether the split matters for their reports.
- [ ] Should workers record sales at all, or are sales owner-only (it removes the hardest Simple flow)?
- [ ] Shared phones: is a "Who is using the phone?" user switch with a PIN or photo needed in Stage 2, or is logout/login with OTP enough?
- [ ] Tray size: always 30, or do some farms or buyers use other packs (the case/peti size varies)? Is a per-farm setting enough?
- [ ] Voice talent: one voice per language, or a male and a female voice tested in round 1?
- [ ] Analytics provider (none chosen yet), and the privacy notice in each language.

---

## Sources

**Production and languages**
- Department of Animal Husbandry and Dairying, *Basic Animal Husbandry Statistics 2025* brochure (2024-25 egg and meat shares): https://dahd.gov.in/sites/default/files/2025-11/BAHS2025Brochure.pdf
- Rural Voice, summary of BAHS 2025 (149.11 bn eggs, +4.44%, 106 eggs per capita, poultry meat 5.18 Mt, state shares): https://eng.ruralvoice.in/livestock-sector-reports-robust-growth-jump-in-milk-meat-and-egg-production
- RBI Handbook of Statistics on Indian States, Table 92 state-wise egg production (for the full state list): https://website.rbi.org.in/web/rbi/-/publications/table-92-state-wise-egg-production
- Current scenario of poultry production in India (slides citing BAHS 2023; top poultry-meat states 2022-23): https://www.slideshare.net/slideshow/current-scenario-of-poultry-production-in-india/267885581
- Census 2011 scheduled-language speakers (Lok Sabha answer): https://xn--i1b5bzbybhfo5c8b4bxh.xn--11b7cb3a6a.xn--h2brj9c/MHA1/Par2017/pdfs/par2021-pdfs/LS-16032021/292.pdf and the summary table at https://en.wikipedia.org/wiki/List_of_languages_by_number_of_native_speakers_in_India
- PIB, PLFS 2023-24 literacy (80.9% overall, 77.5% rural): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2063571

**Design for low-literacy users**
- Medhi, Sagar, Toyama (2007), *Text-Free User Interfaces for Illiterate and Semiliterate Users*, ITID 4(1): https://courses.cs.washington.edu/courses/cse490c/18au/readings/medhi-2007.pdf
- Medhi Thies et al. (2011), *Designing Mobile Interfaces for Novice and Low-Literacy Users*, ACM TOCHI: https://www.microsoft.com/en-us/research/?p=161317
- Medhi Thies, Lakshmanan, Toyama, Cutrell (2013), *Some Evidence for Impact of Limited Education on Hierarchical User Interface Navigation*, CHI: https://www.microsoft.com/en-us/research/?p=164235
- Microsoft Research India, *UIs for low-literate users* project page: https://www.microsoft.com/en-us/research/project/uis-low-literate-users/
- Medhi et al., CHI 2009 (mobile money UIs; digits acceptable for many non-literate users): https://microsoft.com/en-us/research/wp-content/uploads/2016/02/medhi_chi2009.pdf
- MicroSave, *Digital Wallet / oral users concept research* (partial numeracy; trouble with 4+ digit numbers): https://www.microsave.net/files/pdf/DWA_Research_Concept_Development_for_MoWO.pdf
- GSMA Mobile for Development, *Making mobile internet more accessible for people with reading or writing difficulties*: https://www.gsma.com/mobilefordevelopment/blog-2/making-mobile-internet-more-accessible-for-people-with-reading-or-writing-difficulties
- Knoche & Huang, *Text is not the enemy: how illiterates use their mobile phones* (NUI workshop): https://vbn.aau.dk/ws/files/309756266/TextIsNotTheEnemy_NUI_Workshop.pdf
- Google Next Billion Users, *How to help people navigate the internet, voice-first* (Voice Playbook, 2021): https://blog.google/technology/next-billion-users/voice-users-playbook/
- UNESCO-Pearson, *Guidelines for digital inclusion for low-skilled and low-literate people* (draft): https://webarchive.unesco.org/web/20200601002217/https://en.unesco.org/sites/default/files/unesco-pearson_draft_guidelines_for_digital_inclusion.pdf
- Google Fonts Knowledge, *Language support in fonts* (tall scripts need more line height): https://fonts.google.com/knowledge/using_type/language_support_in_fonts

**Expo SDK 58 and React Native**
- Expo docs index and corrections: https://docs.expo.dev/llms.txt
- expo-localization (SDK 58): https://docs.expo.dev/versions/v58.0.0/sdk/localization/
- Localization guide (per-app language, iOS restarts vs Android does not, `locales`, RTL default in SDK 58): https://docs.expo.dev/guides/localization/
- expo-speech (SDK 58): https://docs.expo.dev/versions/v58.0.0/sdk/speech/
- expo-audio (SDK 58): https://docs.expo.dev/versions/v58.0.0/sdk/audio/
- expo-haptics (SDK 58): https://docs.expo.dev/versions/v58.0.0/sdk/haptics/
- Fonts guide (config plugin needs a dev build; `useFonts` works in Expo Go): https://docs.expo.dev/develop/user-interface/fonts/
- Development builds: https://docs.expo.dev/develop/development-builds/introduction/
- expo-speech-recognition (community module): https://github.com/jamsch/expo-speech-recognition and https://npmjs.com/package/expo-speech-recognition
- Google, *Languages supported by TalkBack* (Google TTS Indian languages): https://support.google.com/accessibility/android/answer/11101402?hl=en
- Google, *Text-to-speech output* (installing voice data): https://support.google.com/accessibility/android/answer/6006983?hl=en-GB
- Apple developer forum, missing Indic AVSpeechSynthesisVoice voices: https://developer.apple.com/forums/thread/70390
- Apple, *Languages supported by VoiceOver*: https://support.apple.com/en-au/111748
- Android font fallback config (Noto, Devanagari ordering): https://android.googlesource.com/platform/frameworks/base/+/757d42eaaaae/data/fonts/font_fallback.xml
- React Native accessibility: https://reactnative.dev/docs/accessibility
- React Native Text (`allowFontScaling`, `maxFontSizeMultiplier`): https://reactnative.dev/docs/text

**i18n and translation**
- i18next plurals (`Intl.PluralRules`, suffixes): https://www.i18next.com/translation-function/plurals
- Unicode CLDR plural rules: https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
- FormatJS, React Native / Hermes Intl guide and `intl-pluralrules` polyfill: https://formatjs.github.io/docs/guides/react-native-hermes and https://formatjs.github.io/docs/polyfills/intl-pluralrules
- IndicTrans2 (AI4Bharat; MIT; 22 scheduled languages): https://github.com/AI4Bharat/IndicTrans2 and https://arxiv.org/abs/2305.16307
- Tolgee vs Crowdin (self-hosting, pricing; vendor page, verify): https://tolgee.io/tolgee-vs-crowdin
- Crowdin for open source: https://crowdin.khanacademy.org/product/for-open-source

**Measured in this project (Nov 23, 2026)**
- `Intl.NumberFormat` / `DateTimeFormat` / `PluralRules` output for 11 `*-IN` locales (Node/V8 ICU; Hermes may differ): the table in §1.6.
- WCAG contrast ratios of [src/theme/tokens.ts](../src/theme/tokens.ts) light palette: the table in §4.3.
- npm: `expo-speech-recognition` latest 58.0.1; `expo-haptics` latest 58.0.8; `@expo-google-fonts/noto-sans-devanagari` / `-telugu` 0.4.2.
