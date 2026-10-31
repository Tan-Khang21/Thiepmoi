import { dataStore, getSettings, authorized, sanitize, send } from './_shared.mjs';
export default async function handler(request){
  if(request.method==='GET'){
    try{return send({ settings:await getSettings(), ready:Boolean(process.env.HUIT_ADMIN_PASSWORD&&process.env.HUIT_ADMIN_PASSWORD.length>=12) });}
    catch(e){return send({error:'Không thể tải cấu hình.'},500);}
  }
  if(request.method!=='POST')return send({error:'Phương thức không được hỗ trợ.'},405);
  if(!authorized(request))return send({error:'Sai mật khẩu quản trị hoặc chưa đặt HUIT_ADMIN_PASSWORD trong Netlify.'},401);
  try{
    const body=await request.text();if(body.length>12000)return send({error:'Dữ liệu quá lớn.'},413);
    const incoming=JSON.parse(body);
    const settings=sanitize(incoming,await getSettings());
    await dataStore().setJSON('settings',settings);
    return send({ok:true,settings});
  }catch(e){return send({error:e instanceof SyntaxError?'JSON không hợp lệ.':String(e.message||'Lưu thất bại.')},400);}
}
