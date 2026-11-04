import { randomBytes } from 'node:crypto';
import { photoStore, authorized, send } from './_shared.mjs';

const MAX_BYTES=2*1024*1024;
const VALID_ID=/^[a-f0-9]{32}$/;
function jpegDimensions(bytes){
 if(bytes.length<128||bytes[0]!==0xff||bytes[1]!==0xd8||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9)return null;
 let position=2;
 while(position+3<bytes.length){
  if(bytes[position++]!==0xff)return null;
  while(bytes[position]===0xff)position++;
  const marker=bytes[position++];
  if(marker===0xda||marker===0xd9)return null;
  const length=(bytes[position]<<8)|bytes[position+1];
  if(length<2||position+length>bytes.length)return null;
  if([0xc0,0xc1,0xc2].includes(marker)){
   if(length<8)return null;
   const height=(bytes[position+3]<<8)|bytes[position+4],width=(bytes[position+5]<<8)|bytes[position+6];
   return width>0&&height>0&&width<=4000&&height<=4000?{width,height}:null;
  }
  position+=length;
 }
 return null;
}
export default async function handler(request){
 if(request.method==='POST'){
  if(!authorized(request))return send({error:'Nhập đúng mật khẩu quản trị để tải ảnh.'},401);
  if((request.headers.get('content-type')||'').split(';')[0].toLowerCase()!=='image/jpeg')return send({error:'Chỉ nhận ảnh JPG đã chỉnh trong Admin.'},415);
  if(Number(request.headers.get('content-length'))>MAX_BYTES)return send({error:'Ảnh tối đa 2 MB.'},413);
  try{
   const bytes=new Uint8Array(await request.arrayBuffer());
   if(bytes.byteLength>MAX_BYTES)return send({error:'Ảnh tối đa 2 MB.'},413);
   const dimensions=jpegDimensions(bytes);
   if(!dimensions)return send({error:'Ảnh JPG không hợp lệ hoặc kích thước quá lớn.'},415);
   const asset=randomBytes(16).toString('hex');
   await photoStore().set('photos/'+asset+'.jpg',bytes,{metadata:{mime:'image/jpeg',...dimensions,size:bytes.byteLength}});
   return send({ok:true,photoAsset:asset,url:'/.netlify/functions/photo?asset='+asset,...dimensions});
  }catch(error){console.error('HUIT photo upload:',error);return send({error:'Không thể lưu ảnh. Hãy thử lại.'},500);}
 }
 if(!['GET','HEAD'].includes(request.method))return send({error:'Phương thức không được hỗ trợ.'},405);
 const asset=new URL(request.url).searchParams.get('asset')||'';
 if(!VALID_ID.test(asset))return send({error:'Mã ảnh không hợp lệ.'},400);
 try{
  const data=await photoStore().get('photos/'+asset+'.jpg',{type:'arrayBuffer',consistency:'strong'});
  if(!data)return new Response(null,{status:404});
  return new Response(request.method==='HEAD'?null:data,{headers:{'Content-Type':'image/jpeg','Content-Length':String(data.byteLength),'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 }catch(error){console.error('HUIT photo:',error);return new Response(null,{status:503});}
}
