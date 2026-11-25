# Electronic Keyboard (Model EK-1)

Development version **0.9.0**. A 49-key browser instrument inspired by classic home keyboards, with 12 classic voices, eight original six-operator FM voices, six rhythms, five original demos, MIDI playback, and a four-part Song Builder. No affiliation with Casio or Yamaha.

## Start playing

Extract the whole ZIP and open `index.html` in a current browser. No local server, installer, account, network access or terminal is required. Keep the supporting files next to the HTML file. Click a key to enable audio. Computer keys Z through M and Q through U play two octaves; the on-screen keyboard spans C3 to C7. Mobile octave navigation is next to the keys.

## Instruments and SoundFonts

Choose a Classic or FM voice in VOICE. FM offers brightness, attack and release. Use OPEN SOUNDFONT to open a local SF2/SF3 bank (maximum 512 MiB). No SoundFont is included. [FluidR3 GM](https://www.pianobooster.org/download.html) by Frank Wen is the recommended optional download (148 MB, MIT). Extract the downloaded bank if necessary, then open the SF2 file with the file picker. Imported SoundFonts stay available while switching Classic or FM voices. MIDI playback and composition use a loaded SoundFont, otherwise the built-in approximations. Bank files are never uploaded. Loading large banks, especially compressed SF3, can use more memory than the file size.

## Song Builder

Choose a style, key, pattern and length, then NEW ARRANGEMENT. Edit individual chords and melody notes, mute or change instruments, adjust track levels and pan, and append labelled sections up to 64 bars. A rest is silent; Hold extends the preceding note. New melody generates variations. Save and reopen editable `.ek1` projects; replacing an edited project prompts you to save first. Projects store the bank filename, not the actual samples. Reopen the bank to reproduce the original instruments.

Export a multitrack MIDI file or stereo audio using the actual selected bank. WAV: 44.1/48 kHz, 16/24-bit PCM. MP3: 128/192/256/320 kbps. Rendering is local and cancellable; classic OfflineAudioContext rendering may finish its current render before cancellation takes effect. Audio exports are limited to five minutes and include a two-second release tail. Live FM and accompaniment are not recorded into Song Builder audio. MIDI import supports formats 0 and 1, up to 8 MiB and 30 minutes, with tempo changes, channel volume, pan, expression, sustain and program/bank selection. Full GM/GS/XG controllers, pitch bend, hardware MIDI, DX7 SysEx and arbitrary MIDI song editing are not implemented.

## Offline architecture and licensing

The runtime is an ordinary set of HTML, CSS and JavaScript files, not a server application. The SpessaSynth local bridge replaces the AudioWorklet entrypoint with a legacy ScriptProcessorNode for file:// compatibility. This may use more main-thread CPU and have higher latency. Browser support varies; direct local-file navigation is a release test requirement. See `THIRD-PARTY-NOTICES.txt`, `licenses/`, and `vendor/sources/` for dependencies, original notices, source and modification details. The original EK-1 application is licensed under GPL-3.0-or-later; see LICENSE. Third-party licence rights are preserved. LAME is an unmodified separate script, replaceable with an interface-compatible build. No restrictions are imposed on exercise of the third-party licence rights or reverse engineering needed to debug changes to the LAME library.

## Static hosting

Deploy this folder unchanged to GitHub Pages or another static host. Use `index.html` as the entry point. Keep the relative paths, `vendor/`, `licenses/` and source archives intact; no runtime build, CDN, server code, or automatic SoundFont downloads are needed. The original application is licensed under GPL-3.0-or-later.

This is a development release candidate, not a public release. No McRetro publication is authorised by this package. See CHANGELOG.md for version history.

## Licence and your music

The original EK-1 application is licensed under GPL-3.0-or-later. The software licence does not impose GPL terms on independently created music or exported MIDI, WAV, MP3 or project files merely because EK-1 produced them. Third-party material remains subject to its respective rights and licence terms.
