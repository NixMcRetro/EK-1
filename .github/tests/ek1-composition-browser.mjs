import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {chromium,firefox,webkit} from 'playwright';
import '../../midi.js';
import '../../composer.js';
const C=globalThis.EK1Composer,M=globalThis.EK1MIDI;
for(const key of [0,2,4,7,9,11])for(const style of Object.keys(C.styles))for(const length of [4,8,16])for(const progression of Object.keys(C.progressions)){
 const song=C.create(key,progression,length,style);
 const parsed=M.parse(C.encode(song));
 assert.equal(parsed.format,1);
 assert.deepEqual(parsed.channels,[0,1,2,9]);
 assert(parsed.notes.length>0);
}
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({acceptDownloads:true});
  page.on('dialog',d=>d.accept());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(resolve('index.html')).href);
  await page.waitForFunction(()=>!!window.EK1Composer&&!!window.EK1AudioExport);
  await page.locator('#composeStyle').selectOption('Ska');
  await page.locator('#composeBars').selectOption('4');
  await page.locator('#composeGenerate').click();
  assert.equal(await page.locator('#composeRows tr').count(),4);
  const download=async id=>{
   const event=page.waitForEvent('download',{timeout:90000});
   await page.locator(id).click();
   const f=await event;
   return readFileSync(await f.path());
  };
  const midi=await download('#composeSave');
  assert.deepEqual(M.parse(midi).channels,[0,1,2,9]);
  const project=await download('#projectSave');
  assert.equal(JSON.parse(project).song.bars.length,4);
  await page.locator('#appendSection').click();
  assert.equal(await page.locator('#composeRows tr').count(),8);
  await page.locator('#projectFile').setInputFiles({name:'test.ek1',mimeType:'application/json',buffer:project});
  await page.waitForFunction(()=>document.querySelector('#composeStatus').textContent.includes('Project opened.'));
  assert.equal(await page.locator('#composeRows tr').count(),4);
  await page.locator('#composePlay').click();
  await page.waitForFunction(()=>EK1.state.composing);
  await page.locator('#stop').click();
  await page.waitForFunction(()=>EK1.state.transport==='stopped');
  await page.locator('#audioRate').selectOption('48000');
  await page.locator('#audioBits').selectOption('24');
  const wav=await download('#exportAudio');
  assert.equal(wav.subarray(0,4).toString(),'RIFF');
  assert.equal(wav.subarray(8,12).toString(),'WAVE');
  assert.equal(wav.readUInt32LE(24),48000);
  assert.equal(wav.readUInt16LE(34),24);
  assert(wav.length>44);
  await page.locator('#audioFormat').selectOption('mp3');
  await page.locator('#mp3Rate').selectOption('320');
  const mp3=await download('#exportAudio');
  assert(mp3.length>1024&&mp3[0]===255&&(mp3[1]&224)===224,'MPEG audio frame required');
  assert.deepEqual(errors,[]);
  console.log('PASS direct file, arrangement, project reopen, WAV and MP3',name);
 }finally{await browser.close();}
}
