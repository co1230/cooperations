const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'mock-api.js'), 'utf8');
const refundPayload = {ticket_type: 'REFUND_ONLY', reason: '商品不合适', requested_amount: '50.25', evidence_urls: []};
const evidencePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX9kAAAAASUVORK5CYII=';
function setup(legacy) {
  const data = new Map(legacy ? [['demo_order', JSON.stringify(legacy)]] : []);
  const sessions = new Map();
  const storage = map => ({getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value)});
  const context = vm.createContext({localStorage: storage(data), sessionStorage: storage(sessions), setTimeout});
  vm.runInContext(source, context);
  const api = vm.runInContext('orderApi', context);
  const login = (id, role = 'BUYER') => sessions.set('ecom_session', JSON.stringify({id, role}));
  login(1);
  return {api, login, data, db: () => JSON.parse(data.get('ecom_order_db_v1'))};
}
test('payment persists PAID, preserves after-sale status and is idempotent', async () => {
  const {api, db, data} = setup();
  assert.equal((await api.listOrders())[0].order_status, 'PENDING_PAYMENT');
  await Promise.all([api.payOrder(1), api.payOrder(1)]);
  const order = (await api.listOrders())[0];
  assert.equal(order.order_status, 'PAID');
  assert.equal(order.after_sale_status, 'NONE');
  assert.ok(order.paid_at);
  assert.equal(db().payment_records.length, 1);
  assert.equal(db().order_status_logs.length, 1);
  const context = vm.createContext({localStorage: {getItem: k => data.get(k)}, sessionStorage: {getItem: () => JSON.stringify({id: 1, role: 'BUYER'})}, setTimeout});
  vm.runInContext(source, context);
  assert.equal((await vm.runInContext('orderApi.listOrders()', context))[0].order_status, 'PAID');
});
test('new buyers have no orders and cannot pay another buyer order', async () => {
  const {api, login} = setup();
  login(999);
  assert.equal((await api.listOrders()).length, 0);
  await assert.rejects(api.payOrder(1), /无权/);
});
test('merchant sees only their orders and admin sees shared updated state', async () => {
  const {api, login} = setup();
  await api.payOrder(1);
  login(2, 'MERCHANT');
  assert.equal((await api.listOrders())[0].order_status, 'PAID');
  await assert.rejects(api.payOrder(1), /无权/);
  login(777, 'MERCHANT');
  assert.equal((await api.listOrders()).length, 0);
  login(3, 'ADMIN');
  assert.equal((await api.listOrders()).length, 4);
});
test('non-payable orders are rejected without a payment record', async () => {
  const {api, db} = setup();
  await assert.rejects(api.payOrder(2), /状态不允许/);
  await assert.rejects(api.payOrder(3), /状态不允许/);
  assert.equal(db().payment_records.length, 0);
});
test('legacy paid demo is migrated only to demo buyer', async () => {
  const {api, login, db} = setup({no: 'Q20260826001', status: '已支付', paidAt: '2026-08-26T10:00:00Z'});
  assert.equal((await api.listOrders())[0].order_status, 'PAID');
  assert.equal(db().payment_records.length, 1);
  login(999);
  assert.equal((await api.listOrders()).length, 0);
});
test('session changes while requesting are rejected', async () => {
  const {api, login} = setup();
  const pending = api.payOrder(1);
  login(999);
  await assert.rejects(pending, /登录状态已变更/);
});

test('order renderer maps PAID to awaiting shipment and hides payment action', async () => {
  const {api} = setup();
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'orders.js'), 'utf8'), context);
  const render = vm.runInContext('orderRows', context);
  const pending = await api.listOrders();
  assert.match(render(pending, true), /待付款/);
  assert.match(render(pending, true), /data-pay-order="1"/);
  await api.payOrder(1);
  const paid = await api.listOrders();
  const html = render(paid, true);
  assert.match(html, /待发货/);
  assert.doesNotMatch(html, /data-pay-order/);
  assert.match(html, /AS20260825001/);
  paid[0].items[0].product_name = '<script>bad</script>';
  assert.match(render(paid, true), /&lt;script&gt;/);
});

test('refund creates a persisted ticket, evidence and after-sale log without changing fulfillment', async () => {
  const {api, db, login} = setup();
  await api.payOrder(1);
  const result = await api.applyRefund(1, {...refundPayload, evidence_urls: [evidencePng]});
  assert.equal(result.order_status, 'PAID');
  assert.equal(result.after_sale_status, 'APPLIED');
  assert.equal(result.after_sale_tickets[0].requested_amount, 50.25);
  assert.equal(result.after_sale_tickets[0].evidence_urls[0], evidencePng);
  assert.equal(db().order_status_logs.at(-1).status_type, 'AFTER_SALE');
  assert.equal(db().order_status_logs.at(-1).to_status, 'APPLIED');
  assert.equal(db().payment_records.length, 1);
  login(2, 'MERCHANT');
  assert.equal((await api.listOrders())[0].after_sale_status, 'APPLIED');
  login(1);
  assert.equal((await api.listOrders())[0].after_sale_tickets[0].status, 'APPLIED');
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'orders.js'), 'utf8'), context);
  const html = vm.runInContext('orderRows', context)([result], true);
  assert.match(html, /退款审核中/);
  assert.match(html, /原订单状态：待发货/);
  assert.match(html, /退款凭证/);
  assert.doesNotMatch(html, /data-refund-order/);
});
test('shipped orders allow return refund; duplicate requests create only one ticket', async () => {
  const {api, db} = setup();
  const results = await Promise.allSettled([api.applyRefund(3, {...refundPayload, ticket_type: 'RETURN_REFUND'}), api.applyRefund(3, refundPayload)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(db().after_sale_tickets.filter(ticket => ticket.order_id === 3).length, 1);
  assert.equal(db().after_sale_tickets.at(-1).ticket_type, 'RETURN_REFUND');
  assert.equal(db().orders.find(order => order.id === 3).order_status, 'SHIPPED');
});
test('refund rejects unauthorized, unpaid, ongoing and refunded orders', async () => {
  const {api, login} = setup();
  await assert.rejects(api.applyRefund(1, refundPayload), /已付款/);
  for (const id of [2, 4]) await assert.rejects(api.applyRefund(id, refundPayload), /已有售后/);
  login(999);
  await assert.rejects(api.applyRefund(3, refundPayload), /无权/);
  login(2, 'MERCHANT');
  await assert.rejects(api.applyRefund(3, refundPayload), /无权/);
});
test('refund validates type, reason, amount precision, maximum and evidence', async () => {
  const {api, db} = setup();
  await api.payOrder(1);
  await assert.rejects(api.applyRefund(1, {...refundPayload, ticket_type: 'RETURN_REFUND'}), /仅退款/);
  for (const change of [
    {ticket_type: 'INVALID'}, {reason: '  '}, {reason: '字'.repeat(201)},
    ...['0', '-1', '129.01', '1.001', 'NaN', 'Infinity'].map(requested_amount => ({requested_amount})),
    {evidence_urls: [evidencePng, evidencePng, evidencePng, evidencePng]},
    {evidence_urls: ['data:text/html;base64,AAAA']},
    {evidence_urls: ['data:image/png;base64,' + 'A'.repeat(410000)]}
  ]) await assert.rejects(api.applyRefund(1, {...refundPayload, ...change}));
  assert.equal(db().orders[0].after_sale_status, 'NONE');
  assert.equal(db().after_sale_tickets.length, 2);
});
test('failed refund persistence does not leave a partial ticket or status update', async () => {
  const {api, data, db} = setup();
  await api.listOrders();
  const context = vm.createContext({setTimeout, sessionStorage: {getItem: () => JSON.stringify({id: 1, role: 'BUYER'})},
    localStorage: {getItem: key => data.get(key), setItem: () => {throw new Error('QuotaExceededError');}}});
  vm.runInContext(source, context);
  await assert.rejects(vm.runInContext('orderApi', context).applyRefund(3, refundPayload), /未保存/);
  assert.equal(db().orders.find(order => order.id === 3).after_sale_status, 'NONE');
  assert.equal(db().after_sale_tickets.length, 2);
});
test('evidence file validation rejects too many, oversized and non-image uploads', async () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'refund.js'), 'utf8'), context);
  const readEvidence = vm.runInContext('readRefundEvidence', context);
  assert.equal((await readEvidence([])).length, 0);
  await assert.rejects(readEvidence(Array(4).fill({type: 'image/png', size: 1})), /最多/);
  await assert.rejects(readEvidence([{type: 'image/png', size: 300 * 1024 + 1}]), /300 KB/);
  await assert.rejects(readEvidence([{type: 'image/svg+xml', size: 100}]), /仅支持/);
});
