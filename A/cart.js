function wireProductCart(container) {
  const cartButton = container.querySelector('#myCart');
  const message = container.querySelector('#cartNotice');
  cartButton.onclick = () => cartPage();
  orderApi.getCart().then(cart => {if (cartButton.isConnected) cartButton.textContent = `购物车 (${cart.count})`;}).catch(error => {if (message.isConnected) message.textContent = error.message;});
  container.querySelectorAll('[data-add-cart]').forEach(button => {
    button.onclick = async () => {
      button.disabled = true;
      button.textContent = '加入中…';
      try {
        const cart = await orderApi.addToCart(Number(button.dataset.addCart));
        if (!button.isConnected) return;
        cartButton.textContent = `购物车 (${cart.count})`;
        message.textContent = '已加入购物车，可前往购物车勾选结算。';
      } catch (error) {if (message.isConnected) message.textContent = error.message;}
      finally {if (button.isConnected) {button.disabled = false; button.textContent = '加入购物车';}}
    };
  });
}
function cartContents(cart) {
  if (!cart.items.length) return '<div class="order-empty"><h3>购物车还是空的</h3><p>返回商城，挑选喜欢的商品吧。</p></div>';
  return `<div class="table-wrap"><table><thead><tr><th>选择</th><th>商品</th><th>单价</th><th>数量</th><th>小计</th><th>操作</th></tr></thead><tbody>${cart.items.map(item => `<tr>
    <td><input type="checkbox" data-select-cart="${item.product_id}" ${item.selected ? 'checked' : ''} aria-label="选择${escapeHtml(item.product.name)}"></td>
    <td>${escapeHtml(item.product.name)}<small>${escapeHtml(item.product.description)}</small></td><td>${money(item.product.price)}</td>
    <td><div class="cart-quantity"><button data-quantity-cart="${item.product_id}" data-quantity="${item.quantity - 1}" ${item.quantity <= 1 ? 'disabled' : ''} aria-label="减少${escapeHtml(item.product.name)}数量">−</button><span>${item.quantity}</span><button data-quantity-cart="${item.product_id}" data-quantity="${item.quantity + 1}" ${item.quantity >= 99 ? 'disabled' : ''} aria-label="增加${escapeHtml(item.product.name)}数量">＋</button></div></td>
    <td>${money(item.subtotal)}</td><td><button class="cart-remove" data-remove-cart="${item.product_id}">移除</button></td></tr>`).join('')}</tbody></table></div>
    <div class="cart-summary"><label><input id="selectAllCart" type="checkbox" ${cart.items.every(item => item.selected) ? 'checked' : ''}> 全选</label><span>已选 ${cart.selected_count} 件 · 合计 <strong>${money(cart.total)}</strong></span><button class="order-pay" id="checkoutCart" ${cart.selected_count ? '' : 'disabled'}>结算（生成待付款订单）</button></div>`;
}
function cartPage() {
  const user = JSON.parse(sessionStorage.getItem('ecom_session') || 'null');
  if (!user || user.role !== 'BUYER') return authView();
  app.innerHTML = `<div class="store"><header class="store-head"><a class="store-logo">QINGLAN <small>青岚选物</small></a><div class="store-user"><button id="cartHome">商城首页</button><button id="cartOrders">我的订单</button></div></header><main class="orders-page"><p class="eyebrow">SHOPPING CART</p><h1>购物车</h1><p>勾选商品后结算，再到订单列表模拟支付。本演示不产生真实扣款。</p><p id="cartStatus" role="status" aria-live="polite">正在加载购物车…</p><section class="panel" id="cartContent"></section></main></div>`;
  document.querySelector('#cartHome').onclick = () => storeHome(user);
  document.querySelector('#cartOrders').onclick = () => buyerOrdersView();
  const container = document.querySelector('#cartContent'), status = document.querySelector('#cartStatus');
  let busy = false;
  const render = cart => {
    container.innerHTML = cartContents(cart);
    const selectAll = container.querySelector('#selectAllCart');
    if (selectAll) {
      selectAll.indeterminate = cart.items.some(item => item.selected) && !cart.items.every(item => item.selected);
      selectAll.onchange = () => mutate(() => orderApi.selectCart(selectAll.checked));
    }
    container.querySelectorAll('[data-select-cart]').forEach(input => {input.onchange = () => mutate(() => orderApi.updateCart(Number(input.dataset.selectCart), {selected:input.checked}));});
    container.querySelectorAll('[data-quantity-cart]').forEach(button => {button.onclick = () => mutate(() => orderApi.updateCart(Number(button.dataset.quantityCart), {quantity:Number(button.dataset.quantity)}));});
    container.querySelectorAll('[data-remove-cart]').forEach(button => {button.onclick = () => mutate(() => orderApi.removeFromCart(Number(button.dataset.removeCart)));});
    const checkout = container.querySelector('#checkoutCart');
    if (checkout) checkout.onclick = () => mutate(() => orderApi.checkoutCart(), true);
  };
  const load = async (message = '') => {
    try {
      const cart = await orderApi.getCart();
      if (!container.isConnected) return;
      render(cart);
      status.textContent = message;
    } catch (error) {
      if (!container.isConnected) return;
      status.textContent = error.message;
      container.innerHTML = '<button class="order-pay" id="retryCart">重新加载</button>';
      container.querySelector('#retryCart').onclick = () => load();
    }
  };
  const mutate = async (action, checkout = false) => {
    if (busy) return;
    busy = true;
    container.querySelectorAll('button,input').forEach(element => {element.disabled = true;});
    status.textContent = checkout ? '正在创建订单…' : '正在更新购物车…';
    try {
      const result = await action();
      if (!container.isConnected) return;
      if (checkout) buyerOrdersView(`结算成功，已生成 ${result.length} 笔待付款订单，请继续模拟支付。`);
      else {render(result); status.textContent = '购物车已更新';}
    } catch (error) {if (container.isConnected) await load(`操作失败：${error.message}`);}
    finally {busy = false;}
  };
  load();
}
