# أثير · AETHER

An Arabic-first, portrait arcade game built with **Expo SDK 54, React Native, and React Native Skia**. Original cinematic artwork, a glass-cage escape, and an endless ascent through a bio-mechanical city. The original HTML game is preserved in `legacy/index.html`.

## Run

Requires Node 22+ and npm. Dependencies and all game artwork, fonts, audio, and CanvasKit are local; no API keys or external asset CDNs are needed at runtime.

```sh
npm ci
npm start            # Expo development server / QR code
npm run android     # installed Android emulator or connected device
npm run ios         # macOS + Xcode Simulator required
npm run web         # browser preview on port 8081
```

Use an SDK-54-compatible Expo Go client, or a native development build. For native binaries, use `npx expo run:android` / `npx expo run:ios` with the platform SDKs installed. These commands generate native projects. This repository does not include signing credentials, app-store submission, or prebuilt binaries.

## Controls and progression

- Touch and drag horizontally to steer. Desktop also supports left/right arrows.
- Ascent is automatic. Avoid the textured pillars; collect crystals between them.
- Space skips the intro / starts / resumes; Escape pauses / resumes.
- The pause button and backgrounding the app pause an active flight.
- Completed flights save locally: best altitude, crystal balance, the last 20 runs, selected world/wing, purchases, and settings.
- Worlds unlock at 500 m and 1,500 m. Alternate cosmetic wings cost 40 and 100 crystals. No real-money purchases or server leaderboard.
- Leaving a paused run intentionally abandons that attempt without awarding its rewards.

## Architecture

| Area | Responsibility |
| --- | --- |
| `src/game/engine.ts` | Pure seeded simulation; 60 Hz fixed steps, capped catch-up, core-body AABB collisions, bounded entity counts |
| `src/game/draw.ts` | Skia picture recording; parallax, textured pillars, crystalline highlights, light shafts, cage fragments, flight/touch particles |
| `src/game/GameScene.tsx` | Native gestures, RAF orchestration, lifecycle/keyboard handling; HUD snapshots limited to 10 Hz |
| `src/game/GameView.web.tsx` | Lazy CanvasKit bootstrap; WASM served locally |
| `src/state/progress.ts` | Pure progression reducer, purchase/unlock guards, persisted-data validation |
| `src/state/GameStore.tsx` | AsyncStorage hydration and serialized writes |
| `src/screens/Home.tsx` | Responsive Arabic home, worlds, wings, and flight history |

Logical playfield is 390 × 760; rendering scales uniformly to each viewport and respects safe areas. Collisions use the 22 × 28 bird **core**, deliberately excluding decorative wing tips. World speed and opening width scale with progression. Renderer data is sent via a Reanimated shared picture rather than 60 React tree commits per second. Physics/render recording run on the JS frame loop; consistent 60fps on every device is a target, not a claim of device profiling.

The three worlds share the city artwork with different color treatments, speeds, and gap difficulty. The wing variants use recolored original art. Background fog/light shafts and crystal highlights are layered Skia gradient/blur shaders, not 3D volumetric lighting.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build:web
npx expo export --platform all
```

Tests cover fixed-step determinism, AABB boundaries, collection, pause/resume, intro transitions, long-run entity bounds, saved-data validation, reward accounting, and unlock rules. CI runs these checks and exports all platform bundles. Native device/simulator tests and performance profiling are still required before app-store release.

## Assets

City and bird artwork were generated for this project, optimized locally, and bundled. Ambient music and sound effects are original synthesized PCM audio. Arabic Tajawal fonts are provided by `@expo-google-fonts/tajawal` under the SIL Open Font License. Feather icons are distributed by `@expo/vector-icons` under their upstream license. No runtime tracking, advertisements, or remote services are included.
