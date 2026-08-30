import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from './CartContext'
import { getUnreadTotal } from '../utils/chat'

function Badge({ count, max = 99 }) {
  if (!count) return null
  return (
    <span style={{
      background: 'var(--danger)', color: '#fff', borderRadius: 12,
      fontSize: 11, minWidth: 16, height: 16, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', padding: '0 4px',
    }}>
      {count > max ? `${max}+` : count}
    </span>
  )
}

export default function Layout() {
  const navigate = useNavigate()
  const [kw, setKw] = useState('')
  const { cart } = useCart()
  const [msgCount, setMsgCount] = useState(getUnreadTotal())

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  // 消息未读数：轮询 + storage 事件及时刷新
  useEffect(() => {
    const tick = () => setMsgCount(getUnreadTotal())
    const timer = setInterval(tick, 2000)
    window.addEventListener('storage', tick)
    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', tick)
    }
  }, [])

  const onSearch = (e) => {
    e.preventDefault()
    navigate(`/search?keyword=${encodeURIComponent(kw)}`)
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">萝卜商城</NavLink>
          <form className="header-search" onSubmit={onSearch}>
            <input
              placeholder="搜索商品，如：手机、连衣裙、坚果…"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
            />
            <button type="submit">搜索</button>
          </form>
          <nav className="header-nav" style={{ alignItems: 'center' }}>
            <NavLink to="/" end>首页</NavLink>
            <NavLink to="/category">分类</NavLink>
            <NavLink to="/favorites">收藏</NavLink>
            <NavLink to="/cart" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              购物车
              <Badge count={cartCount} />
            </NavLink>
            <NavLink to="/orders">我的订单</NavLink>
            <NavLink to="/messages" style={{ display: 'flex', alignItems: 'center', gap: 4, color: msgCount > 0 ? 'var(--danger)' : undefined, fontWeight: msgCount > 0 ? 700 : undefined }}>
              个人消息
              <Badge count={msgCount} />
            </NavLink>
            <NavLink to="/profile">个人中心</NavLink>
          </nav>
        </div>
      </header>

      <div className="container">
        <Outlet />
      </div>

      <footer className="footer">
        <div>萝卜商城 · 团队协作项目 · 用户端负责人（成员 B）</div>
        <div>购物车 / 下单支付 / 订单售后服务由交易流程负责人（成员 C）负责，此处为模拟实现用于整体演示</div>
      </footer>
    </>
  )
}
