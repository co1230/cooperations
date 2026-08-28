import { useEffect, useState } from 'react'
import { products } from '../mock/data'
import { load, save, uid } from '../utils/store'

const CART_KEY = 'cart'
let state = {
  cart: load(CART_KEY, []),
  orders: load('orders', [])
}
const listeners = new Set()

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

export function addToCart({ productId, skuLabels, price, qty = 1, maxStock }) {
  const key = `${productId}:${skuLabels.join('|')}`
  let retKey = key
  commitCart((prev) => {
    const exist = prev.find((i) => i.key === key)
    if (exist) {
      const newQty = Math.min(exist.qty + qty, maxStock || 99)
      return prev.map((i) => (i.key === key ? { ...i, qty: newQty } : i))
    }
    return [...prev, { key, productId, skuLabels, price, qty, checked: true, maxStock }]
  })
  return retKey
}

export function updateQty(key, qty) {
  commitCart((prev) =>
    prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock || 99)) } : i))
  )
}

export function removeItem(key) {
  commitCart((prev) => prev.filter((i) => i.key !== key))
}

export function toggleCheck(key) {
  commitCart((prev) => prev.map((i) => (i.key === key ? { ...i, checked: !i.checked } : i)))
}

export function toggleCheckAll(all) {
  commitCart((prev) => prev.map((i) => ({ ...i, checked: all })))
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

export function updateOrder(id, patch) {
  commitOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
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
