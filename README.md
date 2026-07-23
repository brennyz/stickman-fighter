# Stickman Fighter — als app op iPad (en andere apparaten)

Ja — je kunt dit spel **als app** gebruiken, zonder App Store. Het is een **PWA** (Progressive Web App): fullscreen, eigen icoon op je beginscherm, en offline spelen na de eerste keer laden.

**Hosting (uitgebreid):** zie **[HOSTING.md](./HOSTING.md)** — GitHub Pages, Netlify (vanaf 28 juli), lokaal + tunnel.

**Verbeteringen (agents):** lees **[AGENTS.md](./AGENTS.md)** + **[agent-handoff.json](./agent-handoff.json)** + **[IMPROVEMENT.md](./IMPROVEMENT.md)** — één gedeelde context (iPad/Mac). Kort: **[CURSOR-EEN-AGENT.txt](./CURSOR-EEN-AGENT.txt)**.

## Snelste vaste link (GitHub Pages)

1. Repo op GitHub → push deze map → **Pages: GitHub Actions** aan.
2. `./scripts/set-stable-url.sh https://JOUW-USER.github.io/stickman-fighter/`
3. Safari op iPad → **Zet op beginscherm**.

## Snelste manier: op iPad zetten (Aanbevolen)

1. Zorg dat de game **via een link in Safari** opent — niet alleen als los bestand. Bijvoorbeeld:
   - **GitHub Pages:** zie HOSTING.md (vaste link, gratis).
   - **Netlify:** `./deploy-netlify.sh` zodra credits OK (ca. 28 juli) of [Netlify Drop](https://app.netlify.com/drop).
   - **Thuisnetwerk:** `./start-local.sh` → op iPad: `http://<ip>:8787` (zelfde Wi‑Fi).
2. Open die link in **Safari** op je iPad (niet Chrome — voor “Zet op beginscherm” werkt Safari het best).
3. Tik **Delen** (vierkant met pijl) → **Zet op beginscherm** → **Voeg toe**.
4. Het icoon **Stickman** staat op je beginscherm. Tik erop: het spel start **fullscreen**, zonder adresbalk — net als een app.

In het hoofdmenu zie je ook de box **“Installeer als app”** met dezelfde stappen.

## Wat zit er in de map (app-bestanden)

| Bestand | Doel |
|--------|------|
| `index.html` + `game.js` | Het spel |
| `manifest.webmanifest` | App-naam, icoon, fullscreen, landscape |
| `sw.js` | Offline cache (werkt alleen via `http://` of `https://`, niet via `file://`) |
| `install.js` | Service worker + installatie-hints |
| `icons/icon-*.png` | App-icoon op beginscherm |

## Los bestand (zonder server)

`stickman-fighter-compleet.html` kun je via AirDrop/mail naar je iPad sturen en in Safari openen. Je kunt het soms ook op het beginscherm zetten, maar **offline cache en updates** werken dan minder goed dan een gehoste PWA. Voor de echte app-ervaring: liever een **Netlify/GitHub-link** gebruiken.

## Android / Chrome

Als de site online staat, verschijnt soms **“App installeren”** in het menu (of via het browsermenu). Dat installeert dezelfde PWA.

## App Store (.ipa)?

Een echte **App Store-app** vereist een Apple Developer-account (~€99/jaar) en Xcode. Voor persoonlijk gebruik op iPad is **Zet op beginscherm** vrijwel altijd genoeg en voelt het hetzelfde aan.

## Lokaal testen

```bash
cd stickman-fighter
chmod +x start-local.sh
./start-local.sh
# http://localhost:8787 — op iPad: http://<jouw-ip>:8787
```

## Spelmodi (kort)

- **Avontuur** — levels met vechtmonsters  
- **Training vs RabbitRobot** — AI-duel  
- **Muur slopen** — highscore in 60 sec  
- Geluid & muziek: procedureel, rechtenvrij (Web Audio)
