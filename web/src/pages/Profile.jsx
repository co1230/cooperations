import { Link } from 'react-router-dom'
import { currentUser } from '../mock/data'
import { load } from '../utils/store'
import { useCart } from '../components/CartContext'

export default function Profile() {
  const favCount = load('favorites', []).length
  const addrCount = load('address', []).length
  const { cart, orders } = useCart()
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

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
