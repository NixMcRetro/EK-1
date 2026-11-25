/* SPDX-License-Identifier: GPL-3.0-or-later */
/* EK-1 Song Builder: editable, deterministic arrangements and Standard MIDI File format 1. */
(function(root){
  'use strict';
  const names=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  const styles={Pop:{bpm:112,kick:'1000001010000010',snare:'0000100000001000',hat:'1010101010101010',chord:[0,8],bass:[0,4,8,12]},Rock:{bpm:126,kick:'1000000010001000',snare:'0000100000001000',hat:'1010101010101010',chord:[0,4,8,12],bass:[0,4,8,12]},Disco:{bpm:120,kick:'1000100010001000',snare:'0000100000001000',hat:'0010001000100010',chord:[2,6,10,14],bass:[0,2,4,6,8,10,12,14]},Ska:{bpm:146,kick:'1000001010000010',snare:'0000100000001000',hat:'1011101110111011',chord:[2,6,10,14],bass:[0,4,8,12]},Reggae:{bpm:86,kick:'0000000010000000',snare:'0000000010000000',hat:'0010001000100010',chord:[2,6,10,14],bass:[0,6,10,14]},Electronic:{bpm:132,kick:'1000100010101000',snare:'0000100000001000',hat:'1110111011101110',chord:[0,6,8,14],bass:[0,2,6,8,10,14]}};
  const progressions={Bright:[0,4,5,3],Classic:[0,5,3,4],Blues:[0,0,3,4],Minor:[5,3,0,4]};
  const programs=[[0,'Piano'],[4,'Electric piano'],[16,'Organ'],[24,'Nylon guitar'],[27,'Clean electric guitar'],[29,'Overdrive guitar'],[33,'Electric bass'],[38,'Synth bass'],[48,'Strings'],[56,'Trumpet'],[61,'Brass'],[71,'Clarinet'],[73,'Flute'],[80,'Synth lead'],[89,'Synth pad']];
  const parts=[{name:'Melody',channel:0,program:4},{name:'Chords',channel:1,program:16},{name:'Bass',channel:2,program:33},{name:'Drums',channel:9,program:null}];
  const scale=[0,2,4,5,7,9,11],minor=[false,true,true,false,false,true,true];
  const chordName=c=>names[c.root]+(c.minor?'m':c.dim?'dim':'');
  const chords=key=>scale.map((n,i)=>({root:(key+n)%12,minor:minor[i]&&i!==6,dim:i===6}));
  function triad(c,octave=48){return [octave+c.root,octave+c.root+(c.minor||c.dim?3:4),octave+c.root+(c.dim?6:7)];}
  function legacyMelody(bars,variation=0){
    return bars.map((b,i)=>{
      const t=triad(b.chord,60), phrase=(i+variation)%4;
      let m=[[t[0],t[1],t[2],null],[t[2],null,t[1],t[0]],[t[1],t[2],t[1],t[0]],[t[2],t[1],t[0],null]][phrase];
      if(variation>0 && i<bars.length-1){const q=(i*7+variation*3)%6; if(q===0)m=[t[0],t[2],null,t[1]];else if(q===1)m=[null,t[1],t[2],t[0]];else if(q===2)m=[t[2],t[1],null,t[2]];}
      if(i===bars.length-1)m=[t[0],-1,-1,-1];return m;
    });
  }
  // Older projects without a feel use the original arrangement engine.
  const feels=['Original','Natural','Expressive'];
  const grooves={Pop:[14,4,0,33],Rock:[8,29,27,33],Disco:[0,4,48,33],Ska:[23,61,16,33],Reggae:[30,73,27,33],Electronic:[0,80,89,38]};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function hash(...values){let h=2166136261;for(const v of values){h=Math.imul(h^(v|0),16777619);h^=h>>>13;}return (h>>>0)/4294967296;}
  const motifs=[
    [[0,-1,1,2,2,-1,null,1],[2,-1,1,0,null,1,2,-1],[1,null,2,3,4,-1,2,1],[2,-1,1,null,0,-1,-1,-1]],
    [[null,0,1,-1,2,null,1,2],[1,-1,null,2,3,-1,2,null],[0,1,2,3,null,4,3,2],[2,null,1,0,0,-1,-1,-1]],
    [[0,1,2,-1,null,2,1,-1],[2,1,0,null,1,2,3,-1],[3,-1,2,1,2,-1,4,2],[1,-1,2,1,0,-1,-1,-1]]
  ];
  // Two-bar motifs, a contrasting answer and a cadential phrase.
  function melodyFor(bars,variation=0,style='Pop',key=0,feel='Natural'){
    if(feel==='Original')return legacyMelody(bars,variation);
    const mode=style==='Ska'||style==='Reggae'?1:style==='Electronic'||style==='Disco'?2:0;
    const motif=motifs[(mode+variation)%motifs.length], pcs=scale.map(n=>(key+n)%12);
    let previous=67+key%4, sectionStart=0;
    return bars.map((b,i)=>{
      if(b.section)sectionStart=i;
      const local=i-sectionStart,last=i===bars.length-1||!!bars[i+1]?.section;
      const chord=triad(b.chord,60),root=pcs.indexOf(b.chord.root),phrase=motif[local%4].slice();
      if(local%8===4)phrase[7]=null;
      if(last)phrase.splice(4,4,0,-1,-1,-1);
      return phrase.map((degree,j)=>{
        if(degree===null||degree===-1)return degree;
        const pc=j%2===0?chord[degree%3]%12:pcs[(Math.max(0,root)+degree)%7];
        const choices=Array.from({length:25},(_,n)=>60+n).filter(n=>n%12===pc);
        const target=previous+(degree===3||degree===4?2:0);
        const note=choices.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target)||a-b)[0];
        previous=note;return note;
      });
    });
  }
  function create(key=0,progression='Bright',length=8,style='Pop',feel='Natural'){
    const c=chords(key),p=progressions[progression]||progressions.Bright;
    const bars=Array.from({length},(_,i)=>({chord:{...c[i===length-1?0:i===length-2?4:p[i%p.length]]},melody:[]}));
    melodyFor(bars,0,style,key,feel).forEach((m,i)=>bars[i].melody=m);
    const g=grooves[style],natural=feel!=='Original';
    const instruments=[g[1],g[2],g[3],null],levels=[110,82,98,95],pans=[64,53,64,64];
    return {key,style,feel,bpm:styles[style].bpm,bars,parts:parts.map((p,i)=>({...p,program:natural?instruments[i]:p.program,enabled:true,volume:natural?levels[i]:100,pan:natural?pans[i]:64}))};
  }
  function legacyArrange(song){
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
  function arrange(song){
    const feel=song.feel??'Original';if(feel==='Original')return legacyArrange(song);
    const style=styles[song.style],expressive=feel==='Expressive',intensity=expressive?1.65:1;
    const swing=Math.round(grooves[song.style][0]*intensity),notes=[],ppq=480,end=song.bars.length*1920;
    let voicing=[55,60,64];
    function voiceChord(c){
      const t=triad(c,48),choices=[];
      for(let inv=0;inv<3;inv++){const v=t.map((_,i)=>t[(i+inv)%3]+(i+inv>=3?12:0));
        for(const shift of [-12,0,12]){const a=v.map(n=>n+shift);if(a[0]>=48&&a[2]<=76)choices.push(a);}}
      const distance=a=>a.reduce((sum,n,i)=>sum+Math.abs(n-voicing[i]),0);
      voicing=choices.sort((a,b)=>distance(a)-distance(b)||a[0]-b[0])[0];return voicing;
    }
    function add(part,bar,position,key,length,velocity,accent=0){
      const p=song.parts[part];if(!p.enabled)return;
      const base=bar*1920,delay=position%480===240?swing:0;
      const jitter=position===0?0:Math.round((hash(song.key,bar,position,part,key)-.5)*12*intensity);
      const tick=clamp(base+position+delay+jitter,base,base+1919);
      const duration=clamp(Math.round(length),1,base+1920-tick);
      const v=clamp(Math.round(velocity+accent+(hash(bar,key,position,part,83)-.5)*12*intensity),1,127);
      notes.push({track:part,channel:p.channel,program:p.program??0,key,tick,duration,velocity:v});
    }
    let sectionStart=0;
    song.bars.forEach((bar,i)=>{
      if(bar.section)sectionStart=i;
      const last=i===song.bars.length-1,boundary=!last&&!!song.bars[i+1].section,phrase=(i-sectionStart+1)%4===0;
      const chord=voiceChord(bar.chord),root=36+bar.chord.root,fifth=bar.chord.dim?6:7,nextRoot=last?root:36+song.bars[i+1].chord.root;
      const approach=nextRoot+(nextRoot>root?-1:1);
      const bassPatterns={Pop:[0,0,fifth,0],Rock:[0,0,fifth,12],Disco:[0,12,0,12,fifth,12,0,12],Ska:[0,bar.chord.minor||bar.chord.dim?3:4,fifth,12],Reggae:[0,fifth,12,fifth],Electronic:[0,0,12,fifth,0,12]};
      const step=1920/bar.melody.length;
      bar.melody.forEach((n,b)=>{if(n===null||n===-1)return;let hold=1;while(bar.melody[b+hold]===-1)hold++;add(0,i,b*step,n,Math.round(step*(hold-.19)),88,b*step%480===0?8:-3);});
      const chordSteps=last?[0]:style.chord;
      for(const [j,pos] of chordSteps.entries()){
        const gap=(chordSteps[j+1]??16)-pos,length=last?1800:style.chord[0]===2?(song.style==='Reggae'?125:100):Math.min(gap*120-40,style.chord.length===2?750:340);
        chord.forEach((n,k)=>add(1,i,pos*120+k*(song.style==='Rock'?5:0),n,length,61,pos%4===0?5:0));
      }
      const bassSteps=last?[0]:style.bass;
      for(const [j,pos] of bassSteps.entries()){
        const pattern=bassPatterns[song.style],gap=(bassSteps[j+1]??16)-pos;
        let key=root+pattern[j%pattern.length];
        if(!last&&j===bassSteps.length-1&&(phrase||boundary||song.style==='Ska'||song.style==='Reggae')&&nextRoot!==root)key=approach;
        add(2,i,pos*120,clamp(key,35,59),last?1800:Math.max(70,Math.min(gap*120-38,song.style==='Reggae'?480:310)),83,pos%4===0?6:-3);
      }
      const fill=!last&&(phrase||boundary);
      for(let pos=0;pos<16;pos++){
        if(last&&pos>8)continue;
        if(style.kick[pos]==='1')add(3,i,pos*120,36,90,99,pos%4===0?8:0);
        if(style.snare[pos]==='1'&&!(fill&&pos>=12))add(3,i,pos*120,38,90,91);
        if(style.hat[pos]==='1'&&!(fill&&pos>=14))add(3,i,pos*120,pos===14&&song.style==='Disco'?46:42,65,pos%4===0?65:49,pos%4===2?8:0);
      }
      if(fill){const hits=expressive?[12,13,14,15]:[12,14,15];hits.forEach((pos,j)=>add(3,i,pos*120,[38,47,45,50][j],90,78+j*7));}
      if(last||(bar.section&&i>0))add(3,i,0,49,110,last?87:75);
    });
    // Avoid overlapping retriggers after applying swing and timing variation.
    notes.sort((a,b)=>a.tick-b.tick||a.track-b.track||a.key-b.key);
    const previous=new Map();for(const n of notes){const id=n.channel*128+n.key,p=previous.get(id);if(p)p.duration=Math.min(p.duration,Math.max(1,n.tick-p.tick));previous.set(id,n);}
    return {ppq,notes,end};
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
  root.EK1Composer=Object.freeze({create,arrange,encode,melodyFor,styles,feels,progressions,programs,names,chordName,chords});
})(globalThis);
