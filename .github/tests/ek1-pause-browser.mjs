/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {testSoundFont} from './ek1-sf2-fixture.mjs';
import '../../midi.js';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('index.html')).href);
 async function pauseResume(kind){
  await page.waitForFunction(k=>EK1.state.transport===k,kind);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>EK1.state.paused&&document.querySelector('#displayMain').textContent==='PAUSED');
  const before=await page.evaluate(()=>EK1.state.audioTime);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>EK1.state.audioTime),before,'audio clock frozen');
  assert.equal(await page.evaluate(()=>EK1.state.transport),kind);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>!EK1.state.paused);
  await page.waitForFunction(t=>EK1.state.audioTime>t+.05,before);
  assert.equal(await page.evaluate(()=>EK1.state.transport),kind);
 }
 await page.locator('#playDemo').click();
 await pauseResume('demo');
 assert.equal(await page.evaluate(()=>EK1.state.demoLeadEngine),'classic');
 await page.locator('#tone').selectOption('fm-2');
 assert.equal(await page.evaluate(()=>EK1.state.demoLeadEngine),'fm');
 await page.locator('#stop').click();
 await page.locator('#startRhythm').click();await pauseResume('rhythm');await page.locator('#stop').click();
 await page.locator('#record').click();await page.locator('.keyboard-scroll').focus();await page.keyboard.down('b');await page.waitForTimeout(1500);await page.keyboard.up('b');await page.locator('#record').click();
 await page.locator('#playTake').click();await pauseResume('take');await page.locator('#stop').click();
 const bytes=EK1MIDI.encodeTake([{midi:60,t:0,length:4,tone:0},{midi:60,t:0,length:4,tone:10}]);
 await page.locator('#midiFile').setInputFiles({name:'pause.mid',mimeType:'audio/midi',buffer:Buffer.from(bytes)});
 await page.waitForFunction(()=>EK1.state.midiNotes===2);
 await page.locator('#playMidi').click();await pauseResume('midi');await page.locator('#stop').click();
 await page.locator('.song-builder > summary').click();await page.locator('#composePlay').click();await pauseResume('midi');assert(await page.evaluate(()=>EK1.state.composing));await page.locator('#stop').click();
 await page.locator('#bankFile').setInputFiles({name:'fixture.sf2',mimeType:'application/octet-stream',buffer:testSoundFont()});
 await page.waitForFunction(()=>EK1.state.soundfont&&!EK1.state.bankLoading);
 await page.locator('#playDemo').click();await page.waitForFunction(()=>EK1.state.demoLeadKeys>0);
 assert.equal(await page.evaluate(()=>EK1.state.demoLeadEngine),'soundfont');
 await pauseResume('demo');
 await page.locator('#tone').selectOption('fm-2');assert.equal(await page.evaluate(()=>EK1.state.demoLeadEngine),'fm');
 await page.waitForFunction(()=>EK1.state.demoLeadKeys===0);
 await page.locator('.sound-options > summary').click();await page.locator('#demoFollow').uncheck();
 await page.waitForFunction(()=>EK1.state.demoLeadKeys>0);
 await page.locator('#pause').click();await page.waitForFunction(()=>EK1.state.paused);
 await page.locator('#stop').click();await page.waitForFunction(()=>!EK1.state.paused&&EK1.state.sampleKeys===0&&EK1.state.transport==='stopped');
 assert.deepEqual(errors,[]);
 console.log('PASS all playback modes pause/resume, sampled demo lead switching, original lead, stop while paused');
}finally{await browser.close();}
