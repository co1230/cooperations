import { useEffect, useState } from 'react'
import { products } from '../mock/data'
import { load, save, uid } from '../utils/store'
import { tradeApi } from '../api/trade'

const CART_KEY = 'cart'
let state = {
  cart: load(CART_KEY, []),
  orders: load('orders', [])
}
const listeners = new Set()
const statusNames = { PENDING_PAYMENT: '待支付', PAID: '待发货', SHIPPED: '待收货', COMPLETED: '已完成', CANCELLED: '已取消', CLOSED: '已关闭' }
const displayOrder = (o) => ({ ...o, statusCode: o.status, status: o.afterSaleStatus === 'REFUNDED' ? '已退款' : ['APPLIED', 'PROCESSING', 'APPROVED', 'REFUNDING'].includes(o.afterSaleStatus) ? '退款中' : statusNames[o.status] || o.status, items: (o.items || []).map((i) => ({ ...i, key: String(i.id) })) })

export async function refreshTradeData() {
  const [cart, orders] = await Promise.all([tradeApi.cart(), tradeApi.orders()])
  setState({ cart, orders: orders.map(displayOrder) })
}

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l(state))
}

function commitCart(fn) {
  const next = fn(state.cart)
  setState({ cart: next })
  save(CART_KEY, next)
}

function commitOrders(fn) {
  const next = fn(state.orders)
  setState({ orders: next })
  save('orders', next)
}

export async function addToCart({ productId, skuLabels, qty = 1 }) {
  await tradeApi.addCart({ productId, skuLabels, qty }); await refreshTradeData()
}

export async function updateQty(key, qty) {
  const cart = await tradeApi.updateCart(key, { quantity: Math.max(1, qty) }); setState({ cart })
}

export async function removeItem(key) {
  await tradeApi.deleteCart(key); await refreshTradeData()
}

export async function toggleCheck(key) {
  const item = state.cart.find((i) => i.key === String(key)); const cart = await tradeApi.updateCart(key, { selected: !item.checked }); setState({ cart })
}

export async function toggleCheckAll(all) {
  const cart = await tradeApi.selectCart(state.cart.map((i) => i.id), all); setState({ cart })
}

export function clearChecked() {
  commitCart((prev) => prev.filter((i) => !i.checked))
}

export function removeItemsByKeys(keys) {
  const set = new Set(keys || [])
  commitCart((prev) => prev.filter((i) => !set.has(i.key)))
}

export function createOrder(payload) {
  const order = {
    id: uid(),
    no: 'YG' + Date.now().toString().slice(-10),
    items: payload.items,
    totalPrice: payload.totalPrice,
    discountPrice: payload.discountPrice,
    payPrice: payload.payPrice,
    address: payload.address,
    payMethod: payload.payMethod,
    status: '待支付',
    createdAt: fmtTime(new Date()),
    refundReason: ''
  }
  commitOrders((prev) => [order, ...prev])
  return order
}

export async function updateOrder(id, patch) {
  if (patch.status === '已取消') await tradeApi.cancel(id)
  else if (patch.status === '已完成') await tradeApi.confirm(id)
  else if (patch.status === '退款中') await tradeApi.afterSale(id, { ticket_type: 'REFUND_ONLY', reason: patch.refundReason || '用户申请售后' })
  await refreshTradeData()
}

function fmtTime(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function getState() {
  return state
}

// React hook：订阅全局状态
export function useGlobalStore() {
  const [, setTick] = useState(0)
  useEffect(() => {
    refreshTradeData().catch(() => {})
    const listener = () => setTick((t) => t + 1)
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])
  return state
}

// 辅助：由购物车项/订单项解析商品详情
export function resolveProduct(productId) {
  return products.find((p) => p.id === Number(productId))
}

// 按店铺分组一组 item（商品项数组）
export function groupByShop(items) {
  const map = {}
  ;(items || []).forEach((it) => {
    const prod = resolveProduct(it.productId)
    const shopId = prod ? prod.shopId : null
    if (!map[shopId]) map[shopId] = []
    map[shopId].push(it)
  })
  return Object.keys(map).map((shopId) => ({ shopId, items: map[shopId] }))
}
