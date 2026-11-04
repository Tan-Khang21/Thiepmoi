// Local UI test server: real Functions, temporary in-memory Blobs; no Netlify writes.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHarness } from './netlify-harness.mjs';

const root=fileURLToPath(new URL('../../site/',import.meta.url));
const harness=createHarness();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:4174');
  if(url.pathname.startsWith('/.netlify/functions/')){
   const handler=await harness.handler(url.pathname.split('/').at(-1));
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const response=await handler(new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  const requestPath=url.pathname==='/'||/^\/i\/[a-f0-9]{32}$/.test(url.pathname)?'/index.html':url.pathname==='/admin'?'/admin.html':decodeURIComponent(url.pathname);
  const file=path.resolve(root,'.'+requestPath);
  if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch(error){res.writeHead(404);res.end('Not found');}
});
server.listen(4174,'127.0.0.1',()=>console.log('Local photo test preview: http://127.0.0.1:4174/admin.html'));
