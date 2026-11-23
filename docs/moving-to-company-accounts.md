# Moving to the company's accounts

Everything is personal today. Once the company exists (see the company setup guide, kept privately), the code, accounts and app identity move to it. This list says what moves, how, and what we do now so the move stays small.

## What we do now so the move is easy

- **No store, Expo or cloud accounts are created for the app yet.** Testing runs in the browser and in Expo Go, which need none of them.
- **No personal identifiers in code.** The app's name, URL scheme and API address live in `app.json` and `EXPO_PUBLIC_*` variables. The Android `package` and iOS `bundleIdentifier` are not set yet; they will use the company's domain (they can never change after the first store upload).
- **Test data stays local.** The demo backend (`npm run backend:demo`) uses a throwaway database on this laptop. The demo logins are written to `tools/demo-backend/.demo-logins.txt`, which git ignores.
- **Secrets never go in the repo.** `.env` files are ignored; CI uses no secrets.

## What moves, in order

| # | Item | How | Notes |
| --- | --- | --- | --- |
| 1 | GitHub repos (`poultry-mobile`, `poultry-farm-management`) | Create a GitHub organisation owned by a company email, then **Transfer ownership** on each repo | Issues, PRs, stars and history move; GitHub redirects the old URLs. Re-check the "Protect main" ruleset, CODEOWNERS (`@Nomercy10` becomes an org team or stays a person), Actions settings, secret scanning and the interaction limit after the transfer |
| 2 | Local clones | `git remote set-url origin <new url>` | Redirects work, but update anyway |
| 3 | Domain and email | Register the company domain; create a company email for every account below | Apple needs a website and email on the company domain |
| 4 | Expo | Create an Expo **organisation** with the company email before the first cloud build | Set `owner` in `app.json` to the organisation; the project is created there from day one, so nothing to transfer |
| 5 | Hosting (Vercel, Railway, Neon) | Transfer projects to a company team, or recreate them under it | Do this together with the move to the Singapore region |
| 6 | Google Play and Apple developer accounts | Open them **in the company's name** (D-U-N-S needed) | Nothing to transfer if no personal app was ever published |
| 7 | App identifiers | Set `android.package` and `ios.bundleIdentifier` to the company domain, e.g. `in.<companydomain>.poultry` | Before the first store upload |
| 8 | Payments | Razorpay or Cashfree merchant account in the company's name | M5 |
| 9 | Code ownership | IP assignment deed from founder to company | Legal step in the company setup guide |
| 10 | Licence | Decide the licence with the company's lawyer, ideally **before** more code lands | `LICENSE` is still the Expo template's MIT licence naming Expo (650 Industries) as copyright holder. In a public repo that lets anyone reuse the code. Usual choice for a commercial app: remove it (all rights reserved) or make the repo private |

## After the move

- Update links in `README.md` and `docs/`.
- Re-run CI on a test PR to confirm Actions, the ruleset and the required `check` status still work.
- Rotate any tokens created under personal accounts.
