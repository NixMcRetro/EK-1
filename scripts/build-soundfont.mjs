import {build} from 'esbuild';
import {mkdir,copyFile,readdir} from 'node:fs/promises';
await mkdir('vendor',{recursive:true});
await build({stdin:{contents:"export { WorkletSynthesizer } from 'spessasynth_lib';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',outfile:'vendor/spessasynth.mjs',legalComments:'eof',minify:true});
await copyFile('node_modules/spessasynth_lib/dist/spessasynth_processor.min.js','vendor/spessasynth_processor.min.js');
for(const pkg of ['spessasynth_lib','spessasynth_core']){
 const base='node_modules/'+pkg;
 for(const file of await readdir(base))if(/^(LICENSE|NOTICE|COPYING)(\.|$)/i.test(file))await copyFile(base+'/'+file,'vendor/'+pkg+'-'+file);
}
