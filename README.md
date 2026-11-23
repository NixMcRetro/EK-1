# Electronic Keyboard (Model EK-1)

A simple, 1990s home-keyboard-inspired instrument that plays in your browser.

**Development version: 0.2.0**

Play a 49-key electronic keyboard, choose from 12 instrument tones and 6 rhythms, and listen to five original built-in demo songs. Includes one-finger chord accompaniment, a melody-off play-along mode, and basic note recording.

EK-1 is an original instrument and is not affiliated with Casio.

## Getting started

Open `index.html` locally in a modern browser or serve the repository with any static web server. The keyboard uses the Web Audio API. Audio starts when you interact with the keyboard.

Computer keyboard shortcuts play two octaves: `Z S X D C V G B H N J M` and `Q 2 W 3 E R 5 T 6 Y 7 U`. Mouse and touch input can play the entire 49-key keyboard. On small screens, swipe horizontally or use LOWER KEYS / HIGHER KEYS. The mobile view opens at C4, and you can move left to play the lower chord octave.

### Design

EK-1 v0.2.0 deliberately borrows **design principles**, not branding or artwork, from late-1980s and early-1990s home keyboards. It uses a one-piece dark instrument chassis, a small recessed green LCD, speaker grilles, printed sound lists, square tactile controls and a full-width piano manual. Desktop and mobile Playwright screenshots are uploaded with the GitHub Actions test run for review. See [DESIGN.md](DESIGN.md) for reference links and implementation guidelines.

## Development status

Version `0.2.0` is a development update focused on a more authentic, usable 1990s keyboard design, not a stable `1.0.0`. Note recordings currently live in memory and disappear when the page reloads. They capture played notes, not the full accompanying rhythm track.

The included tones are created using Web Audio synthesis, not sampled patches from an existing manufacturer.

## Versioning

EK-1 follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) with `MAJOR.MINOR.PATCH`.

- `0.1.0`: initial playable keyboard baseline
- `0.2.0`: redesigned instrument-style controls, printed tone/rhythm guides, speaker grilles, recessed LCD and mobile octave navigation
- `0.2.1`: compatible visual or control fixes
- `0.3.0`: additional features during early development
- `1.0.0`: first stable release
- After `1.0.0`: PATCH for compatible fixes, MINOR for compatible features, MAJOR for breaking changes

## Testing

```sh
node --check app.js
npm install --no-save playwright@1.57.0
npx playwright install chromium firefox webkit
node .github/tests/ek1-browser-smoke.mjs
```

The application is self-contained and has no connection to the retired OP-1 browser project.