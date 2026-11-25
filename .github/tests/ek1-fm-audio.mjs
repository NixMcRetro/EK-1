import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';
for(const [name,type] of Object.entries({chromium,firefox,webkit})){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.goto(pathToFileURL(resolve('index.html')).href);
  const result=await page.evaluate(async()=>{
    const rate=44100;
    async function render(index,brightness){
      const ctx=new OfflineAudioContext(1,rate*3,rate);
      EK1FM.voice(ctx,ctx.destination,69,.025,.65,index,{brightness,attack:1,release:1},.4);
      const buffer=(await ctx.startRendering()).getChannelData(0);
      const rms=(a,b)=>Math.sqrt(buffer.subarray(Math.floor(a*rate),Math.floor(b*rate)).reduce((sum,x)=>sum+x*x,0)/Math.floor((b-a)*rate));
      return {buffer,rms:rms(.08,.55),tail:rms(2.1,2.9),finite:buffer.every(Number.isFinite),peak:buffer.reduce((p,v)=>Math.max(p,Math.abs(v)),0)};
    }
    const stats=[];
    for(let i=0;i<EK1FM.presets.length;i++){
      const r=await render(i,1);
      stats.push({name:EK1FM.presets[i].name,rms:r.rms,tail:r.tail,finite:r.finite,peak:r.peak});
    }
    const dull=await render(0,0),bright=await render(0,1.6);
    let difference=0;for(let i=0;i<dull.buffer.length;i++)difference+=(dull.buffer[i]-bright.buffer[i])**2;
    return {stats,difference:Math.sqrt(difference/dull.buffer.length)};
  });
  for(const s of result.stats){
    assert(s.finite && s.rms>.003 && s.peak<.99 && s.tail<.0001,JSON.stringify(s));
  }
  assert(result.difference>.005,'Brightness must change the waveform');
  console.log('PASS real offline FM audio',name,JSON.stringify(result));
 }finally{await browser.close();}
}
