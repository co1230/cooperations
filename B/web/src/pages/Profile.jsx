import { useState } from 'react'
import { Link } from 'react-router-dom'
import { currentUser } from '../mock/data'
import { load } from '../utils/store'
import { useCart } from '../components/CartContext'
import { getUnreadTotal } from '../utils/chat'

export default function Profile() {
  const favCount = load('favorites', []).length
  const addrCount = load('address', []).length
  const { cart, orders } = useCart()
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const [msgCount] = useState(getUnreadTotal())

  return (
    <div className="page">
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 28 }}>
        <img src={currentUser.avatar} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{currentUser.nickname}</div>
          <div style={{ color: '#666', fontSize: 14, marginTop: 6 }}>
            {currentUser.phone} · 普通用户（登录 / 权限校验由成员 A 的 RBAC 负责）
          </div>
        </div>
      </div>

      {/* 醒目：个人消息入口 */}
      <Link
        to="/messages"
        style={{
          display: 'flex', alignItems: 'center', gap: 14, marginTop: 20, padding: '18px 22px',
          background: 'linear-gradient(135deg,#ff5000,#ff7a32)', color: '#fff', borderRadius: 12,
          boxShadow: '0 4px 14px rgba(255,80,0,0.25)', textDecoration: 'none',
        }}
      >
        <div style={{ fontSize: 32 }}>💬</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>个人消息</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>查看客服聊天记录，及时跟进未读消息</div>
        </div>
        {msgCount > 0 && (
          <span style={{ background: '#fff', color: 'var(--primary)', borderRadius: 16, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
            {msgCount} 条未读
          </span>
        )}
        <span style={{ fontSize: 18 }}>›</span>
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16, marginTop: 20 }}>
        <Link to="/address" className="card" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>收货地址</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>已保存 {addrCount} 个地址</div>
        </Link>

        <Link to="/favorites" className="card" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>❤️</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>我的收藏</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>已收藏 {favCount} 件商品</div>
        </Link>

        <Link to="/cart" className="card" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🛒</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>购物车</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>共 {cartCount} 件商品</div>
        </Link>

        <Link to="/orders" className="card" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>我的订单</div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>共 {orders.length} 笔订单 · 查看 / 取消 / 退款</div>
        </Link>
      </div>
    </div>
  )
}
