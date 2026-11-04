import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

const root=fileURLToPath(new URL('../',import.meta.url));
const start='<!-- ADMIN_RUNTIME_START -->',end='<!-- ADMIN_RUNTIME_END -->';

export async function buildAdmin(){
 const [html,photo,admin,portrait]=await Promise.all([
  readFile(resolve(root,'site/admin.html'),'utf8'),
  readFile(resolve(root,'site/photo-editor.js'),'utf8'),
  readFile(resolve(root,'site/admin.js'),'utf8'),
  readFile(resolve(root,'site/assets/graduate-default.jpg')),
 ]);
 if(!html.includes(start)||!html.includes(end))throw Error('Admin runtime markers are missing.');
 const photoRuntime=photo.replace(/^export (?=function )/gm,'');
 const runtime=`(()=>{\n'use strict';\ntry{\n${photoRuntime}\n${admin}\n}catch(error){\n console.error('Admin initialization failed',error);\n const status=document.getElementById('photoStatus');\n status.textContent='Không khởi tạo được bộ chỉnh ảnh: '+error.message;status.classList.add('error');\n}\n})();`;
 new Script(runtime,{filename:'admin-inline.js'});
 const script=`<script id="adminRuntime">\n${runtime.replace(/<\/script/gi,'<\\/script')}\n</script>`;
 const from=html.indexOf(start)+start.length,to=html.indexOf(end,from);
 if(to<from)throw Error('Admin runtime markers are out of order.');
 const output=(html.slice(0,from)+'\n'+script+'\n'+html.slice(to))
  .replace(/(<img\b[^>]*\bid="photoPreview"[^>]*\bsrc=")[^"]*(")/,`$1data:image/jpeg;base64,${portrait.toString('base64')}$2`);
 if(output===html)return false;
 await writeFile(resolve(root,'site/admin.html'),output);
 return true;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const changed=await buildAdmin();
 console.log(changed?'Built self-contained Admin (photo editor and default portrait included).':'Admin bundle is up to date.');
}
