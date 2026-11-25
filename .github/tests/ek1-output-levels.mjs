/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {testSoundFont} from './ek1-sf2-fixture.mjs';
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true,...(name==='firefox'?{firefoxUserPrefs:{'media.autoplay.default':0,'media.autoplay.blocking_policy':0}}:{})});
 try{
 const page=await browser.newPage();await page.goto(pathToFileURL(resolve('index.html')).href);
 assert.equal(await page.locator('#volume').inputValue(),'50');
 assert.equal(await page.evaluate(()=>EK1Levels.DEFAULT_VOLUME),.5);
 assert.equal(await page.locator('#volumeValue').innerText(),'50%');
 const peak=await page.evaluate(async()=>{
  const ctx=new OfflineAudioContext(2,48000,48000),stage=EK1Levels.create(ctx,ctx.destination,1);
  const signal=ctx.createConstantSource();signal.offset.value=10;signal.connect(stage.input);signal.start();
  const buffer=await ctx.startRendering();return buffer.getChannelData(0).reduce((p,x)=>Math.max(p,Math.abs(x)),0);
 });
 assert(peak>0&&peak<=.3501,'output ceiling '+peak);
 const linearity=await page.evaluate(()=>Math.max(...Array.from({length:601},(_,i)=>{const x=(i-300)/1000;return Math.abs(EK1Levels.limit(x)-x);})));assert(linearity<1e-7,'limiter linear region');
 // Headless Firefox/WebKit may have no real-time audio sink. Check their
 // rendered stereo samples and output-stage gain, not a silent analyser.
 const levels=await page.evaluate(async()=>{
  const results=[];
  for(const volume of [EK1Levels.DEFAULT_VOLUME,0]){
   const c=new OfflineAudioContext(2,24000,48000),stage=EK1Levels.create(c,c.destination,volume,{reverb:1,chorus:1});
   const a=c.createOscillator(),b=c.createOscillator(),g=c.createGain();a.frequency.value=220;b.frequency.value=440;g.gain.value=5;
   a.connect(g);b.connect(g);g.connect(stage.input);a.start();b.start();const out=await c.startRendering();
   results.push(Math.max(...[0,1].map(ch=>out.getChannelData(ch).reduce((p,n)=>Math.max(p,Math.abs(n)),0))));
  }return results;
 });
 assert(levels[0]>0&&levels[0]<=.1751,'default ceiling');assert.equal(levels[1],0,'offline mute');
 if(name!=='chromium'){console.log('PASS',name,'offline output ceiling, startup gain, mute; live transport covered by smoke tests',levels);continue;}
 // Chromium provides a measurable real-time output in CI.
 await page.locator('#volume').evaluate(el=>{el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const peaks=[];
 async function measure(label){
  let peak=0;
  for(let i=0;i<12;i++){await page.waitForTimeout(50);peak=Math.max(peak,await page.evaluate(()=>EK1.outputPeak()));}
  assert(peak>0.00001&&peak<=.351,label+' peak '+peak);peaks.push([label,peak]);
 }
 await page.locator('#tone').selectOption('0');await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');await measure('Classic');await page.keyboard.up('q');await page.locator('#stop').click();
 await page.locator('#tone').selectOption('fm-2');await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');await measure('FM');await page.keyboard.up('q');await page.locator('#stop').click();
 await page.locator('#tone').selectOption('0');await page.locator('#playDemo').click();await measure('Classic demo');await page.locator('#stop').click();
 await page.locator('#tone').selectOption('fm-2');await page.locator('#playDemo').click();await measure('FM lead demo');await page.locator('#stop').click();
 await page.locator('#bankFile').setInputFiles({name:'fixture.sf2',mimeType:'application/octet-stream',buffer:testSoundFont()});
 await page.waitForFunction(()=>EK1.state.soundfont&&!EK1.state.bankLoading);
 await page.locator('#tone').selectOption('sf-0');await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');await measure('SoundFont');await page.keyboard.up('q');await page.locator('#stop').click();
 await page.locator('#playDemo').click();await measure('Sampled demo');await page.locator('#stop').click();
 await page.locator('#volume').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#tone').selectOption('0');await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');await page.waitForTimeout(600);
 assert((await page.evaluate(()=>EK1.outputPeak()))<.0001,'mute');
 await page.keyboard.up('q');console.log('PASS',name,'ceiling',peak,'engine peaks',peaks);
 }finally{await browser.close();}
}
