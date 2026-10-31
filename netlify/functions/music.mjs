import { audioStore } from './_shared.mjs';
export default async function handler(request){
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
  try{
    const data=await audioStore().get('background.mp3',{type:'arrayBuffer',consistency:'strong'});
    if(!data)return new Response('No uploaded music',{status:404});
    const size=data.byteLength;
    const headers={'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'};
    const range=request.headers.get('range');
    if(range){
      const m=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if(!m)return new Response(null,{status:416,headers:{...headers,'Content-Range':`bytes */${size}`}});
      let start=m[1]?Number(m[1]):0, end=m[2]?Number(m[2]):size-1;
      if(!m[1]&&m[2]){const last=Number(m[2]);start=Math.max(0,size-last);end=size-1;}
      if(start>size-1||start>end)return new Response(null,{status:416,headers:{...headers,'Content-Range':`bytes */${size}`}});
      end=Math.min(end,size-1);
      const sliced=data.slice(start,end+1);
      return new Response(request.method==='HEAD'?null:sliced,{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':String(end-start+1)}});
    }
    return new Response(request.method==='HEAD'?null:data,{headers:{...headers,'Content-Length':String(size)}});
  }catch(e){return new Response('Music not available',{status:503});}
}
