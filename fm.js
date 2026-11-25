/* EK-1 original six-operator frequency-modulation synthesizer.
 * Native Web Audio sine oscillators; no ROMs, borrowed patches or DX7 emulation.
 * Operator tuples: target (-1 = audible), ratio, amount, attack, decay, sustain, release.
 */
(function(root){
  'use strict';
  const presets=[
    {name:'Electric Tines',tone:1,program:4,ops:[[-1,1,.76,.004,1.1,.32,.35],[0,1,1.9,.002,.35,.22,.17],[1,3,.8,.002,.08,.02,.10],[-1,1,.24,.006,.8,.20,.25],[3,7,.95,.002,.12,.04,.10],[4,2,.32,.002,.12,.08,.12]]},
    {name:'Crystal Bells',tone:7,program:14,ops:[[-1,1,.65,.003,1.8,.015,.8],[0,3.5,1.5,.002,.65,.03,.4],[1,2,.7,.003,.28,.01,.25],[-1,2.01,.35,.003,1.1,.01,.65],[3,4.2,.8,.002,.28,.02,.3],[4,1.4,.4,.002,.16,.01,.2]]},
    {name:'Rubber Bass',tone:10,program:38,ops:[[-1,1,.9,.006,.28,.52,.12],[0,1,2.8,.004,.16,.25,.08],[1,2,.65,.005,.11,.1,.08],[-1,.5,.10,.01,.3,.7,.11],[3,1,.3,.01,.15,.3,.08],[4,2,.12,.01,.1,.15,.08]]},
    {name:'Digital Brass',tone:6,program:62,ops:[[-1,1,.62,.07,.25,.76,.19],[0,1,2.4,.09,.22,.62,.12],[1,2,.65,.07,.18,.4,.12],[-1,1.004,.38,.055,.3,.75,.24],[3,1,1.8,.09,.23,.62,.13],[4,2,.6,.07,.16,.5,.13]]},
    {name:'Glass Pad',tone:9,program:89,ops:[[-1,1,.53,.35,.8,.8,.9],[0,2,1.25,.55,.7,.7,.6],[1,3,.6,.6,.6,.5,.6],[-1,1.006,.47,.4,.8,.75,1.1],[3,2.002,1.1,.65,.65,.6,.7],[4,5,.3,.45,.6,.6,.6]]},
    {name:'Reed Lead',tone:11,program:71,ops:[[-1,1,.7,.025,.23,.83,.16],[0,2,1.6,.035,.24,.62,.14],[1,1,.45,.015,.2,.4,.1],[-1,2,.3,.028,.3,.52,.15],[3,3,.5,.035,.25,.4,.11],[4,2,.18,.02,.2,.3,.1]]},
    {name:'Drawbar Organ',tone:2,program:16,ops:[[-1,1,.52,.008,.15,.95,.09],[0,2,.13,.006,.13,.9,.08],[-1,2,.25,.009,.18,.9,.09],[2,1,.08,.008,.1,.9,.08],[-1,3,.15,.008,.2,.9,.09],[-1,4,.08,.006,.12,.9,.08]]},
    {name:'Digital Pluck',tone:8,program:80,ops:[[-1,1,.72,.003,.34,.10,.21],[0,2,2.2,.003,.12,.06,.15],[1,3,.95,.002,.08,.02,.1],[-1,2,.28,.005,.24,.07,.18],[3,5,1.4,.002,.08,.03,.11],[4,2,.3,.002,.06,.03,.1]]}
  ];
  presets.forEach(p=>{p.ops.forEach(Object.freeze);Object.freeze(p.ops);Object.freeze(p);});Object.freeze(presets);
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  function voice(ctx,bus,midi,at,duration,index,settings={},velocity=.3,held=false){
    const p=presets[index]||presets[0], start=Math.max(ctx.currentTime,at);
    const hz=440*2**((midi-69)/12);
    const bright=clamp(Number(settings.brightness??1),0,2), attackScale=clamp(Number(settings.attack??1),.25,4), releaseScale=clamp(Number(settings.release??1),.25,4);
    const oscs=[], gains=[], envs=[];
    const output=ctx.createGain();
    output.gain.value=velocity*.78;
    output.connect(bus);
    for(let i=0;i<6;i++){
      const [target,ratio,amount,a,d,s,r]=p.ops[i], freq=Math.min(ctx.sampleRate*.40,hz*ratio);
      const oscillator=ctx.createOscillator(), gain=ctx.createGain();
      oscillator.type='sine';oscillator.frequency.value=freq;
      const attack=Math.max(.002,a*attackScale), decay=Math.max(.004,d);
      // Modulator amplitude is frequency deviation in Hz, expressed as an FM index.
      // Limit high-frequency modulation to reduce aliasing at the top of the keyboard.
      const peak=target===-1?amount:Math.min(ctx.sampleRate*.18,amount*freq*bright*Math.min(1,2200/hz));
      gain.gain.setValueAtTime(0,start);
      gain.gain.linearRampToValueAtTime(peak,start+attack);
      gain.gain.linearRampToValueAtTime(peak*s,start+attack+decay);
      oscillator.connect(gain);
      gain.connect(target===-1?output:oscs[target].frequency);
      oscs.push(oscillator);gains.push(gain);envs.push({attack,decay,peak,s,release:Math.max(.012,r*releaseScale)});
    }
    let stopped=0, releasedAt=Infinity;
    oscs.forEach(osc=>{osc.onended=()=>{if(++stopped===oscs.length){for(const n of [...oscs,...gains,output])n.disconnect();}};osc.start(start);});
    function release(when){
      const off=Math.max(ctx.currentTime,start,when);
      if(off>=releasedAt)return;
      releasedAt=off;
      envs.forEach((e,i)=>{
        const elapsed=off-start;
        const value=elapsed<e.attack?e.peak*elapsed/e.attack:elapsed<e.attack+e.decay?e.peak*(1-(1-e.s)*(elapsed-e.attack)/e.decay):e.peak*e.s;
        const param=gains[i].gain;
        param.cancelScheduledValues(off);
        param.setValueAtTime(value,off);
        param.linearRampToValueAtTime(0,off+e.release);
        try{oscs[i].stop(off+e.release+.015);}catch{}
      });
    }
    if(!held)release(start+Math.max(.01,duration));
    return {release};
  }
  root.EK1FM=Object.freeze({presets,voice});
})(globalThis);
