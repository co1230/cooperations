const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function setup() {
  const app = {innerHTML:''}, nodes = new Map();
  const document = {
    querySelector(selector) {
      if (selector === '#app') return app;
      if (!nodes.has(selector)) nodes.set(selector, {});
      return nodes.get(selector);
    },
    querySelectorAll(selector) {
      if (selector === '[data-page-index]') return [...app.innerHTML.matchAll(/data-page-index="(\d+)"/g)].map(match => ({dataset:{pageIndex:match[1]}}));
      if (selector === '[data-store-page]') return [...app.innerHTML.matchAll(/data-store-page="([^"]+)"/g)].map(match => ({dataset:{storePage:match[1]}}));
      return [];
    }
  };
  let orderVisits = 0;
  const context = vm.createContext({document, sessionStorage:{getItem:()=>null},productCatalog:[],wireProductCart:()=>{}});
  for (const file of ['orders.js','navigation.js','app.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'), context);
  context.loadDashboardOrders = () => {};
  context.loadHomeOrders = () => {};
  context.loadAdminPage = () => {};
  context.buyerOrdersView = () => {orderVisits++;};
  return {context,app,nodes,orderVisits:()=>orderVisits};
}
test('all dashboard nav items render matching content and active state', () => {
  const {context,app} = setup();
  const roles = vm.runInContext('dashboards',context);
  for (const [role,config] of Object.entries(roles)) {
    for (let index=0;index<config.nav.length;index++) {
      if (role==='BUYER' && index===1) continue;
      context.dashboard({role,name:'测试用户'},index);
      assert.match(app.innerHTML, new RegExp(config.nav[index]));
      assert.match(app.innerHTML, new RegExp(`aria-current="page"[^>]*data-page-index="${index}"`));
      if (index===0 || ['订单管理','订单监管'].includes(config.nav[index])) assert.match(app.innerHTML,/id="dashboardOrders"/);
      else if(role==='ADMIN' && ['用户管理','商家审核'].includes(config.nav[index])) {
        assert.match(app.innerHTML,/id="adminPage"/);
        assert.doesNotMatch(app.innerHTML,/页面（开发中）/);
      } else {
        assert.ok(app.innerHTML.includes(`${config.nav[index]}页面（开发中）`));
        assert.match(app.innerHTML,/计划功能/);
        assert.doesNotMatch(app.innerHTML,/id="dashboardOrders"/);
      }
    }
  }
});
test('sidebar click changes page; back returns overview; buyer order entry stays functional', () => {
  const {context,app,nodes,orderVisits} = setup();
  let buttons;
  const original = context.document.querySelectorAll;
  context.document.querySelectorAll = selector => {
    const result = original(selector);
    if (selector==='[data-page-index]') buttons=result;
    return result;
  };
  context.dashboard({role:'MERCHANT',name:'商家'});
  buttons[1].onclick();
  assert.match(app.innerHTML,/商品管理页面（开发中）/);
  nodes.get('#backOverview').onclick();
  assert.match(app.innerHTML,/经营概览/);
  assert.doesNotMatch(app.innerHTML,/商品管理页面（开发中）/);
  context.dashboard({role:'BUYER',name:'买家'},1);
  assert.equal(orderVisits(),1);
});
test('all store sections and categories have placeholders with return navigation', () => {
  const {context,app,nodes} = setup();
  const pages = vm.runInContext('[...storeSections.slice(1),...storeCategories]',context);
  for (const title of pages) {
    context.storePlaceholder({role:'BUYER',name:'买家'},title);
    assert.ok(app.innerHTML.includes(`${title}页面（开发中）`));
    assert.match(app.innerHTML,/返回商城首页/);
  }
  nodes.get('#buyerCenter').onclick();
  assert.match(app.innerHTML,/买家中心/);
  assert.match(app.innerHTML,/收货地址/);
});
