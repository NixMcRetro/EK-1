/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Local, optional SoundFont adapter. Library and worklet are bundled at build time. */
(function(root){
  'use strict';
  const MAX_BYTES=512*1024*1024;
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
    if(buffer.byteLength<12||buffer.byteLength>MAX_BYTES)throw Error('SoundFont must be between 12 bytes and 512 MiB.');
    const b=new Uint8Array(buffer,0,12), text=(a,n)=>String.fromCharCode(...b.subarray(a,a+n));
    if(text(0,4)!=='RIFF'||text(8,4)!=='sfbk')throw Error('Choose a valid SF2 or SF3 SoundFont.');
    if(new DataView(buffer).getUint32(4,true)+8!==buffer.byteLength)throw Error('Incomplete SoundFont file.');
  }
  async function create(context,destination,buffer){
    validate(buffer);
    if(!root.EK1LocalAudio)throw Error('Missing local audio files. Extract the entire ZIP before opening index.html.');
    let synth;
    try{
      synth=root.EK1LocalAudio.create(context);
      await deadline(synth.isReady,'SoundFont engine did not start.',60000);
      await deadline(synth.soundBankManager.addSoundBank(buffer,'ek1'),'SoundFont loading timed out. Try a smaller bank.',120000);
      await waitFor(()=>synth.presetList.length>0,'SoundFont has no presets.');
      const presets=synth.presetList.filter(p=>!p.isDrum).map(p=>({name:p.name,program:p.program,bankMSB:p.bankMSB,bankLSB:p.bankLSB}));
      if(!presets.length)throw Error('SoundFont has no melodic presets.');
      // Reserve channel 16 for the player's keyboard; channels 0-15 belong to songs.
      if(synth.midiChannels.length<17)synth.addNewChannel();
      await waitFor(()=>synth.midiChannels.length>=17,'Could not create a play-along channel.');
      const live=16, counts=new Map(), songKeys=new Map(), patches=new Map();
      let selected=presets[0], disposed=false;
      const trim=context.createGain();trim.gain.value=EK1Levels.SAMPLE_GAIN;
      synth.connect(trim);trim.connect(destination);
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
      function stopSongChannel(c){
        if(!Number.isInteger(c)||c<0||c>15||disposed)return;
        synth.controllerChange(c,120,0);
        for(const [id,n] of songKeys)if(n.channel===c)songKeys.delete(id);
        for(const id of counts.keys())if(Math.floor(id/128)===c)counts.delete(id);
      }
      function stopLive(){
        if(disposed)return;
        synth.controllerChange(live,120,0);
        for(let k=0;k<128;k++)counts.delete(live*128+k);
      }
      function stopSong(){
        for(let c=0;c<16;c++){
          stopSongChannel(c);
          synth.controllerChange(c,121,0);
          synth.controllerChange(c,0,0);synth.controllerChange(c,32,0);
          synth.controllerChange(c,7,100);synth.controllerChange(c,10,64);synth.controllerChange(c,11,127);
        }
        songKeys.clear();patches.clear();for(let k of counts.keys())if(k<16*128)counts.delete(k);
      }
      return {
        presets,get selected(){return selected;},get voices(){return synth.voiceCount;},
        select,
        liveOn(key,velocity){on(live,key,velocity);let released=false;return {release(){if(!released){released=true;off(live,key);}}};},
        songOn(n,override=null){
          const id=n.channel*128+n.key;
          // A new note on the same MIDI key replaces the old one. Never defer
          // note-off until every overlapping note has ended.
          if(songKeys.has(id))synth.noteOff(n.channel,n.key);
          if(n.channel!==9){
            const preset=override||n,patch=[preset.bankMSB||0,preset.bankLSB||0,preset.program].join(':');
            if(patches.get(n.channel)!==patch){
              synth.controllerChange(n.channel,0,preset.bankMSB||0);synth.controllerChange(n.channel,32,preset.bankLSB||0);
              synth.programChange(n.channel,preset.program);patches.set(n.channel,patch);
            }
          }
          synth.noteOn(n.channel,n.key,n.velocity);songKeys.set(id,n);
        },
        songOff(n){const id=n.channel*128+n.key;if(songKeys.get(id)===n){synth.noteOff(n.channel,n.key);songKeys.delete(id);}},
        songControl(e){synth.controllerChange(e.channel,e.control,e.value);},
        get songKeys(){return songKeys.size;},
        stopSong,stopSongChannel,stopLive,
        songChannelKeys(c){let n=0;for(const note of songKeys.values())if(note.channel===c)n++;return n;},
        destroy(){if(!disposed){disposed=true;synth.stopAll(true);synth.destroy();trim.disconnect();counts.clear();}}
      };
    }catch(e){if(synth)synth.destroy();throw e;}
  }
  root.EK1SoundFont=Object.freeze({create,validate,MAX_BYTES});
})(globalThis);
