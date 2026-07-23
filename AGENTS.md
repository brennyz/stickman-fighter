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

## Wat elke agent **altijd** leest

| Bestand | Doel |
|---------|------|
| **`agent-handoff.json`** | Open wensen, canonical URL, versie waarheid |
| **`IMPROVEMENT.md`** | d20-loop, agent log, veilig wijzigen |
| **`IPAD-GEEN-COMMANDO.txt`** | Wat Mats op iPad wél/niet doet |

## Wat elke agent **bij afloop** bijwerkt

1. `userWishlist` in **`agent-handoff.json`** (status `done-in-code` / `open`).  
2. Korte regel in **`IMPROVEMENT.md`** agent log.  
3. `codeTruth` in handoff (versie, branch) na release.

Handmatig wens toevoegen (Mac terminal):

```bash
# Voorbeeld — of gewoon in chat; agent zet het in JSON
node -e "
const fs=require('fs');
const p='agent-handoff.json';
const j=JSON.parse(fs.readFileSync(p,'utf8'));
j.userWishlist.unshift({id:'w-'+Date.now(),from:'user',text:'JOUW TEKST',status:'open',updated:new Date().toISOString().slice(0,10)});
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
"
```

## Branch naming (cloud agent)

`cursor/<kort-onderwerp>-b75e` — push `-u origin <branch>`, PR naar `main`.

## Wat we **niet** kunnen implementeren in game.js

- Cursor-iOS permissies of “alle agents in één app-pagina” mergen.  
- GitHub write tokens — alleen via dashboard hierboven.

Wel: **handoff + één bookmark + environment fix** = iPad-instructies komen overal aan en push kan werken.
