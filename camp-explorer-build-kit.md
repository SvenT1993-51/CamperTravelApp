# Camp Explorer — Build Kit

A starter spec for building the kids' road-trip app in Claude Code.
**Target age:** 5–8 · **Language:** Dutch (content) · **Devices:** tablets (landscape) · **Mode:** fully offline (content pre-generated at build time).

---

## 1. Trip data model

The whole trip is a single `trip.json` bundled with the app. App progress (visited stops, earned stamps, quiz scores, diary entries) lives separately in `localStorage`.

```jsonc
// trip.json
{
  "title": "Onze Zomerreis",
  "home": {
    "id": "home",
    "name": "Sint-Oedenrode",
    "country": "Nederland",
    "flag": "🇳🇱",
    "lat": 51.57, "lng": 5.46
  },
  "stops": [ /* 12 stop objects, in travel order — see schema below */ ]
}
```

### Per-stop schema

```jsonc
{
  "id": "zugspitze",            // slug, used as localStorage key
  "order": 3,                    // position on the route (1 = first stop after home)
  "name": "Zugspitze & Eibsee",
  "country": "Duitsland",
  "countryCode": "DE",
  "flag": "🇩🇪",
  "lat": 47.42, "lng": 10.98,    // for the map marker
  "nights": 2,
  "language": {
    "name": "Duits",
    "localHello": "Hallo / Grüß Gott",
    "currency": "Euro"           // ⚠️ "Zwitserse frank" for Morschach only
  },
  "twist": null,                  // e.g. "Italië, maar ze praten Duits!" for Antholz / Colmar; null if none
  "funFacts": ["…", "…", "…"],    // exactly 3, Dutch, age 5–8
  "phrases": [                    // 5 phrases: Dutch → local, with Dutch-phonetic hint
    { "nl": "Hallo", "local": "Hallo", "say": "ha-loo" }
  ],
  "highlights": [
    { "emoji": "🚠", "title": "…", "blurb": "…" }   // 2–3 highlights
  ],
  "spotChallenge": ["…", "…", "…"],  // 3 "look out for" items, each ends with an emoji
  "quiz": [                          // 3 picture questions
    {
      "q": "…",
      "options": [
        { "label": "…", "img": "assets/zugspitze/q1a.png", "correct": true },
        { "label": "…", "img": "assets/zugspitze/q1b.png", "correct": false },
        { "label": "…", "img": "assets/zugspitze/q1c.png", "correct": false }
      ]
    }
  ],
  "surprise": "…"                    // one extra wow-fact, revealed on a button tap
}
```

---

## 2. Worked example (judge the content quality on this one)

```json
{
  "id": "zugspitze",
  "order": 3,
  "name": "Zugspitze & Eibsee",
  "country": "Duitsland",
  "countryCode": "DE",
  "flag": "🇩🇪",
  "lat": 47.42, "lng": 10.98,
  "nights": 2,
  "language": { "name": "Duits", "localHello": "Hallo / Grüß Gott", "currency": "Euro" },
  "twist": null,
  "funFacts": [
    "De Zugspitze is de allerhoogste berg van Duitsland. Hij is bijna 3000 meter hoog!",
    "Boven op de berg ligt zelfs in de zomer sneeuw. Beneden is het warm en bovenop kun je sneeuwballen gooien!",
    "Je gaat met een kabelbaan naar de top. Die hangt aan een dikke kabel, hoog boven de bomen."
  ],
  "phrases": [
    { "nl": "Hallo", "local": "Hallo", "say": "ha-loo" },
    { "nl": "Dank je wel", "local": "Danke", "say": "dang-kuh" },
    { "nl": "Alsjeblieft", "local": "Bitte", "say": "bit-tuh" },
    { "nl": "Ja / Nee", "local": "Ja / Nein", "say": "jaa / nain" },
    { "nl": "Een ijsje", "local": "Ein Eis", "say": "ain ais" }
  ],
  "highlights": [
    { "emoji": "🚠", "title": "Met de kabelbaan naar de top", "blurb": "Hoog de lucht in tot bijna 3000 meter. Je oren gaan vast 'ploppen'!" },
    { "emoji": "🏊", "title": "Pootjebaden in de Eibsee", "blurb": "Een meer met helder turquoise water aan de voet van de berg." },
    { "emoji": "🥾", "title": "Wandeling rond de Eibsee", "blurb": "Een vlak rondje langs het water, met mooie plekjes om te spelen." }
  ],
  "spotChallenge": [
    "Zoek sneeuw, ook al is het zomer ❄️",
    "Voel je oren 'ploppen' in de kabelbaan 👂",
    "Tel hoeveel bootjes er op de Eibsee liggen 🚣"
  ],
  "quiz": [
    {
      "q": "Wat is de Zugspitze?",
      "options": [
        { "label": "De hoogste berg van Duitsland", "img": "assets/zugspitze/q1a.png", "correct": true },
        { "label": "Een groot meer", "img": "assets/zugspitze/q1b.png", "correct": false },
        { "label": "Een stad", "img": "assets/zugspitze/q1c.png", "correct": false }
      ]
    },
    {
      "q": "Wat ligt er in de zomer boven op de berg?",
      "options": [
        { "label": "Sneeuw", "img": "assets/zugspitze/q2a.png", "correct": true },
        { "label": "Zand", "img": "assets/zugspitze/q2b.png", "correct": false },
        { "label": "Bloemen", "img": "assets/zugspitze/q2c.png", "correct": false }
      ]
    },
    {
      "q": "Hoe ga je naar de top?",
      "options": [
        { "label": "Met de kabelbaan", "img": "assets/zugspitze/q3a.png", "correct": true },
        { "label": "Met de boot", "img": "assets/zugspitze/q3b.png", "correct": false },
        { "label": "Met de fiets", "img": "assets/zugspitze/q3c.png", "correct": false }
      ]
    }
  ],
  "surprise": "Op een heldere dag zie je vanaf de top wel vier landen tegelijk: Duitsland, Oostenrijk, Italië én Zwitserland!"
}
```

---

## 3. Generation prompt (run once per stop, on your couch at home)

Use this with the Claude API (`claude-sonnet-4-20250514`) at build time to generate the other 11 stops. Feed it the highlights you approved.

```
Je schrijft content voor een kinder-reisapp voor een Nederlands gezin op campervakantie.
De kinderen zijn 5 tot 8 jaar oud. Alle tekst is in het Nederlands, op leesniveau van groep 3–4:
korte zinnen, simpele woorden, vrolijk en nieuwsgierig van toon. Niets engs of ingewikkelds.

Maak een JSON-object voor deze stopplaats, volgens exact dit schema:
[plak hier het per-stop schema]

Gegevens van de stop:
- Naam: {naam}
- Land + taal: {land} / {taal}
- Aantal nachten: {nachten}
- Munt: {munt}
- "Twist" (indien van toepassing, anders null): {twist}
- Hoogtepunten om te verwerken: {lijst met goedgekeurde highlights}

Regels:
- Precies 3 funFacts, elk 1–2 korte zinnen.
- Precies 5 phrases: Nederlands → lokale taal, met een Nederlands-fonetische uitspraak in "say"
  (schrijf zoals een Nederlands kind het zou lezen, bv. "dang-kuh", niet IPA).
- 2–3 highlights met emoji, korte blurb.
- 3 spotChallenge-items, elk eindigend op een emoji.
- 3 quizvragen met 3 antwoordopties; precies één correct. Vul img met "assets/{id}/qXY.png".
- 1 surprise: een verrassend weetje in één zin.
- Antwoord met UITSLUITEND geldige JSON, geen uitleg, geen ```-tekens.
```

Parse the response, strip any stray code fences, and write each result into `trip.json`'s `stops` array.

---

## 4. Suggested screen structure (3 tabs)

- **Kaart** — illustrated SVG route map, home + 12 markers, current stop highlighted, line connecting visited stops.
- **Paspoort** — 12 stamps, locked until a parent taps "We zijn hier" on a stop. Unlocking opens that stop's card → fun facts, phrases, highlights, spot-challenge, and the quiz (3 stars to earn).
- **Dagboek** — parent types a short note + picks an emoji; shows as a scrollable timeline.

### Recommended build order
1. App shell + SVG map + "We zijn hier" location setter
2. Stop card (render from `trip.json`, hardcode 1–2 stops to start)
3. Stamp passport + unlock logic (localStorage)
4. Picture quiz + star rewards
5. Diary
6. Generate the full `trip.json` with the prompt above + bundle quiz images
