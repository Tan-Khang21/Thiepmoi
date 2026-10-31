import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

export const DEFAULTS = {
  studentName:'Một sinh viên HUIT', graduationYear:'2026',
  dateDisplay:'Ngày và giờ sẽ được cập nhật',
  venue:'Cơ sở chính HUIT (cập nhật theo địa điểm tổ chức)',
  address:'140 Lê Trọng Tấn, Phường Tây Thạnh, TP. Hồ Chí Minh',
  mapQuery:'Trường Đại học Công Thương TP. Hồ Chí Minh, 140 Lê Trọng Tấn, Phường Tây Thạnh, TP. Hồ Chí Minh',
  recipientName:'', recipientRole:'', musicVolume:0.22, musicEnabled:true,
  musicSource:'default', musicUrl:'', musicVersion:''
};
export const JSON_HEADERS={ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' };
export const send=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
export const dataStore=()=>getStore('huit-invitation-settings');
export const audioStore=()=>getStore('huit-invitation-audio');
export const getSettings=async()=>({ ...DEFAULTS, ...(await dataStore().get('settings',{type:'json',consistency:'strong'}) || {}) });
export function authorized(request){
  const expected=process.env.HUIT_ADMIN_PASSWORD||'';
  const supplied=request.headers.get('x-admin-password')||'';
  if(expected.length<12 || supplied.length===0)return false;
  const a=Buffer.from(expected),b=Buffer.from(supplied);
  return a.length===b.length && timingSafeEqual(a,b);
}
export function sanitize(input,current=DEFAULTS){
  if(!input || typeof input!=='object' || Array.isArray(input))throw Error('Dữ liệu không hợp lệ.');
  const result={...current};
  const rules={studentName:120,graduationYear:8,dateDisplay:160,venue:180,address:240,mapQuery:300,recipientName:120,recipientRole:50,musicUrl:600};
  for(const [key,max] of Object.entries(rules)){
    if(key in input){
      if(typeof input[key]!=='string')throw Error('Giá trị '+key+' không hợp lệ.');
      result[key]=input[key].replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,max);
    }
  }
  if('musicVolume' in input){
    const vol=Number(input.musicVolume);if(!Number.isFinite(vol))throw Error('Âm lượng không hợp lệ.');
    result.musicVolume=Math.round(Math.min(1,Math.max(0,vol))*100)/100;
  }
  if('musicSource' in input){
    if(!['default','uploaded','url','off'].includes(input.musicSource))throw Error('Nguồn nhạc không hợp lệ.');
    result.musicSource=input.musicSource;
  }
  if(result.musicSource==='url' && !/^https:\/\/[^\s]+$/i.test(result.musicUrl))throw Error('Link nhạc phải bắt đầu bằng https://');
  if('musicEnabled' in input)result.musicEnabled=Boolean(input.musicEnabled);
  result.musicEnabled=result.musicSource!=='off';
  if('musicVersion' in input){result.musicVersion=String(input.musicVersion||'').slice(0,36).replace(/[^a-zA-Z0-9_-]/g,'');}
  return result;
}
