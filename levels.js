/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Shared conservative output stage. A digital ceiling is not an SPL guarantee. */
(function(root){'use strict';
 const DEFAULT_VOLUME=.25, CEILING=.35, SAMPLE_GAIN=.5, FM_GAIN=.75;
 const limit=x=>{if(!Number.isFinite(x))return 0;const sign=Math.sign(x),v=Math.abs(x),k=.16;return sign*(v<=k?v:Math.min(CEILING,k+(CEILING-k)*Math.tanh((v-k)/(CEILING-k))));};
 const curve=Float32Array.from({length:4097},(_,i)=>limit(i/2048-1));
 function create(context,destination,volume=DEFAULT_VOLUME){
   const input=context.createGain(),compressor=context.createDynamicsCompressor(),limiter=context.createWaveShaper(),output=context.createGain();
   compressor.threshold.value=-24;compressor.knee.value=12;compressor.ratio.value=6;compressor.attack.value=.003;compressor.release.value=.15;
   limiter.curve=curve;output.gain.value=Math.max(0,Math.min(1,volume));
   input.connect(compressor).connect(limiter).connect(output).connect(destination);
   return {input,output,setVolume(value){output.gain.setTargetAtTime(Math.max(0,Math.min(1,value)),context.currentTime,.015);}};
 }
 root.EK1Levels=Object.freeze({DEFAULT_VOLUME,CEILING,SAMPLE_GAIN,FM_GAIN,limit,create});
})(globalThis);
