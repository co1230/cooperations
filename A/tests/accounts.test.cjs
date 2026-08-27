const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function setup(){
  const data=new Map(),sessions=new Map();
  const storage=map=>({getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)});
  const context=vm.createContext({setTimeout,localStorage:storage(data),sessionStorage:storage(sessions),seedUsers:[
    {id:1,name:'Buyer',email:'buyer@demo.com',password:'123456',role:'BUYER'},
    {id:2,name:'Merchant',email:'merchant@demo.com',password:'123456',role:'MERCHANT'},
    {id:3,name:'Admin',email:'admin@demo.com',password:'123456',role:'ADMIN'}]});
  for(const file of ['utils.js','accounts.js','mock-api.js','orders.js','admin.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  const api=vm.runInContext('accountService',context),orders=vm.runInContext('orderApi',context);
  const login=id=>sessions.set('ecom_session',JSON.stringify({id,role:id===3?'ADMIN':'BUYER'}));
  login(3);
  return {api,orders,context,login,data,sessions};
}
test('old accounts migrate without losing data and list omits passwords',async()=>{
  const {api}=setup();
  const users=await api.listUsers();
  assert.equal(users.length,5);
  assert.equal(users[0].account_status,'ACTIVE');
  assert.ok(users.every(user=>!('password' in user)));
  assert.equal((await api.listUsers()).length,5);
});
test('ban blocks authentication and existing sessions, unban restores login',async()=>{
  const {api,orders,login,sessions}=setup();
  await api.setStatus(1,'DISABLED');
  assert.throws(()=>api.authenticate('buyer@demo.com','123456'),/封禁/);
  login(1);
  await assert.rejects(orders.getCart(),/封禁/);
  assert.equal(sessions.has('ecom_session'),false);
  login(3);
  await api.setStatus(1,'ACTIVE');
  assert.equal(api.authenticate('buyer@demo.com','123456').id,1);
});
test('non-admin cannot administer; forged session role does not grant privileges',async()=>{
  const {api,login,sessions}=setup();
  login(1);
  sessions.set('ecom_session',JSON.stringify({id:1,role:'ADMIN'}));
  await assert.rejects(api.listUsers(),/仅管理员/);
  await assert.rejects(api.setStatus(2,'DISABLED'),/仅管理员/);
  await assert.rejects(api.reviewMerchant(4,'APPROVED'),/仅管理员/);
});
test('admin protected and pending merchants cannot bypass review with unban',async()=>{
  const {api}=setup();
  await assert.rejects(api.setStatus(3,'DISABLED'),/管理员/);
  await assert.rejects(api.setStatus(4,'ACTIVE'),/审核/);
  await assert.rejects(api.setStatus(1,'INVALID'),/无效/);
});
test('approval opens merchant login and rejects a second review',async()=>{
  const {api}=setup();
  assert.throws(()=>api.authenticate('apply1@demo.com','123456'),/待审核/);
  const target=await api.reviewMerchant(4,'APPROVED','资料齐全');
  assert.equal(target.account_status,'ACTIVE');
  assert.equal(target.merchant_application.status,'APPROVED');
  assert.equal(api.authenticate('apply1@demo.com','123456').role,'MERCHANT');
  await assert.rejects(api.reviewMerchant(4,'REJECTED','重复'),/已审核/);
});
test('rejection requires reason, persists and prevents login',async()=>{
  const {api}=setup();
  await assert.rejects(api.reviewMerchant(5,'REJECTED','  '),/原因/);
  await api.reviewMerchant(5,'REJECTED','资料不全');
  assert.equal((await api.listUsers()).find(user=>user.id===5).merchant_application.review_note,'资料不全');
  assert.throws(()=>api.authenticate('apply2@demo.com','123456'),/已被拒绝/);
});

test('merchant product list uses shared catalog and isolates new shops',async()=>{
  const {api,orders,login,context}=setup();
  login(2);
  const products=await orders.listMerchantProducts();
  assert.equal(products.length,6);
  assert.ok(products.every(product=>product.merchant_id===2&&product.sku&&Number.isInteger(product.stock)));
  assert.equal(products[0].price,128);
  products[0].price=1;
  assert.equal((await orders.listMerchantProducts())[0].price,128);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','merchant.js'),'utf8'),context);
  assert.match(context.merchantProductRows(products),/手冲咖啡分享壶/);
  assert.match(context.merchantProductRows(products),/在售/);
  login(3);
  await api.reviewMerchant(4,'APPROVED');
  login(4);
  assert.equal((await orders.listMerchantProducts()).length,0);
  login(1);
  await assert.rejects(orders.listMerchantProducts(),/仅商家/);
  login(3);
  await api.setStatus(2,'DISABLED');
  login(2);
  await assert.rejects(orders.listMerchantProducts(),/封禁/);
});

test('governance blocks store and checkout, merchant cannot bypass lock',async()=>{
  const {api,orders,login}=setup();
  login(1);await orders.addToCart(101);
  login(3);await orders.governProduct(101,true,'商品信息违规');
  assert.equal((await orders.listGovernance()).logs.length,1);
  login(1);
  assert.ok(!(await orders.listStoreProducts()).some(p=>p.id===101));
  await assert.rejects(orders.checkoutCart(),/下架/);
  login(2);
  const product=(await orders.listMerchantProducts()).find(p=>p.id===101);
  await assert.rejects(orders.saveProduct(101,{...product,product_status:'ON_SALE'}),/平台下架/);
  await assert.rejects(orders.governProduct(101,false,'绕过'),/无权/);
  login(3);await orders.governProduct(101,false,'整改完成');
  login(2);await orders.saveProduct(101,{...product,product_status:'ON_SALE'});
  login(1);assert.ok((await orders.listStoreProducts()).some(p=>p.id===101));
});
test('shop settings persist, closure blocks checkout and reopening restores sales',async()=>{
  const {orders,login}=setup();
  login(1);await orders.addToCart(102);
  login(2);const shop=await orders.getShop();
  await orders.saveShop({...shop,name:'新的店名',open:false});
  assert.equal((await orders.getShop()).name,'新的店名');
  login(1);assert.equal((await orders.listStoreProducts()).length,0);
  await assert.rejects(orders.checkoutCart(),/休业/);
  login(2);await orders.saveShop({...shop,open:true});
  login(1);assert.equal((await orders.listStoreProducts()).length,6);
});
test('new merchant creates and edits own products; invalid and cross-shop edits blocked',async()=>{
  const {api,orders,login}=setup();
  await api.reviewMerchant(4,'APPROVED');login(4);
  const values={name:'新商品',description:'测试描述',price:'12.50',stock:3,product_status:'ON_SALE'};
  const created=await orders.saveProduct(null,values);
  assert.equal(created.merchant_id,4);
  assert.equal((await orders.listMerchantProducts()).length,1);
  await assert.rejects(orders.saveProduct(101,values),/不属于/);
  await assert.rejects(orders.saveProduct(created.id,{...values,price:'1.001'}),/售价/);
  await assert.rejects(orders.saveProduct(created.id,{...values,stock:-1}),/库存/);
  await orders.saveProduct(created.id,{...values,price:'14.50'});
  login(1);await orders.addToCart(created.id);
  const placed=await orders.checkoutCart();assert.equal(placed[0].total_amount,14.5);
  login(4);assert.equal((await orders.listMerchantProducts())[0].stock,2);
});
test('merchant refund approval and completion update buyer state once',async()=>{
  const {orders,login}=setup();
  login(1);await orders.payOrder(1);
  const order=await orders.applyRefund(1,{ticket_type:'REFUND_ONLY',reason:'退款',requested_amount:'129'});
  const id=order.after_sale_tickets[0].id;
  login(2);await orders.reviewRefund(id,'APPROVE','同意');
  await assert.rejects(orders.shipOrder(1),/不可发货/);
  await orders.reviewRefund(id,'REFUND','模拟退款完成');
  await assert.rejects(orders.reviewRefund(id,'REFUND','再次退款'),/重复/);
  login(1);assert.equal((await orders.listOrders())[0].after_sale_status,'REFUNDED');
  assert.equal((await orders.listOrders())[0].order_status,'PAID');
});
test('refund rejection requires note and permits shipping afterward',async()=>{
  const {orders,login}=setup();
  login(1);await orders.payOrder(1);
  const order=await orders.applyRefund(1,{ticket_type:'REFUND_ONLY',reason:'退款',requested_amount:'10'});
  const id=order.after_sale_tickets[0].id;
  await assert.rejects(orders.reviewRefund(id,'APPROVE',''),/无权/);
  login(2);await assert.rejects(orders.reviewRefund(id,'REJECT',''),/原因|拒绝/);
  await orders.reviewRefund(id,'REJECT','不符合约定');
  await orders.shipOrder(1);
  login(1);assert.equal((await orders.listOrders())[0].order_status,'SHIPPED');
});

test('platform force refund persists record, payment state and audit once',async()=>{
  const {orders,login,data}=setup();
  login(1);await orders.payOrder(1);
  const applied=await orders.applyRefund(1,{ticket_type:'REFUND_ONLY',reason:'平台介入测试',requested_amount:'129'});
  const id=applied.after_sale_tickets[0].id;
  login(3);
  const results=await Promise.allSettled([orders.interveneRefund(id,'FORCE_REFUND','平台确认退款'),orders.interveneRefund(id,'FORCE_REFUND','重复')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const db=JSON.parse(data.get('ecom_order_db_v1'));
  assert.equal(db.refund_records.length,1);
  assert.equal(db.refund_records[0].source,'PLATFORM');
  assert.equal(db.payment_records[0].payment_status,'REFUNDED');
  assert.equal(db.order_status_logs.at(-1).operator_id,3);
  login(1);assert.equal((await orders.listOrders())[0].after_sale_status,'REFUNDED');
  assert.equal((await orders.listOrders())[0].order_status,'PAID');
  login(2);assert.equal((await orders.listMerchantTickets()).find(t=>t.id===id).platform_intervention.reason,'平台确认退款');
});
test('platform rejection is visible and cannot be overwritten by merchant',async()=>{
  const {orders,login,context}=setup();
  await orders.interveneRefund(1,'REJECT','凭证不足');
  login(2);await assert.rejects(orders.reviewRefund(1,'APPROVE','重新同意'),/不允许/);
  const ticket=(await orders.listMerchantTickets())[0];
  assert.match(context.refundTicketDetails(ticket),/平台驳回申请/);
  login(1);assert.equal((await orders.listOrders()).find(o=>o.id===2).after_sale_status,'REJECTED');
});
test('only admin can intervene and reason and state are checked',async()=>{
  const {orders,login}=setup();
  for(const id of [1,2]) {
    login(id);
    await assert.rejects(orders.listPlatformTickets(),/无权/);
    await assert.rejects(orders.interveneRefund(1,'FORCE_REFUND','测试'),/无权/);
  }
  login(3);
  await assert.rejects(orders.interveneRefund(1,'REJECT',' '),/原因/);
  await assert.rejects(orders.interveneRefund(1,'INVALID','原因'),/无效/);
  await assert.rejects(orders.interveneRefund(2,'FORCE_REFUND','已退款'),/已结束/);
  await assert.rejects(orders.interveneRefund(999,'REJECT','不存在'),/已结束/);
});
test('platform may override merchant rejection but never a superseded application',async()=>{
  const {orders,login}=setup();
  login(2);await orders.reviewRefund(1,'REJECT','商家拒绝');
  login(3);assert.equal((await orders.listPlatformTickets()).find(t=>t.id===1).can_force_refund,true);
  login(1);const order=await orders.applyRefund(2,{ticket_type:'REFUND_ONLY',reason:'新凭证',requested_amount:'30'});
  login(3);await assert.rejects(orders.interveneRefund(1,'FORCE_REFUND','旧申请'),/新申请/);
  const newest=order.after_sale_tickets.at(-1);
  await orders.interveneRefund(newest.id,'FORCE_REFUND','核实新凭证');
});
test('platform persistence failure does not partially update order or refund record',async()=>{
  const {orders,context,data}=setup();
  await orders.listPlatformTickets();
  const before=data.get('ecom_order_db_v1');
  context.localStorage.setItem=()=>{throw new Error('Storage full');};
  await assert.rejects(orders.interveneRefund(1,'FORCE_REFUND','测试'),/Storage full/);
  assert.equal(data.get('ecom_order_db_v1'),before);
});
test('platform list shows actions only for eligible tickets and escapes reasons',async()=>{
  const {orders,context}=setup();
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','platform-refunds.js'),'utf8'),context);
  const tickets=await orders.listPlatformTickets();
  const html=context.platformRefundRows(tickets);
  assert.match(html,/强制退款（模拟）/);
  assert.match(html,/驳回申请/);
  assert.doesNotMatch(context.platformRefundRows(tickets.filter(t=>t.id===2)),/data-platform-ticket/);
  await orders.interveneRefund(1,'REJECT','<script>test</script>');
  assert.match(context.platformRefundRows(await orders.listPlatformTickets()),/&lt;script&gt;/);
});
