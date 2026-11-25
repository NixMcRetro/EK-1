/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Shared conservative output stage. A digital ceiling is not an SPL guarantee. */
(function(root){'use strict';
 const DEFAULT_VOLUME=.25, CEILING=.35, SAMPLE_GAIN=.5, FM_GAIN=.75;
 const limit=x=>{if(!Number.isFinite(x))return 0;const sign=Math.sign(x),v=Math.abs(x),k=.16;return sign*(v<=k?v:Math.min(CEILING,k+(CEILING-k)*Math.tanh((v-k)/(CEILING-k))));};
 const curve=Float32Array.from({length:4097},(_,i)=>limit(i/2048-1));
 function create(context,destination,volume=DEFAULT_VOLUME,effects={}){
   const input=context.createGain(),compressor=context.createDynamicsCompressor(),limiter=context.createWaveShaper(),output=context.createGain();
   compressor.threshold.value=-24;compressor.knee.value=12;compressor.ratio.value=6;compressor.attack.value=.003;compressor.release.value=.15;
   limiter.curve=curve;output.gain.value=Math.max(0,Math.min(1,volume));
   input.connect(compressor).connect(limiter).connect(output).connect(destination);
   // Small deterministic room impulse and modulated delay. No feedback, no
   // external samples, and both wet paths pass through the existing ceiling.
   const reverb=context.createConvolver(),room=context.createGain(),chorus=context.createGain();
   const length=Math.round(context.sampleRate*.55),impulse=context.createBuffer(2,length,context.sampleRate);
   let seed=0x454b31;
   for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*Math.pow(1-i/length,3)*.45;}data[Math.round(context.sampleRate*.019)]+=.45;}
   reverb.buffer=impulse;room.gain.value=0;chorus.gain.value=0;
   input.connect(reverb).connect(room).connect(compressor);
   const delay=context.createDelay(.05),lfo=context.createOscillator(),depth=context.createGain();
   delay.delayTime.value=.017;lfo.frequency.value=.32;depth.gain.value=.003;
   lfo.connect(depth).connect(delay.delayTime);lfo.start();
   input.connect(delay).connect(chorus).connect(compressor);
   const mix=(v,max)=>Math.max(0,Math.min(1,Number(v)||0))*max;
   room.gain.value=mix(effects.reverb,.25);chorus.gain.value=mix(effects.chorus,.20);
   return {input,output,setVolume(value){output.gain.setTargetAtTime(Math.max(0,Math.min(1,value)),context.currentTime,.015);},
     setEffects(next){room.gain.setTargetAtTime(mix(next.reverb,.25),context.currentTime,.025);chorus.gain.setTargetAtTime(mix(next.chorus,.20),context.currentTime,.025);}};

 }
 root.EK1Levels=Object.freeze({DEFAULT_VOLUME,CEILING,SAMPLE_GAIN,FM_GAIN,limit,create});
})(globalThis);
