function merchantProductRows(products) {
  const statuses={ON_SALE:'在售',OFF_SALE:'已下架',DRAFT:'草稿'};
  return products.map(product=>`<tr><td>${escapeHtml(product.name)}<small>${escapeHtml(product.description)}</small></td><td>${escapeHtml(product.sku)}</td><td>${money(product.price)}</td><td>${product.stock}</td><td><span class="badge ${product.product_status==='ON_SALE'?'green':''}">${escapeHtml(statuses[product.product_status]||product.product_status)}</span></td></tr>`).join('');
}
async function loadMerchantProducts(container) {
  return loadBusinessPage(container,'products');
}
