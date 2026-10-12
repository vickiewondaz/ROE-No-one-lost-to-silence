# ROE Release Notes (habit: one entry per shipped version)

> Rule: every version that reaches a phone gets an entry below — newest on
> top. Each entry says what changed and what was verified. Anyone opening the
> GitHub Releases page (or this file) should see discipline, not mystery.

## v1.0.4 (versionCode 5) — 2026-10-11 — current

- Fresh restart after full APK+PWA removal.
- App icon + splash rebuilt from the owner's `roe logo flavicon.png`
  (margins trimmed, mask-safe fit).
- Crash lessons baked in: splash animated icon is `@drawable` (never
  `@mipmap`), CI packaging gate (package, launchable TWA activity,
  non-debuggable, targetSdk 35, DAL JSON, square icon PNGs).
- Verified: CI green (PWA validation + `apksigner` verify), owner confirmed
  the APK installs and opens to the ROE home screen.

## v1.0.3 (versionCode 4) — 2026-10-11 — superseded

- Fixed launch crash: splash `windowSplashScreenAnimatedIcon` pointed at
  `@mipmap/ic_launcher` (adaptive icon) — startup `InflateException` on
  modern phones. Now `@drawable/splash_icon`.
- Roundel-only launcher icon experiment (later replaced by flavicon).

## v1.0.2 (versionCode 3) — 2026-10-11 — superseded

- Roundel-only launcher icon; added CI packaging validation.

## v1.0.1 (versionCode 2) — 2026-10-11 — superseded

- First CI-built TWA (AGP 8.12, Gradle 8.13, browser-helper 2.7.3).
- Retired hand-signed v1 (`public/ROE.apk`, "package appears to be invalid").

## Template for the next one

## vX.Y.Z (versionCode N) — YYYY-MM-DD

- What changed (user-visible first, then technical).
- Verified: CI green + owner/user confirm (who, what device, what result).
