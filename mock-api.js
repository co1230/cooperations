// Promise-based mock API. Replace these methods with HTTP requests for production.
const orderApi = (() => {
  const key = 'ecom_order_db_v1';
  const copy = value => JSON.parse(JSON.stringify(value));
  function read() {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    const rows = [
      [1, 'Q20260826001', '轻氧保温杯', 129, 1, 'PENDING_PAYMENT', 'NONE', '2026-08-26T09:00:00+08:00'],
      [2, 'Q20260825088', '原木桌面收纳架', 119, 2, 'COMPLETED', 'PROCESSING', '2026-08-25T09:00:00+08:00'],
      [3, 'Q20260824036', '亚麻午睡毯', 169, 1, 'SHIPPED', 'NONE', '2026-08-24T09:00:00+08:00'],
      [4, 'Q20260822019', '便携咖啡滤杯', 89, 1, 'COMPLETED', 'REFUNDED', '2026-08-22T09:00:00+08:00']
    ];
    const db = {orders: [], order_items: [], payment_records: [], order_status_logs: [], after_sale_tickets: []};
    for (const [id, order_no, product_name, unit_price, quantity, order_status, after_sale_status, created_at] of rows) {
      db.orders.push({id, order_no, buyer_id: 1, merchant_id: 2, total_amount: unit_price * quantity,
        order_status, after_sale_status, created_at, updated_at: created_at,
        paid_at: order_status === 'PENDING_PAYMENT' ? null : created_at});
      db.order_items.push({id, order_id: id, product_id: id, product_name, sku: `DEMO-${id}`, unit_price, quantity, subtotal: unit_price * quantity});
    }
    db.after_sale_tickets = [
      {id: 1, ticket_no: 'AS20260825001', order_id: 2, buyer_id: 1, merchant_id: 2, ticket_type: 'REFUND_ONLY', status: 'PROCESSING', reason: '演示退款申请', requested_amount: 238},
      {id: 2, ticket_no: 'AS20260822001', order_id: 4, buyer_id: 1, merchant_id: 2, ticket_type: 'REFUND_ONLY', status: 'COMPLETED', reason: '演示退款完成', requested_amount: 89}
    ];
    // The old unscoped demo belongs only to the built-in demo buyer, never a new user.
    const legacy = JSON.parse(localStorage.getItem('demo_order') || 'null');
    if (legacy?.no === rows[0][1] && legacy.status === '已支付') {
      recordPayment(db, db.orders[0], legacy.paidAt || new Date().toISOString());
    }
    localStorage.setItem(key, JSON.stringify(db));
    return db;
  }
  function actor() {
    const session = JSON.parse(sessionStorage.getItem('ecom_session') || 'null');
    if (!session || !['BUYER', 'MERCHANT', 'ADMIN'].includes(session.role)) throw new Error('请先登录');
    return session;
  }
  const visible = (order, user) => user.role === 'ADMIN' || (user.role === 'BUYER' ? order.buyer_id === user.id : order.merchant_id === user.id);
  function recordPayment(db, order, now) {
    order.order_status = 'PAID';
    order.paid_at = now;
    order.updated_at = now;
    db.payment_records.push({id: db.payment_records.length + 1, payment_no: `MOCK-${order.order_no}`, order_id: order.id,
      buyer_id: order.buyer_id, amount: order.total_amount, payment_method: 'MOCK', payment_status: 'SUCCESS', paid_at: now, created_at: now});
    db.order_status_logs.push({id: db.order_status_logs.length + 1, order_id: order.id, operator_id: order.buyer_id,
      status_type: 'ORDER', from_status: 'PENDING_PAYMENT', to_status: 'PAID', remark: '模拟支付成功', created_at: now});
  }
  const detail = (db, order) => copy({...order, items: db.order_items.filter(i => i.order_id === order.id),
    after_sale_tickets: db.after_sale_tickets.filter(t => t.order_id === order.id)});
  async function request(action) {
    const caller = actor();
    await new Promise(resolve => setTimeout(resolve, 120));
    const current = actor();
    if (caller.id !== current.id || caller.role !== current.role) throw new Error('登录状态已变更，请重新操作');
    return action(current);
  }
  return {
    listOrders: () => request(user => {
      const db = read();
      return db.orders.filter(order => visible(order, user)).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(order => detail(db, order));
    }),
    applyRefund: (id, payload) => request(user => {
      const db = read();
      const order = db.orders.find(row => row.id === id);
      if (user.role !== 'BUYER' || !order || order.buyer_id !== user.id) throw new Error('无权申请此订单退款');
      if (!['PAID', 'SHIPPED', 'COMPLETED'].includes(order.order_status)) throw new Error('仅已付款订单可申请退款');
      if (!['NONE', 'REJECTED'].includes(order.after_sale_status)) throw new Error('此订单已有售后申请，请勿重复提交');
      if (!payload || !['REFUND_ONLY', 'RETURN_REFUND'].includes(payload.ticket_type)) throw new Error('请选择有效的退款类型');
      if (payload.ticket_type === 'RETURN_REFUND' && order.order_status === 'PAID') throw new Error('待发货订单请选择仅退款');
      const reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';
      if (!reason || reason.length > 200) throw new Error('退款原因需填写 1–200 个字符');
      const amountText = String(payload.requested_amount ?? '');
      if (!/^\d+(\.\d{1,2})?$/.test(amountText)) throw new Error('退款金额最多保留两位小数');
      const cents = Math.round(Number(amountText) * 100);
      if (!Number.isSafeInteger(cents) || cents <= 0 || cents > Math.round(order.total_amount * 100)) throw new Error('退款金额须大于 0 且不超过订单金额');
      const evidence = payload.evidence_urls ?? [];
      if (!Array.isArray(evidence) || evidence.length > 3) throw new Error('最多上传 3 张凭证');
      for (const url of evidence) {
        if (typeof url !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url)) throw new Error('凭证仅支持 PNG、JPEG、WebP 图片');
        const encoded = url.split(',')[1];
        const bytes = encoded.length * 3 / 4 - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
        if (encoded.length % 4 || bytes > 300 * 1024) throw new Error('单张凭证不能超过 300 KB');
      }
      const now = new Date().toISOString();
      const ticketId = Math.max(0, ...db.after_sale_tickets.map(ticket => ticket.id)) + 1;
      db.after_sale_tickets.push({id: ticketId, ticket_no: `AS-${order.order_no}-${ticketId}`, order_id: order.id,
        buyer_id: user.id, merchant_id: order.merchant_id, ticket_type: payload.ticket_type, status: 'APPLIED',
        reason, requested_amount: cents / 100, evidence_urls: copy(evidence), created_at: now, updated_at: now});
      db.order_status_logs.push({id: db.order_status_logs.length + 1, order_id: order.id, operator_id: user.id,
        status_type: 'AFTER_SALE', from_status: order.after_sale_status, to_status: 'APPLIED', remark: '提交退款申请', created_at: now});
      order.after_sale_status = 'APPLIED';
      order.updated_at = now;
      try { localStorage.setItem(key, JSON.stringify(db)); }
      catch (error) { throw new Error('退款申请未保存，浏览器存储可能已满，请减少凭证大小后重试'); }
      return detail(db, order);
    }),
    payOrder: id => request(user => {
      const db = read();
      const order = db.orders.find(row => row.id === id);
      if (user.role !== 'BUYER' || !order || order.buyer_id !== user.id) throw new Error('无权支付此订单');
      // Repeat payment requests are idempotent, with one payment record and one log.
      if (order.order_status === 'PAID') return detail(db, order);
      if (order.order_status !== 'PENDING_PAYMENT') throw new Error('当前订单状态不允许支付');
      recordPayment(db, order, new Date().toISOString());
      localStorage.setItem(key, JSON.stringify(db));
      return detail(db, order);
    })
  };
})();
