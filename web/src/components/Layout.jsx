import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const [kw, setKw] = useState('')

  const onSearch = (e) => {
    e.preventDefault()
    navigate(`/search?keyword=${encodeURIComponent(kw)}`)
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">优购商城</NavLink>
          <form className="header-search" onSubmit={onSearch}>
            <input
              placeholder="搜索商品，如：手机、连衣裙、坚果…"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
            />
            <button type="submit">搜索</button>
          </form>
          <nav className="header-nav">
            <NavLink to="/" end>首页</NavLink>
            <NavLink to="/category">分类</NavLink>
            <NavLink to="/favorites">收藏</NavLink>
            <NavLink to="/profile">个人中心</NavLink>
          </nav>
        </div>
      </header>

      <div className="container">
        <Outlet />
      </div>

      <footer className="footer">
        <div>优购商城 · 团队协作项目 · 用户端负责人（成员 B）</div>
        <div>购物车 / 下单支付等相关交易功能由交易流程负责人（成员 C）负责</div>
      </footer>
    </>
  )
}
