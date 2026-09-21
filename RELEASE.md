# Releasing Kliuye

## 0. Decisions already made (and why)

| Decision      | Value                                        | Reason                                                             |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Tablets       | **phone-only** (`ios.supportsTablet: false`) | no iPad layout was designed; declared honestly in both stores      |
| Orientation   | portrait-only                                | Apple then does not ask for landscape screenshots                  |
| Location      | `WhenInUse`, **coarse**                      | "waters near you" does not need accuracy below 100 m               |
| Accounts      | none                                         | no account-deletion requirement (Apple 5.1.1(v))                   |
| Purchases     | none                                         | the "Kliuye Pro" card has no CTA and no prices — else Apple 3.1.1  |
| Analytics     | none                                         | no ATT prompt, no advertising IDs                                  |
| Ads           | none, `AD_ID` blocked                        | no advertising-ID declaration needed in Play                       |
| Notifications | local only, no push tokens                   | nothing goes to a server; `RECEIVE_BOOT_COMPLETED` comes from Expo |
| Minimum iOS   | 16.0 (Expo SDK 57 default)                   | set it in App Store Connect                                        |

## 1. Secrets

Never in the repository. Required:

| Name                             | Where                       | What for                        |
| -------------------------------- | --------------------------- | ------------------------------- |
| `EXPO_TOKEN`                     | GitHub Secrets              | EAS Build/Submit from CI        |
| App Store Connect API key        | EAS Secrets                 | `eas submit --platform ios`     |
| Google Play service account JSON | `secrets/` (git-ignored)    | `eas submit --platform android` |
| Play upload key + passwords      | `secrets/upload-keystore.*` | signing local release builds    |

Local release builds are signed with the upload key in `secrets/` by
[`plugins/withReleaseSigning.js`](plugins/withReleaseSigning.js); without it they
fall back to the debug key, so a fresh clone still builds. **Back the folder up
outside the repository** — every future update must be signed with the same
key. For EAS cloud builds, upload the same keystore with `npx eas credentials`.

The map needs no key on either platform: it is MapLibre on free OpenFreeMap
tiles, so there is no Google Cloud project and no billing account to keep.

## 2. Versioning

- `version` in `app.config.ts` is semantic and changed by hand in the release PR.
- `buildNumber` / `versionCode` are auto-incremented by EAS
  (`appVersionSource: "remote"`, `autoIncrement: true` in the `production`
  profile).
- Every release gets a git tag `v1.2.3` and a `CHANGELOG.md` entry generated
  from Conventional Commits.

## 3. Building

```bash
npx eas login
npx eas init                                  # once per project: writes the real projectId

npx eas build --profile development --platform android   # dev client
npx eas build --profile preview --platform android       # APK for testers
npx eas build --profile production --platform all        # AAB + IPA
```

The `production` profile produces an **AAB** (not an APK) — a Google Play
requirement. Hermes and R8 are on by default in SDK 57; after minification,
always try a `preview` build by hand rather than only reading the logs.

## 4. Submitting

```bash
npx eas submit --profile production --platform android    # → Internal testing
npx eas submit --profile production --platform ios        # → TestFlight
```

**Always** the internal track / TestFlight first, and production only after it
passes. `eas.json` sets `track: internal`, `releaseStatus: draft` for Android.

Fill in `ascAppId` in `eas.json` before submitting to Apple.

**The very first AAB must be uploaded to Google Play by hand** through Play
Console — the API does not accept an app's first release. The full walkthrough,
with the listing texts and the Data safety answers, is in
[`store/google-play.md`](store/google-play.md).

## 5. Checklist before pressing "Submit"

For Google Play, go through [`store/google-play.md`](store/google-play.md) from
start to finish. The minimum that must not be skipped:

- [ ] `npm run lint && npm run typecheck && npm run i18n:check && npm run test:coverage` — all green.
- [ ] `maestro test e2e/` — all eight flows green on a physical device.
- [ ] A VoiceOver (iOS) and TalkBack (Android) pass through every tab with no dead ends.
- [ ] `fontScale` 200% / the largest Dynamic Type — nothing clipped.
- [ ] First launch in airplane mode + location denied — the app works.
- [ ] Offline map: open the Map with a connection, wait a few seconds, switch on
      airplane mode — the map stays drawn, with the OpenStreetMap attribution.
      Settings show the cache size, and "Clear" frees it.
- [ ] `npx expo prebuild --platform android --clean` → check the final
      `AndroidManifest.xml` (or `aapt2 dump badging` on the APK): only
      `ACCESS_COARSE_LOCATION`, `POST_NOTIFICATIONS`, `ACCESS_NETWORK_STATE`,
      `ACCESS_WIFI_STATE`, `INTERNET`, `VIBRATE`, `WAKE_LOCK` and
      `RECEIVE_BOOT_COMPLETED` (alerts survive a reboot), plus the app's own
      `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; everything else carries
      `tools:node="remove"`, including `com.google.android.gms.permission.AD_ID`,
      the push and launcher-badge permissions, and `SYSTEM_ALERT_WINDOW` (which
      Expo adds for the dev overlay — left in, Play would list "Display over
      other apps"). Delete the generated `android/` folder afterwards (it is in
      `.gitignore`).
- [ ] `Info.plist` has every localisation of the purpose strings
      (`src/i18n/store/*.json`).
- [ ] `PrivacyInfo.xcprivacy` is generated from `ios.privacyManifests` and is true.
- [ ] The privacy policy (`docs/privacy/index.html`) is published on GitHub
      Pages and opens without a login; the URL matches `PRIVACY_URL` in
      `src/config/links.ts` and the field in Play Console. Any change to what
      the app does with data goes into the policy and the Data safety form
      first.
- [ ] **Privacy is not "we collect nothing".** Approximate location leaves the
      device (rounded to 2 decimals, only to Open-Meteo, not stored), so it is
      declared:
  - Apple App Privacy: _Coarse Location_ → **Data Not Linked to You**, purpose
    _App Functionality_; the same in `ios.privacyManifests`.
  - Offline map tiles come from tile.openstreetmap.org, so OSM also sees the
    area's coordinates (to tile precision, with no identifier). That is the same
    _Coarse Location → App Functionality_ category — no extra row in the forms,
    but mention it in the App Review Notes next to Open-Meteo.
  - Play Data safety: _Approximate location_ and _In-app search history_ →
    **collected**, _App functionality_, optional, processed ephemerally, not
    sold and not used for ads.
  - Everything else is genuinely "not collected": no accounts, no analytics, no
    advertising IDs.
- [ ] **The journal and the profile are user content that never leaves the
      device.** Entries (date, species, weight, place, note, photos and videos),
      the profile name and photo live in AsyncStorage and the app's own folders
      and are sent nowhere, so both forms keep them "not collected". Three
      consequences that are easy to miss:
  - Android auto-backup copies AsyncStorage into the user's Drive. That is the
    user's own backup, not collection by the app — but if it is ever turned
    off, do it on purpose, not by accident.
  - There is no account-deletion requirement (there is no account), yet every
    entry can be deleted in the UI — that is "the user controls their data".
  - Media come from the system picker, so the app has neither a library
    permission nor `CAMERA`; this adds no row to the Play form. iOS still
    requires `NSPhotoLibraryUsageDescription`, localised in
    `src/i18n/store/*.json`. Check that the built `AndroidManifest.xml` has no
    `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` or
    `READ_MEDIA_VISUAL_USER_SELECTED`.
- [ ] The "Kliuye Pro" card has no prices and no purchase buttons.
- [ ] Bite alerts: turn the switch on, check that an alert is scheduled for the
      next "Good bite" / "Feeding frenzy" day; turn it off — it is gone.
- [ ] The listing artwork is generated from the current colours:
      `python3 scripts/generate-icons.py` → `assets/store/`.
- [ ] Screenshots are taken from a real build, with no made-up numbers.
- [ ] App Review Notes: "No login needed, there are no accounts. Location
      permission is optional — the app works fully without it: pick a place on
      the map or search for a town. Weather data: Open-Meteo, a public API; map
      tiles for offline mode: OpenStreetMap. The app works fully offline: it
      shows the saved forecast with its timestamp and the saved map."

## 6. Sentry

**Off** in v1: the dependency is not installed and nothing is collected, so both
privacy forms honestly say "no data collected". If it is ever turned on — only
with the user's explicit consent (a separate switch, off by default), and then
both forms, and the privacy policy, have to be rewritten. Do not ship that in
the same release as other changes.

## 7. After the release

- Tag: `git tag -a v1.0.0 -m "v1.0.0" && git push --tags`.
- `CHANGELOG.md` — from Conventional Commits.
- Watch Play Console → Android vitals and App Store Connect → Crashes for the
  first 72 hours.
