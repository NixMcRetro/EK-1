/* EK-1 Standard MIDI File codec. No external dependencies. */
(function (root) {
  'use strict';
  const MAX_BYTES = 8 * 1024 * 1024, MAX_EVENTS = 250000, MAX_SECONDS = 1800;
  const programs = Object.freeze([0,4,19,21,48,56,61,12,80,89,33,73]);
  function parse(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (bytes.length > MAX_BYTES) throw Error('MIDI files are limited to 8 MB.');
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let p=0, limit=bytes.length, serial=0;
    const need=n=>{if(p+n>limit)throw Error('Truncated MIDI file.');};
    const u8=()=>{need(1);return bytes[p++];};
    const u16=()=>{need(2);const n=v.getUint16(p);p+=2;return n;};
    const u32=()=>{need(4);const n=v.getUint32(p);p+=4;return n;};
    const tag=()=>String.fromCharCode(u8(),u8(),u8(),u8());
    const vlq=()=>{let n=0;for(let i=0;i<4;i++){const b=u8();n=n*128+(b&127);if(!(b&128))return n;}throw Error('Invalid MIDI variable length.');};
    const data=()=>{const n=u8();if(n>127)throw Error('Invalid MIDI data byte.');return n;};
    if(tag()!=='MThd')throw Error('Not a Standard MIDI File.');
    const header=u32();
    if(header<6||header>bytes.length-8)throw Error('Invalid MIDI header.');
    const format=u16(), trackCount=u16(), division=u16();
    if(format>1||!trackCount||trackCount>256||(format===0&&trackCount!==1))throw Error('Only MIDI formats 0 and 1 are supported.');
    if(!division||(division&0x8000))throw Error('SMPTE time division is not supported.');
    p=8+header;
    const events=[], tracks=[];
    let lastTick=0;
    for(let track=0;track<trackCount;track++){
      limit=bytes.length;
      if(tag()!=='MTrk')throw Error('Missing MIDI track.');
      const size=u32(), end=p+size;
      if(end>bytes.length)throw Error('Truncated MIDI track.');
      limit=end;
      let tick=0, running=0, name='', seenEnd=false;
      function add(e){if(serial>=MAX_EVENTS)throw Error('MIDI contains too many events.');events.push({...e,tick,track,serial:serial++});}
      while(p<end){
        tick+=vlq();if(!Number.isSafeInteger(tick))throw Error('Invalid MIDI timing.');
        lastTick=Math.max(lastTick,tick);
        let status=u8();
        if(status<128){if(!running)throw Error('Missing MIDI running status.');p--;status=running;}
        if(status===255){
          running=0;const type=u8(), n=vlq();need(n);
          if(type===0x51&&n===3){const us=bytes[p]*65536+bytes[p+1]*256+bytes[p+2];if(us)add({kind:'tempo',us});}
          if(type===3&&n){name=new TextDecoder().decode(bytes.subarray(p,p+Math.min(n,128))).replace(/[\x00-\x1f\x7f]/g,'');}
          p+=n;
          if(type===0x2f){seenEnd=true;break;}
        }else if(status===0xf0||status===0xf7){
          running=0;const n=vlq();need(n);p+=n;
        }else if(status>=0x80&&status<=0xef){
          running=status;const channel=status&15, type=status>>4, a=data(), b=type===12||type===13?0:data();
          if(type===9&&b)add({kind:'on',channel,key:a,velocity:b});
          else if(type===8||type===9)add({kind:'off',channel,key:a});
          else if(type===12)add({kind:'program',channel,program:a});
          else if(type===11&&[64,120,123].includes(a))add({kind:'control',channel,control:a,value:b});
        }else throw Error('Unsupported MIDI event.');
      }
      if(!seenEnd)throw Error('MIDI track is missing its end marker.');
      tracks.push({index:track,name:name||'Track '+(track+1)});
      p=end;
    }
    events.sort((a,b)=>a.tick-b.tick||a.serial-b.serial);
    const states=Array.from({length:16},()=>({program:0,sustain:false,held:new Map(),deferred:[]}));
    const notes=[];
    let tick=0,time=0,us=500000;
    const advance=to=>{time+=(to-tick)*us/(division*1e6);tick=to;if(time>MAX_SECONDS)throw Error('MIDI playback is limited to 30 minutes.');};
    const finish=(n,at)=>{notes.push({...n,duration:Math.max(.01,at-n.time)});};
    const releaseAll=(ch,at,force=false)=>{
      for(const stack of ch.held.values())for(const n of stack){if(ch.sustain&&!force)ch.deferred.push(n);else finish(n,at);}
      ch.held.clear();
      if(force){for(const n of ch.deferred)finish(n,at);ch.deferred=[];ch.sustain=false;}
    };
    for(const e of events){
      advance(e.tick);
      if(e.kind==='tempo'){us=e.us;continue;}
      const ch=states[e.channel];
      if(e.kind==='program')ch.program=e.program;
      else if(e.kind==='on'){
        if(!ch.held.has(e.key))ch.held.set(e.key,[]);
        ch.held.get(e.key).push({time,key:e.key,velocity:e.velocity,channel:e.channel,program:ch.program,track:e.track});
      }else if(e.kind==='off'){
        const stack=ch.held.get(e.key);
        if(stack?.length){const n=stack.shift();if(!stack.length)ch.held.delete(e.key);if(ch.sustain)ch.deferred.push(n);else finish(n,time);}
      }else if(e.kind==='control'){
        if(e.control===64){
          const down=e.value>=64;
          if(ch.sustain&&!down){for(const n of ch.deferred)finish(n,time);ch.deferred=[];}
          ch.sustain=down;
        }else releaseAll(ch,time,e.control===120);
      }
    }
    advance(lastTick);
    states.forEach(ch=>releaseAll(ch,time,true));
    notes.sort((a,b)=>a.time-b.time||a.channel-b.channel);
    if(!notes.length)throw Error('This MIDI file has no playable notes.');
    const channels=[...new Set(notes.map(n=>n.channel))].sort((a,b)=>a-b);
    return {format,division,tracks,notes,channels,duration:Math.max(time,...notes.slice(-1).map(n=>n.time+n.duration)),bytes:bytes.slice()};
  }
  function toneFor(program) {
    const p=program&127;
    if(p<8)return p<4?0:1;
    if(p<16)return 7;
    if(p<24)return p>=20?3:2;
    if(p<32)return 0;
    if(p<40)return 10;
    if(p<56)return 4;
    if(p<64)return p<58?5:6;
    if(p<80)return 11;
    if(p<88)return 8;
    if(p<104)return 9;
    return 8;
  }
  function drumFor(key) {
    if(key===35||key===36)return 'kick';
    if([37,38,39,40,41,43,45,47,48,50].includes(key))return 'snare';
    return 'hat';
  }
  // Standard format 0, one track; separate channel per EK-1 tone (skip drum channel).
  // Timing uses 480 PPQN and a 120 BPM tempo; the performed seconds are preserved.
  function encodeTake(take) {
    const ev=[{tick:0,order:-2,data:[0xff,0x51,3,7,161,32]}], used=new Set();
    const channelFor=t=>t>=9?t+1:t;
    for(const n of take){
      if(!Number.isFinite(n.t)||n.t<0||!Number.isFinite(n.length)||n.length<=0||!Number.isInteger(n.midi)||n.midi<0||n.midi>127||!Number.isInteger(n.tone)||n.tone<0||n.tone>=programs.length)throw Error('Invalid recorded note.');
      const c=channelFor(n.tone), a=Math.round(n.t*960), b=Math.max(a+1,Math.round((n.t+n.length)*960));
      if(!used.has(c)){used.add(c);ev.push({tick:0,order:-1,data:[0xc0|c,programs[n.tone]]});}
      ev.push({tick:a,order:1,data:[0x90|c,n.midi,96]},{tick:b,order:0,data:[0x80|c,n.midi,0]});
    }
    if(!used.size)throw Error('Record some notes first.');
    ev.sort((a,b)=>a.tick-b.tick||a.order-b.order);
    const track=[];
    const vlq=n=>{if(!Number.isInteger(n)||n<0||n>0xfffffff)throw Error('Invalid MIDI delta.');const out=[n&127];while((n=Math.floor(n/128))>0)out.unshift((n&127)|128);return out;};
    let tick=0;
    for(const e of ev){track.push(...vlq(e.tick-tick),...e.data);tick=e.tick;}
    track.push(0,255,47,0);
    const u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
    return Uint8Array.from([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,...u32(track.length),...track]);
  }
  root.EK1MIDI=Object.freeze({parse,encodeTake,toneFor,drumFor,MAX_BYTES});
})(globalThis);
