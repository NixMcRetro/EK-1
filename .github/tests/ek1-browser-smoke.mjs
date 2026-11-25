// Electronic Keyboard (Model EK-1) v0.9.2 browser regression.
// Run with: node .github/tests/ek1-browser-smoke.mjs
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {mkdirSync, readFileSync} from 'node:fs';
import '../../midi.js';
import {chromium, firefox, webkit} from 'playwright';

const url = pathToFileURL(resolve('index.html')).href;
mkdirSync('artifacts', {recursive:true});
for (const [name, browserType] of Object.entries({chromium, firefox, webkit})) {
  const browser = await browserType.launch({headless:true});
  try {
    for (const width of (name === 'chromium' ? [1280, 390] : [1024])) {
      const page = await browser.newPage({viewport:{width, height:860}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url, {waitUntil:'load'});
      await page.waitForFunction(() => !!window.EK1);
      assert.match(await page.title(),/Electronic Keyboard \(Model EK-1\) v0\.9\.2/);
      const info = await page.evaluate(() => ({
        version: EK1.version,
        tones: EK1.tones,
        rhythms: EK1.rhythms,
        demos: EK1.demos,
        bars: Array.from({length:EK1.demos}, (_,i) => EK1.demoBars(i)),
        events: Array.from({length:EK1.demos}, (_,i) => EK1.demoEvents(i))
      }));
      assert.equal(info.version, '0.9.2');
      assert.deepEqual([info.tones,info.rhythms,info.demos], [12,6,5]);
      assert.deepEqual(info.bars, [16,16,16,16,16]);
      for (const [i,events] of info.events.entries()) {
        assert(events.length >= 60, 'Demo ' + i + ' is not a complete arrangement');
        assert(events.every(e => e.step >= 0 && e.step < 256 && e.midi >= 48 && e.midi <= 96 && e.length > 0));
      }
      // A cohesive instrument chassis with printed tone/rhythm guides, not generic cards.
      assert.equal(await page.locator('.speaker-grille').count(), 2);
      assert.equal(await page.locator('.display-well').count(), 1);
      assert.equal(await page.locator('.printed-bank').count(), 2);
      assert.equal(await page.locator('.instrument .control-group').count(), 3);
      assert.equal(await page.locator('#keys .key').count(), 49);
      assert.equal(await page.locator('#keys .key.white').count(), 29);
      assert.equal(await page.locator('#keys .key.black').count(), 20);
      assert.equal(await page.locator('#tone option').count(), 20);
      assert.equal(await page.locator('#tone optgroup').count(),2);
      assert(!(await page.locator('#fmPanel').isVisible()));
      assert.equal(await page.locator('#rhythm option').count(), 6);
      assert.equal(await page.locator('#demoSong option').count(), 5);
      assert.deepEqual(await page.evaluate(() => EK1.parseBar('C4:1 E4:1 G4:2').map(n => n.length)), [1,1,2]);
      if (width === 390) {
        assert(await page.locator('.mobile-key-nav').isVisible());
        assert.equal(await page.locator('.key.white').first().evaluate(el => getComputedStyle(el).touchAction), 'pan-x', 'Touch gestures should scroll the keys');
        assert(!(await page.locator('.speaker-grille').first().isVisible()));
        await page.waitForFunction(() => document.querySelector('.keyboard-scroll').scrollLeft > 150);
        const start = await page.locator('.keyboard-scroll').evaluate(e => e.scrollLeft);
        await page.locator('#keyLeft').click();
        await page.waitForFunction(prev => document.querySelector('.keyboard-scroll').scrollLeft < prev - 100, start);
        await page.locator('#keyRight').click();
        await page.waitForFunction(prev => document.querySelector('.keyboard-scroll').scrollLeft > prev + 100, start - 100);
      } else if (width === 1280) {
        assert(await page.locator('.speaker-grille').first().isVisible());
        const clippedKeys = await page.locator('.keyboard-scroll').evaluate(el => el.scrollWidth - el.clientWidth);
        assert(clippedKeys <= 2, 'All 49 keys should fit a wide desktop screen');
      }
      // Capture desktop/mobile appearances for human review of the physical design.
      await page.screenshot({path: 'artifacts/ek1-v0.9.2-' + name + '-' + width + '.png', fullPage:true});
      await page.locator('#tone').selectOption('5');
      assert.match(await page.locator('#displayMain').textContent(),/TRUMPET/);
      await page.locator('#playDemo').click();
      await page.waitForFunction(() => EK1.state.transport === 'demo');
      assert.match(await page.locator('#displaySub').innerText(),/DEMO/);
      await page.locator('#melodyOff').click();
      assert.equal(await page.locator('#melodyOff').getAttribute('aria-pressed'), 'true');
      await page.locator('#nextDemo').click();
      await page.waitForFunction(() => EK1.state.transport === 'demo' && EK1.state.demoIndex === 1);
      await page.locator('#stop').click();
      assert.equal(await page.evaluate(() => EK1.state.transport), 'stopped');
      await page.locator('#rhythm').selectOption('3');
      await page.locator('#startRhythm').click();
      await page.waitForFunction(() => EK1.state.transport === 'rhythm');
      await page.locator('#tempo').evaluate(el => { el.value = '155'; el.dispatchEvent(new Event('input', {bubbles:true})); });
      assert.match(await page.locator('#tempoValue').innerText(),/155 BPM/);
      await page.locator('#accomp').click();
      assert.equal(await page.evaluate(() => EK1.state.autoChord), true);
      await page.locator('#stop').click();
      await page.locator('#record').click();
      assert.equal(await page.evaluate(() => EK1.state.recording), true);
      const key = page.locator('#keys .key[data-midi="72"]');
      await key.scrollIntoViewIfNeeded();
      const rect = await key.boundingBox();
      assert(rect, 'Playable key should have a bounding rectangle');
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height * .83);
      await page.mouse.down();
      await page.waitForTimeout(120);
      await page.mouse.up();
      await page.locator('#record').click();
      assert.equal(await page.evaluate(() => EK1.state.recording), false);
      assert.equal(await page.evaluate(() => EK1.state.takeNotes), 1);
      assert(await page.locator('#playTake').isEnabled());
      await page.locator('#playTake').click();
      assert.equal(await page.evaluate(() => EK1.state.transport), 'take');
      await page.locator('#stop').click();
      const recordingDownload=page.waitForEvent('download');
      await page.locator('#exportTake').click();
      const recordingFile=await recordingDownload;
      const recorded=EK1MIDI.parse(readFileSync(await recordingFile.path()));
      assert.equal(recorded.notes.length,1);
      assert.equal(recorded.notes[0].key,72);
      assert.equal(recorded.notes[0].program,56);
      await page.locator('#clearTake').click();
      assert.equal(await page.evaluate(() => EK1.state.takeNotes), 0);
      const bytes=EK1MIDI.encodeTake([{midi:60,t:0,length:1,tone:0},{midi:48,t:0,length:1,tone:10}]);
      await page.locator('#midiFile').setInputFiles({name:'test-song.mid',mimeType:'audio/midi',buffer:Buffer.from(bytes)});
      await page.waitForFunction(()=>EK1.state.midiNotes===2);
      assert.equal(await page.evaluate(()=>EK1.state.midiChannels),2);
      assert.match(await page.locator('#midiStatus').innerText(),/2 notes/);
      await page.locator('#playMidi').click();
      await page.waitForFunction(()=>EK1.state.transport==='midi');
      await page.keyboard.down('q');
      await page.waitForFunction(()=>document.querySelector('[data-midi="72"]').classList.contains('pressed'));
      await page.keyboard.up('q');
      await page.locator('#stop').click();
      assert.equal(await page.evaluate(()=>EK1.state.transport),'stopped');
      const copyDownload=page.waitForEvent('download');
      await page.locator('#saveMidi').click();
      const copy=await copyDownload;
      assert.deepEqual(readFileSync(await copy.path()),Buffer.from(bytes));
      await page.locator('#midiFile').setInputFiles({name:'invalid.mid',mimeType:'audio/midi',buffer:Buffer.from([1,2,3])});
      await page.waitForFunction(()=>document.querySelector('#midiStatus').textContent.includes('Could not open MIDI'));
      assert.equal(await page.evaluate(()=>EK1.state.midiNotes),2);
      await page.locator('#tone').selectOption('fm-2');
      assert.equal(await page.evaluate(()=>EK1.state.engine),'fm');
      assert.equal(await page.locator('#activeEngine').innerText(),'FM');
      assert(await page.locator('#fmPanel').isVisible());
      assert.equal(await page.locator('#tone optgroup[label="FM synthesis"] option').count(),8);
      assert(await page.locator('#tone').isEnabled());
      await page.locator('#fmBrightness').evaluate(el=>{el.value='150';el.dispatchEvent(new Event('input',{bubbles:true}));});
      assert.equal(await page.evaluate(()=>EK1.state.fmSettings.brightness),1.5);
      await page.locator('#record').click();
      await page.keyboard.down('q');
      await page.waitForFunction(()=>EK1.state.takeNotes===1);
      await page.keyboard.up('q');
      await page.locator('#record').click();
      const fmDownload=page.waitForEvent('download');
      await page.locator('#exportTake').click();
      const fmFile=await fmDownload;
      const fmRecording=EK1MIDI.parse(readFileSync(await fmFile.path()));
      assert.equal(fmRecording.notes[0].program,38);
      await page.locator('#playTake').click();
      await page.waitForFunction(()=>EK1.state.transport==='take');
      await page.locator('#stop').click();
      await page.locator('#fmReset').click();
      assert.equal(await page.evaluate(()=>EK1.state.fmSettings.brightness),1);
      await page.locator('#tone').selectOption('5');
      assert.equal(await page.evaluate(()=>EK1.state.engine),'classic');
      assert.equal(await page.locator('#activeEngine').innerText(),'CLASSIC');
      assert(!(await page.locator('#fmPanel').isVisible()));
      assert(await page.locator('#tone').isEnabled());
      if (width === 390) {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert(overflow <= 2, 'Unexpected horizontal page overflow: ' + overflow);
      }
      assert.deepEqual(errors, [], 'Unexpected browser exceptions: ' + errors.join(', '));
      console.log('PASS EK-1 playable keyboard, authored demos, rhythm, auto chord and recording', name, width);
      await page.close();
    }
  } finally { await browser.close(); }
}
