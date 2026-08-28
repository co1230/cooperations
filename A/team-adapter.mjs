// Source adapters are applied in memory by A's Vite servers; teammates' files stay unchanged.
export function adaptTeamSource(source,id,role) {
  const normalized=id.replaceAll('\\','/').split('?')[0];
  if(role==='BUYER'&&normalized.includes('/B/web/src/')) {
    source=source.replaceAll('localStorage.', 'window.luoboStorage.');
    if(normalized.endsWith('/mock/data.js')) source=source.replace(/export const currentUser = \{[\s\S]*?\n\}/,'export const currentUser = window.luoboUser');
  }
  if(role==='MERCHANT'&&normalized.includes('/directory/frontend/src/api/')) {
    source=source.replaceAll('http://localhost:8000/api','/api');
  }
  if(role==='ADMIN'&&normalized.endsWith('/E/frontend/src/store/index.js')) {
    source=source.replace('logout() {',"logout() {\n      window.parent.postMessage({type:'LUOBO_EXIT'},'http://127.0.0.1:8080');");
  }
  return source;
}
export function bridgeHtml(html,entry) {
  const safeEntry=JSON.stringify(entry);
  const pattern=/<script\b[^>]*\bsrc=["'][^"']*\/src\/main\.(?:jsx|js)["'][^>]*>\s*<\/script>/;
  if(!pattern.test(html)) throw new Error('成员页面入口格式已改变，请更新 A 的适配配置');
  return html.replace(pattern,`<script type="module">import { boot } from '/__a_bridge.mjs'; boot(${safeEntry});</script>`);
}
