# Changelog

All notable EK-1 changes follow Semantic Versioning (`MAJOR.MINOR.PATCH`).

## [0.9.1] - SoundFont demos and playback reliability

- All five original demos use the loaded SoundFont, with separate GM melody, chord, bass and percussion channels.
- Preserve live voice selection, melody-off play-along, demo switching and classic fallback.
- STOP silences held sampled notes; sampled melody muting releases the lead channel immediately.
- Display the active demo sound engine and add regression coverage.

## [0.9.0] - Offline release candidate

- Refined note holds, rests and melody variation; unsaved-arrangement protection.
- Cancellable audio export and clearer mobile octave navigation.
- Verified FluidR3 GM reference bank playback, MIDI stop, stereo MP3/WAV export and project round trip.
- External FluidR3 GM download recommendation with creator attribution; no bundled sound banks.
- Full third-party licence inventory, separate unmodified MP3 encoder and corresponding source.
- Updated offline documentation; removed obsolete server-based setup instructions.
- Original application licensed under GPL-3.0-or-later, with visible licence and source links.

## [0.8.0] - Project and audio preview

- Editable `.ek1` projects, labelled song sections, per-part volume and pan.
- Quarter, eighth and sixteenth-note grids with rests and holds.
- Faster-than-real-time stereo PCM WAV rendering using the actual loaded SoundFont or classic synthesis.
- Local stereo MP3 export via pinned lamejs 1.2.1, with upstream source and licence.

## [0.7.0] - Composition preview

- Four-part song builder, six styles, four chord patterns and editable 4/8/16-bar songs.
- Per-part mute, instrument selection, chord and melody editing, MIDI format-1 export.
- Retains the direct-file SoundFont bridge and ordered MIDI playback fix.

## [0.6.1] - Playback fix preview

- Ordered MIDI note-off/on queue and per-note sampled voice tracking.
- Channel volume, expression and pan playback; classic audio node cleanup.

## [0.6.0] - Unreleased

### Changed
- One grouped VOICE selector for Classic, FM and loaded SoundFont instruments.
- FM shaping controls integrated into the faceplate and visible only when needed.
- SoundFonts remain loaded when the player chooses another engine; MIDI playback continues to use the bank.
- Recordings retain their engine and bank metadata, with an explicit approximation warning if a sampled recording's original bank is unavailable.
- Updated browser regression coverage and downloadable previews.

## [0.5.0] - Verified development baseline

### Added
- Native six-operator FM engine with eight original voices and independent envelopes.
- Brightness, attack and release controls with reset and selectable FM mode.
- In-memory FM recording playback with voice settings; standard approximate MIDI program numbers on export.
- Offline audio render checks across browser engines, plus updated downloadable previews.

### Limitations
- No DX7 patch compatibility or emulation yet.
- Imported MIDI and accompaniment use the established engines; FM mode targets live keyboard and recorded performances.

## [0.4.0] - Verified development baseline

### Added
- Optional user-supplied SF2/SF3 instrument banks through a locally bundled SpessaSynth AudioWorklet.
- Voice selection, sampled live keyboard and imported MIDI playback with a separate play-along channel.
- SoundFont bank and program numbers in MIDI recording export.
- Generated synthetic SF2 fixture and real worklet browser test.

### Limitations
- No default or redistributed SoundFont included; requires a locally built and served application or HTTPS deployment.
- Built-in demos, rhythm and accompaniment retain the original synthesizer. The MIDI scheduler still does not implement all controllers.
- No automatic publishing to McRetro.

## [0.3.0] - Verified development baseline

### Added
- Local Standard MIDI File format 0 and 1 import with multichannel playback, tempo changes, sustain and program approximations.
- MIDI recording export and byte-identical copies of imported MIDI files.
- Bounded parser and playback scheduler; codec and browser regression tests.

### Changed
- Computer keyboard shortcuts remain playable after using transport buttons.
- Compact MIDI utility controls below the keyboard, without changing the instrument design.

### Limitations
- MIDI playback uses twelve original synthesized sounds, not a full General MIDI SoundFont.
- Export saves performed notes only. Song editing, hardware MIDI and full controller support are deferred.

## [0.2.0] - Verified development baseline

### Changed
- Replaced the card-based web application layout with one physical keyboard-inspired faceplate.
- Added simulated speaker grilles, printed tone/rhythm charts, a recessed LCD and period-style labelled controls.
- Improved mobile keyboard navigation with octave scroll buttons and a playable middle-octave starting position.
- Added automatic screenshot artifacts for desktop and mobile visual review.
- Updated version and cross-browser regression coverage.

### Unchanged
- Twelve tones, six rhythms, five original sixteen-bar demo songs and in-memory recording.
- Standalone source repository, with no automatic McRetro website publication.

## [0.1.0] - Initial development baseline

### Added
- Independent electronic keyboard application with 49 playable keys.
- Twelve instrument tones and six built-in drum rhythms.
- Five original sixteen-bar demo arrangements with melody-off play-along.
- Automatic chord accompaniment, tempo and volume controls.
- In-memory note recording and playback.
- Cross-browser automated tests.

### Notes
- This is a development version and is not yet the `1.0.0` release.
- EK-1 is now developed independently in its own repository.
