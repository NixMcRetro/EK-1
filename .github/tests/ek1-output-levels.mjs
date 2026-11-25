/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {testSoundFont} from './ek1-sf2-fixture.mjs';
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const page=await browser.newPage();await page.goto(pathToFileURL(resolve('index.html')).href);
 assert.equal(await page.locator('#volume').inputValue(),'25');
 const peak=await page.evaluate(async()=>{
  const ctx=new OfflineAudioContext(2,48000,48000),stage=EK1Levels.create(ctx,ctx.destination,1);
  const signal=ctx.createConstantSource();signal.offset.value=10;signal.connect(stage.input);signal.start();
  const buffer=await ctx.startRendering();return buffer.getChannelData(0).reduce((p,x)=>Math.max(p,Math.abs(x)),0);
 });
 assert(peak>0&&peak<=.3501,'output ceiling '+peak);
 await page.locator('#volume').evaluate(el=>{el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const peaks=[];
 async function measure(label){
  let peak=0;
  for(let i=0;i<12;i++){await page.waitForTimeout(50);peak=Math.max(peak,await page.evaluate(()=>EK1.outputPeak()));}
  assert(peak>0.00001&&peak<=.351,label+' peak '+peak);peaks.push([label,peak]);
 }
 await page.locator('#tone').selectOption('0');await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');await measure('Classic');await page.keyboard.up('q');await page.locator('#stop').click();
 await page.locator('#tone').selectOption('fm-2');await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');await measure('FM');await page.keyboard.up('q');await page.locator('#stop').click();
 await page.locator('#bankFile').setInputFiles({name:'fixture.sf2',mimeType:'application/octet-stream',buffer:testSoundFont()});
 await page.waitForFunction(()=>EK1.state.soundfont&&!EK1.state.bankLoading);
 await page.locator('#tone').selectOption('sf-0');await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');await measure('SoundFont');await page.keyboard.up('q');await page.locator('#stop').click();
 await page.locator('#playDemo').click();await measure('Sampled demo');await page.locator('#stop').click();
 await page.locator('#volume').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#tone').selectOption('0');await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');await page.waitForTimeout(600);
 assert((await page.evaluate(()=>EK1.outputPeak()))<.0001,'mute');
 await page.keyboard.up('q');console.log('PASS',name,'ceiling',peak,'engine peaks',peaks);
 }finally{await browser.close();}
}
