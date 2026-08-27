const orderStatusNames = {PENDING_PAYMENT: '待付款', PAID: '待发货', SHIPPED: '已发货', COMPLETED: '已完成', CANCELLED: '已取消', CLOSED: '已关闭'};
const afterSaleNames = {NONE: '无售后', APPLIED: '退款审核中', PROCESSING: '处理中', APPROVED: '已同意', REJECTED: '已拒绝', REFUNDING: '退款中', REFUNDED: '已退款', CLOSED: '已关闭'};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const money = amount => `¥ ${Number(amount).toFixed(2)}`;
const canApplyRefund = order => ['PAID', 'SHIPPED', 'COMPLETED'].includes(order.order_status) && ['NONE', 'REJECTED'].includes(order.after_sale_status);
function refundTicketDetails(ticket) {
  const evidence = (ticket.evidence_urls || []).filter(url => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url));
  return `<details class="refund-details"><summary>工单 ${escapeHtml(ticket.ticket_no)}</summary><p>${ticket.ticket_type === 'RETURN_REFUND' ? '退货退款' : '仅退款'} · ${money(ticket.requested_amount)}</p><p>${escapeHtml(ticket.reason)}</p><div class="refund-evidence">${evidence.map(url => `<img src="${escapeHtml(url)}" alt="退款凭证" loading="lazy">`).join('')}</div></details>`;
}
function orderRows(orders, actions = false) {
  return orders.map(order => `<tr><td>${escapeHtml(order.order_no)}<small>${escapeHtml(new Date(order.created_at).toLocaleString('zh-CN'))}</small></td>
    <td>${order.items.map(item => `${escapeHtml(item.product_name)} × ${item.quantity}`).join('<br>')}</td>
    <td>${money(order.total_amount)}</td><td><span class="badge ${order.order_status === 'PENDING_PAYMENT' || order.after_sale_status === 'APPLIED' ? 'orange' : 'green'}">${escapeHtml(order.after_sale_status === 'APPLIED' ? '退款审核中' : orderStatusNames[order.order_status] || order.order_status)}</span>${order.after_sale_status === 'APPLIED' ? `<small>原订单状态：${escapeHtml(orderStatusNames[order.order_status])}</small>` : ''}</td>
    <td>${escapeHtml(afterSaleNames[order.after_sale_status] || order.after_sale_status)}${order.after_sale_tickets.map(refundTicketDetails).join('')}</td>
    ${actions ? `<td>${order.order_status === 'PENDING_PAYMENT' ? `<button class="order-pay" data-pay-order="${order.id}">模拟支付</button>` : canApplyRefund(order) ? `<button class="order-pay" data-refund-order="${order.id}">申请退款</button>` : '—'}</td>` : ''}</tr>`).join('');
}
function wirePayments(container, refresh) {
  container.querySelectorAll('[data-pay-order]').forEach(button => {
    button.onclick = async () => {
      button.disabled = true;
      button.textContent = '支付中…';
      try {
        await orderApi.payOrder(Number(button.dataset.payOrder));
        if (container.isConnected) await refresh('模拟支付成功，订单已变为“待发货”。');
      } catch (error) {
        if (!container.isConnected) return;
        container.querySelector('[role="status"]').textContent = error.message;
        button.disabled = false;
        button.textContent = '模拟支付';
      }
    };
  });
}
async function loadHomeOrders(container) {
  const refresh = async (message = '') => {
    try {
      const orders = await orderApi.listOrders();
      if (!container.isConnected) return;
      const current = orders.find(order => order.order_status === 'PENDING_PAYMENT') || orders[0];
      container.innerHTML = `<div><p class="eyebrow">DEMO PAYMENT</p><h2>模拟订单付款</h2><p>${current ? `${escapeHtml(current.order_no)} · ${current.items.map(item => escapeHtml(item.product_name)).join('、')} · ${money(current.total_amount)}` : '暂无订单，新账号不会继承其他买家的订单。'}</p><p role="status" aria-live="polite">${escapeHtml(message)}</p></div>
        <div class="pay-action">${current ? `<span class="status-pill ${current.order_status !== 'PENDING_PAYMENT' ? 'paid' : ''}">${escapeHtml(orderStatusNames[current.order_status])}</span>${current.order_status === 'PENDING_PAYMENT' ? `<button data-pay-order="${current.id}">模拟支付</button>` : ''}` : ''}<button id="viewOrders">查看我的订单</button></div>`;
      container.querySelector('#viewOrders').onclick = () => buyerOrdersView();
      wirePayments(container, refresh);
    } catch (error) {
      if (!container.isConnected) return;
      container.innerHTML = `<div><h2>订单加载失败</h2><p role="status">${escapeHtml(error.message)}</p></div><div class="pay-action"><button id="retryOrders">重试</button></div>`;
      container.querySelector('#retryOrders').onclick = () => refresh();
    }
  };
  await refresh();
}
function buyerOrdersView(initialMessage = '') {
  const user = JSON.parse(sessionStorage.getItem('ecom_session') || 'null');
  if (!user || user.role !== 'BUYER') return authView();
  app.innerHTML = `<div class="store"><header class="store-head"><a class="store-logo">QINGLAN <small>青岚选物</small></a><div class="store-user">你好，${escapeHtml(user.name)}<button id="backStore">商城首页</button><button id="exitOrders">退出</button></div></header>
    <main class="orders-page"><p class="eyebrow">MY ORDERS</p><h1>我的订单</h1><p>查看历史订单与售后进度 · 模拟支付不会产生真实扣款</p><section id="buyerOrders" class="panel"><p role="status">正在加载订单…</p></section></main></div>`;
  document.querySelector('#backStore').onclick = () => storeHome(user);
  document.querySelector('#exitOrders').onclick = () => {sessionStorage.removeItem('ecom_session'); authView();};
  const container = document.querySelector('#buyerOrders');
  const refresh = async (message = '') => {
    try {
      const orders = await orderApi.listOrders();
      if (!container.isConnected) return;
      container.innerHTML = `<div class="panel-head"><h3>历史订单 · ${orders.length} 笔</h3><button id="refreshOrders" class="order-pay">刷新</button></div><p class="order-message" role="status" aria-live="polite">${escapeHtml(message)}</p>${orders.length ? `<div class="table-wrap"><table><thead><tr><th>订单编号 / 下单时间</th><th>商品</th><th>金额</th><th>订单状态</th><th>售后状态</th><th>操作</th></tr></thead><tbody>${orderRows(orders, true)}</tbody></table></div>` : '<p class="order-empty">暂无历史订单，去商城逛逛吧。</p>'}`;
      container.querySelector('#refreshOrders').onclick = () => refresh();
      wirePayments(container, refresh);
      container.querySelectorAll('[data-refund-order]').forEach(button => {
        button.onclick = () => refundView(orders.find(order => order.id === Number(button.dataset.refundOrder)));
      });
    } catch (error) {
      if (!container.isConnected) return;
      container.innerHTML = `<p class="order-message" role="status">${escapeHtml(error.message)}</p><button id="retryOrders" class="order-pay">重新加载</button>`;
      container.querySelector('#retryOrders').onclick = () => refresh();
    }
  };
  refresh(initialMessage);
}
async function loadDashboardOrders(container) {
  try {
    const orders = await orderApi.listOrders();
    if (container.isConnected) container.innerHTML = orderRows(orders) || '<tr><td colspan="5">暂无订单</td></tr>';
  } catch (error) {
    if (container.isConnected) container.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
  }
}
