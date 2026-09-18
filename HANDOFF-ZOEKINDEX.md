# HANDOFF zoekindex (voor agents & `git grep`)

**handoff** · **agent-handoff** · **Mats** · **mikken** · **character select** · **deel 1** · **deel 2** · **coinrun** · **d20** · **ASSET-STYLE** · **buttons**

> GitHub `main` is LIVE (v1.18.151+). PC vs GitHub: `./scripts/github-sync-status.sh` en `githubSync` in `agent-handoff.json`.

## Snel zoeken (na patch)

```bash
git log origin/main..HEAD --oneline | wc -l    # ~65 commits
git log --grep=handoff -i --oneline
git log --grep=Mats -i --oneline
git log --grep=mik -i --oneline
git log --grep="deel 2" -i --oneline
rg -l "handoff|coinrun|projAimVelocity|charSelectScreen|ASSET-STYLE" .
```

## Feature → versie → commit → code

| Gebruiker vroeg | Versie | Commit | Waar in code |
|-----------------|--------|--------|----------------|
| **MOTION lived-in + Styles head** | 1.18.170 | #301 `cursor/equip-look-head-a6cb` | `src/render/live-fx.js` ready/flame/spark/cloth; `fighter.pose` idle; gear doll rAF. Versus out. |
| **Buildings UX unclunk** | 1.18.177 | this branch | cards + collect-all i18n · pill 8u tip · sheet chips · empty start · `src/ui/buildings-ui.js` |
| **Buildings UI harden** | 1.18.168 | this branch | list→detail · `#buildingsWallet` · collect once · `src/ui/buildings-ui.js` |
| **Buildings powers + timed loot (4/4)** | 1.18.165 | this branch | binds #292 ids `stick_lighter`…`echo_whistle` · factories/wallet · `src/data/buildings-powers.js` |
| Store / App Store-pad | docs | — | `npm run store:doctor`, `STORE-LAUNCH.md`, `native/ios/APPSTORE-CHECKLIST.md` |
| Android / Play GO | docs | — | `npm run android:go`, `native/android/GO.md`, `docs/store/play-console-stappen.md` |
| Grokbot Android-test | docs | — | `docs/GROKBOT-ANDROID-PROMPT.md` — plak PROMPT in Grokbot |
| **Season overlays (jungle + halloween)** | 1.18.164 | — | `docs/season-overlay-slots.md`, `assets/seasons/`, `#seasonOverlay` |
| **Buildings powers depth + timed 2.0** | 1.18.168 | this branch | identities 0–4 in `src/systems/buildings-combat.js` · rates/table `docs/BUILDINGS-POWERS.md` · #292 tick/collect |
| **Gear loadout (5 slots)** | 1.18.164 | this branch | `src/data/gear.js`, `docs/GEAR-SYSTEM.md`, `#gearScreen` |
| **Season overlay (CSS + story)** | 1.18.164 | — | `SEASON-OVERLAY.md`, `src/systems/seasons.js`, `styles/seasons.css` |
| **Mik-indicator** kleur + radius (Options) | 1.18.164 | — | `save.aimColor` / `save.aimRadius`, `drawPlayerAimIndicator` |
| **FOMO / retention gaps** | docs | — | `docs/FOMO-GAPS.md` (P0–P3 loops, accept criteria) |
| **Asset / knop-stijl (leidend)** | docs | — | `ASSET-STYLE.md`, `assets/buttons/` |
| **Buildings pixel (3 of 4)** | 1.18.164 | this branch | #292 ids `stick_lighter`…`bamboo_boesa`/`echo_whistle` · `BUILDING-PIXEL-MAP.md` |
| Character select **deel 1** | 1.11.1 | `09b7dc2` | `index.html` `#charSelectScreen`, `game.js` charPickStep |
| Character select **deel 2** | 1.11.2 | `7d236c1` | `#charIconRow`, `#btnCharSagaClash`, saga strip |
| **Mats** muntjes bonus | 1.12.0 | `f6c86bf` | `coinrun`, `#btnMatsCoins`, `initCoinRun` |
| **Mikken** shuriken (hoog/vliegers) | 1.12.0 | `f6c86bf` | `projAimVelocity`, `drawTouchControls` aim-lijn |
| **Move-bar aim tutorial** | 1.18.164 | this PR | `src/systems/aim-tutorial.js`, `tipsSeen.moveBarAim`, `__sf.resetAimTutorial()` |
| Shuriken anti-spam | 1.12.0 | `f6c86bf` | `canThrowShuriken`, `SHURIKEN_BURST_*` |
| speel.html delen | 1.12.2+ | `0a63376`+ | `speel.html`, `resolveSharePlayUrl` |
| Top-20 spawn FX | 1.18.164 | this PR | `speciesTop20Ranked`, `triggerTop20SpawnFx`, `AudioSys` `top20Spawn` |
| Agent handoff docs | — | `4de8d95`+ | `agent-handoff.json`, `AGENTS.md` |

## d20 (Ralph bag)

Zie `improvement-d20-bag.json`:

- **Face 18** = character select (cycle 0 + cycle 1 deel 1/2)
- **userFeatureLog** = Mats + mikken (user iPad, **geen** extra d20-roll nodig)

## Patch voor gekoppelde agent

`dist/push-naar-github.patch` (niet in git — te groot)  
URL: https://stickfighter-ipad-b75e.loca.lt/dist/push-naar-github.patch

Stappen: `NIEUWE-AGENT-PUSH.md`

## HEAD lokaal (bron)

`git rev-parse HEAD` → verwacht `91ade38` of nieuwer na deze commit.
