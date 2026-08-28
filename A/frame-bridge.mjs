// Only the trusted A parent window may initialize this frame. No token is placed in a URL.
export function boot(entry) {
  const parentOrigin='http://127.0.0.1:8080';
  if(window.parent===window) {location.replace(parentOrigin);return;}
  let started=false;
  window.addEventListener('message',async event=>{
    if(event.origin!==parentOrigin||event.source!==window.parent) return;
    if(event.data?.type==='LUOBO_LOGOUT') {
      localStorage.removeItem('admin_token');localStorage.removeItem('admin_info');
      sessionStorage.removeItem('ecom_session');location.replace('about:blank');return;
    }
    const {type,user,admin}=event.data||{};
    if(type!=='LUOBO_SESSION'||started||!user||user.role!==window.__TEAM_ROLE__) return;
    if(user.role==='ADMIN'&&(!admin?.token||admin.info?.role!=='ADMIN')) return;
    started=true;
    window.luoboUser={id:user.id,username:user.name,nickname:user.name,phone:user.phone||'',avatar:user.avatar||''};
    sessionStorage.setItem('ecom_session',JSON.stringify(user));
    const prefix=`luobo:B:${user.id}:`;
    window.luoboStorage={getItem:key=>localStorage.getItem(prefix+key),setItem:(key,value)=>localStorage.setItem(prefix+key,value),removeItem:key=>localStorage.removeItem(prefix+key)};
    if(user.role==='ADMIN') {localStorage.setItem('admin_token',admin.token);localStorage.setItem('admin_info',JSON.stringify(admin.info));}
    try {
      await import(/* @vite-ignore */ entry);
      window.parent.postMessage({type:'LUOBO_MOUNTED'},parentOrigin);
    } catch(error) {
      window.parent.postMessage({type:'LUOBO_ERROR',message:'成员页面启动失败，请查看启动终端的依赖错误'},parentOrigin);
    }
  });
  window.parent.postMessage({type:'LUOBO_READY'},parentOrigin);
}
