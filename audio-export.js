/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Local audio export, using exactly the same SoundFont core as playback. */
(function(root){'use strict';
 const yieldUI=()=>new Promise(r=>setTimeout(r,0));
 async function sampled(song,rate,file,volume,progress,signal){
   const length=Math.ceil((song.duration+2)*rate),left=new Float32Array(length),right=new Float32Array(length);
   const bank=await file.arrayBuffer();signal?.throwIfAborted();EK1SoundFont.validate(bank);
   let error=null;
   const port={onmessage:null,postMessage(messages){for(const m of messages){if(m.type==='soundBankError'||m.type==='coreResponseError')error=Error(String(m.data?.error?.message||m.data?.message||'SoundFont render failed'));}}};
   const core=new EK1LocalProcessor({sampleRate:rate,initialTime:0,processorConfig:{eventsEnabled:false},convolverMode:false},port);
   try{
     const synth=core.synthesizer;await synth.ready;
     core.handleMessage({type:'soundBankManager',channelNumber:-1,data:{type:'addSoundBank',data:{soundBankBuffer:bank,id:'render',bankOffset:0}}});if(error)throw error;
     const outputs=Array.from({length:18},()=>[new Float32Array(128),new Float32Array(128)]),events=EK1MIDI.timeline(song),keys=new Map(),patches=new Map();let index=0;
     for(let pos=0;pos<length;pos+=128){
       while(index<events.length && events[index].time<=pos/rate){const e=events[index++],n=e.note;
         if(e.kind==='control'){synth.controllerChange(e.channel,e.control,e.value);continue;}
         const id=n.channel*128+n.key;
         if(e.kind==='off'){if(keys.get(id)===n){synth.noteOff(n.channel,n.key);keys.delete(id);}continue;}
         if(keys.has(id))synth.noteOff(n.channel,n.key);
         if(n.channel!==9){const patch=[n.bankMSB||0,n.bankLSB||0,n.program].join(':');if(patches.get(n.channel)!==patch){synth.controllerChange(n.channel,0,n.bankMSB||0);synth.controllerChange(n.channel,32,n.bankLSB||0);synth.programChange(n.channel,n.program);patches.set(n.channel,patch);}}
         synth.noteOn(n.channel,n.key,n.velocity);keys.set(id,n);
       }
       for(const pair of outputs)for(const buf of pair)buf.fill(0);core.process([],outputs);
       for(let j=0;j<Math.min(128,length-pos);j++){left[pos+j]=EK1Levels.limit(outputs[0][0][j]*EK1Levels.SAMPLE_GAIN)*volume;right[pos+j]=EK1Levels.limit(outputs[0][1][j]*EK1Levels.SAMPLE_GAIN)*volume;}
       if(pos%32768===0){signal?.throwIfAborted();progress(.08+.82*pos/length);await yieldUI();}
     }
     return {left,right,rate};
   }finally{core.destroy();}
 }
 async function classic(song,rate,volume,voice,drum,progress,signal){
   const Offline=root.OfflineAudioContext||root.webkitOfflineAudioContext;if(!Offline)throw Error('Offline audio rendering is not supported.');
   const context=new Offline(2,Math.ceil((song.duration+2)*rate),rate),master=EK1Levels.create(context,context.destination,volume).input;
   const noise=context.createBuffer(1,rate,rate);let seed=12345;const samples=noise.getChannelData(0);for(let i=0;i<rate;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}
   const channels=Array.from({length:16},()=>{const gain=context.createGain(),pan=context.createStereoPanner?.();gain.gain.value=100/127;if(pan)gain.connect(pan).connect(master);else gain.connect(master);return{gain,pan,volume:100,expression:127};});
   for(const e of song.controls){const c=channels[e.channel];if(e.control===7)c.volume=e.value;if(e.control===11)c.expression=e.value;if(e.control===7||e.control===11)c.gain.gain.setTargetAtTime(c.volume*c.expression/(127*127),e.time,.005);if(e.control===10&&c.pan)c.pan.pan.setTargetAtTime((e.value-64)/64,e.time,.005);}
   for(const n of song.notes){const bus=channels[n.channel].gain;if(n.channel===9)drum(EK1MIDI.drumFor(n.key),n.time,n.velocity/127*.55,bus,context,noise);else voice(n.key,n.time,n.duration,EK1MIDI.toneFor(n.program),n.velocity/127*.23,bus,false,context);}
   signal?.throwIfAborted();progress(.2);const buffer=await context.startRendering();signal?.throwIfAborted();return{left:buffer.getChannelData(0),right:buffer.getChannelData(1),rate};
 }
 async function render(song,rate,file,volume,voice,drum,progress=()=>{},signal){signal?.throwIfAborted();if(![44100,48000].includes(rate))throw Error('Unsupported sample rate.');if(song.duration>300)throw Error('Audio export is limited to five minutes per song.');progress(.01);const audio=await(file?sampled(song,rate,file,volume,progress,signal):classic(song,rate,volume,voice,drum,progress,signal));let peak=0;for(let i=0;i<audio.left.length;i++){peak=Math.max(peak,Math.abs(audio.left[i]),Math.abs(audio.right[i]));}if(!Number.isFinite(peak))throw Error('Invalid audio samples.');if(peak===0)throw Error('The rendered audio is silent. Check track levels and main volume.');if(peak>EK1Levels.CEILING){const gain=EK1Levels.CEILING/peak;for(let i=0;i<audio.left.length;i++){audio.left[i]*=gain;audio.right[i]*=gain;}}progress(.92);return audio;}
 function wav({left,right,rate},bits){const b=bits/8,length=left.length*2*b,buffer=new ArrayBuffer(44+length),v=new DataView(buffer);const text=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};text(0,'RIFF');v.setUint32(4,36+length,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2*b,true);v.setUint16(32,2*b,true);v.setUint16(34,bits,true);text(36,'data');v.setUint32(40,length,true);let at=44;for(let i=0;i<left.length;i++)for(const x of [left[i],right[i]]){const n=Math.round(Math.max(-1,Math.min(1,x))*(bits===16?32767:8388607));if(bits===16)v.setInt16(at,n,true);else{v.setUint8(at,n&255);v.setUint8(at+1,n>>8&255);v.setUint8(at+2,n>>16&255);}at+=b;}return new Blob([buffer],{type:'audio/wav'});}
 async function mp3Supported(rate,bitrate){return !!root.lamejs?.Mp3Encoder&&[44100,48000].includes(rate)&&[128,192,256,320].includes(bitrate);}
 async function mp3(audio,bitrate,progress,signal){if(!await mp3Supported(audio.rate,bitrate))throw Error('MP3 encoder is unavailable. Extract the entire ZIP.');const chunks=[],encoder=new root.lamejs.Mp3Encoder(2,audio.rate,bitrate),convert=x=>Math.round(Math.max(-1,Math.min(1,x))*32767);for(let i=0;i<audio.left.length;i+=1152){const n=Math.min(1152,audio.left.length-i),l=new Int16Array(n),r=new Int16Array(n);for(let j=0;j<n;j++){l[j]=convert(audio.left[i+j]);r[j]=convert(audio.right[i+j]);}const chunk=encoder.encodeBuffer(l,r);if(chunk.length)chunks.push(new Uint8Array(chunk));if(i%(1152*32)===0){signal?.throwIfAborted();progress(.92+.08*i/audio.left.length);await yieldUI();}}const tail=encoder.flush();if(tail.length)chunks.push(new Uint8Array(tail));if(!chunks.length)throw Error('MP3 encoder returned no audio.');return new Blob(chunks,{type:'audio/mpeg'});}
 root.EK1AudioExport={render,wav,mp3,mp3Supported};
})(globalThis);
