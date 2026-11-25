# 🎹 Electronic Keyboard (Model EK-1)

**Version 1.0.1 | Free, open-source, offline browser instrument**

EK-1 brings the feel of a classic home keyboard to your browser. Play a few notes, experiment with instruments, enjoy the built-in demo songs, or make a song of your own. No music theory required.

[Download EK-1](https://github.com/NixMcRetro/EK-1/releases) - [Quick-start guide](START-HERE.txt) - [Version history](CHANGELOG.md)

## 🚀 Getting started

1. Download the offline ZIP from [Releases](https://github.com/NixMcRetro/EK-1/releases).
2. Extract the entire archive and double-click `index.html`.
3. Click a piano key to enable audio, then start playing!

No installation, local server, account, terminal, or internet connection is required after downloading. Keep the supporting files beside the HTML file.

**Headphones:** Main volume starts at 50%. Start with low device volume. EK-1 limits digital output peaks, but this cannot guarantee safe headphone loudness.

## 🎹 Play the keyboard

- 49 playable keys (C3-C7), with printed note names and mouse, touch, and computer keyboard input.
- 12 Classic voices and eight original six-operator FM voices, with adjustable FM brightness, attack, and release.
- Six rhythm styles, automatic chord accompaniment, five original demonstration songs, and recording/playback.
- Pause, resume, stop, and play along with the demos. The selected demo repeats by default; uncheck Loop demonstration song in Sound options for one-shot playback. Repeats have a short release/restart gap and preserve your chosen voice, backing volume, and melody-off setting. The demo lead follows the selected voice by default, while the backing instruments retain their assignments. Switch this off in Sound options if you prefer the original lead.
- Optional room reverb, chorus, and instrument favourites.
- BACKING VOLUME (80% by default) balances demo backing and auto accompaniment independently of live melody. Loaded SoundFonts supply auto-accompaniment bass and chords, and percussion when the bank includes drums; otherwise built-in drums are used.

| Computer key | Note or action |
| --- | --- |
| C | A3 |
| V | B3 |
| B | C4 (middle C) |
| Z to M and Q to U | Two rows of notes from F3 to E5 |
| Comma / period | Shift the computer keyboard down / up an octave |

The displayed piano pitches do not change when you shift the computer shortcuts. Keys outside the displayed range are unavailable.

## 🎛️ SoundFonts

For a much larger instrument library, try **[FluidR3 GM](https://www.pianobooster.org/download.html)** by Frank Wen (MIT licence, approximately 148 MB).

Download and extract the bank separately, then choose **OPEN SOUNDFONT** in Sound Library / SoundFonts. EK-1 supports local SF2 and SF3 files up to 512 MiB. No SoundFont is bundled, automatically downloaded, or uploaded.

Loaded instruments appear in the VOICE menu and remain available when switching back to Classic or FM. MIDI songs, demo backing, and Song Builder also use the loaded bank. A non-GM bank may substitute missing instruments, and large banks can require considerably more memory than their file size.

## 🎶 MIDI Songs

Open a standard MIDI file, press PLAY MIDI, and watch its notes light up on the keyboard. Each channel has its own colour; shared pitches display split colours.

- Looping and return to keyboard are enabled by default.
- Pause and resume without restarting the song.
- Keep the original instruments, or make all melodic channels or a specific channel follow VOICE. Drums remain unchanged.
- Save a copy of the original MIDI without altering its bytes.

## ✏️ Song Builder

Choose a style, feel, key, chord pattern, and length, then press NEW ARRANGEMENT. EK-1 generates four parts: melody, chords, bass, and drums.

| Style | Feel |
| --- | --- |
| Pop, Rock, Disco, Ska, Reggae, Electronic | Original, Natural, Expressive |

Natural adds musical timing, recurring motifs, chord inversions, bass movement, and drum fills. Expressive adds more variation. Original retains the earlier arrangement engine.

Edit the chords and melody, adjust the mixer, mute parts, duplicate sections, and build songs of up to 64 bars. Undo and redo retain 40 committed edits. NEW MELODY keeps the chords; NEW CHORDS + MELODY regenerates both. Existing projects saved before v0.9.2 retain their original arrangement feel.

## 💾 Save your music

| Format | Purpose |
| --- | --- |
| EK1 | Editable song project |
| MIDI | Multitrack notes and instrument assignments |
| WAV | Stereo PCM, 44.1 or 48 kHz, 16 or 24 bit |
| MP3 | Stereo audio, 128-320 kbps |

Song Builder audio export uses the selected SoundFont or built-in Classic sounds and includes optional effects. Rendering is local and cancellable, with a five-minute limit plus a two-second release tail. Live playing is not included in Song Builder audio export. Projects remember the bank filename, not its samples.

## 🌙 Make it yours

Choose System, Light, or Dark from the Appearance selector. All five expandable panels start open; collapse whichever ones you do not need. Appearance and panel states are remembered where browser storage is available. Local-file storage can reset when moving to a different folder. MIDI files, SoundFonts, unsaved compositions, favourites, and effects are not automatically restored.

## 🔧 Compatibility and technical notes

- Direct-file operation is tested with Chromium, Firefox, and WebKit on Linux through [GitHub Actions](https://github.com/NixMcRetro/EK-1/actions). Native macOS Safari and physical touch hardware have not been independently tested.
- MIDI import supports formats 0 and 1, up to 8 MiB and 30 minutes, including tempo changes, sustain, volume, pan, expression, and program/bank selection. Full GM/GS/XG controllers, pitch bend, hardware MIDI, DX7 SysEx, and arbitrary MIDI editing are not implemented.
- Repeated MIDI playback has a short release/restart gap, rather than guaranteed gapless looping. Percussion and out-of-range notes are not highlighted.
- The bundled SpessaSynth local bridge uses ScriptProcessorNode with a 2,048-frame buffer for direct-file compatibility. This may increase CPU load and latency.
- The application is static HTML, CSS, and JavaScript. It can also be hosted unchanged; retain the relative paths, vendor sources, and licences. No runtime CDN, analytics, or automatic bank downloads.

## 📜 Licence and credits

EK-1 is licensed under [GPL-3.0-or-later](LICENSE), without warranty. This covers the original application, original demo definitions, and example MIDI to the extent of the project's rights. Independently created music does not become GPL-licensed merely because EK-1 exported it.

Third-party software retains its own licences. See [Third-party notices](THIRD-PARTY-NOTICES.txt), [Licences](licenses/), and [Vendor sources](vendor/sources/) for exact dependency versions, original notices, and source code. LAME is an unmodified, separately replaceable encoder; applicable third-party rights, including reverse engineering for debugging modifications, are preserved.

EK-1 is inspired by classic home keyboards and is not affiliated with Casio or Yamaha.

Made by Nix McRetro and contributors.
