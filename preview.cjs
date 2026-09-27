// Optional local preview. Requires Node.js; no npm install is needed.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const port=Number(process.env.PORT)||4184;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp3':'audio/mpeg','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(req.url.split('?')[0]);}catch{res.writeHead(400).end();return;}
  if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(file,(error,stat)=>{
    if(error||!stat.isFile()){res.writeHead(404).end();return;}
    const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start=0,end=stat.size-1,status=200;
    if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;
      if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(file,{start,end}).pipe(res);
  });
}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}`));
