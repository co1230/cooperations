import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { requestId, tradeApi } from '../api/trade'
import { useCart } from '../components/CartContext'

const methods = [
  { key: 'WECHAT', name: '微信支付', icon: '💚' },
  { key: 'ALIPAY', name: '支付宝', icon: '🔵' },
  { key: 'MOCK', name: '模拟支付', icon: '🧪' },
]

export default function Pay() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { orders, refreshOrders, refreshCart } = useCart()
  const checkoutNo = state?.checkoutNo || orders.find((item) => String(item.id) === String(state?.orderId))?.checkoutNo
  const group = orders.filter((item) => item.checkoutNo === checkoutNo)
  const amount = state?.payAmount ?? group.reduce((sum, item) => sum + item.payPrice, 0)
  const [method, setMethod] = useState('MOCK')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(() => {
    const expires = group[0]?.expiresAt ? new Date(group[0].expiresAt).getTime() : Date.now() + 30 * 60 * 1000
    return Math.max(0, Math.floor((expires - Date.now()) / 1000))
  })
  useEffect(() => { const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer) }, [])

  if (!checkoutNo) return <div className="empty"><p>支付信息已失效</p><Link to="/orders" className="btn">返回订单</Link></div>
  const pay = async () => {
    setPaying(true); setError('')
    try {
      await tradeApi.pay({ checkout_no: checkoutNo, request_id: requestId('pay'), payment_method: method })
      await Promise.all([refreshOrders(), refreshCart()])
      navigate('/orders', { replace: true })
    } catch (e) { setError(e.message) } finally { setPaying(false) }
  }
  const timeText = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  return <div className="page"><div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
    <div style={{ textAlign: 'center' }}><h2>订单支付</h2><div style={{ color: '#999' }}>合并支付号 {checkoutNo}</div></div>
    <div style={{ textAlign: 'center', padding: '24px 0', borderBottom: '1px dashed #eee' }}><div>需支付金额</div><span className="price" style={{ fontSize: 40 }}>¥{amount}</span><div style={{ marginTop: 8, color: seconds < 300 ? 'var(--danger)' : '#999' }}>支付剩余 {timeText}</div></div>
    {error && <div style={{ color: 'var(--danger)', padding: 12 }}>{error}，可保持同一订单重试</div>}
    <div style={{ marginTop: 20 }}>{methods.map((item) => <div key={item.key} onClick={() => setMethod(item.key)} style={{ padding: 14, border: `2px solid ${method === item.key ? 'var(--primary)' : '#eee'}`, borderRadius: 8, marginBottom: 10, cursor: 'pointer' }}>{item.icon} {item.name}<span style={{ float: 'right' }}>{method === item.key ? '●' : '○'}</span></div>)}</div>
    <button className="btn block" disabled={paying || seconds === 0} onClick={pay} style={{ padding: 14 }}>{paying ? '支付处理中…' : seconds ? `确认支付 ¥${amount}` : '订单已超时'}</button>
    <Link to="/orders" style={{ display: 'block', marginTop: 14 }}>← 返回我的订单</Link>
  </div></div>
}
