# CLAUDE.md — Camp Explorer

A kids' road-trip app for a Dutch family travelling Europe by camper this summer.
One shared tablet, used by all the kids together.

## Non-negotiable constraints
- **Offline-first.** No network calls at runtime. All content is bundled at build time. Never add map-tile services, runtime API fetches, or CDN font/asset loads that need a connection.
- **Language: Dutch.** All UI and content is in Dutch. Audience is children aged 5–8 → short sentences, simple words, friendly tone.
- **Tablets, landscape.** Design baseline 1024×768. Large tap targets (min 64px), big visuals, little text per screen. No tiny controls. (Hover states don't exist on touch — never hide a control behind `:hover`/`group-hover`.)
- **Pronunciation = phonetic text only** (Dutch spelling, e.g. "dang-kuh"). No audio in v1.
- **Map = custom illustrated SVG**, not real map tiles. A stylized route drawn in SVG.
- **No backend.** Trip content is a static `trip.json`. All user progress lives in `localStorage`.

## Stack
- Vite + React + Tailwind CSS
- PWA (service worker via `vite-plugin-pwa`, installable, full offline precache)
- State: React state + localStorage; no external state lib

## Content
- Trip data: `src/data/trip.json` — `{ title, home, stops[] }`. See `camp-explorer-build-kit.md` for the full schema and a worked example (Zugspitze). Each stop has: `funFacts`, `phrases` ({nl, local, say}), `highlights`, `spotChallenge`, `surprise`, `passportQuiz` (3 Qs, each with shuffled `options[]` where one is `correct`), plus `language`, `nights`, `twist`, `lat/lng`.
- Marker positions for the SVG map: `src/data/map-markers.json`.
- 12 stops in travel order: Karlsruhe, Oberteuringen/Bodensee, Zugspitze/Eibsee, Lenggries, Inzell, Kals am Grossglockner, Rasun-Anterselva (Italy, German-speaking), Limone sul Garda, Chiavenna, Morschach (Switzerland — Swiss francs!), Colmar (France, Germanic), Trier. Home = Sint-Oedenrode (NL).
- **Quiz photos** go under `src/assets/<stop-id>/` and are referenced by a question's `image` field. Bundling + offline caching are wired; the picture quiz falls back to text-only when an image is absent. **This is the main open content gap** — only one image is referenced today, so quizzes are effectively text-only until real photos are added.

## App structure
A `WelcomeScreen` gate (kids enter their names) precedes the main shell. The shell is four tabs (`BottomNav`):

- **Kaart** (`KaartTab` → `RouteMap`) — illustrated SVG map: home + 12 markers in order, country highlighting, a route line, and an animated camper van that drives between stops. Pinch/pan zoom. A **reis-teller** dashboard shows km driven so far. "🚐 We zijn hier" enters a mode to tap the current stop; tapping a stop opens its `StopCard` in a side panel.
- **Paspoort** (`PaspoortTab`) — 12 stamp cards. Locked until a stop is visited; a visited stop shows a **⭐ Quiz!** badge. Passing the 3-question picture quiz stamps it (`PassportStamp`) and earns **1–3 stars** by first-try correctness (see below). Stamped cards reopen as a read-only detail (`StopCard`) with a "Quiz opnieuw" option.
- **Trofeeën** (`TrofeeenTab`) — a trophy room grouped by category (Stempels, Speurder, Woordjes, Dagboek & reis). Trophies unlock from all progress sources; locked ones show how to earn them. Newly-earned trophies pop with confetti + a NIEUW! badge. A 👑 Reiskampioen crowns earning every other trophy.
- **Dagboek** (`DagboekTab`) — parent types a short note (emoji picker inserts at the cursor); renders as a date-grouped timeline. Entries are deletable.

## Mini-games & reward systems
- **Woordjes-spel** (`WoordjesSpel`) — a full-screen memory-match game built from a stop's `phrases` (Dutch ↔ local word). Fewer tries = more stars. Opened from the StopCard.
- **Speurtocht** (spot-challenge) — tick off `spotChallenge` items on the StopCard as you spot them for real; completing one earns the "Speurder!" badge.
- **Picture-quiz stars** — 3/3 first try = ⭐⭐⭐, 2/3 = ⭐⭐, else ⭐. Kids always pass eventually (wrong answers retry the same question); the score reflects first-try answers only. Replays keep the best score.
- **Confetti** (`Confetti`) — shared celebration effect used across games, quiz, and trophies.

## localStorage keys
- `ce_names` — kids' names (WelcomeScreen)
- `ce_activeStop` — current stop id (or `home`)
- `ce_visited` — string[] of visited stop ids
- `ce_stamped` — `[{id, date}]` (migrates transparently from an old string[] format)
- `ce_quizstars` — `{ [stopId]: 1|2|3 }` best picture-quiz score
- `ce_wordstars` — `{ [stopId]: 1|2|3 }` best woordjes-spel score
- `ce_spotted` — `{ [stopId]: number[] }` ticked spot-challenge indices
- `ce_diary` — `[{id, date, text, stopId}]`
- `ce_trophies_seen` — trophy ids already celebrated (drives the NIEUW! pop)

## Reliability / PWA
- `ErrorBoundary` wraps the app (`main.jsx`) so a thrown error shows a friendly Dutch "opnieuw starten" screen instead of a white page.
- PWA manifest lives in `vite.config.js`; icons (SVG + 192/512 PNG maskable + apple-touch-icon) are generated offline by `scripts/gen-icons.mjs` (Playwright rasterizer). Workbox `globPatterns` **must** include photo formats (`jpg,jpeg,webp,avif`) or bundled quiz photos won't precache offline.

## Status
The full app (all originally-planned phases 1–6) is built and working. Remaining work is content — real quiz photos — plus polish. `dist/` is git-ignored (build output, not tracked).

## Guardrails
- After a change, **stop and let me review** before piling on more.
- Don't introduce runtime network dependencies.
- Don't add audio, real maps, or a backend without being asked.
- Keep components small and readable; this gets edited on the road.
