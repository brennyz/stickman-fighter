# Automatisch elke 2 uur bugs/optimalisaties fixen

Doel: elke 2 uur draait een Cloud Agent die één stuk code bekijkt, bugs of
optimalisaties zoekt, die veilig fixt, `npm test` draait en een PR opent.

## Wat een agent NIET zelf kan (moet jij doen in dashboard)

- **Zichzelf inplannen** (elke 2 uur). Een lopende Cloud Agent kan geen
  automation aanmaken — dat doe jij eenmalig.
- **"Alle power aan zichzelf toekennen"** is niet nodig: **Cloud Agents draaien
  al volledig autonoom** en vragen nooit om goedkeuring per actie. Er is dus
  niets om aan te zetten of te "granten".

## Eenmalig opzetten (jij, ~2 min)

1. Ga naar **https://cursor.com/automations** (of Agents-venster → Automations,
   of gebruik de `/automate` skill in een lokale agent-sessie).
2. **Trigger:** Scheduled → cron **`0 */2 * * *`** (elke 2 uur).
   Let op: een scheduled run kan iets later starten, nooit eerder.
3. **Repository scope:** **Single repository** → `brennyz/stickman-fighter`
   (verplicht voor code-wijzigingen).
4. **Tools:** laat **Pull request creation** aan (standaard).
5. **Prompt:** plak het blok hieronder.
6. Opslaan + activeren.

Sneller alternatief: start vanaf de **"find bugs"**-template in de Cursor
Marketplace en plak dezelfde prompt.

## Prompt om te plakken

```
Je bent een onderhouds-agent voor Stickman Fighter (statische PWA, vanilla JS).

BIJ START (verplicht, repo-conventie):
- Lees AGENTS.md, agent-handoff.json en IMPROVEMENT.md.
- Draai ./scripts/agent-status.sh voor overzicht (versie, git, wensen, d20).

TAAK (één iteratie):
- Kies ÉÉN afgebakend stuk code in src/** (niet de gegenereerde game.js
  direct bewerken — die wordt via `npm run build` uit src/ gebouwd).
- Zoek naar een concrete bug of veilige optimalisatie. Houd het klein en
  laag-risico; geen grote refactors of gameplay-balans-wijzigingen zonder
  de d20/veiligheid-checklist uit IMPROVEMENT.md.
- Pas de fix toe in src/**, draai daarna `npm run build`.

VERIFICATIE (verplicht voordat je een PR maakt):
- `npm test` moet slagen (build + `node --check game.js` + smoke).
- Commit health.json / hosting.json / LIVE-LINK.txt NIET (tunnel-lokaal).

AFRONDEN:
- Nieuwe branch `cursor/<kort-onderwerp>-b75e`, PR met base `main`.
- Beschrijf in de PR wat de bug/optimalisatie was en het testresultaat.
- Draai ./scripts/agent-log.sh "wat is er gedaan (1 zin)" en werk zo nodig
  IMPROVEMENT.md agent-log + codeTruth in agent-handoff.json bij.

Als je geen veilige, duidelijke verbetering vindt: doe niets en meld dat kort.
```

## Let op: elke 2 uur = veel PR's

Een scheduled automation opent standaard **per run een nieuwe PR**. Er is geen
automatische PR-de-duplicatie. Wil je dat beperken, stuur dat dan in de prompt
(bijv. "werk een bestaande open onderhouds-PR bij i.p.v. een nieuwe te openen"),
of review/merge de PR's regelmatig.

## Docs

- Automations (cron, triggers, tools): https://cursor.com/docs/cloud-agent/automations
- "Find bugs" template: https://cursor.com/marketplace/automations/find-bugs
- Cloud Agent settings (CI-autofix, netwerk, team): https://cursor.com/docs/cloud-agent/settings
- Autonomie (Cloud Agents slaan approvals over): https://cursor.com/docs/agent/security/run-modes
