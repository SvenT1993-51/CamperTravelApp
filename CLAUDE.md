# CLAUDE.md — Camp Explorer

A kids' road-trip app for a Dutch family travelling Europe by camper this summer.
One shared tablet, used by all the kids together.

## Non-negotiable constraints
- **Offline-first.** No network calls at runtime. All content is bundled at build time. Never add map-tile services, runtime API fetches, or CDN font/asset loads that need a connection.
- **Language: Dutch.** All UI and content is in Dutch. Audience is children aged 5–8 → short sentences, simple words, friendly tone.
- **Tablets, landscape.** Design baseline 1024×768. Large tap targets (min 64px), big visuals, little text per screen. No tiny controls.
- **Pronunciation = phonetic text only** (Dutch spelling, e.g. "dang-kuh"). No audio in v1.
- **Map = custom illustrated SVG**, not real map tiles. A stylized route drawn in SVG.
- **No backend.** Trip content is a static `trip.json`. User progress (visited stops, stamps, quiz stars, diary entries) lives in `localStorage`.

## Stack
- Vite + React + Tailwind CSS
- PWA (service worker, installable, full offline cache)
- State: React state + localStorage; no external state lib needed

## Content
- Trip data: `src/data/trip.json` — see `camp-explorer-build-kit.md` for the full schema and a worked example (Zugspitze).
- Quiz images bundled under `src/assets/<stop-id>/`.
- 12 stops in travel order: Karlsruhe, Oberteuringen/Bodensee, Zugspitze/Eibsee, Lenggries, Inzell, Kals am Grossglockner, Rasun-Anterselva (Italy, German-speaking), Limone sul Garda, Chiavenna, Morschach (Switzerland — Swiss francs!), Colmar (France, Germanic), Trier. Home = Sint-Oedenrode (NL).

## Three tabs
- **Kaart** — SVG route map: home + 12 markers in order, current stop highlighted, line connecting visited stops.
- **Paspoort** — 12 stamps, locked until a parent taps "We zijn hier" on a stop. Unlocking opens that stop's card (fun facts, phrases, highlights, spot-challenge, 3-question picture quiz with stars).
- **Dagboek** — parent types a short note + picks an emoji; renders as a scrollable timeline.

## Build order (do ONE phase per session, stop and let me review)
1. Shell + SVG map + "We zijn hier" location setter + 3-tab nav
2. Stop card rendered from trip.json (hardcode 1–2 stops first)
3. Stamp passport + unlock logic (localStorage)
4. Picture quiz + star rewards
5. Diary
6. Final trip.json content + bundled quiz images + PWA offline verification

## Guardrails
- Don't build later phases until the current one is reviewed.
- Don't introduce runtime network dependencies.
- Don't add audio, real maps, or a backend without being asked.
- Keep components small and readable; this will be edited on the road.
