/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {testSoundFont} from './ek1-sf2-fixture.mjs';
import '../../midi.js';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('index.html')).href);
 assert(await page.evaluate(()=>document.querySelector('.instrument').nextElementSibling===document.querySelector('.soundfont-strip')));
 assert(await page.locator('#midiLoop').isChecked());
 assert(await page.locator('#midiReturn').isChecked());
 const bytes=EK1MIDI.encodeTake([{midi:60,t:0,length:.45,tone:0},{midi:64,t:.45,length:.45,tone:10}]);
 await page.locator('#midiFile').setInputFiles({name:'loop.mid',mimeType:'audio/midi',buffer:Buffer.from(bytes)});
 await page.waitForFunction(()=>EK1.state.midiNotes===2);
 for(const sampled of [false,true]){
  if(sampled){await page.locator('#bankFile').setInputFiles({name:'fixture.sf2',mimeType:'application/octet-stream',buffer:testSoundFont()});await page.waitForFunction(()=>EK1.state.soundfont&&!EK1.state.bankLoading);}
  await page.locator('#midiLoop').check();await page.locator('#midiReturn').check();
  await page.locator('#midiOverride').selectOption('all');
  await page.locator('#playMidi').click();
  await page.waitForFunction(()=>EK1.state.transport==='midi'&&document.activeElement===document.querySelector('.keyboard-scroll'));
  assert(await page.evaluate(()=>{const r=document.querySelector('#keys').getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}),'keyboard visible');
  await page.waitForFunction(()=>EK1.state.midiRepeats>=1);
  assert.equal(await page.evaluate(()=>EK1.state.midiOverride),'all');
  await page.locator('#pause').click();await page.waitForFunction(()=>EK1.state.paused);
  const before=await page.evaluate(()=>EK1.state.midiRepeats);await page.waitForTimeout(1400);
  assert.equal(await page.evaluate(()=>EK1.state.midiRepeats),before);
  await page.locator('#pause').click();await page.waitForFunction(()=>!EK1.state.paused);
  await page.waitForFunction(n=>EK1.state.midiRepeats>n,before);
  await page.locator('#midiLoop').uncheck();await page.waitForFunction(()=>EK1.state.transport==='stopped');
  await page.locator('#midiReturn').uncheck();await page.locator('#playMidi').click();
  assert(!(await page.locator('.keyboard-scroll').evaluate(el=>el===document.activeElement)));
  await page.locator('#stop').click();await page.waitForFunction(()=>EK1.state.transport==='stopped'&&EK1.state.sampleKeys===0);
  await page.waitForTimeout(1300);assert.equal(await page.evaluate(()=>EK1.state.transport),'stopped');
 }
 assert.deepEqual(errors,[]);console.log('PASS MIDI looping, override retention, pause/resume, opt-outs, STOP and SoundFont section order');
}finally{await browser.close();}
