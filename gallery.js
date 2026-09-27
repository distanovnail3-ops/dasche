import * as THREE from './assets/three.module.js';
import { PHOTOS, PHOTO_INTERVAL } from './config.js';

export function createGallery(cat, renderer) {
  const $=id=>document.getElementById(id);
  const photo=new THREE.Group();photo.visible=false;cat.add(photo);
  const paper=new THREE.MeshStandardMaterial({color:'#fff9f2',roughness:.92});
  const shape=new THREE.Shape(),w=1.06,h=.79,r=.05;
  shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);
  shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);
  shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
  const card=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.01,bevelThickness:.01,bevelSegments:2,steps:1}),paper);
  card.castShadow=true;photo.add(card);
  const imageMaterial=new THREE.MeshBasicMaterial({transparent:true});
  const picture=new THREE.Mesh(new THREE.PlaneGeometry(1,1),imageMaterial);
  picture.position.set(0,.06,.052);photo.add(picture);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=100;
  const labelTexture=new THREE.CanvasTexture(canvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.166),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true}));
  label.position.set(0,-.66,.055);photo.add(label);
  let textures=[],index=0,pending=null,transition=0,age=0,paused=false,active=false,ready=false;
  const buttons=PHOTOS.map((item,i)=>{
    const button=document.createElement('button');button.className='photo-dot';
    button.setAttribute('aria-label',`Фото ${i+1}: ${item.alt}`);
    button.addEventListener('click',()=>request(i));$('photo-dots').appendChild(button);return button;
  });
  function display(next) {
    index=next;const texture=textures[index];imageMaterial.map=texture;imageMaterial.needsUpdate=true;
    // Fit the entire image inside the print: no stretching or cropped faces.
    const aspect=texture.image.width/texture.image.height,width=Math.min(1.94,1.27*aspect);
    picture.scale.set(width,width/aspect,1);
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1024,100);ctx.fillStyle='#846674';
    ctx.font='42px sans-serif';ctx.textAlign='center';ctx.fillText(PHOTOS[index].caption,512,64);labelTexture.needsUpdate=true;
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    $('photo-count').textContent=`${index+1} / ${PHOTOS.length}`;
    $('scene').setAttribute('aria-label',`Пушин держит фотографию: ${PHOTOS[index].alt}`);
  }
  function request(next) {
    if(!active||!ready||pending!==null)return;
    next=(next+textures.length)%textures.length;if(next===index)return;
    pending=next;transition=0;age=0;
  }
  $('photo-prev').addEventListener('click',()=>request(index-1));
  $('photo-next').addEventListener('click',()=>request(index+1));
  $('photo-pause').addEventListener('click',()=>{
    paused=!paused;age=0;
    $('photo-pause').setAttribute('aria-pressed',String(paused));
    $('photo-pause').setAttribute('aria-label',paused?'Продолжить смену фотографий':'Приостановить смену фотографий');
    $('photo-pause').textContent=paused?'▶':'Ⅱ';
  });
  window.addEventListener('keydown',event=>{
    if(!active||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='ArrowRight'){event.preventDefault();request(index+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();request(index-1);}
  });
  async function load() {
    $('start').disabled=true;$('hint').textContent='Пушин собирает фотографии…';
    try {
      const loader=new THREE.TextureLoader();
      textures=await Promise.all(PHOTOS.map(async item=>{
        const texture=await loader.loadAsync(item.src);texture.colorSpace=THREE.SRGBColorSpace;
        texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return texture;
      }));
      ready=true;display(0);$('scene').setAttribute('aria-label','Большой пухлый Пушин ждёт Дашу');
      $('hint').textContent='Со звуком будет ещё милее';$('start').disabled=false;
    }catch {
      $('hint').textContent='Не все фотографии загрузились. Обнови страницу, чтобы попробовать ещё.';
    }
  }
  function reset(){active=false;pending=null;transition=0;age=0;imageMaterial.opacity=1;if(ready)display(0);$('photo-controls').hidden=true;}
  function start(){active=true;$('photo-controls').hidden=false;}
  function update(dt,reduced){
    if(!active)return 0;
    if(!paused&&pending===null){age+=dt;if(age>=PHOTO_INTERVAL)request(index+1);}
    if(pending===null)return 0;
    transition+=dt;const progress=Math.min(transition/.9,1),dip=Math.sin(progress*Math.PI);
    imageMaterial.opacity=Math.min(1,Math.abs(progress-.5)*4);
    if(progress>=.5&&index!==pending)display(pending);
    if(!reduced){photo.position.y-=dip*.24;photo.rotation.x-=dip*.22;photo.rotation.y=Math.sin(progress*Math.PI*2)*.12;}
    if(progress>=1){pending=null;transition=0;imageMaterial.opacity=1;}
    return dip;
  }
  return {photo,load,reset,start,update};
}
