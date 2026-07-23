# HANDOFF zoekindex (voor agents & `git grep`)

**handoff** · **agent-handoff** · **Mats** · **mikken** · **character select** · **deel 1** · **deel 2** · **coinrun** · **d20**

> Tot push staat dit **alleen** in lokale main / patch. GitHub `main` = `60423e4` (v1.7).

## Snel zoeken (na patch)

```bash
git log origin/main..HEAD --oneline | wc -l    # ~65 commits
git log --grep=handoff -i --oneline
git log --grep=Mats -i --oneline
git log --grep=mik -i --oneline
git log --grep="deel 2" -i --oneline
rg -l "handoff|coinrun|projAimVelocity|charSelectScreen" .
```

## Feature → versie → commit → code

| Gebruiker vroeg | Versie | Commit | Waar in code |
|-----------------|--------|--------|----------------|
| Character select **deel 1** | 1.11.1 | `09b7dc2` | `index.html` `#charSelectScreen`, `game.js` charPickStep |
| Character select **deel 2** | 1.11.2 | `7d236c1` | `#charIconRow`, `#btnCharSagaClash`, saga strip |
| **Mats** muntjes bonus | 1.12.0 | `f6c86bf` | `coinrun`, `#btnMatsCoins`, `initCoinRun` |
| **Mikken** shuriken (hoog/vliegers) | 1.12.0 | `f6c86bf` | `projAimVelocity`, `drawTouchControls` aim-lijn |
| Shuriken anti-spam | 1.12.0 | `f6c86bf` | `canThrowShuriken`, `SHURIKEN_BURST_*` |
| speel.html delen | 1.12.2+ | `0a63376`+ | `speel.html`, `resolveSharePlayUrl` |
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
