/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Lightweight song builder controls. No network requests or local storage. */
(function(){
 'use strict';
 const C=EK1Composer,$=id=>document.getElementById(id), opt=(name,value)=>new Option(name,value);
 let song=C.create(),variation=0,exporting=false,dirty=false;
 function changed(){dirty=true;}
 const cleanMelody=m=>{let sounding=false;for(let i=0;i<m.length;i++){if(m[i]===-1&&!sounding)m[i]=null;if(m[i]!==-1)sounding=m[i]!==null;}return m;};
 const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);};
 function report(s){$('composeStatus').textContent=s;}
 function fill(id,items){$(id).replaceChildren(...items.map(([v,n])=>opt(n,v)));}
 fill('composeKey',C.names.map((n,i)=>[i,n+' major']));
 fill('composeStyle',Object.keys(C.styles).map(n=>[n,n]));
 fill('composeProgress',Object.keys(C.progressions).map(n=>[n,n==='Minor'?'Minor mood':n]));
 $('composeStyle').value='Pop';$('composeProgress').value='Bright';$('composeBars').value='8';
 function rebuild(){
   $('composeTempo').value=song.bpm;
   const rows=$('composeRows');rows.replaceChildren();
   song.bars.forEach((bar,i)=>{
     const tr=document.createElement('tr'),number=document.createElement('th');number.scope='row';number.textContent=String(i+1).padStart(2,'0');if(bar.section){const label=document.createElement('span');label.className='section-bar';label.textContent=bar.section;number.append(label);}tr.append(number);
     function cell(select){const td=document.createElement('td');td.append(select);tr.append(td);}
     const chord=document.createElement('select');chord.setAttribute('aria-label','Bar '+(i+1)+' chord');
     chord.replaceChildren(...C.chords(song.key).map((c,j)=>opt(C.chordName(c),j)));
     chord.value=String(C.chords(song.key).findIndex(c=>C.chordName(c)===C.chordName(bar.chord)));
     chord.addEventListener('change',()=>{bar.chord={...C.chords(song.key)[Number(chord.value)]};changed();report('Chord updated. Press PLAY SONG to hear your changes.');});cell(chord);
     const resolution=document.createElement('select');resolution.setAttribute('aria-label','Bar '+(i+1)+' melody resolution');resolution.replaceChildren(opt('Quarter notes',4),opt('Eighth notes',8),opt('Sixteenth notes',16));resolution.value=String(bar.melody.length);resolution.addEventListener('change',()=>{const old=bar.melody,newLength=Number(resolution.value),next=Array(newLength).fill(null);for(let j=0;j<old.length;j++){const pos=j*newLength/old.length;if(Number.isInteger(pos))next[pos]=old[j];}bar.melody=cleanMelody(next);changed();rebuild();report('Melody grid updated.');});tr.lastChild.append(resolution);
     const subdivisions=bar.melody.length/4;
     for(let beat=0;beat<4;beat++){
       const stack=document.createElement('div');stack.className='melody-stack';
       for(let sub=0;sub<subdivisions;sub++){const at=beat*subdivisions+sub,select=document.createElement('select');select.setAttribute('aria-label','Bar '+(i+1)+' beat '+(beat+1)+(subdivisions>1?' subdivision '+(sub+1):''));
       select.append(opt('Rest','rest'));if(at>0)select.append(opt('Hold','-1'));for(let n=60;n<=84;n++)select.append(opt(C.names[n%12]+(Math.floor(n/12)-1),n));
       select.value=bar.melody[at]===null?'rest':String(bar.melody[at]);
       select.addEventListener('change',()=>{bar.melody[at]=select.value==='rest'?null:Number(select.value);cleanMelody(bar.melody);changed();for(const [j,el] of [...tr.querySelectorAll('.melody-stack select')].entries())el.value=bar.melody[j]===null?'rest':String(bar.melody[j]);report('Melody updated. Press PLAY SONG to hear your changes.');});stack.append(select);}cell(stack);
     }
     rows.append(tr);
   });
   const tracks=$('composeTracks');tracks.replaceChildren();
   song.parts.forEach((part,i)=>{
     const row=document.createElement('div');row.className='compose-part';
     const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=part.enabled;check.id='composeTrack'+i;
     check.addEventListener('change',()=>{part.enabled=check.checked;changed();report('Parts updated for the next playback or export.');});label.append(check,' '+part.name);row.append(label);
     if(part.program!==null){const select=document.createElement('select');select.setAttribute('aria-label',part.name+' instrument');select.replaceChildren(...C.programs.map(([p,n])=>opt(n,p)));select.value=String(part.program);select.addEventListener('change',()=>{part.program=Number(select.value);changed();});row.append(select);}else{const span=document.createElement('span');span.textContent='Rhythm kit';row.append(span);}
     for(const [key,title,min,max,def] of [['volume','Level',0,127,100],['pan','Pan',0,127,64]]){const lab=document.createElement('label');lab.className='mix-control';const range=document.createElement('input');range.type='range';range.min=min;range.max=max;range.value=part[key]??def;range.setAttribute('aria-label',part.name+' '+title);const value=document.createElement('span');const display=()=>{value.textContent=key==='volume'?Math.round(range.value/127*100)+'%':Number(range.value)===64?'C':Number(range.value)<64?'L'+(64-range.value):'R'+(range.value-64);};display();range.addEventListener('input',()=>{part[key]=Number(range.value);changed();display();});lab.append(title,range,value);row.append(lab);}
     tracks.append(row);
   });
 }
 function settings(){const bpm=Number($('composeTempo').value);if(!Number.isFinite(bpm)||bpm<60||bpm>180)throw Error('Tempo must be 60–180 BPM.');const nextStyle=$('composeStyle').value;if(song.bpm!==Math.round(bpm)||song.style!==nextStyle)changed();song.bpm=Math.round(bpm);song.style=nextStyle;}
 $('composeTempo').addEventListener('change',changed);
 $('composeStyle').addEventListener('change',()=>{$('composeTempo').value=C.styles[$('composeStyle').value].bpm;});
 $('composeGenerate').addEventListener('click',()=>{if(dirty&&!confirm('Replace your unsaved arrangement? Save a project first to keep it.'))return;EK1.stopComposition();song=C.create(Number($('composeKey').value),$('composeProgress').value,Number($('composeBars').value),$('composeStyle').value);song.bars[0].section='Verse';variation=0;dirty=false;rebuild();report('New arrangement ready. Edit chords or melody, or press PLAY SONG.');});
 $('composeMelody').addEventListener('click',()=>{try{settings();}catch(e){report(e.message);return;}C.melodyFor(song.bars,++variation).forEach((m,i)=>{const size=song.bars[i].melody.length;const next=Array(size).fill(null);m.forEach((note,j)=>{const at=j*size/4;next[at]=note;if(note===-1)for(let k=1;k<size/4;k++)next[at+k]=-1;else if(note!==null&&m[j+1]===-1)for(let k=1;k<size/4;k++)next[at+k]=-1;});song.bars[i].melody=cleanMelody(next);});changed();rebuild();report('New melody ready.');});
 $('composePlay').addEventListener('click',async()=>{try{if(EK1.state.composing){EK1.stopComposition();return;}settings();const bytes=C.encode(song);await EK1.playComposition(bytes);report('Playing your song. Play along on the keyboard.');}catch(e){report(e.message);}});
 $('composeSave').addEventListener('click',()=>{try{settings();EK1.downloadComposition(C.encode(song));report('Song exported as multitrack MIDI.');}catch(e){report(e.message);}});
 // Strict validation prevents malformed project files from replacing a working song.
 function validateProject(p){
   if(!p||p.format!=='EK-1' || p.version!==1)throw Error('Not a supported EK-1 project.');
   const x=p.song,integer=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
   if(!x||!integer(x.key,0,11)||!Object.hasOwn(C.styles,x.style)||!integer(x.bpm,60,180)||!Array.isArray(x.bars)||x.bars.length<4||x.bars.length>64||!Array.isArray(x.parts)||x.parts.length!==4)throw Error('Invalid project settings.');
   const allowed=C.chords(x.key).map(C.chordName);
   for(const b of x.bars){if(!b||!b.chord||!integer(b.chord.root,0,11)||typeof b.chord.minor!=='boolean'||typeof b.chord.dim!=='boolean'||!allowed.includes(C.chordName(b.chord))||!Array.isArray(b.melody)||![4,8,16].includes(b.melody.length)||b.melody.some((n,i)=>n!==null&&!(n===-1&&i>0)&&!integer(n,60,84))||b.section!==undefined&&(typeof b.section!=='string'||b.section.length>32))throw Error('Invalid notes or chords in project.');}
   const defaults=C.create().parts;
   for(let i=0;i<4;i++){const t=x.parts[i];if(!t||t.name!==defaults[i].name||t.channel!==defaults[i].channel||typeof t.enabled!=='boolean'||!integer(t.volume??100,0,127)||!integer(t.pan??64,0,127)||(i===3?t.program!==null:!C.programs.some(([n])=>n===t.program)))throw Error('Invalid project track settings.');}
   return x;
 }
 $('projectSave').addEventListener('click',()=>{try{settings();download(new Blob([JSON.stringify({format:'EK-1',version:1,song,bank:EK1.bankName,progression:$('composeProgress').value},null,2)],{type:'application/json'}),'EK-1-song.ek1');dirty=false;report('Editable project saved. SoundFont remains a separate file.');}catch(e){report(e.message);}});
 $('projectOpen').addEventListener('click',()=>$('projectFile').click());
 $('projectFile').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>1048576)throw Error('Project file exceeds 1 MiB.');const p=JSON.parse(await file.text()),next=validateProject(p);if(dirty&&!confirm('Replace your unsaved arrangement?'))return;EK1.stopComposition();song=next;dirty=false;variation=0;$('composeKey').value=String(song.key);$('composeStyle').value=song.style;$('composeProgress').value=Object.hasOwn(C.progressions,p.progression)?p.progression:'Bright';if([4,8,16].includes(song.bars.length))$('composeBars').value=String(song.bars.length);rebuild();report('Project opened.'+(p.bank&&p.bank!==EK1.bankName?' Load '+String(p.bank).slice(0,200)+' for the original sound.':''));}catch(e){report('Could not open project: '+e.message);}});
 $('appendSection').addEventListener('click',()=>{try{settings();const length=Number($('composeBars').value);if(song.bars.length+length>64)throw Error('Songs are limited to 64 bars.');const next=C.create(song.key,$('composeProgress').value,length,song.style);const label=['Intro','Verse','Chorus','Bridge','Ending'][$('sectionType').selectedIndex];next.bars[0].section=label;song.bars.push(...next.bars);changed();rebuild();report(label+' added. '+song.bars.length+' bars total.');}catch(e){report(e.message);}});
 $('removeSection').addEventListener('click',()=>{let i=song.bars.length-1;while(i>=0&&!song.bars[i].section)i--;if(i<=0){report('Keep at least one section.');return;}song.bars.splice(i);changed();rebuild();report('Last section removed. '+song.bars.length+' bars remain.');});
 if(!window.lamejs?.Mp3Encoder){$('audioFormat').querySelector('option[value=mp3]').disabled=true;}
 $('audioFormat').addEventListener('change',()=>{const mp3=$('audioFormat').value==='mp3';$('wavBitsLabel').hidden=mp3;$('mp3RateLabel').hidden=!mp3;});
 $('exportAudio').addEventListener('click',async()=>{if(exporting)return;exporting=true;const controls=[...document.querySelectorAll('.song-builder button,.song-builder select,.song-builder input')];const old=controls.map(x=>x.disabled);controls.forEach(x=>x.disabled=true);const cancel=$('cancelExport');cancel.hidden=false;cancel.disabled=false;const controller=new AbortController();cancel.onclick=()=>controller.abort();const progress=$('audioProgress');progress.hidden=false;progress.value=0;try{settings();const rate=Number($('audioRate').value),format=$('audioFormat').value,bitrate=Number($('mp3Rate').value),bits=Number($('audioBits').value);if(format==='mp3'&&!await EK1AudioExport.mp3Supported(rate,bitrate))throw Error('MP3 encoder is unavailable. Extract the entire ZIP or choose WAV.');report('Rendering '+(EK1.bankName||'Classic sounds')+' locally…');const audio=await EK1.renderComposition(C.encode(song),rate,p=>progress.value=p,controller.signal);const blob=format==='wav'?EK1AudioExport.wav(audio,bits):await EK1AudioExport.mp3(audio,bitrate,p=>progress.value=p,controller.signal);if(controller.signal.aborted)throw Error('Export cancelled.');download(blob,'EK-1-song.'+format);progress.value=1;report('Audio exported as '+format.toUpperCase()+'.');}catch(e){report(controller.signal.aborted?'Export cancelled. No audio file was created.':'Could not export audio: '+e.message);}finally{exporting=false;controls.forEach((x,i)=>x.disabled=old[i]);progress.hidden=true;cancel.hidden=true;cancel.onclick=null;document.dispatchEvent(new Event('ek1-transport'));}});
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 song.bars[0].section='Verse';
 rebuild();
 document.addEventListener('ek1-transport',()=>{$('composePlay').textContent=EK1.state.composing?'STOP SONG':'PLAY SONG';$('composePlay').disabled=exporting||EK1.state.recording||EK1.state.bankLoading;});
})();
