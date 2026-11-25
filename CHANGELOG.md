# Changelog

All notable EK-1 changes follow Semantic Versioning (`MAJOR.MINOR.PATCH`).

## [0.3.0] - Unreleased

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
