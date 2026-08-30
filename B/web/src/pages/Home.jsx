import { Link } from 'react-router-dom'
import { products, categories } from '../mock/data'
import { channels } from '../mock/channels'
import ProductGrid from '../components/ProductGrid'
import PagedGrid from '../components/PagedGrid'

export default function Home() {
  const featured = products.filter((p) => p.featured)

  const channelUrl = (ch) => {
    const qs = new URLSearchParams(ch.params || {}).toString()
    return `/search?${qs}`
  }

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>欢迎来到萝卜商城 👋</div>
        <div style={{ color: '#666' }}>浏览全场商品、发现好物，挑选心仪的商品加入收藏。</div>
      </div>

      <h2 className="section-title">主题频道</h2>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, marginBottom: 28, scrollSnapType: 'x mandatory' }}>
        {channels.map((ch) => (
          <Link
            key={ch.id}
            to={channelUrl(ch)}
            style={{
              flex: '0 0 auto',
              width: 168,
              padding: '18px 16px',
              borderRadius: 12,
              background: ch.gradient,
              color: '#fff',
              scrollSnapAlign: 'start',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              transition: 'transform .2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: 30, marginBottom: 10 }}>{ch.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{ch.title}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{ch.sub}</div>
          </Link>
        ))}
      </div>

      <h2 className="section-title">热门分类</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 12, marginBottom: 32 }}>
        {categories.map((c) => (
          <Link key={c.id} to={`/category?id=${c.id}`} className="card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 30 }}>{c.icon}</div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{c.children.slice(0, 3).join(' · ')}</div>
          </Link>
        ))}
      </div>

      <h2 className="section-title">精选推荐</h2>
      <ProductGrid products={featured} />

      <h2 className="section-title">全部商品（共 {products.length.toLocaleString()} 件）</h2>
      <PagedGrid products={products} />
    </div>
  )
}
