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
  for(const file of ['accounts.js','mock-api.js','orders.js','admin.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
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
