const OUTPUT_WIDTH=800,OUTPUT_HEIGHT=1000;
const DEFAULT_PHOTO='/assets/graduate-default.jpg';

export function cropGeometry(width,height,rotation,zoom,panX,panY){
 const quarter=((rotation%360)+360)%360;
 const rotatedWidth=quarter%180?height:width,rotatedHeight=quarter%180?width:height;
 const scale=Math.max(OUTPUT_WIDTH/rotatedWidth,OUTPUT_HEIGHT/rotatedHeight)*Math.max(1,Math.min(3,zoom));
 const limitX=Math.max(0,(rotatedWidth*scale-OUTPUT_WIDTH)/2);
 const limitY=Math.max(0,(rotatedHeight*scale-OUTPUT_HEIGHT)/2);
 return {scale,panX:Math.max(-limitX,Math.min(limitX,panX)),panY:Math.max(-limitY,Math.min(limitY,panY))};
}

export function createPhotoEditor({upload}){
 const $=id=>document.getElementById(id);
 const canvas=$('photoCanvas'),ctx=canvas.getContext('2d');
 const controls=$('photoControls'),editor=$('photoEditor'),preview=$('photoPreview');
 const defaultPhoto=preview.getAttribute('src')||DEFAULT_PHOTO;
 let asset='',pending=null,pendingURL='',source=null,loading=false,applying=false,generation=0,pointer=null,uploadPromise=null,drawFrame=0;
 let state;
 const message=(text,error=false)=>{$('photoStatus').textContent=text;$('photoStatus').classList.toggle('error',error);};
 function currentURL(){return pendingURL||(asset?'/.netlify/functions/photo?asset='+asset:defaultPhoto);}
 function clearSource(){
  cancelAnimationFrame(drawFrame);drawFrame=0;
  if(pointer&&canvas.hasPointerCapture(pointer.id))canvas.releasePointerCapture(pointer.id);
  canvas.classList.remove('moving');
  if(source){source.width=0;source.height=0;source=null;}
  pointer=null;editor.classList.add('hidden');controls.disabled=true;
 }
 function refreshPreview(){
  preview.hidden=false;
  preview.src=currentURL();
  $('photoPreviewLabel').textContent=pending?'Ảnh đã chỉnh · chờ lưu':asset?'Ảnh đang dùng cho thiệp':'Ảnh mặc định';
  $('photoDefault').disabled=!asset&&!pending;
 }
 preview.addEventListener('load',()=>{preview.hidden=false;});
 preview.addEventListener('error',()=>{
  if(preview.getAttribute('src')!==defaultPhoto){preview.src=defaultPhoto;message('Không tải được ảnh đã lưu. Hãy chọn ảnh khác hoặc dùng ảnh mặc định.',true);}
  else{preview.hidden=true;message('Chưa tải được ảnh mặc định. Bạn vẫn có thể chọn ảnh mới để chỉnh sửa.',true);}
 });
 function reset(){
  state={rotation:0,flip:1,zoom:1,panX:0,panY:0,brightness:100,contrast:100};
  $('photoZoom').value=100;$('photoBrightness').value=100;$('photoContrast').value=100;
  draw();
 }
 function render(target){
  const geometry=cropGeometry(source.width,source.height,state.rotation,state.zoom,state.panX,state.panY);
  state.panX=geometry.panX;state.panY=geometry.panY;
  const context=target.getContext('2d');
  context.save();context.setTransform(1,0,0,1,0,0);context.filter='none';
  context.fillStyle='#ffffff';context.fillRect(0,0,OUTPUT_WIDTH,OUTPUT_HEIGHT);
  context.translate(OUTPUT_WIDTH/2+state.panX,OUTPUT_HEIGHT/2+state.panY);
  context.scale(state.flip,1);context.rotate(state.rotation*Math.PI/180);
  context.scale(geometry.scale,geometry.scale);
  context.filter=`brightness(${state.brightness}%) contrast(${state.contrast}%)`;
  context.drawImage(source,-source.width/2,-source.height/2);context.restore();
 }
 function draw(){
  if(!source)return;
  render(canvas);
  $('photoZoomValue').textContent=Math.round(state.zoom*100)+'%';
  $('photoBrightnessValue').textContent=state.brightness+'%';
  $('photoContrastValue').textContent=state.contrast+'%';
 }
 function queueDraw(){if(!drawFrame)drawFrame=requestAnimationFrame(()=>{drawFrame=0;draw();});}
 async function loadImage(url,label,ownedURL=false){
  const token=++generation;loading=true;controls.disabled=true;
  editor.classList.remove('hidden');editor.setAttribute('aria-busy','true');
  message('Đang mở ảnh…');
  try{
   const image=new Image();image.src=url;await image.decode();
   if(token!==generation)return;
   if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>60000000)throw Error('Ảnh quá lớn. Hãy chọn ảnh dưới 60 megapixel.');
   const ratio=Math.min(1,2400/Math.max(image.naturalWidth,image.naturalHeight));
   const next=document.createElement('canvas');next.width=Math.max(1,Math.round(image.naturalWidth*ratio));next.height=Math.max(1,Math.round(image.naturalHeight*ratio));
   next.getContext('2d').drawImage(image,0,0,next.width,next.height);
   clearSource();source=next;editor.classList.remove('hidden');controls.disabled=false;reset();
   preview.hidden=false;preview.src=canvas.toDataURL('image/jpeg',.85);
   $('photoPreviewLabel').textContent='Ảnh đang chỉnh sửa';
   message(label+' · Kéo ảnh trong khung để chọn vị trí, sau đó bấm Áp dụng ảnh.');
   editor.scrollIntoView({block:'nearest',behavior:'instant'});canvas.focus({preventScroll:true});
  }catch(error){if(token===generation){
   controls.disabled=!source;if(!source){editor.classList.add('hidden');refreshPreview();}
   message(error.name==='EncodingError'?'Không đọc được ảnh. Hãy chọn JPG, PNG hoặc WebP hợp lệ.':error.message,true);
  }}
  finally{if(ownedURL)URL.revokeObjectURL(url);if(token===generation){loading=false;editor.removeAttribute('aria-busy');}}
 }
 $('photoFile').addEventListener('change',()=>{
  const file=$('photoFile').files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024||!file.size){
   message('Chọn ảnh JPG, PNG hoặc WebP, tối đa 15 MB.',true);$('photoFile').value='';return;
  }
  loadImage(URL.createObjectURL(file),file.name,true);
 });
 $('photoEditCurrent').addEventListener('click',()=>loadImage(currentURL(),'Ảnh hiện tại'));
 $('photoCancel').addEventListener('click',()=>{generation++;loading=false;clearSource();editor.removeAttribute('aria-busy');refreshPreview();$('photoFile').value='';message('Đã hủy chỉnh sửa. Ảnh đang dùng không thay đổi.');});
 $('photoDefault').addEventListener('click',()=>{setAsset('');message('Đã chọn ảnh mặc định. Bấm Lưu thiệp hoặc Lưu cấu hình chung để lưu lựa chọn này.');});
 $('photoReset').addEventListener('click',reset);
 $('photoRotateLeft').addEventListener('click',()=>{state.rotation=(state.rotation+270)%360;state.panX=state.panY=0;draw();});
 $('photoRotateRight').addEventListener('click',()=>{state.rotation=(state.rotation+90)%360;state.panX=state.panY=0;draw();});
 $('photoFlip').addEventListener('click',()=>{state.flip*=-1;draw();});
 $('photoZoom').addEventListener('input',e=>{state.zoom=Number(e.target.value)/100;queueDraw();});
 $('photoBrightness').addEventListener('input',e=>{state.brightness=Number(e.target.value);queueDraw();});
 $('photoContrast').addEventListener('input',e=>{state.contrast=Number(e.target.value);queueDraw();});
 canvas.addEventListener('pointerdown',e=>{
  if(!source||applying||!e.isPrimary||e.button!==0)return;
  const box=canvas.getBoundingClientRect();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,ratioX:OUTPUT_WIDTH/box.width,ratioY:OUTPUT_HEIGHT/box.height};
  canvas.setPointerCapture(e.pointerId);canvas.classList.add('moving');
 });
 canvas.addEventListener('pointermove',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  state.panX+=(e.clientX-pointer.x)*pointer.ratioX;state.panY+=(e.clientY-pointer.y)*pointer.ratioY;
  pointer.x=e.clientX;pointer.y=e.clientY;queueDraw();
 });
 const endPointer=()=>{pointer=null;canvas.classList.remove('moving');};
 canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);
 canvas.addEventListener('keydown',e=>{
  if(!source||applying||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();const step=e.shiftKey?40:12;
  state.panX+=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;
  state.panY+=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;draw();
 });
 $('photoApply').addEventListener('click',async()=>{
  if(!source||loading||applying)return;
  const token=generation;applying=true;controls.disabled=true;
  try{
   const output=document.createElement('canvas');output.width=OUTPUT_WIDTH;output.height=OUTPUT_HEIGHT;render(output);
   const blob=await new Promise(resolve=>output.toBlob(resolve,'image/jpeg',.9));
   output.width=output.height=0;
   if(token!==generation)return;
   if(!blob||blob.size>2*1024*1024)throw Error('Không thể xuất ảnh. Hãy thử ảnh khác.');
   if(pendingURL)URL.revokeObjectURL(pendingURL);
   pending=blob;pendingURL=URL.createObjectURL(blob);clearSource();refreshPreview();$('photoFile').value='';
   message('Đã áp dụng ảnh 800 × 1000. Ảnh sẽ được tải lên khi bạn lưu thiệp hoặc cấu hình chung.');
  }catch(error){message(error.message,true);}
  finally{applying=false;controls.disabled=!source||loading;}
 });
 function setAsset(value){
  generation++;loading=false;clearSource();editor.removeAttribute('aria-busy');asset=/^[a-f0-9]{32}$/.test(value)?value:'';
  pending=null;if(pendingURL)URL.revokeObjectURL(pendingURL);pendingURL='';$('photoFile').value='';refreshPreview();
 }
 function assertReady(){
  if(loading||applying)throw Error('Ảnh đang được xử lý. Vui lòng đợi một chút.');
  if(source)throw Error('Bấm Áp dụng ảnh hoặc Hủy chỉnh sửa trước khi lưu thiệp.');
 }
 async function ensureUploaded(){
  assertReady();if(uploadPromise)return uploadPromise;if(!pending)return asset;
  const token=generation,blob=pending;
  message('Đang tải ảnh đã chỉnh lên…');
  $('photoPanel').inert=true;
  uploadPromise=(async()=>{try{
   const uploaded=await upload(blob);
   if(!/^[a-f0-9]{32}$/.test(uploaded))throw Error('Máy chủ trả về mã ảnh không hợp lệ.');
   if(token===generation){
    asset=uploaded;pending=null;
    if(pendingURL)URL.revokeObjectURL(pendingURL);pendingURL='';refreshPreview();message('Ảnh đã được tải lên và sẵn sàng dùng trong thiệp.');
   }
   return uploaded;
  }catch(error){if(token===generation)message('Chưa tải được ảnh: '+error.message,true);throw error;}
  finally{$('photoPanel').inert=false;uploadPromise=null;}})();
  return uploadPromise;
 }
 if(!ctx)throw Error('Trình duyệt chưa hỗ trợ chỉnh sửa ảnh.');
 setAsset('');
 return {setAsset,assertReady,ensureUploaded};
}
