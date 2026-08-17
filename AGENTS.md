# Cursor agents — één project, één context

Stickman Fighter wordt door **meerdere cloud-agent runs** aangepast (iPad-app, Mac, web). Cursor opent **per run een apart gesprek** — dat is productgedrag; wij lossen **continuïteit in de repo** op, niet “alle agents in één UI-paneel” (dat kan alleen jij: **één agent-URL open houden**).

## Wat jij doet (iPad = Mac, zelfde rechten)

1. **Eén agent-run gebruiken**  
   Bookmark in Safari/Cursor-app:  
   **https://cursor.com/agents/bc-019f8b30-9e12-7645-8d43-eb8ec5a0b75e**  
   (of de run die in `agent-handoff.json` → `canonicalAgent.url` staat.)  
   Nieuwe agent starten = lege chat; open wensen staan dan in `agent-handoff.json`.

2. **Push-meldingen op iPad**  
   Instellingen → Cursor → **Meldingen toestaan** (optioneel).  
   Dat is alleen “agent klaar / input nodig” — **niet** git push en **niet** spel-permissies.

3. **Zelfde kracht als Mac (git push, repo)** — **jij zet dit in Cursor/GitHub**, niet de agent in code:

   | Stap | Waar |
   |------|------|
   | Repo gekoppeld aan cloud environment | [Cloud Agents environment](https://cursor.com/dashboard/cloud-agents/environments/e/310f93c1-85ff-11f1-a7d1-d6b4613131ce) → **brennyz/stickman-fighter** met read/write |
   | GitHub-app mag pushen | GitHub → Settings → Applications → **Cursor** → repository access → stickman-fighter |
   | Zelfde account | iPad Cursor-app = zelfde login als desktop (bzijffers@gmail.com) |

   Als `environment-info` **`repos: null`** toont, kan de agent **wel coden maar vaak niet pushen** (403). Fix de environment-koppeling; daarna iPad en Mac gelijk.

4. **Spel op iPad**  
   Geen Cursor-terminal — zie `IPAD-GEEN-COMMANDO.txt`.  
   Updates: tunnel-bookmark of Pages na `git push` (lokaal: `GITHUB-PUSH.txt`).

## Wat elke agent **altijd** doet bij start

```bash
./scripts/agent-status.sh   # één overzicht: versie, git, wensen, d20, deel-links
```

| Bestand | Doel |
|---------|------|
| **`agent-handoff.json`** | Open wensen, canonical URL, versie waarheid, sessielog |
| **`IMPROVEMENT.md`** | d20-loop (`npm run roll`), agent log, veilig wijzigen |
| **`ASSET-STYLE.md`** | **Leidend** voor knoppen/beelden: tokens, mappen, vervang-workflow |
| **`DEBUG-BLACK-SCREEN.md`** | Zwart/blauw scherm — snelle checklist + overlay |
| **`MENU-VIDEO-OVERHAUL.md`** | Startmenu full-bleed video + glass UI |
| **`SCREEN-VISIBILITY-FUNNEL.md`** | Trechter: lagen, beslisboom, leerlog (eerst lezen bij blauw) |
| **`IPAD-GEEN-COMMANDO.txt`** | Wat Mats op iPad wél/niet doet |

### Play-laag (Avontuur) — canonieke route

**Niet** “nuclear lids” (`display:none !important` op alle `.screen`, MutationObservers, canvas z80). Dat brak adventure terwijl collections nog werkten.

Wel (ochtend-route in `syncPlayLayer` / `startGame`):
1. Menu = `.screen.active`; canvas `visibility:hidden`
2. Play = `state=play` + `body.is-playing`; canvas zichtbaar; **geen** `.screen.active`
3. Dobbel-flash **in** `#levelScreen` (niet buiten `.screen`)
4. Loop: tijdens play/pause **nooit** `drawMenuBackdrop` (#151b33)
5. Flash alleen verbergen bij echte play — niet bij elke menu-`syncPlayLayer`

## GitHub-sync (PC + cloud)

Na betekenisvolle wijzigingen **vragen** of we naar `origin/main` moeten (niet stil pushen).
User zegt **«merge main»** → commit (als nodig) + push `origin/main`. GitHub Actions zet Pages live in ~1–3 min; daarna is `speel.html` bij. Oude app-cache: in het menu «Verse versie».
Wachtlijst: `githubSync` in `agent-handoff.json` — `pendingUpload` (deze clone) en `pendingMerge` (open PRs).
Check: `./scripts/github-sync-status.sh`. Deel-URL blijft `speel.html`.

## Wat elke agent **bij afloop** doet

```bash
./scripts/agent-log.sh "wat is er gedaan (1 zin)" [--done wish-id] [--wish "nieuwe wens"]
```

Dat vult `sessionLog` (max 25) en wishlist-status in `agent-handoff.json`. Daarnaast:

1. Korte regel in **`IMPROVEMENT.md`** agent log.  
2. `codeTruth` in handoff (versie, branch) na release.

## Nieuwe gekoppelde agent (push)

Als `origin/main` nog **60423e4** (v1.7) is: lees **`NIEUWE-AGENT-PUSH.md`** — patch toepassen + `git push` (niet mergen).

De canonieke deel-URL is **`speel.html`** (landing met SPELEN-knop, QR-code en
per-platform installatie-stappen — Android/Chrome én iPad/Safari):

- `hosting.json → bookmarkShare` = `https://brennyz.github.io/stickman-fighter/speel.html`
- In-game **Deel link** en Web Share gebruiken die URL.
- **Nooit** `ipad.html` of tunnel-links delen met nieuwe spelers.

## Branch naming (cloud agent)

`cursor/<kort-onderwerp>-b75e` — push `-u origin <branch>`, PR naar `main`.

## Wat we **niet** kunnen implementeren in game.js

- Cursor-iOS permissies of “alle agents in één app-pagina” mergen.  
- GitHub write tokens — alleen via dashboard hierboven.

Wel: **handoff + één bookmark + environment fix** = iPad-instructies komen overal aan en push kan werken.

## Cursor Cloud specific instructions

Static PWA — **no installable dependencies**. Node and Python 3 are preinstalled; the update script is a no-op. Scripts live in `package.json` / `scripts/`.

- **Build:** `npm run build` concatenates `src/**` modules (per `src/manifest.json`) into the committed `game.js` bundle. `game.js` is generated (~17k lines) — edit `src/` modules, not `game.js` directly, then rebuild.
- **Test / lint:** `npm test` = build + `npm run check` (`node --check game.js` syntax check) + `npm run smoke` (loads `game.js` in a headless DOM stub to catch init/TDZ crashes). There is no separate ESLint/lint tool.
- **Run (dev):** `./start-local.sh` (or `python3 serve.py`) serves the repo statically at `http://127.0.0.1:8787` — open `/index.html`. The game runs fully client-side; keyboard controls (A/D move, W jump, J/K attack) work in the browser.
- **Gotcha:** `serve.py` fires `keep-tunnel.sh` (a localtunnel/Cloudflare side-effect) when `/health.json`, `/LIVE-LINK.txt`, or `/hosting.json` are requested, which rewrites those local files. Tunneling does not work in the cloud VM, but the static server serves the game fine regardless — just don't commit those touched files (see `agentRules`).
