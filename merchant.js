function merchantProductRows(products) {
  const statuses={ON_SALE:'在售',OFF_SALE:'已下架',DRAFT:'草稿'};
  return products.map(product=>`<tr><td>${escapeHtml(product.name)}<small>${escapeHtml(product.description)}</small></td><td>${escapeHtml(product.sku)}</td><td>${money(product.price)}</td><td>${product.stock}</td><td><span class="badge ${product.product_status==='ON_SALE'?'green':''}">${escapeHtml(statuses[product.product_status]||product.product_status)}</span></td></tr>`).join('');
}
async function loadMerchantProducts(container) {
  try {
    const products=await orderApi.listMerchantProducts();
    if (!container.isConnected) return;
    container.innerHTML=`<div class="panel-head"><h3>店铺商品 · ${products.length} 件</h3><button class="order-pay" id="refreshProducts">刷新列表</button></div><p class="hint">与商城首页共用商品目录，仅展示当前店铺商品。库存为演示值，暂不支持新增、编辑、上下架或库存扣减。</p>${products.length?`<div class="table-wrap"><table><thead><tr><th>商品名称 / 描述</th><th>SKU</th><th>售价</th><th>演示库存</th><th>上架状态</th></tr></thead><tbody>${merchantProductRows(products)}</tbody></table></div>`:'<div class="empty">本店暂无商品，新入驻商家不会继承其他店铺的商品。</div>'}`;
    container.querySelector('#refreshProducts').onclick=()=>loadMerchantProducts(container);
  } catch(error) {
    if (!container.isConnected) return;
    container.innerHTML=`<p role="status">${escapeHtml(error.message)}</p><button class="order-pay" id="retryProducts">重新加载</button>`;
    container.querySelector('#retryProducts').onclick=()=>loadMerchantProducts(container);
  }
}
