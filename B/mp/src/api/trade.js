import Taro from '@tarojs/taro'

const base = process.env.TARO_APP_C_API || 'http://127.0.0.1:8002/api'
async function request(path, method = 'GET', data) {
  const response = await Taro.request({ url: `${base}${path}`, method, data, header: { 'X-User-Id': '10001', 'X-User-Name': encodeURIComponent('小程序演示用户') } })
  if (response.statusCode < 200 || response.statusCode >= 300 || response.data?.code !== 200) throw new Error(response.data?.detail || response.data?.message || '交易服务请求失败')
  return response.data.data
}
export const tradeApi = {
  cart: () => request('/cart/items'),
  addCart: (item) => request('/cart/items', 'POST', { source_product_id: item.productId, spec_labels: item.skuLabels, quantity: item.qty || 1 }),
  updateCart: (id, data) => request(`/cart/items/${id}`, 'PATCH', data),
  deleteCart: (id) => request(`/cart/items/${id}`, 'DELETE'),
  selectCart: (ids, selected) => request('/cart/selection', 'PUT', { item_ids: ids.map(Number), selected }),
  preview: (data) => request('/checkout/preview', 'POST', data),
  createOrders: (data) => request('/orders', 'POST', data),
  orders: () => request('/orders'),
  pay: (data) => request('/payments/mock', 'POST', data),
  cancel: (id) => request(`/orders/${id}/cancel`, 'POST'),
  confirm: (id) => request(`/orders/${id}/confirm`, 'POST'),
  afterSale: (id, data) => request(`/orders/${id}/after-sales`, 'POST', data),
}
export const requestId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
