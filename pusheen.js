import * as THREE from './assets/three.module.js';

export function createPusheen() {
  const cat = new THREE.Group();
  const mat = color => new THREE.MeshStandardMaterial({ color, roughness: .94 });
  const fur = new THREE.MeshPhysicalMaterial({ color: '#a79e97', roughness: .94, sheen: .45, sheenColor: '#d7c9bf' });
  const dark = mat('#64564f'), ink = mat('#443630'), pink = mat('#dc9a9d');
  const sphere = new THREE.SphereGeometry(1, 40, 28);
  function oval(parent, material, position, scale) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(...position); mesh.scale.set(...scale);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function stroke(parent, points, material, radius = .025) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 32, radius, 10, false), material);
    parent.add(mesh);
    for (const point of [points[0], points.at(-1)]) oval(parent, material, point, [radius, radius, radius]);
    return mesh;
  }
  // A broad pear-shaped body with a gently flattened crown and plush depth.
  const profile = new THREE.CatmullRomCurve3([
    [0, .16], [.75, .16], [1.24, .23], [1.52, .50], [1.64, .98],
    [1.60, 1.65], [1.47, 2.23], [1.22, 2.62], [.80, 2.79], [0, 2.86],
  ].map(([x,y]) => new THREE.Vector3(x,y,0)), false, 'centripetal');
  const outline = profile.getPoints(100).map(p => new THREE.Vector2(Math.max(0,p.x),p.y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(outline,96),fur);
  body.scale.z = .69; body.castShadow = body.receiveShadow = true; cat.add(body);
  function radiusAt(y) {
    for(let i=1;i<outline.length;i++) {
      const a=outline[i-1],b=outline[i];
      if(y>=a.y&&y<=b.y) return THREE.MathUtils.lerp(a.x,b.x,(y-a.y)/(b.y-a.y||1));
    }
    return .01;
  }
  const front = (x,y) => Math.sqrt(Math.max(0,radiusAt(y)**2-x**2))*.69;
  // Conforming patches sit on the fur instead of protruding like little rods.
  function patch(x,y,width,height,rotation=0) {
    const points=[],indices=[],rows=24,cols=10,r=width/2;
    for(let row=0;row<=rows;row++) {
      const py=-height/2+row/rows*height;
      const cap=Math.max(0,Math.abs(py)-(height/2-r));
      const half=Math.sqrt(Math.max(0,r*r-cap*cap));
      for(let col=0;col<=cols;col++) {
        const px=(col/cols*2-1)*half;
        const xx=x+px*Math.cos(rotation)-py*Math.sin(rotation);
        const yy=y+px*Math.sin(rotation)+py*Math.cos(rotation);
        points.push(xx,yy,front(xx,yy)+.009);
      }
    }
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++) {
      const a=row*(cols+1)+col,b=a+cols+1;
      indices.push(a,a+1,b,a+1,b+1,b);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    geo.setIndex(indices);geo.computeVertexNormals();cat.add(new THREE.Mesh(geo,dark));
  }
  const ears=[];
  for(const side of [-1,1]) {
    const group=new THREE.Group();group.position.set(side*1.03,2.43,-.025);
    const points=[[0,-.05],[.32,-.04],[.32,.10],[.24,.33],[.11,.59],[.045,.65],[0,.66]].map(p=>new THREE.Vector2(...p));
    const geo=new THREE.LatheGeometry(points,48),pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++)pos.setX(i,pos.getX(i)+side*pos.getY(i)*.14);
    geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,fur);mesh.scale.z=.78;mesh.castShadow=mesh.receiveShadow=true;
    group.add(mesh);cat.add(group);ears.push(group);
  }
  for(const x of [-.34,0,.34])patch(x,2.63,.125,.39,x*-.12);
  for(const side of [-1,1]) {
    patch(side*1.40,1.48,.12,.35,side*1.07);
    patch(side*1.43,1.16,.12,.31,side*1.13);
  }
  const paws=[];
  for(const side of [-1,1]) {
    const foot=new THREE.Group();foot.position.set(side*.85,.19,.69);
    oval(foot,fur,[0,0,0],[.39,.25,.44]);
    for(const x of [-.09,.09])stroke(foot,[[x,.04,.414],[x,-.025,.438]],dark,.012);
    cat.add(foot);paws.push(foot);
  }
  const arms=[];
  for(const side of [-1,1]) {
    const arm=new THREE.Group();arm.position.set(side*1.34,1,.67);
    oval(arm,fur,[0,-.05,0],[.255,.36,.27]);cat.add(arm);arms.push(arm);
  }
  const tail=new THREE.Group();cat.add(tail);
  const path=new THREE.CatmullRomCurve3([[1.25,.48,-.32],[1.85,.35,-.25],[2.23,.46,-.16],[2.43,.73,-.10],[2.37,.95,-.08]].map(p=>new THREE.Vector3(...p)));
  const tube=new THREE.Mesh(new THREE.TubeGeometry(path,64,.225,24,false),fur);
  tube.castShadow=tube.receiveShadow=true;tail.add(tube);
  oval(tail,fur,path.getPoint(1).toArray(),[.225,.225,.225]);
  for(const center of [.30,.55,.79]) {
    const bandPath=new THREE.CatmullRomCurve3(Array.from({length:12},(_,i)=>path.getPoint(center-.042+i/11*.084)));
    tail.add(new THREE.Mesh(new THREE.TubeGeometry(bandPath,16,.227,24,false),dark));
  }
  const eyes=[];
  for(const side of [-1,1]) {
    const x=side*.56,y=2.17;
    eyes.push(oval(cat,ink,[x,y,front(x,y)+.018],[.073,.080,.032]));
    oval(cat,pink,[side*.83,1.96,front(side*.83,1.96)+.008],[.16,.067,.012]);
    for(let i=0;i<2;i++)stroke(cat,[[side*1.09,2.13-i*.17,front(1.09,2.13-i*.17)+.028],[side*1.40,2.15-i*.21,.81],[side*1.70,2.17-i*.25,.80]],ink,.024);
  }
  oval(cat,ink,[0,2.06,front(0,2.06)+.021],[.052,.032,.02]);
  for(const side of [-1,1])stroke(cat,[[0,2.04,front(0,2.04)+.025],[side*.044,1.94,front(.044,1.94)+.025],[side*.115,1.935,front(.115,1.935)+.025],[side*.17,1.99,front(.17,1.99)+.025]],ink,.021);
  return {cat,body,ears,paws,arms,tail,eyes};
}
