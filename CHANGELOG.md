# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
versions follow [SemVer](https://semver.org/). Entries are generated from
Conventional Commits.

## [Unreleased]

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
  with a "Good bite" or "Feeding frenzy" verdict, re-planned with every forecast.
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
