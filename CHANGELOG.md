# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
versions follow [SemVer](https://semver.org/). Entries are generated from
Conventional Commits.

## [Unreleased]

## [1.3.0] — 2026-10-30

### Added

- **Map views**, from the layer button on the map: Default, Terrain (hills,
  gullies and steep banks shaded from open elevation data), Light and Dark —
  all keyless and built on OpenStreetMap. The choice is kept, and the journal's
  map follows it; offline, the saved plain map is shown.
- **Crash reports, only with consent.** A "Crash reports" switch in Settings,
  off by default. Until it is on nothing is sent; once on, Sentry (EU region)
  gets the error, the screen and the phone model — no user, no IP, no
  coordinates, no screenshots. The privacy policy and the store forms say so.
- **A tour of Today, on the real screen.** After the first-launch tour and the
  location dialog, the screen dims and lights up one thing at a time — the
  place, the index, the fish chips, My places, then the Week, Map and Journal
  tabs — each with a word on what it does. A tap anywhere moves on; "Skip" in
  the corner ends it. Shown once, to new and upgrading users alike.
- **Dark theme** — "the lake at night". Follows the phone by default; Settings
  and Profile have Light / Dark / Like the phone. Every colour comes from the
  theme in use (`useColors()`), so switching repaints in place without leaving
  the screen; the splash screen, status bar and the window behind the app
  follow too.
- **Smooth tours.** The lit window glides from one target to the next and the
  ring around it breathes; each explanation rises out of its target. The
  first-launch tour slides from step to step, its badge pops in, and the
  progress dot stretches. All of it runs on the UI thread (Reanimated) and
  stands still under the system's Reduce Motion.
- **"Show the tips again"** in Settings: both tours and the "where does this
  number come from" card, once more.

### Removed

- The "Kliuye Pro — coming soon" card on the Profile tab, for now.

### Fixed

- **Trout in the steppe.** Trout was offered anywhere with fresh water — by
  Donetsk, Kyiv or in Florida. In a warm lowland (below 400 m outside Atlantic
  and northern Europe and the north of North America) its index is now 0, with
  "Too warm a lowland — this fish needs cold mountain water".

## [1.2.0] — 2026-10-17

### Added

- **No index on land.** A point needs water — a lake, river, pond or the sea —
  within 300 m (2 km for the device's coarse position). On land, Today and Week
  say "There is no water here" and lead to the map, and the pin has no number.
- **No freshwater fish at sea.** A pin out at sea, with no lake, river or pond
  within 300 m, gives carp, pike, bream and the other freshwater species an
  index of 0 with "No fresh water here", on Today, in the catalogue and on the
  map pin — the mirror of the existing rule for sea fish far from the sea.
- **Sea fish only in their own seas.** The app knows four seas — the Black Sea
  (with Azov and Marmara), the Mediterranean, the Baltic and the North Atlantic
  (North Sea, Norway, Iceland, Barents) — and which sea fish live in each. Cod,
  saithe and halibut score 0 off Varna; horse mackerel, bluefish and mullet score
  0 off Norway, with "This fish does not live in this sea". Elsewhere in the
  world nothing is ruled out.
- **Freshwater fish only where they live.** Pike, perch, zander, bream, roach,
  wels catfish and crucian are ruled out outside their ranges (Europe, northern
  Asia, East Asia, North America — no wels in Africa, no zander in Japan), and
  every lowland fish above its altitude ceiling (carp above 1,200 m), using the
  terrain height Open-Meteo returns with the forecast.
- **Trout**, for mountain rivers and cold lakes, with no altitude ceiling.
- **A picture of every fish** — Bloch's hand-coloured engravings (1782–1795,
  public domain) — on the species chips, in the catalogue and in the journal, so
  a fish called something else locally is still recognised.
- **Tomorrow on Today:** tomorrow's index and best window, air, wind (speed,
  direction, gusts), pressure with its trend and the chance of rain, and a way
  into the whole week.
- **Tides** in the Tomorrow card — times and heights of high and low water —
  from the sea level in Open-Meteo's marine model, shown only where the tide
  moves 30 cm or more (Norway, the North Sea), never on the Black Sea.
- **Where a fish was caught:** under the place name, pick the point on the map,
  take where you stand, or choose a saved place; the entry keeps the point, and
  a name you typed is never overwritten.
- **A picked point says where it is.** The Today header shows the name you
  gave it or the settlement, and under it the region — "Київська область"
  instead of "picked on the map"; offshore or in the woods, with no settlement,
  the district or region itself is the name.
- **"How do we work it out?"** — a screen with the eight factors, their real
  weights, how species and season change the score, and what the index cannot
  know. Linked from Today and About.
- A note by the species picker: the index is how active a species is in this
  weather, not proof that it lives in this water.
- A four-step tour on first launch; the location dialog waits until it is done.
  Its step about the index shows the weight of each of the eight factors.
- **"Where does this number come from?"** — on the first visit, a card right
  under the index shows the heaviest factors with their weights and says what
  the index is not. It stays until "Got it" or "How we work it out" is tapped.
- **Journal photos you can see.** An entry shows its first photo large, with the
  rest as small tiles under it; a tap on any of them opens it full screen, and a
  swipe goes through the rest. The same works in the entry editor.

### Changed

- The app is called **Kliuye** on the home screen in every language but
  Ukrainian, where it stays **Клює**.
- The privacy text says plainly that there is no sign-up, and that the profile
  (name, photo, settings) stays on the phone.

### Fixed

- **"Access blocked" on the map.** The offline map was prefetched from
  OpenStreetMap's tile servers, which forbid that and blocked the app. It now
  saves OpenFreeMap vector tiles, within that provider's terms, and draws them
  in the same style as online. The old tile folder is deleted.
- "No connection" after returning to the app from recents while online: the
  connection is read again on resume, and any answer from a server — a 403
  included — counts as being online.
- Tapping a town in the search list dropped a pin on the map under it (Android).
- The keyboard covered the note being typed in the journal (Android): forms now
  rise above the keyboard and scroll the field into view; dialogs too.
- Editing a journal entry replaced its place with the water in view on Today.
- A page opened first — after a reload or from a link — had no way out: the
  journal form could not save, delete or leave ("GO_BACK was not handled").
  Every page over the tabs now has its own back button that falls back to a
  sensible home: the journal form to the journal, About to the profile.
- Browser preview: journal photos and the profile photo were blank after a
  reload; they are now kept inline, scaled down, instead of as a `blob:` link.

## [1.1.0] — 2026-09-26

### Added

- **Russian** interface language, picked up from the device like the others;
  the language picker is now two chips to a row.
- **Northern sea fish:** saithe, cod, mackerel, salmon and halibut.
- **Bite seasons:** each species has a bite level for every month, from angling
  calendars for Ukraine, the Black Sea and Norway. In a month the fish is not
  caught at all — catfish in winter, bluefish before August, halibut during the
  Norwegian closure — the index is 0 and the screen says it is out of season.

### Changed

- The location request is now a dialog in the middle of a dimmed screen instead
  of a card on Today, with a fuller explanation of why the position is needed and
  where it goes; "Later" puts it off until the next launch.

### Fixed

- The first launch now opens in the device language — before, the stored
  default overrode it and every new install opened in Ukrainian. A device in a
  language we do not speak gets English.

- Sea fish no longer get a forecast far from the sea: with no sea within 5 km
  of the spot their index is 0 and the screen says why. The coast is read from
  the OpenFreeMap vector tile around the spot and remembered per place.

## [1.0.0] — 2026-09-21

The first public release, on Google Play.

### Added

- **Bite index 0–100** from eight weather factors — pressure and its trend,
  water temperature, wind, moon, time of day, cloud, precipitation and the
  air–water difference — with a verdict, the best three-hour window, an hourly
  curve and a seven-day forecast. Pure domain core with 100% branch coverage,
  including property-based tests.
- **14 species** in freshwater and sea groups, plus the "All species" baseline,
  each with its own temperature, wind, pressure and season profile; a species
  catalogue screen with the index, optimal water range and an "out of season"
  mark.
- **Today:** the index card, species chips, the hourly chart (drag, ‹ › arrows,
  screen-reader `adjustable`), the factor grid and a tip; refresh and "My
  places" buttons in the header; a floating "Updating the forecast… → Forecast
  updated" pill that glides in and out.
- **Map:** MapLibre on free OpenFreeMap vector tiles — no Google key or billing —
  full screen, with a "Where are we fishing?" header, zoom-to-pin and
  "My places" buttons, town search with a **Find** button, a pin dropped with a tap, and
  **Open**, **Route** (by car or on foot, in the phone's maps app) and **Save**
  (a dialog with the suggested name) actions. Saved and recent places.
- **Place names** from the operating system's geocoder, cached on disk, so
  points are named after the nearest settlement rather than shown as
  coordinates.
- **Bite alerts:** a local notification an hour before the best window on days
  with a "Good bite" or "Feeding frenzy" verdict, re-planned with every forecast
  and, between visits, by a background refresh at least 9 hours apart.
- **Catch journal:** date, species, weight, place, note and up to six photos or
  videos, picked through the system picker with no media or camera permission;
  kept on the device only.
- **Profile:** a photo and a name, edited as a draft and stored on the device;
  stats computed from the journal.
- **Offline mode:** the cached forecast with its age, a "No connection" badge,
  and an offline map built from OpenStreetMap tiles prefetched around the
  selected and saved places; cache size and "Clear" in Settings.
- **Device location** as a first-class water, asked for only on a tap after an
  explanation; the app works fully without it.
- **Languages:** Ukrainian, English and Bulgarian, with ICU plurals and Black
  Sea fish names in Bulgarian.
- **Privacy policy** in three languages (`docs/privacy/`, GitHub Pages) and a
  "Write to the developer" row on the About screen.
- **Google Play materials:** listing texts in uk/en/bg, App content and Data
  safety answers, a step-by-step first-release plan (`store/google-play.md`), a
  512×512 icon and a 1024×500 feature graphic (`assets/store/`).
- **Design system** "a float on the water": blaze orange, deep-lake teal and a
  chartreuse accent; a dark index card with ripples; a new app icon. Motion
  durations are tokens and respect Reduce Motion.
- **Tooling:** Expo SDK 57 + expo-router + strict TypeScript; Open-Meteo client
  with typed response validation and TanStack Query caching; eight Maestro flows; GitHub
  Actions running format → lint → typecheck → i18n → tests with coverage
  thresholds → web smoke build; a web preview on Leaflet.

### Security

- The advertising-ID permission `AD_ID` is explicitly blocked, as are fine and
  background location, media library, camera, microphone and
  `SYSTEM_ALERT_WINDOW`.
