(()=>{
'use strict';
const $=id=>document.getElementById(id);
const input=name=>document.querySelector(`[name="${name}"]`);
let cfg={},links=[],musicVersion='',hasUploaded=false;
const fields=['studentName','graduationYear','dateDisplay','venue','address','mapQuery','recipientName','recipientRole','musicSource','musicUrl'];
function status(message,type=''){const el=$('status');el.className='status '+type;el.textContent=message;}
async function api(path,options={}){
 const headers={...options.headers};
 if(options.method&&options.method!=='GET')headers['x-admin-password']=$('password').value;
 const res=await fetch('/.netlify/functions/'+path,{...options,headers,cache:'no-store'});
 let result;try{result=await res.json();}catch(e){throw Error('API không trả về JSON. Hãy kiểm tra Functions trên Netlify.');}
 if(!res.ok)throw Error(result.error||`Lỗi HTTP ${res.status}`);
 return result;
}
function showMusic(){
 $('uploadPanel').classList.toggle('hidden',input('musicSource').value!=='uploaded');
 $('urlPanel').classList.toggle('hidden',input('musicSource').value!=='url');
 const audio=$('musicPreview');
 if(input('musicSource').value==='uploaded')audio.src='/.netlify/functions/music?v='+encodeURIComponent(musicVersion||'1');
 else if(input('musicSource').value==='url')audio.src=input('musicUrl').value.trim();
 else audio.removeAttribute('src');
 audio.load();
}
function populate(){
 for(const k of fields)if(input(k))input(k).value=cfg[k]??'';
 input('musicSource').value=cfg.musicSource||'default';
 $('musicVolume').value=Math.round((cfg.musicVolume??.22)*100);
 $('volumeText').textContent=$('musicVolume').value+'%';
 musicVersion=cfg.musicVersion||'';
 showMusic();
}
async function load(){try{const data=await api('config');cfg=data.settings;populate();status(data.ready?'Đã tải cấu hình từ Netlify. Nhập mật khẩu để lưu thay đổi.':'Đặt HUIT_ADMIN_PASSWORD (tối thiểu 12 ký tự) trong Netlify trước khi lưu.',data.ready?'good':'bad');}catch(e){status(e.message,'bad');}}
async function save(){
 if(!$('password').value){status('Bạn cần nhập mật khẩu quản trị.','bad');$('password').focus();return;}
 const data={...cfg};for(const k of fields)if(input(k))data[k]=input(k).value.trim();
 data.musicVolume=Number($('musicVolume').value)/100;
 if(data.musicSource==='uploaded'&&!musicVersion){status('Bạn cần tải lên MP3 trước khi chọn chế độ này.','bad');return;}
 data.musicVersion=musicVersion;
 $('saveBtn').disabled=true;status('Đang lưu thay đổi lên website...');
 try{const res=await api('config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});cfg=res.settings;status('Đã lưu! Mở trang Public hoặc tải lại trang để xem cập nhật.','good');}
 catch(e){status(e.message,'bad');}finally{$('saveBtn').disabled=false;}
}
async function upload(){
 const file=$('musicFile').files[0];
 if(!file){status('Hãy chọn file MP3 trước.','bad');return;}
 if(file.size>3*1024*1024){status('MP3 quá 3 MB. Hãy nén hoặc chọn bài khác.','bad');return;}
 if(!$('password').value){status('Nhập mật khẩu trước khi tải MP3.','bad');return;}
 $('uploadBtn').disabled=true;status('Đang tải MP3 lên Netlify...');
 try{
   const bytes=await file.arrayBuffer();const res=await api('upload-music',{method:'POST',headers:{'Content-Type':'audio/mpeg'},body:bytes});
   musicVersion=res.musicVersion;hasUploaded=true;
   $('uploadInfo').textContent=`Đã tải: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB).`;
   showMusic();status('MP3 đã tải lên. Bấm “Lưu thay đổi lên website” để áp dụng cho khách.','good');
 }catch(e){status(e.message,'bad');}finally{$('uploadBtn').disabled=false;}
}
function buildLinks(){
 const names=$('guestList').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 links=names.map(name=>{const url=new URL('/',location.origin);url.searchParams.set('to',name);const role=input('recipientRole').value;if(role)url.searchParams.set('role',role);return {name,url:url.href};});
 const box=$('links');box.replaceChildren();
 for(const item of links){const div=document.createElement('div');div.className='link-row';const a=document.createElement('a');a.href=item.url;a.textContent=item.name;a.target='_blank';a.rel='noopener';const b=document.createElement('button');b.textContent='Sao chép';b.addEventListener('click',()=>navigator.clipboard.writeText(item.url).catch(()=>status('Không sao chép được link.','bad')));div.append(a,b);box.append(div);}
 $('linkCount').textContent=`Đã tạo ${links.length} đường link riêng.`;
}
$('saveBtn').addEventListener('click',save);
$('uploadBtn').addEventListener('click',upload);
$('musicSource').addEventListener('change',showMusic);
input('musicUrl').addEventListener('change',showMusic);
$('musicVolume').addEventListener('input',e=>{$('volumeText').textContent=e.target.value+'%';$('musicPreview').volume=e.target.value/100;});
$('createLinks').addEventListener('click',buildLinks);
$('copyLinks').addEventListener('click',()=>navigator.clipboard.writeText(links.map(a=>a.name+' — '+a.url).join('\n')).then(()=>status('Đã sao chép danh sách link.','good')).catch(()=>status('Sao chép thất bại.','bad')));
$('downloadCSV').addEventListener('click',()=>{
 const lines=['"Tên khách","Link"',...links.map(x=>'"'+x.name.replace(/"/g,'""')+'","'+x.url.replace(/"/g,'""')+'"')];
 const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='huit-danh-sach-khach-moi.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
load();
})();
