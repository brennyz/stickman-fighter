# Agent handoff — Stickman Fighter

**Zoektermen:** `handoff`, `agent-handoff`, `d20`, `character select`, `Mats`, `mikken`, `coinrun`

## Waarom GitHub niets toont

`origin/main` = **60423e4** (v1.7.0). **65+ commits** staan alleen lokaal in de oude agent-VM tot patch/push.

Na push werken o.a.:

```bash
git log --grep=handoff -i
git log --grep=Mats -i
git log --grep="deel 2" -i
```

## Bestanden (na push)

| Pad | Inhoud |
|-----|--------|
| `agent-handoff.json` | Wensen, versie, nextAgent patch-URL |
| `HANDOFF-ZOEKINDEX.md` | Commit-SHA’s + feature → code |
| `NIEUWE-AGENT-PUSH.md` | Patch + `git push` |
| `improvement-d20-bag.json` | d20 + **userFeatureLog** (Mats, mikken, char deel 1/2) |
| `IMPROVEMENT.md` | Agent log per versie |
| `.cursor/agent-handoffs/handoff.md` | Dit bestand |

## Gebruiker-wensen — **al gebouwd** (niet opnieuw rollen)

### d20 #18 — Character select in **twee delen**

| Deel | Versie | Commit (lokaal) | In game |
|------|--------|-----------------|---------|
| 1 | v1.11.1 | `09b7dc2` | Stap 1/2, unlock-hints, saga-tabs |
| 2 | v1.11.2 | `7d236c1` | Icon-strip, Saga clash, Saga-legends |

Menu → **2 spelers** → `charSelectScreen`.

### Mats — bonus muntjes-spel

| Versie | Commit | In game |
|--------|--------|---------|
| v1.12.0 | `f6c86bf` | Modus `coinrun`, knop **Mats · muntjes bonus**, 45s, munten + roze vliegers |

### Mikken met wapen (shuriken) — vloer / vogels / hoog

| Versie | Commit | In game |
|--------|--------|---------|
| v1.12.0 | `f6c86bf` | `projAimVelocity` — joystick ↑ = hoog mikken; vliegers in coinrun; aim-lijn touch |

### Shuriken anti-spam

| Versie | Commit | In game |
|--------|--------|---------|
| v1.12.0 | `f6c86bf` | max 3/1,35s + cooldown 0,4s |

### Delen Android/iPad

| Versie | Commit | URL |
|--------|--------|-----|
| v1.12.2+ | `0a63376`+ | `speel.html`, `bookmarkShare` in hosting.json |

## Nieuwe agent — eerste actie

1. Lees `NIEUWE-AGENT-PUSH.md`
2. `git am` patch van tunnel **of** cherry-pick range `60423e4..91ade38`
3. `git push origin main`
4. **Geen** nieuwe d20-roll voor bovenstaande — alleen deploy tenzij user vraagt om wijziging

## Oude agent (commits bron)

https://cursor.com/agents/bc-019f8b30-9e12-7645-8d43-eb8ec5a0b75e

Patch: `https://stickfighter-ipad-b75e.loca.lt/dist/push-naar-github.patch`

## Losse commit op GitHub (niet handoff)

`04956a4` — alleen `.deploy-check` (user deploy); **niet** in lineage van lokale main. Negeer voor merge; gebruik patch.
