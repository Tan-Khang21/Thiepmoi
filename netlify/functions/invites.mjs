import { randomBytes } from 'node:crypto';
import { dataStore, authorized, getSettings, sanitize, send } from './_shared.mjs';

const VALID_ID=/^[a-f0-9]{32}$/;
const KEY=id=>`invites/${id}`;
const reject=(msg,status=400)=>send({error:msg},status);
export default async function handler(request){
  if(!authorized(request))return reject('Bạn cần nhập đúng mật khẩu quản trị.',401);
  const store=dataStore(),params=new URL(request.url).searchParams;
  try{
    if(request.method==='GET'){
      const {blobs}=await store.list({prefix:'invites/'});
      const records=(await Promise.all(blobs.filter(b=>VALID_ID.test(b.key.slice(8))).map(b=>store.get(b.key,{type:'json',consistency:'strong'})))).filter(Boolean);
      records.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
      return send({ok:true,invites:records});
    }
    if(request.method==='POST'){
      const raw=await request.text();if(raw.length>12000)return reject('Dữ liệu thiệp quá lớn.',413);
      const body=JSON.parse(raw);
      if(!body || typeof body!=='object' || !body.settings || typeof body.settings!=='object')return reject('Thiếu nội dung thiệp.');
      const requestedId=body.id||'';
      if(requestedId && (typeof requestedId!=='string'||!VALID_ID.test(requestedId)))return reject('Mã thiệp không hợp lệ.');
      const existing=requestedId ? await store.get(KEY(requestedId),{type:'json',consistency:'strong'}) : null;
      if(requestedId && !existing)return reject('Thiệp đã bị xóa hoặc không tồn tại.',404);
      const settings=sanitize(body.settings,await getSettings());
      if(!settings.recipientName.trim())return reject('Hãy nhập tên người nhận để tạo link riêng.');
      const greetingOnly=new Set(['than moi','than moi ban','kinh moi','kinh moi ban','tran trong kinh moi','ban than moi','kinh moi anh chi','kinh moi thay co']);
      const normalized=settings.recipientName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
      if(greetingOnly.has(normalized))return reject('Đây là lời chào, không phải tên người nhận. Hãy nhập tên khách thật.');
      const id=requestedId || randomBytes(16).toString('hex');
      const now=new Date().toISOString();
      const invite={id,settings,createdAt:existing?.createdAt||now,updatedAt:now};
      await store.setJSON(KEY(id),invite);
      return send({ok:true,invite,created:!requestedId,publicPath:'/i/'+id});
    }
    if(request.method==='DELETE'){
      const id=params.get('id')||'';if(!VALID_ID.test(id))return reject('Mã thiệp không hợp lệ.');
      const prior=await store.get(KEY(id),{type:'json',consistency:'strong'});
      if(!prior)return reject('Không tìm thấy thiệp.',404);
      await store.delete(KEY(id));
      return send({ok:true});
    }
    return reject('Phương thức không được hỗ trợ.',405);
  }catch(e){
    console.error('HUIT invites:',e);
    if(e instanceof SyntaxError)return reject('JSON không hợp lệ.');
    return reject('Không thể xử lý thiệp. Kiểm tra Functions Logs.',500);
  }
}
