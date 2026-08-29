import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createServer as createViteServer} from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import {adaptTeamSource,bridgeHtml} from './team-adapter.mjs';

const aRoot=path.dirname(fileURLToPath(import.meta.url)),repo=path.dirname(aRoot);
const aOrigin='http://127.0.0.1:8080';
const members=[
  {role:'BUYER',folder:'B/web',port:8081,entry:'/src/main.jsx'},
  {role:'MERCHANT',folder:'directory/frontend',port:8082,entry:'/src/main.js'},
  {role:'ADMIN',folder:'E/frontend',port:8083,entry:'/src/main.js'}
];
const targets={},servers=[];
const dependencies=JSON.parse(await readFile(path.join(aRoot,'package.json'),'utf8')).dependencies;
const backend={
  MERCHANT:process.env.LUOBO_D_BACKEND||'http://127.0.0.1:8001',
  ADMIN:process.env.LUOBO_E_BACKEND||'http://127.0.0.1:8000',
  TRANSACTION:process.env.LUOBO_C_BACKEND||'http://127.0.0.1:8002'
};
for(const address of Object.values(backend)) {
  const url=new URL(address);
  if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)) throw new Error('后端代理只允许本机 HTTP 地址');
}
try {
  for(const member of members) {
    const root=path.join(repo,member.folder);
    if(!existsSync(path.join(root,'index.html'))) {targets[member.role]=null;continue;}
    const bridge={name:'a-team-bridge',enforce:'pre',
      transform(code,id){return adaptTeamSource(code,id,member.role);},
      transformIndexHtml:{order:'post',handler(html){return bridgeHtml(html,member.entry);}},
      configureServer(server){server.middlewares.use('/__a_bridge.mjs',async(req,res)=>{
        res.setHeader('Content-Type','text/javascript; charset=utf-8');res.setHeader('Cache-Control','no-store');
        res.end(`window.__TEAM_ROLE__=${JSON.stringify(member.role)};\n`+await readFile(path.join(aRoot,'frame-bridge.mjs'),'utf8'));
      });}
    };
    const server=await createViteServer({configFile:false,root,plugins:[bridge,member.role==='BUYER'?react():vue()],
      cacheDir:path.join(aRoot,'.integration',member.role),
      resolve:{alias:Object.keys(dependencies).filter(name=>!name.startsWith('@vitejs/')&&name!=='vite').map(name=>({find:name,replacement:path.join(aRoot,'node_modules',name)}))},
      server:{host:'127.0.0.1',port:member.port,strictPort:true,open:false,
        fs:{allow:[root,path.join(aRoot,'node_modules')]},
        proxy:member.role==='BUYER'
          ?{'/api':{target:backend.TRANSACTION,changeOrigin:true}}
          :member.role==='MERCHANT'
            ?{'/api':{target:backend.MERCHANT,changeOrigin:true},'/trade-api':{target:backend.TRANSACTION,changeOrigin:true}}
            :{'/api':{target:backend.ADMIN,changeOrigin:true}},
        headers:{'Content-Security-Policy':`frame-ancestors ${aOrigin}`}}
    });
    await server.listen();servers.push(server);targets[member.role]=`http://127.0.0.1:${member.port}`;
  }
  const server=http.createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,aOrigin);
      res.setHeader('Cache-Control','no-store');
      if(url.pathname==='/integration-config.json') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({targets,missingC:!existsSync(path.join(repo,'C/backend/main.py')),transactionBackend:backend.TRANSACTION,merchantBackendComplete:existsSync(path.join(repo,'directory/backend/config/db_conf.py'))}));return;}
      if(url.pathname==='/team-api/admin/login'&&req.method==='POST') {
        if(req.headers.origin!==aOrigin) {res.writeHead(403);res.end('Forbidden');return;}
        let text='';for await(const chunk of req){text+=chunk;if(text.length>8192){res.writeHead(413);res.end();return;}}
        const response=await fetch(`${backend.ADMIN}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:text,signal:AbortSignal.timeout(8000)});
        res.writeHead(response.status,{'Content-Type':'application/json'});res.end(await response.text());return;
      }
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
      const relative=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
      // Only public files directly inside A; no dependency trees, logs or arbitrary repo reads.
      if(!/^[\w-]+\.(html|js|css)$/.test(relative)){res.writeHead(404);res.end();return;}
      const file=path.join(aRoot,relative);
      if(!(await stat(file)).isFile())throw new Error('Not found');
      const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
      res.setHeader('Content-Type',`${types[path.extname(file)]}; charset=utf-8`);res.end(await readFile(file));
    }catch(error){res.writeHead(req.url==='/team-api/admin/login'?502:404,{'Content-Type':'application/json'});res.end(JSON.stringify({message:req.url==='/team-api/admin/login'?'E 管理员后端未启动或连接失败，请先启动 E/backend（8000端口）':'资源不可用'}));}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(8080,'127.0.0.1',resolve);});
  console.log(`萝卜商城统一登录：${aOrigin}`);
  console.log('所有前端由 A 启动。C 交易后端使用8002，D 后端使用8001，E 后端使用8000。');
  if(!existsSync(path.join(repo,'directory/backend/config/db_conf.py')))console.log('注意：D 后端缺少 config/db_conf.py；D 页面可打开，业务接口需补齐后端后验证。');
  const close=async()=>{server.close();await Promise.all(servers.map(s=>s.close()));process.exit(0);};
  process.on('SIGINT',close);process.on('SIGTERM',close);
}catch(error){await Promise.all(servers.map(s=>s.close()));console.error('联调启动失败：',error.message);process.exitCode=1;}
