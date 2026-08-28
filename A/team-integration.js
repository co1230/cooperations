const teamIntegration=(()=>{
  let listener=null;
  const enabled=()=>typeof location!=='undefined'&&!new URLSearchParams(location.search).has('standalone');
  async function config() {
    if(location.protocol==='file:')throw new Error('请在 A 目录运行 npm install、npm start，再访问 http://127.0.0.1:8080；不能用双击文件的方式联调成员页面。');
    const response=await fetch('/integration-config.json',{signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error('请使用 A 的 npm start 启动统一入口：http://127.0.0.1:8080');
    return response.json();
  }
  function cleanup(){if(listener){window.removeEventListener('message',listener);listener=null;}}
  function logout(){cleanup();sessionStorage.removeItem('ecom_session');sessionStorage.removeItem('luobo_admin_session');authView();}
  return {
    async authenticate(email,password) {
      const user=accountService.authenticate(email,password);
      if(enabled()&&user.role==='ADMIN') {
        sessionStorage.removeItem('luobo_admin_session');
        const settings=await config();
        if(settings.targets.ADMIN) {
          const response=await fetch('/team-api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:email,password}),signal:AbortSignal.timeout(10000)});
          const body=await response.json();
          const info=body.data?.adminInfo||body.data?.admin_info;
          if(!response.ok||body.code!==200||!body.data?.token||info?.role!=='ADMIN')throw new Error(body.message||'E 管理员认证失败，请检查后端及账号');
          sessionStorage.setItem('luobo_admin_session',JSON.stringify({token:body.data.token,info}));
        }
      }
      return user;
    },
    route(user) {
      if(!enabled())return false;
      cleanup();
      app.innerHTML='<main class="auth-panel"><section class="card" id="teamLoading"><h2>萝卜商城</h2><p role="status">正在连接成员页面…</p></section></main>';
      const loading=document.querySelector('#teamLoading');
      (async()=>{
        try {
          const settings=await config();
          if(!loading.isConnected)return;
          const target=settings.targets[user.role];
          if(!target) {if(user.role==='BUYER')throw new Error('B 用户端尚未提供，无法进入购物中心');dashboard(user);return;}
          const expected={BUYER:'http://127.0.0.1:8081',MERCHANT:'http://127.0.0.1:8082',ADMIN:'http://127.0.0.1:8083'};
          if(target!==expected[user.role])throw new Error('成员页面地址不符合本机联调配置');
          const admin=user.role==='ADMIN'?JSON.parse(sessionStorage.getItem('luobo_admin_session')||'null'):null;
          if(user.role==='ADMIN'&&!admin?.token){sessionStorage.removeItem('ecom_session');authView('login','请重新登录，以获取 E 后端管理员令牌');return;}
          const names={BUYER:'B · 购物中心',MERCHANT:'D · 商家后台',ADMIN:'E · 管理员后台'};
          app.innerHTML=`<main class="team-shell"><header class="team-header"><strong>萝卜商城</strong><span>${names[user.role]} · ${escapeHtml(user.name)}</span><button class="order-pay" id="teamLogout">退出登录</button></header><p class="team-status" id="teamStatus" role="status">正在加载${names[user.role]}…</p>${user.role==='MERCHANT'&&!settings.merchantBackendComplete?'<p class="team-warning">D 后端缺少 config/db_conf.py：目前对接商家页面；数据操作需 D 补齐后端并启动到 8001 端口。</p>':''}<iframe id="teamFrame" title="${names[user.role]}" class="team-frame"></iframe></main>`;
          const frame=document.querySelector('#teamFrame'),status=document.querySelector('#teamStatus');
          const safeUser={id:user.id,name:user.name,email:user.email,role:user.role};
          listener=event=>{
            if(event.origin!==target||event.source!==frame.contentWindow||!frame.isConnected)return;
            if(event.data?.type==='LUOBO_READY')frame.contentWindow.postMessage({type:'LUOBO_SESSION',user:safeUser,admin},target);
            if(event.data?.type==='LUOBO_MOUNTED')status.textContent=`已进入${names[user.role]}`;
            if(event.data?.type==='LUOBO_ERROR')status.textContent=event.data.message;
            if(event.data?.type==='LUOBO_EXIT')logout();
          };
          window.addEventListener('message',listener);
          document.querySelector('#teamLogout').onclick=()=>{frame.contentWindow.postMessage({type:'LUOBO_LOGOUT'},target);logout();};
          frame.src=target;
        }catch(error){if(loading.isConnected){app.innerHTML=`<main class="auth-panel"><section class="card"><h2>萝卜商城 · 联调提示</h2><p role="status">${escapeHtml(error.message)}</p><button id="teamBack" class="order-pay">返回登录</button></section></main>`;document.querySelector('#teamBack').onclick=logout;}}
      })();
      return true;
    }
  };
})();
