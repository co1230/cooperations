import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { products } from '../mock/data'
import { load, save, uid } from '../utils/store'

const CartContext = createContext(null)

// 购物车项结构： { key, productId, skuLabels:[...], price, qty, checked, maxStock }
const CART_KEY = 'cart'

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => load(CART_KEY, []))
  const [orders, setOrders] = useState(() => load('orders', []))

  useEffect(() => save(CART_KEY, cart), [cart])
  useEffect(() => save('orders', orders), [orders])

  // 加入购物车：同商品同规格合并数量
  const addToCart = ({ productId, skuLabels, price, qty = 1, maxStock }) => {
    const key = `${productId}:${skuLabels.join('|')}`
    setCart((prev) => {
      const exist = prev.find((i) => i.key === key)
      if (exist) {
        const newQty = Math.min(exist.qty + qty, maxStock || 99)
        return prev.map((i) => (i.key === key ? { ...i, qty: newQty } : i))
      }
      return [...prev, { key, productId, skuLabels, price, qty, checked: true, maxStock }]
    })
    return key
  }

  const updateQty = (key, qty) => {
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock || 99)) } : i))
    )
  }

  const removeItem = (key) => setCart((prev) => prev.filter((i) => i.key !== key))

  const toggleCheck = (key) =>
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, checked: !i.checked } : i)))

  const toggleCheckAll = (all) =>
    setCart((prev) => prev.map((i) => ({ ...i, checked: all })))

  const clearChecked = () => setCart((prev) => prev.filter((i) => !i.checked))

  // 生成订单（通常在结算/支付成功后调用）
  const createOrder = (payload) => {
    const order = {
      id: uid(),
      no: 'YG' + Date.now().toString().slice(-10),
      items: payload.items,
      totalPrice: payload.totalPrice,
      discountPrice: payload.discountPrice,
      payPrice: payload.payPrice,
      address: payload.address,
      payMethod: payload.payMethod,
      status: '待支付', // 待支付 / 待发货 / 待收货 / 已完成 / 已取消 / 退款中 / 已退款
      createdAt: new Date().toLocaleString('zh-CN'),
      refundReason: '',
    }
    setOrders((prev) => [order, ...prev])
    return order
  }

  const updateOrder = (id, patch) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  const value = useMemo(
    () => ({
      cart,
      orders,
      addToCart,
      updateQty,
      removeItem,
      toggleCheck,
      toggleCheckAll,
      clearChecked,
      createOrder,
      updateOrder,
    }),
    [cart, orders]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}

// 辅助：由购物车项解析商品详情
export function resolveProduct(productId) {
  return products.find((p) => p.id === Number(productId))
}
