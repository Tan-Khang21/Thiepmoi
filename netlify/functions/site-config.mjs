import { getSettings } from './_shared.mjs';
export default async function handler(request){
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  try{
    const settings=await getSettings();
    const json=JSON.stringify(settings).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
    return new Response('window.HUIT_LIVE_CONFIG='+json+';',{
      headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'}
    });
  }catch(e){return new Response('window.HUIT_LIVE_CONFIG=null;',{
    headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'},status:503
  });}
}
