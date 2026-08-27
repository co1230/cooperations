const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(match=>match[1]);
test('utils loads first and each shared helper has exactly one definition',()=>{
  assert.equal(scripts[0],'utils.js');
  for(const name of ['escapeHtml','money','orderStatusNames','afterSaleNames']){
    const definitions=scripts.filter(file=>new RegExp(`(?:const|let|var|function)\\s+${name}\\b`).test(fs.readFileSync(path.join(root,file),'utf8')));
    assert.deepEqual(definitions,['utils.js']);
  }
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root,'utils.js'),'utf8'),context);
  assert.equal(vm.runInContext('escapeHtml',context)(String.fromCharCode(60,62,38,34,39)),'&lt;&gt;&amp;&quot;&#39;');
  assert.equal(vm.runInContext('escapeHtml(null)',context),'');
  assert.equal(vm.runInContext('money(12.5)',context),'¥ 12.50');
  assert.equal(vm.runInContext('orderStatusNames.PAID',context),'待发货');
  assert.equal(vm.runInContext('afterSaleNames.APPLIED',context),'退款审核中');
});
// Minimal DOM adapter for full script-order / reload smoke tests (not visual browser QA).
function loadPage(local=new Map(),session=new Map()){
  const elements=new Map();
  function node(selector){
    if(!elements.has(selector)) elements.set(selector,{innerHTML:'',textContent:'',isConnected:true,
      querySelector:node,querySelectorAll:()=>[]});
    return elements.get(selector);
  }
  const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)});
  const context=vm.createContext({document:{querySelector:node,querySelectorAll:()=>[]},localStorage:storage(local),sessionStorage:storage(session),setTimeout:callback=>queueMicrotask(callback),window:{addEventListener:()=>{}},FormData:class{constructor(form){this.values=form.values;}get(key){return this.values[key]??null;}}});
  for(const file of scripts) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return {context,node,local,session};
}
async function settle(){for(let i=0;i<30;i++)await Promise.resolve();}
test('index script order supports login, cart, payment, refund and reload without missing globals',async()=>{
  const page=loadPage();
  assert.match(page.node('#app').innerHTML,/欢迎回来/);
  page.node('#authForm').onsubmit({preventDefault(){},target:{values:{email:'buyer@demo.com',password:'123456'}}});
  await settle();
  assert.match(page.node('#app').innerHTML,/青岚选物/);
  const api=vm.runInContext('orderApi',page.context);
  await api.addToCart(101);
  page.context.cartPage();await settle();
  assert.match(page.node('#cartContent').innerHTML,/手冲咖啡分享壶/);
  const [order]=await api.checkoutCart();
  await api.payOrder(order.id);
  await api.applyRefund(order.id,{ticket_type:'REFUND_ONLY',reason:'测试',requested_amount:'10'});
  page.context.buyerOrdersView();await settle();
  assert.match(page.node('#buyerOrders').innerHTML,/退款审核中/);
  await api.addToCart(102);
  const reloaded=loadPage(page.local,page.session);await settle();
  assert.match(reloaded.node('#app').innerHTML,/青岚选物/);
  const reloadedApi=vm.runInContext('orderApi',reloaded.context);
  assert.equal((await reloadedApi.getCart()).items[0].product_id,102);
  assert.equal((await reloadedApi.listOrders()).find(row=>row.id===order.id).after_sale_status,'APPLIED');
  reloaded.context.buyerOrdersView();await settle();
  assert.match(reloaded.node('#buyerOrders').innerHTML,/退款审核中/);
});
