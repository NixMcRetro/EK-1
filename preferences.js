/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Local appearance and disclosure preferences only. No audio or project data. */
(() => {
  'use strict';
  const KEY='ek1.ui.preferences.v1';
  const themes=['system','light','dark'];
  let stored={};
  try {
    const value=JSON.parse(localStorage.getItem(KEY)||'{}');
    if(value&&typeof value==='object'&&!Array.isArray(value))stored=value;
  } catch (_) { /* Storage may be unavailable for local files or private browsing. */ }
  const panels=[...document.querySelectorAll('details[data-panel]')];
  const select=document.getElementById('themePreference');
  const system=window.matchMedia('(prefers-color-scheme: dark)');
  let theme=themes.includes(stored.theme)?stored.theme:'system';
  const previous=stored.panels&&typeof stored.panels==='object'?stored.panels:{};
  for(const panel of panels){
    if(typeof previous[panel.dataset.panel]==='boolean')panel.open=previous[panel.dataset.panel];
  }
  function save(){
    try {
      localStorage.setItem(KEY,JSON.stringify({theme,panels:Object.fromEntries(panels.map(p=>[p.dataset.panel,p.open]))}));
    } catch (_) { /* Continue normally with session-only preferences. */ }
  }
  function apply(){
    const effective=theme==='system'?(system.matches?'dark':'light'):theme;
    document.documentElement.dataset.theme=effective;
    document.querySelector('meta[name="theme-color"]').content=effective==='dark'?'#202623':'#343837';
    select.value=theme;
  }
  select.addEventListener('change',()=>{theme=themes.includes(select.value)?select.value:'system';apply();save();});
  if(system.addEventListener)system.addEventListener('change',()=>{if(theme==='system')apply();});
  else if(system.addListener)system.addListener(()=>{if(theme==='system')apply();});
  for(const panel of panels)panel.addEventListener('toggle',save);
  apply();
})();
