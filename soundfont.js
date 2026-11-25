/* Local, optional SoundFont adapter. Library and worklet are bundled at build time. */
(function(root){
  'use strict';
  const MAX_BYTES=128*1024*1024;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function waitFor(predicate,message){
    for(let i=0;i<300;i++){if(predicate())return;await pause(20);}
    throw Error(message);
  }
  async function deadline(promise,message,ms=15000){
    let timer;
    try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms);})]);}
    finally{clearTimeout(timer);}
  }
  function validate(buffer){
    if(buffer.byteLength<12||buffer.byteLength>MAX_BYTES)throw Error('SoundFont must be between 12 bytes and 128 MB.');
    const b=new Uint8Array(buffer,0,12), text=(a,n)=>String.fromCharCode(...b.subarray(a,a+n));
    if(text(0,4)!=='RIFF'||text(8,4)!=='sfbk')throw Error('Choose a valid SF2 or SF3 SoundFont.');
    if(new DataView(buffer).getUint32(4,true)+8!==buffer.byteLength)throw Error('Incomplete SoundFont file.');
  }
  let modulePromise;
  const loadedContexts=new WeakSet();
  async function create(context,destination,buffer){
    validate(buffer);
    if(!context.audioWorklet)throw Error('SoundFonts need HTTPS or a local web server.');
    if(!modulePromise)modulePromise=import('./vendor/spessasynth.mjs').catch(e=>{modulePromise=null;throw Error('SoundFont engine not built. Run npm install and npm run build.');});
    const {WorkletSynthesizer}=await modulePromise;
    if(!loadedContexts.has(context)){
      await context.audioWorklet.addModule('./vendor/spessasynth_processor.min.js');
      loadedContexts.add(context);
    }
    let synth;
    try{
      synth=new WorkletSynthesizer(context);
      await deadline(synth.soundBankManager.addSoundBank(buffer,'ek1'),'SoundFont loading timed out.');
      await deadline(synth.isReady,'SoundFont engine did not start.');
      await waitFor(()=>synth.presetList.length>0,'SoundFont has no presets.');
      const presets=synth.presetList.filter(p=>!p.isDrum).map(p=>({name:p.name,program:p.program,bankMSB:p.bankMSB,bankLSB:p.bankLSB}));
      if(!presets.length)throw Error('SoundFont has no melodic presets.');
      // Reserve channel 16 for the player's keyboard; channels 0-15 belong to songs.
      if(synth.midiChannels.length<17)synth.addNewChannel();
      await waitFor(()=>synth.midiChannels.length>=17,'Could not create a play-along channel.');
      const live=16, counts=new Map();
      let selected=presets[0], disposed=false;
      synth.connect(destination);
      function select(p){
        synth.controllerChange(live,120,0);for(let k=0;k<128;k++)counts.delete(live*128+k);selected=p;
        synth.controllerChange(live,0,p.bankMSB);synth.controllerChange(live,32,p.bankLSB);synth.programChange(live,p.program);
      }
      select(selected);
      function on(channel,key,velocity,program){
        if(disposed)return;
        if(program!==undefined)synth.programChange(channel,program);
        synth.noteOn(channel,key,velocity);
        const id=channel*128+key;counts.set(id,(counts.get(id)||0)+1);
      }
      function off(channel,key){
        if(disposed)return;
        const id=channel*128+key,n=counts.get(id)||0;
        if(n<=1){counts.delete(id);if(n)synth.noteOff(channel,key);}
        else counts.set(id,n-1);
      }
      function stopSong(){
        for(let c=0;c<16;c++){synth.controllerChange(c,120,0);synth.controllerChange(c,0,0);synth.controllerChange(c,32,0);for(let k=0;k<128;k++)counts.delete(c*128+k);}
      }
      return {
        presets,get selected(){return selected;},get voices(){return synth.voiceCount;},
        select,
        liveOn(key,velocity){on(live,key,velocity);let released=false;return {release(){if(!released){released=true;off(live,key);}}};},
        songOn(n){if(n.channel!==9){synth.controllerChange(n.channel,0,n.bankMSB||0);synth.controllerChange(n.channel,32,n.bankLSB||0);}on(n.channel,n.key,n.velocity,n.channel===9?undefined:n.program);},
        songOff(n){off(n.channel,n.key);},
        stopSong,
        destroy(){if(!disposed){disposed=true;synth.stopAll(true);synth.destroy();counts.clear();}}
      };
    }catch(e){if(synth)synth.destroy();throw e;}
  }
  root.EK1SoundFont=Object.freeze({create,validate,MAX_BYTES});
})(globalThis);
