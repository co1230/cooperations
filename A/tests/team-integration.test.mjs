import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {adaptTeamSource,bridgeHtml} from '../team-adapter.mjs';

test('B uses A identity and account-scoped storage only in buyer sources',()=>{
  const source='export const currentUser = {\n id:1,\n}\nlocalStorage.getItem("cart")';
  const result=adaptTeamSource(source,'C:\\repo\\B\\web\\src\\mock\\data.js','BUYER');
  assert.match(result,/currentUser = window.luoboUser/);
  assert.match(result,/window.luoboStorage.getItem/);
  assert.equal(adaptTeamSource(source,'/repo/B/web/src/mock/data.js','MERCHANT'),source);
});

test('D API proxy and E logout are adapted without changing unrelated sources',()=>{
  const api="const base = 'http://localhost:8000/api'";
  assert.equal(adaptTeamSource(api,'/repo/directory/frontend/src/api/order.js','MERCHANT'),"const base = '/api'");
  assert.equal(adaptTeamSource(api,'/repo/directory/frontend/src/views/order.vue','MERCHANT'),api);
  assert.match(adaptTeamSource('logout() { clear(); }','/repo/E/frontend/src/store/index.js','ADMIN'),/LUOBO_EXIT/);
});

test('all present member HTML entries are delayed until the session handshake',async()=>{
  for(const [file,entry] of [['../../B/web/index.html','/src/main.jsx'],['../../directory/frontend/index.html','/src/main.js'],['../../E/frontend/index.html','/src/main.js']]) {
    const actual=await readFile(new URL(file,import.meta.url),'utf8');
    const result=bridgeHtml(actual,entry);
    assert.match(result,/__a_bridge.mjs/);
    assert.ok(result.includes(`boot(${JSON.stringify(entry)})`));
    assert.doesNotMatch(result,/<script[^>]*src=["']\/src\/main/);
  }
  assert.throws(()=>bridgeHtml('<html></html>','/src/main.js'),/入口格式/);
});
