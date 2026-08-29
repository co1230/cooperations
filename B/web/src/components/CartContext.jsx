import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { products } from '../mock/data'
import { tradeApi } from '../api/trade'

const CartContext = createContext(null)
const statusNames = { PENDING_PAYMENT: '待支付', PAID: '待发货', SHIPPED: '待收货', COMPLETED: '已完成', CANCELLED: '已取消', CLOSED: '已关闭' }

function displayOrder(order) {
  const afterSale = order.afterSaleStatus
  const status = afterSale === 'REFUNDED' ? '已退款' : ['APPLIED', 'PROCESSING', 'APPROVED', 'REFUNDING'].includes(afterSale) ? '退款中' : statusNames[order.status] || order.status
  return { ...order, statusCode: order.status, afterSaleStatus: afterSale, status, items: (order.items || []).map((item) => ({ ...item, key: String(item.id) })) }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshCart = async () => setCart(await tradeApi.cart())
  const refreshOrders = async () => setOrders((await tradeApi.orders()).map(displayOrder))
  useEffect(() => { Promise.all([refreshCart(), refreshOrders()]).catch((e) => setError(e.message)).finally(() => setLoading(false)) }, [])

  const run = async (action) => { try { setError(''); return await action() } catch (e) { setError(e.message); throw e } }
  const addToCart = (item) => run(async () => { await tradeApi.addCart(item); await refreshCart() })
  const updateQty = (key, qty) => run(async () => { setCart(await tradeApi.updateCart(key, { qty: Math.max(1, qty) })) })
  const removeItem = (key) => run(async () => { await tradeApi.deleteCart(key); await refreshCart() })
  const toggleCheck = (key) => run(async () => { const item = cart.find((entry) => entry.key === String(key)); setCart(await tradeApi.updateCart(key, { checked: !item.checked })) })
  const toggleCheckAll = (selected) => run(async () => setCart(await tradeApi.selectCart(cart.map((item) => item.id), selected)))
  const clearChecked = () => run(async () => { await Promise.all(cart.filter((item) => item.checked).map((item) => tradeApi.deleteCart(item.id))); await refreshCart() })
  const updateOrder = (id, patch) => run(async () => {
    if (patch.status === '已取消') await tradeApi.cancel(id)
    else if (patch.status === '已完成') await tradeApi.confirm(id)
    else if (patch.status === '退款中') await tradeApi.afterSale(id, { ticket_type: 'REFUND_ONLY', reason: patch.refundReason || '用户申请售后' })
    await refreshOrders()
  })

  const value = useMemo(() => ({ cart, orders, loading, error, setError, refreshCart, refreshOrders, addToCart, updateQty, removeItem, toggleCheck, toggleCheckAll, clearChecked, updateOrder }), [cart, orders, loading, error])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() { return useContext(CartContext) }
export function resolveProduct(productId) { return products.find((p) => p.id === Number(productId)) }
