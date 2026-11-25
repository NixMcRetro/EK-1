/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {testSoundFont} from './ek1-sf2-fixture.mjs';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('index.html')).href);
 assert.equal(await page.locator('#backingVolume').inputValue(),'80');
 assert.equal(await page.evaluate(()=>EK1Levels.SAMPLE_GAIN),1);
 async function level(){
   let sum=0,peak=0;for(let i=0;i<24;i++){await page.waitForTimeout(50);const a=await page.evaluate(()=>[EK1.outputRms(),EK1.outputPeak()]);sum+=a[0]**2;peak=Math.max(peak,a[1]);}
   assert(peak<=.1752,'default output ceiling '+peak);return {rms:Math.sqrt(sum/24),peak};
 }
 async function setBacking(v){await page.locator('#backingVolume').evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},v);}
 for(const sampled of [false,true]){
   if(sampled){await page.locator('#bankFile').setInputFiles({name:'fixture.sf2',mimeType:'application/octet-stream',buffer:testSoundFont()});await page.waitForFunction(()=>EK1.state.soundfont&&!EK1.state.bankLoading);}
   await setBacking(80);
   await page.locator('#startRhythm').click();
   await page.waitForFunction(e=>EK1.state.accompanimentEngine===e,sampled?'soundfont':'classic');
   await page.locator('#accomp').click();
   await page.locator('.keyboard-scroll').focus();await page.keyboard.down('z');await page.waitForTimeout(220);await page.keyboard.up('z');
   if(sampled)await page.waitForFunction(()=>EK1.state.sampleChordKeys>0&&EK1.state.sampleBassKeys>0);
   const normal=await level();assert(normal.rms>.0001);
   await setBacking(0);await page.waitForTimeout(650);const muted=await level();assert(muted.rms<normal.rms*.12,'backing mute '+JSON.stringify({normal,muted}));
   await page.locator('.keyboard-scroll').focus();await page.keyboard.down('q');const live=await level();await page.keyboard.up('q');assert(live.rms>.0001,'melody unaffected by backing mute');
   await setBacking(80);await page.locator('#pause').click();await page.waitForFunction(()=>EK1.state.paused);await page.locator('#pause').click();await page.waitForFunction(()=>!EK1.state.paused);
   await page.locator('#stop').click();await page.waitForFunction(()=>EK1.state.sampleKeys===0&&EK1.state.transport==='stopped');
   await page.locator('#accomp').click();
   await page.locator('#tone').selectOption(sampled?'sf-0':'0');
   await page.locator('#playDemo').click();const demo=await level();assert(demo.rms>.0001);
   await page.locator('#melodyOff').click();await setBacking(0);await page.waitForTimeout(700);const quiet=await level();assert(quiet.rms<demo.rms*.12,'demo backing mute '+JSON.stringify({demo,quiet}));
   await page.locator('#stop').click();await page.locator('#melodyOff').click();
   console.log(sampled?'SoundFont':'Classic',JSON.stringify({normal,muted,live,demo,quiet}));
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
