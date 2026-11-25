/* Electronic Keyboard (Model EK-1) v0.6.0. Original, offline-capable Web Audio instrument. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const VERSION = '0.6.0';
  const FIRST = 48, LAST = 96, STEPS_PER_BAR = 16;
  const SHARPS = new Set([1, 3, 6, 8, 10]);
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const SHORTCUTS = ['z','s','x','d','c','v','g','b','h','n','j','m','q','2','w','3','e','r','5','t','6','y','7','u'];
  const TONES = [
    { name: 'Grand Piano', wave: 'triangle', harmonics: [1, .22, .08], attack: .006, release: .25, cutoff: 4200 },
    { name: 'Electric Piano', wave: 'sine', harmonics: [1, .45, .12], attack: .006, release: .33, cutoff: 5900 },
    { name: 'Organ', wave: 'sine', harmonics: [1, .60, .33], attack: .016, release: .09, cutoff: 7800 },
    { name: 'Accordion', wave: 'sawtooth', harmonics: [1, .26], attack: .035, release: .19, cutoff: 1750 },
    { name: 'Strings', wave: 'sawtooth', harmonics: [1, .31], attack: .13, release: .4, cutoff: 2400 },
    { name: 'Trumpet', wave: 'sawtooth', harmonics: [1, .18], attack: .055, release: .2, cutoff: 2600 },
    { name: 'Brass Section', wave: 'sawtooth', harmonics: [1, .5], attack: .042, release: .23, cutoff: 2400 },
    { name: 'Marimba', wave: 'sine', harmonics: [1, .35, .12], attack: .003, release: .24, cutoff: 6000 },
    { name: 'Synth Lead', wave: 'square', harmonics: [1, .18], attack: .01, release: .16, cutoff: 3800 },
    { name: 'Synth Pad', wave: 'sawtooth', harmonics: [1, .4], attack: .16, release: .57, cutoff: 1900 },
    { name: 'Electric Bass', wave: 'triangle', harmonics: [1, .35], attack: .007, release: .22, cutoff: 1200 },
    { name: 'Flute', wave: 'sine', harmonics: [1, .12], attack: .06, release: .21, cutoff: 5900 }
  ];
  const RHYTHMS = [
    { name: 'Rock', kick: '1000000010001000', snare: '0000100000001000', hat: '1010101010101010' },
    { name: 'Pop', kick: '1000001010000010', snare: '0000100000001000', hat: '1010101010101010' },
    { name: 'Disco', kick: '1000100010001000', snare: '0000100000001000', hat: '1010101010101010' },
    { name: 'Ska', kick: '1000001010000010', snare: '0000100000001000', hat: '1011101110111011' },
    { name: 'Reggae', kick: '0000000010000000', snare: '0000000010000000', hat: '0010001000100010' },
    { name: 'Electronic', kick: '1000100010101000', snare: '0000100000001000', hat: '1110111011101110' }
  ];
  // Notated original melodies. Each bar contains four beats; ':' denotes note length in beats.
  // Melodies and chord progressions are scored, not randomised.
  const DEMOS = [
    {
      title: 'Electric Dreams', tempo: 122, rhythm: 5, lead: 8,
      chords: ['C4','G3','A3m','F3','C4','G3','F3','G3'],
      melody: [
        'E5:1 G5:.5 A5:.5 G5:1 E5:1',
        'D5:1 G5:1 B5:1 A5:1',
        'C6:1 B5:.5 A5:.5 E5:1 G5:1',
        'A5:2 G5:1 E5:1',
        'G5:.5 A5:.5 C6:1 B5:1 G5:1',
        'D5:.5 G5:.5 A5:1 B5:1 D6:1',
        'C6:1 A5:1 G5:1 E5:1',
        'D5:1 B4:1 C5:2'
      ]
    },
    {
      title: 'Skank Machine', tempo: 146, rhythm: 3, lead: 6,
      chords: ['G3','C4','D4','G3','E3m','A3m','D4','G3'],
      melody: [
        'B4:.5 D5:.5 G5:1 -:.5 G5:.5 A5:1',
        'G5:.5 E5:.5 D5:1 E5:.5 G5:.5 E5:1',
        'F#5:1 A5:.5 F#5:.5 D5:1 F#5:1',
        'G5:1 D5:.5 B4:.5 G4:2',
        'B4:.5 D5:.5 E5:1 G5:1 E5:1',
        'C5:1 E5:.5 G5:.5 A5:1 E5:1',
        'F#5:.5 A5:.5 D6:1 C6:.5 A5:.5 F#5:1',
        'G5:1 D5:1 B4:1 G4:1'
      ]
    },
    {
      title: 'Saturday Night', tempo: 118, rhythm: 2, lead: 1,
      chords: ['F3','A3m','Bb3','C4','F3','D3m','G3m','C4'],
      melody: [
        'A4:.5 C5:.5 F5:1 E5:.5 C5:.5 A4:1',
        'C5:1 E5:1 G5:.5 E5:.5 C5:1',
        'D5:.5 F5:.5 Bb5:1 A5:1 F5:1',
        'G5:1 E5:1 D5:1 C5:1',
        'F5:.5 A5:.5 C6:1 A5:1 F5:1',
        'A5:1 F5:.5 E5:.5 D5:2',
        'Bb4:.5 D5:.5 G5:1 F5:1 D5:1',
        'E5:1 G5:1 C6:1 -:1'
      ]
    },
    {
      title: 'Pixel Paradise', tempo: 154, rhythm: 5, lead: 8,
      chords: ['A3m','F3','C4','G3','A3m','F3','D3m','E3'],
      melody: [
        'A5:.5 C6:.5 E6:.5 C6:.5 A5:1 E5:1',
        'A5:.5 G5:.5 F5:1 C6:1 A5:1',
        'G5:.5 C6:.5 E6:1 D6:.5 C6:.5 G5:1',
        'B5:1 G5:1 D5:1 -:1',
        'C6:.5 B5:.5 A5:.5 G5:.5 E5:1 A5:1',
        'F5:.5 A5:.5 C6:.5 A5:.5 F5:1 C5:1',
        'D5:.5 F5:.5 A5:.5 C6:.5 A5:1 F5:1',
        'G#5:1 B5:1 E6:1 -:1'
      ]
    },
    {
      title: 'Keyboard Hero', tempo: 130, rhythm: 0, lead: 0,
      sections: [0, 5, 2, 8],
      chords: ['C4','A3m','F3','G3','C4','E3m','F3','G3'],
      melody: [
        'E5:.5 G5:.5 C6:1 B5:.5 G5:.5 E5:1',
        'C5:.5 E5:.5 A5:1 G5:1 E5:1',
        'F5:1 A5:1 C6:1 A5:1',
        'B5:.5 A5:.5 G5:1 D5:1 G5:1',
        'G5:.5 E5:.5 C5:1 E5:.5 G5:.5 C6:1',
        'B5:1 G5:1 E5:1 B4:1',
        'C6:.5 A5:.5 F5:1 A5:.5 C6:.5 D6:1',
        'B5:1 G5:1 C6:2'
      ]
    }
  ];
  let ctx, master, noise, transport = null, loop = null, endTimer = null;
  let tone = 0, rhythm = 0, tempo = 116, volume = .7, melodyOff = false, autoChord = false;
  let heldChord = null, recording = false, take = [], takeStart = 0, recordTimer = null;
  let importedMidi = null, midiName = '', importRequest = 0;
  let bank = null, bankLoading = false;
  let engine='classic', fmIndex=0, bankVoiceIndex=0, bankGeneration=0;
  const fmSettings={brightness:1,attack:1,release:1};
  const held = new Map(), pending = new Set(), cancelled = new Set(), lights = new Map(), timers = new Set(), keyElements = new Map();
  const noteToMidi = s => {
    const m = /^([A-G])([#b]?)(-?[0-9]+)$/.exec(s);
    if (!m) throw new Error('Invalid note: ' + s);
    const base = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]];
    return (Number(m[3]) + 1) * 12 + base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  };
  const label = midi => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
  function parseBar(bar) {
    let beats = 0;
    const events = [];
    for (const token of bar.trim().split(/\s+/)) {
      const parts = token.split(':'), len = Number(parts[1]);
      if (!Number.isFinite(len) || len <= 0) throw new Error('Invalid note duration ' + token);
      if (parts[0] !== '-') events.push({ step: Math.round(beats * 4), midi: noteToMidi(parts[0]), length: len });
      beats += len;
    }
    if (Math.abs(beats - 4) > .0001) throw new Error('Demo bar does not have four beats: ' + bar);
    return events;
  }
  // Sixteen-bar arrangements: original eight-bar compositions, followed by a reprise.
  const SONGS = DEMOS.map(song => {
    const events = [];
    for (let pass = 0; pass < 2; pass++) {
      song.melody.forEach((bar, i) => parseBar(bar).forEach(n => {
        events.push({...n, step: (pass * 8 + i) * STEPS_PER_BAR + n.step});
      }));
    }
    return {...song, events, bars: 16};
  });
  async function audio() {
    if (!ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { show('AUDIO NOT SUPPORTED', 'Use a browser with Web Audio'); return false; }
      ctx = new Audio();
      master = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 3;
      master.gain.value = volume;
      master.connect(compressor).connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state !== 'running') {
      // Firefox can leave resume() pending under autoplay rules. Do not deadlock UI.
      ctx.resume().catch(() => show('AUDIO BLOCKED', 'ALLOW SOUND IN YOUR BROWSER'));
      setTimeout(() => {
        if (ctx && ctx.state !== 'running') show('AUDIO BLOCKED', 'CLICK A KEY OR ALLOW SOUND');
      }, 900);
    }
    return true;
  }
  function show(main, sub) {
    $('displayMain').textContent = main;
    $('displaySub').textContent = sub;
  }
  function reflectButtons() {
    $('playDemo').textContent = transport?.type === 'demo' ? 'DEMO ■' : 'DEMO';
    $('startRhythm').textContent = transport?.type === 'rhythm' ? 'PLAYING' : 'START';
    $('record').textContent = recording ? '■ STOP REC' : '● REC';
    $('record').setAttribute('aria-pressed', String(recording));
    $('melodyOff').setAttribute('aria-pressed', String(melodyOff));
    $('accomp').setAttribute('aria-pressed', String(autoChord));
    $('playTake').disabled = take.length === 0 || recording;
    $('clearTake').disabled = take.length === 0 || recording;
    $('exportTake').disabled = take.length === 0 || recording;
    $('playMidi').disabled = !importedMidi || recording;
    $('playMidi').textContent = transport?.type === 'midi' ? 'STOP MIDI' : 'PLAY MIDI';
    $('saveMidi').disabled = !importedMidi;
    $('openMidi').disabled = recording;
    $('openBank').disabled = bankLoading || recording || !!window.EK1Standalone;
    $('closeBank').disabled = !bank || bankLoading || recording;
    $('tone').disabled = recording || bankLoading;
    $('activeEngine').textContent = engine==='soundfont'?'SOUNDFONT':engine==='fm'?'FM':'CLASSIC';
    $('fmPanel').hidden = engine!=='fm';
    for(const id of ['fmBrightness','fmAttack','fmRelease','fmReset'])$(id).disabled=engine!=='fm'||recording||bankLoading;
    $('record').disabled = bankLoading;
    if(bankLoading)$('playMidi').disabled=true;
  }
  function createBus() {
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    return bus;
  }
  function voice(midi, at, duration, instrument, velocity = .26, bus = master, heldVoice = false) {
    const patch = TONES[instrument] || TONES[0];
    const start = Math.max(ctx.currentTime, at);
    const output = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(patch.cutoff, ctx.sampleRate * .45);
    filter.Q.value = .4;
    output.connect(filter).connect(bus);
    const count = patch.harmonics.length;
    const oscs = [];
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator(), amp = ctx.createGain();
      osc.type = patch.wave;
      osc.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12) * (i + 1), start);
      amp.gain.value = patch.harmonics[i] / count;
      osc.connect(amp).connect(output);
      osc.start(start);
      oscs.push(osc);
    }
    output.gain.setValueAtTime(.0001, start);
    output.gain.linearRampToValueAtTime(velocity, start + patch.attack);
    const release = when => {
      const off = Math.max(ctx.currentTime, when, start + patch.attack + .005);
      output.gain.cancelScheduledValues(off);
      output.gain.setValueAtTime(Math.max(.0001, output.gain.value), off);
      output.gain.exponentialRampToValueAtTime(.0001, off + patch.release);
      oscs.forEach(osc => { try { osc.stop(off + patch.release + .025); } catch (_) {} });
    };
    if (!heldVoice) release(start + Math.max(duration, patch.attack + .01));
    return { release };
  }
  function drum(kind, at, strength, bus) {
    const time = Math.max(ctx.currentTime, at);
    if (kind === 'kick') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(155, time);
      o.frequency.exponentialRampToValueAtTime(47, time + .13);
      g.gain.setValueAtTime(strength * .75, time);
      g.gain.exponentialRampToValueAtTime(.001, time + .23);
      o.connect(g).connect(bus); o.start(time); o.stop(time + .25);
      return;
    }
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise;
    f.type = 'highpass';
    f.frequency.value = kind === 'snare' ? 1300 : 5200;
    g.gain.setValueAtTime(strength * (kind === 'snare' ? .45 : .16), time);
    g.gain.exponentialRampToValueAtTime(.001, time + (kind === 'snare' ? .16 : .045));
    src.connect(f).connect(g).connect(bus);
    src.start(time); src.stop(time + (kind === 'snare' ? .18 : .06));
  }
  function drumsForStep(step, at, pattern, bus) {
    const p = RHYTHMS[pattern], index = step % 16;
    if (p.kick[index] === '1') drum('kick', at, .75, bus);
    if (p.snare[index] === '1') drum('snare', at, .65, bus);
    if (p.hat[index] === '1') drum('hat', at, (index % 4 === 2 ? .65 : .42), bus);
  }
  function chordInfo(spec) {
    const minor = spec.endsWith('m'), root = noteToMidi(minor ? spec.slice(0, -1) : spec);
    return { root, minor, notes: [root, root + (minor ? 3 : 4), root + 7] };
  }
  function chordAt(chord, at, beatDuration, style, bus) {
    const { notes, root } = chord;
    const upbeat = style === 3 || style === 4;
    if (upbeat) {
      notes.forEach(n => voice(n, at, beatDuration * .3, style === 3 ? 2 : 3, .09, bus));
    } else {
      notes.forEach(n => voice(n, at, beatDuration * .64, style === 2 ? 4 : 1, .055, bus));
    }
    return root;
  }
  function lamp(midi, at, duration) {
    const node = keyElements.get(midi);
    if (!node) return;
    const ms = Math.max(0, Math.round((at - ctx.currentTime) * 1000));
    const on = setTimeout(() => {
      timers.delete(on);
      if (!node.isConnected) return;
      lights.set(midi, (lights.get(midi) || 0) + 1);
      node.classList.add('lit');
      const off = setTimeout(() => {
        timers.delete(off);
        const remain = (lights.get(midi) || 1) - 1;
        if (remain > 0) lights.set(midi, remain);
        else { lights.delete(midi); node.classList.remove('lit'); }
      }, Math.max(80, duration * 1000));
      timers.add(off);
    }, ms);
    timers.add(on);
  }
  function clearLamps() {
    timers.forEach(clearTimeout); timers.clear(); lights.clear();
    keyElements.forEach(node => node.classList.remove('lit'));
  }
  function stopTransport(announce = true) {
    if (loop) { clearInterval(loop); loop = null; }
    if (endTimer) { clearTimeout(endTimer); endTimer = null; }
    clearLamps();
    if ((transport?.type === 'midi' || transport?.sampleBank) && ctx) {
      if (transport.sampleBank) transport.sampleBank.stopSong();
      else transport.active.forEach(n => n.sound.release(ctx.currentTime));
    }
    if (transport?.bus && ctx) {
      const b = transport.bus, now = ctx.currentTime;
      b.gain.cancelScheduledValues(now);
      b.gain.setTargetAtTime(.00001, now, .02);
      setTimeout(() => { try { b.disconnect(); } catch (_) {} }, 2500);
    }
    transport = null;
    reflectButtons();
    if (announce) show('EK-1 READY', voiceLabel());
  }
  function scheduleStep() {
    if (!transport) return;
    const tr = transport, step = tr.step, at = tr.nextTime, beat = 60 / tr.bpm;
    if (tr.type === 'demo') {
      const song = SONGS[tr.song];
      if (step >= song.bars * STEPS_PER_BAR) {
        if (loop) { clearInterval(loop); loop = null; }
        if (!endTimer) endTimer = setTimeout(() => { stopTransport(); show('DEMO FINISHED', song.title.toUpperCase()); }, Math.max(100, (at - ctx.currentTime + .65) * 1000));
        return false;
      }
      drumsForStep(step, at, song.rhythm, tr.bus);
      const chord = chordInfo(song.chords[Math.floor(step / 16) % song.chords.length]);
      if (step % 4 === 0) {
        const note = chord.root - (step % 16 === 8 ? 17 : 24);
        voice(note, at, beat * .52, 10, .30, tr.bus);
      }
      if (step % 16 === 0 && song.rhythm !== 3 && song.rhythm !== 4) chordAt(chord, at, beat, song.rhythm, tr.bus);
      if ((song.rhythm === 3 || song.rhythm === 4) && [2,6,10,14].includes(step % 16)) chordAt(chord, at, beat, song.rhythm, tr.bus);
      if (!melodyOff) {
        const play = song.events.filter(n => n.step === step);
        for (const n of play) {
          const demoTone = song.sections ? song.sections[Math.floor(step / 64) % song.sections.length] : song.lead;
          voice(n.midi, at, n.length * beat * .91, demoTone, .43, tr.bus);
          lamp(n.midi, at, n.length * beat);
        }
      }
      if (step % 16 === 0) show(('0' + (tr.song + 1)).slice(-2) + ' ' + song.title.toUpperCase(), 'DEMO • BAR ' + (Math.floor(step / 16) + 1) + '/' + song.bars + (melodyOff ? ' • MELODY OFF' : ''));
    } else if (tr.type === 'rhythm') {
      drumsForStep(step, at, tr.rhythm, tr.bus);
      if (autoChord && heldChord) {
        const chord = chordInfo(heldChord);
        if (step % 4 === 0) voice(chord.root - 24, at, beat * .46, 10, .27, tr.bus);
        if ([2, 6, 10, 14].includes(step % 16) && (tr.rhythm === 3 || tr.rhythm === 4)) chordAt(chord, at, beat, tr.rhythm, tr.bus);
        else if (step % 16 === 0 && tr.rhythm !== 3 && tr.rhythm !== 4) chordAt(chord, at, beat, tr.rhythm, tr.bus);
      }
    }
    tr.step++;
    tr.nextTime += beat / 4;
    return true;
  }
  function tick() {
    if (!transport || !ctx) return;
    let count = 0;
    while (transport && transport.nextTime < ctx.currentTime + .135 && count++ < 20) {
      if (!scheduleStep()) break;
    }
  }
  async function beginDemo(index) {
    if (!await audio()) return;
    stopTransport(false);
    const song = SONGS[index];
    transport = { type: 'demo', song: index, step: 0, nextTime: ctx.currentTime + .08, bpm: song.tempo, bus: createBus() };
    loop = setInterval(tick, 25);
    reflectButtons();
    show(('0' + (index + 1)).slice(-2) + ' ' + song.title.toUpperCase(), 'DEMO • BAR 1/16');
    tick();
  }
  async function beginRhythm() {
    if (!await audio()) return;
    stopTransport(false);
    transport = { type: 'rhythm', rhythm, step: 0, nextTime: ctx.currentTime + .08, bpm: tempo, bus: createBus() };
    loop = setInterval(tick, 25);
    reflectButtons();
    show(RHYTHMS[rhythm].name.toUpperCase() + ' RHYTHM', tempo + ' BPM • PLAYING');
    tick();
  }
  function stopHeld() {
    for (const entry of held.values()) entry.sound.release(ctx.currentTime);
    held.clear(); pending.forEach(token => cancelled.add(token));
    keyElements.forEach(node => node.classList.remove('pressed'));
  }
  async function press(midi, token) {
    if (held.has(token) || pending.has(token)) return;
    pending.add(token);
    const ready = await audio();
    pending.delete(token);
    if (!ready || cancelled.has(token)) { cancelled.delete(token); return; }
    if (held.has(token)) return;
    if (autoChord && midi < 60 && transport?.type !== 'demo' && transport?.type !== 'midi') {
      heldChord = label(midi + 12) + ($('chordType').value === 'minor' ? 'm' : '');
      const chord = chordInfo(heldChord);
      const sounds = chord.notes.map(n => voice(n, ctx.currentTime, .0, 2, .12, master, true));
      held.set(token, { midi, sound: { release: t => sounds.forEach(s => s.release(t)) }, started: ctx.currentTime, chord: true });
      show('AUTO CHORD ' + heldChord.toUpperCase(), 'PLAY HIGHER KEYS FOR THE MELODY');
    } else {
      const sound = engine==='soundfont' && bank ? bank.liveOn(midi, 96) : engine==='fm' ? EK1FM.voice(ctx,master,midi,ctx.currentTime,0,fmIndex,fmSettings,.38,true) : voice(midi, ctx.currentTime, 0, tone, .3, master, true);
      held.set(token, { midi, sound, started: ctx.currentTime, tone });
      if (recording) {
        take.push({ midi, tone:engine==='fm'?EK1FM.presets[fmIndex].tone:engine==='soundfont'&&bank?EK1MIDI.toneFor(bank.selected.program):tone, ...(engine==='fm'?{fm:{index:fmIndex,settings:{...fmSettings}},program:EK1FM.presets[fmIndex].program}:{}), ...(engine==='soundfont'&&bank ? {program:bank.selected.program,bankMSB:bank.selected.bankMSB,bankLSB:bank.selected.bankLSB,bankGeneration} : {}), t: Math.max(0, ctx.currentTime - takeStart), length: null });
        held.get(token).takeIndex = take.length - 1;
      }
      if (transport?.type !== 'demo' && transport?.type !== 'midi') show(voiceLabel(), 'KEY ' + label(midi) + (recording ? ' • RECORDING' : ''));
    }
    keyElements.get(midi)?.classList.add('pressed');
  }
  function release(token) {
    if (pending.has(token)) cancelled.add(token);
    const entry = held.get(token);
    if (!entry) return;
    held.delete(token);
    entry.sound.release(ctx.currentTime);
    if (recording && entry.takeIndex !== undefined && take[entry.takeIndex]) take[entry.takeIndex].length = Math.max(.08, ctx.currentTime - entry.started);
    if (![...held.values()].some(x => x.midi === entry.midi)) keyElements.get(entry.midi)?.classList.remove('pressed');
  }
  function endRecord() {
    if (!recording) return;
    recording = false;
    clearTimeout(recordTimer); recordTimer = null;
    for (const e of take) if (e.length === null) e.length = Math.max(.08, ctx.currentTime - takeStart - e.t);
    reflectButtons();
    show('RECORDING SAVED', take.length + ' NOTES • PLAY BACK OR CLEAR');
  }
  async function toggleRecord() {
    if (recording) { endRecord(); return; }
    if (bankLoading || !await audio()) return;
    stopTransport(false);
    stopHeld();
    take = []; takeStart = ctx.currentTime; recording = true;
    recordTimer = setTimeout(endRecord, 120000);
    reflectButtons();
    show('RECORDING', 'PLAY THE KEYS • REC TO FINISH');
  }
  async function playTake() {
    if (!take.length || recording || !await audio()) return;
    stopTransport(false);
    const bus = createBus();
    if(bank && take.every(n=>n.bankGeneration===bankGeneration)){
      transport={type:'take',song:EK1MIDI.parse(EK1MIDI.encodeTake(take)),index:0,start:ctx.currentTime+.08,active:[],bus,sampleBank:bank};
      loop=setInterval(midiTick,25);reflectButtons();show('PLAYING RECORDING',take.length+' NOTES');midiTick();return;
    }
    transport = { type: 'take', bus };
    const start = ctx.currentTime + .09;
    for (const n of take) {
      const at = start + n.t;
      if(n.fm)EK1FM.voice(ctx,bus,n.midi,at,n.length||.12,n.fm.index,n.fm.settings,.38);
      else voice(n.midi, at, n.length || .12, n.tone, .34, bus);
      lamp(n.midi, at, n.length || .12);
    }
    const end = Math.max(...take.map(n => n.t + (n.length || .12)));
    endTimer = setTimeout(() => { stopTransport(); show('PLAYBACK FINISHED', take.length + ' RECORDED NOTES'); }, (end + .8) * 1000);
    reflectButtons();
    show('PLAYING RECORDING', take.some(n=>n.bankGeneration!==undefined)?'ORIGINAL BANK UNAVAILABLE':take.length + ' NOTES');
  }
  // File selection never uploads data; the codec processes bytes in this tab.
  function midiMessage(text) { $('midiStatus').textContent = text; }
  async function openMidi(file) {
    if (!file || recording) return;
    const id=++importRequest;
    try {
      if(file.size>EK1MIDI.MAX_BYTES)throw Error('MIDI files are limited to 8 MB.');
      const parsed=EK1MIDI.parse(await file.arrayBuffer());
      if(id!==importRequest||recording)return;
      if(transport?.type==='midi')stopTransport(false);
      importedMidi=parsed; midiName=file.name;
      const seconds=Math.round(parsed.duration), length=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
      midiMessage(midiName+' | '+parsed.notes.length+' notes | '+parsed.channels.length+' parts | '+length);
      show('MIDI READY', 'PRESS PLAY MIDI');
    } catch(e) {
      if(id===importRequest)midiMessage('Could not open MIDI: '+e.message+(importedMidi?' (previous song kept)':''));
    }
    reflectButtons();
  }
  function downloadMidi(bytes,name) {
    const url=URL.createObjectURL(new Blob([bytes],{type:'audio/midi'}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function midiTick() {
    const tr=transport;
    if(!tr||(tr.type!=='midi'&&!tr.sampleBank))return;
    const now=ctx.currentTime;
    if(tr.sampleBank){
      let work=0;
      for(let i=tr.active.length-1;i>=0;i--)if(tr.active[i].end<=now){tr.sampleBank.songOff(tr.active[i].note);tr.active.splice(i,1);}
      while(tr.index<tr.song.notes.length && tr.start+tr.song.notes[tr.index].time<=now+.005 && work++<128){
        const n=tr.song.notes[tr.index++], end=tr.start+n.time+n.duration;
        if(end<=now||tr.active.length>=64)continue;
        tr.sampleBank.songOn(n);tr.active.push({note:n,end});lamp(n.key,now,end-now);
      }
      if(tr.index===tr.song.notes.length && now>=tr.start+tr.song.duration+.7){stopTransport(false);show(tr.type==='take'?'PLAYBACK FINISHED':'MIDI FINISHED','PRESS PLAY TO REPEAT');}
      return;
    }
    tr.active=tr.active.filter(n=>n.end>now);
    // Schedule only a short window of music. Cap per-tick work and polyphony
    // to keep even dense imported files from overwhelming the browser.
    let work=0;
    while(tr.index<tr.song.notes.length && tr.start+tr.song.notes[tr.index].time<now+.13 && work++<128){
      const n=tr.song.notes[tr.index++], at=tr.start+n.time, end=at+n.duration;
      if(end<=now)continue;
      const begin=Math.max(at,now);
      if(n.channel===9){
        if(at>=now-.12)drum(EK1MIDI.drumFor(n.key),begin,n.velocity/127*.55,tr.bus);
      }else if(tr.active.length<64){
        const sound=voice(n.key,begin,Math.max(.01,end-begin),EK1MIDI.toneFor(n.program),n.velocity/127*.23,tr.bus);
        tr.active.push({sound,end:end+.7});
        lamp(n.key,begin,Math.max(.01,end-begin));
      }
    }
    if(tr.index===tr.song.notes.length && now>=tr.start+tr.song.duration+.7){
      stopTransport(false);show('MIDI FINISHED','PRESS PLAY TO REPEAT');
    }
  }
  async function playMidi() {
    if(transport?.type==='midi'){stopTransport();return;}
    if(!importedMidi||recording||bankLoading||!await audio())return;
    stopTransport(false);
    transport={type:'midi',song:importedMidi,index:0,start:ctx.currentTime+.08,active:[],bus:createBus(),sampleBank:bank};
    loop=setInterval(midiTick,25);reflectButtons();
    show('MIDI PLAYBACK','PLAY ALONG ON THE KEYS');midiTick();
  }
  function exportTakeMidi(){
    if(!take.length||recording)return;
    try{downloadMidi(EK1MIDI.encodeTake(take),'EK-1-recording.mid');midiMessage('Recording exported as MIDI.');}
    catch(e){midiMessage('Could not export recording: '+e.message);}
  }
  function voiceLabel(){
    if(engine==='soundfont'&&bank)return bank.selected.name.toUpperCase();
    if(engine==='fm')return EK1FM.presets[fmIndex].name.toUpperCase();
    return String(tone+1).padStart(2,'0')+' '+TONES[tone].name.toUpperCase();
  }
  function rebuildVoices(){
    const group=(label,options)=>{
      const g=document.createElement('optgroup');g.label=label;
      options.forEach(o=>g.append(o));return g;
    };
    const groups=[
      group('Classic keyboard',TONES.map((p,i)=>new Option(String(i+1).padStart(2,'0')+' '+p.name,String(i)))),
      group('FM synthesis',EK1FM.presets.map((p,i)=>new Option('FM '+String(i+1).padStart(2,'0')+' '+p.name,'fm-'+i)))
    ];
    if(bank)groups.push(group('SoundFont',bank.presets.map((p,i)=>new Option(p.name+' ['+(p.program+1)+']','sf-'+i))));
    $('tone').replaceChildren(...groups);
    $('tone').value=engine==='fm'?'fm-'+fmIndex:engine==='soundfont'?'sf-'+bankVoiceIndex:String(tone);
  }
  function updateFM(){
    for(const [key,id] of [['brightness','fmBrightness'],['attack','fmAttack'],['release','fmRelease']]){
      $(id).value=String(Math.round(fmSettings[key]*100));
      $(id+'Value').textContent=$(id).value+'%';
    }
    reflectButtons();
  }
  function selectVoice(){
    if(recording||bankLoading)return;
    const value=$('tone').value;
    if(ctx)stopHeld();
    if(value.startsWith('fm-')){
      engine='fm';fmIndex=Number(value.slice(3));
    }else if(value.startsWith('sf-')&&bank){
      engine='soundfont';bankVoiceIndex=Number(value.slice(3));bank.select(bank.presets[bankVoiceIndex]);
    }else{
      engine='classic';tone=Number(value);
    }
    updateFM();
    show(voiceLabel(),engine==='fm'?'FM VOICE':engine==='soundfont'?'SOUNDFONT VOICE':'READY TO PLAY');
  }
  function bankMessage(message){$('bankStatus').textContent=message;}
  async function loadBank(file){
    if(!file||bankLoading||recording)return;
    if(file.size>EK1SoundFont.MAX_BYTES){bankMessage('SoundFont exceeds 128 MB.');return;}
    bankLoading=true;reflectButtons();bankMessage('Opening '+file.name+'…');
    try{
      if(!await audio())throw Error('Web Audio is unavailable.');
      if(transport)stopTransport(false);stopHeld();
      const bytes=await file.arrayBuffer();
      // Keep the previous bank if validation or engine loading fails.
      const next=await EK1SoundFont.create(ctx,master,bytes);
      if(transport)stopTransport(false);stopHeld();
      bank?.destroy();bank=next;bankGeneration++;bankVoiceIndex=0;engine='soundfont';rebuildVoices();updateFM();
      bankMessage(file.name+' | '+bank.presets.length+' melodic voices');
      show('SOUNDFONT READY',bank.selected.name.toUpperCase());
    }catch(e){bankMessage('Could not open SoundFont: '+e.message+(bank?' (previous bank kept)':''));}
    finally{bankLoading=false;reflectButtons();}
  }
  function unloadBank(){
    if(!bank||bankLoading||recording)return;
    stopTransport(false);stopHeld();bank.destroy();bank=null;
    if(engine==='soundfont')engine='classic';
    rebuildVoices();updateFM();
    bankMessage('20 built-in voices. Add a local SoundFont to expand the voice menu.');
    show(voiceLabel(),'READY TO PLAY');
  }
  function buildKeys() {
    const bed = $('keys');
    let white = 0;
    const whiteCount = Array.from({length:LAST - FIRST + 1}, (_,i) => FIRST + i).filter(n => !SHARPS.has(n % 12)).length;
    for (let midi = FIRST; midi <= LAST; midi++) {
      const black = SHARPS.has(midi % 12), element = document.createElement('button');
      element.type = 'button';
      element.className = 'key ' + (black ? 'black' : 'white');
      element.dataset.midi = midi;
      const position = white / whiteCount * 100;
      if (black) {
        element.style.left = 'calc(' + position + '% - ' + (100 / whiteCount * .32) + '%)';
        element.style.width = (100 / whiteCount * .64) + '%';
      } else {
        element.style.left = position + '%';
        element.style.width = (100 / whiteCount) + '%';
        white++;
      }
      const shortcutIndex = midi - 60;
      const shortcut = SHORTCUTS[shortcutIndex];
      element.innerHTML = '<span class="note"></span><span class="shortcut"></span>';
      element.querySelector('.note').textContent = label(midi);
      element.querySelector('.shortcut').textContent = shortcut ? shortcut.toUpperCase() : '';
      element.setAttribute('aria-label', 'Play ' + label(midi) + (shortcut ? ', keyboard ' + shortcut : ''));
      const pointerToken = 'pointer-' + midi;
      element.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        element.setPointerCapture(event.pointerId);
        press(midi, pointerToken);
      });
      for (const type of ['pointerup','pointercancel','lostpointercapture']) element.addEventListener(type, () => release(pointerToken));
      element.addEventListener('keydown', event => {
        if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); press(midi, 'focus-' + midi); }
      });
      element.addEventListener('keyup', event => {
        if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); release('focus-' + midi); }
      });
      bed.append(element);
      keyElements.set(midi, element);
    }
  }
  // Move by one white-key octave on small screens; no modification to note pitch.
  function setupKeyboardNavigation() {
    const viewport = document.querySelector('.keyboard-scroll');
    const bed = $('keys');
    const left = $('keyLeft'), right = $('keyRight');
    const octavePixels = () => bed.scrollWidth * 7 / 29;
    function updateButtons() {
      const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      left.disabled = viewport.scrollLeft <= 2;
      right.disabled = viewport.scrollLeft >= maximum - 2;
    }
    function nudge(direction) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      viewport.scrollBy({ left: direction * octavePixels(), behavior: reduced ? 'auto' : 'smooth' });
    }
    left.addEventListener('click', () => nudge(-1));
    right.addEventListener('click', () => nudge(1));
    viewport.addEventListener('scroll', updateButtons, {passive:true});
    window.addEventListener('resize', updateButtons);
    // On a phone begin at C4 (where the computer-key shortcuts begin).
    // The full C3 chord octave remains one swipe to the left.
    requestAnimationFrame(() => {
      if (window.innerWidth <= 620) viewport.scrollLeft = Math.max(0, octavePixels() - 8);
      updateButtons();
    });
  }
  function setupKeyboardShortcuts() {
    const shortcutMap = new Map(SHORTCUTS.map((key, i) => [key, 60 + i]));
    document.addEventListener('keydown', event => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName) || event.target.isContentEditable) return;
      const midi = shortcutMap.get(event.key.toLowerCase());
      if (midi === undefined) return;
      event.preventDefault();
      press(midi, 'hardware-' + event.code);
    });
    document.addEventListener('keyup', event => { release('hardware-' + event.code); });
    window.addEventListener('blur', () => { if (ctx) stopHeld(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && ctx) stopHeld(); });
  }
  function initialize() {
    rebuildVoices();
    $('rhythm').replaceChildren(...RHYTHMS.map((p, i) => new Option(('0' + (i + 1)).slice(-2) + ' ' + p.name, String(i))));
    $('demoSong').replaceChildren(...SONGS.map((p, i) => new Option(('0' + (i + 1)).slice(-2) + ' ' + p.title, String(i))));
    $('tone').addEventListener('change', selectVoice);
    $('rhythm').addEventListener('change', () => { rhythm = Number($('rhythm').value); if (transport?.type === 'rhythm') beginRhythm(); else show(RHYTHMS[rhythm].name.toUpperCase(), 'RHYTHM SELECTED'); });
    $('tempo').addEventListener('input', () => {
      tempo = Number($('tempo').value);
      $('tempoValue').textContent = tempo + ' BPM';
      if (transport?.type === 'rhythm') transport.bpm = tempo;
    });
    $('volume').addEventListener('input', () => {
      volume = Number($('volume').value) / 100;
      if (ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, .015);
    });
    $('demoSong').addEventListener('change', () => {
      if (transport?.type === 'demo') beginDemo(Number($('demoSong').value));
      else show('DEMO ' + (Number($('demoSong').value) + 1), SONGS[Number($('demoSong').value)].title.toUpperCase());
    });
    $('prevDemo').addEventListener('click', () => {
      $('demoSong').value = String((Number($('demoSong').value) + SONGS.length - 1) % SONGS.length);
      $('demoSong').dispatchEvent(new Event('change'));
    });
    $('nextDemo').addEventListener('click', () => {
      $('demoSong').value = String((Number($('demoSong').value) + 1) % SONGS.length);
      $('demoSong').dispatchEvent(new Event('change'));
    });
    $('playDemo').addEventListener('click', () => {
      if (transport?.type === 'demo') stopTransport();
      else beginDemo(Number($('demoSong').value));
    });
    $('startRhythm').addEventListener('click', () => {
      if (transport?.type === 'rhythm') stopTransport();
      else beginRhythm();
    });
    $('stop').addEventListener('click', () => {
      if (recording) endRecord();
      stopTransport();
      if (ctx) stopHeld();
    });
    $('melodyOff').addEventListener('click', () => {
      melodyOff = !melodyOff; reflectButtons();
      if (transport?.type === 'demo') show('DEMO ' + (transport.song + 1), melodyOff ? 'MELODY OFF • PLAY ALONG' : 'MELODY ON');
    });
    $('accomp').addEventListener('click', () => {
      autoChord = !autoChord;
      if (!autoChord) heldChord = null;
      reflectButtons(); show('AUTO CHORD ' + (autoChord ? 'ON' : 'OFF'), autoChord ? 'PLAY C3–B3 TO CHOOSE A CHORD' : 'NORMAL KEYBOARD');
    });
    $('chordType').addEventListener('change', () => { if (autoChord && heldChord) heldChord = heldChord.replace(/m$/, '') + ($('chordType').value === 'minor' ? 'm' : ''); });
    $('record').addEventListener('click', toggleRecord);
    $('playTake').addEventListener('click', playTake);
    $('clearTake').addEventListener('click', () => { take = []; stopTransport(); reflectButtons(); show('RECORDING CLEARED', 'READY TO PLAY'); });

    for(const [key,id] of [['brightness','fmBrightness'],['attack','fmAttack'],['release','fmRelease']]){
      $(id).addEventListener('input',()=>{fmSettings[key]=Number($(id).value)/100;$(id+'Value').textContent=$(id).value+'%';});
    }
    $('fmReset').addEventListener('click',()=>{Object.assign(fmSettings,{brightness:1,attack:1,release:1});updateFM();});
    $('openBank').addEventListener('click',()=> $('bankFile').click());
    $('bankFile').addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';loadBank(file);});
    $('closeBank').addEventListener('click',unloadBank);

    $('openMidi').addEventListener('click', () => $('midiFile').click());
    $('midiFile').addEventListener('change', e => { const file=e.target.files[0]; e.target.value=''; openMidi(file); });
    $('playMidi').addEventListener('click', playMidi);
    $('saveMidi').addEventListener('click', () => { if(importedMidi)downloadMidi(importedMidi.bytes,midiName); });
    $('exportTake').addEventListener('click', exportTakeMidi);
    buildKeys(); setupKeyboardShortcuts(); setupKeyboardNavigation(); reflectButtons();
  }
  initialize();
  // Read-only diagnosis surface for automated browser regressions, not an end-user API.
  window.EK1 = Object.freeze({
    version: VERSION,
    tones: TONES.length,
    rhythms: RHYTHMS.length,
    demos: SONGS.length,
    get state() { return { transport: transport?.type || 'stopped', recording, takeNotes: take.length, demoIndex: transport?.type === 'demo' ? transport.song : null, autoChord, melodyOff, midiNotes: importedMidi?.notes.length || 0, midiChannels: importedMidi?.channels.length || 0, soundfont: !!bank, bankLoading, bankPresets: bank?.presets.length || 0, sampleVoices: bank?.voices || 0, engine, fmEnabled:engine==='fm', fmIndex, fmPresets:EK1FM.presets.length, fmSettings:{...fmSettings} }; },
    demoEvents: index => SONGS[index]?.events.map(e => ({...e})),
    demoBars: index => SONGS[index]?.bars,
    parseBar
  });
})();
