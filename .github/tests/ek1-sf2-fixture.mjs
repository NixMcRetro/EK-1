// Original generated SF2 fixture: one looped sine sample, one melodic preset.
// No third-party or copyrighted sound samples.
import {Buffer} from 'node:buffer';
const u16=n=>{const b=Buffer.alloc(2);b.writeUInt16LE(n&65535);return b;};
const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b;};
const ascii=s=>Buffer.from(s,'ascii');
const concat=(...b)=>Buffer.concat(b);
const name=s=>{const b=Buffer.alloc(20);b.write(s,'ascii');return b;};
const chunk=(id,data)=>concat(ascii(id),u32(data.length),data,Buffer.alloc(data.length%2));
const list=(type,...chunks)=>chunk('LIST',concat(ascii(type),...chunks));
const phdr=(s,program,bank,bag)=>concat(name(s),u16(program),u16(bank),u16(bag),Buffer.alloc(12));
const inst=(s,bag)=>concat(name(s),u16(bag));
const bag=(g,m=0)=>concat(u16(g),u16(m));
const gen=(op,v)=>concat(u16(op),u16(v));
const shdr=(s,start,end,loopStart,loopEnd,rate,pitch,type)=>concat(name(s),u32(start),u32(end),u32(loopStart),u32(loopEnd),u32(rate),Buffer.from([pitch,0]),u16(0),u16(type));
export function testSoundFont(){
  const count=4410, pcm=Buffer.alloc((count+46)*2);
  for(let i=0;i<count;i++)pcm.writeInt16LE(Math.round(Math.sin(2*Math.PI*440*i/44100)*10000),i*2);
  const info=list('INFO',chunk('ifil',concat(u16(2),u16(1))),chunk('isng',ascii('EMU8000\0')),chunk('INAM',ascii('EK-1 test bank\0')));
  const sdta=list('sdta',chunk('smpl',pcm));
  const pdta=list('pdta',
    chunk('phdr',concat(phdr('Test Sine',0,0,0),phdr('EOP',0,0,1))),
    chunk('pbag',concat(bag(0),bag(1))),
    chunk('pmod',Buffer.alloc(10)),
    chunk('pgen',concat(gen(41,0),gen(0,0))),
    chunk('inst',concat(inst('Sine',0),inst('EOI',1))),
    chunk('ibag',concat(bag(0),bag(2))),
    chunk('imod',Buffer.alloc(10)),
    chunk('igen',concat(gen(54,1),gen(53,0),gen(0,0))),
    chunk('shdr',concat(shdr('Sine',0,count,0,count,44100,69,1),shdr('EOS',count+46,count+46,count+46,count+46,44100,0,1))));
  return chunk('RIFF',concat(ascii('sfbk'),info,sdta,pdta));
}
