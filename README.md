# Electronic Keyboard (Model EK-1)

A simple, 1990s home-keyboard-inspired instrument that plays in your browser.

**Development version: 0.1.0**

Play a 49-key electronic keyboard, choose from 12 instrument tones and 6 rhythms, and listen to five original built-in demo songs. Includes one-finger chord accompaniment, a melody-off play-along mode, and basic note recording.

EK-1 is an original instrument and is not affiliated with Casio.

## Getting started

Open `index.html` locally in a modern browser or serve the repository with any static web server. The keyboard uses the Web Audio API. Audio starts when you interact with the keyboard.

Computer keyboard shortcuts play two octaves: `Z S X D C V G B H N J M` and `Q 2 W 3 E R 5 T 6 Y 7 U`. Mouse and touch input can play the entire 49-key keyboard.

## Development status

Version `0.1.0` is the first development release, not a stable `1.0.0`. Note recordings currently live in memory and disappear when the page reloads. They capture played notes, not the full accompanying rhythm track.

The included tones are created using Web Audio synthesis, not sampled patches from an existing manufacturer.

## Versioning

EK-1 follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) with `MAJOR.MINOR.PATCH`.

- `0.1.0`: initial playable keyboard
- `0.1.1`: bug fixes without new features
- `0.2.0`: additional features during early development
- `1.0.0`: first stable release
- After `1.0.0`: PATCH for compatible fixes, MINOR for compatible features, MAJOR for breaking changes

## Licence

The original EK-1 application is licensed under the GNU General Public License, version 3 or (at your option) any later version (SPDX: GPL-3.0-or-later). See [LICENSE](LICENSE). Third-party components retain their respective licences and copyright notices.

The software licence does not impose GPL terms on independently created music or exported MIDI, WAV, MP3 or project files merely because EK-1 produced them. Any third-party material remains subject to its own rights and licence terms. No affiliation with Casio or Yamaha is claimed.

## Testing

```sh
node --check app.js
npm install --no-save playwright@1.57.0
npx playwright install chromium firefox webkit
node .github/tests/ek1-browser-smoke.mjs
```

The application is self-contained and has no connection to the retired OP-1 browser project.