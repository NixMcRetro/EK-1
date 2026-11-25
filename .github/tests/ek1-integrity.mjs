import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=(algorithm,data,encoding='hex')=>createHash(algorithm).update(data).digest(encoding);
for(const line of readFileSync('vendor/SHA256SUMS.txt','utf8').trim().split('\n')){
 const [expected,path]=line.trim().split(/\s+/);
 assert.equal(sha('sha256',readFileSync(path)),expected,path);
}
const lock=JSON.parse(readFileSync('vendor/sources/dependency-lock.json','utf8'));
for(const [path,pkg] of Object.entries(lock.packages)){
 if(!path)continue;
 const name=path.replace(/^node_modules\//,'');
 const file='vendor/sources/'+name+'-'+pkg.version+'.tgz';
 const [algorithm,digest]=pkg.integrity.split('-');
 assert.equal(sha(algorithm,readFileSync(file),'base64'),digest,file);
}
for(const path of ['LICENSE','THIRD-PARTY-NOTICES.txt','licenses/GPL-3.0.txt','licenses/LGPL-3.0.txt','licenses/lamejs-upstream-COPYING.txt'])assert(statSync(path).size>100,path);
assert.equal(readFileSync('LICENSE','utf8'),readFileSync('licenses/GPL-3.0.txt','utf8'),'Canonical GPL text must match');
assert.equal(JSON.parse(readFileSync('package.json','utf8')).license,'GPL-3.0-or-later');
assert(readFileSync('index.html','utf8').includes('href="LICENSE"'),'Visible licence link required');
function walk(path){for(const item of readdirSync(path,{withFileTypes:true})){if(item.name==='.git'||item.name==='node_modules'||item.name==='artifacts')continue;const full=path+'/'+item.name;if(item.isDirectory())walk(full);else assert(!/\.sf[23]$/i.test(item.name),'Unexpected bundled SoundFont '+full);}}
walk('.');
console.log('PASS exact vendor bytes, package integrity, licence texts, no sound banks');
