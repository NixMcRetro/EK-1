/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Electronic Keyboard (Model EK-1) v1.0.1. Original, offline-capable Web Audio instrument. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const VERSION = '1.0.1';
  const FIRST = 48, LAST = 96, STEPS_PER_BAR = 16;
  const SHARPS = new Set([1, 3, 6, 8, 10]);
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const CHANNEL_COLORS=['#e6af42','#6db4e4','#e68275','#9dc66e','#b6a0e3','#65c4b8','#e7a1c2','#c6bd76','#e69a51','#a3a9b1','#79a5ee','#dba5ec','#83c997','#dc8caa','#91b9ba','#d1a979'];
  let keyboardOctave=0;
  const SHORTCUT_BASE=53;
  const SHORTCUTS=['z','s','x','d','c','f','v','b','h','n','j','m','q','2','w','3','e','4','r','t','6','y','7','u'];
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
  let ctx, master, backingPreview, outputStage, outputMeter, noise, transport = null, loop = null, endTimer = null, transportGeneration = 0;
  let paused=false,pauseBusy=false,pauseDisplay=null,followDemoVoice=true,midiOverride='original';
  let tone = 0, rhythm = 0, tempo = 116, volume = EK1Levels.DEFAULT_VOLUME, melodyOff = false, autoChord = false;
  let backingVolume=.8;
  const backingLevels={1:115,2:120,3:115,9:110};
  let heldChord = null, recording = false, take = [], takeStart = 0, recordTimer = null;
  let importedMidi = null, midiName = '', importRequest = 0;
  let bank = null, bankLoading = false, bankFileRef = null;
  let engine='classic', fmIndex=0, bankVoiceIndex=0, bankGeneration=0;
  const effects={reverb:0,chorus:0},favourites=new Map();
  const fmSettings={brightness:1,attack:1,release:1};
  const held = new Map(), pending = new Set(), cancelled = new Set(), lights = new Map(), keyElements = new Map();
  let lampLoop=null;const lampQueue=[];
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
  // Same authored score, rhythm and accompaniment as Classic demos.
  // GM patches on song channels; live playing remains on channel 16.
  const DEMO_PROGRAMS = [0,4,19,21,48,56,61,12,80,89,33,73];
  function demoArrangement(index) {
    const song=SONGS[index];if(!song)throw Error('Unknown demo.');
    const beat=60/song.tempo, notes=[], controls=[];
    const add=(channel,key,step,length,tone,velocity)=>notes.push({channel,key,time:step*beat/4,duration:length*beat,program:channel===9?0:DEMO_PROGRAMS[tone],bankMSB:0,bankLSB:0,velocity});
    const pattern=RHYTHMS[song.rhythm], upbeat=song.rhythm===3||song.rhythm===4;
    for(let step=0;step<song.bars*STEPS_PER_BAR;step++){
      const pos=step%16, chord=chordInfo(song.chords[Math.floor(step/16)%song.chords.length]);
      if(pattern.kick[pos]==='1')add(9,36,step,.20,0,100);
      if(pattern.snare[pos]==='1')add(9,38,step,.18,0,88);
      if(pattern.hat[pos]==='1')add(9,42,step,.11,0,pos%4===2?78:53);
      if(step%4===0)add(2,chord.root-(pos===8?17:24),step,.52,10,87);
      if((upbeat&&[2,6,10,14].includes(pos))||(!upbeat&&pos===0)){
        const tone=upbeat?(song.rhythm===3?2:3):(song.rhythm===2?4:1);
        for(const key of chord.notes)add(1,key,step,upbeat?.3:.64,tone,upbeat?80:72);
      }
    }
    for(const n of song.events){
      const tone=song.sections?song.sections[Math.floor(n.step/64)%song.sections.length]:song.lead;
      add(0,n.midi,n.step,n.length*.91,tone,100);
    }
    for(const [channel,level,pan] of [[0,100,64],[1,115,53],[2,120,64],[9,110,64]])controls.push({time:0,channel,control:7,value:level},{time:0,channel,control:10,value:pan});
    notes.sort((a,b)=>a.time-b.time||a.channel-b.channel);
    return {notes,controls,channels:[0,1,2,9],duration:song.bars*4*beat};
  }
  function demoIndex(tr=transport){return tr?.type==='demo'?(tr.demoIndex??tr.song):null;}
  function demoDisplay(tr,bar){
    const index=demoIndex(tr),song=SONGS[index];
    show(String(index+1).padStart(2,'0')+' '+song.title.toUpperCase(),'DEMO - '+(tr.sampleBank?'SF':'CLASSIC')+' - BAR '+bar+'/'+song.bars+(melodyOff?' - MELODY OFF':'')+(tr.repeatCount?' - LOOP '+(tr.repeatCount+1):''));
  }
  async function audio() {
    if (!ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { show('AUDIO NOT SUPPORTED', 'Use a browser with Web Audio'); return false; }
      ctx = new Audio();
      outputMeter=ctx.createAnalyser();outputMeter.fftSize=2048;outputMeter.connect(ctx.destination);
      outputStage=EK1Levels.create(ctx,outputMeter,volume,effects);
      master=outputStage.input;
      backingPreview=ctx.createGain();backingPreview.gain.value=backingVolume*1.25;backingPreview.connect(master);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (!paused && ctx.state !== 'running') {
      // Firefox can leave resume() pending under autoplay rules. Do not deadlock UI.
      ctx.resume().catch(() => show('AUDIO BLOCKED', 'ALLOW SOUND IN YOUR BROWSER'));
      setTimeout(() => {
        if (ctx && !paused && ctx.state !== 'running') show('AUDIO BLOCKED', 'CLICK A KEY OR ALLOW SOUND');
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
    $('playDemo').disabled = bankLoading || recording;
    $('pause').disabled=!transport||recording||bankLoading||pauseBusy;
    $('pause').textContent=paused?'RESUME ▶':'PAUSE Ⅱ';$('pause').setAttribute('aria-pressed',String(paused));
    $('demoSound').textContent='Demo backing: '+(bank?'SoundFont':'Classic')+' - Lead: '+(followDemoVoice?voiceLabel():'Original');
    $('startRhythm').textContent = transport?.type === 'rhythm' ? 'PLAYING' : 'START';
    $('record').textContent = recording ? '■ STOP REC' : '● REC';
    $('record').setAttribute('aria-pressed', String(recording));
    $('melodyOff').setAttribute('aria-pressed', String(melodyOff));
    $('accomp').setAttribute('aria-pressed', String(autoChord));
    $('playTake').disabled = take.length === 0 || recording;
    $('clearTake').disabled = take.length === 0 || recording;
    $('exportTake').disabled = take.length === 0 || recording;
    $('playMidi').disabled = !importedMidi || recording;
    $('playMidi').textContent = transport?.type === 'midi' && !transport.composing ? 'STOP MIDI' : 'PLAY MIDI';
    $('saveMidi').disabled = !importedMidi;
    $('openMidi').disabled = recording;
    $('openBank').disabled = bankLoading || recording || !!window.EK1Standalone;
    $('closeBank').disabled = !bank || bankLoading || recording;
    $('tone').disabled = recording || bankLoading;
    refreshFavourites();
    $('activeEngine').textContent = engine==='soundfont'?'SOUNDFONT':engine==='fm'?'FM':'CLASSIC';
    $('fmPanel').hidden = engine!=='fm';
    for(const id of ['fmBrightness','fmAttack','fmRelease','fmReset'])$(id).disabled=engine!=='fm'||recording||bankLoading;
    $('record').disabled = bankLoading;
    if(bankLoading)$('playMidi').disabled=true;
    document.dispatchEvent(new Event('ek1-transport'));
  }
  function createBus() {
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    return bus;
  }
  function voice(midi, at, duration, instrument, velocity = .26, bus = master, heldVoice = false, audioContext = ctx) {
    const ctx=audioContext;
    const patch = TONES[instrument] || TONES[0];
    const start = Math.max(ctx.currentTime, at);
    const output = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(patch.cutoff, ctx.sampleRate * .45);
    filter.Q.value = .4;
    output.connect(filter).connect(bus);
    const count = patch.harmonics.length;
    const oscs = [], amps = [];
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator(), amp = ctx.createGain();
      osc.type = patch.wave;
      osc.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12) * (i + 1), start);
      amp.gain.value = patch.harmonics[i] / count;
      osc.connect(amp).connect(output);
      osc.start(start);
      oscs.push(osc); amps.push(amp);
    }
    output.gain.setValueAtTime(.0001, start);
    output.gain.linearRampToValueAtTime(velocity, start + patch.attack);
    let offAt=Infinity, ended=0;
    oscs.forEach(osc=>osc.onended=()=>{if(++ended===oscs.length){for(const node of [...oscs,...amps,output,filter])node.disconnect();}});
    const release = when => {
      const off = Math.max(ctx.currentTime, when, start + .001);
      if(off>=offAt)return;offAt=off;
      const gain=Math.max(.0001,velocity*Math.min(1,(off-start)/patch.attack));
      output.gain.cancelScheduledValues(off);
      if(off<start+patch.attack)output.gain.linearRampToValueAtTime(gain,off);
      else output.gain.setValueAtTime(gain,off);
      output.gain.exponentialRampToValueAtTime(.0001, off + patch.release);
      oscs.forEach(osc => { try { osc.stop(off + patch.release + .025); } catch (_) {} });
    };
    if (!heldVoice) release(start + Math.max(duration, .01));
    return { release };
  }
  function drum(kind, at, strength, bus, audioContext = ctx, noiseBuffer = noise) {
    const ctx=audioContext, noise=noiseBuffer;
    const time = Math.max(ctx.currentTime, at);
    if (kind === 'kick') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(155, time);
      o.frequency.exponentialRampToValueAtTime(47, time + .13);
      g.gain.setValueAtTime(.001,time);g.gain.linearRampToValueAtTime(strength*.75,time+.003);
      g.gain.exponentialRampToValueAtTime(.001, time + .23);
      o.connect(g).connect(bus); o.onended=()=>{o.disconnect();g.disconnect();}; o.start(time); o.stop(time + .25);
      return;
    }
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise;
    f.type = 'highpass';
    f.frequency.value = kind === 'snare' ? 1300 : 5200;
    g.gain.setValueAtTime(.001,time);g.gain.linearRampToValueAtTime(strength*(kind==='snare'?.45:.16),time+.002);
    g.gain.exponentialRampToValueAtTime(.001, time + (kind === 'snare' ? .16 : .045));
    src.connect(f).connect(g).connect(bus); src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();};
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
      notes.forEach(n => voice(n, at, beatDuration * .3, style === 3 ? 2 : 3, .12, bus));
    } else {
      notes.forEach(n => voice(n, at, beatDuration * .64, style === 2 ? 4 : 1, .085, bus));
    }
    return root;
  }
  function clockTimer(at,fn){
    const id=setInterval(()=>{if(paused||!ctx||ctx.currentTime<at)return;clearInterval(id);fn();},25);
    return id;
  }
  async function togglePause(){
    if(!transport||recording||bankLoading||pauseBusy||!ctx)return;
    const current=transport;pauseBusy=true;
    try{
      if(!paused){
        stopHeld();bank?.stopLive();pauseDisplay=[$('displayMain').textContent,$('displaySub').textContent];
        paused=true;reflectButtons();await ctx.suspend();
        if(transport===current&&paused)show('PAUSED','PRESS RESUME TO CONTINUE');
      }else{
        await ctx.resume();
        if(transport===current){paused=false;if(pauseDisplay)show(...pauseDisplay);pauseDisplay=null;}
      }
    }catch(e){paused=ctx.state==='suspended';show('AUDIO PAUSE UNAVAILABLE','PRESS STOP OR RESUME');}
    finally{pauseBusy=false;reflectButtons();}
  }
  function paintLamp(midi){
    const node=keyElements.get(midi),active=lights.get(midi);
    if(!node)return;
    const channels=active?[...active.keys()].filter(c=>c>=0).sort((a,b)=>a-b):[];
    node.classList.toggle('lit',!!active?.size);
    node.classList.toggle('channel-lit',channels.length>0);
    if(channels.length){
      const stops=channels.flatMap((c,i)=>[CHANNEL_COLORS[c]+' '+(i*100/channels.length)+'%',CHANNEL_COLORS[c]+' '+((i+1)*100/channels.length)+'%']);
      node.style.setProperty('--channel-fill','linear-gradient(90deg,'+stops.join(',')+')');
      node.dataset.channels=channels.map(c=>c+1).join(',');
    }else{node.style.removeProperty('--channel-fill');delete node.dataset.channels;}
  }
  // A single visual scheduler for all keys, driven by the audio clock.
  // No pair of repeating timers for every individual note.
  function lamp(midi,at,duration,channel=-1){
    if(!keyElements.has(midi)||channel===9)return;
    lampQueue.push({midi,channel,on:at,off:at+Math.max(.03,duration),started:false});
    if(lampLoop===null)lampLoop=setInterval(updateLamps,30);
  }
  function updateLamps(){
    if(paused||!ctx)return;
    const now=ctx.currentTime,changed=new Set();
    for(let i=lampQueue.length-1;i>=0;i--){
      const n=lampQueue[i];
      if(now>=n.off){
        if(n.started){const active=lights.get(n.midi);if(active){
          const remain=(active.get(n.channel)||1)-1;
          if(remain>0)active.set(n.channel,remain);else active.delete(n.channel);
          if(!active.size)lights.delete(n.midi);
        }changed.add(n.midi);}
        lampQueue[i]=lampQueue[lampQueue.length-1];lampQueue.pop();continue;
      }
      if(!n.started&&now>=n.on){
        n.started=true;let active=lights.get(n.midi);
        if(!active){active=new Map();lights.set(n.midi,active);}
        active.set(n.channel,(active.get(n.channel)||0)+1);changed.add(n.midi);
      }
    }
    for(const midi of changed)paintLamp(midi);
    if(!lampQueue.length){clearInterval(lampLoop);lampLoop=null;}
  }
  function clearLamps(){
    if(lampLoop!==null)clearInterval(lampLoop);lampLoop=null;lampQueue.length=0;lights.clear();
    keyElements.forEach((node,midi)=>paintLamp(midi));
  }
  function renderMidiLegend(song){
    const override=$('midiOverride');midiOverride='original';override.replaceChildren(new Option('Original instruments','original'),new Option('All melodic channels','all'));$('midiVoiceOptions').hidden=!song;
    if(song){for(const c of song.channels)if(c!==9)override.append(new Option('Channel '+(c+1),String(c)));}
    override.value='original';
    const legend=$('midiLegend');legend.replaceChildren();legend.hidden=!song;
    if(!song)return;
    const channels=new Map();
    for(const note of song.notes){
      if(!channels.has(note.channel))channels.set(note.channel,new Set());
      channels.get(note.channel).add(note.program+1);
    }
    for(const [channel,programs] of [...channels].sort((a,b)=>a[0]-b[0])){
      const item=document.createElement('span'),swatch=document.createElement('i');
      swatch.className='channel-swatch';swatch.style.background=CHANNEL_COLORS[channel];swatch.setAttribute('aria-hidden','true');
      const desc=channel===9?'CH 10 - Drums (not lit)':'CH '+(channel+1)+' - '+(programs.size===1?'GM '+[...programs][0]:'multiple patches');
      item.append(swatch,desc);legend.append(item);
    }
  }
  function backingBus(tr){
    const gain=ctx.createGain();gain.gain.value=backingVolume*1.25;gain.connect(tr.bus);tr.backingBus=gain;return gain;
  }
  function scaledBacking(channel,level=backingLevels[channel]){
    return Math.round(Math.max(0,Math.min(127,level*backingVolume)));
  }
  function updateBacking(){
    if(ctx){
      backingPreview?.gain.setTargetAtTime(backingVolume*1.25,ctx.currentTime,.02);
      transport?.backingBus?.gain.setTargetAtTime(backingVolume*1.25,ctx.currentTime,.02);
    }
    if(bank){
      if(transport?.type==='demo'||transport?.type==='rhythm'){
        for(const c of [1,2,9])bank.songControl({channel:c,control:7,value:scaledBacking(c)});
      }
      if(autoChord&&transport?.type!=='demo'&&transport?.type!=='midi'&&transport?.type!=='take')
        bank.songControl({channel:3,control:7,value:scaledBacking(3)});
    }
  }
  function sampleNote(channel,key,program,velocity){
    return {channel,key,program,velocity,bankMSB:0,bankLSB:0};
  }
  function sampleBeat(tr,channel,key,program,velocity,duration){
    const n=sampleNote(channel,key,program,velocity);
    tr.sampleBank.songOn(n);tr.sampleOff.push({note:n,at:ctx.currentTime+duration});
  }
  function sampledRhythmStep(tr,step,beat){
    const p=RHYTHMS[tr.rhythm],pos=step%16,at=ctx.currentTime;
    if(tr.sampleBank.hasDrums){
      if(p.kick[pos]==='1')sampleBeat(tr,9,36,0,100,beat*.20);
      if(p.snare[pos]==='1')sampleBeat(tr,9,38,0,88,beat*.18);
      if(p.hat[pos]==='1')sampleBeat(tr,9,42,0,pos%4===2?78:53,beat*.11);
    }else drumsForStep(step,at,tr.rhythm,tr.backingBus);
    if(!autoChord||!heldChord)return;
    const chord=chordInfo(heldChord),upbeat=tr.rhythm===3||tr.rhythm===4;
    if(step%4===0)sampleBeat(tr,2,chord.root-24,33,94,beat*.46);
    if((upbeat&&[2,6,10,14].includes(pos))||(!upbeat&&pos===0)){
      const program=DEMO_PROGRAMS[upbeat?(tr.rhythm===3?2:3):(tr.rhythm===2?4:1)];
      for(const key of chord.notes)sampleBeat(tr,1,key,program,upbeat?80:72,beat*(upbeat?.3:.64));
    }
  }
  function stopTransport(announce = true) {
    transportGeneration++;
    const wasPaused=paused;paused=false;pauseDisplay=null;
    if (loop) { clearInterval(loop); loop = null; }
    if (endTimer) { clearInterval(endTimer); endTimer = null; }
    clearLamps();
    if ((transport?.type === 'midi' || transport?.sampleBank) && ctx) {
      if (transport.sampleBank) transport.sampleBank.stopSong();
      transport.active?.forEach(n => n.sound.release(ctx.currentTime));
    }
    if (transport?.bus && ctx) {
      const b = transport.bus, now = ctx.currentTime;
      b.gain.cancelScheduledValues(now);
      if(wasPaused)b.gain.setValueAtTime(0,now);else b.gain.setTargetAtTime(.00001, now, .02);
      const channels=transport.channelBuses||[],backing=transport.backingBus;
      setTimeout(() => { try { channels.forEach(c=>{c.gain.disconnect();c.pan?.disconnect();}); backing?.disconnect();b.disconnect(); } catch (_) {} }, 2500);
    }
    transport = null;
    if(wasPaused&&ctx)ctx.resume().catch(()=>{});
    reflectButtons();
    if (announce) show('EK-1 READY', voiceLabel());
  }
  function demoLeadSound(midi,at,duration,tr,originalTone,velocity=.28){
    if(followDemoVoice&&engine==='fm')return EK1FM.voice(ctx,tr.bus,midi,at,duration,fmIndex,fmSettings,velocity*EK1Levels.FM_GAIN);
    return voice(midi,at,duration,followDemoVoice&&engine==='classic'?tone:originalTone,velocity,tr.bus);
  }
  function scheduleStep() {
    if (!transport) return;
    const tr = transport, step = tr.step, at = tr.nextTime, beat = 60 / tr.bpm;
    if (tr.type === 'demo') {
      const song = SONGS[tr.song];
      if (step >= song.bars * STEPS_PER_BAR) {
        if (loop) { clearInterval(loop); loop = null; }
        if (!endTimer) endTimer = clockTimer(at+($('demoLoop').checked?.15:.65),()=>finishDemo(tr));
        return false;
      }
      drumsForStep(step, at, song.rhythm, tr.backingBus);
      const chord = chordInfo(song.chords[Math.floor(step / 16) % song.chords.length]);
      if (step % 4 === 0) {
        const note = chord.root - (step % 16 === 8 ? 17 : 24);
        voice(note, at, beat * .52, 10, .34, tr.backingBus);
      }
      if (step % 16 === 0 && song.rhythm !== 3 && song.rhythm !== 4) chordAt(chord, at, beat, song.rhythm, tr.backingBus);
      if ((song.rhythm === 3 || song.rhythm === 4) && [2,6,10,14].includes(step % 16)) chordAt(chord, at, beat, song.rhythm, tr.backingBus);
      if (!melodyOff) {
        const play = song.events.filter(n => n.step === step);
        for (const n of play) {
          const demoTone = song.sections ? song.sections[Math.floor(step / 64) % song.sections.length] : song.lead;
          demoLeadSound(n.midi,at,n.length*beat*.91,tr,demoTone);
          lamp(n.midi, at, n.length * beat);
        }
      }
      if (step % 16 === 0) demoDisplay(tr,Math.floor(step/16)+1);
    } else if (tr.type === 'rhythm') {
      if(tr.sampleBank){sampledRhythmStep(tr,step,beat);}
      else {
      drumsForStep(step, at, tr.rhythm, tr.backingBus);
      if (autoChord && heldChord) {
        const chord = chordInfo(heldChord);
        if (step % 4 === 0) voice(chord.root - 24, at, beat * .46, 10, .32, tr.backingBus);
        if ([2, 6, 10, 14].includes(step % 16) && (tr.rhythm === 3 || tr.rhythm === 4)) chordAt(chord, at, beat, tr.rhythm, tr.backingBus);
        else if (step % 16 === 0 && tr.rhythm !== 3 && tr.rhythm !== 4) chordAt(chord, at, beat, tr.rhythm, tr.backingBus);
      }
      }
    }
    tr.step++;
    tr.nextTime += beat / 4;
    return true;
  }
  function tick() {
    if (!transport || !ctx || paused) return;
    const tr=transport;
    if(tr.type==='rhythm'&&tr.sampleBank){
      const now=ctx.currentTime;
      tr.sampleOff=tr.sampleOff.filter(e=>{if(e.at<=now){tr.sampleBank.songOff(e.note);return false;}return true;});
      const stepLength=60/tr.bpm/4;
      if(now-tr.nextTime>stepLength){const missed=Math.floor((now-tr.nextTime)/stepLength);tr.step+=missed;tr.nextTime+=missed*stepLength;}
    }
    let count = 0;
    while (transport && transport.nextTime < ctx.currentTime + (tr.type==='rhythm'&&tr.sampleBank?0:.135) && count++ < 20) {
      if (!scheduleStep()) break;
    }
  }
  async function beginDemo(index) {
    if(bankLoading||recording||!SONGS[index])return;
    const request=++transportGeneration;
    if(!await audio()||request!==transportGeneration)return;
    stopTransport(false);
    startDemo(index,0);
  }
  function finishDemo(tr){
    if(transport!==tr)return;
    const index=demoIndex(tr),repeatCount=(tr.repeatCount||0)+1,repeat=$('demoLoop').checked;
    stopTransport(false);
    if(repeat)startDemo(index,repeatCount);
    else show('DEMO FINISHED',SONGS[index].title.toUpperCase());
  }
  function startDemo(index,repeatCount){
    const song=SONGS[index];
    if(bank){
      transport=makeMidiTransport('demo',demoArrangement(index),bank,createBus());
      transport.demoIndex=index;transport.demoBar=1;transport.repeatCount=repeatCount;transport.localLead=[];transport.bus.gain.value=.70;backingBus(transport);updateBacking();
      loop=setInterval(midiTick,25);reflectButtons();demoDisplay(transport,1);midiTick();
    }else{
      transport={type:'demo',song:index,step:0,nextTime:ctx.currentTime+.08,bpm:song.tempo,bus:createBus(),repeatCount};
      transport.bus.gain.value=.70;backingBus(transport);
      loop=setInterval(tick,25);reflectButtons();demoDisplay(transport,1);tick();
    }
  }
  async function beginRhythm() {
    if (!await audio()) return;
    stopTransport(false);
    transport = { type: 'rhythm', rhythm, step: 0, nextTime: ctx.currentTime + .08, bpm: tempo, bus: createBus(), sampleBank:bank, sampleOff:[] };
    backingBus(transport);if(bank){bank.stopSong();updateBacking();}
    loop = setInterval(tick, 25);
    reflectButtons();
    show(RHYTHMS[rhythm].name.toUpperCase() + ' RHYTHM', tempo + ' BPM - PLAYING');
    tick();
  }
  function stopHeld() {
    for (const entry of held.values()) entry.sound.release(ctx.currentTime);
    held.clear(); pending.forEach(token => cancelled.add(token));
    keyElements.forEach(node => node.classList.remove('pressed'));
  }
  async function press(midi, token) {
    if (paused || held.has(token) || pending.has(token)) return;
    pending.add(token);
    const ready = await audio();
    pending.delete(token);
    if (!ready || paused || cancelled.has(token)) { cancelled.delete(token); return; }
    if (held.has(token)) return;
    if (autoChord && midi < 60 && transport?.type !== 'demo' && transport?.type !== 'midi') {
      heldChord = label(midi + 12) + ($('chordType').value === 'minor' ? 'm' : '');
      const chord = chordInfo(heldChord);
      let sounds;
      if(bank){
        const currentBank=bank;currentBank.songControl({channel:3,control:7,value:scaledBacking(3)});
        sounds=chord.notes.map(key=>{const note=sampleNote(3,key,19,80);currentBank.songOn(note);return {release(){currentBank.songOff(note);}};});
      }else sounds=chord.notes.map(n=>voice(n,ctx.currentTime,0,2,.15,backingPreview,true));
      held.set(token, { midi, sound: { release: t => sounds.forEach(s => s.release(t)) }, started: ctx.currentTime, chord: true });
      show('AUTO CHORD ' + heldChord.toUpperCase(), 'PLAY HIGHER KEYS FOR THE MELODY');
    } else {
      const sound = engine==='soundfont' && bank ? bank.liveOn(midi, 96) : engine==='fm' ? EK1FM.voice(ctx,master,midi,ctx.currentTime,0,fmIndex,fmSettings,.38*EK1Levels.FM_GAIN,true) : voice(midi, ctx.currentTime, 0, tone, .3, master, true);
      held.set(token, { midi, sound, started: ctx.currentTime, tone });
      if (recording) {
        take.push({ midi, tone:engine==='fm'?EK1FM.presets[fmIndex].tone:engine==='soundfont'&&bank?EK1MIDI.toneFor(bank.selected.program):tone, ...(engine==='fm'?{fm:{index:fmIndex,settings:{...fmSettings}},program:EK1FM.presets[fmIndex].program}:{}), ...(engine==='soundfont'&&bank ? {program:bank.selected.program,bankMSB:bank.selected.bankMSB,bankLSB:bank.selected.bankLSB,bankGeneration} : {}), t: Math.max(0, ctx.currentTime - takeStart), length: null });
        held.get(token).takeIndex = take.length - 1;
      }
      if (transport?.type !== 'demo' && transport?.type !== 'midi') show(voiceLabel(), 'KEY ' + label(midi) + (recording ? ' - RECORDING' : ''));
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
    show('RECORDING SAVED', take.length + ' NOTES - PLAY BACK OR CLEAR');
  }
  async function toggleRecord() {
    if (recording) { endRecord(); return; }
    if (bankLoading || !await audio()) return;
    stopTransport(false);
    stopHeld();
    take = []; takeStart = ctx.currentTime; recording = true;
    recordTimer = setTimeout(endRecord, 120000);
    reflectButtons();
    show('RECORDING', 'PLAY THE KEYS - REC TO FINISH');
  }
  async function playTake() {
    if (!take.length || recording || !await audio()) return;
    stopTransport(false);
    const bus = createBus();
    if(bank && take.every(n=>n.bankGeneration===bankGeneration)){
      transport=makeMidiTransport('take',EK1MIDI.parse(EK1MIDI.encodeTake(take)),bank,bus);
      loop=setInterval(midiTick,25);reflectButtons();show('PLAYING RECORDING',take.length+' NOTES');midiTick();return;
    }
    const start = ctx.currentTime + .09;
    transport = { type: 'take', bus, start };
    for (const n of take) {
      const at = start + n.t;
      if(n.fm)EK1FM.voice(ctx,bus,n.midi,at,n.length||.12,n.fm.index,n.fm.settings,.38*EK1Levels.FM_GAIN);
      else voice(n.midi, at, n.length || .12, n.tone, .34, bus);
      lamp(n.midi, at, n.length || .12);
    }
    const end = Math.max(...take.map(n => n.t + (n.length || .12)));
    endTimer = clockTimer(start+end+.8,() => { stopTransport(); show('PLAYBACK FINISHED', take.length + ' RECORDED NOTES'); });
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
      importedMidi=parsed; midiName=file.name;renderMidiLegend(parsed);
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
  function makeMidiTransport(type,song,sampleBank,bus){
    const tr={type,song,index:0,controlIndex:0,start:ctx.currentTime+.08,active:[],bus,sampleBank};
    if(sampleBank){sampleBank.stopSong();tr.events=EK1MIDI.timeline(song);}
    {
      tr.channelBuses=Array.from({length:16},()=>{
        const gain=ctx.createGain(),pan=ctx.createStereoPanner?.();
        gain.gain.value=100/127;
        if(pan)gain.connect(pan).connect(bus);else gain.connect(bus);
        return {gain,pan,volume:100,expression:127};
      });
    }
    return tr;
  }
  // Only imported MIDI can be overridden; Song Builder and recorded takes
  // keep their authored part assignments. Percussion always retains channel 10.
  function followsMidiVoice(tr,n){
    return tr.type==='midi'&&!tr.composing&&n.channel!==9&&(midiOverride==='all'||midiOverride===String(n.channel));
  }
  function localMidiVoice(tr,n,at,end,override){
    const bus=tr.channelBuses[n.channel].gain,velocity=n.velocity/127*.23;
    if(override&&engine==='fm')return EK1FM.voice(ctx,bus,n.key,at,Math.max(.01,end-at),fmIndex,fmSettings,velocity*EK1Levels.FM_GAIN);
    return voice(n.key,at,Math.max(.01,end-at),override&&engine==='classic'?tone:EK1MIDI.toneFor(n.program),velocity,bus);
  }
  function applyMidiControl(tr,e,at){
    const c=tr.channelBuses[e.channel];if(!c)return;
    if(e.control===7)c.volume=e.value;else if(e.control===11)c.expression=e.value;
    if(e.control===7||e.control===11)c.gain.gain.setTargetAtTime(c.volume*c.expression/(127*127),at,.005);
    if(e.control===10&&c.pan)c.pan.pan.setTargetAtTime((e.value-64)/64,at,.005);
  }
  function repeatMidi(tr){return tr.type==='midi'&&!tr.composing&&$('midiLoop').checked&&tr.song===importedMidi;}
  function finishMidi(tr){
    if(transport!==tr)return;
    if(repeatMidi(tr)){
      const count=(tr.repeatCount||0)+1;
      // Reset only song channels, not the independent live SoundFont channel.
      // Recreate channel buses to discard old controller automation and notes.
      stopTransport(false);
      transport=makeMidiTransport('midi',tr.song,tr.sampleBank,createBus());
      transport.repeatCount=count;
      loop=setInterval(midiTick,25);reflectButtons();
      show('MIDI PLAYBACK','LOOP '+(count+1)+' - PLAY ALONG');
      midiTick();return;
    }
    stopTransport(false);show('MIDI FINISHED','PRESS PLAY TO REPEAT');
  }
  function returnToKeyboard(){
    const instrument=document.querySelector('.instrument'),keys=document.querySelector('.keyboard-scroll');
    const target=instrument.getBoundingClientRect().height>window.innerHeight?keys:instrument;
    keys.focus({preventScroll:true});
    // Immediate navigation avoids focus/scroll animation conflicts in Safari.
    target.scrollIntoView({block:target===keys?'center':'start',behavior:'instant'});
  }
  function midiTick() {
    const tr=transport;
    if(paused||!tr||(tr.type!=='midi'&&!tr.sampleBank))return;
    const now=ctx.currentTime;
    if(tr.sampleBank){
      // Dispatch a single chronological queue. Offs precede ons at a shared
      // tick; no early note-on can overtake a still-pending note-off.
      if(tr.localLead)tr.localLead=tr.localLead.filter(n=>n.end>now);
      tr.active=tr.active.filter(n=>n.end>now);
      let work=0;
      while(tr.index<tr.events.length && tr.start+tr.events[tr.index].time<=now && work++<2048){
        const e=tr.events[tr.index++],n=e.note;
        if(e.kind==='control'){const control=tr.type==='demo'&&e.control===7&&[1,2,9].includes(e.channel)?{...e,value:scaledBacking(e.channel,e.value)}:e;tr.sampleBank.songControl(control);applyMidiControl(tr,control,now);continue;}
        if(e.kind==='off'){tr.sampleBank.songOff(n);continue;}
        const end=tr.start+n.time+n.duration;
        if(end<=now||(tr.type==='demo'&&melodyOff&&n.channel===0))continue;
        if(tr.type==='demo'&&n.channel===9&&!tr.sampleBank.hasDrums){drum(EK1MIDI.drumFor(n.key),now,n.velocity/127*.55,tr.backingBus);}
        else if(tr.type==='demo'&&n.channel===0&&followDemoVoice&&engine!=='soundfont'){
          const sound=demoLeadSound(n.key,now,end-now,tr,EK1MIDI.toneFor(n.program),.25);tr.localLead.push({sound,end:end+.7});
        }else if(followsMidiVoice(tr,n)){
          if(engine==='soundfont'){
            tr.sampleBank.songOn(n,bank.selected);
            tr.lastOverride={channel:n.channel,engine,voice:$('tone').value};
          }else if(tr.active.length<64){
            const sound=localMidiVoice(tr,n,now,end,true);tr.active.push({sound,end:end+1.2});
            tr.lastOverride={channel:n.channel,engine,voice:$('tone').value};
          }
        }else tr.sampleBank.songOn(n,tr.type==='demo'&&n.channel===0&&followDemoVoice&&engine==='soundfont'?bank.selected:null);
        if(tr.type!=='demo'||n.channel===0)lamp(n.key,now,end-now,tr.type==='midi'?n.channel:-1);
      }
      if(tr.type==='demo'){
        const bar=Math.min(16,1+Math.floor(Math.max(0,now-tr.start)/(240/SONGS[tr.demoIndex].tempo)));
        if(bar!==tr.demoBar){tr.demoBar=bar;demoDisplay(tr,bar);}
      }
      if(tr.index===tr.events.length && now>=tr.start+tr.song.duration+((repeatMidi(tr)||(tr.type==='demo'&&$('demoLoop').checked))?.15:.7)){
        if(tr.type==='midi'){finishMidi(tr);return;}
        if(tr.type==='demo'){finishDemo(tr);return;}
        stopTransport(false);show('PLAYBACK FINISHED','PRESS PLAY TO REPEAT');
      }
      return;
    }
    const controls=tr.song.controls||[];
    while(tr.controlIndex<controls.length&&tr.start+controls[tr.controlIndex].time<now+.135){
      const e=controls[tr.controlIndex++],at=Math.max(now,tr.start+e.time);applyMidiControl(tr,e,at);
    }
    tr.active=tr.active.filter(n=>n.end>now);
    let work=0;
    while(tr.index<tr.song.notes.length && tr.start+tr.song.notes[tr.index].time<now+.13 && work++<128){
      const n=tr.song.notes[tr.index++],at=tr.start+n.time,end=at+n.duration;
      if(end<=now)continue;
      const begin=Math.max(at,now),channel=tr.channelBuses[n.channel].gain;
      if(n.channel===9){
        if(at>=now-.12)drum(EK1MIDI.drumFor(n.key),begin,n.velocity/127*.55,channel);
      }else if(tr.active.length<64){
        const override=followsMidiVoice(tr,n),sound=localMidiVoice(tr,n,begin,end,override);
        if(override)tr.lastOverride={channel:n.channel,engine,voice:$('tone').value};
        tr.active.push({sound,end:end+1.2});lamp(n.key,begin,Math.max(.01,end-begin),n.channel);
      }
    }
    if(tr.index===tr.song.notes.length && now>=tr.start+tr.song.duration+(repeatMidi(tr)?.15:.7)){finishMidi(tr);}
  }
  async function playMidi() {
    if(transport?.type==='midi'&&!transport.composing){stopTransport();return;}
    if(!importedMidi||recording||bankLoading)return;
    const request=++transportGeneration;
    if(!await audio()||request!==transportGeneration)return;
    stopTransport(false);
    transport=makeMidiTransport('midi',importedMidi,bank,createBus());transport.repeatCount=0;
    loop=setInterval(midiTick,25);reflectButtons();
    show('MIDI PLAYBACK','PLAY ALONG ON THE KEYS');midiTick();
    if($('midiReturn').checked)returnToKeyboard();
  }
  async function playComposition(bytes){
    if(recording||bankLoading)throw Error('Finish recording or loading the bank first.');
    const song=EK1MIDI.parse(bytes);
    if(!await audio())throw Error('Audio is unavailable.');
    stopTransport(false);
    transport=makeMidiTransport('midi',song,bank,createBus());transport.composing=true;
    loop=setInterval(midiTick,25);reflectButtons();show('SONG BUILDER','PLAY ALONG ON THE KEYS');midiTick();
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
  function favouriteId(value){return value.startsWith('sf-')?bankGeneration+':'+value:value;}
  function refreshFavourites(){
    const toneMenu=$('tone'),value=toneMenu.value,id=favouriteId(value),toggle=$('favouriteVoice'),menu=$('favouriteList');
    toggle.textContent=favourites.has(id)?'REMOVE FAVOURITE':'FAVOURITE CURRENT VOICE';
    toggle.setAttribute('aria-pressed',String(favourites.has(id)));
    toggle.disabled=recording||bankLoading||(!favourites.has(id)&&favourites.size>=64);
    const previous=menu.value;
    const choices=[...favourites.values()].filter(p=>[...toneMenu.options].some(o=>o.value===p.value)&&(!p.value.startsWith('sf-')||p.generation===bankGeneration));
    menu.replaceChildren(new Option(choices.length?'Choose a favourite…':'No favourites yet',''),...choices.map(p=>new Option(p.label,p.value)));
    menu.value=choices.some(p=>p.value===previous)?previous:'';
    menu.disabled=recording||bankLoading||!choices.length;
  }
  function clearBankFavourites(){for(const [id,p] of favourites)if(p.value.startsWith('sf-'))favourites.delete(id);}
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
    if(transport?.type==='demo'&&followDemoVoice&&transport.sampleBank){transport.sampleBank.stopSongChannel(0);for(const n of transport.localLead||[])n.sound.release(ctx.currentTime);transport.localLead=[];}
    updateFM();
    if(!paused)show(voiceLabel(),engine==='fm'?'FM VOICE':engine==='soundfont'?'SOUNDFONT VOICE':'READY TO PLAY');
  }
  function bankMessage(message){$('bankStatus').textContent=message;}
  async function loadBank(file){
    if(!file||bankLoading||recording)return;
    if(file.size>EK1SoundFont.MAX_BYTES){bankMessage('SoundFont is '+(file.size/1048576).toFixed(1)+' MiB. Maximum is '+(EK1SoundFont.MAX_BYTES/1048576)+' MiB.');return;}
    bankLoading=true;reflectButtons();bankMessage('Opening '+file.name+' ('+(file.size/1048576).toFixed(1)+' MiB)… Large banks may take a while.');
    try{
      if(!await audio())throw Error('Web Audio is unavailable.');
      if(transport)stopTransport(false);stopHeld();
      const bytes=await file.arrayBuffer();
      // Keep the previous bank if validation or engine loading fails.
      const next=await EK1SoundFont.create(ctx,master,bytes);
      if(transport)stopTransport(false);stopHeld();
      bank?.destroy();clearBankFavourites();bank=next;bankFileRef=file;bankGeneration++;bankVoiceIndex=0;engine='soundfont';rebuildVoices();updateFM();
      bankMessage(file.name+' | '+bank.presets.length+' melodic voices');
      show('SOUNDFONT READY',bank.selected.name.toUpperCase());
    }catch(e){bankMessage('Could not open SoundFont: '+e.message+(bank?' (previous bank kept)':''));}
    finally{bankLoading=false;reflectButtons();}
  }
  function unloadBank(){
    if(!bank||bankLoading||recording)return;
    stopTransport(false);stopHeld();bank.destroy();clearBankFavourites();bank=null;bankFileRef=null;
    if(engine==='soundfont')engine='classic';
    rebuildVoices();updateFM();
    bankMessage('20 built-in voices. Add a local SoundFont to expand the voice menu.');
    show(voiceLabel(),'READY TO PLAY');
  }
  function buildKeys() {
    const bed = $('keys');
    const upper=$('sharpLabels'),lower=$('naturalLabels');
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
      const rail=document.createElement('span');rail.className='rail-note';rail.textContent=label(midi);rail.style.left=(black?position:position+50/whiteCount)+'%';rail.dataset.note=midi;(black?upper:lower).append(rail);
      const shortcutIndex = midi - SHORTCUT_BASE;
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
  function updateKeyboardMapping(){
    for(const [midi,key] of keyElements){
      const shortcut=SHORTCUTS[midi-SHORTCUT_BASE-keyboardOctave*12];
      key.querySelector('.shortcut').textContent=shortcut?shortcut.toUpperCase():'';
      key.setAttribute('aria-label','Play '+label(midi)+(shortcut?', keyboard '+shortcut:''));
    }
    $('octaveValue').textContent=keyboardOctave===0?'0':(keyboardOctave>0?'+':'')+keyboardOctave;
    $('octaveDown').disabled=keyboardOctave<=-1;$('octaveUp').disabled=keyboardOctave>=1;
  }
  function shiftKeyboardOctave(delta){
    const next=Math.max(-1,Math.min(1,keyboardOctave+delta));if(next===keyboardOctave)return;
    for(const token of [...held.keys(),...pending])if(token.startsWith('hardware-'))release(token);
    keyboardOctave=next;updateKeyboardMapping();
  }
  function setupKeyboardShortcuts() {
    $('octaveDown').addEventListener('click',()=>shiftKeyboardOctave(-1));
    $('octaveUp').addEventListener('click',()=>shiftKeyboardOctave(1));
    updateKeyboardMapping();
    document.addEventListener('keydown', event => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName) || event.target.isContentEditable) return;
      if(event.key===','||event.key==='.'){event.preventDefault();shiftKeyboardOctave(event.key===','?-1:1);return;}
      const index=SHORTCUTS.indexOf(event.key.toLowerCase());if(index<0)return;
      const midi=SHORTCUT_BASE+index+keyboardOctave*12;if(midi<FIRST||midi>LAST)return;
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
    $('favouriteVoice').addEventListener('click',()=>{
      if(recording||bankLoading)return;
      const option=$('tone').selectedOptions[0],value=option.value,id=favouriteId(value);
      if(favourites.has(id))favourites.delete(id);
      else if(favourites.size<64)favourites.set(id,{value,label:option.textContent,generation:bankGeneration});
      refreshFavourites();
    });
    $('favouriteList').addEventListener('change',()=>{
      const value=$('favouriteList').value;
      if(recording||bankLoading||!value)return;
      $('tone').value=value;selectVoice();
    });
    for(const name of ['reverb','chorus'])$('effect-'+name).addEventListener('input',()=>{
      effects[name]=Number($('effect-'+name).value)/100;
      $('effect-'+name+'Value').textContent=Math.round(effects[name]*100)+'%';
      outputStage?.setEffects(effects);
    });
    $('rhythm').addEventListener('change', () => { rhythm = Number($('rhythm').value); if (transport?.type === 'rhythm') beginRhythm(); else show(RHYTHMS[rhythm].name.toUpperCase(), 'RHYTHM SELECTED'); });
    $('tempo').addEventListener('input', () => {
      tempo = Number($('tempo').value);
      $('tempoValue').textContent = tempo + ' BPM';
      if (transport?.type === 'rhythm') transport.bpm = tempo;
    });
    $('backingVolume').addEventListener('input',()=>{backingVolume=Number($('backingVolume').value)/100;$('backingVolumeValue').textContent=Math.round(backingVolume*100)+'%';updateBacking();});
    $('volume').addEventListener('input', () => {
      volume = Number($('volume').value) / 100;
      if (ctx) outputStage.setVolume(volume);
      $('volumeValue').textContent=Math.round(volume*100)+'%';
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
    $('pause').addEventListener('click',togglePause);
    $('midiOverride').addEventListener('change',()=>{midiOverride=$('midiOverride').value;if(transport?.type==='midi'&&!transport.composing)transport.lastOverride=null;reflectButtons();});
    $('demoFollow').addEventListener('change',()=>{followDemoVoice=$('demoFollow').checked;if(transport?.type==='demo'&&transport.sampleBank){transport.sampleBank.stopSongChannel(0);for(const n of transport.localLead||[])n.sound.release(ctx.currentTime);transport.localLead=[];}reflectButtons();});
    $('stop').addEventListener('click', () => {
      if (recording) endRecord();
      stopTransport();
      if (ctx) stopHeld();
      bank?.stopLive();
    });
    $('melodyOff').addEventListener('click', () => {
      melodyOff = !melodyOff; reflectButtons();
      if (transport?.type === 'demo') {
        if(melodyOff&&transport.sampleBank){transport.sampleBank.stopSongChannel(0);for(const n of transport.localLead||[])n.sound.release(ctx.currentTime);transport.localLead=[];clearLamps();}
        demoDisplay(transport,transport.sampleBank?transport.demoBar:Math.min(16,1+Math.floor(transport.step/16)));
      }
    });
    $('accomp').addEventListener('click', () => {
      autoChord = !autoChord;
      if (!autoChord) {heldChord=null;for(const [token,entry] of held)if(entry.chord)release(token);if(transport?.type==='rhythm'){bank?.stopSongChannel(1);bank?.stopSongChannel(2);} }
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
    playComposition,
    get bankName(){return bankFileRef?.name||null;},
    async renderComposition(bytes,rate,progress,signal){
      if(recording||bankLoading)throw Error("Finish recording or loading your bank first.");
      if(transport)stopTransport(false);stopHeld();
      return EK1AudioExport.render(EK1MIDI.parse(bytes),rate,bankFileRef,volume,voice,drum,progress,signal,{...effects});
    },
    stopComposition(){if(transport?.composing)stopTransport();},
    downloadComposition(bytes){downloadMidi(bytes,'EK-1-song.mid');},
    tones: TONES.length,
    rhythms: RHYTHMS.length,
    demos: SONGS.length,
    returnToKeyboard,
    get state() { return { demoLoop:$('demoLoop').checked,demoRepeats:transport?.type==='demo'?(transport.repeatCount||0):0,backingVolume, accompanimentEngine:transport?.type==='rhythm'?(transport.sampleBank?'soundfont':'classic'):null, backingSampleKeys:bank?[1,2,3,9].reduce((sum,c)=>sum+bank.songChannelKeys(c),0):0, sampleChordKeys:bank?.songChannelKeys(1)||0,sampleBassKeys:bank?.songChannelKeys(2)||0,sampleDrumKeys:bank?.songChannelKeys(9)||0,midiLoop:$('midiLoop').checked,midiRepeats:transport?.repeatCount||0,midiOverride, lastMidiOverride:transport?.lastOverride||null, keyboardOctave, paused, followDemoVoice, audioTime:ctx?.currentTime||0, demoLeadEngine:transport?.type==='demo'?(followDemoVoice?engine:(transport.sampleBank?'soundfont':'classic')):null, transport: transport?.type || 'stopped', recording, composing:!!transport?.composing, takeNotes: take.length, demoIndex: demoIndex(), demoEngine:transport?.type==='demo'?(transport.sampleBank?'soundfont':'classic'):null, demoLeadKeys:transport?.type==='demo'&&transport.sampleBank?transport.sampleBank.songChannelKeys(0):0, autoChord, melodyOff, midiNotes: importedMidi?.notes.length || 0, midiChannels: importedMidi?.channels.length || 0, soundfont: !!bank, bankLoading, bankPresets: bank?.presets.length || 0, sampleVoices: bank?.voices || 0, sampleKeys:bank?.songKeys||0, midiPosition:transport?.type==='midi'?Math.max(0,ctx.currentTime-transport.start):0, engine, fmEnabled:engine==='fm', fmIndex, fmPresets:EK1FM.presets.length, fmSettings:{...fmSettings} }; },
    demoEvents: index => SONGS[index]?.events.map(e => ({...e})),
    demoArrangement,
    outputRms(){if(!outputMeter)return 0;const samples=new Float32Array(outputMeter.fftSize);outputMeter.getFloatTimeDomainData(samples);return Math.sqrt(samples.reduce((sum,n)=>sum+n*n,0)/samples.length);},
    outputPeak(){if(!outputMeter)return 0;const samples=new Float32Array(outputMeter.fftSize);outputMeter.getFloatTimeDomainData(samples);return samples.reduce((peak,n)=>Math.max(peak,Math.abs(n)),0);},
    demoBars: index => SONGS[index]?.bars,
    parseBar
  });
})();
