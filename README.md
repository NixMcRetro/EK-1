# Electronic Keyboard (Model EK-1)

A simple, 1990s home-keyboard-inspired instrument that plays in your browser.

**Development version: 0.4.0**

Play a 49-key electronic keyboard, choose from 12 instrument tones and 6 rhythms, and listen to five original built-in demo songs. Includes one-finger chord accompaniment, a melody-off play-along mode, and basic note recording.

EK-1 is an original instrument and is not affiliated with Casio.

## Getting started

Open `index.html` locally in a modern browser or serve the repository with any static web server. The keyboard uses the Web Audio API. Audio starts when you interact with the keyboard.

Computer keyboard shortcuts play two octaves: `Z S X D C V G B H N J M` and `Q 2 W 3 E R 5 T 6 Y 7 U`. Mouse and touch input can play the entire 49-key keyboard. On small screens, swipe horizontally or use LOWER KEYS / HIGHER KEYS. The mobile view opens at C4, and you can move left to play the lower chord octave.

### Design

EK-1 v0.2.0 deliberately borrows **design principles**, not branding or artwork, from late-1980s and early-1990s home keyboards. It uses a one-piece dark instrument chassis, a small recessed green LCD, speaker grilles, printed sound lists, square tactile controls and a full-width piano manual. Desktop and mobile Playwright screenshots are uploaded with the GitHub Actions test run for review. See [DESIGN.md](DESIGN.md) for reference links and implementation guidelines.

## MIDI songs

- OPEN MIDI: import a local Standard MIDI File (.mid or .midi), format 0 or 1, up to 8 MB and 30 minutes.
- PLAY MIDI: play all imported channels simultaneously using the built-in approximations of General MIDI sounds; play the keyboard along with the song.
- SAVE MIDI COPY: download the original imported file byte-for-byte.
- EXPORT RECORDING: save a recorded keyboard performance as standard format-0 MIDI, preserving note timing and approximate instrument selections.

Tempo changes, channel program changes, note velocities, running status, sustain and basic percussion are supported. Pitch bend, most other MIDI controllers, bank selection, SMPTE timing, full GM timbres, MIDI hardware I/O and song editing are not implemented yet. Playback is limited to 64 simultaneous scheduled melodic voices. Recordings export played notes, not the accompaniment or audio. Files are processed locally and never uploaded.

## SoundFont instrument banks

The built-in keyboard still opens directly from index.html. To enable optional SoundFont synthesis, build and serve the project locally:

```sh
npm install
npm run build
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/ in your browser. Deployed builds need HTTPS and the generated vendor/ directory. Do not distribute node_modules.

1. Press OPEN SOUNDFONT and choose a local SF2 or SF3 bank (up to 128 MB).
2. Select a melodic preset in VOICE, then play the keyboard.
3. Open and play a MIDI file to hear the bank's instruments. For accurate instrument assignments, use a complete General MIDI bank.
4. Return to the original tones with BUILT-IN SOUNDS.

The bank is processed in your browser and is never uploaded or persisted. A separate keyboard channel allows play-along while a song uses MIDI channels 1–16. Built-in demos, rhythm and automatic accompaniment retain their original synthesizer. MIDI recording export includes bank/program numbers, not embedded samples. The sound may differ if a receiving player lacks the same bank. Imported MIDI uses the existing bounded note/tempo scheduler; this does not implement all MIDI controllers, pitch bend or complete GM/GS/XG playback yet. A bank is not bundled with this development version. Load your own legitimately obtained SoundFont.

The optional AudioWorklet engine is [SpessaSynth](https://github.com/spessasus/spessasynth_lib), Apache-2.0 licensed; the build copies upstream licence/notice files into vendor/. No CDN or remote sound-bank requests are made at runtime.

## Development status

Version `0.4.0` introduces optional SoundFont synthesis, and is not a stable `1.0.0`. Note recordings currently live in memory and disappear when the page reloads. They capture played notes, not the full accompanying rhythm track.

The included tones are created using Web Audio synthesis, not sampled patches from an existing manufacturer.

## Versioning

EK-1 follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) with `MAJOR.MINOR.PATCH`.

- `0.1.0`: initial playable keyboard baseline
- `0.2.0`: redesigned instrument-style controls, printed tone/rhythm guides, speaker grilles, recessed LCD and mobile octave navigation
- `0.2.1`: compatible visual or control fixes
- `0.3.0`: MIDI file import, multichannel playback and export
- `0.4.0`: optional SF2/SF3 playback with a locally built AudioWorklet engine
- `0.5.0`: proposed FM synthesis
- `1.0.0`: first stable release
- After `1.0.0`: PATCH for compatible fixes, MINOR for compatible features, MAJOR for breaking changes

## Testing

```sh
node --check app.js
node --check midi.js
node .github/tests/ek1-midi-codec.mjs
npm install
npm run build
npx playwright install chromium firefox webkit
node .github/tests/ek1-browser-smoke.mjs
node .github/tests/ek1-soundfont-browser.mjs
```

The application is self-contained and has no connection to the retired OP-1 browser project.