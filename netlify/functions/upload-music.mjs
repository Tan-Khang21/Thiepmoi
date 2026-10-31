import { audioStore, authorized, send } from './_shared.mjs';
const MAX_BYTES=3*1024*1024;
export default async function handler(request){
  if(request.method!=='POST')return send({error:'Phương thức không được hỗ trợ.'},405);
  if(!authorized(request))return send({error:'Sai mật khẩu hoặc chưa cấu hình Netlify.'},401);
  const type=(request.headers.get('content-type')||'').split(';')[0].toLowerCase();
  if(!['audio/mpeg','audio/mp3','audio/x-mpeg','application/octet-stream'].includes(type))return send({error:'Chỉ nhận nhạc MP3.'},415);
  const size=Number(request.headers.get('content-length')||0);
  if(size>MAX_BYTES)return send({error:'File MP3 quá 3 MB.'},413);
  try{
    const bytes=await request.arrayBuffer();
    if(bytes.byteLength>MAX_BYTES||bytes.byteLength<128)return send({error:'MP3 phải từ 128 byte đến 3 MB.'},413);
    const header=new Uint8Array(bytes.slice(0,4));
    const valid=(header[0]===73&&header[1]===68&&header[2]===51)||(header[0]===255&&(header[1]&0xe0)===0xe0);
    if(!valid)return send({error:'Nội dung file không có định dạng MP3 hợp lệ.'},415);
    await audioStore().set('background.mp3',bytes,{metadata:{mime:'audio/mpeg'}});
    return send({ok:true,url:'/.netlify/functions/music',musicVersion:String(Date.now())});
  }catch(e){return send({error:'Không thể tải nhạc lên. Thử MP3 nhỏ hơn.'},500);}
}
