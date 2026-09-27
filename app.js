import * as THREE from './assets/three.module.js';
import { createPusheen } from './pusheen.js';
import { createGallery } from './gallery.js';
import { MUSIC_START } from './config.js';
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.1,100);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){$('error').hidden=false;$('start').disabled=true;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;$('scene').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff6fb,0x97868c,2.1));
const light=new THREE.DirectionalLight(0xfff4ed,2.6);light.position.set(-3,7,6);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7});light.shadow.bias=-.0003;light.shadow.normalBias=.015;light.shadow.radius=5;scene.add(light);
const rim=new THREE.DirectionalLight(0xffc1db,2);rim.position.set(4,3,-3);scene.add(rim);
const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x976077,opacity:.16}));floor.rotation.x=-Math.PI/2;floor.position.y=-.06;floor.receiveShadow=true;scene.add(floor);
const stage=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.2,.13,96),mat('#f5dae3'));stage.position.y=-.14;stage.receiveShadow=true;scene.add(stage);
const {cat,paws,arms,tail,eyes,ears}=createPusheen();scene.add(cat);
const gallery=createGallery(cat,renderer);const {photo}=gallery;gallery.load();
const heartShape=new THREE.Shape();heartShape.moveTo(0,.2);heartShape.bezierCurveTo(-.65,.9,-1,.1,0,-.65);heartShape.bezierCurveTo(1,.1,.65,.9,0,.2);
const heartGeometry=new THREE.ExtrudeGeometry(heartShape,{depth:.08,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,steps:1,curveSegments:12});
const particles=new THREE.Group();scene.add(particles);const colors=['#d7799c','#f3a7c5','#fff0f4','#b68cbb'];
for(let i=0;i<48;i++){let m=new THREE.Mesh(heartGeometry,mat(colors[i%4]));const scale=.07+Math.random()*.10;m.scale.setScalar(scale);m.userData={x:(Math.random()-.5)*9,y:Math.random()*8,z:-2+Math.random()*4,speed:.25+Math.random()*.5,spin:Math.random()*6};particles.add(m);}particles.visible=false;
const clock=new THREE.Clock();let phase='idle',elapsed=0,lastTime=0,muted=false,started=false,speechDone=false;let pointer={x:0,y:0};const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const song=$('song');song.volume=.85;
const smooth=(a,b,x)=>{const k=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return k*k*(3-2*k);};
function showBubble(text){$('bubble').textContent=text;$('bubble').classList.toggle('show',!!text);}
function soundState(){song.muted=muted||phase!=='celebrate';$('sound').textContent=muted?'♪':'♫';$('sound').setAttribute('aria-label',muted?'Включить звук':'Выключить звук');$('sound').setAttribute('aria-pressed',String(muted));$('sound').style.opacity=muted?'.55':'1';}
$('sound').addEventListener('click',()=>{muted=!muted;soundState();if(muted)window.speechSynthesis?.cancel();if(!muted&&phase==='celebrate'&&song.paused)song.play().catch(()=>$('music-retry').hidden=false);});
async function begin(){if(started)return;started=true;phase='waiting';elapsed=0;speechDone=false;gallery.reset();song.volume=.85;$('intro').classList.add('out');$('intro').setAttribute('aria-hidden','true');$('start-panel').hidden=true;$('end-panel').hidden=true;$('greeting').classList.remove('show');$('greeting').setAttribute('aria-hidden','true');$('music-retry').hidden=true;photo.visible=false;particles.visible=false;showBubble('');song.muted=true;try{song.currentTime=MUSIC_START;await song.play();}catch(e){/* The scene continues; offer a direct music gesture at the reveal. */} }
$('start').addEventListener('click',begin);
$('replay').addEventListener('click',()=>{window.speechSynthesis?.cancel();song.pause();started=false;begin();});
$('music-retry').addEventListener('click',async()=>{try{song.currentTime=MUSIC_START;song.muted=muted;await song.play();$('music-retry').hidden=true;}catch(e){$('music-retry').textContent='Не удалось загрузить песню. Попробовать ещё';}});
function celebrate(){phase='celebrate';gallery.start();showBubble('');$('greeting').classList.add('show');$('greeting').setAttribute('aria-hidden','false');$('end-panel').hidden=false;particles.visible=!reduced;song.currentTime=MUSIC_START;soundState();song.play().catch(()=>$('music-retry').hidden=false);
  if(!muted&&'speechSynthesis' in window){const line=new SpeechSynthesisUtterance('Даша! С годовщиной!');line.lang='ru-RU';line.rate=.86;line.pitch=1.3;const voices=speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.startsWith('ru'));if(voice)line.voice=voice;song.volume=.3;line.onend=line.onerror=()=>{speechDone=true;song.volume=.85;};speechSynthesis.speak(line);}else speechDone=true;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){song.pause();window.speechSynthesis?.cancel();}else if(started){lastTime=clock.getElapsedTime();if(phase==='celebrate')song.volume=.85;song.play().catch(()=>{if(phase==='celebrate')$('music-retry').hidden=false;});}});
song.addEventListener('ended',()=>{song.currentTime=MUSIC_START;song.play().catch(()=>$('music-retry').hidden=false);});
function resize(){const w=$('experience').clientWidth,h=$('experience').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;const distance=Math.max(10.6,4.9/(2*Math.tan(THREE.MathUtils.degToRad(17.5))*camera.aspect));camera.position.set(0,1.6+distance*.115,distance);camera.lookAt(0,1.6,0);camera.updateProjectionMatrix();}resize();window.addEventListener('resize',resize);
window.addEventListener('pointermove',e=>{pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2;});
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime(),dt=Math.min(t-lastTime,.07);lastTime=t;if(document.hidden)return;if(started)elapsed+=dt;cat.scale.set(1,1+Math.sin(t*1.6)*.012,1);cat.position.set(0,0,0);cat.rotation.set(0,-.13+Math.sin(t*.5)*.04,0);tail.rotation.set(Math.sin(t*1.8)*.025,0,0);arms.forEach((a,i)=>{a.position.set((i?1:-1)*1.34,1,.67);a.rotation.set(0,0,0);});paws.forEach(p=>p.position.y=.19);ears.forEach((e,i)=>e.rotation.z=Math.sin(t*1.2+i)*.015);const blink=Math.sin(t*.73)>.994?.13:1;eyes.forEach(e=>e.scale.y=.080*blink);
  if(started){const notice=smooth(2.0,2.6,elapsed);cat.rotation.y=THREE.MathUtils.lerp(-.2,0,notice);cat.rotation.z=Math.sin(smooth(2.5,3.5,elapsed)*Math.PI)*-.12;eyes.forEach(e=>e.scale.y=.080*(elapsed>2&&elapsed<3.9?1.35:blink));
    if(elapsed>2.2&&phase==='waiting'){phase='noticed';showBubble('Даша?..');}
    if(elapsed>3.7&&phase==='noticed'){phase='reaching';showBubble('Это тебе ♡');}
    const reach=Math.sin(smooth(3.7,5.3,elapsed)*Math.PI);cat.rotation.y-=reach*.35;arms[1].rotation.x=-reach*1.8;arms[1].rotation.z=-reach*.7;
    if(elapsed>4.6){photo.visible=true;const lift=smooth(4.6,6.4,elapsed);photo.position.set(THREE.MathUtils.lerp(1.5,0,lift),THREE.MathUtils.lerp(.1,.91,lift),THREE.MathUtils.lerp(-.5,1.42,lift));photo.rotation.set(THREE.MathUtils.lerp(-.4,-.08,lift),THREE.MathUtils.lerp(1.5,0,lift),THREE.MathUtils.lerp(-.5,-.075,lift));photo.scale.setScalar(THREE.MathUtils.lerp(.35,1,lift));arms[0].rotation.z=-lift*.70;arms[1].rotation.z=lift*.70;arms[0].rotation.x=arms[1].rotation.x=-lift*.15;arms.forEach((a,i)=>{a.position.set((i?1:-1)*THREE.MathUtils.lerp(1.34,1.04,lift),THREE.MathUtils.lerp(1,.96,lift),THREE.MathUtils.lerp(.67,1.47,lift));a.rotation.z=-(i?1:-1)*lift*.40;});}
    if(elapsed>6.5&&phase!=='celebrate')celebrate();
    if(phase==='celebrate'){const d=elapsed-6.5,amplitude=reduced?.24:1,beat=d*4.1;cat.rotation.z=Math.sin(beat)*.085*amplitude;cat.rotation.y=Math.sin(beat*.5)*.18*amplitude;cat.position.y=Math.abs(Math.sin(beat))*.105*amplitude;cat.position.x=Math.sin(beat*.5)*.16*amplitude;cat.scale.y=1-Math.abs(Math.sin(beat))*.035*amplitude;tail.rotation.z=Math.sin(beat)*.025*amplitude;photo.rotation.z=-.055+Math.sin(beat+.5)*.045*amplitude;arms[0].rotation.z-=Math.sin(beat)*.08*amplitude;arms[1].rotation.z+=Math.sin(beat)*.08*amplitude;paws.forEach((p,i)=>p.position.y=.19+Math.max(0,Math.sin(beat+i*Math.PI))*.11*amplitude);if(!speechDone&&d>5)song.volume=.85;const dip=gallery.update(dt,reduced);if(!reduced)arms.forEach(a=>a.position.y-=dip*.18);
      for(const m of particles.children){const q=m.userData;m.visible=!reduced;m.position.set(q.x+Math.sin(d+q.spin)*.3,((q.y+d*q.speed)%8)-.5,q.z);m.rotation.set(0,Math.sin(d*.3+q.spin)*.7,Math.sin(d+q.spin)*.3);}
    }
  }else{cat.rotation.y+=pointer.x*.07;}
  renderer.render(scene,camera);
}animate();
