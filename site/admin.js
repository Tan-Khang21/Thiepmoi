(()=>{
'use strict';
const $=id=>document.getElementById(id);
const input=name=>document.querySelector(`[name="${name}"]`);
const fields=['studentName','graduationYear','dateDisplay','venue','address','mapQuery','recipientName','recipientRole','musicSource','musicUrl'];
let baseCfg={},musicVersion='',musicAsset='',editingId='',savedLink='',links=[],inviteRecords=[];
function status(message,type=''){const el=$('status');el.className='status '+type;el.textContent=message;}
function pwd(){return $('password').value;}
// Tên người nhận phải là tên thật, không phải câu xưng hô.
const normalizeGreeting=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
const greetingOnly=new Set(['than moi','than moi ban','kinh moi','kinh moi ban','tran trong kinh moi','ban than moi','kinh moi anh chi','kinh moi thay co']);
function badRecipient(name){return greetingOnly.has(normalizeGreeting(name));}
function addressee(name,role){
 let label='TRÂN TRỌNG KÍNH MỜI',display=name.trim();
 if(role==='Bạn'){label='THÂN MỜI BẠN';display=display.replace(/^Bạn\s+/i,'').trim();}
 else if(role==='Anh/Chị'){label=/^(Anh|Chị)\s+/i.test(display)?'TRÂN TRỌNG KÍNH MỜI':'TRÂN TRỌNG KÍNH MỜI ANH/CHỊ';}
 else if(role==='Thầy/Cô'){label=/^(Thầy|Cô)\s+/i.test(display)?'TRÂN TRỌNG KÍNH MỜI':'TRÂN TRỌNG KÍNH MỜI THẦY/CÔ';}
 else if(role==='Gia đình'){label=/^Gia\s*đình\s+/i.test(display)?'TRÂN TRỌNG KÍNH MỜI':'TRÂN TRỌNG KÍNH MỜI GIA ĐÌNH';}
 return {label,display};
}
function updateRecipientPreview(){
 const name=input('recipientName').value.trim(),role=input('recipientRole').value;
 const preview=$('recipientPreviewSalutation'),guest=$('recipientPreviewName'),note=$('recipientPreviewNote'),box=preview.closest('.invite-preview');
 const invalid=badRecipient(name);
 const r=addressee(invalid?'':name,role);
 preview.textContent=r.label; guest.textContent=invalid?'Cần nhập tên người nhận':(r.display||'Tên người nhận');
 note.textContent=invalid?'Bạn đang nhập lời chào vào ô tên. Hãy nhập tên khách, ví dụ: Nguyễn Văn A.':name?'Đây là cách nội dung sẽ xuất hiện trên thiệp.':'Nhập tên và chọn xưng hô để xem trước.';
 box.classList.toggle('error',invalid);
}

async function api(path,options={}){
 const headers={...options.headers};
 if(options.method&&options.method!=='GET' || ['invites'].includes(path.split('?')[0]))headers['x-admin-password']=pwd();
 const res=await fetch('/.netlify/functions/'+path,{...options,headers,cache:'no-store'});
 let result;try{result=await res.json();}catch{throw Error('API không phản hồi JSON. Kiểm tra Functions trên Netlify.');}
 if(!res.ok)throw Error(result.error||`Lỗi HTTP ${res.status}`);
 return result;
}
function collect(){
 const data={...baseCfg};for(const k of fields)if(input(k))data[k]=input(k).value.trim();
 data.musicVolume=Number($('musicVolume').value)/100;data.musicVersion=musicVersion;data.musicAsset=musicAsset;
 if(data.musicSource==='uploaded' && !musicVersion && !musicAsset)throw Error('Hãy tải lên MP3 trước khi chọn nguồn nhạc này.');
 return data;
}
function showMusic(){
 const source=input('musicSource').value;
 $('uploadPanel').classList.toggle('hidden',source!=='uploaded');$('urlPanel').classList.toggle('hidden',source!=='url');
 const audio=$('musicPreview');
 if(source==='uploaded')audio.src='/.netlify/functions/music'+(musicAsset?'?asset='+encodeURIComponent(musicAsset)+'&':'?')+'v='+encodeURIComponent(musicVersion||'1');
 else if(source==='url')audio.src=input('musicUrl').value.trim();
 else audio.removeAttribute('src');
 audio.volume=Number($('musicVolume').value)/100;audio.load();
}
function populate(config){
 for(const k of fields)if(input(k))input(k).value=config[k]??'';
 input('musicSource').value=config.musicSource||'default';
 $('musicVolume').value=Math.round((config.musicVolume??.22)*100);
 $('volumeText').textContent=$('musicVolume').value+'%';
 musicVersion=config.musicVersion||'';musicAsset=config.musicAsset||'';
 showMusic();updateRecipientPreview();
}
async function load(){try{const data=await api('config');baseCfg=data.settings;populate(baseCfg);status(data.ready?'Đã tải cấu hình. Nhập mật khẩu, tên khách và bấm Lưu thiệp.':'Đặt HUIT_ADMIN_PASSWORD trong Netlify trước khi lưu.',data.ready?'good':'bad');}catch(e){status(e.message,'bad');}}
function linkFor(id){return new URL('/i/'+id,location.origin).href;}
async function copy(text){try{await navigator.clipboard.writeText(text);status('Đã sao chép link.','good');}catch{window.prompt('Sao chép liên kết:',text);}}
function displayLink(id){savedLink=linkFor(id);$('savedLink').textContent=savedLink;$('savedLink').href=savedLink;$('savedResult').classList.remove('hidden');}
function startFresh(){editingId='';populate(baseCfg);input('recipientName').value='';input('recipientRole').value='';updateRecipientPreview();$('editBanner').textContent='Đang tạo thiệp mới. Mỗi lần lưu sẽ tạo một link riêng.';$('saveBtn').textContent='Lưu thiệp & lấy link riêng';$('savedResult').classList.add('hidden');input('recipientName').focus();}
async function save(){
 if(!pwd()){status('Hãy nhập mật khẩu quản trị.','bad');$('password').focus();return;}
 const name=input('recipientName').value.trim();
 if(!name){status('Hãy nhập tên người nhận trước khi lưu.','bad');input('recipientName').focus();return;}
 if(badRecipient(name)){status('“'+name+'” là lời mời, không phải tên người nhận. Hãy điền tên khách thật.','bad');input('recipientName').focus();updateRecipientPreview();return;}
 let data;try{data=collect();}catch(e){status(e.message,'bad');return;}
 $('saveBtn').disabled=true;status(editingId?'Đang cập nhật link hiện có...':'Đang lưu thiệp riêng và tạo đường link...');
 try{
  const response=await api('invites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editingId||undefined,settings:data})});
  editingId=response.invite.id;displayLink(editingId);$('editBanner').textContent='Đang chỉnh sửa thiệp của '+response.invite.settings.recipientName+'. Lưu lại sẽ giữ nguyên link này.';
  $('saveBtn').textContent='Lưu thay đổi cho link này';
  status('Đã lưu trên Netlify. Link bên trên đã sẵn sàng gửi cho người nhận.','good');
  await loadInvites(false);
 }catch(e){status(e.message,'bad');}finally{$('saveBtn').disabled=false;}
}
async function saveGlobal(){
 if(!pwd()){status('Hãy nhập mật khẩu quản trị.','bad');return;}
 $('saveGlobalBtn').disabled=true;
 try{
  const config=collect();config.recipientName='';config.recipientRole='';
  const res=await api('config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});
  baseCfg=res.settings;status('Đã lưu cấu hình chung cho trang chủ. Các thiệp cá nhân đã lưu không thay đổi.','good');
 }catch(e){status(e.message,'bad');}finally{$('saveGlobalBtn').disabled=false;}
}
async function loadInvites(showStatus=true){
 if(!pwd()){if(showStatus)status('Nhập mật khẩu trước khi tải danh sách.','bad');return;}
 try{const r=await api('invites');inviteRecords=r.invites;renderInvites();if(showStatus)status(`Đã tải ${inviteRecords.length} thiệp đã lưu.`,'good');}
 catch(e){if(showStatus)status(e.message,'bad');}
}
function renderInvites(){
 const list=$('savedInvites');list.replaceChildren();$('savedCount').textContent=inviteRecords.length+' thiệp';
 if(!inviteRecords.length){const p=document.createElement('div');p.className='muted';p.textContent='Chưa có thiệp được lưu.';list.append(p);return;}
 for(const invite of inviteRecords){
  const div=document.createElement('div');div.className='invite-entry';
  const title=document.createElement('strong');title.textContent=invite.settings.recipientName;
  const info=document.createElement('small');info.textContent='Lưu '+new Date(invite.updatedAt).toLocaleString('vi-VN');
  const row=document.createElement('div');row.className='row';
  const open=document.createElement('button');open.textContent='Xem';open.addEventListener('click',()=>window.open(linkFor(invite.id),'_blank','noopener'));
  const cp=document.createElement('button');cp.textContent='Sao chép';cp.addEventListener('click',()=>copy(linkFor(invite.id)));
  const edit=document.createElement('button');edit.textContent='Sửa';edit.addEventListener('click',()=>{editingId=invite.id;populate(invite.settings);displayLink(editingId);$('editBanner').textContent='Đang chỉnh sửa thiệp của '+invite.settings.recipientName+'. Lưu lại sẽ giữ nguyên link.';$('saveBtn').textContent='Lưu thay đổi cho link này';$('individualCard').scrollIntoView({behavior:'smooth',block:'start'});});
  const del=document.createElement('button');del.textContent='Xóa';del.className='delete';del.addEventListener('click',()=>removeInvite(invite));
  row.append(open,cp,edit,del);div.append(title,info,row);list.append(div);
 }
}
async function removeInvite(invite){
 if(!window.confirm('Xóa thiệp của '+invite.settings.recipientName+'? Link đã gửi sẽ không còn mở được.'))return;
 try{await api('invites?id='+encodeURIComponent(invite.id),{method:'DELETE'});if(editingId===invite.id)startFresh();status('Đã xóa thiệp và vô hiệu hóa link.','good');await loadInvites(false);}catch(e){status(e.message,'bad');}
}
async function upload(){
 const file=$('musicFile').files[0];if(!file){status('Hãy chọn MP3 trước.','bad');return;}
 const MAX=15*1024*1024,CHUNK=2*1024*1024;
 if(file.size>MAX||file.size<128||!/\.mp3$/i.test(file.name)){status('Chỉ nhận MP3 hợp lệ từ 128 byte đến 15 MB.','bad');return;}
 if(!pwd()){status('Nhập mật khẩu trước khi tải MP3.','bad');return;}
 const parts=Math.ceil(file.size/CHUNK),uploadId=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 const params={uploadId,parts,total:file.size};
 const endpoint=(action,part)=>'upload-music?action='+action+'&uploadId='+uploadId+'&parts='+parts+'&total='+file.size+(part===undefined?'':'&part='+part);
 $('uploadBtn').disabled=true;
 try{
  for(let part=0;part<parts;part++){
   status(`Đang tải nhạc ${part+1}/${parts} (${Math.round(part/parts*100)}%)...`);
   const body=await file.slice(part*CHUNK,Math.min(file.size,(part+1)*CHUNK)).arrayBuffer();
   await api(endpoint('chunk',part),{method:'POST',headers:{'Content-Type':'application/octet-stream'},body});
  }
  status('Đang ghép các phần MP3...');
  const result=await api(endpoint('commit'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params)});
  musicVersion=result.musicVersion;musicAsset=result.musicAsset||'';
  $('uploadInfo').textContent='Đã tải lên '+file.name+' ('+(file.size/1048576).toFixed(2)+' MB).';showMusic();status('Tải MP3 thành công. Bấm Lưu thiệp để gắn bản nhạc này cho link riêng.','good');
 }catch(e){status(e.message,'bad');api(endpoint('cancel'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params)}).catch(()=>{});}finally{$('uploadBtn').disabled=false;}
}
async function createLinks(){
 if(!pwd()){status('Nhập mật khẩu trước khi tạo link.','bad');return;}
 const names=[...new Set($('guestList').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean))].slice(0,100);
 if(!names.length){status('Hãy nhập danh sách khách mời.','bad');return;}
 const invalidNames=names.filter(badRecipient);if(invalidNames.length){status('Danh sách chứa lời chào thay cho tên: '+invalidNames.slice(0,3).join(', ')+'. Hãy sửa trước khi lưu.','bad');return;}
 if(!window.confirm('Lưu '+names.length+' thiệp riêng lên Netlify?'))return;
 let base;try{base=collect();}catch(e){status(e.message,'bad');return;}
 $('createLinks').disabled=true;links=[];let failed=[];
 const box=$('links');box.replaceChildren();
 try{
  for(let i=0;i<names.length;i++){
   const name=names[i];
   try{
    const r=await api('invites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:{...base,recipientName:name}})});
    const url=linkFor(r.invite.id);links.push({name,url});
    const row=document.createElement('div');row.className='link-row';const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=name;const cp=document.createElement('button');cp.textContent='Sao chép';cp.addEventListener('click',()=>copy(url));row.append(a,cp);box.append(row);
   }catch(e){failed.push(name+': '+e.message);}
   $('linkCount').textContent=`Đã lưu ${links.length}/${names.length} thiệp...`;
  }
  $('linkCount').textContent=`Đã lưu ${links.length}/${names.length} thiệp riêng`;
  status(failed.length?('Lưu được '+links.length+' thiệp; lỗi: '+failed.slice(0,2).join('; ')):'Đã lưu thành công '+links.length+' link riêng trên Netlify.',failed.length?'bad':'good');
  await loadInvites(false);
 }finally{$('createLinks').disabled=false;}
}
input('recipientName').addEventListener('input',updateRecipientPreview);
input('recipientRole').addEventListener('change',updateRecipientPreview);
$('saveBtn').addEventListener('click',save);
$('saveGlobalBtn').addEventListener('click',saveGlobal);
$('newInviteBtn').addEventListener('click',startFresh);
$('copySavedLink').addEventListener('click',()=>savedLink&&copy(savedLink));
$('openSavedLink').addEventListener('click',()=>savedLink&&window.open(savedLink,'_blank','noopener'));
$('loadInvites').addEventListener('click',()=>loadInvites(true));
$('password').addEventListener('change',()=>loadInvites(false));
$('uploadBtn').addEventListener('click',upload);
$('musicSource').addEventListener('change',showMusic);
input('musicUrl').addEventListener('change',showMusic);
$('musicVolume').addEventListener('input',e=>{$('volumeText').textContent=e.target.value+'%';$('musicPreview').volume=e.target.value/100;});
$('createLinks').addEventListener('click',createLinks);
$('copyLinks').addEventListener('click',()=>links.length?copy(links.map(a=>a.name+' — '+a.url).join('\n')):status('Chưa có link để sao chép.','bad'));
$('downloadCSV').addEventListener('click',()=>{
 if(!links.length){status('Chưa có link để xuất CSV.','bad');return;}
 const quote=s=>'"'+String(s).replace(/"/g,'""')+'"';
 const csv='\uFEFF'+['Tên khách,Link',...links.map(x=>quote(x.name)+','+quote(x.url))].join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='huit-links-da-luu.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
});
$('editBanner').textContent='Tạo thiệp mới. Khi lưu sẽ nhận một link riêng để gửi.';
updateRecipientPreview();load();
})();
