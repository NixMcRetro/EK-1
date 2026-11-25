import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import {testSoundFont} from './ek1-sf2-fixture.mjs';
import '../../midi.js';
const root=process.cwd();
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!path.startsWith(root+'/'))throw Error('Invalid path');
  res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');
  res.end(await readFile(path));
 }catch{res.statusCode=404;res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
 await page.locator('#playDemo').click();await page.locator('#stop').click();
 const fixture=testSoundFont();
 await page.locator('#bankFile').setInputFiles({name:'test.sf2',mimeType:'application/octet-stream',buffer:fixture});
 await page.waitForFunction(()=>!EK1.state.bankLoading);
 assert(await page.evaluate(()=>EK1.state.soundfont),await page.locator('#bankStatus').innerText());
 assert.equal(await page.evaluate(()=>EK1.state.bankPresets),1);
 assert.equal(await page.evaluate(()=>EK1.state.engine),'soundfont');
 assert.equal(await page.locator('#tone option').count(),21);
 await page.locator('#tone').selectOption('sf-0');
 await page.locator('#keys [data-midi="69"]').focus();
 await page.keyboard.down('z');
 await page.waitForFunction(()=>EK1.state.sampleVoices>0);
 await page.keyboard.up('z');
 const bytes=EK1MIDI.encodeTake([{midi:69,t:0,length:2,tone:0}]);
 await page.locator('#midiFile').setInputFiles({name:'test.mid',mimeType:'audio/midi',buffer:Buffer.from(bytes)});
 await page.waitForFunction(()=>EK1.state.midiNotes===1);
 await page.locator('#tone').selectOption('fm-2');
 assert.equal(await page.evaluate(()=>EK1.state.engine),'fm');
 assert(await page.evaluate(()=>EK1.state.soundfont),'Bank must stay loaded in FM mode');
 await page.locator('#playMidi').click();
 await page.waitForFunction(()=>EK1.state.transport==='midi'&&EK1.state.sampleVoices>0);
 await page.locator('#stop').click();
 await page.waitForFunction(()=>EK1.state.sampleVoices===0);
 await page.locator('#tone').selectOption('sf-0');
 assert.equal(await page.evaluate(()=>EK1.state.engine),'soundfont');
 await page.locator('#bankFile').setInputFiles({name:'broken.sf2',mimeType:'application/octet-stream',buffer:Buffer.from([1,2,3])});
 await page.waitForFunction(()=>document.querySelector('#bankStatus').textContent.includes('Could not open'));
 assert(await page.evaluate(()=>EK1.state.soundfont));
 await page.locator('#closeBank').click();
 assert.equal(await page.evaluate(()=>EK1.state.soundfont),false);
 assert.equal(await page.evaluate(()=>EK1.state.engine),'classic');
 assert.equal(await page.locator('#tone option').count(),20);
 assert.deepEqual(errors,[]);
 console.log('PASS actual SoundFont loading, live sample voice, imported MIDI, stop, invalid file and fallback');
}finally{await browser.close();await new Promise(r=>server.close(r));}
