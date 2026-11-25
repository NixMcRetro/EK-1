# EK-1 visual design reference - v0.2.0

## Intent

Build a browser instrument that feels physically plausible as a modest early-1990s home keyboard. It should be immediately usable by somebody who has never seen a music workstation. No DAW interface, file-browser metaphor, generic dashboard cards, playful gradients, glass effects or floating toolbars.

## Sources studied

The following references are for **layout principles**. EK-1 must not reuse manufacturer logos, exact decals, product photography or branded industrial-design artwork.

- [Casio CTK-100 manual and control locations](https://www.notice-facile.com/en/manual/1737482/casio%2Bctk-100): 49 keys, grouped tone/rhythm selection, start/stop, demonstration and tempo controls.
- [Casio CTK-100 reference photograph](https://quierotocarmicasio.blogspot.com/2012/04/ctk-330-y-ctk-100.html): long mono-colour case, speaker grilles, printed information beside controls, restrained button colours.
- [Casio CT-670 reference](https://commons.wikimedia.org/wiki/File:Casio_Tonebank_CT-670.jpg): compact numerical display and printed tone guide within one continuous top panel.
- [Yamaha PSS-130 manual](https://nurykabe.com/dump/docs/PSS/manuals/PSS-130_00.pdf): simple speaker/control/key arrangement with the piano manual always dominant.

## Decisions

1. **One object.** The application fills a single physical-looking chassis. The tone, rhythm and demo areas are labelled groups on the same faceplate, not rounded software cards.
2. **Print, not widgets.** A modest twelve-tone and six-rhythm guide is printed at the top next to a plain LCD. Selects are recessed switch-like controls, not form cards.
3. **Understated plastic.** Graphite/charcoal casing, grey-beige keytops, low-contrast label printing, flat plastic finishes and narrow seams. Small green, lilac and muted red accents only where they convey function.
4. **Keys first.** Forty-nine functional keys, with only octave C labels and usable computer-keyboard shortcuts. No animated decorative UI.
5. **Mobile is an instrument, not a squeezed desktop.** Show a comfortable key width and allow horizontal movement in octave jumps. Start at C4, preserving the left-hand chord octave offscreen to the left.
6. **No branding imitation.** The only product name is Electronic Keyboard (Model EK-1), and all interface marks are original.
7. **Accessibility.** All controls have visible focus, semantic labels, a live text display, disabled states, mouse/touch/keyboard input, and reduced-motion-aware scrolling.

## Acceptance checklist

- [ ] Desktop screenshot presents one coherent keyboard, not multiple cards.
- [ ] Desktop and phone controls remain readable without horizontal **page** overflow.
- [ ] On mobile the visible piano keys are large enough to tap; users can reach both ends.
- [ ] Demo, melody off, rhythm, recording and sound changes work in Chromium, Firefox and WebKit.
- [ ] Check actual sound output and manual playing with human listening tests before describing a stable release.
- [ ] No automatic publication to McRetro; release approval remains separate.
