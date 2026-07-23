# Hosting — GitHub Pages, Netlify & lokaal

## Nu doen (aanbevolen): GitHub Pages

**Ja — Git + GitHub helpt.** Localtunnel (loca.lt) blijft fragiel (503 + IP-check).  
GitHub Pages geeft een **vaste Safari-URL** die je vanaf hier kunt updaten met `git push`.

### Op je Mac/PC (één keer)

1. Maak een [GitHub-account](https://github.com/signup) (gratis) als je die nog niet hebt.
2. Installeer [GitHub CLI](https://cli.github.com/) en log in: `gh auth login`
3. Kopieer deze map of clone/bundle, ga naar `stickman-fighter`, run:

```bash
chmod +x scripts/*.sh
./scripts/create-github-pages.sh stickman-fighter public
```

4. Wacht tot **Actions → Deploy GitHub Pages** groen is.
5. Open `https://JOUW-USER.github.io/stickman-fighter/` in **Safari** op iPad → **Zet op beginscherm**.

Handmatig (zonder script): zie sectie 1 hieronder.  
Bundle-export (als je alleen de git-geschiedenis wilt): `stickman-fighter-github.bundle` → `git clone stickman-fighter-github.bundle stickman-fighter`.

---

## 1. GitHub Pages (nu al — vaste link)

De map `stickman-fighter` is de **site root** (index.html ligt bovenaan).

### Stappen

1. **Nieuw repo** op [github.com/new](https://github.com/new) (bijv. `stickman-fighter`), leeg.
2. In deze map:

```bash
cd stickman-fighter
chmod +x scripts/*.sh start-local.sh deploy-netlify.sh
git checkout -b main   # als je nog op een feature-branch zit
./scripts/github-setup.sh git@github.com:JOUW-GITHUB-USER/stickman-fighter.git
```

3. Op GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Wacht tot workflow **Deploy GitHub Pages** groen is (tab Actions).
5. Je URL is meestal:

   `https://JOUW-GITHUB-USER.github.io/stickman-fighter/`

   (Als de repo **niet** `USER.github.io` heet, heet het pad `/REPO-NAAM/`.)

6. Vaste link in de game registreren:

```bash
./scripts/set-stable-url.sh https://JOUW-GITHUB-USER.github.io/stickman-fighter/
git add hosting.json && git commit -m "Set stable GitHub Pages URL" && git push
```

7. Open die URL in **Safari** op iPad → **Delen → Zet op beginscherm**.

Op `.github.io` en `.netlify.app` **geen tunnel-wachtscherm** — direct spelen.

---

## 2. Netlify (vanaf ~28 juli / credits OK)

Site-ID staat in `hosting.json` (`netlifySiteId`, gekoppeld aan `.netlify/state.json`).

```bash
cd stickman-fighter
./deploy-netlify.sh
```

Bij succes wordt `hosting.json → stable` automatisch gezet naar je `*.netlify.app` URL.

Als je **Forbidden / credits** ziet: gebruik GitHub Pages tot Netlify weer werkt.

**Alternatief (eenmalig):** sleep de map op [app.netlify.com/drop](https://app.netlify.com/drop) en run daarna:

```bash
./scripts/set-stable-url.sh https://jouw-site.netlify.app
```

---

## 3. Zelf hosten (thuis / tunnel)

### Alleen thuisnetwerk (simpel)

```bash
./start-local.sh
# iPad Safari: http://IP-VAN-JE-PC:8787
```

### Met publieke Cloudflare-link (dev)

```bash
./start-local.sh --tunnel-once   # één tunnel-check
# of
./start-local.sh --tunnel        # watchdog (keep-tunnel.sh)
```

Tunnel-URL staat in `LIVE-LINK.txt` (lokaal, niet in git).

---

## Bestanden

| Bestand | Rol |
|---------|-----|
| `.github/workflows/deploy-pages.yml` | Automatische GitHub Pages deploy |
| `hosting.json` | Vaste URL, hints, Netlify site-id |
| `scripts/set-stable-url.sh` | Zet `stable` na deploy |
| `scripts/github-setup.sh` | Eerste `git push` + uitleg |
| `deploy-netlify.sh` | Productie Netlify |
| `start-local.sh` | `serve.py` + optioneel tunnel |
| `health.json.example` | Voorbeeld; echte `health.json` lokaal via tunnel of CI |

---

## Android & delen met vrienden

Geen Play Store nodig: **dezelfde PWA** als op iPad.

1. Zorg dat **GitHub Pages** live is (`git push` → main).
2. **Deel-link** (voor vrienden — Android én iPad):

   `https://brennyz.github.io/stickman-fighter/speel.html`

   Landing met **SPELEN**, QR-code, en installatie-stappen per apparaat.
   (In het spel: menu → **Deel link** — gebruikt `bookmarkShare`.)

3. Vriend op **Android**: speel.html in **Chrome** → SPELEN → **Zet in app-lade** / Chrome ⋮ → **App installeren**.
   Vriend op **iPad**: speel.html in **Safari** → Delen → **Zet op beginscherm**.

4. Uitgebreide NL-stappen: **[ANDROID-DELEN.txt](./ANDROID-DELEN.txt)**.

| Link | Wanneer |
|------|---------|
| `…/speel.html` | **Delen** (QR + stappen Android/iPad) |
| `…/stickman-fighter/` | Direct spelen (zelfde game) |
| `…/ipad.html` | Optioneel iPad als oude cache problemen geeft |
| `…/android.html` | Doorverwijzing naar hoofd-build |

Tunnel (`loca.lt`) **niet** delen met vrienden — alleen thuis/dev.

---

## iPad checklist

1. Open **https://…** in **Safari** (niet Bestanden-app).
2. **Zet op beginscherm**.
3. Bij URL-wissel: **Instellingen → Export save** en later import op nieuwe link.
