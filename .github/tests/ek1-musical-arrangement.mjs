/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import '../../midi.js';
import '../../composer.js';
const C=globalThis.EK1Composer,M=globalThis.EK1MIDI;
const hash=bytes=>{let h=2166136261;for(const b of bytes)h=Math.imul(h^b,16777619);return (h>>>0).toString(16);};
for(const [style,expected] of [["Pop","17aba5e4"],["Rock","2ab857c5"],["Disco","655f157a"],["Ska","5b6cb013"],["Reggae","dbd9772a"],["Electronic","289fc5ad"]]){
 const legacy=C.create(0,'Bright',8,style,'Original');delete legacy.feel;
 assert.equal(hash(C.encode(legacy)),expected,'v0.9.1 MIDI compatibility: '+style);
}
let count=0;
for(let key=0;key<12;key++)for(const style of Object.keys(C.styles))for(const length of [4,8,16])for(const progression of Object.keys(C.progressions))for(const feel of C.feels){
 const song=C.create(key,progression,length,style,feel),a=C.arrange(song);
 assert.deepEqual(C.arrange(song),a,'deterministic notes');
 const bytes=C.encode(song);assert.deepEqual(C.encode(JSON.parse(JSON.stringify(song))),bytes);
 const parsed=M.parse(bytes);assert.deepEqual(parsed.channels,[0,1,2,9]);
 assert(a.notes.every(n=>n.tick>=0&&n.duration>0&&n.tick+n.duration<=a.end&&n.key>=0&&n.key<=127&&n.velocity>=1&&n.velocity<=127));
 if(feel!=='Original'){
  assert.equal(song.bars[0].melody.length,8);
  const natural=C.arrange({...song,feel:'Natural'}),expressive=C.arrange({...song,feel:'Expressive'});
  assert.notDeepEqual(natural,expressive);
  const off=C.arrange({...song,parts:song.parts.map((p,i)=>({...p,enabled:i!==0}))});
  assert.deepEqual(off.notes,a.notes.filter(n=>n.track!==0),'muting does not change accompaniment');
 }
 count++;
}
const ska=C.create(0,'Bright',8,'Ska','Natural');
assert(ska.parts[0].program===61&&ska.parts[1].program===16);
assert(C.arrange(ska).notes.some(n=>n.channel===9&&n.key===47),'phrase fill');
console.log('PASS',count,'arrangements, legacy fixture bytes, stable feel, track mute and fills');
