async function readRefundEvidence(files) {
  if (files.length > 3) throw new Error('最多上传 3 张凭证');
  for (const file of files) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('凭证仅支持 PNG、JPEG、WebP 图片');
    if (file.size === 0 || file.size > 300 * 1024) throw new Error('请上传非空图片，单张不能超过 300 KB');
  }
  return Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('凭证读取失败，请重新选择图片'));
    reader.onabort = () => reject(new Error('凭证读取已取消，请重试'));
    reader.readAsDataURL(file);
  })));
}
function refundView(order) {
  const user = JSON.parse(sessionStorage.getItem('ecom_session') || 'null');
  if (!user || user.role !== 'BUYER') return authView();
  if (!order || order.buyer_id !== user.id || !canApplyRefund(order)) return buyerOrdersView('该订单暂不可申请退款。');
  app.innerHTML = `<div class="store"><header class="store-head"><a class="store-logo">QINGLAN <small>青岚选物</small></a><div class="store-user"><button id="backOrders">返回订单列表</button></div></header>
    <main class="orders-page refund-page"><p class="eyebrow">AFTER-SALES SERVICE</p><h1>申请退款</h1><p>提交后进入退款审核，不会立即退款或产生真实资金变动。</p>
    <section class="panel"><h3>订单 ${escapeHtml(order.order_no)}</h3><p>${order.items.map(item => `${escapeHtml(item.product_name)} × ${item.quantity}`).join('、')}</p><p>订单金额：${money(order.total_amount)} · ${escapeHtml(orderStatusNames[order.order_status])}</p>
    <form id="refundForm"><fieldset id="refundFields"><legend>退款申请信息</legend>
      <label for="refundType">退款类型</label><select class="input" id="refundType" name="ticket_type" required><option value="REFUND_ONLY">仅退款</option><option value="RETURN_REFUND" ${order.order_status === 'PAID' ? 'disabled' : ''}>退货退款</option></select>
      ${order.order_status === 'PAID' ? '<p class="hint">订单尚未发货，仅支持“仅退款”。</p>' : ''}
      <label for="refundReason">退款原因</label><textarea class="input" id="refundReason" name="reason" rows="4" maxlength="200" required placeholder="请说明退款原因（最多 200 字）"></textarea>
      <label for="refundAmount">退款金额（元）</label><input class="input" id="refundAmount" name="requested_amount" type="number" min="0.01" max="${order.total_amount.toFixed(2)}" step="0.01" value="${order.total_amount.toFixed(2)}" required aria-describedby="refundAmountHint"><p class="hint" id="refundAmountHint">最多可申请 ${money(order.total_amount)}，支持两位小数。</p>
      <label for="refundEvidence">上传凭证（选填）</label><input class="input" id="refundEvidence" name="evidence" type="file" accept="image/png,image/jpeg,image/webp" multiple aria-describedby="refundEvidenceHint"><p class="hint" id="refundEvidenceHint">最多 3 张 PNG/JPEG/WebP 图片，每张不超过 300 KB。凭证仅保存在当前浏览器，不会上传到服务器。</p><p id="selectedEvidence" class="hint" aria-live="polite"></p>
      <button type="submit" class="btn btn-primary" id="submitRefund">提交退款申请</button>
    </fieldset><p id="refundMessage" class="error" role="status" aria-live="polite"></p></form></section></main></div>`;
  const form = document.querySelector('#refundForm');
  const back = document.querySelector('#backOrders');
  const fields = document.querySelector('#refundFields');
  const button = document.querySelector('#submitRefund');
  const message = document.querySelector('#refundMessage');
  const evidenceInput = document.querySelector('#refundEvidence');
  back.onclick = () => buyerOrdersView();
  evidenceInput.onchange = () => {
    document.querySelector('#selectedEvidence').textContent = Array.from(evidenceInput.files).map(file => `${file.name} (${Math.ceil(file.size / 1024)} KB)`).join('、');
  };
  let submitting = false;
  form.onsubmit = async event => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    const values = new FormData(form);
    const files = Array.from(evidenceInput.files);
    submitting = true;
    fields.disabled = true;
    back.disabled = true;
    button.textContent = '正在提交…';
    message.textContent = '';
    try {
      const evidence_urls = await readRefundEvidence(files);
      if (!form.isConnected) return;
      const current = JSON.parse(sessionStorage.getItem('ecom_session') || 'null');
      if (!current || current.id !== user.id || current.role !== 'BUYER') throw new Error('登录状态已变更，请重新登录');
      await orderApi.applyRefund(order.id, {ticket_type: values.get('ticket_type'), reason: values.get('reason'), requested_amount: values.get('requested_amount'), evidence_urls});
      if (form.isConnected) buyerOrdersView('退款申请已提交，当前状态：退款审核中。');
    } catch (error) {
      if (form.isConnected) message.textContent = error.message;
    } finally {
      submitting = false;
      if (form.isConnected) {
        fields.disabled = false;
        back.disabled = false;
        button.textContent = '提交退款申请';
      }
    }
  };
}
