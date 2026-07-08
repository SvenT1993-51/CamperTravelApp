// The full trophy list, derived from the player's progress. Shared by the
// Trofeeënkamer and the Reisverslag so both agree on what's earned. Each trophy
// is simply earned or not; locked ones still show how to get them. Pure/offline.
export function buildTrophies({ stampCount, fullySpotted, playedCount, threeStarCount, totalStars, quizThreeStar, totalQuizStars, diaryCount, visitedCount, countryCount, totalStops, kentekenFirst = false, kentekenBingo = false, kentekenAllTrip = false }) {
  const base = [
    { id: 'stamp1',    cat: 'Stempels',       icon: '🥇', title: 'Eerste stempel',  desc: 'Verdien je eerste stempel',     earned: stampCount >= 1 },
    { id: 'stamp6',    cat: 'Stempels',       icon: '🎖️', title: 'Op de helft',     desc: '6 stempels verdiend',           earned: stampCount >= 6 },
    { id: 'stamp12',   cat: 'Stempels',       icon: '🏆', title: 'Alle stempels',   desc: `Alle ${totalStops} stempels verdiend`, earned: stampCount >= totalStops },
    { id: 'quiz3star', cat: 'Stempels',       icon: '🌠', title: 'Quizster',        desc: 'Haal 3 sterren in een quiz',    earned: quizThreeStar >= 1 },
    { id: 'quizstars', cat: 'Stempels',       icon: '✨', title: 'Sterrenjager',    desc: 'Verzamel 24 quizsterren',       earned: totalQuizStars >= 24 },

    { id: 'spot1',     cat: 'Speurder',       icon: '🔍', title: 'Speurneus',       desc: 'Vind alles op één plek',        earned: fullySpotted >= 1 },
    { id: 'spot5',     cat: 'Speurder',       icon: '🕵️', title: 'Scherpe ogen',    desc: 'Vind alles op 5 plekken',       earned: fullySpotted >= 5 },
    { id: 'spot12',    cat: 'Speurder',       icon: '🧭', title: 'Meester-speurder', desc: 'Vind alles op elke plek',      earned: fullySpotted >= totalStops },

    { id: 'word1',     cat: 'Woordjes',       icon: '🃏', title: 'Woordspeler',     desc: 'Speel je eerste woordjes-spel', earned: playedCount >= 1 },
    { id: 'word3star', cat: 'Woordjes',       icon: '⭐', title: 'Drie sterren!',    desc: 'Haal 3 sterren in een spel',    earned: threeStarCount >= 1 },
    { id: 'word6',     cat: 'Woordjes',       icon: '💬', title: 'Taalknobbel',     desc: 'Speel op 6 plekken',            earned: playedCount >= 6 },
    { id: 'word12',    cat: 'Woordjes',       icon: '📚', title: 'Woordmeester',    desc: 'Speel op alle plekken',         earned: playedCount >= totalStops },
    { id: 'starrain',  cat: 'Woordjes',       icon: '🌟', title: 'Sterrenregen',    desc: 'Verzamel 24 sterren',           earned: totalStars >= 24 },

    { id: 'diary1',    cat: 'Dagboek & reis', icon: '✏️', title: 'Eerste verhaal',  desc: 'Schrijf je eerste herinnering', earned: diaryCount >= 1 },
    { id: 'diary10',   cat: 'Dagboek & reis', icon: '📖', title: 'Schrijver',       desc: 'Schrijf 10 herinneringen',      earned: diaryCount >= 10 },
    { id: 'trip1',     cat: 'Dagboek & reis', icon: '🚐', title: 'Op reis!',        desc: 'Bezoek je eerste plek',         earned: visitedCount >= 1 },
    { id: 'trip6',     cat: 'Dagboek & reis', icon: '🛣️', title: 'Halverwege',      desc: 'Bezoek 6 plekken',              earned: visitedCount >= 6 },
    { id: 'countries', cat: 'Dagboek & reis', icon: '🌍', title: 'Wereldreiziger',  desc: 'Bezoek alle 5 landen',          earned: countryCount >= 5 },
    { id: 'trip12',    cat: 'Dagboek & reis', icon: '🏁', title: 'Hele reis',       desc: 'Bezoek alle plekken',           earned: visitedCount >= totalStops },

    { id: 'plate1',    cat: 'Onderweg',       icon: '🚗', title: 'Eerste spot',     desc: 'Spot je eerste kenteken',       earned: kentekenFirst },
    { id: 'bingo1',    cat: 'Onderweg',       icon: '🎉', title: 'Bingo!',          desc: 'Maak een volle rij',            earned: kentekenBingo },
    { id: 'plate6',    cat: 'Onderweg',       icon: '🌍', title: 'Zes landen',      desc: 'Spot alle 6 reislanden',        earned: kentekenAllTrip },
  ]
  // The crown: earned once every other trophy is in the bag
  base.push({
    id: 'champion', cat: 'Dagboek & reis', icon: '👑', title: 'Reiskampioen',
    desc: 'Verdien alle andere trofeeën', earned: base.every(t => t.earned),
  })
  return base
}
