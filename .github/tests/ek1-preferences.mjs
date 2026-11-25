/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const url=pathToFileURL(resolve('index.html')).href;
const key='ek1.ui.preferences.v1';
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900},colorScheme:'light'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);assert.equal(await page.locator('details[open]').count(),5);
  assert.equal(await page.locator('#themePreference').inputValue(),'system');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  const initial=await page.locator('.key.white').first().evaluate(el=>getComputedStyle(el).backgroundImage);
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.locator('#themePreference').selectOption('light');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  await page.locator('#themePreference').selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  assert.equal(await page.locator('.key.white').first().evaluate(el=>getComputedStyle(el).backgroundImage),initial);
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(32, 38, 35)');
  await page.locator('[data-panel="mixer"] > summary').click();
  await page.locator('[data-panel="sound-options"] > summary').click();
  await page.locator('[data-panel="song-builder"] > summary').click();
  const available=await page.evaluate(k=>{try{localStorage.setItem(k+'.probe','1');localStorage.removeItem(k+'.probe');return true;}catch{return false;}},key);
  if(available){
    await page.waitForFunction(k=>{try{const v=JSON.parse(localStorage.getItem(k));return v.theme==='dark'&&v.panels.mixer===false&&v.panels['sound-options']===false&&v.panels['song-builder']===false;}catch{return false;}},key);
    await page.reload();
    assert.equal(await page.locator('#themePreference').inputValue(),'dark');
    assert.equal(await page.locator('details[data-panel="song-builder"]').getAttribute('open'),null);
    assert.equal(await page.locator('details[data-panel="sound-options"]').getAttribute('open'),null);
    await page.locator('[data-panel="song-builder"] > summary').click();
    assert(!(await page.locator('#composeTracks').isVisible()));
    assert(await page.locator('#composeRows').isVisible());
  }else console.log(name,'file storage unavailable; persistence skipped');
  for(const width of [1280,768,390]){
    await page.setViewportSize({width,height:900});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'dark layout overflow '+width);
  }
  assert.deepEqual(errors,[]);
  const blocked=await browser.newPage({colorScheme:'light'});
  await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled');},configurable:true}));
  const failures=[];blocked.on('pageerror',e=>failures.push(e.message));
  await blocked.goto(url);assert.equal(await blocked.locator('details[open]').count(),5);
  await blocked.locator('#themePreference').selectOption('dark');
  assert.equal(await blocked.locator('html').getAttribute('data-theme'),'dark');
  await blocked.locator('[data-panel="sound-options"] > summary').click();
  assert(!(await blocked.locator('#effect-reverb').isVisible()));assert.deepEqual(failures,[]);
  console.log('PASS',name,'themes, panel defaults, local persistence when available and storage fallback');
 }finally{await browser.close();}
}
