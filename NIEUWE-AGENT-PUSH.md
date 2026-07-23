# Nieuwe gekoppelde agent — push v1.12 naar GitHub

**Zoek handoff:** `HANDOFF-ZOEKINDEX.md` · `.cursor/agent-handoffs/handoff.md` · `agent-handoff.json`  
**GitHub toont nu niets** — `git log --grep=handoff` werkt pas **na** onderstaande push/patch.

**Situatie:** GitHub `main` = v1.7.0 (`60423e4`). Alle game-werk (v1.12.3, speel.html, Mats, char select deel 1/2, mikken, …) staat **gecommit** in de **oude** agent-VM, maar is **niet** op GitHub. Een verse clone heeft dus *niets te mergen* — je moet de commits **binnenhalen** en **pushen**.

## Jouw taak (copy-paste in terminal)

```bash
cd stickman-fighter   # repo root
git fetch origin
git log -1 origin/main --oneline   # verwacht: 60423e4 (oud)

# Optie A — patch van tunnel (oude agent moet tunnel aan hebben)
curl -fsSL -H "Bypass-Tunnel-Reminder: true" \
  "https://stickfighter-ipad-b75e.loca.lt/dist/push-naar-github.patch" \
  -o /tmp/push-naar-github.patch
git am /tmp/push-naar-github.patch

# Optie B — als patch faalt: vraag user tunnel aan te zetten of zip:
# https://stickfighter-ipad-b75e.loca.lt/dist/stickman-pages-upload.zip

git log -1 --oneline   # verwacht: v1.12.x / 47cea59+
git push origin main
```

## Na push

- Wacht 2–3 min → GitHub Actions / Pages
- Test: https://brennyz.github.io/stickman-fighter/speel.html
- Markeer in `agent-handoff.json` wish `w-20260723T173249` als done
- Update `codeTruth.remoteMainHead`

## Niet doen

- Geen nieuwe feature-roll; alleen deploy
- `health.json` / `LIVE-LINK.txt` tunnel-lokaal niet committen tenzij bewust

## Referentie oude run

https://cursor.com/agents/bc-019f8b30-9e12-7645-8d43-eb8ec5a0b75e
