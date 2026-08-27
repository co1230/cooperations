import { useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart, resolveProduct } from '../components/CartContext'
import { getShopById } from '../mock/data'
import { load } from '../utils/store'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, createOrder, clearChecked } = useCart()
  const [chosenAddress, setChosenAddress] = useState(null)

  // 结算的商品：优先「立即购买」单件，否则购物车勾选项
  const buyNow = location.state?.fromBuyNow || null

  const items = useMemo(() => {
    if (buyNow) {
      const item = cart.find((i) => i.key === buyNow.key)
      return item ? [item] : []
    }
    return cart.filter((i) => i.checked)
  }, [cart, buyNow])

  const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0)
  const totalQty = items.reduce((s, i) => s + i.qty, 0)
  // 满 199 减 20（模拟优惠）
  const discount = totalPrice >= 199 ? 20 : 0
  const payPrice = totalPrice - discount

  // 按店铺分组展示
  const checkoutGroups = useMemo(() => {
    const map = {}
    items.forEach((item) => {
      const shopId = resolveProduct(item.productId).shopId
      if (!map[shopId]) map[shopId] = []
      map[shopId].push(item)
    })
    return Object.entries(map).map(([shopId, its]) => ({ shop: getShopById(shopId), items: its }))
  }, [items])

  const addresses = load('address', [])
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]

  if (!items.length) {
    return <div className="empty"><p>没有可结算的商品，请返回购物车选择</p></div>
  }

  const placeOrder = () => {
    const addr = chosenAddress || defaultAddr
    if (!addr) {
      alert('请先新增收货地址')
      navigate('/address')
      return
    }
    if (buyNow) {
      clearChecked()
    } else {
      clearChecked()
    }
    const order = createOrder({
      items: items.map((i) => ({ key: i.key, productId: i.productId, skuLabels: i.skuLabels, price: i.price, qty: i.qty, maxStock: i.maxStock })),
      totalPrice,
      discountPrice: discount,
      payPrice,
      address: addr,
    })
    navigate('/pay', { state: { orderId: order.id } })
  }

  return (
    <div className="page">
      <h2 className="section-title">确认订单</h2>

      {/* 收货地址 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>收货地址</span>
          <Link to="/address" style={{ color: 'var(--primary)', fontSize: 14 }}>管理地址</Link>
        </div>
        {addresses.length === 0 ? (
          <div style={{ color: '#999', fontSize: 14, padding: '12px 0' }}>
            暂无地址，<Link to="/address" style={{ color: 'var(--primary)' }}>新增收货地址</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {addresses.map((a) => (
              <div
                key={a.id}
                onClick={() => setChosenAddress(a)}
                style={{
                  border: `2px solid ${(chosenAddress || defaultAddr)?.id === a.id ? 'var(--primary)' : '#eee'}`,
                  borderRadius: 8, padding: 12, cursor: 'pointer', minWidth: 240, background: '#fff',
                }}
              >
                <div style={{ fontWeight: 600 }}>{a.name} <span style={{ color: '#666', fontWeight: 400 }}>{a.phone}</span></div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{a.region} {a.detail}</div>
                {a.isDefault && <span className="tag" style={{ marginTop: 6 }}>默认</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 商品清单（按店铺分组） */}
      {checkoutGroups.map(({ shop, items: shopItems }) => (
        <div className="card" key={shop.id} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 20 }}>{shop.logo}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{shop.name}</span>
          </div>
          {shopItems.map((item) => {
            const prod = resolveProduct(item.productId)
            return (
              <div key={item.key} style={{ display: 'flex', gap: 14, padding: 16, borderBottom: '1px solid var(--border)' }}>
                <img src={prod.image} alt={prod.name} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{prod.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {item.skuLabels.join(' / ')} × {item.qty}
                  </div>
                </div>
                <span className="price" style={{ fontSize: 16 }}>{item.price * item.qty}</span>
              </div>
            )
          })}
        </div>
      ))}

      {/* 金额明细 */}
      <div className="card" style={{ marginBottom: 16 }}>
        {[
          ['商品件数', `${totalQty} 件`],
          ['商品金额', `¥${totalPrice}`],
          ['优惠减免', `-¥${discount}`],
          ['应付金额', `¥${payPrice}`],
        ].map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: i === 3 ? 700 : 400, fontSize: i === 3 ? 18 : 14 }}>
            <span style={{ color: i === 3 ? '#333' : '#666' }}>{k}</span>
            <span style={{ color: i === 3 ? 'var(--primary)' : '#333' }}>{v}</span>
          </div>
        ))}
      </div>

      <button className="btn block" onClick={placeOrder} style={{ padding: '14px' }}>
        提交订单，去支付 ¥{payPrice}
      </button>
    </div>
  )
}
