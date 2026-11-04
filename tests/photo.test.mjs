import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHarness, TEST_PASSWORD } from './support/netlify-harness.mjs';
import { cropGeometry } from '../site/photo-editor.js';

test('crop stays inside the photo at every rotation, zoom and drag extreme',()=>{
 for(const [width,height] of [[1800,1200],[1200,1800],[1000,1000]])for(const angle of [0,90,180,270])for(const zoom of [1,1.5,3]){
  const g=cropGeometry(width,height,angle,zoom,1e6,-1e6);
  const rw=angle%180?height:width,rh=angle%180?width:height;
  assert.ok(rw*g.scale>=800&&rh*g.scale>=1000);
  assert.ok(Math.abs(g.panX)+400<=rw*g.scale/2+.001);
  assert.ok(Math.abs(g.panY)+500<=rh*g.scale/2+.001);
 }
});

test('photo endpoint authenticates upload and rejects unsafe or oversized files',async()=>{
 const handler=await createHarness().handler('photo');
 const request=(body,headers={})=>new Request('http://localhost/.netlify/functions/photo',{method:'POST',headers,body});
 assert.equal((await handler(request('not an image'))).status,401);
 const auth={'x-admin-password':TEST_PASSWORD};
 assert.equal((await handler(request('<svg/>',{...auth,'Content-Type':'image/svg+xml'}))).status,415);
 assert.equal((await handler(request(new Uint8Array(200),{...auth,'Content-Type':'image/jpeg'}))).status,415);
 assert.equal((await handler(request('x',{...auth,'Content-Type':'image/jpeg','Content-Length':String(3*1024*1024)}))).status,413);
 assert.equal((await handler(new Request('http://localhost/.netlify/functions/photo?asset=../settings'))).status,400);
});

test('photo saves, serves exact bytes and remains attached to its own invitation',async()=>{
 const harness=createHarness(),photo=await harness.handler('photo'),invites=await harness.handler('invites'),config=await harness.handler('config');
 const image=await readFile(new URL('../site/assets/graduate-default.jpg',import.meta.url));
 const headers={'x-admin-password':TEST_PASSWORD,'Content-Type':'image/jpeg'};
 const result=await photo(new Request('http://localhost/.netlify/functions/photo',{method:'POST',headers,body:image}));
 assert.equal(result.status,200);const uploaded=await result.json();assert.match(uploaded.photoAsset,/^[a-f0-9]{32}$/);
 const get=await photo(new Request('http://localhost'+uploaded.url));
 assert.equal(get.headers.get('Content-Type'),'image/jpeg');assert.deepEqual(Buffer.from(await get.arrayBuffer()),image);
 const head=await photo(new Request('http://localhost'+uploaded.url,{method:'HEAD'}));
 assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);assert.equal(Number(head.headers.get('Content-Length')),image.length);
 const save=async settings=>invites(new Request('http://localhost/.netlify/functions/invites',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({settings})}));
 const first=await (await save({recipientName:'Khách A',photoAsset:uploaded.photoAsset})).json();
 await save({recipientName:'Khách B',photoAsset:''});
 const all=await (await invites(new Request('http://localhost/.netlify/functions/invites',{headers}))).json();
 assert.equal(all.invites.find(i=>i.id===first.invite.id).settings.photoAsset,uploaded.photoAsset);
 assert.equal(all.invites.find(i=>i.settings.recipientName==='Khách B').settings.photoAsset,'');
 const globalSave=await config(new Request('http://localhost/.netlify/functions/config',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({photoAsset:uploaded.photoAsset})}));
 assert.equal(globalSave.status,200);
 const globalSettings=await (await config(new Request('http://localhost/.netlify/functions/config'))).json();
 assert.equal(globalSettings.settings.photoAsset,uploaded.photoAsset);
 const bad=await config(new Request('http://localhost/.netlify/functions/config',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({photoAsset:'https://example.com/image.jpg'})}));
 assert.equal(bad.status,400);
});
