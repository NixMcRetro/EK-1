/* SPDX-License-Identifier: GPL-3.0-or-later */
/* EK-1 Song Builder: editable, deterministic arrangements and Standard MIDI File format 1. */
(function(root){
  'use strict';
  const names=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  const styles={Pop:{bpm:112,kick:'1000001010000010',snare:'0000100000001000',hat:'1010101010101010',chord:[0,8],bass:[0,4,8,12]},Rock:{bpm:126,kick:'1000000010001000',snare:'0000100000001000',hat:'1010101010101010',chord:[0,4,8,12],bass:[0,4,8,12]},Disco:{bpm:120,kick:'1000100010001000',snare:'0000100000001000',hat:'0010001000100010',chord:[2,6,10,14],bass:[0,2,4,6,8,10,12,14]},Ska:{bpm:146,kick:'1000001010000010',snare:'0000100000001000',hat:'1011101110111011',chord:[2,6,10,14],bass:[0,4,8,12]},Reggae:{bpm:86,kick:'0000000010000000',snare:'0000000010000000',hat:'0010001000100010',chord:[2,6,10,14],bass:[0,6,10,14]},Electronic:{bpm:132,kick:'1000100010101000',snare:'0000100000001000',hat:'1110111011101110',chord:[0,6,8,14],bass:[0,2,6,8,10,14]}};
  const progressions={Bright:[0,4,5,3],Classic:[0,5,3,4],Blues:[0,0,3,4],Minor:[5,3,0,4]};
  const programs=[[0,'Piano'],[4,'Electric piano'],[16,'Organ'],[24,'Nylon guitar'],[33,'Electric bass'],[38,'Synth bass'],[48,'Strings'],[56,'Trumpet'],[61,'Brass'],[71,'Clarinet'],[73,'Flute'],[80,'Synth lead'],[89,'Synth pad']];
  const parts=[{name:'Melody',channel:0,program:4},{name:'Chords',channel:1,program:16},{name:'Bass',channel:2,program:33},{name:'Drums',channel:9,program:null}];
  const scale=[0,2,4,5,7,9,11],minor=[false,true,true,false,false,true,true];
  const chordName=c=>names[c.root]+(c.minor?'m':c.dim?'dim':'');
  const chords=key=>scale.map((n,i)=>({root:(key+n)%12,minor:minor[i]&&i!==6,dim:i===6}));
  function triad(c,octave=48){return [octave+c.root,octave+c.root+(c.minor||c.dim?3:4),octave+c.root+(c.dim?6:7)];}
  function melodyFor(bars,variation=0){
    return bars.map((b,i)=>{
      const t=triad(b.chord,60), phrase=(i+variation)%4;
      let m=[[t[0],t[1],t[2],null],[t[2],null,t[1],t[0]],[t[1],t[2],t[1],t[0]],[t[2],t[1],t[0],null]][phrase];
      if(variation>0 && i<bars.length-1){const q=(i*7+variation*3)%6; if(q===0)m=[t[0],t[2],null,t[1]];else if(q===1)m=[null,t[1],t[2],t[0]];else if(q===2)m=[t[2],t[1],null,t[2]];}
      if(i===bars.length-1)m=[t[0],-1,-1,-1];return m;
    });
  }
  function create(key=0,progression='Bright',length=8,style='Pop'){
    const c=chords(key),p=progressions[progression]||progressions.Bright;
    const bars=Array.from({length},(_,i)=>({chord:{...c[i===length-1?0:i===length-2?4:p[i%p.length]]},melody:[]}));
    melodyFor(bars).forEach((m,i)=>bars[i].melody=m);
    return {key,style,bpm:styles[style].bpm,bars,parts:parts.map(p=>({...p,enabled:true,volume:100,pan:64}))};
  }
  function arrange(song){
    const style=styles[song.style], ppq=480, notes=[];
    const add=(part,tick,key,length,velocity)=>{const p=song.parts[part];if(p.enabled)notes.push({track:part,channel:p.channel,program:p.program??0,key,tick,duration:length,velocity});};
    song.bars.forEach((bar,i)=>{
      const base=i*1920,t=triad(bar.chord), last=i===song.bars.length-1;
      bar.melody.forEach((n,b)=>{if(n===null||n===-1)return;const step=1920/bar.melody.length;let hold=1;while(bar.melody[b+hold]===-1)hold++;add(0,base+b*step,n,Math.round(step*(hold-.15)),94);});
      for(const step of last?[0]:style.chord)for(const n of t)add(1,base+step*120,n,last?1800:style.chord.length===2?750:style.chord[0]===2?100:300,64);
      for(const [j,step] of (last?[0]:style.bass).entries())add(2,base+step*120,36+bar.chord.root+(j%4===2?(bar.chord.dim?6:7):0),last?1800:style.bass.length>4?190:330,84);
      for(let step=0;step<16;step++){
        if(last&&step>8)continue;
        if(style.kick[step]==='1')add(3,base+step*120,36,90,105);
        if(style.snare[step]==='1')add(3,base+step*120,38,90,88);
        if(style.hat[step]==='1')add(3,base+step*120,42,65,step%4===0?62:47);
      }
    });
    return {ppq,notes,end:song.bars.length*1920};
  }
  function encode(song){
    const {notes,end}=arrange(song);if(!notes.length)throw Error('Enable a part containing notes first.');
    const u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
    const vlq=n=>{const out=[n&127];while((n=Math.floor(n/128))>0)out.unshift((n&127)|128);return out;};
    const text=s=>[...new TextEncoder().encode(s)];
    const track=(events)=>{let tick=0;const data=[];events.sort((a,b)=>a.tick-b.tick||a.order-b.order);for(const e of events){data.push(...vlq(e.tick-tick),...e.bytes);tick=e.tick;}data.push(...vlq(Math.max(0,end-tick)),255,47,0);return [77,84,114,107,...u32(data.length),...data];};
    const us=Math.round(60000000/song.bpm);
    const tracks=[track([{tick:0,order:0,bytes:[255,81,3,us>>16&255,us>>8&255,us&255]},{tick:0,order:1,bytes:[255,88,4,4,2,24,8]}])];
    song.parts.forEach((p,i)=>{if(!p.enabled)return;const n=notes.filter(n=>n.track===i);if(!n.length)return;const name=text(p.name),e=[{tick:0,order:-2,bytes:[255,3,name.length,...name]}];if(p.program!==null)e.push({tick:0,order:-1,bytes:[192|p.channel,p.program]});e.push({tick:0,order:-1,bytes:[176|p.channel,7,p.volume??100]},{tick:0,order:-1,bytes:[176|p.channel,10,p.pan??64]});for(const note of n){e.push({tick:note.tick,order:1,bytes:[144|p.channel,note.key,note.velocity]},{tick:note.tick+note.duration,order:0,bytes:[128|p.channel,note.key,0]});}tracks.push(track(e));});
    return Uint8Array.from([77,84,104,100,0,0,0,6,0,1,0,tracks.length,1,224,...tracks.flat()]);
  }
  root.EK1Composer=Object.freeze({create,arrange,encode,melodyFor,styles,progressions,programs,names,chordName,chords});
})(globalThis);
