function platformRefundRows(tickets) {
  const statuses={APPLIED:'待审核',PROCESSING:'处理中',APPROVED:'已同意',REJECTED:'已驳回',COMPLETED:'已退款',CLOSED:'已关闭'};
  return tickets.map(ticket=>`<tr><td>${escapeHtml(ticket.order_no)}<small>买家 ID：${ticket.buyer_id} · 商家 ID：${ticket.merchant_id}</small>${refundTicketDetails(ticket)}</td><td>${escapeHtml(statuses[ticket.status]||ticket.status)}</td><td>${ticket.can_force_refund||ticket.can_reject?`<label for="platformReason-${ticket.id}">介入原因（必填）</label><textarea class="input" id="platformReason-${ticket.id}" rows="3" maxlength="200" placeholder="请填写平台处理依据"></textarea><div class="review-actions">${ticket.can_force_refund?`<button class="order-pay" data-platform-ticket="${ticket.id}" data-decision="FORCE_REFUND">强制退款（模拟）</button>`:''}${ticket.can_reject?`<button class="order-pay" data-platform-ticket="${ticket.id}" data-decision="REJECT">驳回申请</button>`:''}</div>`:'已结束或不可介入'}</td></tr>`).join('');
}
async function loadPlatformRefunds(container,message='') {
  let busy=false;
  try {
    const tickets=await orderApi.listPlatformTickets();
    if(!container.isConnected)return;
    container.innerHTML=`<div class="panel-head"><h3>平台售后介入</h3><button class="order-pay" id="refreshPlatform">刷新列表</button></div><p class="hint">强制退款按工单申请金额执行，可处理商家已拒绝的最新申请。两种操作均需填写原因并确认；已退款或已被平台处理的工单不能重复处理。不产生真实资金流动。</p><p role="status" aria-live="polite">${escapeHtml(message)}</p><div class="table-wrap"><table><thead><tr><th>订单 / 售后详情</th><th>状态</th><th>平台处理</th></tr></thead><tbody>${platformRefundRows(tickets)||'<tr><td colspan="3">暂无售后工单</td></tr>'}</tbody></table></div><div id="platformConfirm"></div>`;
    container.querySelector('#refreshPlatform').onclick=()=>loadPlatformRefunds(container);
    container.querySelectorAll('[data-platform-ticket]').forEach(button=>{button.onclick=()=>{
      if(busy)return;
      const id=Number(button.dataset.platformTicket),decision=button.dataset.decision;
      const reason=container.querySelector(`#platformReason-${id}`).value.trim();
      const status=container.querySelector('[role=status]');
      if(!reason||reason.length>200){status.textContent='请填写 1–200 字平台处理原因';return;}
      const ticket=tickets.find(ticket=>ticket.id===id),confirm=container.querySelector('#platformConfirm');
      container.querySelectorAll('button').forEach(button=>{button.disabled=true;});
      busy=true;
      confirm.innerHTML=`<section class="business-form" role="region" aria-label="确认平台处理"><h3>确认${decision==='FORCE_REFUND'?'强制退款':'驳回申请'}</h3><p>订单：${escapeHtml(ticket.order_no)} · 工单：${escapeHtml(ticket.ticket_no)}</p><p>申请金额：${money(ticket.requested_amount)}</p><p>原因：${escapeHtml(reason)}</p><button class="order-pay" id="confirmIntervention">确认处理</button><button class="order-pay" id="cancelIntervention">取消</button></section>`;
      confirm.querySelector('#cancelIntervention').onclick=()=>{confirm.innerHTML='';busy=false;container.querySelectorAll('button').forEach(button=>{button.disabled=false;});};
      const submit=confirm.querySelector('#confirmIntervention');
      submit.focus();
      submit.onclick=async()=>{
        confirm.querySelectorAll('button').forEach(button=>{button.disabled=true;});
        try {await orderApi.interveneRefund(id,decision,reason);if(container.isConnected) await loadPlatformRefunds(container,'平台处理已保存，订单售后状态已同步');}
        catch(error) {if(container.isConnected){status.textContent=error.message;confirm.innerHTML='';busy=false;container.querySelectorAll('button').forEach(button=>{button.disabled=false;});}}
      };
    };});
  } catch(error) {
    if(!container.isConnected)return;
    container.innerHTML=`<p role="status">${escapeHtml(error.message)}</p><button class="order-pay" id="retryPlatform">重新加载</button>`;
    container.querySelector('#retryPlatform').onclick=()=>loadPlatformRefunds(container);
  }
}
