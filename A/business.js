function businessInput(name,label,value='',type='text') {
  return `<label for="field-${name}">${label}</label><input class="input" id="field-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${type==='number'?'min="0" step="any"':''}>`;
}
async function loadBusinessPage(container,mode,message='') {
  let busy=false;
  const run=async(action)=>{
    if(busy) return;busy=true;
    container.querySelectorAll('button').forEach(b=>{b.disabled=true;});
    try {await action();if(container.isConnected) await loadBusinessPage(container,mode,'操作成功，数据已保存');}
    catch(error) {if(container.isConnected){container.querySelector('[role=status]').textContent=error.message;container.querySelectorAll('button').forEach(b=>{b.disabled=false;});}}
    finally {busy=false;}
  };
  try {
    const data=await ({products:()=>orderApi.listMerchantProducts(),governance:()=>orderApi.listGovernance(),tickets:()=>orderApi.listMerchantTickets(),shop:()=>orderApi.getShop(),orders:()=>orderApi.listOrders()}[mode])();
    if(!container.isConnected) return;
    const names={products:'商品管理',governance:'商品治理',tickets:'售后管理',shop:'店铺设置',orders:'订单管理'};
    let body='';
    if(mode==='shop') body=`<form id="businessForm" class="business-form">${businessInput('name','店铺名称',data.name)}${businessInput('contact','联系方式',data.contact)}${businessInput('description','店铺介绍',data.description)}${businessInput('delivery_note','配送说明',data.delivery_note)}${businessInput('after_sale_note','售后说明',data.after_sale_note)}<label><input name="open" type="checkbox" ${data.open?'checked':''}> 正常营业（取消勾选后隐藏本店在售商品，禁止新结算）</label><button class="order-pay">保存设置</button></form>`;
    if(mode==='products') body=`<button class="order-pay" id="newProduct">新增商品</button><div id="productEditor"></div><div class="table-wrap"><table><thead><tr><th>商品</th><th>SKU</th><th>售价</th><th>库存</th><th>状态 / 操作</th></tr></thead><tbody>${data.map(p=>`<tr><td>${escapeHtml(p.name)}<small>${escapeHtml(p.description)}</small></td><td>${escapeHtml(p.sku)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td>${p.product_status==='ON_SALE'?'在售':p.product_status==='DRAFT'?'草稿':'已下架'}${p.governance_locked?`<small>平台限制：${escapeHtml(p.governance_reason)}</small>`:''}<button class="order-pay" data-edit="${p.id}">编辑 / 上下架</button></td></tr>`).join('')||'<tr><td colspan="5">本店暂无商品，可点击新增商品。</td></tr>'}</tbody></table></div>`;
    if(mode==='governance') body=`<p class="hint">下架将立即限制购买及商家上架。解除限制后仍保持下架，需商家重新上架。</p><div class="table-wrap"><table><thead><tr><th>商品 / 所属商家</th><th>售价</th><th>状态</th><th>治理操作</th></tr></thead><tbody>${data.products.map(p=>`<tr><td>${escapeHtml(p.name)}<small>商家 ID：${p.merchant_id}</small></td><td>${money(p.price)}</td><td>${p.governance_locked?'平台限制上架':escapeHtml(p.product_status)}<small>${escapeHtml(p.governance_reason||'')}</small></td><td><label for="reason-${p.id}">处理原因（必填）</label><input class="input" maxlength="200" id="reason-${p.id}"><button class="order-pay" data-govern="${p.id}">${p.governance_locked?'解除限制':'下架并限制上架'}</button></td></tr>`).join('')||'<tr><td colspan="4">暂无商品</td></tr>'}</tbody></table></div><h3>处理记录</h3><ul>${data.logs.slice().reverse().map(log=>`<li>商品 ${log.product_id} · ${escapeHtml(log.action)} · ${escapeHtml(log.reason)} · 管理员 ${log.operator_id} · ${escapeHtml(log.created_at)}</li>`).join('')||'<li>暂无治理记录</li>'}</ul>`;
    if(mode==='tickets') body=`<p class="hint">审核通过后，可执行模拟退款。退货退款需先确认收到退货；此演示不连接物流或真实支付渠道。</p><div class="table-wrap"><table><thead><tr><th>订单 / 申请详情</th><th>工单状态</th><th>处理</th></tr></thead><tbody>${data.map(t=>`<tr><td>${escapeHtml(t.order_no)}${refundTicketDetails(t)}</td><td>${escapeHtml(({APPLIED:'待审核',PROCESSING:'处理中',APPROVED:'已同意',REJECTED:'已拒绝',COMPLETED:'已退款'})[t.status]||t.status)}<small>${escapeHtml(t.merchant_reply||'')}</small></td><td>${['APPLIED','PROCESSING','APPROVED'].includes(t.status)?`<label for="reply-${t.id}">处理备注（拒绝必填）</label><input class="input" id="reply-${t.id}" maxlength="200">${t.status==='APPROVED'?`<button class="order-pay" data-ticket="${t.id}" data-action="REFUND">${t.ticket_type==='RETURN_REFUND'?'确认收到退货并模拟退款':'执行模拟退款'}</button>`:`<button class="order-pay" data-ticket="${t.id}" data-action="APPROVE">同意申请</button><button class="order-pay" data-ticket="${t.id}" data-action="REJECT">拒绝申请</button>`}`:'处理已结束'}</td></tr>`).join('')||'<tr><td colspan="3">暂无售后申请</td></tr>'}</tbody></table></div>`;
    if(mode==='orders') body=`<div class="table-wrap"><table><thead><tr><th>订单</th><th>商品</th><th>金额</th><th>订单状态</th><th>售后状态</th></tr></thead><tbody>${orderRows(data)||'<tr><td colspan="5">暂无订单</td></tr>'}</tbody></table></div><h3>待发货操作</h3>${data.filter(o=>o.order_status==='PAID'&&['NONE','REJECTED','CLOSED'].includes(o.after_sale_status)).map(o=>`<p>${escapeHtml(o.order_no)} <button class="order-pay" data-ship="${o.id}">模拟发货</button></p>`).join('')||'<p>暂无可发货订单</p>'}`;
    container.innerHTML=`<div class="panel-head"><h3>${names[mode]}</h3><button id="refreshBusiness" class="order-pay">刷新</button></div><p role="status" aria-live="polite">${escapeHtml(message)}</p>${body}`;
    container.querySelector('#refreshBusiness').onclick=()=>loadBusinessPage(container,mode);
    if(mode==='shop') container.querySelector('#businessForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);run(()=>orderApi.saveShop({...Object.fromEntries(f),open:f.has('open')}));};
    if(mode==='products') {
      const edit=product=>{
        const p=product||{name:'',description:'',price:'',stock:0,product_status:'DRAFT'};
        const editor=container.querySelector('#productEditor');
        editor.innerHTML=`<form id="productForm" class="business-form"><h3>${product?'编辑商品':'新增商品'}</h3>${businessInput('name','商品名称',p.name)}${businessInput('description','描述',p.description)}${businessInput('price','售价（元）',p.price,'number')}${businessInput('stock','库存',p.stock,'number')}<label for="productStatus">商品状态</label><select class="input" id="productStatus" name="product_status">${[['DRAFT','草稿'],['ON_SALE','在售'],['OFF_SALE','已下架']].map(([value,label])=>`<option value="${value}" ${p.product_status===value?'selected':''}>${label}</option>`).join('')}</select><button class="order-pay">保存商品</button><button class="order-pay" type="button" id="cancelEdit">取消</button></form>`;
        editor.querySelector('#cancelEdit').onclick=()=>{editor.innerHTML='';};
        editor.querySelector('#productForm').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));run(()=>orderApi.saveProduct(product?.id??null,values));};
      };
      container.querySelector('#newProduct').onclick=()=>edit(null);
      container.querySelectorAll('[data-edit]').forEach(b=>{b.onclick=()=>edit(data.find(p=>p.id===Number(b.dataset.edit)));});
    }
    container.querySelectorAll('[data-govern]').forEach(b=>{b.onclick=()=>{const p=data.products.find(p=>p.id===Number(b.dataset.govern));const reason=container.querySelector(`#reason-${p.id}`).value;run(()=>orderApi.governProduct(p.id,!p.governance_locked,reason));};});
    container.querySelectorAll('[data-ticket]').forEach(b=>{b.onclick=()=>{const note=container.querySelector(`#reply-${b.dataset.ticket}`).value;run(()=>orderApi.reviewRefund(Number(b.dataset.ticket),b.dataset.action,note));};});
    container.querySelectorAll('[data-ship]').forEach(b=>{b.onclick=()=>run(()=>orderApi.shipOrder(Number(b.dataset.ship)));});
  } catch(error) {
    if(!container.isConnected)return;
    container.innerHTML=`<p role="status">${escapeHtml(error.message)}</p><button class="order-pay" id="retryBusiness">重新加载</button>`;
    container.querySelector('#retryBusiness').onclick=()=>loadBusinessPage(container,mode);
  }
}
async function loadStoreCatalog(container) {
  const grid=container.querySelector('.product-grid');
  grid.innerHTML='<p role="status">正在加载商品…</p>';
  try {
    const products=await orderApi.listStoreProducts();
    if(!grid.isConnected)return;
    grid.innerHTML=products.map(p=>`<article class="product-card"><div class="product-img" style="--product-bg:${escapeHtml(p.background)}"><b>${escapeHtml(p.icon)}</b><em>${escapeHtml(p.tag)}</em></div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description)}</p><strong>${money(p.price)}</strong><button class="add-cart" data-add-cart="${p.id}" ${p.stock===0?'disabled':''}>${p.stock===0?'暂时缺货':'加入购物车'}</button></article>`).join('')||'<p>暂无在售商品</p>';
    container.querySelector('#productCount').textContent=`在售 ${products.length} 件好物`;
    wireProductCart(container);
  } catch(error) {if(grid.isConnected){grid.innerHTML=`<p role="status">${escapeHtml(error.message)}</p><button id="retryCatalog" class="order-pay">重新加载商品</button>`;grid.querySelector('#retryCatalog').onclick=()=>loadStoreCatalog(container);}}
}
