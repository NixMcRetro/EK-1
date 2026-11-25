/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {testSoundFont} from './ek1-sf2-fixture.mjs';
import '../../midi.js';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('index.html')).href);
 assert.equal(await page.locator('details[open]').count(),0);
 assert(!(await page.locator('#midiVoiceOptions').isVisible()));
 const events=[];for(let i=0;i<32;i++){events.push({midi:60,t:i*.3,length:.22,tone:0},{midi:64,t:i*.3,length:.22,tone:10});}
 const bytes=EK1MIDI.encodeTake(events);
 await page.locator('#midiFile').setInputFiles({name:'override.mid',mimeType:'audio/midi',buffer:Buffer.from(bytes)});
 await page.waitForFunction(()=>EK1.state.midiNotes===64);
 assert.equal(await page.locator('#midiOverride').inputValue(),'original');
 const channels=await page.locator('#midiOverride option').evaluateAll(els=>els.map(e=>e.value));
 assert.equal(channels.length,4);
 for(const sampled of [false,true]){
  if(sampled){await page.locator('#bankFile').setInputFiles({name:'fixture.sf2',mimeType:'application/octet-stream',buffer:testSoundFont()});await page.waitForFunction(()=>EK1.state.soundfont&&!EK1.state.bankLoading);}
  await page.locator('#midiOverride').selectOption('original');
  await page.locator('#playMidi').click();await page.waitForFunction(()=>EK1.state.midiPosition>.12);
  const before=await page.evaluate(()=>EK1.state.midiPosition);
  assert.equal(await page.evaluate(()=>EK1.state.lastMidiOverride),null);
  await page.locator('#midiOverride').selectOption(channels[2]);
  await page.locator('#tone').selectOption('fm-2');
  await page.waitForFunction(c=>EK1.state.lastMidiOverride?.engine==='fm'&&EK1.state.lastMidiOverride.channel===Number(c),channels[2]);
  await page.locator('#tone').selectOption(sampled?'sf-0':'1');
  await page.waitForFunction(e=>EK1.state.lastMidiOverride?.engine===e,sampled?'soundfont':'classic');
  assert((await page.evaluate(()=>EK1.state.midiPosition))>before);
  await page.locator('#midiOverride').selectOption('all');
  await page.waitForFunction(()=>!!EK1.state.lastMidiOverride);
  await page.locator('#stop').click();assert.equal(await page.evaluate(()=>EK1.state.transport),'stopped');
 }
 await page.locator('.song-builder > summary').click();await page.locator('.sound-options > summary').click();
 for(const width of [1280,768,390]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'layout overflow '+width);}
 assert.deepEqual(errors,[]);console.log('PASS MIDI override, continued position, original default and utility layout');
}finally{await browser.close();}
