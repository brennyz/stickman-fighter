# Device QA — soft live (PWA)

Korte checklist vóór soft live / store. Deel-link: `speel.html` (niet `ipad.html` / tunnel).

## iPhone Safari

- [ ] Open `speel.html` → SPELEN → avontuur start zonder zwart/blauw scherm
- [ ] Touch: joystick loopt, aanvalsknoppen reageren, geen “tap zonder actie”
- [ ] Golf 1: charge/slam toont gele/oranje telegraph + HUD-balk (leesbaar)
- [ ] Checkpoint: “houd joystick RECHTS” hint + grote pijl rechts; voortgangsbalk vult
- [ ] Pause/menu terug naar hub werkt; audio start na eerste tap
- [ ] Add to Home Screen (optioneel): icoon + offline start

## Android Chrome

- [ ] Zelfde speel-flow als iPhone; landscape speelbaar
- [ ] Install prompt / “Toevoegen aan startscherm” bereikbaar
- [ ] SW: hard refresh of heropen → versie/cache update zonder vastlopen
- [ ] Touch scroll in menu niet vast; adventure HUD niet onder knoppen
- [ ] Checkpoint cue zichtbaar; keyboard n.v.t. tenzij Bluetooth

## iPad (Safari / PWA bookmark)

- [ ] Bookmark of Pages-URL speelt full canvas (geen Cursor-terminal nodig)
- [ ] Dual-layout: joystick links, knoppen rechts; geen overlap
- [ ] Avontuur: milder golf 1 voelbaar; telegraph leesbaar op afstand
- [ ] Checkpoint “loop rechts” werkt met joystick; idle-hint komt snel
- [ ] Rotate / resize: geen zwarte strook; knoppen blijven bereikbaar

## Smoke (alle devices)

- [ ] Versie in settings ≈ APP_VERSION uit build
- [ ] Deel-link deelt `…/speel.html`
- [ ] Save blijft na herladen (localStorage)
- [ ] Geen privacy/login-blocker midden in gevecht

**Owner:** human speelt A5/A6; cloud soft-feel levert deze notes.
