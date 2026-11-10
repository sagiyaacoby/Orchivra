'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { repairSpawnHelper } = require('../lib/pty-helper');

test('repairs macOS helper permissions without changing unrelated files or other architectures', {skip:process.platform === 'win32'}, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orchivra-helper-'));
  try {
    const target = path.join(root, 'prebuilds/darwin-arm64/spawn-helper');
    const other = path.join(root, 'prebuilds/darwin-x64/spawn-helper');
    for (const file of [target,other]) {
      fs.mkdirSync(path.dirname(file),{recursive:true});
      fs.writeFileSync(file,'fixture',{mode:0o644});
    }
    repairSpawnHelper(root,'darwin','arm64');
    assert.equal(fs.statSync(target).mode & 0o777,0o755);
    assert.equal(fs.statSync(other).mode & 0o777,0o644);
    repairSpawnHelper(root,'darwin','arm64');
    assert.equal(fs.statSync(target).mode & 0o777,0o755);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test('PTY startup failure is scrubbed and reported without crashing; retry succeeds', () => {
  let fail = true;
  let repaired = 0;
  const mockRequire = name => {
    if (name === './pty-helper') return {repairSpawnHelper:()=>{repaired++;}};
    if (name === 'node-pty') return {spawn:()=>{
      if (fail) throw new Error('posix_spawnp failed: secret-fixture');
      return {onData(){},onExit(){}};
    }};
    throw new Error('Unexpected dependency: '+name);
  };
  mockRequire.resolve = () => '/installed/node-pty/package.json';
  const module = {exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../lib/pty.js'),'utf8'), {
    require:mockRequire,module,process:{platform:'darwin',arch:'arm64',env:{}},console,Map,Buffer,setTimeout,clearTimeout
  });
  const messages=[];
  const ctx={ROOT:'/project',path,readJSON:()=>({}),wsSend:(socket,message)=>messages.push(message),scrubSecrets:text=>text.replace('secret-fixture','[REDACTED]')};
  assert.equal(module.exports.createTermSession('failed',{},ctx),null);
  assert.equal(messages[0].type,'terminal-error');
  assert.match(messages[0].error,/posix_spawnp failed/);
  assert.doesNotMatch(messages[0].error,/secret-fixture/);
  assert.equal(module.exports.getTermSessions().size,0);
  fail=false;
  assert.ok(module.exports.createTermSession('retry',{},ctx));
  assert.equal(module.exports.getTermSessions().size,1);
  assert.equal(repaired,2);
});

test('real macOS node-pty: reproduces non-executable helper failure, repairs it, then spawns', {skip:process.platform !== 'darwin'}, async () => {
  const root = path.dirname(require.resolve('node-pty/package.json'));
  const pty = require('node-pty');
  const helper = ['build/Release/spawn-helper','build/Debug/spawn-helper','prebuilds/darwin-'+process.arch+'/spawn-helper']
    .map(p=>path.join(root,p)).find(p=>fs.existsSync(p));
  assert.ok(helper,'installed helper exists');
  const original = fs.statSync(helper).mode & 0o777;
  try {
    fs.chmodSync(helper,0o644);
    assert.throws(()=>pty.spawn('/bin/echo',['orchivra-pty-ok'],{cols:80,rows:24}),/posix_spawn/);
    repairSpawnHelper(root,process.platform,process.arch);
    const output = await new Promise((resolve,reject)=>{
      const term=pty.spawn('/bin/echo',['orchivra-pty-ok'],{cols:80,rows:24});
      let data='';
      const timer=setTimeout(()=>{term.kill();reject(new Error('PTY smoke test timed out'));},5000);
      term.onData(chunk=>{data+=chunk;});
      term.onExit(event=>{clearTimeout(timer);event.exitCode===0?resolve(data):reject(new Error('exit '+event.exitCode));});
    });
    assert.match(output,/orchivra-pty-ok/);
  } finally { fs.chmodSync(helper,original); }
});
