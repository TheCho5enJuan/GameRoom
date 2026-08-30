import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const games=['tic-tac-toe','space-sabotage','deal-or-no-deal','rogue-quest','tide-and-tranquility','blockforge'];
const launcher=await readFile(join(root,'index.html'),'utf8');
for(const game of games){
  assert.match(launcher,new RegExp(`href="\\./games/${game}/"`));
  const entry=await readFile(join(root,'games',game,'index.html'),'utf8');
  assert.match(entry,/<\/html>/i);
  assert.doesNotMatch(entry,/<style[\s>]/i,`${game} should use stylesheet files`);
  const inline=[...entry.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].filter(m=>m[1].trim());
  assert.equal(inline.length,0,`${game} should not contain inline application scripts`);
}

async function walk(dir){
  const out=[];
  for(const name of await readdir(dir)){
    const path=join(dir,name); const info=await stat(path);
    if(info.isDirectory()) out.push(...await walk(path)); else out.push(path);
  }
  return out;
}
const files=await walk(root);
for(const file of files.filter(f=>f.endsWith('.js'))){
  execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
  assert.ok((await stat(file)).size<65000,`${file} is too large to remain a maintainable module`);
}
for(const file of files.filter(f=>f.endsWith('.jsx'))){
  const text=await readFile(file,'utf8');
  assert.ok(text.trim().length>0);
  assert.ok((await stat(file)).size<65000,`${file} is too large to remain a maintainable module`);
}
for(const game of ['rogue-quest','tide-and-tranquility','blockforge']){
  const manifest=JSON.parse(await readFile(join(root,'games',game,'game.json'),'utf8'));
  assert.ok(manifest.javascript.length>=10);
}
console.log(`Validated ${games.length} GameRoom projects and ${files.length} repository files.`);
