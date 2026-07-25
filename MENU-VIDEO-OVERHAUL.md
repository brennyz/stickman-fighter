# Menu video overhaul — startscherm full-bleed

**Status:** fase 1 UI (full-bleed canvas + glass zones) — video assets volgen in fase 2  
**Doel:** startmenu met **volledig scherm** omgeving-video(s), UI als translucent overlays volgens de wireframe-zones.  
**Scope:** alleen `#menuScreen` / hub landing. Geen wijziging aan play-laag (`syncPlayLayer`, canvas tijdens Avontuur).

Live referentie: https://brennyz.github.io/stickman-fighter/

---

## 1. Wireframe → zones

Sketch-kleuren (user) → layout-intent:

| Zone | Kleur | Rol | Leesbaarheid |
|------|-------|-----|--------------|
| **A · Stage** | Blauw | Hele viewport = omgeving-video(s) | N.v.t. (beeld) |
| **B · Titel** | Rood | Merk/titel bovenin, breed | Semi-opaque paneel; video licht erdoor |
| **C · Game-menu** | Oranje | Hoofdkeuzes (Avontuur, Arcade, …) in grid | Heel licht opaque; tekst + icoon blijven scherp |
| **D · Meta-menu** | Geel | Niet-game: muziek, missies, opties, tips, verse versie, install | Zelfde glass-taal, iets dichter dan oranje |
| **E · Talen** | Roze | Kleine taal-knoppen linksonder | Compact; lichte tint, geen grote labels |

```
┌──────────────────────────────────────────────┐
│ A  full-bleed video (hele scherm)            │
│                                              │
│          ┌──────────────────────┐            │
│          │ B  TITEL (frost)     │            │
│          └──────────────────────┘            │
│                                              │
│     ┌──────────┐    ┌──────────┐             │
│     │ C item   │    │ C item   │             │
│     └──────────┘    └──────────┘             │
│     ┌──────────┐    ┌──────────┐             │
│     │ C item   │    │ C item   │             │
│     └──────────┘    └──────────┘             │
│     ┌──────────┐    ┌──────────┐  (opt. 3e)  │
│     │ C …      │    │ C …      │             │
│     └──────────┘    └──────────┘             │
│                                              │
│  [E][E][E]     ┌──────── D meta-dock ──────┐ │
│                └───────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 2. Huidige staat vs target

| Onderdeel | Nu | Target |
|-----------|----|--------|
| Achtergrond | `#menuHeroCanvas` inset in `.arcade-stage` (pixel-vista via `paintMenuHeroCanvas`) + body `#151b33` | **Full-bleed** video-laag achter alle UI; canvas-vista blijft **fallback** |
| Titel | In `.arcade-title-block` onder/in stage-box | Zone **B**: eigen frost-balk, brand-first, video erdoor |
| Game-keuzes | 2×2 `.hub-tile-grid` + Continue + profiel | Zone **C**: 2-koloms grid, licht glass; Continue/profiel niet in first-viewport clutter |
| Meta | Footer `.menu-dock` + install | Zone **D**: één horizontale meta-rij |
| Talen | `.menu-lang-wrap` gecentreerd met label | Zone **E**: klein, linksonder, zonder zware label-rij |
| Video-assets | Geen `.mp4`/`.webm` in repo | `assets/menu/` (of `media/menu/`) + preload/SW-regels |

**Niet doen in deze overhaul:** nuclear play-lids, canvas z-index hacks, `drawMenuBackdrop` tijdens play. Zie `AGENTS.md` / `DEBUG-BLACK-SCREEN.md`.

---

## 3. Visuele tokens (CSS-variabelen)

Voorstel — één richting, geen paars-op-wit / cream-serif default:

```css
#menuScreen.menu-video-overhaul {
  --menu-glass-title: rgba(8, 12, 22, 0.55);   /* rood-zone: meer dekking */
  --menu-glass-tile:  rgba(8, 12, 22, 0.28);   /* oranje-zone: heel licht */
  --menu-glass-meta:  rgba(8, 12, 22, 0.42);   /* geel-zone */
  --menu-glass-lang:  rgba(8, 12, 22, 0.35);   /* roze-zone */
  --menu-glass-blur:  10px;                    /* frosted; 0 bij reduced-motion / low-end */
  --menu-ink:         #f2efe6;
  --menu-ink-muted:   rgba(242, 239, 230, 0.78);
  --menu-accent:      #7cf5aa;                 /* adventure tint; per-tile accent ok */
}
```

Regels:

- Tekst altijd **vol opaque** (of ≥0.92); alleen de **paneel-achtergrond** is translucent.
- `backdrop-filter: blur(...)` optioneel; feature-detect + `body.reduced-motion` / `Perf.ultraLite` → blur uit, iets hogere rgba.
- High-contrast: glass dichter (`0.75+`) + 2px border.

---

## 4. DOM-skelet (target)

Concept — bestaande IDs zoveel mogelijk behouden (bindings in `game.js` / `src/`):

```html
<div id="menuScreen" class="screen active menu-hub-landing menu-video-overhaul">
  <!-- A · full-bleed -->
  <div class="menu-stage" aria-hidden="true">
    <video id="menuEnvVideo" class="menu-env-video" playsinline muted loop preload="metadata"></video>
    <canvas id="menuHeroCanvas" class="menu-hero-canvas menu-hero-fallback" …></canvas>
  </div>

  <div class="menu-chrome">
    <!-- B · titel -->
    <header class="menu-title-glass arcade-title-block">…bestaande h1…</header>

    <!-- C · game -->
    <nav class="menu-game-grid hub-tile-grid" …>…hub-tiles…</nav>
    <!-- Continue / profiel: onder first viewport of compact -->

    <!-- footer rij -->
    <footer class="menu-utility-row">
      <div class="menu-lang-compact" id="menuLangBar">…</div>   <!-- E -->
      <div class="menu-meta-dock menu-dock">…</div>               <!-- D -->
    </footer>
  </div>
</div>
```

Z-index: stage `0` · chrome `1+` · geen lids over game-canvas.

---

## 5. Video-pipeline

### 5.1 Assets

| Item | Richtlijn |
|------|-----------|
| Formaat | `.webm` (VP9) primair + `.mp4` (H.264) fallback |
| Duur | 8–20s loop, naadloos of zachte crossfade tussen clips |
| Resolutie | 1280×720 of 960×540 max voor PWA-gewicht |
| Audio | **muted** always (autoplay-policy); menu-BGM blijft WebAudio |
| Inhoud | Echte omgevingen uit het spel (eiland/bos/arena) — geen abstracte gradient als hoofdidée |
| Map | bv. `assets/menu/env-island.webm`, `env-island.mp4` |

### 5.2 Runtime

1. Bij hub zichtbaar (`Perf.menuLandingVisible`): start/resume video.
2. Bij leave hub / `state=play`: **pause** + optioneel `src` unload op low-memory.
3. `prefers-reduced-motion` of `Perf.ultraLite`: geen video → bestaande `paintMenuHeroCanvas`.
4. Fout/load-fail → canvas-fallback automatisch.
5. Optioneel: playlist van 2–3 clips met zachte fade (later fase).

### 5.3 PWA / cache

- SW: video’s als **runtime cache** of “optioneel” — niet in precache (anders install-bloat).
- Poster/still JPG klein wél precachen voor snelle first paint.
- Version bump (`?v=` / SW) alleen voor CSS/JS/HTML; media via eigen hash-pad.

---

## 6. Faseplan (implementatie)

### Fase 0 — Plan & tokens

- [x] Wireframe-zones documenteren
- [x] Link vanuit `AGENTS.md` / `IMPROVEMENT.md`
- [x] Tokens + fase 1 layout zonder gameplay-change

### Fase 1 — Layout shell (CSS/HTML, canvas blijft bron)

- [x] Full-bleed `.menu-stage` achter chrome (canvas uitgerekt `object-fit: cover`)
- [x] Titel-glass (B), tile-glass (C), utility-rij D+E
- [x] Verwijder inset “arcade-stage kaart”-look op landing
- [x] First viewport: **merk + korte regel + game-grid + utility** — geen stats-strips / extra promo’s
- [x] Behoud touch-scroll contract (`#menuScreen` als scroll surface op Android)
- [x] Ship: v1.18.46 / SW v256 (`.menu-video-overhaul`)

### Fase 2 — Video inschakelen

- `<video>` + bronnen + fallback-pad
- Play/pause gekoppeld aan hub visibility
- Reduced-motion / ultraLite / decode-fout → canvas

### Fase 3 — Polish

- Crossfade tussen omgevingen (optioneel gekoppeld aan hub-hover of idle)
- Micro-motion: titel fade-in, tiles stagger (2–3 intentional; geen noise)
- A11y: focus-ringen op glass, contrast-check, lang-knoppen ≥44×44 touch
- iPad landscape: grid blijft 2-col; geen side-panel hero

### Fase 4 — Opruimen

- Dode inset-hero styles / dubbele backgrounds
- Smoke: hub open → video speelt; Avontuur start → video pause + play-laag intact
- Versie + SW bump alleen bij ship

---

## 7. Mapping bestaande knoppen

| Zone | Huidige nodes | Actie |
|------|---------------|-------|
| B | `.arcade-title-block`, `h1.arcade-logo`, `#menuArcadePre`, `#menuVerLine` | Glass-paneel; versie klein houden |
| C | `.hub-tile-grid` (4 tiles), `#btnContinue` | Grid centraal; Continue alleen tonen indien save — niet dominant |
| C-extra | `#menuProfileBar`, `#menuHubHint` | Onder grid of in scroll; niet first-viewport clutter |
| D | `#togMusic`, `#btnMissions`, `#btnSettings`, `#btnHelp`, `#btnVerseVersie`, `#btnInstallApp` | Meta-dock rechts/onder; install secundair |
| E | `#menuLangBar` (+ `#menuLangLbl`) | Compact links; label verbergen of `sr-only` |

IDs en `data-hub` bindings **niet** hernoemen zonder bindings-audit.

---

## 8. Acceptatiecriteria

1. Op startscherm vult de omgeving (video of canvas-fallback) **100%** van de viewport (`cover`, geen letterbox-gaten in het blauw-vlak).
2. Titel (B) en tiles (C) hebben translucent panels; tekst blijft leesbaar op lichte én donkere frames van de video.
3. Talen (E) klein linksonder; meta (D) één rij ernaast/rechts.
4. `prefers-reduced-motion` / ultraLite: geen video-autoplay, canvas-fallback, UI intact.
5. Start Avontuur: menu-video stopt; **geen** blauw/zwart scherm-regressie (ochtend `syncPlayLayer`).
6. Desktop + iPad portrait/landscape: layout bruikbaar, geen overlapping met safe-areas.

---

## 9. Risico’s

| Risico | Mitigatie |
|--------|-----------|
| Autoplay geblokkeerd | `muted` + `playsinline`; user-gesture al via splash/tap |
| Zware video op iPad | Lage resolutie, pause off-hub, ultraLite skip |
| Leesbaarheid op heldere frames | Iets dichtere glass + text-shadow / stroke op titel |
| Touch-scroll regressie | Blijf bij `#menuScreen` scroll surface; tiles `touch-action: pan-y` |
| Play-laag bugs | Geen z-index lids; stage alleen in `#menuScreen` |

---

## 10. Out of scope

- Versus / char-select / mode-hub video (kan later dezelfde stage-pattern hergebruiken)
- Online streaming CDN (voor nu lokale assets op Pages)
- Wijzigen menu-BGM tracks (blijft WebAudio)

---

## 11. Agent-checklist bij implementatie

```bash
./scripts/agent-status.sh
# edit src/ + index.html + styles/main.css — niet game.js direct
npm run build && npm test
# handmatig: hub video → Avontuur start → terug menu
./scripts/agent-log.sh "menu video overhaul fase N"
```

Branch-prefix: `cursor/menu-video-…-2125` · PR naar `main`.
