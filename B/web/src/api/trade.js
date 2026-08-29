function identityHeaders() {
  const user = window.luoboUser || {}
  return {
    'Content-Type': 'application/json',
    'X-User-Id': String(user.id || 10001),
    'X-User-Name': encodeURIComponent(user.username || user.nickname || '演示用户'),
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { ...identityHeaders(), ...(options.headers || {}) } })
  let body
  try { body = await response.json() } catch { body = null }
  if (!response.ok || body?.code !== 200) {
    const detail = Array.isArray(body?.detail)
      ? body.detail.map((item) => `${item.loc?.slice(1).join('.') || '参数'}：${item.msg}`).join('；')
      : body?.detail
    throw new Error(detail || body?.message || `请求失败 (${response.status})`)
  }
  return body.data
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })
export const tradeApi = {
  cart: () => request('/api/cart/items'),
  addCart: (item) => request('/api/cart/items', json('POST', { source_product_id: item.productId, spec_labels: item.skuLabels, quantity: item.qty || 1 })),
  updateCart: (id, patch) => request(`/api/cart/items/${id}`, json('PATCH', { quantity: patch.qty, selected: patch.checked })),
  deleteCart: (id) => request(`/api/cart/items/${id}`, { method: 'DELETE' }),
  selectCart: (ids, selected) => request('/api/cart/selection', json('PUT', { item_ids: ids.map(Number), selected })),
  preview: (payload) => request('/api/checkout/preview', json('POST', payload)),
  createOrders: (payload) => request('/api/orders', json('POST', payload)),
  orders: () => request('/api/orders'),
  order: (id) => request(`/api/orders/${id}`),
  pay: (payload) => request('/api/payments/mock', json('POST', payload)),
  cancel: (id) => request(`/api/orders/${id}/cancel`, { method: 'POST' }),
  confirm: (id) => request(`/api/orders/${id}/confirm`, { method: 'POST' }),
  afterSale: (id, payload) => request(`/api/orders/${id}/after-sales`, json('POST', payload)),
}

export const requestId = (prefix) => `${prefix}-${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(16).slice(2)}`
