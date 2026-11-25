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
 assert(await page.locator('#demoLoop').isChecked());
 for(let i=0;i<5;i++){
   const score=await page.evaluate(i=>EK1.demoArrangement(i),i);
   assert(score.notes.every(n=>n.time>=0&&n.time+n.duration<=score.duration+1e-8),'All note-offs fit demo period '+i);
   assert(score.notes.some(n=>n.time===0),'First beat present '+i);
 }
 for(const sampled of [false,true]){
   if(sampled){await page.locator('#bankFile').setInputFiles({name:'fixture.sf2',mimeType:'application/octet-stream',buffer:testSoundFont()});await page.waitForFunction(()=>EK1.state.soundfont&&!EK1.state.bankLoading);}
   await page.locator('#demoLoop').check();
   await page.locator('#demoSong').selectOption('3');
   await page.locator('#tone').selectOption(sampled?'sf-0':'fm-2');
   await page.locator('#backingVolume').evaluate(el=>{el.value='65';el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.locator('#melodyOff').click();
   await page.locator('#playDemo').click();
   await page.waitForFunction(()=>EK1.state.transport==='demo');
   assert.equal(await page.evaluate(()=>EK1.state.demoRepeats),0);
   const first=await page.evaluate(()=>({start:EK1.state.demoCycleStart,period:EK1.demoArrangement(3).duration}));
   await page.waitForFunction(()=>EK1.state.demoRepeats===1,{},{timeout:45000});
   const state=await page.evaluate(()=>EK1.state);
   assert(Math.abs(state.demoCycleStart-first.start-first.period)<1e-7,'No added delay at musical boundary');
   assert.equal(state.demoIndex,3);assert.equal(state.demoEngine,sampled?'soundfont':'classic');
   assert.equal(state.engine,sampled?'soundfont':'fm');assert.equal(state.backingVolume,.65);assert(state.melodyOff);
   if(sampled)assert.equal(state.demoLeadKeys,0);
   await page.locator('#pause').click();await page.waitForFunction(()=>EK1.state.paused);
   await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>EK1.state.demoRepeats),1);
   await page.locator('#pause').click();await page.waitForFunction(()=>!EK1.state.paused);
   if(sampled){
     await page.locator('#demoLoop').uncheck();
     await page.waitForFunction(()=>EK1.state.transport==='stopped',{},{timeout:45000});
     assert.equal(await page.locator('#displayMain').innerText(),'DEMO FINISHED');
   }else{
     await page.locator('#stop').click();
     await page.waitForFunction(()=>EK1.state.transport==='stopped');
   }
   assert.equal(await page.evaluate(()=>EK1.state.sampleKeys),0);
   await page.locator('#melodyOff').click();
   console.log('PASS',sampled?'SoundFont':'Classic','demo repeats, settings preserved, pause and completion/stop');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
