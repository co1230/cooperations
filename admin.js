const accountStatusNames={ACTIVE:'正常',DISABLED:'已封禁',PENDING:'待审核 / 未开通'};
const reviewStatusNames={PENDING:'待审核',APPROVED:'已通过',REJECTED:'已拒绝'};
function adminUsersRows(users) {
  return users.map(user=>`<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(roleNames[user.role])}</td><td>${escapeHtml(accountStatusNames[user.account_status])}</td><td>${user.role==='ADMIN' ? '管理员（受保护）' : user.account_status==='PENDING' ? '请前往商家审核' : `<button class="order-pay" data-account-id="${user.id}" data-account-status="${user.account_status==='DISABLED'?'ACTIVE':'DISABLED'}">${user.account_status==='DISABLED'?'解封':'封禁'}</button>`}</td></tr>`).join('');
}
function merchantReviewRows(users) {
  return users.filter(user=>user.merchant_application).map(user=>{
    const a=user.merchant_application;
    return `<tr><td>${escapeHtml(user.name)}<small>${escapeHtml(user.email)}</small></td><td>${escapeHtml(a.contact)}<small>${escapeHtml(a.description)}</small></td><td>${escapeHtml(new Date(a.submitted_at).toLocaleString('zh-CN'))}</td><td>${reviewStatusNames[a.status]}${a.reviewed_at?`<small>审核时间：${escapeHtml(new Date(a.reviewed_at).toLocaleString('zh-CN'))}</small>`:''}</td><td>${a.status==='PENDING'?`<label for="reviewNote-${user.id}">审核备注（拒绝必填）</label><input class="input" id="reviewNote-${user.id}" maxlength="200" placeholder="填写审核意见"><div class="review-actions"><button class="order-pay" data-review-id="${user.id}" data-decision="APPROVED">通过</button><button class="order-pay" data-review-id="${user.id}" data-decision="REJECTED">拒绝</button></div>`:escapeHtml(a.review_note||'无备注')}</td></tr>`;
  }).join('');
}
async function loadAdminPage(container,title) {
  const reviews=title==='商家审核';
  let busy=false;
  const refresh=async(message='')=>{
    try {
      const users=await accountService.listUsers();
      if (!container.isConnected) return;
      const rows=reviews?merchantReviewRows(users):adminUsersRows(users);
      container.innerHTML=`<div class="panel-head"><h3>${title}</h3><button id="refreshAdmin" class="order-pay">刷新列表</button></div><p class="hint">${reviews?'演示入驻账号：apply1@demo.com、apply2@demo.com，密码 123456；通过后才能登录。':'封禁后无法登录，也不能继续使用购物车、支付等模拟接口。'}</p><p id="adminMessage" role="status" aria-live="polite">${escapeHtml(message)}</p><div class="table-wrap"><table><thead><tr>${(reviews?['店铺 / 邮箱','联系人 / 申请说明','申请时间','审核状态','审核操作 / 备注']:['用户','邮箱','角色','账号状态','操作']).map(label=>`<th>${label}</th>`).join('')}</tr></thead><tbody>${rows||'<tr><td colspan="5">暂无数据</td></tr>'}</tbody></table></div>`;
      container.querySelector('#refreshAdmin').onclick=()=>refresh();
      container.querySelectorAll('[data-account-id]').forEach(button=>{button.onclick=()=>run(()=>accountService.setStatus(Number(button.dataset.accountId),button.dataset.accountStatus),'账号状态已更新');});
      container.querySelectorAll('[data-review-id]').forEach(button=>{button.onclick=()=>{
        const id=Number(button.dataset.reviewId),note=container.querySelector(`#reviewNote-${id}`).value;
        run(()=>accountService.reviewMerchant(id,button.dataset.decision,note),'审核结果已保存');
      };});
    } catch(error) {
      if (!container.isConnected) return;
      container.innerHTML=`<p role="status">${escapeHtml(error.message)}</p><button id="retryAdmin" class="order-pay">重新加载</button>`;
      container.querySelector('#retryAdmin').onclick=()=>refresh();
    }
  };
  const run=async(action,message)=>{
    if (busy) return;
    busy=true;
    container.querySelectorAll('button').forEach(button=>{button.disabled=true;});
    try {await action(); if(container.isConnected) await refresh(message);}
    catch(error) {
      if(container.isConnected) {
        container.querySelector('#adminMessage').textContent=error.message;
        container.querySelectorAll('button').forEach(button=>{button.disabled=false;});
      }
    } finally {busy=false;}
  };
  await refresh();
}
