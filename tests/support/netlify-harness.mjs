import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';

export const TEST_PASSWORD='local-photo-test-password';
export function createHarness(){
 const stores=new Map(),modules=new Map();
 const context=vm.createContext({Request,Response,Headers,URL,Uint8Array,ArrayBuffer,Buffer,console,process:{env:{HUIT_ADMIN_PASSWORD:TEST_PASSWORD}}});
 const sdk=new vm.SyntheticModule(['getStore'],function(){this.setExport('getStore',name=>{
  if(!stores.has(name))stores.set(name,new Map());
  const records=stores.get(name);
  return {
   async set(key,data,options){records.set(key,{bytes:new Uint8Array(data).slice(),metadata:options?.metadata});},
   async setJSON(key,data){records.set(key,{json:structuredClone(data)});},
   async get(key,options){const record=records.get(key);if(!record)return null;return options?.type==='json'?structuredClone(record.json):record.bytes.slice().buffer;},
   async delete(key){records.delete(key);},
   async list({prefix}){return {blobs:[...records.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key}))};}
  };
 });},{context});
 const crypto=new vm.SyntheticModule(['randomBytes','timingSafeEqual'],function(){this.setExport('randomBytes',randomBytes);this.setExport('timingSafeEqual',timingSafeEqual);},{context});
 function load(url){
  const key=url.href;
  if(!modules.has(key))modules.set(key,(async()=>{
   const module=new vm.SourceTextModule(await readFile(url,'utf8'),{context,identifier:key});
   await module.link((specifier,parent)=>specifier==='@netlify/blobs'?sdk:specifier==='node:crypto'?crypto:load(new URL(specifier,parent.identifier)));
   return module;
  })());
  return modules.get(key);
 }
 return {async handler(name){
  if(!['photo','config','invites','site-config'].includes(name))throw Error('Unknown test function');
  const module=await load(new URL('../../netlify/functions/'+name+'.mjs',import.meta.url));
  if(module.status==='linked')await module.evaluate();
  return module.namespace.default;
 },stores};
}
