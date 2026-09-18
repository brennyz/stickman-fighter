# Playtest bot 4/9 — first 30s (draft findings)

**LIVE:** `origin/main` `c9a29fc` · **v1.18.190 / SW 400**  
**When:** 2026-09-18 ~18:08–18:36 Amsterdam  
**Lane:** first 30s only — fresh save, teach-by-doing, no text wall, Tik slaan, FOMO/island after first punch  
**Out:** Versus retired · no `main` · no IAP · death-retry / juice / landscape HOME belong to sibling bots  

Share URL stays `https://brennyz.github.io/stickman-fighter/speel.html`.

Retest: `localStorage.clear()` or `__sf.resetFirstPunchTeach()` then Avontuur.

---

## Method

| Pass | How |
|------|-----|
| Contract | `npm run smoke:first30-teach` → `SMOKE_OK first30-teach Druk J delay 0.85` |
| Phone 390×844 | Fresh `localStorage` · `speel.html` → `index.html?nosplash=1` · tap Avontuur · wait for nudge · punch / die · HOME · Avontuur again |
| After-punch probe | Headless 390: `startFirstPunchAdventure` → nudge → `markFeltFirstPunch` → HOME → Avontuur tile |
| Visual | Computer-use 390 (and a second pass that stayed 390 / touch pads) |

Versus tile absent in HTML + HOME. `#menuScreen` never showed a 2P tile.

---

## Verdict

**EX-023 / #328 still holds on LIVE.** First Avontuur is a punch, not a wall. No unique P0 on this lane.

FOMO and island **unlock after a landed punch**, not before. If the first fight ends before a hit, the gate stays on — that is intended, not a miss.

---

## Pass (do not restage)

| Check | 390 fresh | After first punch |
|-------|-----------|-------------------|
| HOME FOMO / Vandaag | **off** | pending `true` (sheet timing: P2 below) |
| Welcome toast | **off** | — |
| Versus | **gone** | — |
| Avontuur | instant lv1 fight · `gamble: null` · no island | **Kies een eiland** (`#levelScreen.active`) |
| Aim tutorial card | **off** | offered again for later Avontuur |
| Nudge | **Tik slaan** · not a paragraph · `wall: false` | taught / pulse off |
| Punch pulse helper | **on** while waiting | — |
| Fighters / lv1 scenery | visible (white stickman + mob) | — |

Probe snapshot after `markFeltFirstPunch`:

```
fresh: pending true, fomo false, versus false, welcome false
start: state play · adventure · lv1 · gamble null · aim false · juice true
nudge: "Tik slaan" · nudged · pulse true · wall false
after: felt true · fomo pending true · aimAdv true
second Avontuur tile: levelActive true · fightAgain false
```

---

## Findings (draft)

### P2 — `speel.html` PLAY vs in-game NL

`detectSpeelLang()` uses `navigator.language` when there is no save. This VM / many EN browsers get **▶ PLAY**. `initLang()` then forces **NL** on first `index.html` boot.

First 30s can be: EN landing → NL HOME. NL browsers still see SPELEN. Not Versus. Share URL unchanged.

**Owner:** landing copy (`speel.html`), not combat teach.

### P2 — Verder spelen steals the island beat

After the first death, **Verder spelen** (Avontuur Lv 1) is the top HOME CTA. `resumeLastPlay` → `gokGooiStartLevel`.

- Before a punch: Continue also skips island (same as Avontuur). Intended.
- After a punch: Continue skips the island picker and starts the last level (gamble path). Island is only on the **Avontuur** tile.

A first-30s player who taps the gold Continue banner never sees “Kies een eiland”. Adjacent **EX-018 / #318** — do not restage Continue chrome here.

### P2 — FOMO pending, auto-sheet flaky

After a landed punch, `fomoRitualPending()` is **true**. `showFomoRitual` still no-ops unless `#menuScreen` has `.active` (`hideQuiet`).

Headless `recoverToMenu` + `renderMenu` left `#fomoRitual` **hidden**. A later visual pass did show the compact **Vandaag** sheet (Oproepen 10/10 + missions) over HOME.

So: FOMO is gated correctly until the punch; the first auto-open after that is not guaranteed on every HOME return. Avontuur tile still reaches the island. Not a P0.

### Note — die before punch keeps the gate

If the first fight is VERLOREN before a hit lands, `feltFirstPunch` stays false. Next Avontuur is still an instant fight. Easy to log as “island broken”. It is not.

### P3 — punch gold pulse is quiet

`firstPunchTeachShouldPulsePunch` is true, but the fist pad does not read as a gold pulse next to the other pads. The **Tik slaan** pill does the teaching.

### P3 — island screen is the first real wall

After the punch, **Kies een eiland** shows Normal/Nightmare/Hell, NL–ES, seven islands, heat. Correct unlock. Chrome-heavy vs the punch-first 30s. Not this lane to restage.

### Not this lane

| Seen | Owner |
|------|--------|
| Fast lv1 VERLOREN / Nog één keer | death-retry / #323 |
| Desktop “Tik slaan” while 390 + touch pads still on | input scheme (`useTouchFightPads`) — smoke on headless KB is **Druk J** |
| Continue banner stays on HOME | EX-018 / #318 |

---

## Pick-list (if Brendon wants a follow-up draft)

1. `speel.html` first-run lang: match `initLang()` NL-first, or `?lang=` from save only.  
2. After first punch, Continue could open island once (or stay instant-retry — pick one).  
3. FOMO auto-open: show after punch on a confirmed `menuScreen.active` paint.  
4. Stronger punch-pad pulse (visual only).

No Versus. No factory-id rename. No nuclear `.screen { display:none !important }`.

---

## Evidence

| File | What |
|------|------|
| `first30s_speel_play.png` | Landing CTA on EN `navigator.language` |
| `first30s_home_fresh.png` | Fresh HOME · no FOMO · no Versus |
| `first30s_tik_slaan.png` | Lv1 fight · short **Tik slaan** · no aim card |
| `first30s_home_continue.png` | After first death · Verder spelen · no Vandaag |
| `first30s_fomo_vandaag.png` | Vandaag sheet after a punch (later HOME) |
| `first30s_island.png` | Kies een eiland after a punch |

Bot: https://cursor.com/agents/bc-6e73c36c-610b-59fa-8edc-2cadae6adf98
