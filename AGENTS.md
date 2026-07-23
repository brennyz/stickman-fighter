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
| **`IMPROVEMENT.md`** | d20-loop, agent log, veilig wijzigen |
| **`IPAD-GEEN-COMMANDO.txt`** | Wat Mats op iPad wél/niet doet |

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
