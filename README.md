# Poultry Mobile

Android + iOS app for the Poultry Farm Management System (web: poultry.rushikeshmhetre.com, repo: `poultry-farm-management`).

Built with Expo (React Native, TypeScript). Offline-first: every entry is saved on the phone and synced to the web backend when a connection is available.

- **Plan, UI spec and architecture:** [docs/mobile-app-plan.md](docs/mobile-app-plan.md)

## Get started

```bash
npm install
npx expo start
```

Then open it on an Android emulator, an iOS simulator, or a development build on your phone.

## Status

Phase 0 (Foundations): the project scaffold is in place. Next, from the plan: design tokens, Expo Router tab shell, WatermelonDB schema, and the `/sync` endpoints in the web backend.
