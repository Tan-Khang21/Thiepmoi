import { getSettings, dataStore } from './_shared.mjs';
const VALID_ID=/^[a-f0-9]{32}$/;
const HEADERS={'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const assignment=(key,value)=>'window.'+key+'='+JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';';
export default async function handler(request){
 if(request.method!=='GET')return new Response('Method not allowed',{status:405});
 const id=new URL(request.url).searchParams.get('invite');
 try{
  if(id!==null){
   if(!VALID_ID.test(id))return new Response(assignment('HUIT_INVITE_ERROR','Liên kết thiệp mời không hợp lệ.'),{headers:HEADERS});
   const record=await dataStore().get('invites/'+id,{type:'json',consistency:'strong'});
   if(!record||!record.settings)return new Response(assignment('HUIT_INVITE_ERROR','Thiệp mời này không tồn tại hoặc đã được thu hồi.'),{headers:HEADERS});
   return new Response(assignment('HUIT_LIVE_CONFIG',record.settings),{headers:HEADERS});
  }
  return new Response(assignment('HUIT_LIVE_CONFIG',await getSettings()),{headers:HEADERS});
 }catch(e){console.error('HUIT site-config:',e);return new Response(assignment('HUIT_INVITE_ERROR','Không thể tải thiệp mời lúc này.'),{headers:HEADERS});}
}
