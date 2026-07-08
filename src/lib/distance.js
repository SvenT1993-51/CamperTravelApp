// Shared trip-distance math. Used by the map's reis-teller and the Reisverslag
// so both report identical km. Pure, offline, no dependencies.

// Great-circle distance between two {lat, lng} points, in km.
export function haversineKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Real roads wind, so nudge the straight-line distance up a touch to feel right.
export const ROAD_FACTOR = 1.25

// Total road km along the route home → stops (in travel order) up to and
// including the active stop. Returns 0 at home / when nothing is active.
export function kmDrivenTo(home, stops, activeStop) {
  const legPoints = activeStop
    ? [home, ...stops.filter(s => s.order <= activeStop.order).sort((a, b) => a.order - b.order)]
    : [home]
  let km = 0
  for (let i = 1; i < legPoints.length; i++) {
    km += haversineKm(legPoints[i - 1], legPoints[i])
  }
  return km * ROAD_FACTOR
}
