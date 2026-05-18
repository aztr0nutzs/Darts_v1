# Archived QA Artifacts — Pre-Redesign

Everything in this directory was captured **before** the black-first UI redesign work
landed (PRs #18, #19, #20, #21).

These screenshots and logs no longer match the current implementation:

- The screenshots still show the old blue/cyan glass HUD, the cyan-glow main menu, the
  pre-redesign loadout dialog, and the legacy in-game settings/multiplayer lobby.
- The Logcat dumps and reports describe a build whose JS bundle hashes, asset paths,
  and rendered surfaces are now stale.

They are kept here as historical context only. The current truth-of-record QA evidence
lives at the repository root:

- `qa-screenshots-current/` — fresh browser screenshots of the redesigned UI.
- `QA_LIVE_TEST_REPORT.md` — current browser runtime report.
- `QA_ANDROID_RUNTIME_REPORT.md` — Android runtime report (or an explicit
  not-executable-in-this-environment note when applicable).

Do not reference anything in this folder as evidence for the current build.
