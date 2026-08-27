import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useCart } from '../components/CartContext'

const payMethods = [
  { key: 'wechat', name: '微信支付', icon: '💚' },
  { key: 'alipay', name: '支付宝', icon: '🔵' },
  { key: 'balance', name: '余额支付', icon: '💰' },
]

export default function Pay() {
  const location = useLocation()
  const navigate = useNavigate()
  const { orders, updateOrder } = useCart()
  const orderId = location.state?.orderId

  const [method, setMethod] = useState('wechat')
  const [paying, setPaying] = useState(false)

  const order = orders.find((o) => o.id === orderId)

  useEffect(() => {
    if (!order) navigate('/orders', { replace: true })
  }, [order, navigate])

  if (!order) return null

  const doPay = () => {
    setPaying(true)
    // 模拟支付：短暂延时后成功，不真正扣款
    setTimeout(() => {
      updateOrder(order.id, { status: '待发货', payMethod: method })
      setPaying(false)
      navigate('/orders', { replace: true })
    }, 1200)
  }

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>订单确认 / 支付</div>
          <div style={{ color: '#999', fontSize: 13, marginTop: 6 }}>
            订单号 {order.no} · {order.createdAt}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0 24px', borderBottom: '1px dashed #eee' }}>
          <div style={{ color: '#999', fontSize: 13, marginBottom: 6 }}>需支付金额</div>
          <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--primary)' }}>¥{order.payPrice}</span>
          <div style={{ fontSize: 12, color: '#bbb', marginTop: 8 }}>
            （模拟支付 · 不会真实扣款）
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>选择支付方式</div>
          {payMethods.map((m) => (
            <div
              key={m.key}
              onClick={() => setMethod(m.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                border: `2px solid ${method === m.key ? 'var(--primary)' : '#eee'}`,
                borderRadius: 8, marginBottom: 10, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{ fontSize: 15 }}>{m.name}</span>
              <span style={{ marginLeft: 'auto', color: method === m.key ? 'var(--primary)' : '#ccc', fontSize: 18 }}>
                {method === m.key ? '●' : '○'}
              </span>
            </div>
          ))}
        </div>

        <button className="btn block" style={{ padding: 14, marginTop: 20 }} disabled={paying} onClick={doPay}>
          {paying ? '支付处理中…' : `确认支付 ¥${order.payPrice}`}
        </button>

        <div style={{ marginTop: 14 }}>
          <Link to="/orders" style={{ color: '#666', fontSize: 14 }}>← 返回我的订单</Link>
        </div>
      </div>
    </div>
  )
}
