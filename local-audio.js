/* EK-1 direct-file bridge. Uses the existing SpessaSynth processor core with native
 * Web Audio ScriptProcessorNode (legacy fallback); no modules, fetch, or worklet URL.
 * Both ports are local; messages preserve upstream transfer semantics.
 */
(function(root){
  'use strict';
  function makeNode(context, name, options){
    const node=context.createScriptProcessor(1024,0,2);
    const channel=new MessageChannel();
    const core=new root.EK1LocalProcessor(options.processorOptions,channel.port2);
    const outputs=Array.from({length:18},()=>[new Float32Array(128),new Float32Array(128)]);
    let destroyed=false;
    node.onaudioprocess=e=>{
      const l=e.outputBuffer.getChannelData(0),r=e.outputBuffer.getChannelData(1);
      for(let i=0;i<l.length;i+=128){
        for(const pair of outputs)for(const samples of pair)samples.fill(0);
        if(!destroyed)core.process([],outputs);
        l.set(outputs[0][0],i);r.set(outputs[0][1],i);
      }
    };
    return {
      port:channel.port1,
      connect(destination,index=0){if(index!==0)throw Error('Local audio supports the stereo master output only.');return node.connect(destination);},
      disconnect(destination,index=0){
        if(destination){node.disconnect(destination);return;}
        if(destroyed)return;
        destroyed=true;node.onaudioprocess=null;node.disconnect();core.destroy();channel.port1.close();channel.port2.close();
      }
    };
  }
  root.EK1LocalAudio={create(context){return new root.EK1LocalSynth(context,{audioNodeCreators:{worklet:makeNode},convolverMode:false});}};
})(globalThis);
